import { normalizeSearch } from "@/lib/search";

/**
 * Tạo đường dẫn thân thiện từ tiếng Việt: "Công ty TNHH Hoàng Vy" →
 * "cong-ty-tnhh-hoang-vy". Dùng chung cho hồ sơ doanh nghiệp, tin đăng, bài viết.
 */
export function toSlug(input: string): string {
  return normalizeSearch(input)
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Tạo slug chắc chắn chưa trùng. `exists` trả về true nếu slug đã có trong DB.
 * Trùng thì thêm hậu tố -2, -3...
 */
export async function uniqueSlug(
  input: string,
  exists: (slug: string) => Promise<boolean>,
  fallback = "muc"
): Promise<string> {
  const base = toSlug(input) || fallback;
  let slug = base;
  let n = 1;
  while (await exists(slug)) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}
