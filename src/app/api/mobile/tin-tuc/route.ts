import { prisma } from "@/lib/prisma";
import { moJson, moOptions } from "@/lib/mobile-cors";

export const OPTIONS = moOptions;

const MOI_TRANG = 20;

/**
 * Tin tức / bản tin / thông báo — CÙNG dữ liệu với /tin-tuc trên web.
 * GET /api/mobile/tin-tuc?loai=TIN_TUC|BAN_TIN|THONG_BAO&chuyenmuc=&trang=1
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const loai = sp.get("loai")?.trim() ?? "";
  const chuyenMuc = sp.get("chuyenmuc")?.trim() ?? "";
  const trang = Math.max(1, Number(sp.get("trang") ?? 1) || 1);

  const where = {
    published: true,
    ...(loai ? { type: loai } : {}),
    ...(chuyenMuc ? { chuyenMuc } : {}),
  };

  const [tong, bai] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      skip: (trang - 1) * MOI_TRANG,
      take: MOI_TRANG,
      select: {
        slug: true,
        title: true,
        type: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
        chuyenMuc: true,
        nguon: true,
      },
    }),
  ]);

  return moJson({
    tong,
    trang,
    soTrang: Math.max(1, Math.ceil(tong / MOI_TRANG)),
    bai,
  });
}
