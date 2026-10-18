/**
 * Chuẩn hoá chuỗi để tìm kiếm tiếng Việt: bỏ dấu, đổi đ→d, viết thường, gộp
 * khoảng trắng. Nhờ vậy gõ "hoang vy", "Hoàng Vy" hay "HOÀNG VY" đều khớp như
 * nhau — khắc phục việc SQLite phân biệt hoa/thường và phân biệt dấu.
 */
export function normalizeSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // bỏ dấu thanh & dấu mũ
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Gộp các trường có thể tìm của một hội viên thành một chuỗi đã chuẩn hoá. */
export function buildMemberSearchText(m: {
  code?: string | null;
  name?: string | null;
  company?: string | null;
  industry?: string | null;
  offering?: string | null;
  needing?: string | null;
  district?: string | null;
  position?: string | null;
  phone?: string | null;
  email?: string | null;
  memberType?: string | null;
}): string {
  return normalizeSearch(
    [
      m.code,
      m.name,
      m.company,
      m.industry,
      m.offering,
      m.needing,
      m.district,
      m.position,
      m.phone,
      m.email,
      m.memberType,
    ]
      .filter(Boolean)
      .join(" ")
  );
}
