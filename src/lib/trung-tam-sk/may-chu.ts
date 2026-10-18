import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import { SLUG_1010 } from "@/lib/checkin-1010";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";
import { uniqueSlug } from "@/lib/slug";
import { TT_TAI_TRO_CHUA_CHOT } from "@/lib/tai-tro";
import { randomInt } from "crypto";
import { QUYEN_LOI_THEO_HANG, type QuyenBang, chuan, tuNgayNhap } from "@/lib/trung-tam-sk/bang";
import { tongHopDanhGia } from "@/lib/trung-tam-sk/danh-gia";
import { type QuyMo, hangTaiTroMau, taoDuLieuMau, taoDuLieuMauDot2 } from "@/lib/trung-tam-sk/mau";

/**
 * TRUNG TÂM SỰ KIỆN — phần chạy ở máy chủ (quyền, tạo sự kiện theo mẫu,
 * thống kê). Check-in + điểm ở `checkin.ts`.
 */

export type QuyenSk = {
  /** Khách mời (có SĐT), BTC, công việc, kịch bản, hậu cần, thông tin */
  quanLy: boolean;
  /** Nhà tài trợ, thu chi */
  taiChinh: boolean;
  /** Màn check-in tại bàn lễ tân */
  checkin: boolean;
  /** Vào được Trung tâm (có ít nhất một trong ba quyền trên) */
  vao: boolean;
};

export function quyenSk(user: CurrentUser | null | undefined): QuyenSk {
  const quanLy = co(user, QUYEN.SU_KIEN_QUAN_LY);
  const taiChinh = co(user, QUYEN.SU_KIEN_TAI_CHINH);
  const checkin = quanLy || co(user, QUYEN.SU_KIEN_CHECKIN);
  return { quanLy, taiChinh, checkin, vao: quanLy || taiChinh || checkin };
}

export const coQuyenBang = (q: QuyenSk, can: QuyenBang) =>
  can === "TAI_CHINH" ? q.taiChinh : q.quanLy;

/**
 * Dùng ở route handler: trả người dùng nếu đủ quyền, ngược lại trả Response
 * lỗi để route trả thẳng ra.
 */
export async function nguoiDungApi(
  can: keyof Omit<QuyenSk, "vao"> | "vao"
): Promise<{ user: CurrentUser; quyen: QuyenSk } | Response> {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Phiên đăng nhập đã hết, vui lòng đăng nhập lại" }, { status: 401 });
  const quyen = quyenSk(user);
  if (!quyen[can]) return Response.json({ error: "Không có quyền thực hiện thao tác này" }, { status: 403 });
  return { user, quyen };
}

/** Người ghi điểm / người bấm check-in, dạng sổ điểm dùng */
export const nguoiGhi = (u: CurrentUser) => ({ id: u.id, ten: u.name });

/** Sự kiện + lớp tổ chức + các phiên */
export async function napSuKien(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      startAt: true,
      endAt: true,
      location: true,
      published: true,
      activityGroup: true,
      toChuc: {
        include: { phien: { orderBy: [{ order: "asc" }, { batDau: "asc" }] } },
      },
    },
  });
}

export type SuKienDaNap = NonNullable<Awaited<ReturnType<typeof napSuKien>>>;

/** Danh sách các ban đã lưu ở SkSuKien.cacBan */
export function docCacBan(json: string | null | undefined): { ten: string; moTa: string }[] {
  if (!json) return [];
  try {
    const a = JSON.parse(json);
    return Array.isArray(a)
      ? a
          .filter((x) => x && typeof x.ten === "string")
          .map((x) => ({ ten: String(x.ten), moTa: String(x.moTa ?? "") }))
      : [];
  } catch {
    return [];
  }
}

/**
 * Đổi tên (moi trống = xoá) một ban trong danh sách. Ban chỉ có trong dữ liệu
 * (gõ tay ở bảng) mà chưa có trong danh sách → đặt tên là thêm vào. Trả danh
 * sách mới + cặp tên cần đổi theo ở người / việc / thu chi / hậu cần.
 */
export function tinhDoiTenBan(
  cacBanJson: string | null | undefined,
  x: { cu?: unknown; moi?: unknown; moTa?: unknown }
): { cacBan: string; doiBan: { cu: string; moi: string | null } | null } | { error: string } {
  const cu = String(x.cu ?? "").trim();
  const moi = String(x.moi ?? "").trim().slice(0, 80) || null;
  if (!cu) return { error: "Thiếu tên ban" };
  const ds = docCacBan(cacBanJson);
  if (moi && moi !== cu && ds.some((y) => y.ten === moi)) return { error: `Đã có "${moi}"` };
  const moTa = typeof x.moTa === "string" ? x.moTa.trim().slice(0, 300) : undefined;
  const co = ds.some((y) => y.ten === cu);
  const moiDs = !moi
    ? ds.filter((y) => y.ten !== cu)
    : co
      ? ds.map((y) => (y.ten === cu ? { ten: moi, moTa: moTa ?? y.moTa } : y))
      : [...ds, { ten: moi, moTa: moTa ?? "" }];
  if (moiDs.length > 30) return { error: "Tối đa 30 ban" };
  return { cacBan: JSON.stringify(moiDs), doiBan: moi !== cu ? { cu, moi } : null };
}

/** Các lệnh ghi để người, việc, thu chi, hậu cần, kịch bản của ban đi theo tên mới */
export function lenhDoiTenBan(eventId: string, skId: string, d: { cu: string; moi: string | null }) {
  return [
    prisma.banToChuc.updateMany({ where: { eventId, ban: d.cu }, data: { ban: d.moi } }),
    prisma.skViec.updateMany({ where: { skId, ban: d.cu }, data: { ban: d.moi } }),
    prisma.skThuChi.updateMany({ where: { skId, ban: d.cu }, data: { ban: d.moi } }),
    prisma.skHauCan.updateMany({ where: { skId, phuTrach: d.cu }, data: { phuTrach: d.moi } }),
    prisma.skKichBan.updateMany({ where: { skId, phuTrach: d.cu }, data: { phuTrach: d.moi } }),
  ];
}

export type DuLieuTao = {
  /** Gắn vào sự kiện có sẵn (mục "Sự kiện & chương trình"); trống = tạo sự kiện mới */
  eventId?: string | null;
  tieuDe: string;
  /** YYYY-MM-DD */
  ngay: string;
  /** HH:mm */
  gio: string;
  diaDiem?: string | null;
  loai: string;
  quyMo: QuyMo;
  mucTieuKhach?: number | null;
  /** Sinh sẵn phiên, việc, kịch bản, hậu cần, dự trù chi theo mẫu */
  dungMau: boolean;
};

/**
 * Tạo lớp tổ chức (và sự kiện nếu chưa có) — trả eventId.
 * Lỗi nghiệp vụ ném `Error` có thông điệp tiếng Việt.
 */
export async function taoToChuc(d: DuLieuTao): Promise<string> {
  const ngay = tuNgayNhap(d.ngay);
  if (!ngay) throw new Error("Ngày tổ chức không hợp lệ");
  const gio = /^\d{2}:\d{2}$/.test(d.gio) ? d.gio : "08:00";
  const startAt = new Date(`${d.ngay}T${gio}:00+07:00`);
  const mau = taoDuLieuMau(d.loai, d.quyMo, ngay, gio);

  let eventId = d.eventId ?? null;
  if (eventId) {
    const ev = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, slug: true, toChuc: { select: { id: true } } },
    });
    if (!ev) throw new Error("Không tìm thấy sự kiện");
    if (ev.slug === SLUG_1010) {
      throw new Error("Lễ chuyển giao 10/10 dùng bộ công cụ riêng (Lưu trữ 10/10), không gắn vào Trung tâm.");
    }
    if (ev.toChuc) return ev.id;
  } else {
    const tieuDe = d.tieuDe.trim();
    if (!tieuDe) throw new Error("Chưa nhập tên sự kiện");
    const ev = await prisma.event.create({
      data: {
        title: tieuDe.slice(0, 200),
        startAt,
        location: d.diaDiem?.trim() || null,
        // Chưa công bố lên web — Ban Truyền thông bật ở tab Thông tin khi sẵn sàng
        published: false,
        slug: await uniqueSlug(
          tieuDe,
          async (s) => !!(await prisma.event.findUnique({ where: { slug: s } })),
          "su-kien"
        ),
      },
      select: { id: true },
    });
    eventId = ev.id;
  }

  const ma = await taoMaCong();
  await prisma.$transaction(async (tx) => {
    const sk = await tx.skSuKien.create({
      data: {
        eventId: eventId!,
        loai: d.loai,
        quyMo: d.quyMo,
        mucTieuKhach: d.mucTieuKhach ?? mau.mucTieuKhach,
        cacBan: JSON.stringify(mau.cacBan),
        ma,
        pinCheckin: taoPin(),
      },
      select: { id: true },
    });
    const skId = sk.id;
    // Luôn có ít nhất một phiên — xác nhận / check-in tính theo phiên
    const dsPhien = d.dungMau ? mau.phien : [{ ten: "Chương trình", order: 1 }];
    const phienIds: string[] = [];
    for (const p of dsPhien) {
      const r = await tx.skPhien.create({
        data: { skId, ten: p.ten, order: p.order, batDau: p.order === 1 ? startAt : null, diaDiem: d.diaDiem || null },
        select: { id: true },
      });
      phienIds.push(r.id);
    }
    if (!d.dungMau) return;
    await tx.skViec.createMany({ data: mau.viec.map((v) => ({ ...v, skId })) });
    await tx.skKichBan.createMany({
      data: mau.kichBan.map(({ viTriPhien, ...k }) => ({
        ...k,
        skId,
        phienId: viTriPhien === null ? null : phienIds[viTriPhien] ?? null,
      })),
    });
    await tx.skHauCan.createMany({ data: mau.hauCan.map((h) => ({ ...h, skId })) });
    await tx.skThuChi.createMany({ data: mau.thuChi.map((t) => ({ ...t, skId })) });
    await tx.skHangTaiTro.createMany({
      data: hangTaiTroMau(d.quyMo, QUYEN_LOI_THEO_HANG).map((h) => ({ ...h, skId })),
    });
    const m2 = taoDuLieuMauDot2(d.loai, d.quyMo);
    await tx.skNhaCungCap.createMany({ data: m2.nhaCungCap.map((x) => ({ ...x, skId })) });
    await tx.skRuiRo.createMany({ data: m2.ruiRo.map((x) => ({ ...x, skId })) });
    await tx.skGiai.createMany({ data: m2.giai.map((x) => ({ ...x, skId })) });
  });

  return eventId!;
}

// ─────────────────────────────── cổng QR ───────────────────────────────

/** Bỏ chữ dễ nhầm (0/O, 1/I/L) — khách gõ tay từ bảng in vẫn đúng */
const BANG_CHU = "abcdefghjkmnpqrstuvwxyz23456789";

/**
 * Mã ngắn cho đường dẫn /sk/[ma]. SkSuKien.ma KHÔNG đặt unique ở CSDL (thêm
 * unique vào bảng đang có là db push trên máy chủ dừng) → kiểm trùng ở đây.
 */
export async function taoMaCong(): Promise<string> {
  for (let lan = 0; lan < 20; lan++) {
    const ma = Array.from({ length: 6 }, () => BANG_CHU[randomInt(BANG_CHU.length)]).join("");
    if (!(await prisma.skSuKien.findFirst({ where: { ma }, select: { id: true } }))) return ma;
  }
  throw new Error("Không sinh được mã cổng QR");
}

export const taoPin = () => String(randomInt(1000, 10000));

/** Sự kiện tạo từ đợt 1 chưa có mã cổng / PIN → cấp ngay (gọi ở tab Cổng QR) */
export async function damBaoMaCong(skId: string): Promise<{ ma: string; pinCheckin: string }> {
  const sk = await prisma.skSuKien.findUniqueOrThrow({ where: { id: skId }, select: { ma: true, pinCheckin: true } });
  if (sk.ma && sk.pinCheckin) return { ma: sk.ma, pinCheckin: sk.pinCheckin };
  const data = { ma: sk.ma ?? (await taoMaCong()), pinCheckin: sk.pinCheckin ?? taoPin() };
  await prisma.skSuKien.update({ where: { id: skId }, data });
  return data;
}

// ─────────────────────────────── thống kê ───────────────────────────────

const homNay = () => new Date();

/** Số liệu tổng hợp của một sự kiện — dùng cho Dashboard và báo cáo */
export async function thongKe(eventId: string, skId: string) {
  const [phien, khach, viec, hauCan, thuChi, taiTro, btc] = await Promise.all([
    prisma.skPhien.findMany({ where: { skId }, orderBy: { order: "asc" } }),
    prisma.skKhach.findMany({
      where: { skId },
      select: {
        id: true,
        nhom: true,
        vip: true,
        memberId: true,
        moi: true,
        thamDu: { select: { phienId: true, xacNhan: true, checkinLuc: true } },
      },
    }),
    prisma.skViec.findMany({
      where: { skId },
      select: { id: true, ban: true, tieuDe: true, trangThai: true, uuTien: true, hanChot: true, nguoiLam: true },
    }),
    prisma.skHauCan.findMany({ where: { skId }, select: { trangThai: true } }),
    prisma.skThuChi.findMany({ where: { skId } }),
    prisma.taiTroSuKien.findMany({
      where: { eventId },
      select: {
        id: true,
        nhaTaiTro: true,
        mucTaiTro: true,
        hienKim: true,
        giaTri: true,
        daThu: true,
        trangThai: true,
        quyenLoi: { select: { xong: true } },
      },
    }),
    prisma.banToChuc.findMany({ where: { eventId }, select: { ban: true, memberId: true, hoTen: true } }),
  ]);
  const [danhGia, cauHoi, giai, ncc, ruiRo, baiDang] = await Promise.all([
    tongHopDanhGia(skId),
    prisma.skCauHoi.groupBy({ by: ["trangThai"], where: { skId }, _count: { _all: true } }),
    prisma.skGiai.findMany({ where: { skId }, select: { soLuong: true, trung: { where: { trangThai: "TRUNG" }, select: { id: true } } } }),
    prisma.skNhaCungCap.findMany({ where: { skId }, select: { trangThai: true, giaTri: true, daCoc: true } }),
    prisma.skRuiRo.findMany({ where: { skId }, select: { khaNang: true, tacDong: true, trangThai: true } }),
    prisma.skBaiDang.findMany({ where: { skId }, select: { reach: true, tuongTac: true } }),
  ]);

  const theoPhien = phien.map((p) => {
    let co = 0,
      khong = 0,
      cho = 0,
      checkin = 0;
    for (const k of khach) {
      const t = k.thamDu.find((x) => x.phienId === p.id);
      if (t?.checkinLuc) checkin++;
      if (t?.xacNhan === "CO") co++;
      else if (t?.xacNhan === "KHONG") khong++;
      else cho++;
    }
    return { id: p.id, ten: p.ten, batDau: p.batDau, sucChua: p.sucChua, co, khong, cho, checkin };
  });

  const xacNhanItNhat1 = khach.filter((k) => k.thamDu.some((t) => t.xacNhan === "CO")).length;
  const daDen = khach.filter((k) => k.thamDu.some((t) => t.checkinLuc)).length;
  const hoiVienDen = khach.filter((k) => k.memberId && k.thamDu.some((t) => t.checkinLuc)).length;

  const nhomKhach = new Map<string, { tong: number; co: number; den: number }>();
  for (const k of khach) {
    const n = k.nhom?.trim() || "Chưa phân nhóm";
    const g = nhomKhach.get(n) ?? { tong: 0, co: 0, den: 0 };
    g.tong++;
    if (k.thamDu.some((t) => t.xacNhan === "CO")) g.co++;
    if (k.thamDu.some((t) => t.checkinLuc)) g.den++;
    nhomKhach.set(n, g);
  }

  const now = homNay();
  const viecMo = viec.filter((v) => v.trangThai !== "XONG");
  const viecTre = viecMo
    .filter((v) => v.hanChot && v.hanChot < now)
    .sort((a, b) => (a.hanChot!.getTime() - b.hanChot!.getTime()));
  const theoBan = new Map<string, { xong: number; mo: number; tre: number }>();
  for (const v of viec) {
    const b = v.ban?.trim() || "Chung";
    const g = theoBan.get(b) ?? { xong: 0, mo: 0, tre: 0 };
    if (v.trangThai === "XONG") g.xong++;
    else {
      g.mo++;
      if (v.hanChot && v.hanChot < now) g.tre++;
    }
    theoBan.set(b, g);
  }

  const chi = thuChi.filter((t) => t.loai === "CHI");
  const thu = thuChi.filter((t) => t.loai === "THU");
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const ttChot = taiTro.filter((t) => !TT_TAI_TRO_CHUA_CHOT.includes(t.trangThai));
  const taiChinh = {
    duTruChi: sum(chi.map((t) => t.duTru)),
    thucChi: sum(chi.map((t) => t.thucTe)),
    daTraChi: sum(chi.filter((t) => t.trangThai === "DA_TT").map((t) => t.thucTe)),
    noChi: sum(chi.filter((t) => t.trangThai !== "DA_TT").map((t) => t.thucTe)),
    duTruThu: sum(thu.map((t) => t.duTru)),
    thucThuKhac: sum(thu.map((t) => t.thucTe)),
    taiTroCamKet: sum(ttChot.map((t) => t.hienKim)),
    taiTroGiaTri: sum(ttChot.map((t) => t.giaTri)),
    taiTroDaThu: sum(ttChot.map((t) => t.daThu)),
    soNtt: ttChot.length,
    soNttDangVanDong: taiTro.filter((t) => t.trangThai === "Đang vận động").length,
    quyenLoiXong: sum(ttChot.map((t) => t.quyenLoi.filter((q) => q.xong).length)),
    quyenLoiTong: sum(ttChot.map((t) => t.quyenLoi.length)),
  };
  const tongThu = taiChinh.taiTroDaThu + taiChinh.thucThuKhac;

  return {
    phien: theoPhien,
    khach: {
      tong: khach.length,
      xacNhan: xacNhanItNhat1,
      daDen,
      hoiVienDen,
      vip: khach.filter((k) => k.vip).length,
      chuaMoi: khach.filter((k) => k.moi === "CHUA_MOI").length,
      theoNhom: [...nhomKhach.entries()]
        .map(([ten, g]) => ({ ten, ...g }))
        .sort((a, b) => b.tong - a.tong),
    },
    viec: {
      tong: viec.length,
      xong: viec.length - viecMo.length,
      tre: viecTre.length,
      dsTre: viecTre.slice(0, 8).map((v) => ({
        id: v.id,
        tieuDe: v.tieuDe,
        ban: v.ban,
        hanChot: v.hanChot,
        uuTien: v.uuTien,
        nguoiLam: v.nguoiLam,
      })),
      theoBan: [...theoBan.entries()]
        .map(([ten, g]) => ({ ten, ...g }))
        .sort((a, b) => b.xong + b.mo - (a.xong + a.mo)),
    },
    hauCan: { tong: hauCan.length, xong: hauCan.filter((h) => h.trangThai === "XONG").length },
    taiChinh: { ...taiChinh, tongThu, ketDu: tongThu - taiChinh.thucChi },
    // Một người ở nhiều ban vẫn đếm một lần
    btc: {
      tong: new Set(btc.map((b) => b.memberId ?? `ten:${chuan(b.hoTen)}`)).size,
      hoiVien: new Set(btc.filter((b) => b.memberId).map((b) => b.memberId)).size,
    },
    danhGia,
    cauHoi: {
      tong: sum(cauHoi.map((c) => c._count._all)),
      moi: cauHoi.find((c) => c.trangThai === "MOI")?._count._all ?? 0,
    },
    giai: { suat: sum(giai.map((g) => g.soLuong)), daTrao: sum(giai.map((g) => g.trung.length)) },
    ncc: {
      tong: ncc.length,
      chuaChot: ncc.filter((n) => n.trangThai === "TIM" || n.trangThai === "BAO_GIA").length,
      giaTri: sum(ncc.map((n) => n.giaTri)),
      daCoc: sum(ncc.map((n) => n.daCoc)),
    },
    ruiRo: {
      tong: ruiRo.length,
      moCao: ruiRo.filter((r) => r.trangThai !== "DA_XU_LY" && r.khaNang * r.tacDong >= 6).length,
    },
    truyenThong: {
      soBai: baiDang.length,
      reach: sum(baiDang.map((b) => b.reach)),
      tuongTac: sum(baiDang.map((b) => b.tuongTac)),
    },
  };
}

export type ThongKe = Awaited<ReturnType<typeof thongKe>>;
