/**
 * Tạo 2 tài khoản THỬ để kiểm tra phân quyền. Xoá đi khi chạy thật.
 *   npx tsx scripts/tao-tai-khoan-thu.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { QUYEN } from "../src/lib/quyen";

const prisma = new PrismaClient();

const THU = [
  {
    username: "bantt",
    name: "Ban Truyền thông (thử)",
    quyen: [QUYEN.NOI_DUNG_VIET, QUYEN.SU_KIEN_QUAN_LY, QUYEN.TRANG_TINH_SUA],
  },
  {
    username: "banxttm",
    name: "Ban Xúc tiến thương mại (thử)",
    quyen: [QUYEN.GIAO_DICH_DUYET, QUYEN.TIN_DANG_DUYET, QUYEN.VINH_DANH_QUAN_LY],
  },
];

async function main() {
  const mk = await bcrypt.hash("123456", 10);
  for (const t of THU) {
    await prisma.user.deleteMany({ where: { username: t.username } });
    await prisma.user.create({
      data: {
        username: t.username,
        name: t.name,
        role: "STAFF",
        passwordHash: mk,
        permissions: JSON.stringify(t.quyen),
      },
    });
    console.log(`✓ ${t.username} / 123456 — ${t.quyen.length} quyền: ${t.quyen.join(", ")}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
