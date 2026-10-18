/**
 * Ghi lại năm đóng hội phí gần nhất cho mọi hội viên (Member.feePaidYear) —
 * chạy một lần sau khi thêm trường này, hoặc bất cứ lúc nào nghi số liệu lệch.
 *
 *   npm run dong-bo-hoi-phi
 */
import { dongBoTatCa } from "../src/lib/hoi-phi";
import { prisma } from "../src/lib/prisma";

(async () => {
  const sua = await dongBoTatCa();
  const namNay = new Date().getFullYear();
  const uuTien = await prisma.member.count({
    where: { feePaidYear: { gte: namNay } },
  });
  const tong = await prisma.member.count();

  console.log(`Đã cập nhật ${sua} hội viên.`);
  console.log(
    `${uuTien}/${tong} hội viên đã đóng phí ${namNay} (hoặc được miễn) — sẽ hiện lên trên.`
  );
  await prisma.$disconnect();
})();
