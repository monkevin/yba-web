/**
 * Chuyến "Đi thăm doanh nghiệp hội viên" — luồng ba bước:
 *
 *   DE_XUAT   hội viên chủ nhà mời Chi hội đến thăm
 *   DA_DUYET  Ban Chủ nhiệm duyệt và MỞ ĐĂNG KÝ cho hội viên khác
 *   DA_DONG   đã đủ người / hết hạn đăng ký, chốt danh sách
 *   DA_TO_CHUC chuyến đi đã diễn ra
 *   TU_CHOI   chưa sắp xếp được
 *
 * File chỉ chứa hằng và hàm thuần nên client component dùng được.
 */

export const TRANG_THAI_THAM = {
  DE_XUAT: "DE_XUAT",
  DA_DUYET: "DA_DUYET",
  DA_DONG: "DA_DONG",
  DA_TO_CHUC: "DA_TO_CHUC",
  TU_CHOI: "TU_CHOI",
} as const;

export type TrangThaiTham =
  (typeof TRANG_THAI_THAM)[keyof typeof TRANG_THAI_THAM];

export const NHAN_THAM: Record<
  string,
  { ten: string; lop: string; moTa: string }
> = {
  DE_XUAT: {
    ten: "Chờ Ban Chủ nhiệm duyệt",
    lop: "bg-amber-50 text-amber-700 ring-amber-200",
    moTa: "Doanh nghiệp đã gửi lời mời, Ban Chủ nhiệm đang xem xét.",
  },
  DA_DUYET: {
    ten: "Đang mở đăng ký",
    lop: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    moTa: "Hội viên đăng ký tham gia được ngay.",
  },
  DA_DONG: {
    ten: "Đã đóng đăng ký",
    lop: "bg-slate-100 text-slate-600 ring-slate-200",
    moTa: "Danh sách đã chốt, Chi hội đang chuẩn bị chuyến đi.",
  },
  DA_TO_CHUC: {
    ten: "Đã tổ chức",
    lop: "bg-navy-50 text-navy-700 ring-navy-200",
    moTa: "Chuyến thăm đã diễn ra.",
  },
  TU_CHOI: {
    ten: "Chưa sắp xếp được",
    lop: "bg-slate-100 text-slate-500 ring-slate-200",
    moTa: "Ban Chủ nhiệm chưa bố trí được lịch cho chuyến này.",
  },
};

/** Chuyến đang cho hội viên đăng ký. */
export function dangMoDangKy(status: string): boolean {
  return status === TRANG_THAI_THAM.DA_DUYET;
}

/** Chuyến được phép hiện ra khu công khai. */
export function thamCongKhai() {
  return {
    status: {
      in: [
        TRANG_THAI_THAM.DA_DUYET,
        TRANG_THAI_THAM.DA_DONG,
        TRANG_THAI_THAM.DA_TO_CHUC,
      ],
    },
  };
}

/** Còn bao nhiêu chỗ; null nếu không giới hạn. */
export function conCho(
  soLuongToiDa: number | null,
  daDangKy: number
): number | null {
  if (!soLuongToiDa) return null;
  return Math.max(0, soLuongToiDa - daDangKy);
}
