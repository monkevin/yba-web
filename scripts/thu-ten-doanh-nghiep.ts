/**
 * Xem trước cách hiển thị tên doanh nghiệp sau khi chuẩn hoá.
 *   npx tsx scripts/thu-ten-doanh-nghiep.ts
 * Dùng để soát các tên bị đổi sai (viết tắt bị hạ chữ) rồi bổ sung vào danh sách
 * VIET_TAT trong src/lib/ten-doanh-nghiep.ts.
 */
import { PrismaClient } from "@prisma/client";
import { tenDoanhNghiep } from "../src/lib/ten-doanh-nghiep";

const prisma = new PrismaClient();

async function main() {
  const ds = await prisma.member.findMany({
    select: { company: true },
    orderBy: { company: "asc" },
  });
  let doi = 0;
  for (const { company } of ds) {
    const moi = tenDoanhNghiep(company);
    if (moi !== company) {
      doi++;
      console.log(moi);
    }
  }
  console.log(`\n${doi}/${ds.length} tên được chuẩn hoá cách hiển thị.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
