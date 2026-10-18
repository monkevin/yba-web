/**
 * Đồng bộ tài khoản ↔ hồ sơ hội viên. Sinh ra để sửa hai lỗi phát hiện
 * 20/09/2026 (và chặn tái diễn):
 *
 *  1. TÊN TÀI KHOẢN SAI NGƯỜI — 30 tài khoản hv0001–hv0030 tạo từ thời
 *     seed chạy thử mang tên máy sinh ("Lê Tuấn Mai"…); về sau được nối
 *     vào hội viên thật nhưng tên không được ghi lại → Chủ nhiệm đăng
 *     nhập thấy tên người lạ. Sửa: User.name := tên hội viên nó trỏ tới.
 *
 *  2. TÌM KIẾM RA SAI NGƯỜI — cột Member.searchText có chứa MÃ hội viên,
 *     nhưng đợt đánh lại mã 26/07/2026 chỉ đổi cột code, không tính lại
 *     searchText → gõ "0018" ra người mang mã cũ HV0018 chứ không phải
 *     HV0018 hiện tại. Sửa: tính lại searchText cho TOÀN BỘ hội viên từ
 *     dữ liệu hiện hành.
 *
 * Thêm cờ --cap-lai-123456: đặt mật khẩu ngẫu nhiên mới cho các tài khoản
 * HỘI VIÊN còn dùng 123456 (di sản seed) và in bảng mã–tên–mật khẩu mới ra
 * màn hình để gửi riêng cho từng người. KHÔNG đụng tài khoản ADMIN/STAFF —
 * các tài khoản đó đổi tay ở /quan-tri/tai-khoan.
 *
 * Mặc định chỉ XEM TRƯỚC. Thêm --ghi mới ghi thật.
 *   Máy dev :  npx tsx scripts/dong-bo-tai-khoan.ts --ghi
 *   Máy chủ :  sudo docker compose exec web npx tsx scripts/dong-bo-tai-khoan.ts --ghi
 */
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { buildMemberSearchText } from "../src/lib/search";

const GHI = process.argv.includes("--ghi");
const CAP_LAI = process.argv.includes("--cap-lai-123456");

const chuan = (s: string) =>
  s.trim().normalize("NFC").replace(/\s+/g, " ").toLocaleLowerCase("vi");

/** Mật khẩu 8 ký tự chữ thường + số, tránh ký tự dễ nhìn nhầm (0/o, 1/l). */
function matKhauMoi(): string {
  const bo = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(crypto.randomBytes(8), (b) => bo[b % bo.length]).join("");
}

async function main() {
  console.log(
    GHI
      ? "== CHẠY THẬT (--ghi) =="
      : "== XEM TRƯỚC — thêm --ghi để ghi thật ==",
  );

  // ── 1. Tên tài khoản := tên hội viên nó trỏ tới ────────────────────
  const users = await prisma.user.findMany({
    where: { role: "MEMBER", memberId: { not: null } },
    include: { member: { select: { code: true, name: true } } },
  });
  const lechTen = users.filter(
    (u) => u.member && chuan(u.name) !== chuan(u.member.name),
  );
  console.log(
    `\n1) Tên tài khoản lệch hồ sơ: ${lechTen.length}/${users.length}`,
  );
  for (const u of lechTen) {
    console.log(
      `   ${u.username}: "${u.name}" -> "${u.member!.name}" (${u.member!.code})`,
    );
    if (GHI) {
      await prisma.user.update({
        where: { id: u.id },
        data: { name: u.member!.name },
      });
    }
  }

  // ── 2. Tính lại searchText toàn bộ hội viên ────────────────────────
  const members = await prisma.member.findMany();
  let doi = 0;
  for (const m of members) {
    const moi = buildMemberSearchText(m);
    if (moi !== m.searchText) {
      doi++;
      if (GHI) {
        await prisma.member.update({
          where: { id: m.id },
          data: { searchText: moi },
        });
      }
    }
  }
  console.log(`\n2) searchText cần tính lại: ${doi}/${members.length} hồ sơ`);

  // ── 3. (tuỳ chọn) cấp lại mật khẩu cho tài khoản hội viên còn 123456 ─
  if (CAP_LAI) {
    console.log("\n3) Cấp lại mật khẩu cho tài khoản HỘI VIÊN còn 123456:");
    const tatCa = await prisma.user.findMany({
      where: { role: "MEMBER" },
      include: {
        member: { select: { code: true, name: true, company: true } },
      },
    });
    let dem = 0;
    for (const u of tatCa) {
      if (!(await bcrypt.compare("123456", u.passwordHash))) continue;
      dem++;
      const mk = matKhauMoi();
      console.log(
        `   ${u.member?.code ?? "?"}  ${u.username}  ${(u.member?.name ?? u.name).padEnd(24)} ${mk}`,
      );
      if (GHI) {
        await prisma.user.update({
          where: { id: u.id },
          data: {
            passwordHash: await bcrypt.hash(mk, 10),
            // Đá các phiên đăng nhập cũ: ai đang giữ phiên bằng mật khẩu 123456
            // phải đăng nhập lại bằng mật khẩu mới
            passwordChangedAt: new Date(),
          },
        });
      }
    }
    if (dem === 0)
      console.log("   (không còn tài khoản hội viên nào dùng 123456)");
    else
      console.log(
        `   -> ${dem} tài khoản. CHÉP BẢNG TRÊN NGAY và gửi riêng từng người` +
          " — mật khẩu không xem lại được sau khi tắt cửa sổ này.",
      );
  } else {
    const con123 = [];
    for (const u of await prisma.user.findMany({ where: { role: "MEMBER" } })) {
      if (await bcrypt.compare("123456", u.passwordHash))
        con123.push(u.username);
    }
    if (con123.length)
      console.log(
        `\n3) Còn ${con123.length} tài khoản hội viên dùng 123456 — chạy thêm cờ` +
          " --cap-lai-123456 để cấp mật khẩu mới hàng loạt.",
      );
  }

  // ── 4. Tên đăng nhập := mã hội viên HIỆN TẠI ───────────────────────
  // Chủ nhiệm chốt 21/09/2026: hội viên mang mã HV0025 phải đăng nhập
  // bằng hv0025 — hai dãy lệch nhau (di sản đợt đánh lại mã 26/07) làm
  // người ta gõ mã của mình mà vào không được, hoặc tưởng nhầm tài khoản
  // người khác là của mình. Mật khẩu đi theo TÀI KHOẢN nên đổi tên đăng
  // nhập không đổi mật khẩu của ai. Ai quên tên mới vẫn còn đường đăng
  // nhập bằng số điện thoại.
  //
  // Đổi hai bước qua tên tạm: đổi thẳng sẽ đụng ràng buộc "tên đăng nhập
  // không được trùng" khi hoán vị (hv0018 -> hv0001 trong khi hv0001 đang
  // là tên của tài khoản khác).
  const taiKhoanHV = await prisma.user.findMany({
    where: { role: "MEMBER", memberId: { not: null } },
    include: { member: { select: { code: true, name: true } } },
  });
  const canDoi = taiKhoanHV.filter(
    (u) =>
      u.member &&
      /^HV\d{4}$/.test(u.member.code) &&
      u.username !== u.member.code.toLowerCase(),
  );
  console.log(
    `\n4) Tên đăng nhập lệch mã hội viên: ${canDoi.length}/${taiKhoanHV.length}`,
  );
  for (const u of canDoi.slice(0, 12))
    console.log(
      `   ${u.username} -> ${u.member!.code.toLowerCase()}  (${u.member!.name})`,
    );
  if (canDoi.length > 12)
    console.log(`   … và ${canDoi.length - 12} tài khoản nữa`);
  if (GHI && canDoi.length) {
    for (const u of canDoi) {
      await prisma.user.update({
        where: { id: u.id },
        data: { username: `tmp-${u.id}` },
      });
    }
    for (const u of canDoi) {
      await prisma.user.update({
        where: { id: u.id },
        data: { username: u.member!.code.toLowerCase() },
      });
    }
  }

  // Hội viên thật chưa có tài khoản nào — chỉ báo, không tự tạo
  // (tạo tài khoản là việc của npm run tao-tai-khoan, kèm phát mật khẩu)
  const chuaCoTK = await prisma.member.findMany({
    where: { code: { startsWith: "HV" }, user: null },
    select: { code: true, name: true },
  });
  if (chuaCoTK.length) {
    console.log(`   Lưu ý: ${chuaCoTK.length} hội viên CHƯA có tài khoản:`);
    for (const m of chuaCoTK) console.log(`     ${m.code} ${m.name}`);
  }

  // ── 5. Ẩn hồ sơ tài khoản kỹ thuật khỏi khu công khai ──────────────
  // KDZ001–003 là tài khoản cho KIỂM DUYỆT VIÊN ZALO duyệt Mini App
  // (28/08/2026). Họ cần ĐĂNG NHẬP được, nhưng hồ sơ "Kiểm Duyệt Zalo 1"
  // không được phép nằm trong danh bạ doanh nghiệp công khai — đã lộ trên
  // web thật, phát hiện 20/09/2026.
  const kdz = await prisma.member.findMany({
    where: { code: { startsWith: "KDZ" }, publicVisible: true },
    select: { id: true, code: true },
  });
  console.log(`\n5) Hồ sơ kỹ thuật (KDZ*) đang lộ công khai: ${kdz.length}`);
  for (const m of kdz) {
    console.log(`   ẩn ${m.code}`);
    if (GHI) {
      await prisma.member.update({
        where: { id: m.id },
        data: { publicVisible: false },
      });
    }
  }

  console.log(GHI ? "\nĐÃ GHI XONG." : "\n(chưa ghi gì — xem trước)");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
