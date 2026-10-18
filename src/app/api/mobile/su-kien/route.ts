import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { moJson, moOptions } from "@/lib/mobile-cors";

export const OPTIONS = moOptions;

const MOI_TRANG = 20;

/**
 * Sự kiện & chương trình — CÙNG dữ liệu với /su-kien trên web.
 * GET /api/mobile/su-kien?mang=&chuongtrinh=&trang=1
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const mang = sp.get("mang")?.trim() ?? "";
  const chuongTrinh = sp.get("chuongtrinh")?.trim() ?? "";
  const trang = Math.max(1, Number(sp.get("trang") ?? 1) || 1);

  const where: Prisma.EventWhereInput = { published: true };
  if (mang) where.activityGroup = mang;
  if (chuongTrinh) where.seriesName = chuongTrinh;

  const [tong, dsSuKien] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      orderBy: { startAt: "desc" },
      skip: (trang - 1) * MOI_TRANG,
      take: MOI_TRANG,
      select: {
        slug: true,
        title: true,
        summary: true,
        coverImage: true,
        startAt: true,
        endAt: true,
        location: true,
        seriesName: true,
        activityGroup: true,
        allowSignup: true,
        capacity: true,
      },
    }),
  ]);

  return moJson({
    tong,
    trang,
    soTrang: Math.max(1, Math.ceil(tong / MOI_TRANG)),
    suKien: dsSuKien,
  });
}
