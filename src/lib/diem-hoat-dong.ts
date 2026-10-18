import { prisma } from "@/lib/prisma";
import { DEAL_STATUS } from "@/lib/deal";
import { TT_TAI_TRO_CHUA_CHOT } from "@/lib/tai-tro";

/**
 * Điểm hoạt động hội viên (YBA Activity Score).
 *
 * Nguyên tắc anh Khang đặt ra: **KHÔNG gộp thành một bảng xếp hạng duy nhất**,
 * vì như vậy biến sinh hoạt Hội thành cuộc đua tiền bạc — doanh nghiệp lớn
 * luôn thắng. Chia thành NĂM chỉ số độc lập để mỗi hội viên mạnh ở mảng nào
 * được ghi nhận ở mảng đó: người hay đi sự kiện, người hay giới thiệu mối,
 * người tài trợ, người bán được hàng — đều có chỗ đứng riêng.
 *
 * Mọi con số tính từ dữ liệu CÓ THẬT trong hệ thống, không ai tự khai điểm.
 */

export const CHI_SO = {
  KET_NOI: "KET_NOI",
  DONG_GOP: "DONG_GOP",
  HOAT_DONG: "HOAT_DONG",
  GIAO_THUONG: "GIAO_THUONG",
  LAN_TOA: "LAN_TOA",
} as const;

export const TEN_CHI_SO: Record<string, string> = {
  KET_NOI: "Kết nối",
  DONG_GOP: "Đóng góp",
  HOAT_DONG: "Hoạt động",
  GIAO_THUONG: "Giao thương",
  LAN_TOA: "Lan toả",
};

export const MO_TA_CHI_SO: Record<string, string> = {
  KET_NOI: "Giới thiệu hội viên gặp nhau, kết nối ra đơn hàng",
  DONG_GOP: "Tài trợ chương trình, tham gia Ban Tổ chức",
  HOAT_DONG: "Có mặt tại các buổi sinh hoạt của Chi hội",
  GIAO_THUONG: "Mua bán thật với hội viên khác",
  LAN_TOA: "Đăng tin, dành ưu đãi cho hội viên",
};

/** Thang điểm — theo đúng mức anh Khang nêu trong đặc tả mục 7. */
export const DIEM = {
  THAM_SU_KIEN: 5,
  GIOI_THIEU_GIAO_DICH: 10,
  MUA_CUA_HOI_VIEN: 10,
  BAN_CHO_HOI_VIEN: 10,
  TAI_TRO: 20,
  THAM_GIA_BTC: 10,
  DANG_UU_DAI: 5,
  DANG_TIN: 2,
} as const;

export type ThongKeHoiVien = {
  nam: number;
  diem: Record<string, number>;
  chiTiet: {
    soSuKienThamDu: number;
    soSuKienTrongNam: number;
    soGiaoDichBan: number;
    soGiaoDichMua: number;
    giaTriGiaoThuong: number;
    soLanGioiThieu: number;
    soLanTaiTro: number;
    giaTriTaiTro: number;
    soLanTrongBTC: number;
    soTinDang: number;
    soUuDai: number;
    soLeadNhanDuoc: number;
  };
};

/**
 * Tính điểm và số liệu đóng góp của một hội viên trong một năm.
 * Đây cũng chính là dữ liệu của "Dashboard đóng góp" (mục 8) — cuối năm Ban
 * Chủ nhiệm có sẵn số liệu để xét vinh danh, không phải ngồi tổng hợp tay.
 */
export async function thongKeHoiVien(
  memberId: string,
  nam = new Date().getFullYear()
): Promise<ThongKeHoiVien> {
  const tuNgay = new Date(nam, 0, 1);
  const denNgay = new Date(nam, 11, 31, 23, 59, 59);
  const trongNam = { gte: tuNgay, lte: denNgay };

  const [
    checkInQuaApp,
    thuKyNhapTay,
    suKienTrongNam,
    ban,
    mua,
    gioiThieu,
    taiTro,
    trongBTC,
    tinDang,
    uuDai,
    leadNhanDuoc,
  ] = await Promise.all([
    // Hai nguồn tham dự, gộp lại rồi mới đếm — xem chú thích dưới
    prisma.thamDuSuKien.findMany({
      where: { memberId, trangThai: "DA_CHECKIN", event: { startAt: trongNam } },
      select: { eventId: true },
    }),
    prisma.nguoiThamDu.findMany({
      where: { memberId, event: { startAt: trongNam } },
      select: { eventId: true },
    }),
    prisma.event.count({ where: { published: true, startAt: trongNam } }),
    prisma.deal.aggregate({
      where: { sellerId: memberId, status: DEAL_STATUS.DA_DUYET, dealDate: trongNam },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.deal.aggregate({
      where: { buyerId: memberId, status: DEAL_STATUS.DA_DUYET, dealDate: trongNam },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.deal.count({
      where: { referrerId: memberId, status: DEAL_STATUS.DA_DUYET, dealDate: trongNam },
    }),
    // Tài trợ tính theo NĂM DIỄN RA sự kiện; bản ghi chưa gắn được sự kiện thì
    // đành lấy ngày nhập. Trước đây không lọc năm nào cả — màn hình ghi "số
    // liệu năm 2026" mà cộng cả các năm trước (anh Khang phát hiện 24/08/2026).
    prisma.taiTroSuKien.aggregate({
      where: {
        memberId,
        trangThai: { notIn: TT_TAI_TRO_CHUA_CHOT },
        OR: [{ event: { startAt: trongNam } }, { eventId: null, createdAt: trongNam }],
      },
      _sum: { giaTri: true },
      _count: { _all: true },
    }),
    // Đếm theo SỰ KIỆN, không theo dòng: một người ở hai ban của cùng sự kiện
    // (Trưởng BTC kiêm Ban Nội dung) chỉ tính một lần "Tham gia Ban tổ chức"
    prisma.banToChuc
      .findMany({ where: { memberId, event: { startAt: trongNam } }, select: { eventId: true }, distinct: ["eventId"] })
      .then((r) => r.length),
    prisma.listing.count({ where: { memberId, createdAt: trongNam } }),
    // Ưu đãi cũng phải lọc theo năm mở, cùng lý do trên
    prisma.uuDai.count({
      where: { memberId, status: "DANG_HIEN", createdAt: trongNam },
    }),
    prisma.uuDaiLead.count({ where: { uuDai: { memberId }, createdAt: trongNam } }),
  ]);

  /**
   * Chỉ số Hoạt động đếm SỐ SỰ KIỆN có mặt, gộp hai nguồn:
   *   1. Hội viên tự quét QR check-in trong Mini App
   *   2. Ban Thư ký nhập danh sách tham dự sau sự kiện (`NguoiThamDu`)
   * Gộp bằng Set để một sự kiện có cả hai nguồn không bị đếm hai lần.
   * Trước đây chỉ đếm nguồn 1 nên hội viên đi họp đều đặn vẫn được 0 điểm —
   * app mới chạy, gần như chưa ai check-in bao giờ.
   */
  const suKienCoMat = new Set<string>([
    ...checkInQuaApp.map((x) => x.eventId),
    ...thuKyNhapTay.map((x) => x.eventId),
  ]);
  const suKienThamDu = suKienCoMat.size;

  const soBan = ban._count._all;
  const soMua = mua._count._all;

  const diem: Record<string, number> = {
    KET_NOI: gioiThieu * DIEM.GIOI_THIEU_GIAO_DICH,
    DONG_GOP: taiTro._count._all * DIEM.TAI_TRO + trongBTC * DIEM.THAM_GIA_BTC,
    HOAT_DONG: suKienThamDu * DIEM.THAM_SU_KIEN,
    GIAO_THUONG: soBan * DIEM.BAN_CHO_HOI_VIEN + soMua * DIEM.MUA_CUA_HOI_VIEN,
    LAN_TOA: uuDai * DIEM.DANG_UU_DAI + tinDang * DIEM.DANG_TIN,
  };

  return {
    nam,
    diem,
    chiTiet: {
      soSuKienThamDu: suKienThamDu,
      soSuKienTrongNam: suKienTrongNam,
      soGiaoDichBan: soBan,
      soGiaoDichMua: soMua,
      giaTriGiaoThuong: (ban._sum.amount ?? 0) + (mua._sum.amount ?? 0),
      soLanGioiThieu: gioiThieu,
      soLanTaiTro: taiTro._count._all,
      giaTriTaiTro: taiTro._sum.giaTri ?? 0,
      soLanTrongBTC: trongBTC,
      soTinDang: tinDang,
      soUuDai: uuDai,
      soLeadNhanDuoc: leadNhanDuoc,
    },
  };
}

/** Tổng điểm — chỉ dùng để so sánh nhanh, KHÔNG hiện thành bảng xếp hạng duy nhất. */
export const tongDiem = (diem: Record<string, number>) =>
  Object.values(diem).reduce((a, b) => a + b, 0);
