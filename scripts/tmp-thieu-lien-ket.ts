/**
 * Liệt kê hồ sơ đang "trống liên kết": không có website chạy được, không có
 * fanpage, không có bài báo nào. Đây là nhóm cần gắn ít nhất một liên kết thật.
 */
import { prisma } from "../src/lib/prisma";

(async () => {
  const ms = await prisma.member.findMany({
    where: { active: true, publicVisible: true },
    select: {
      code: true,
      company: true,
      name: true,
      website: true,
      facebook: true,
      pressLinks: true,
      industry: true,
      category: { select: { name: true } },
    },
    orderBy: { code: "asc" },
  });

  const coBao = (s: string | null) => {
    try {
      return JSON.parse(s ?? "[]").length > 0;
    } catch {
      return false;
    }
  };

  const trong = ms.filter((m) => !m.website && !m.facebook && !coBao(m.pressLinks));
  const chiThieuBao = ms.filter(
    (m) => (m.website || m.facebook) && !coBao(m.pressLinks)
  );

  console.log(`Tong ho so cong khai: ${ms.length}`);
  console.log(`Trong hoan toan (khong web, khong fanpage, khong bao): ${trong.length}`);
  console.log(`Co web hoac fanpage nhung chua co bai bao: ${chiThieuBao.length}\n`);

  for (const m of trong) {
    console.log(`${m.code}\t${m.company}\t${m.category?.name ?? m.industry ?? ""}`);
  }
  await prisma.$disconnect();
})();
