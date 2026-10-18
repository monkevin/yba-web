/**
 * Xoá dữ liệu MẪU ở phần giao thương, giữ nguyên mọi thứ thật.
 *
 *   npm run xoa-giao-thuong            → chỉ xem sẽ xoá gì (KHÔNG xoá)
 *   npm run xoa-giao-thuong -- --dong-y → xoá thật
 *
 * XOÁ:
 *   - Toàn bộ giao dịch (Deal) — 1.200 đơn do seed sinh ra, đều do tài khoản
 *     admin tạo với cùng một mô tả, tổng 239 tỷ không có thật.
 *   - Nhật ký thao tác gắn với các giao dịch đó.
 *   - Kỳ vinh danh và các giải đã trao — vì chúng tính RA TỪ số giao dịch giả,
 *     giữ lại thì trang vinh danh nêu tên doanh nghiệp dựa trên số liệu sai.
 *   - Vài bản ghi thử còn sót: lượt quan tâm tin, khách làm WHO AM I, đơn đăng
 *     ký hội viên thử, tin nhắn liên hệ thử, đăng ký hoạt động thử.
 *
 * GIỮ NGUYÊN:
 *   - 511 tin chợ nhu cầu mua/bán (Ban Chủ nhiệm đã duyệt là dùng được)
 *   - 78 lượt tài trợ sự kiện nhập từ danh sách thật
 *   - 2 chương trình + 4 gói tài trợ
 *   - Hội viên, Ban Chủ nhiệm, sự kiện, ảnh, bài viết, video, lịch hoạt động
 */
import { prisma } from "../src/lib/prisma";

const THAT = process.argv.includes("--dong-y");

/** Bản ghi thử nhận ra bằng tên — do các bộ kiểm tra và lần chạy thử để lại. */
const TEN_THU = ["Thử", "Kiểm Thử", "Test"];

async function main() {
  console.log(THAT ? "═══ XOÁ THẬT ═══\n" : "═══ XEM TRƯỚC — chưa xoá gì ═══\n");

  // ── Giao dịch ─────────────────────────────────────────────────
  const [soDeal, tong, soLog] = await Promise.all([
    prisma.deal.count(),
    prisma.deal.aggregate({ _sum: { amount: true }, where: { status: "DA_DUYET" } }),
    prisma.activityLog.count(),
  ]);
  console.log(
    `Giao dịch:            ${soDeal} đơn · ${((tong._sum.amount ?? 0) / 1e9).toFixed(1)} tỷ đã duyệt`
  );
  console.log(`Nhật ký thao tác:     ${soLog} dòng`);

  // ── Vinh danh (tính từ giao dịch giả) ─────────────────────────
  const ky = await prisma.awardPeriod.findMany({
    select: { name: true, _count: { select: { awards: true } } },
  });
  console.log(
    `Kỳ vinh danh:         ${ky.length} kỳ · ${ky.reduce((s, k) => s + k._count.awards, 0)} giải` +
      (ky.length ? ` (${ky.map((k) => k.name).join(", ")})` : "")
  );

  // ── Bản ghi thử lẻ ────────────────────────────────────────────
  const [quanTam, khach, donDK, tinNhan, dangKyHD] = await Promise.all([
    prisma.listingContact.count(),
    prisma.khachTest.count(),
    prisma.membershipApplication.count({
      where: { OR: TEN_THU.map((t) => ({ name: { contains: t } })) },
    }),
    prisma.contactMessage.count({
      where: { OR: TEN_THU.map((t) => ({ name: { contains: t } })) },
    }),
    prisma.dangKyHoatDong.count(),
  ]);
  console.log(
    `Bản ghi thử lẻ:       ${quanTam} lượt quan tâm · ${khach} khách WHO AM I · ` +
      `${donDK} đơn đăng ký · ${tinNhan} tin nhắn · ${dangKyHD} đăng ký hoạt động`
  );

  // ── Những thứ KHÔNG đụng tới ──────────────────────────────────
  const [tin, taiTroSK, duAn, goi, hv, sk, bai] = await Promise.all([
    prisma.listing.count(),
    prisma.taiTroSuKien.count(),
    prisma.duAnTaiTro.count(),
    prisma.goiTaiTro.count(),
    prisma.member.count(),
    prisma.event.count(),
    prisma.post.count(),
  ]);
  console.log(
    `\nGIỮ NGUYÊN:           ${tin} tin chợ nhu cầu · ${taiTroSK} lượt tài trợ sự kiện · ` +
      `${duAn} chương trình + ${goi} gói tài trợ\n` +
      `                      ${hv} hội viên · ${sk} sự kiện · ${bai} bài viết`
  );

  if (!THAT) {
    console.log("\nXoá thật: npm run xoa-giao-thuong -- --dong-y\n");
    return;
  }

  // Xoá theo thứ tự phụ thuộc: bảng con trước, bảng cha sau
  const xoa = await prisma.$transaction([
    prisma.activityLog.deleteMany({ where: { dealId: { not: null } } }),
    prisma.deal.deleteMany({}),
    prisma.award.deleteMany({}),
    prisma.awardPeriod.deleteMany({}),
    prisma.listingContact.deleteMany({}),
    prisma.khachTest.deleteMany({}),
    prisma.membershipApplication.deleteMany({
      where: { OR: TEN_THU.map((t) => ({ name: { contains: t } })) },
    }),
    prisma.contactMessage.deleteMany({
      where: { OR: TEN_THU.map((t) => ({ name: { contains: t } })) },
    }),
    prisma.dangKyHoatDong.deleteMany({}),
  ]);

  const nhan = [
    "nhật ký thao tác",
    "giao dịch",
    "giải vinh danh",
    "kỳ vinh danh",
    "lượt quan tâm tin",
    "khách WHO AM I",
    "đơn đăng ký thử",
    "tin nhắn thử",
    "đăng ký hoạt động thử",
  ];
  console.log("\nĐã xoá:");
  xoa.forEach((r, i) => {
    if (r.count) console.log(`  ${String(r.count).padStart(5)} ${nhan[i]}`);
  });

  const conLai = await prisma.deal.count();
  console.log(
    `\n✓ Xong. Còn ${conLai} giao dịch. ` +
      `Trang /xuc-tien-thuong-mai giờ về 0 — đúng như vậy, chờ hội viên khai giao dịch thật.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
