import { prisma } from "../src/lib/prisma";

/**
 * Đếm nhanh xem dữ liệu đã đủ để hiện hai tính năng mới trên Mini App chưa:
 * huy hiệu chức danh trong Hội (cột `hoiRole`) và khối sinh nhật (`birthday`).
 * Chạy: npx tsx scripts/dem-chuc-danh.ts
 */
async function main() {
  const coChucDanh = await prisma.member.count({ where: { hoiRole: { not: null } } });
  const vd = await prisma.member.findMany({
    where: { hoiRole: { not: null } },
    take: 8,
    select: { name: true, hoiRole: true },
  });
  console.log("Hội viên có chức danh trong Hội:", coChucDanh);
  vd.forEach((m) => console.log("  -", m.name, "|", m.hoiRole));

  const coNgaySinh = await prisma.member.count({ where: { birthday: { not: null } } });
  const thang = new Date().getMonth() + 1;
  const tatCa = await prisma.member.findMany({
    where: { birthday: { not: null }, active: true },
    select: { birthday: true },
  });
  const trongThang = tatCa.filter((m) => m.birthday!.getMonth() + 1 === thang).length;

  console.log("Hội viên có ngày sinh:", coNgaySinh);
  console.log(`Sinh nhật trong tháng ${thang}:`, trongThang);
}

main().finally(() => prisma.$disconnect());
