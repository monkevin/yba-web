/**
 * Quy tắc thuần của tin nhu cầu mua / bán.
 * File này được import bởi CẢ client component → không được import `@/lib/auth`
 * hay `@/lib/prisma` vào đây (xem AGENTS.md).
 */

export const LOAI_TIN = {
  CAN_MUA: "CAN_MUA",
  CAN_BAN: "CAN_BAN",
} as const;
export type LoaiTin = (typeof LOAI_TIN)[keyof typeof LOAI_TIN];

export const LOAI_TIN_LABEL: Record<string, string> = {
  CAN_MUA: "Cần mua",
  CAN_BAN: "Cần bán",
};

/**
 * Điều kiện hợp tác hội viên tự tích khi đăng tin — giúp bên kia biết trước
 * cách làm việc, đỡ mất một vòng hỏi đáp. Lưu ở `Listing.dieuKien` dạng chuỗi
 * JSON mảng mã.
 */
export const DIEU_KIEN: Record<string, string> = {
  CO_HOP_DONG: "Có hợp đồng",
  CO_TAM_UNG: "Có tạm ứng",
  NGHIEM_THU_TIEN_DO: "Nghiệm thu theo tiến độ",
  UU_TIEN_HOI_VIEN: "Ưu tiên hội viên",
  THANH_TOAN_NGAY: "Thanh toán ngay",
  NHAN_DON_DAI_HAN: "Nhận đơn dài hạn",
};

export const TRANG_THAI_TIN = {
  CHO_DUYET: "CHO_DUYET",
  DANG_HIEN: "DANG_HIEN",
  HET_HAN: "HET_HAN",
  AN: "AN",
  TU_CHOI: "TU_CHOI",
} as const;
export type TrangThaiTin =
  (typeof TRANG_THAI_TIN)[keyof typeof TRANG_THAI_TIN];

export const TRANG_THAI_TIN_LABEL: Record<string, string> = {
  CHO_DUYET: "Chờ duyệt",
  DANG_HIEN: "Đang hiển thị",
  HET_HAN: "Hết hạn",
  AN: "Đã ẩn",
  TU_CHOI: "Bị từ chối",
};

export const TRANG_THAI_TIN_CLASS: Record<string, string> = {
  CHO_DUYET: "bg-amber-50 text-amber-700 ring-amber-200",
  DANG_HIEN: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  HET_HAN: "bg-slate-100 text-slate-600 ring-slate-200",
  AN: "bg-slate-100 text-slate-600 ring-slate-200",
  TU_CHOI: "bg-do-50 text-do-700 ring-do-100",
};

/** Số ngày tin được hiển thị trước khi tự hết hạn. */
export const SO_NGAY_HIEN = 90;

export function ngayHetHan(tuNgay = new Date()): Date {
  const d = new Date(tuNgay);
  d.setDate(d.getDate() + SO_NGAY_HIEN);
  return d;
}

/** Còn bao nhiêu ngày nữa thì tin hết hạn; âm nghĩa là đã quá hạn. */
export function conLaiNgay(expiresAt: Date | null): number | null {
  if (!expiresAt) return null;
  return Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000);
}
