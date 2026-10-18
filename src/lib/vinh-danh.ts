/**
 * Hạng mục vinh danh chuẩn của Chi hội. Ban Chủ nhiệm vẫn gõ được hạng mục
 * riêng, nhưng ba hạng mục dưới đây sinh được tự động từ số liệu giao thương.
 */
export const HANG_MUC = {
  BAN_RA: "Doanh số giao thương cao nhất",
  MUA_VAO: "Ưu tiên mua hàng hội viên",
  KET_NOI: "Kết nối giao thương xuất sắc",
} as const;

/** Thứ tự hiển thị các hạng mục trên trang vinh danh công khai. */
export const THU_TU_HANG_MUC: string[] = [
  HANG_MUC.BAN_RA,
  HANG_MUC.MUA_VAO,
  HANG_MUC.KET_NOI,
];

export const HANG_MUC_MO_TA: Record<string, string> = {
  [HANG_MUC.BAN_RA]:
    "Doanh nghiệp cung cấp nhiều hàng hoá, dịch vụ nhất cho hội viên trong Hội.",
  [HANG_MUC.MUA_VAO]:
    "Doanh nghiệp chủ động ưu tiên mua hàng của hội viên thay vì tìm ra ngoài.",
  [HANG_MUC.KET_NOI]:
    "Hội viên đứng ra giới thiệu, kết nối các doanh nghiệp gặp được nhau.",
};

export const HANG_MUC_ICON: Record<string, string> = {
  [HANG_MUC.BAN_RA]: "🏆",
  [HANG_MUC.MUA_VAO]: "🤝",
  [HANG_MUC.KET_NOI]: "🔗",
};

/** Huy hiệu theo thứ hạng: 1 vàng, 2 bạc, 3 đồng. */
export const HUY_HIEU: Record<number, { nhan: string; lop: string }> = {
  1: { nhan: "Hạng Nhất", lop: "bg-vang-500 text-white ring-vang-600" },
  2: { nhan: "Hạng Nhì", lop: "bg-slate-300 text-slate-800 ring-slate-400" },
  3: { nhan: "Hạng Ba", lop: "bg-amber-700 text-white ring-amber-800" },
};
