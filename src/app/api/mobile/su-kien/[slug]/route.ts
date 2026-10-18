import { prisma } from "@/lib/prisma";
import { moJson, moOptions } from "@/lib/mobile-cors";

export const OPTIONS = moOptions;

/** Chi tiết sự kiện + album ảnh. GET /api/mobile/su-kien/:slug */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const e = await prisma.event.findFirst({
    where: { slug, published: true },
    select: {
      slug: true,
      title: true,
      summary: true,
      content: true,
      coverImage: true,
      gallery: true,
      startAt: true,
      endAt: true,
      location: true,
      seriesName: true,
      activityGroup: true,
      allowSignup: true,
      capacity: true,
      yNghia: true,
    },
  });

  if (!e) return moJson({ error: "Không tìm thấy sự kiện" }, 404);

  let gallery: string[] = [];
  try {
    const a = JSON.parse(e.gallery ?? "[]");
    gallery = Array.isArray(a) ? a.filter((x) => typeof x === "string") : [];
  } catch {
    gallery = [];
  }

  return moJson({ suKien: { ...e, gallery } });
}
