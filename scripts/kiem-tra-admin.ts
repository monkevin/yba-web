/**
 * Kiểm tra sức khoẻ các tài khoản quản trị:
 *  - liệt kê tài khoản ADMIN, trạng thái hoạt động
 *  - báo tài khoản nào còn dùng mật khẩu khởi tạo 123456 (phải đổi ngay)
 *
 * Chạy: npx tsx scripts/kiem-tra-admin.ts
 * Chỉ ĐỌC, không sửa gì. Đổi mật khẩu làm ở /quan-tri/tai-khoan.
 */
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: {
      username: true,
      name: true,
      active: true,
      passwordHash: true,
      createdAt: true,
    },
  });
  console.log(`Tài khoản ADMIN: ${admins.length}`);
  for (const a of admins) {
    const macDinh = await bcrypt.compare("123456", a.passwordHash);
    console.log(
      `  - ${a.username} (${a.name}) · ${a.active ? "đang hoạt động" : "ĐÃ KHOÁ"} · mật khẩu 123456: ${
        macDinh ? "⚠ VẪN LÀ MẶC ĐỊNH — ĐỔI NGAY" : "đã đổi"
      }`
    );
  }
  const [staff, members] = await Promise.all([
    prisma.user.count({ where: { role: "STAFF" } }),
    prisma.user.count({ where: { role: "MEMBER" } }),
  ]);
  console.log(`Ngoài ra: ${staff} tài khoản cán bộ ban (STAFF), ${members} tài khoản hội viên.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
