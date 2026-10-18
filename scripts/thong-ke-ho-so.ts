/** Xem nhanh mức độ đầy đủ của hồ sơ doanh nghiệp. npm run thong-ke */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [tong, coWeb, coSanPham, coLogo, coMoTaDai, coSanPhamRieng, coAnhBia] =
    await Promise.all([
      prisma.member.count(),
      prisma.member.count({ where: { website: { not: null } } }),
      prisma.member.count({ where: { offering: { not: null } } }),
      prisma.member.count({ where: { logo: { not: null } } }),
      prisma.member.count({ where: { description: { not: null } } }),
      prisma.product.count(),
      prisma.member.count({ where: { coverImage: { not: null } } }),
    ]);

  console.log(`Tổng hội viên .................. ${tong}`);
  console.log(`  có website ................... ${coWeb}`);
  console.log(`  có mô tả sản phẩm (từ Sheet) . ${coSanPham}`);
  console.log(`  có giới thiệu dài ............ ${coMoTaDai}`);
  console.log(`  có logo ...................... ${coLogo}`);
  console.log(`  có ảnh bìa ................... ${coAnhBia}`);
  console.log(`Số sản phẩm đã khai ............ ${coSanPhamRieng}`);

  const mau = await prisma.member.findMany({
    where: { website: { not: null } },
    select: { company: true, website: true },
    take: 12,
    orderBy: { code: "asc" },
  });
  console.log("\n12 website đầu tiên:");
  for (const m of mau) console.log(`  ${m.website}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
