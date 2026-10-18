import crypto from "crypto";
import { prisma } from "../src/lib/prisma";

/**
 * Tạo một phiên Mini App giả để xem thử các màn CHỈ hiện sau khi xác thực
 * (sinh nhật, thẻ hội viên, khai giao dịch) ngay trên trình duyệt máy tính.
 *
 * CHỈ dùng trên máy làm việc với `prisma/dev.db` — đừng chạy trên máy chủ thật.
 * Chạy: npx tsx scripts/tao-phien-thu-miniapp.ts
 * Rồi dán token in ra vào localStorage của trang (khoá `yba-phien`).
 */
async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Script này chỉ dùng trên máy làm việc, không chạy ở máy chủ thật");
  }

  // Thêm cờ --thuong để lấy hội viên KHÔNG có chức danh, dùng khi cần thử
  // luồng "phải chờ Ban Chủ nhiệm duyệt".
  const thuong = process.argv.includes("--thuong");

  const member = await prisma.member.findFirst({
    where: thuong
      ? { active: true, hoiRole: null, phone: { not: null } }
      : { active: true, hoiRole: { not: null }, phone: { not: null } },
    select: { id: true, name: true, phone: true, hoiRole: true },
  });
  if (!member) throw new Error("Không tìm thấy hội viên phù hợp");

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.phienMiniApp.create({
    data: {
      tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
      phone: member.phone!,
      memberId: member.id,
      zaloUserId: "thu-nghiem-zalo-id",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  console.log("Hội viên:", member.name, "|", member.hoiRole);
  console.log("TOKEN:", token);
}

main().finally(() => prisma.$disconnect());
