/** Nhãn màu cho từng hạng hội viên (theo bộ nhận diện navy + đỏ + vàng). */
export const MEMBER_TYPE_CLASS: Record<string, string> = {
  "Hội viên vàng": "bg-vang-500/15 text-vang-600 ring-vang-500/30",
  "Sáng lập viên": "bg-do-50 text-do-700 ring-do-200",
  "Ban chấp hành": "bg-navy-600 text-white ring-navy-700",
  "Hội viên liên kết": "bg-slate-100 text-slate-600 ring-slate-200",
  "CỰU CT": "bg-navy-100 text-navy-700 ring-navy-200",
};

export function memberTypeClass(type?: string | null): string {
  if (!type) return "bg-navy-50 text-navy-700 ring-navy-100";
  return MEMBER_TYPE_CLASS[type] ?? "bg-navy-50 text-navy-700 ring-navy-100";
}

/** Các hạng hội viên gợi ý trong ô chọn. */
export const MEMBER_TYPES = [
  "Hội viên",
  "Hội viên vàng",
  "Hội viên liên kết",
  "Sáng lập viên",
  "Ban chấp hành",
  "CỰU CT",
];
