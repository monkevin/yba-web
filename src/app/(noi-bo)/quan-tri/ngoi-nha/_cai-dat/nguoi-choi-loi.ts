/**
 * Tab quản trị "Người chơi" — phần lõi CHỈ MÁY CHỦ (không phải file "use
 * server"): đọc danh sách / chi tiết người chơi và các thao tác ghi. Tách khỏi
 * `actions-nguoi-choi.ts` để script test gọi thẳng được (server action cần
 * phiên đăng nhập). Kiểm quyền, nhật ký, làm mới trang: ở file action.
 */
import { prisma } from "@/lib/prisma";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { docMuc } from "@/lib/ngoi-nha/cai-dat";
import { donLuotCu } from "@/lib/ngoi-nha/dong-co";
import {
  HUY_HIEU_THEO_MA,
  MA_VON,
  vonRong,
  type Von,
} from "@/lib/ngoi-nha/luat";
import type { MuaHienTai } from "@/lib/ngoi-nha/mua";
import { TRAM_THEO_MA } from "@/lib/ngoi-nha/noi-dung";
import { GIAO_DICH, tongSoCai, xetCanBang } from "@/lib/ngoi-nha/so-cai";
import { bangXepHang } from "@/lib/ngoi-nha/tong-hop";
import {
  docGhiChu,
  GIO_LUOT_CU,
  kiemTraDieuChinh,
  loiTongAm,
  moTaThayDoi,
  nhanNguon,
  tenLoaiSoCai,
  TEN_CHE_DO_LUOT,
  timUngVien,
  type UngVien,
} from "./nguoi-choi-thuan";

const LUOT_CU_MS = GIO_LUOT_CU * 3600 * 1000;
const SO_GAN_DAY = 20;
const SO_KET_QUA_TIM = 30;
const SO_DONG_SO_CAI = 50;

export type TomTatNguoiChoi = {
  diem: number;
  von: Von;
  soTramQua: number;
  huyHieu: { ma: string; ten: string }[];
  hoatDongCuoi: Date | null;
  anXepHang: boolean;
  daXemHuongDan: boolean;
  /** Đã có dòng NnNguoiChoi (từng mở game) */
  daVaoGame: boolean;
  soLuotDangDo: number;
};

export type DongNguoiChoi = UngVien & {
  congTyDep: string | null;
  vaiTro: string;
  khoa: boolean;
  tomTat: TomTatNguoiChoi;
};

const tomTatRong = (): TomTatNguoiChoi => ({
  diem: 0,
  von: vonRong(),
  soTramQua: 0,
  huyHieu: [],
  hoatDongCuoi: null,
  anXepHang: false,
  daXemHuongDan: false,
  daVaoGame: false,
  soLuotDangDo: 0,
});

const muonHon = (a: Date | null, b: Date | null | undefined) =>
  !b ? a : !a || b > a ? b : a;

/** Mọi tài khoản (vài trăm dòng, vài cột) để tìm trong bộ nhớ. */
async function docTaiKhoan(where?: { id: { in: string[] } }) {
  const ds = await prisma.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      active: true,
      member: {
        select: { name: true, company: true, code: true, phone: true },
      },
    },
  });
  return ds.map((u) => ({
    id: u.id,
    username: u.username,
    ten: u.member?.name ?? u.name,
    congTy: u.member?.company ?? null,
    ma: u.member?.code ?? null,
    dienThoai: u.member?.phone ?? null,
    vaiTro: u.role,
    khoa: !u.active,
  }));
}

/** Số liệu game trong mùa của một nhóm người (mỗi loại số liệu một truy vấn). */
export async function tomTatTheoNguoi(
  userIds: string[],
  muaId: string,
): Promise<Map<string, TomTatNguoiChoi>> {
  const kq = new Map<string, TomTatNguoiChoi>(
    userIds.map((id) => [id, tomTatRong()]),
  );
  if (!userIds.length) return kq;
  const trong = { in: userIds };
  const [soCai, tram, huyHieu, nguoiChoi, luotMua, dangDo] = await Promise.all([
    prisma.nnSoCai.groupBy({
      by: ["userId"],
      where: { muaId, userId: trong },
      _sum: { diem: true, vonCN: true, vonTT: true, vonXH: true, vonTS: true },
      _max: { createdAt: true },
    }),
    prisma.nnTienDo.groupBy({
      by: ["userId"],
      where: { muaId, userId: trong, daQua: true },
      _count: { _all: true },
    }),
    prisma.nnHuyHieu.findMany({
      where: { muaId, userId: trong },
      select: { userId: true, ma: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.nnNguoiChoi.findMany({
      where: { userId: trong },
      select: {
        userId: true,
        anXepHang: true,
        daXemHuongDan: true,
        tranThang: true,
        tranThua: true,
        tranHoa: true,
      },
    }),
    prisma.nnLuot.groupBy({
      by: ["userId"],
      where: { muaId, userId: trong },
      _max: { createdAt: true, xongLuc: true },
    }),
    prisma.nnLuot.groupBy({
      by: ["userId"],
      where: { userId: trong, trangThai: "DANG_CHOI" },
      _count: { _all: true },
    }),
  ]);
  for (const s of soCai) {
    const t = kq.get(s.userId)!;
    t.diem = s._sum.diem ?? 0;
    t.von = {
      CN: s._sum.vonCN ?? 0,
      TT: s._sum.vonTT ?? 0,
      XH: s._sum.vonXH ?? 0,
      TS: s._sum.vonTS ?? 0,
    };
    t.hoatDongCuoi = muonHon(t.hoatDongCuoi, s._max.createdAt);
  }
  for (const x of tram) kq.get(x.userId)!.soTramQua = x._count._all;
  for (const h of huyHieu)
    kq.get(h.userId)!.huyHieu.push({
      ma: h.ma,
      ten: HUY_HIEU_THEO_MA[h.ma]?.ten ?? h.ma,
    });
  for (const n of nguoiChoi) {
    const t = kq.get(n.userId)!;
    t.anXepHang = n.anXepHang;
    t.daXemHuongDan = n.daXemHuongDan;
    // Dòng người chơi còn được tạo khi Ban bấm ẩn khỏi BXH cho người chưa từng
    // mở game — dòng chỉ có cờ ẩn thì chưa tính là đã vào game
    t.daVaoGame =
      n.daXemHuongDan ||
      !n.anXepHang ||
      n.tranThang + n.tranThua + n.tranHoa > 0;
  }
  for (const l of luotMua) {
    const t = kq.get(l.userId)!;
    t.hoatDongCuoi = muonHon(
      muonHon(t.hoatDongCuoi, l._max.createdAt),
      l._max.xongLuc,
    );
    t.daVaoGame = true;
  }
  for (const l of dangDo) {
    const t = kq.get(l.userId)!;
    t.soLuotDangDo = l._count._all;
    t.daVaoGame = true;
  }
  return kq;
}

/** Người có sổ cái hoặc lượt chơi gần nhất trong mùa. */
async function idGanDay(muaId: string, soNguoi: number): Promise<string[]> {
  const [soCai, luot] = await Promise.all([
    prisma.nnSoCai.groupBy({
      by: ["userId"],
      where: { muaId },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: "desc" } },
      take: soNguoi,
    }),
    prisma.nnLuot.groupBy({
      by: ["userId"],
      where: { muaId },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: "desc" } },
      take: soNguoi,
    }),
  ]);
  const luc = new Map<string, number>();
  for (const x of [...soCai, ...luot]) {
    const t = x._max.createdAt?.getTime() ?? 0;
    luc.set(x.userId, Math.max(luc.get(x.userId) ?? 0, t));
  }
  return [...luc]
    .sort((a, b) => b[1] - a[1])
    .slice(0, soNguoi)
    .map(([id]) => id);
}

/**
 * Danh sách cho tab: có từ khoá thì tìm (tối đa 30 người, gồm cả người chưa
 * chơi — để ẩn Ban soạn đề trước khi mở mùa), không có thì 20 người hoạt động
 * gần nhất trong mùa.
 */
export async function docDanhSachNguoiChoi(
  q: string,
  muaId: string,
): Promise<{ cheDo: "tim" | "ganDay"; ds: DongNguoiChoi[] }> {
  const tuKhoa = q.trim().slice(0, 100);
  let taiKhoan: Awaited<ReturnType<typeof docTaiKhoan>>;
  if (tuKhoa) {
    taiKhoan = timUngVien(await docTaiKhoan(), tuKhoa, SO_KET_QUA_TIM);
  } else {
    const ids = await idGanDay(muaId, SO_GAN_DAY);
    const theoId = new Map(
      (await docTaiKhoan({ id: { in: ids } })).map((u) => [u.id, u]),
    );
    // Tài khoản đã xoá thì bỏ qua (bảng game không có khoá ngoại)
    taiKhoan = ids.flatMap((id) => theoId.get(id) ?? []);
  }
  const tomTat = await tomTatTheoNguoi(
    taiKhoan.map((u) => u.id),
    muaId,
  );
  return {
    cheDo: tuKhoa ? "tim" : "ganDay",
    ds: taiKhoan.map((u) => ({
      ...u,
      congTyDep: u.congTy ? tenDoanhNghiep(u.congTy) : null,
      tomTat: tomTat.get(u.id) ?? tomTatRong(),
    })),
  };
}

export type DongSoCaiHienThi = {
  id: string;
  loai: string;
  tenLoai: string;
  nguon: string;
  diem: number;
  von: Von;
  ghiChu: string;
  luc: Date;
};

export type LuotDangDo = {
  id: string;
  ten: string;
  cheDo: string;
  /** Vị trí câu đang ở (tính từ 0); ≥ `tongCau` là đang ở câu thưởng cuối lượt */
  viTri: number;
  /** Số câu chính, không tính câu thưởng */
  tongCau: number;
  batDau: Date;
  quaCu: boolean;
  khacMua: boolean;
};

export type ChiTietNguoiChoi = {
  nguoi: DongNguoiChoi;
  hang: number | null;
  tongXepHang: number;
  soCai: DongSoCaiHienThi[];
  luotDangDo: LuotDangDo[];
};

/** Trang chi tiết một người: tóm tắt, hạng, 50 dòng sổ cái gần nhất, lượt dở. */
export async function docChiTietNguoiChoi(
  userId: string,
  muaId: string,
): Promise<ChiTietNguoiChoi | null> {
  const [tk] = await docTaiKhoan({ id: { in: [userId] } });
  if (!tk) return null;
  const [tomTat, soCai, luot, bxh] = await Promise.all([
    tomTatTheoNguoi([userId], muaId),
    prisma.nnSoCai.findMany({
      where: { userId, muaId },
      orderBy: { createdAt: "desc" },
      take: SO_DONG_SO_CAI,
    }),
    prisma.nnLuot.findMany({
      where: { userId, trangThai: "DANG_CHOI" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        muaId: true,
        tramMa: true,
        ngay: true,
        cheDo: true,
        viTri: true,
        deBai: true,
        createdAt: true,
      },
    }),
    bangXepHang(muaId, "mua", userId, 0),
  ]);

  // Tên phiên Đấu trí và đối thủ Đấu trường cho cột "Nguồn"
  const idDauTri = new Set<string>();
  const idTran = new Set<string>();
  for (const s of soCai) {
    if (s.nguon.startsWith("dau-tri:")) idDauTri.add(s.nguon.slice(8));
    if (s.nguon.startsWith("tran:")) idTran.add(s.nguon.slice(5));
  }
  for (const l of luot)
    if (l.tramMa.startsWith("DAU:")) idDauTri.add(l.tramMa.slice(4));
  const [dauTri, tran] = await Promise.all([
    idDauTri.size
      ? prisma.nnDauTri.findMany({
          where: { id: { in: [...idDauTri] } },
          select: { id: true, ten: true },
        })
      : Promise.resolve([]),
    idTran.size
      ? prisma.nnTranDau.findMany({
          where: { id: { in: [...idTran] } },
          select: { id: true, thachId: true, doiThuId: true },
        })
      : Promise.resolve([]),
  ]);
  const doiThu = new Map(
    tran.map((t) => [t.id, t.thachId === userId ? t.doiThuId : t.thachId]),
  );
  const tenDoiThu = new Map(
    doiThu.size
      ? (await docTaiKhoan({ id: { in: [...new Set(doiThu.values())] } })).map(
          (u) => [u.id, u.ten],
        )
      : [],
  );
  const tenPhien = new Map(dauTri.map((d) => [d.id, d.ten]));
  const tra = {
    tenTram: (ma: string) => TRAM_THEO_MA[ma]?.ten,
    tenHuyHieu: (ma: string) => HUY_HIEU_THEO_MA[ma]?.ten,
    tenDauTri: (id: string) => tenPhien.get(id),
    doiThuTran: (id: string) => {
      const u = doiThu.get(id);
      return u ? tenDoiThu.get(u) : undefined;
    },
  };

  const cu = Date.now() - LUOT_CU_MS;
  return {
    nguoi: {
      ...tk,
      congTyDep: tk.congTy ? tenDoanhNghiep(tk.congTy) : null,
      tomTat: tomTat.get(userId) ?? tomTatRong(),
    },
    hang: bxh.cuaToi?.hang ?? null,
    tongXepHang: bxh.tong,
    soCai: soCai.map((s) => ({
      id: s.id,
      loai: s.loai,
      tenLoai: tenLoaiSoCai(s.loai),
      nguon: nhanNguon(s.nguon, tra),
      diem: s.diem,
      von: { CN: s.vonCN, TT: s.vonTT, XH: s.vonXH, TS: s.vonTS },
      ghiChu: docGhiChu(s.loai, s.ghiChu),
      luc: s.createdAt,
    })),
    luotDangDo: luot.map((l) => {
      let tongCau = 0;
      try {
        const deBai: unknown = JSON.parse(l.deBai);
        if (Array.isArray(deBai))
          tongCau = deBai.filter(
            (m) => !(m && typeof m === "object" && "thuong" in m && m.thuong),
          ).length;
      } catch {
        tongCau = 0;
      }
      const ten =
        l.tramMa === "NGAY"
          ? `Thử thách ngày${l.ngay ? ` ${l.ngay.split("-").reverse().join("/")}` : ""}`
          : l.tramMa.startsWith("DAU:")
            ? `Đấu trí “${tenPhien.get(l.tramMa.slice(4)) ?? "sự kiện"}”`
            : nhanNguon(`tram:${l.tramMa}`, tra);
      return {
        id: l.id,
        ten,
        cheDo: TEN_CHE_DO_LUOT[l.cheDo] ?? l.cheDo,
        viTri: l.viTri,
        tongCau,
        batDau: l.createdAt,
        quaCu: l.createdAt.getTime() < cu,
        khacMua: l.muaId !== muaId,
      };
    }),
  };
}

// ─── thao tác ghi ──────────────────────────────────────────────────────

type Loi = { ok: false; error: string };
const KHONG_THAY: Loi = {
  ok: false,
  error: "Không tìm thấy tài khoản người chơi",
};

async function tenNguoi(
  userId: string,
): Promise<{ ten: string; memberId: string | null } | null> {
  if (typeof userId !== "string" || !userId || userId.length > 100) return null;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, memberId: true, member: { select: { name: true } } },
  });
  return u ? { ten: u.member?.name ?? u.name, memberId: u.memberId } : null;
}

export type KetQuaDieuChinh =
  | {
      ok: true;
      soCaiId: string;
      nguon: string;
      muaId: string;
      tenNguoi: string;
      moTa: string;
      lyDo: string;
      huyHieuMoi: string[];
    }
  | Loi;

/**
 * Ghi một dòng sổ cái `DIEU_CHINH` cho người chơi vào mùa hiện tại. `mua` đọc
 * TRƯỚC khi gọi (SQLite một kết nối) — action truyền `muaHienTai()`, test
 * truyền mùa giả. Vốn đổi thì xét huy hiệu Doanh nhân cân bằng trong cùng
 * giao dịch như mọi chỗ cộng vốn khác.
 */
export async function ghiDieuChinh(
  duLieu: unknown,
  nguoiLam: { id: string; ten: string },
  mua: MuaHienTai,
): Promise<KetQuaDieuChinh> {
  const kt = kiemTraDieuChinh(duLieu);
  if (!kt.ok) return { ok: false, error: kt.loi };
  const d = kt.data;
  if (!mua.tinhDiem)
    return {
      ok: false,
      error: `${mua.ten} đã quá ngày kết thúc nên không cộng trừ điểm được nữa`,
    };
  if (d.muaId && d.muaId !== mua.id)
    return {
      ok: false,
      error:
        "Mùa giải vừa thay đổi (có người mở hoặc đóng mùa) — tải lại trang, xem lại số liệu rồi mới điều chỉnh",
    };
  const u = await tenNguoi(d.userId);
  if (!u) return KHONG_THAY;
  // Luật (ngưỡng cân bằng, huy hiệu bật tắt) đọc TRƯỚC giao dịch — SQLite một kết nối
  const luat = await docMuc("luat");

  const nguon = `dc:${Date.now().toString(36)}`;
  const ghiChu = `${d.lyDo} · Người làm: ${nguoiLam.ten}`.slice(0, 500);
  const coVon = MA_VON.some((k) => d.von[k] !== 0);
  const coTru = d.diem < 0 || MA_VON.some((k) => d.von[k] < 0);
  const kq = await prisma.$transaction(async (tx) => {
    // Trừ thì kiểm tổng mùa ngay trong giao dịch (người chơi có thể vừa ghi
    // thêm điểm) — không cho xuống dưới 0
    if (coTru) {
      const loi = loiTongAm(await tongSoCai(tx, d.userId, mua.id), d);
      if (loi) return { loi };
    }
    const dong = await tx.nnSoCai.create({
      data: {
        userId: d.userId,
        muaId: mua.id,
        loai: "DIEU_CHINH",
        nguon,
        diem: d.diem,
        vonCN: d.von.CN,
        vonTT: d.von.TT,
        vonXH: d.von.XH,
        vonTS: d.von.TS,
        ghiChu,
      },
    });
    const moi = coVon ? await xetCanBang(tx, d.userId, mua.id, luat) : [];
    return { id: dong.id, huyHieuMoi: moi };
  }, GIAO_DICH);
  if ("loi" in kq)
    return { ok: false, error: kq.loi ?? "Không ghi được điều chỉnh" };
  return {
    ok: true,
    soCaiId: kq.id,
    nguon,
    muaId: mua.id,
    tenNguoi: u.ten,
    moTa: moTaThayDoi(d.diem, d.von),
    lyDo: d.lyDo,
    huyHieuMoi: kq.huyHieuMoi.map((h) => h.ten),
  };
}

/** Ẩn / hiện một người khỏi bảng xếp hạng (cờ chung mọi mùa). */
export async function ghiAnXepHang(
  userId: string,
  an: boolean,
): Promise<{ ok: true; tenNguoi: string; doi: boolean } | Loi> {
  if (typeof an !== "boolean")
    return { ok: false, error: "Dữ liệu không hợp lệ" };
  const u = await tenNguoi(userId);
  if (!u) return KHONG_THAY;
  const truoc = await prisma.nnNguoiChoi.findUnique({
    where: { userId },
    select: { anXepHang: true },
  });
  if ((truoc?.anXepHang ?? false) === an)
    return { ok: true, tenNguoi: u.ten, doi: false };
  await prisma.nnNguoiChoi.upsert({
    where: { userId },
    create: { userId, anXepHang: an },
    update: { anXepHang: an },
  });
  return { ok: true, tenNguoi: u.ten, doi: true };
}

/** Lần vào game tới người này thấy lại hướng dẫn người mới. */
export async function ghiXemLaiHuongDan(
  userId: string,
): Promise<{ ok: true; tenNguoi: string } | Loi> {
  const u = await tenNguoi(userId);
  if (!u) return KHONG_THAY;
  // Chưa có dòng người chơi = chưa từng xem, lần đầu vào game tự hiện hướng
  // dẫn. KHÔNG tạo dòng mới: tài khoản không gắn hội viên chỉ hiện trong ô tìm
  // đối thủ Đấu trường khi đã có dòng này
  await prisma.nnNguoiChoi.updateMany({
    where: { userId },
    data: { daXemHuongDan: false },
  });
  return { ok: true, tenNguoi: u.ten };
}

/**
 * Chốt hộ các lượt bỏ dở quá 6 giờ — dùng đúng `donLuotCu` của bộ máy chơi
 * (chấm theo số câu đã trả lời, gọi lại nhiều lần vẫn an toàn).
 */
export async function chotLuotBoDo(
  userId: string,
): Promise<
  { ok: true; tenNguoi: string; soDong: number; conLai: number } | Loi
> {
  const u = await tenNguoi(userId);
  if (!u) return KHONG_THAY;
  // Một mốc cho cả hai lần đếm; donLuotCu tự tính mốc muộn hơn nên bao trùm
  const dieuKien = {
    userId,
    trangThai: "DANG_CHOI",
    createdAt: { lt: new Date(Date.now() - LUOT_CU_MS) },
  };
  const truoc = await prisma.nnLuot.count({ where: dieuKien });
  if (!truoc) return { ok: true, tenNguoi: u.ten, soDong: 0, conLai: 0 };
  await donLuotCu({ userId, memberId: u.memberId });
  const conLai = await prisma.nnLuot.count({ where: dieuKien });
  return { ok: true, tenNguoi: u.ten, soDong: truoc - conLai, conLai };
}
