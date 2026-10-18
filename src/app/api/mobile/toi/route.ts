import { docHoiVien, docPhien } from "@/lib/mobile-auth";
import { moJson, moOptions } from "@/lib/mobile-cors";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";

export const OPTIONS = moOptions;

/**
 * Hồ sơ của chính người đang mở app — dùng để khôi phục phiên khi mở lại.
 * GET /api/mobile/toi  (header: x-yba-phien)
 */
export async function GET(req: Request) {
  const phien = await docPhien(req);
  if (!phien) return moJson({ error: "Phiên không hợp lệ hoặc đã hết hạn" }, 401);

  const member = await docHoiVien(req);

  return moJson({
    laHoiVien: !!member,
    member: member ? { ...member, company: tenDoanhNghiep(member.company) } : null,
  });
}
