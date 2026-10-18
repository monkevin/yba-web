/**
 * Tạo sẵn dự án kêu gọi và các gói tài trợ (100 / 50 / 30 / 10 triệu).
 * Chạy được nhiều lần — đã có thì bỏ qua, không ghi đè nội dung Ban Chủ nhiệm
 * đã sửa.
 *
 *   npm run tao-goi-tai-tro
 */
import { prisma } from "../src/lib/prisma";
import { DU_AN_MAC_DINH, GOI_MAC_DINH } from "../prisma/tai-tro-mac-dinh";

(async () => {
  let themDuAn = 0;
  let themGoi = 0;

  for (const d of DU_AN_MAC_DINH) {
    let duAn = await prisma.duAnTaiTro.findUnique({ where: { slug: d.slug } });
    if (!duAn) {
      duAn = await prisma.duAnTaiTro.create({ data: d });
      themDuAn++;
      console.log(`  + Dự án: ${d.ten}`);
    }

    for (const g of GOI_MAC_DINH) {
      const co = await prisma.goiTaiTro.findFirst({
        where: { duAnId: duAn.id, ten: g.ten },
        select: { id: true },
      });
      if (co) continue;
      await prisma.goiTaiTro.create({ data: { ...g, duAnId: duAn.id } });
      themGoi++;
    }
  }

  const tongDuAn = await prisma.duAnTaiTro.count();
  const tongGoi = await prisma.goiTaiTro.count();
  console.log(
    `\nThêm ${themDuAn} dự án, ${themGoi} gói. Hiện có ${tongDuAn} dự án · ${tongGoi} gói.`
  );
  await prisma.$disconnect();
})();
