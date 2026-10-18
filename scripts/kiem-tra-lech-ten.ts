/**
 * Truy vết vụ tài khoản hv0018 hiện tên "Lê Tuấn Mai" (20/09/2026):
 * đối chiếu User.name với tên hội viên mà tài khoản đó trỏ tới, đếm xem
 * lệch bao nhiêu tài khoản. Chỉ ĐỌC, không sửa.
 *
 * Chạy: npx tsx scripts/kiem-tra-lech-ten.ts
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  // 1. Tài khoản hv0018 đang trỏ đi đâu?
  const u18 = await prisma.user.findUnique({
    where: { username: "hv0018" },
    include: { member: { select: { code: true, name: true, company: true } } },
  });
  console.log("hv0018 =", {
    tenTrenTaiKhoan: u18?.name,
    troToiHoiVien: u18?.member
      ? `${u18.member.code} · ${u18.member.name} · ${u18.member.company}`
      : "(không gắn hội viên)",
  });

  // 2. "Lê Tuấn Mai" là ai trong dữ liệu?
  const mai = await prisma.member.findMany({
    where: { name: { contains: "Tuấn Mai" } },
    select: {
      code: true,
      name: true,
      company: true,
      user: { select: { username: true, name: true } },
    },
  });
  console.log("\nHội viên tên chứa 'Tuấn Mai':");
  for (const m of mai)
    console.log(" ", m.code, m.name, "·", m.company, "· tài khoản:",
      m.user ? `${m.user.username} (tên trên TK: ${m.user.name})` : "(chưa có)");

  // 3. Đếm toàn bộ tài khoản hội viên có User.name KHÁC tên hội viên nó trỏ tới
  const users = await prisma.user.findMany({
    where: { role: "MEMBER", memberId: { not: null } },
    include: { member: { select: { code: true, name: true } } },
  });
  const chuan = (s: string) =>
    s.trim().normalize("NFC").replace(/\s+/g, " ").toLocaleLowerCase("vi");
  const lech = users.filter((u) => u.member && chuan(u.name) !== chuan(u.member.name));
  console.log(`\nTài khoản hội viên: ${users.length} · LỆCH TÊN: ${lech.length}`);
  for (const u of lech.slice(0, 15))
    console.log(`  ${u.username}: tên trên TK "${u.name}" ≠ hội viên ${u.member!.code} "${u.member!.name}"`);
  if (lech.length > 15) console.log(`  … và ${lech.length - 15} tài khoản nữa`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
