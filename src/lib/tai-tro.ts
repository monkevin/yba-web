/**
 * Bậc tài trợ dùng chung cho trang vinh danh và trang quản trị.
 * Thứ tự trong mảng chính là thứ tự trang trọng giảm dần.
 */
export const BAC_TAI_TRO = [
  {
    ten: "Kim cương",
    icon: "💎",
    lop: "from-sky-500 to-indigo-600",
    vien: "ring-indigo-300",
  },
  { ten: "Vàng", icon: "🥇", lop: "from-amber-400 to-amber-600", vien: "ring-amber-300" },
  { ten: "Bạc", icon: "🥈", lop: "from-slate-300 to-slate-500", vien: "ring-slate-300" },
  { ten: "Đồng", icon: "🥉", lop: "from-orange-400 to-orange-700", vien: "ring-orange-300" },
  {
    ten: "Đồng hành",
    icon: "🤝",
    lop: "from-navy-500 to-navy-700",
    vien: "ring-navy-200",
  },
] as const;

/**
 * Trạng thái lượt tài trợ CHƯA chốt: "Huỷ", và "Đang vận động" (Trung tâm sự
 * kiện ghi NTT đang liên hệ để Ban Tài trợ theo dõi). Các lượt này KHÔNG
 * được vinh danh ở /tai-tro và KHÔNG tính điểm đóng góp — mọi chỗ cộng dồn
 * TaiTroSuKien phải lọc `trangThai: { notIn: TT_TAI_TRO_CHUA_CHOT }`.
 */
export const TT_TAI_TRO_CHUA_CHOT = ["Huỷ", "Đang vận động"];

/** Trạng thái chọn được ở Trung tâm sự kiện (giữ nguyên 3 giá trị file mẫu cũ). */
export const TRANG_THAI_TAI_TRO = [
  "Đang vận động",
  "Cam kết",
  "Còn thiếu",
  "Hoàn tất",
  "Huỷ",
] as const;

export function bacTaiTro(ten: string | null | undefined) {
  return BAC_TAI_TRO.find((b) => b.ten === ten) ?? BAC_TAI_TRO[BAC_TAI_TRO.length - 1];
}

/** Thứ hạng để sắp xếp: Kim cương = 0. */
export function thuHangBac(ten: string | null | undefined): number {
  const i = BAC_TAI_TRO.findIndex((b) => b.ten === ten);
  return i < 0 ? BAC_TAI_TRO.length : i;
}

/** Số tiền dạng "1,2 tỷ" / "50 triệu" cho dễ đọc. */
export function tienGon(n: number): string {
  if (n >= 1_000_000_000)
    return `${(n / 1_000_000_000).toFixed(1).replace(".0", "").replace(".", ",")} tỷ`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)} triệu`;
  return n.toLocaleString("vi-VN");
}
