/**
 * Nhiệm vụ Huynh đệ — việc làm THẬT ngoài đời, có ba cách xác nhận:
 *  - TU_DONG: hệ thống đọc dữ liệu có sẵn trên web (check-in QR sự kiện, giao
 *    dịch đã duyệt, Ban Tổ chức sự kiện, lời chúc sinh nhật, hồ sơ đã duyệt)
 *  - HOI_VIEN: hội viên liên quan bấm xác nhận (người được giới thiệu…)
 *  - BAN_DUYET: Ban phụ trách duyệt ở /quan-tri/ngoi-nha
 * Nhiệm vụ chỉ tính trong thời gian mùa giải. Giới hạn số lần theo kỳ xét theo
 * `ngayLam` (ngày làm việc thật), không theo ngày bấm duyệt.
 *
 * Ban Điều hành sửa được từng nhiệm vụ (`nn.nhiemVu`: bật/tắt, điểm, vốn, số
 * lần tối đa + kỳ, cần ảnh, chữ) và tắt cả tính năng (`nn.tinhNang.nhiemVu`).
 * Cách xác nhận và nguồn tự động vẫn giữ trong code (`CAU_HINH_NV`). Cài đặt
 * đọc TRƯỚC giao dịch rồi truyền vào `congThuong` / `demTrongKy`.
 *  - Nhiệm vụ tắt: không gửi mới, không tự ghi nhận, ẩn ở Góc Huynh đệ; yêu
 *    cầu đang chờ vẫn xử lý được.
 *  - Bật lại: lần đồng bộ sau ghi nhận bù việc đã làm trong mùa, vẫn theo giới
 *    hạn từng kỳ của `ngayLam` và khoá (userId, muaId, khoa) — không cộng dồn.
 */
import { prisma } from "@/lib/prisma";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import type { HuyHieuMoi, NguoiChoi } from "./kieu";
import { CHOI_THU, muaHienTai, type MuaHienTai } from "./mua";
import { NHIEM_VU } from "./noi-dung";
import { docMuc, docNhiemVuSua, docTinhNang, NHIEM_VU_GOC } from "./cai-dat";
import type { LuatChoi } from "./cai-dat/luat-choi";
import type { NhiemVuSua } from "./cai-dat/noi-dung-sua";
import {
  GIAO_DICH,
  LoiGame,
  ghiSoCai,
  traoHuyHieu,
  xetCanBang,
  type Tx,
} from "./so-cai";
import { khoangKy, ngayThangVN } from "./thoi-gian";

import {
  CAU_HINH_NV,
  TEN_KY,
  type CauHinhNhiemVu,
  type NguonTuDong,
} from "./nhiem-vu-cau-hinh";

export { CAU_HINH_NV, TEN_KY, type CauHinhNhiemVu, type NguonTuDong };

/** Một nhiệm vụ đã gộp bản Ban Điều hành sửa với cách xác nhận trong code. */
export type NhiemVuHieuLuc = NhiemVuSua & {
  /** Nhóm hiển thị (KET_NOI, GIAO_THUONG…) — theo bản gốc */
  muc: string;
  tuDong?: NguonTuDong;
  thuCong?: "HOI_VIEN" | "BAN_DUYET";
  /** Có giới hạn số lần theo kỳ không (cần cả kỳ lẫn số lần > 0) */
  coGioiHan: boolean;
};

/**
 * Bảng nhiệm vụ đang áp dụng (thuần): bản sửa `nn.nhiemVu` đè lên bản gốc,
 * thiếu mã nào lấy bản gốc mã đó. Thứ tự theo tệp nội dung gốc.
 */
export function bangNhiemVu(sua?: {
  ds: NhiemVuSua[];
}): Map<string, NhiemVuHieuLuc> {
  const theoMa = new Map((sua?.ds ?? NHIEM_VU_GOC).map((n) => [n.ma, n]));
  const goc = new Map(NHIEM_VU_GOC.map((n) => [n.ma, n]));
  const kq = new Map<string, NhiemVuHieuLuc>();
  for (const nd of NHIEM_VU) {
    const n = theoMa.get(nd.ma) ?? goc.get(nd.ma);
    const ch = CAU_HINH_NV[nd.ma];
    if (!n || !ch) continue;
    kq.set(nd.ma, {
      ...n,
      muc: nd.muc,
      tuDong: ch.tuDong,
      thuCong: ch.thuCong,
      // Không có kỳ thì không giới hạn (kể cả khi số lần > 0)
      coGioiHan: !!n.ky && n.toiDa > 0,
    });
  }
  return kq;
}

/** "Đã đủ 4 lần tháng này" */
const chuDaDu = (nd: NhiemVuHieuLuc) =>
  `Đã đủ ${nd.toiDa} lần ${nd.ky ? TEN_KY[nd.ky] : ""}`.trim();

/** Check-in sự kiện thuộc nhiệm vụ nào — mỗi lần check-in chỉ tính cho MỘT nhiệm vụ. */
function nvChoCheckin(e: {
  title: string;
  seriesName: string | null;
  activityGroup: string | null;
}): string {
  const ten = `${e.seriesName ?? ""} ${e.title}`.toLowerCase();
  const nhom = (e.activityGroup ?? "").toLowerCase();
  if (ten.includes("coffee connect")) return "NV02";
  if (ten.includes("thăm doanh nghiệp")) return "NV07";
  if (nhom.includes("thể thao") || ten.includes("pickleball")) return "NV06";
  if (nhom.includes("cộng đồng")) return "NV11";
  return "NV01";
}

async function demTrongKy(
  tx: Tx,
  d: {
    userId: string;
    muaId: string;
    maNv: string;
    ngayLam: Date;
    kemCho: boolean;
    boQuaId?: string;
  },
  nd: NhiemVuHieuLuc,
): Promise<number> {
  if (!nd.coGioiHan || !nd.ky) return 0;
  const khoang = nd.ky === "MUA" ? null : khoangKy(nd.ky, d.ngayLam);
  return tx.nnNhiemVu.count({
    where: {
      userId: d.userId,
      muaId: d.muaId,
      maNv: d.maNv,
      trangThai: d.kemCho
        ? { in: ["DA_XAC_NHAN", "CHO_XAC_NHAN"] }
        : "DA_XAC_NHAN",
      ...(khoang ? { ngayLam: { gte: khoang.tu, lt: khoang.den } } : {}),
      ...(d.boQuaId ? { id: { not: d.boQuaId } } : {}),
    },
  });
}

/**
 * Cộng thưởng cho một nhiệm vụ vừa được xác nhận (trong transaction). Điểm /
 * vốn theo bản sửa đang áp dụng lúc xác nhận; luật (số lần cho huy hiệu Người
 * bắc cầu) đọc sẵn ngoài giao dịch rồi truyền vào.
 */
async function congThuong(
  tx: Tx,
  nv: { id: string; userId: string; muaId: string; maNv: string },
  nd: NhiemVuHieuLuc | undefined,
  luat: LuatChoi,
): Promise<HuyHieuMoi[]> {
  if (!nd || nv.muaId === CHOI_THU) return [];
  await ghiSoCai(tx, {
    userId: nv.userId,
    muaId: nv.muaId,
    loai: "NHIEM_VU",
    nguon: `nv:${nv.id}`,
    diem: nd.diem,
    von: nd.von,
    ghiChu: nd.ten,
  });
  const moi: HuyHieuMoi[] = [];
  if (nv.maNv === "NV03" && luat.huyHieu.NGUOI_BAC_CAU?.bat !== false) {
    const soLan = await tx.nnNhiemVu.count({
      where: {
        userId: nv.userId,
        muaId: nv.muaId,
        maNv: "NV03",
        trangThai: "DA_XAC_NHAN",
      },
    });
    if (soLan >= luat.nguoiBacCauSoLan)
      moi.push(
        ...(await traoHuyHieu(
          tx,
          nv.userId,
          nv.muaId,
          ["NGUOI_BAC_CAU"],
          luat,
        )),
      );
  }
  moi.push(...(await xetCanBang(tx, nv.userId, nv.muaId, luat)));
  return moi;
}

export type ThuongTuDong = {
  maNv: string;
  ten: string;
  diem: number;
  moTa: string;
};

/**
 * Đọc dữ liệu web, ghi nhận nhiệm vụ tự động chưa ghi. Chạy lại bao nhiêu lần
 * cũng không trùng nhờ khoá (userId, muaId, khoa).
 */
export async function dongBoTuDong(
  nguoi: NguoiChoi,
  mua?: MuaHienTai,
): Promise<ThuongTuDong[]> {
  mua ??= await muaHienTai();
  const memberId = nguoi.memberId;
  if (!memberId || mua.id === CHOI_THU || !mua.batDau || !mua.ketThuc)
    return [];
  // Cài đặt đọc trước (SQLite một kết nối); tắt tính năng thì không ghi gì mới
  const [tinhNang, sua, luat] = await Promise.all([
    docTinhNang(),
    docNhiemVuSua(),
    docMuc("luat"),
  ]);
  // Tạm dừng game: không tự ghi nhận gì thêm (trang vẫn dựng song song với layout)
  if (!tinhNang.nhiemVu || tinhNang.tamDung) return [];
  const bang = bangNhiemVu(sua);
  const tu = mua.batDau;
  const den = mua.ketThuc;
  const trongMua = { gte: tu, lte: den };
  const dealDuyet = {
    status: "DA_DUYET",
    OR: [{ reviewedAt: trongMua }, { reviewedAt: null, dealDate: trongMua }],
  };

  const [checkin, dealBan, dealMua, dealGioiThieu, btc, loiChuc, hoSo, daGhi] =
    await Promise.all([
      prisma.thamDuSuKien.findMany({
        where: { memberId, trangThai: "DA_CHECKIN", checkinAt: trongMua },
        select: {
          id: true,
          checkinAt: true,
          event: {
            select: { title: true, seriesName: true, activityGroup: true },
          },
        },
      }),
      prisma.deal.findMany({
        where: { sellerId: memberId, ...dealDuyet },
        select: {
          id: true,
          code: true,
          reviewedAt: true,
          dealDate: true,
          buyer: { select: { company: true } },
        },
      }),
      prisma.deal.findMany({
        where: { buyerId: memberId, ...dealDuyet },
        select: {
          id: true,
          code: true,
          reviewedAt: true,
          dealDate: true,
          seller: { select: { company: true } },
        },
      }),
      prisma.deal.findMany({
        where: { referrerId: memberId, ...dealDuyet },
        select: {
          id: true,
          code: true,
          reviewedAt: true,
          dealDate: true,
          seller: { select: { company: true } },
        },
      }),
      prisma.banToChuc.findMany({
        where: { memberId, event: { startAt: trongMua } },
        select: { id: true, eventId: true, event: { select: { title: true, startAt: true } } },
        orderBy: { id: "asc" },
      }),
      prisma.loiChuc.findMany({
        where: { guiId: memberId, createdAt: trongMua },
        select: {
          id: true,
          createdAt: true,
          nhan: { select: { name: true, birthday: true } },
        },
      }),
      prisma.member.findUnique({
        where: { id: memberId },
        select: {
          profileStatus: true,
          intro: true,
          description: true,
          offering: true,
          logo: true,
          avatar: true,
          _count: { select: { listings: true } },
        },
      }),
      prisma.nnNhiemVu.findMany({
        // Theo cả hồ sơ: hồ sơ chuyển sang tài khoản khác thì việc cũ không thưởng lại
        where: {
          muaId: mua.id,
          khoa: { not: null },
          OR: [{ userId: nguoi.userId }, { memberId }],
        },
        select: { khoa: true },
      }),
    ]);

  const ungVien: { maNv: string; khoa: string; ngayLam: Date; moTa: string }[] =
    [];
  for (const c of checkin) {
    ungVien.push({
      maNv: nvChoCheckin(c.event),
      khoa: `checkin:${c.id}`,
      ngayLam: c.checkinAt ?? tu,
      moTa: `Check-in: ${c.event.title}`,
    });
  }
  for (const d of dealBan) {
    ungVien.push({
      maNv: "NV04",
      khoa: `deal-ban:${d.id}`,
      ngayLam: d.reviewedAt ?? d.dealDate,
      moTa: `Giao dịch ${d.code} với ${tenDoanhNghiep(d.buyer.company)}`,
    });
  }
  for (const d of dealMua) {
    ungVien.push({
      maNv: "NV13",
      khoa: `deal-mua:${d.id}`,
      ngayLam: d.reviewedAt ?? d.dealDate,
      moTa: `Dùng hàng ${tenDoanhNghiep(d.seller.company)} (${d.code})`,
    });
  }
  for (const d of dealGioiThieu) {
    ungVien.push({
      maNv: "NV03",
      khoa: `deal-gt:${d.id}`,
      ngayLam: d.reviewedAt ?? d.dealDate,
      moTa: `Kết nối giao dịch ${d.code}`,
    });
  }
  // Một sự kiện tính một lần dù người đó ở nhiều ban (Trung tâm sự kiện cho xếp nhiều ban)
  const daTinhBtc = new Set<string>();
  for (const b of btc) {
    if (daTinhBtc.has(b.eventId)) continue;
    daTinhBtc.add(b.eventId);
    ungVien.push({
      maNv: "NV12",
      khoa: `btc:${b.id}`,
      ngayLam: b.event.startAt,
      moTa: `Ban Tổ chức: ${b.event.title}`,
    });
  }
  for (const l of loiChuc) {
    if (!l.nhan.birthday) continue;
    const sn = ngayThangVN(l.nhan.birthday);
    const gui = ngayThangVN(l.createdAt);
    if (sn.ngay !== gui.ngay || sn.thang !== gui.thang) continue;
    ungVien.push({
      maNv: "NV16",
      khoa: `loi-chuc:${l.id}`,
      ngayLam: l.createdAt,
      moTa: `Chúc mừng sinh nhật ${l.nhan.name}`,
    });
  }
  if (
    hoSo &&
    hoSo.profileStatus === "DA_DUYET" &&
    hoSo.intro &&
    (hoSo.description || hoSo.offering) &&
    (hoSo.logo || hoSo.avatar) &&
    hoSo._count.listings > 0
  ) {
    ungVien.push({
      maNv: "NV09",
      khoa: "ho-so",
      ngayLam: new Date(),
      moTa: "Hồ sơ doanh nghiệp đầy đủ và có tin trên Chợ nhu cầu",
    });
  }

  const daCo = new Set(daGhi.map((x) => x.khoa));
  // Nhiệm vụ đang tắt: bỏ qua, KHÔNG ghi khoá — bật lại thì ghi nhận bù theo
  // đúng kỳ của ngày làm (demTrongKy), không cộng vượt giới hạn
  const moi = ungVien
    .filter((u) => !daCo.has(u.khoa) && bang.get(u.maNv)?.bat)
    .sort((a, b) => a.ngayLam.getTime() - b.ngayLam.getTime());
  const thuong: ThuongTuDong[] = [];
  for (const u of moi) {
    const nd = bang.get(u.maNv)!;
    try {
      // Giao dịch trả về "có ghi nhận không"; chỉ báo cho người chơi SAU khi đã
      // commit — đẩy vào `thuong` ngay trong callback thì giao dịch hỏng lúc
      // commit vẫn hiện "vừa được cộng điểm" dù sổ cái không có gì
      const ghiDuoc = await prisma.$transaction(async (tx) => {
        const daDung = await demTrongKy(
          tx,
          {
            userId: nguoi.userId,
            muaId: mua.id,
            maNv: u.maNv,
            ngayLam: u.ngayLam,
            kemCho: false,
          },
          nd,
        );
        const vuot = nd.coGioiHan && daDung >= nd.toiDa;
        const nv = await tx.nnNhiemVu.create({
          data: {
            userId: nguoi.userId,
            memberId,
            muaId: mua.id,
            maNv: u.maNv,
            cach: "TU_DONG",
            khoa: u.khoa,
            moTa: u.moTa,
            ngayLam: u.ngayLam,
            trangThai: vuot ? "TU_CHOI" : "DA_XAC_NHAN",
            lyDo: vuot ? chuDaDu(nd) : null,
            xuLyBoi: "HE_THONG",
            xuLyLuc: new Date(),
            diem: vuot ? 0 : nd.diem,
          },
        });
        if (vuot) return false;
        await congThuong(tx, nv, nd, luat);
        return true;
      }, GIAO_DICH);
      if (ghiDuoc)
        thuong.push({
          maNv: u.maNv,
          ten: nd.ten,
          diem: nd.diem,
          moTa: u.moTa,
        });
    } catch {
      /* đã được ghi ở một yêu cầu song song */
    }
  }
  return thuong;
}

/** Hội viên gửi yêu cầu xác nhận nhiệm vụ làm tay. */
export async function guiNhiemVu(
  nguoi: NguoiChoi,
  d: {
    maNv: string;
    moTa: string;
    anh?: string | null;
    lienQuanMemberId?: string | null;
  },
) {
  const [tinhNang, sua] = await Promise.all([docTinhNang(), docNhiemVuSua()]);
  if (!tinhNang.nhiemVu)
    throw new LoiGame(
      "Nhiệm vụ Huynh đệ đang tạm dừng — chưa gửi được yêu cầu mới.",
      "TAT",
    );
  if (!nguoi.memberId)
    throw new LoiGame(
      "Tài khoản chưa gắn với hồ sơ hội viên nên chưa nhận nhiệm vụ được. Nhờ thư ký Chi hội gắn giúp.",
    );
  const nd = bangNhiemVu(sua).get(d.maNv);
  if (!nd) throw new LoiGame("Không có nhiệm vụ này");
  if (!nd.bat)
    throw new LoiGame(
      "Nhiệm vụ này đang tạm tắt — chưa gửi được yêu cầu mới.",
      "TAT",
    );
  const mua = await muaHienTai();
  if (mua.id === CHOI_THU || !mua.tinhDiem)
    throw new LoiGame(
      "Nhiệm vụ Huynh đệ chỉ ghi nhận trong thời gian mùa giải.",
    );
  if (!nd.thuCong)
    throw new LoiGame("Nhiệm vụ này hệ thống tự ghi nhận, không cần gửi.");
  const moTa = d.moTa.trim().slice(0, 1000);
  if (moTa.length < 10)
    throw new LoiGame("Kể ngắn gọn việc bạn đã làm (ít nhất 10 ký tự).");
  const anh = d.anh?.trim() || null;
  if (anh && !anh.startsWith("/tai-len/"))
    throw new LoiGame("Ảnh không hợp lệ, hãy tải ảnh lên lại.");
  if (nd.canAnh && !anh)
    throw new LoiGame("Nhiệm vụ này cần ảnh chụp màn hình.");

  let lienQuan: string | null = null;
  if (nd.thuCong === "HOI_VIEN") {
    lienQuan = d.lienQuanMemberId?.trim() || null;
    if (!lienQuan) throw new LoiGame("Chọn hội viên sẽ xác nhận giúp bạn.");
    if (lienQuan === nguoi.memberId)
      throw new LoiGame("Không tự xác nhận cho chính mình được.");
    const hv = await prisma.member.findFirst({
      where: { id: lienQuan, active: true },
      select: { id: true },
    });
    if (!hv) throw new LoiGame("Không tìm thấy hội viên này.");
  }

  const bayGio = new Date();
  const [daDung, dangCho] = await Promise.all([
    demTrongKy(
      prisma,
      {
        userId: nguoi.userId,
        muaId: mua.id,
        maNv: d.maNv,
        ngayLam: bayGio,
        kemCho: true,
      },
      nd,
    ),
    prisma.nnNhiemVu.count({
      where: {
        userId: nguoi.userId,
        muaId: mua.id,
        maNv: d.maNv,
        trangThai: "CHO_XAC_NHAN",
      },
    }),
  ]);
  if (nd.coGioiHan && daDung >= nd.toiDa) {
    throw new LoiGame(
      `Nhiệm vụ này tối đa ${nd.toiDa} lần ${nd.ky ? TEN_KY[nd.ky] : ""} — bạn đã đủ (tính cả yêu cầu đang chờ).`,
    );
  }
  if (dangCho >= 5)
    throw new LoiGame(
      "Bạn đang có 5 yêu cầu chờ xác nhận cho nhiệm vụ này. Chờ Ban phụ trách xử lý rồi gửi tiếp nhé.",
    );

  return prisma.nnNhiemVu.create({
    data: {
      userId: nguoi.userId,
      memberId: nguoi.memberId,
      muaId: mua.id,
      maNv: d.maNv,
      cach: nd.thuCong,
      moTa,
      anh,
      lienQuanMemberId: lienQuan,
      ngayLam: bayGio,
    },
  });
}

/**
 * Xác nhận / từ chối một nhiệm vụ đang chờ. `laBan` = người có quyền quản trị
 * game; hội viên thường chỉ xác nhận được yêu cầu nêu đích danh mình.
 */
export async function xuLyNhiemVu(
  nguoiXuLy: { userId: string; memberId: string | null; laBan: boolean },
  nvId: string,
  dongY: boolean,
  lyDo?: string,
): Promise<{ trangThai: string; huyHieuMoi: HuyHieuMoi[] }> {
  const nv = await prisma.nnNhiemVu.findUnique({ where: { id: nvId } });
  if (!nv || nv.trangThai !== "CHO_XAC_NHAN")
    throw new LoiGame("Yêu cầu này đã được xử lý hoặc không còn.");
  const laNguoiLienQuan =
    nv.cach === "HOI_VIEN" &&
    !!nguoiXuLy.memberId &&
    nv.lienQuanMemberId === nguoiXuLy.memberId;
  if (!laNguoiLienQuan && !nguoiXuLy.laBan)
    throw new LoiGame("Bạn không có quyền xác nhận yêu cầu này.");
  if (nv.userId === nguoiXuLy.userId)
    throw new LoiGame("Không tự xác nhận nhiệm vụ của chính mình được.");
  // Bản sửa + luật đọc trước giao dịch. Yêu cầu đang chờ vẫn xử lý được dù
  // nhiệm vụ / tính năng vừa bị tắt (việc dở làm nốt)
  const [sua, luat] = await Promise.all([docNhiemVuSua(), docMuc("luat")]);
  const nd = bangNhiemVu(sua).get(nv.maNv);

  return prisma.$transaction(async (tx) => {
    const ghiChu = lyDo?.trim().slice(0, 500) || null;
    // Mọi đường ghi đều dùng updateMany CÓ ĐIỀU KIỆN "còn đang chờ": trạng thái
    // đọc ở trên là đọc NGOÀI giao dịch, mà một yêu cầu HOI_VIEN vừa được hội
    // viên bấm xác nhận (đã cộng điểm) không được phép bị lật sang TU_CHOI
    const chotLa = async (
      trangThai: "TU_CHOI" | "DA_XAC_NHAN",
      d: { lyDo: string | null; diem?: number },
    ) => {
      const cn = await tx.nnNhiemVu.updateMany({
        where: { id: nv.id, trangThai: "CHO_XAC_NHAN" },
        data: {
          trangThai,
          xuLyBoi: nguoiXuLy.userId,
          xuLyLuc: new Date(),
          ...d,
        },
      });
      if (cn.count !== 1) throw new LoiGame("Yêu cầu này vừa được xử lý.");
    };
    if (!dongY) {
      await chotLa("TU_CHOI", { lyDo: ghiChu });
      return { trangThai: "TU_CHOI", huyHieuMoi: [] };
    }
    const daDung = nd
      ? await demTrongKy(
          tx,
          {
            userId: nv.userId,
            muaId: nv.muaId,
            maNv: nv.maNv,
            ngayLam: nv.ngayLam,
            kemCho: false,
            boQuaId: nv.id,
          },
          nd,
        )
      : 0;
    if (nd?.coGioiHan && daDung >= nd.toiDa) {
      await chotLa("TU_CHOI", { lyDo: `Đã đủ ${nd.toiDa} lần trong kỳ` });
      return { trangThai: "TU_CHOI", huyHieuMoi: [] };
    }
    await chotLa("DA_XAC_NHAN", { lyDo: ghiChu, diem: nd?.diem ?? 0 });
    const huyHieuMoi = await congThuong(tx, nv, nd, luat);
    return { trangThai: "DA_XAC_NHAN", huyHieuMoi };
  }, GIAO_DICH);
}

/** Hội viên có sinh nhật hôm nay (giờ Việt Nam), trừ chính mình. */
export async function sinhNhatHomNay(memberId: string | null) {
  const homNay = ngayThangVN(new Date());
  const ds = await prisma.member.findMany({
    where: {
      active: true,
      birthday: { not: null },
      ...(memberId ? { id: { not: memberId } } : {}),
    },
    select: {
      id: true,
      name: true,
      salutation: true,
      company: true,
      avatar: true,
      birthday: true,
    },
  });
  const coSinhNhat = ds.filter((m) => {
    const x = ngayThangVN(m.birthday as Date);
    return x.ngay === homNay.ngay && x.thang === homNay.thang;
  });
  const nam = new Date().getFullYear();
  const daChuc = memberId
    ? new Set(
        (
          await prisma.loiChuc.findMany({
            where: {
              guiId: memberId,
              nam,
              nhanId: { in: coSinhNhat.map((m) => m.id) },
            },
            select: { nhanId: true },
          })
        ).map((l) => l.nhanId),
      )
    : new Set<string>();
  return coSinhNhat.map((m) => ({
    id: m.id,
    ten: `${m.salutation ? `${m.salutation} ` : ""}${m.name}`,
    congTy: tenDoanhNghiep(m.company),
    anh: m.avatar,
    daChuc: daChuc.has(m.id),
  }));
}

/** Gửi lời chúc sinh nhật (dùng chung bảng LoiChuc với Mini App). */
export async function guiLoiChuc(
  nguoi: NguoiChoi,
  nhanId: string,
  noiDung: string,
): Promise<ThuongTuDong[]> {
  if (!nguoi.memberId)
    throw new LoiGame("Tài khoản chưa gắn với hồ sơ hội viên.");
  if (nhanId === nguoi.memberId)
    throw new LoiGame("Không tự chúc mình được đâu anh/chị.");
  const nhan = await prisma.member.findFirst({
    where: { id: nhanId, active: true },
    select: { birthday: true },
  });
  if (!nhan?.birthday) throw new LoiGame("Không tìm thấy hội viên này.");
  const sn = ngayThangVN(nhan.birthday);
  const homNay = ngayThangVN(new Date());
  if (sn.ngay !== homNay.ngay || sn.thang !== homNay.thang)
    throw new LoiGame("Hôm nay không phải sinh nhật của hội viên này.");
  try {
    await prisma.loiChuc.create({
      data: {
        guiId: nguoi.memberId,
        nhanId,
        nam: new Date().getFullYear(),
        noiDung: noiDung.trim().slice(0, 300) || null,
      },
    });
  } catch {
    /* đã chúc năm nay rồi — coi như thành công */
  }
  return dongBoTuDong(nguoi);
}

/** Dữ liệu cho màn Góc Huynh đệ. */
export async function gocHuynhDe(nguoi: NguoiChoi, mua: MuaHienTai) {
  const bayGio = new Date();
  const [tinhNang, sua] = await Promise.all([docTinhNang(), docNhiemVuSua()]);
  const bang = bangNhiemVu(sua);
  const [cuaToi, nhoToi, sinhNhat] = await Promise.all([
    mua.id === CHOI_THU
      ? Promise.resolve([])
      : prisma.nnNhiemVu.findMany({
          where: { userId: nguoi.userId, muaId: mua.id },
          orderBy: { createdAt: "desc" },
        }),
    nguoi.memberId
      ? prisma.nnNhiemVu.findMany({
          where: {
            lienQuanMemberId: nguoi.memberId,
            trangThai: "CHO_XAC_NHAN",
            cach: "HOI_VIEN",
          },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
    sinhNhatHomNay(nguoi.memberId),
  ]);

  const nguoiNho = await prisma.member.findMany({
    where: {
      id: { in: nhoToi.map((n) => n.memberId).filter((x): x is string => !!x) },
    },
    select: { id: true, name: true, company: true },
  });
  const tenNguoiNho = new Map(nguoiNho.map((m) => [m.id, m]));
  const lienQuanIds = cuaToi
    .map((n) => n.lienQuanMemberId)
    .filter((x): x is string => !!x);
  const lienQuan = await prisma.member.findMany({
    where: { id: { in: lienQuanIds } },
    select: { id: true, name: true },
  });
  const tenLienQuan = new Map(lienQuan.map((m) => [m.id, m.name]));

  // Nhiệm vụ Ban Điều hành tắt thì ẩn khỏi Góc Huynh đệ
  const nhiemVu = [...bang.values()]
    .filter((nd) => nd.bat)
    .map((nd) => {
      const khoang =
        nd.coGioiHan && nd.ky && nd.ky !== "MUA"
          ? khoangKy(nd.ky, bayGio)
          : null;
      const trongKy = cuaToi.filter(
        (n) =>
          n.maNv === nd.ma &&
          n.trangThai !== "TU_CHOI" &&
          (!khoang || (n.ngayLam >= khoang.tu && n.ngayLam < khoang.den)),
      );
      return {
        ma: nd.ma,
        ten: nd.ten,
        viec: nd.viec,
        xacNhan: nd.xacNhan,
        von: nd.von,
        diem: nd.diem,
        gioiHan: nd.gioiHan,
        muc: nd.muc,
        tuDong: !!nd.tuDong,
        thuCong: nd.thuCong ?? null,
        canAnh: !!nd.canAnh && !!nd.thuCong,
        goiY: nd.goiY ?? "",
        toiDa: nd.coGioiHan ? nd.toiDa : 0,
        kyTen: nd.coGioiHan && nd.ky ? TEN_KY[nd.ky] : null,
        daLamTrongKy: trongKy.length,
        daXacNhan: cuaToi.filter(
          (n) => n.maNv === nd.ma && n.trangThai === "DA_XAC_NHAN",
        ).length,
        dangCho: cuaToi.filter(
          (n) => n.maNv === nd.ma && n.trangThai === "CHO_XAC_NHAN",
        ).length,
      };
    });

  const loiChuc = bang.get("NV16");
  return {
    /** Ban Điều hành tắt cả tính năng: chỉ xem lại, không gửi mới */
    tamDung: !tinhNang.nhiemVu,
    /** Nhiệm vụ Lời chúc sinh nhật đang bật (điểm hiện ở ô sinh nhật) */
    loiChuc:
      tinhNang.nhiemVu && loiChuc?.bat
        ? { diem: loiChuc.diem, gioiHan: loiChuc.gioiHan }
        : null,
    nhiemVu,
    lichSu: cuaToi.slice(0, 40).map((n) => ({
      id: n.id,
      maNv: n.maNv,
      ten: bang.get(n.maNv)?.ten ?? n.maNv,
      trangThai: n.trangThai,
      cach: n.cach,
      moTa: n.moTa,
      lyDo: n.lyDo,
      diem: n.diem,
      lienQuan: n.lienQuanMemberId
        ? (tenLienQuan.get(n.lienQuanMemberId) ?? null)
        : null,
      ngay: n.createdAt.toISOString(),
    })),
    nhoXacNhan: nhoToi.map((n) => {
      const m = n.memberId ? tenNguoiNho.get(n.memberId) : null;
      return {
        id: n.id,
        ten: bang.get(n.maNv)?.ten ?? n.maNv,
        nguoiNho: m
          ? `${m.name} – ${tenDoanhNghiep(m.company)}`
          : "Một hội viên",
        moTa: n.moTa,
        ngay: n.createdAt.toISOString(),
      };
    }),
    sinhNhat,
  };
}
