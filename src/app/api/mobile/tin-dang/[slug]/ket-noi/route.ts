import { prisma } from "@/lib/prisma";
import { docHoiVien } from "@/lib/mobile-auth";
import { moJson, moOptions } from "@/lib/mobile-cors";

export const OPTIONS = moOptions;

/**
 * Hội viên bấm "Kết nối" trên một tin chợ nhu cầu.
 * POST /api/mobile/tin-dang/:slug/ket-noi  { message? }
 *
 * Ghi vào `ListingContact` — chủ tin xem được ai quan tâm ở khu nội bộ trên
 * web. Đây là lead thật, không phải nút bấm cho vui.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const member = await docHoiVien(req);
  if (!member) return moJson({ error: "Cần xác thực hội viên" }, 401);

  const { slug } = await params;
  const tin = await prisma.listing.findUnique({
    where: { slug },
    select: { id: true, memberId: true, title: true },
  });
  if (!tin) return moJson({ error: "Không tìm thấy tin đăng" }, 404);
  if (tin.memberId === member.id) {
    return moJson({ error: "Đây là tin của chính doanh nghiệp anh/chị" }, 400);
  }

  let than: { message?: string } = {};
  try {
    than = await req.json();
  } catch {
    /* không có thân cũng được */
  }

  // Đã bấm rồi thì không tạo thêm bản ghi — tránh thổi phồng số lượt quan tâm
  const daCo = await prisma.listingContact.findFirst({
    where: { listingId: tin.id, memberId: member.id },
    select: { id: true },
  });

  if (!daCo) {
    await prisma.listingContact.create({
      data: {
        listingId: tin.id,
        memberId: member.id,
        message: than.message ? String(than.message).slice(0, 500) : null,
      },
    });
  }

  const soQuanTam = await prisma.listingContact.count({ where: { listingId: tin.id } });

  return moJson({ ok: true, daGuiTruoc: !!daCo, soQuanTam });
}
