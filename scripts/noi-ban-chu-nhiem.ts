/**
 * Nối danh sách Ban Chủ nhiệm với hồ sơ hội viên: khớp theo họ tên để điền tên
 * doanh nghiệp, chức vụ và đường dẫn hồ sơ — nhờ đó thẻ nhân sự bấm vào xem
 * được hồ sơ doanh nghiệp, và trang không còn trống trơn phần công ty.
 *
 *   npm run noi-ban-chu-nhiem            (xem trước, không ghi)
 *   npm run noi-ban-chu-nhiem -- --ghi   (ghi vào cơ sở dữ liệu)
 */
import { prisma } from "../src/lib/prisma";
import { normalizeSearch } from "../src/lib/search";

const GHI = process.argv.includes("--ghi");

(async () => {
  const [leaders, members] = await Promise.all([
    prisma.leader.findMany({ orderBy: [{ order: "asc" }] }),
    prisma.member.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        company: true,
        position: true,
        avatar: true,
        hoiRole: true,
      },
    }),
  ]);

  // Khớp theo tên đã bỏ dấu; tên trùng nhau thì bỏ qua để khỏi gán nhầm người
  const theoTen = new Map<string, typeof members>();
  for (const m of members) {
    const k = normalizeSearch(m.name);
    theoTen.set(k, [...(theoTen.get(k) ?? []), m]);
  }

  let khop = 0;
  let trung = 0;
  let khong = 0;

  for (const l of leaders) {
    const ung = theoTen.get(normalizeSearch(l.name)) ?? [];

    if (ung.length === 0) {
      khong++;
      console.log(`  ✗ ${l.name} — không có trong danh sách hội viên`);
      continue;
    }
    if (ung.length > 1) {
      trung++;
      console.log(
        `  ? ${l.name} — trùng tên ${ung.length} hội viên, bỏ qua: ${ung
          .map((u) => u.company)
          .join(" / ")}`
      );
      continue;
    }

    const m = ung[0];
    khop++;
    console.log(`  ✓ ${l.name} → ${m.company}`);

    if (GHI) {
      await prisma.leader.update({
        where: { id: l.id },
        data: {
          memberSlug: m.slug,
          company: l.company ?? m.company,
          position: l.position ?? m.position,
        },
      });
      // Ghi ngược chức vụ trong Hội vào hồ sơ hội viên để hiện ở trang doanh
      // nghiệp — YBA là hội doanh nhân, chức vụ trong Hội là thông tin đáng nói
      if (!m.hoiRole) {
        await prisma.member.update({
          where: { id: m.id },
          data: { hoiRole: l.title },
        });
      }
      // Hội viên chưa có ảnh chân dung thì mượn ảnh đã có ở trang nhân sự
      if (!m.avatar && l.photo) {
        await prisma.member.update({
          where: { id: m.id },
          data: { avatar: l.photo },
        });
      }
    }
  }

  console.log(
    `\nKhớp ${khop} · trùng tên ${trung} · không tìm thấy ${khong} (tổng ${leaders.length}).`
  );
  if (!GHI) console.log('Chạy lại với "-- --ghi" để lưu.');
  await prisma.$disconnect();
})();
