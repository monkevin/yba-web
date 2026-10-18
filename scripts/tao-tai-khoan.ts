/**
 * Tạo tài khoản đăng nhập hàng loạt cho những hội viên chưa có tài khoản.
 *
 *   npm run tao-tai-khoan
 *
 * Tên đăng nhập lấy theo mã hội viên TẠI LÚC CHẠY (hv0001, hv0002...), mật khẩu
 * ngẫu nhiên. Sau đó mã hội viên có thể được đánh lại (danh-lai-ma) còn tên đăng
 * nhập giữ nguyên — nên về sau tên đăng nhập KHÔNG trùng mã hội viên, và mã hội
 * viên không bao giờ dùng để đăng nhập (hội viên dùng tên đăng nhập hoặc SĐT).
 * Danh sách tài khoản + mật khẩu được ghi ra file `tai-khoan-hoi-vien.csv`
 * để ban điều hành mở bằng Excel và gửi cho từng hội viên.
 *
 * Mật khẩu chỉ hiện MỘT LẦN trong file này — hệ thống chỉ lưu bản mã hoá.
 * Gửi xong nên xoá file đi.
 */
import { writeFileSync } from "fs";
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Mật khẩu 8 ký tự dễ đọc — bỏ các ký tự dễ nhầm như O/0, l/1. */
function makePassword(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(8);
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}

async function main() {
  const members = await prisma.member.findMany({
    where: { active: true, user: null },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true, company: true },
  });

  if (!members.length) {
    console.log("Mọi hội viên đang hoạt động đều đã có tài khoản.");
    return;
  }

  const rows: string[][] = [];
  let created = 0;

  for (const m of members) {
    const username = m.code.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) {
      console.log(`Bỏ qua ${username} — tên đăng nhập đã tồn tại.`);
      continue;
    }

    const password = makePassword();
    await prisma.user.create({
      data: {
        username,
        name: m.name,
        role: "MEMBER",
        memberId: m.id,
        passwordHash: await bcrypt.hash(password, 10),
      },
    });
    rows.push([m.code, m.company, m.name, username, password]);
    created++;
  }

  const csv =
    "﻿" +
    [
      ["Mã hội viên", "Doanh nghiệp", "Người đại diện", "Tên đăng nhập", "Mật khẩu"],
      ...rows,
    ]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

  writeFileSync("tai-khoan-hoi-vien.csv", csv, "utf8");

  console.log(`Đã tạo ${created} tài khoản.`);
  console.log("Danh sách tài khoản + mật khẩu: tai-khoan-hoi-vien.csv");
  console.log("Gửi xong cho hội viên thì XOÁ file này đi.");
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
