/**
 * Tính lại trường searchText cho toàn bộ hội viên đang có.
 * Chạy một lần sau khi thêm cột searchText:  npm run backfill-search
 */
import { PrismaClient } from "@prisma/client";
import { buildMemberSearchText } from "../src/lib/search";

const prisma = new PrismaClient();

async function main() {
  const members = await prisma.member.findMany();
  let n = 0;
  for (const m of members) {
    await prisma.member.update({
      where: { id: m.id },
      data: { searchText: buildMemberSearchText(m) },
    });
    n++;
  }
  console.log(`Đã cập nhật searchText cho ${n} hội viên.`);
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
