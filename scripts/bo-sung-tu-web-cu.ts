/**
 * Bổ sung những thứ web cũ ybacholon.vn có mà web mới còn thiếu.
 * Ban Chủ nhiệm đã chốt từng mục (xem soat/web-cu/bao-cao-doi-chieu.md).
 *
 *   npm run bo-sung-cu            → xem trước
 *   npm run bo-sung-cu -- --ghi   → ghi thật
 *
 * Chạy lại nhiều lần an toàn: chỗ nào đã đúng thì bỏ qua.
 */
import { prisma } from "../src/lib/prisma";
import { uniqueSlug } from "../src/lib/slug";

const GHI = process.argv.includes("--ghi");

/** Sự kiện web cũ có, web mới chưa có. Số liệu lấy nguyên từ trang cũ. */
const SU_KIEN_THIEU = {
  title: "Chill With CEOs – Sunset & CEOs Connect",
  summary:
    "Buổi gặp gỡ cuối ngày dành cho lãnh đạo doanh nghiệp hội viên và khách mời, kết hợp giao lưu và kết nối trong không gian bên sông.",
  startAt: new Date(2025, 5, 13, 17, 0), // 13/06/2025, 5:00 chiều
  location: "ChillHouse – Saigon Beach Club, 179 Hai Bà Trưng, Phường 6, Quận 3, TP.HCM",
  activityGroup: "Kết nối hội viên",
  seriesName: "Chill With CEOs",
};

(async () => {
  console.log("── 1. Sửa tên viết sai dấu ──");
  const saiTen: [string, string][] = [["Nguyễn Thúy Tiên", "Nguyễn Thủy Tiên"]];
  for (const [sai, dung] of saiTen) {
    const l = await prisma.leader.findMany({ where: { name: sai }, select: { id: true } });
    const m = await prisma.member.findMany({ where: { name: sai }, select: { id: true } });
    if (!l.length && !m.length) {
      console.log(`  (đã đúng) ${dung}`);
      continue;
    }
    console.log(`  "${sai}" → "${dung}" · ${l.length} nhân sự ban, ${m.length} hội viên`);
    if (GHI) {
      await prisma.leader.updateMany({ where: { name: sai }, data: { name: dung } });
      await prisma.member.updateMany({ where: { name: sai }, data: { name: dung } });
    }
  }

  console.log("\n── 2. Sự kiện còn thiếu ──");
  const daCo = await prisma.event.findFirst({
    where: { title: { contains: "Chill With CEOs" } },
    select: { id: true, slug: true },
  });
  if (daCo) {
    console.log(`  (đã có) ${SU_KIEN_THIEU.title} — /su-kien/${daCo.slug}`);
  } else {
    console.log(`  + ${SU_KIEN_THIEU.title} (${SU_KIEN_THIEU.startAt.toLocaleDateString("vi-VN")})`);
    if (GHI) {
      const slug = await uniqueSlug(SU_KIEN_THIEU.title, async (s) =>
        Boolean(await prisma.event.findUnique({ where: { slug: s }, select: { id: true } }))
      );
      await prisma.event.create({
        data: { ...SU_KIEN_THIEU, slug, published: true },
      });
      console.log(`    → /su-kien/${slug}`);
    }
  }

  console.log(
    `\n${GHI ? "✓ Đã ghi." : "Xem ổn thì ghi thật: npm run bo-sung-cu -- --ghi"}`
  );
  await prisma.$disconnect();
})();
