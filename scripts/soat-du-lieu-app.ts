import { prisma } from "../src/lib/prisma";

/**
 * Soát dữ liệu cho bốn màn mới của Mini App (Ban Chủ nhiệm, video, tài trợ,
 * thăm doanh nghiệp) — xem chỗ nào còn trống để Ban Thư ký nhập bổ sung.
 * Chạy: npx tsx scripts/soat-du-lieu-app.ts
 */
async function main() {
  const nhom = await prisma.leader.groupBy({
    by: ["group"],
    where: { active: true },
    _count: { _all: true },
  });
  console.log("— Ban Chủ nhiệm theo nhóm —");
  nhom.forEach((n) => console.log(`  ${n.group}: ${n._count._all}`));

  const tham = await prisma.thamDoanhNghiep.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  console.log("— Thăm doanh nghiệp theo trạng thái —");
  if (!tham.length) console.log("  (chưa có bản ghi nào)");
  tham.forEach((t) => console.log(`  ${t.status}: ${t._count._all}`));

  const video = await prisma.video.count({ where: { published: true } });
  const duAn = await prisma.duAnTaiTro.count({ where: { active: true } });
  console.log("— Khác —");
  console.log("  Video đang hiện:", video);
  console.log("  Chương trình tài trợ đang mở:", duAn);
}

main().finally(() => prisma.$disconnect());
