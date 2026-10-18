/**
 * Sinh đường dẫn riêng cho từng hoạt động trong lịch để có trang chi tiết.
 *
 *   npm run slug-lich
 */
import { prisma } from "../src/lib/prisma";
import { uniqueSlug } from "../src/lib/slug";

(async () => {
  const ds = await prisma.lichHoatDong.findMany({
    where: { slug: null },
    orderBy: { tuNgay: "asc" },
    select: { id: true, tieuDe: true, tuNgay: true },
  });

  for (const m of ds) {
    // Chương trình thường niên hay trùng tên nên gắn thêm năm cho khỏi đụng
    const goc = `${m.tieuDe} ${m.tuNgay.getFullYear()}`;
    const slug = await uniqueSlug(
      goc,
      async (s) => !!(await prisma.lichHoatDong.findUnique({ where: { slug: s } }))
    );
    await prisma.lichHoatDong.update({ where: { id: m.id }, data: { slug } });
    console.log(`  ${m.tieuDe.slice(0, 50)} → /lich-hoat-dong/${slug}`);
  }

  console.log(`\nĐã tạo ${ds.length} đường dẫn.`);
  await prisma.$disconnect();
})();
