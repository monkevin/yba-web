/**
 * Sinh đường dẫn riêng (slug) cho từng thành viên Ban Chủ nhiệm để có trang
 * giới thiệu riêng: /ban-chap-hanh/dang-vien-khang
 *
 *   npm run slug-ban-chu-nhiem
 */
import { prisma } from "../src/lib/prisma";
import { toSlug } from "../src/lib/slug";

(async () => {
  const ds = await prisma.leader.findMany({ orderBy: [{ order: "asc" }] });
  const daDung = new Set(
    ds.map((l) => l.slug).filter((s): s is string => Boolean(s))
  );

  let viet = 0;
  for (const l of ds) {
    if (l.slug) continue;

    // Một người có thể giữ nhiều vai trò ở nhiều ban → tên trùng, thêm số đuôi
    const goc = toSlug(l.name);
    let s = goc;
    let i = 2;
    while (daDung.has(s)) s = `${goc}-${i++}`;
    daDung.add(s);

    await prisma.leader.update({ where: { id: l.id }, data: { slug: s } });
    viet++;
    console.log(`  ${l.name} → /ban-chap-hanh/${s}`);
  }

  console.log(`\nĐã tạo ${viet} đường dẫn (tổng ${ds.length} nhân sự).`);
  await prisma.$disconnect();
})();
