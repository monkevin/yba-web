import { categoriesWithCount } from "@/lib/public";
import { moJson, moOptions } from "@/lib/mobile-cors";

export const OPTIONS = moOptions;

/** Danh mục ngành nghề, dùng cho bộ lọc danh bạ + chợ nhu cầu trong Mini App. */
export async function GET() {
  const cats = await categoriesWithCount();
  return moJson({ danhMuc: cats });
}
