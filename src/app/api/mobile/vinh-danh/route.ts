import { prisma } from "@/lib/prisma";
import { moJson, moOptions } from "@/lib/mobile-cors";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";

export const OPTIONS = moOptions;

/**
 * Vinh danh hội viên (mục 10).
 * GET /api/mobile/vinh-danh
 *
 * Chỉ trả các kỳ đã `published` — Ban Chủ nhiệm chốt kết quả rồi mới công bố,
 * không để danh sách nháp lọt ra ngoài.
 *
 * Chưa có kỳ nào thì trả mảng rỗng kèm `chuaCoKy` để Mini App nói rõ "Chi hội
 * chưa công bố kỳ vinh danh nào" — thà nói thật còn hơn hiện dữ liệu bịa.
 */
export async function GET() {
  const ky = await prisma.awardPeriod.findFirst({
    where: { published: true },
    orderBy: { to: "desc" },
    select: {
      slug: true,
      name: true,
      from: true,
      to: true,
      note: true,
      awards: {
        orderBy: [{ category: "asc" }, { rank: "asc" }],
        select: {
          category: true,
          rank: true,
          metric: true,
          note: true,
          member: {
            select: {
              slug: true,
              name: true,
              company: true,
              avatar: true,
              logo: true,
              category: { select: { name: true, icon: true } },
            },
          },
        },
      },
    },
  });

  if (!ky) return moJson({ chuaCoKy: true, ky: null, hangMuc: [] });

  // Gom theo hạng mục để màn hình dựng từng khối, không phải tự nhóm lại
  const gom = new Map<string, typeof ky.awards>();
  for (const a of ky.awards) {
    const ds = gom.get(a.category) ?? [];
    ds.push(a);
    gom.set(a.category, ds);
  }

  return moJson({
    chuaCoKy: false,
    ky: { slug: ky.slug, name: ky.name, from: ky.from, to: ky.to, note: ky.note },
    hangMuc: [...gom.entries()].map(([ten, ds]) => ({
      ten,
      giai: ds.map((a) => ({
        rank: a.rank,
        metric: a.metric,
        note: a.note,
        member: { ...a.member, company: tenDoanhNghiep(a.member.company) },
      })),
    })),
  });
}
