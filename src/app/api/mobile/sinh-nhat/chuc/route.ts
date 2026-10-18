import { prisma } from "@/lib/prisma";
import { docHoiVien } from "@/lib/mobile-auth";
import { moJson, moOptions } from "@/lib/mobile-cors";

export const OPTIONS = moOptions;

/**
 * Gửi lời chúc sinh nhật cho một hội viên, hiện luôn trong Mini App.
 * POST /api/mobile/sinh-nhat/chuc  { slug, noiDung? }
 *
 * Mỗi người chỉ chúc một người MỘT LẦN mỗi năm (khoá `@@unique` trong schema).
 * Bấm lần hai không báo lỗi — trả về số lời chúc hiện tại để giao diện đứng yên,
 * vì với hội viên thì "đã chúc rồi" không phải là chuyện sai.
 */
export async function POST(req: Request) {
  const member = await docHoiVien(req);
  if (!member) return moJson({ error: "Cần xác thực hội viên" }, 401);

  let than: Record<string, unknown>;
  try {
    than = await req.json();
  } catch {
    return moJson({ error: "Dữ liệu gửi lên không hợp lệ" }, 400);
  }

  const slug = String(than.slug ?? "").trim();
  if (!slug) return moJson({ error: "Thiếu hội viên cần chúc" }, 400);

  const nhan = await prisma.member.findFirst({
    where: { slug, active: true },
    select: { id: true, name: true },
  });
  if (!nhan) return moJson({ error: "Không tìm thấy hội viên" }, 404);
  if (nhan.id === member.id) {
    return moJson({ error: "Không tự chúc mình được đâu anh/chị" }, 400);
  }

  const nam = new Date().getFullYear();
  const noiDung = than.noiDung ? String(than.noiDung).trim().slice(0, 300) : null;

  try {
    await prisma.loiChuc.create({
      data: { guiId: member.id, nhanId: nhan.id, nam, noiDung },
    });
  } catch {
    /* đã chúc năm nay rồi — coi như thành công, không làm phiền người dùng */
  }

  const soLoiChuc = await prisma.loiChuc.count({ where: { nhanId: nhan.id, nam } });
  return moJson({ ok: true, soLoiChuc, toiDaChuc: true });
}
