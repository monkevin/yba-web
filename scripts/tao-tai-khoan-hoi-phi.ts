/**
 * TẠO TÀI KHOẢN HÀNG LOẠT theo danh sách ĐÓNG HỘI PHÍ (Chủ nhiệm chốt
 * 24/09/2026): tên đăng nhập = mã hội viên viết thường (hv0001…), mật khẩu
 * mặc định = SĐT của hội viên (BĐH phổ biến: "ID là mã hội viên, mật khẩu
 * là số điện thoại của anh/chị"). Ai chưa đóng phí thì KHOÁ tài khoản —
 * coi như mất quyền lợi, đóng phí thì mở lại.
 *
 * Mặc định chỉ XEM TRƯỚC. Các cờ:
 *   --ghi            ghi thật vào CSDL
 *   --nam 2026       năm hội phí làm mốc (mặc định 2026)
 *   --tat-ca         tạo cho MỌI hội viên đang sinh hoạt, kể cả chưa đóng phí
 *   --cap-lai-mk-sdt đặt lại mật khẩu = SĐT cho CẢ tài khoản hội viên đã có
 *                    (dùng khi muốn toàn bộ theo một quy tắc; ai đã tự đổi
 *                    mật khẩu cũng bị đè — cân nhắc trước khi dùng)
 *   --khoa-chua-dong khoá tài khoản hội viên chưa đóng phí năm mốc và MỞ
 *                    lại tài khoản của người đã đóng (chỉ đụng vai trò
 *                    MEMBER — không bao giờ khoá tài khoản ban)
 *
 * Chạy trên máy chủ:
 *   sudo docker compose exec yba-web npx tsx scripts/tao-tai-khoan-hoi-phi.ts --ghi
 *
 * Mật khẩu = SĐT là dễ đoán với người quen biết — đây là lựa chọn có chủ
 * đích của Chủ nhiệm để dễ phổ biến; hội viên nên tự đổi ở /tai-khoan.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const GHI = process.argv.includes("--ghi");
const TAT_CA = process.argv.includes("--tat-ca");
const CAP_LAI = process.argv.includes("--cap-lai-mk-sdt");
const KHOA = process.argv.includes("--khoa-chua-dong");
const iNam = process.argv.indexOf("--nam");
const NAM = iNam >= 0 ? Number(process.argv[iNam + 1]) || 2026 : 2026;

/** SĐT lưu đủ kiểu (chấm, khoảng trắng, +84) → dãy số bắt đầu bằng 0. */
function sdtLamMatKhau(phone: string | null): string | null {
  if (!phone) return null;
  let so = phone.replace(/[^\d]/g, "");
  if (so.startsWith("84")) so = "0" + so.slice(2);
  if (!/^0\d{9,10}$/.test(so)) return null;
  return so;
}

async function main() {
  console.log(
    `${GHI ? "GHI THẬT" : "XEM TRƯỚC (thêm --ghi để ghi)"} · mốc hội phí ${NAM}` +
      `${TAT_CA ? " · tất cả hội viên" : " · chỉ người đã đóng phí"}`
  );

  const ds = await prisma.member.findMany({
    where: { trangThai: { not: "ROI_HOI" }, code: { startsWith: "HV" } },
    orderBy: { code: "asc" },
    select: {
      id: true, code: true, name: true, phone: true, feePaidYear: true,
      user: { select: { id: true, username: true, role: true, active: true } },
    },
  });
  const hopLe = ds.filter((m) => /^HV\d+$/.test(m.code));

  let tao = 0, daCo = 0, capLai = 0, thieuSdt = 0, khoa = 0, mo = 0;
  const dongThieuSdt: string[] = [];

  for (const m of hopLe) {
    const daDong = m.feePaidYear >= NAM;
    const username = m.code.toLowerCase();

    // Khoá / mở theo hội phí — CHỈ tài khoản vai trò MEMBER
    if (KHOA && m.user && m.user.role === "MEMBER") {
      if (!daDong && m.user.active) {
        khoa++;
        if (khoa <= 8) console.log(`  KHOÁ  ${m.user.username} · ${m.name} (phí ${m.feePaidYear || "chưa"})`);
        if (GHI)
          await prisma.user.update({ where: { id: m.user.id }, data: { active: false } });
      } else if (daDong && !m.user.active) {
        mo++;
        console.log(`  MỞ LẠI ${m.user.username} · ${m.name}`);
        if (GHI)
          await prisma.user.update({ where: { id: m.user.id }, data: { active: true } });
      }
    }

    if (!TAT_CA && !daDong) continue;

    const mk = sdtLamMatKhau(m.phone);

    if (m.user) {
      daCo++;
      if (CAP_LAI && m.user.role === "MEMBER" && mk) {
        capLai++;
        if (capLai <= 5) console.log(`  ĐẶT LẠI MK ${m.user.username} · ${m.name}`);
        if (GHI)
          await prisma.user.update({
            where: { id: m.user.id },
            data: {
              passwordHash: await bcrypt.hash(mk, 10),
              passwordChangedAt: new Date(),
            },
          });
      }
      continue;
    }

    if (!mk) {
      thieuSdt++;
      dongThieuSdt.push(`${m.code} ${m.name}`);
      continue;
    }
    // Tên đăng nhập trùng (tài khoản cũ chưa gắn hồ sơ?) → gắn hồ sơ vào
    // tài khoản đó thay vì tạo trùng
    const trungTen = await prisma.user.findUnique({ where: { username } });
    if (trungTen) {
      daCo++;
      if (GHI && !TAT_CA)
        await prisma.user.update({ where: { id: trungTen.id }, data: { memberId: m.id } });
      continue;
    }

    tao++;
    if (tao <= 8) console.log(`  + ${username} / ${mk} · ${m.name}`);
    if (tao === 9) console.log("  … (các dòng sau không in nữa)");
    if (GHI)
      await prisma.user.create({
        data: {
          username,
          name: m.name,
          role: "MEMBER",
          memberId: m.id,
          passwordHash: await bcrypt.hash(mk, 10),
        },
      });
  }

  console.log(
    `\nTổng: ${hopLe.length} hội viên đang sinh hoạt · tạo mới ${tao} · đã có tài khoản ${daCo}` +
      (CAP_LAI ? ` (đặt lại mật khẩu ${capLai})` : "") +
      ` · thiếu SĐT không tạo được ${thieuSdt}` +
      (KHOA ? ` · khoá ${khoa} · mở lại ${mo}` : "")
  );
  if (dongThieuSdt.length)
    console.log("Thiếu SĐT:", dongThieuSdt.slice(0, 15).join(" · ") + (dongThieuSdt.length > 15 ? " …" : ""));
  if (!GHI) console.log("\n(Chưa ghi gì — thêm --ghi để chạy thật.)");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
