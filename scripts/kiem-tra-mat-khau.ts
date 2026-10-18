/**
 * Soát tình trạng mật khẩu TOÀN BỘ tài khoản (20/09/2026):
 *  - còn 123456?
 *  - còn đúng mật khẩu khởi tạo trong tai-khoan-hoi-vien.csv?
 *  - hay đã tự đổi?
 *
 * Chỉ ĐỌC và so hash — không in mật khẩu của ai ra màn hình, không sửa gì.
 * Chạy: npx tsx scripts/kiem-tra-mat-khau.ts
 */
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";

async function main() {
  // Đọc CSV mật khẩu khởi tạo (nếu còn)
  const csvPath = path.join(process.cwd(), "tai-khoan-hoi-vien.csv");
  const banDau = new Map<string, string>();
  if (fs.existsSync(csvPath)) {
    const dong = fs.readFileSync(csvPath, "utf-8").split(/\r?\n/).slice(1);
    for (const l of dong) {
      // các ô đều bọc ngoặc kép — bỏ ngoặc trước khi so
      const cot = l.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      // tìm cột username (hvxxxx) và cột mật khẩu kề sau
      const i = cot.findIndex((c) => /^hv\d{4}$/i.test(c));
      if (i >= 0 && cot[i + 1]) banDau.set(cot[i].toLowerCase(), cot[i + 1]);
    }
    console.log(`CSV khởi tạo: còn trong máy, ${banDau.size} dòng tài khoản.`);
  } else {
    console.log("CSV khởi tạo: đã xoá — chỉ soát được mật khẩu 123456.");
  }

  const users = await prisma.user.findMany({
    select: { username: true, role: true, passwordHash: true, active: true },
    orderBy: { username: "asc" },
  });

  let la123456 = 0, laKhoiTao = 0, daDoi = 0;
  const nhomLo: string[] = [];
  for (const u of users) {
    if (await bcrypt.compare("123456", u.passwordHash)) {
      la123456++;
      if (u.role !== "MEMBER") nhomLo.push(`${u.username} (${u.role}) — 123456`);
      continue;
    }
    const mk = banDau.get(u.username.toLowerCase());
    if (mk && (await bcrypt.compare(mk, u.passwordHash))) {
      laKhoiTao++;
      continue;
    }
    daDoi++;
  }

  console.log(`\nTổng ${users.length} tài khoản:`);
  console.log(`  - còn mật khẩu 123456           : ${la123456}`);
  console.log(`  - còn mật khẩu khởi tạo (CSV)   : ${laKhoiTao}`);
  console.log(`  - đã đổi mật khẩu riêng         : ${daDoi}`);
  if (nhomLo.length) {
    console.log("\nTài khoản QUẢN TRỊ / CÁN BỘ còn 123456 (nguy hiểm nhất):");
    for (const t of nhomLo) console.log("  ⚠", t);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
