/**
 * Xoá sạch DỮ LIỆU MẪU, giữ nguyên dữ liệu thật của Chi hội.
 *
 *   npm run xoa-du-lieu-mau            → chỉ xem sẽ xoá những gì (không xoá)
 *   npm run xoa-du-lieu-mau -- --dong-y → xoá thật
 *
 * XOÁ:  giao dịch mẫu, tin mua/bán mẫu, lượt quan tâm, kỳ vinh danh mẫu,
 *       tài khoản hội viên thử (hv0001…), hồ sơ đăng ký & tin nhắn thử.
 * GIỮ:  257 hội viên, 33 nhân sự Ban Chủ nhiệm, 29 ngành nghề, nhóm sinh hoạt,
 *       63 sự kiện cùng toàn bộ ảnh, tài khoản admin và thuky.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Tài khoản hội viên do seed sinh ra: hv0001, hv0002… */
const TAI_KHOAN_THU = /^hv\d{4}$/;

async function main() {
  const thatSu = process.argv.includes("--dong-y");

  const [
    deals,
    logs,
    listings,
    contacts,
    awards,
    awardPeriods,
    users,
    donDangKy,
    tinNhan,
    members,
    events,
    leaders,
  ] = await Promise.all([
    prisma.deal.count(),
    prisma.activityLog.count(),
    prisma.listing.count(),
    prisma.listingContact.count(),
    prisma.award.count(),
    prisma.awardPeriod.count(),
    prisma.user.findMany({ select: { id: true, username: true, role: true } }),
    prisma.membershipApplication.count(),
    prisma.contactMessage.count(),
    prisma.member.count(),
    prisma.event.count(),
    prisma.leader.count(),
  ]);

  const taiKhoanXoa = users.filter((u) => TAI_KHOAN_THU.test(u.username));
  const taiKhoanGiu = users.filter((u) => !TAI_KHOAN_THU.test(u.username));

  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║  SẼ XOÁ                                               ║");
  console.log("╚═══════════════════════════════════════════════════════╝");
  console.log(`  Giao dịch giao thương .............. ${deals}`);
  console.log(`  Nhật ký giao dịch ................. ${logs}`);
  console.log(`  Tin nhu cầu mua / bán ............. ${listings}`);
  console.log(`  Lượt "Tôi quan tâm" ............... ${contacts}`);
  console.log(`  Kỳ vinh danh ...................... ${awardPeriods} (${awards} lượt vinh danh)`);
  console.log(`  Tài khoản hội viên thử ............ ${taiKhoanXoa.length}`);
  console.log(`  Hồ sơ đăng ký hội viên ............ ${donDangKy}`);
  console.log(`  Tin nhắn liên hệ .................. ${tinNhan}`);

  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║  GIỮ NGUYÊN                                           ║");
  console.log("╚═══════════════════════════════════════════════════════╝");
  console.log(`  Hội viên .......................... ${members}`);
  console.log(`  Nhân sự Ban Chủ nhiệm ............. ${leaders}`);
  console.log(`  Sự kiện (và toàn bộ ảnh) .......... ${events}`);
  console.log(`  Ngành nghề, nhóm sinh hoạt ........ giữ nguyên`);
  console.log(
    `  Tài khoản .......................... ${taiKhoanGiu.map((u) => u.username).join(", ") || "(không có)"}`
  );

  if (!thatSu) {
    console.log("\n──────────────────────────────────────────────────────────");
    console.log("  Đây mới chỉ là XEM TRƯỚC, chưa xoá gì cả.");
    console.log("  Muốn xoá thật, chạy lại lệnh sau:");
    console.log("\n      npm run xoa-du-lieu-mau -- --dong-y\n");
    return;
  }

  console.log("\n→ Đang xoá...");

  // Thứ tự quan trọng: xoá bản ghi con trước để không vướng khoá ngoại
  await prisma.listingContact.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.award.deleteMany();
  await prisma.awardPeriod.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.membershipApplication.deleteMany();
  await prisma.contactMessage.deleteMany();

  if (taiKhoanXoa.length) {
    await prisma.user.deleteMany({
      where: { id: { in: taiKhoanXoa.map((u) => u.id) } },
    });
  }

  // Bỏ đánh dấu "doanh nghiệp tiêu biểu" do seed đặt ngẫu nhiên — để Ban Chủ
  // nhiệm tự chọn lại ở /quan-tri/ho-so
  await prisma.member.updateMany({ data: { featured: false } });

  console.log("\n✓ Đã xoá xong dữ liệu mẫu.");
  console.log("  Việc tiếp theo:");
  console.log("   1. Đổi mật khẩu tài khoản admin (đang là 123456).");
  console.log("   2. Vào /quan-tri/ho-so bấm ★ chọn doanh nghiệp tiêu biểu cho trang chủ.");
  console.log("   3. Nhập file giao dịch giao thương thật khi có.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
