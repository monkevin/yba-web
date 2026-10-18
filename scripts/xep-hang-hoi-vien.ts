/**
 * Tính lại cấp bậc hiển thị cho toàn bộ hội viên.
 * Nguồn chính là bảng Ban Chủ nhiệm (`Leader`) vì đó là danh sách nhân sự chính
 * thức; sau đó mới tới chức vụ trong Hội ghi ở hồ sơ và loại hội viên.
 *
 *   npm run xep-hang            (xem trước)
 *   npm run xep-hang -- --ghi   (ghi vào cơ sở dữ liệu)
 */
import { prisma } from "../src/lib/prisma";
import { CAP_BAC, TEN_CAP_BAC, xepHangHoiVien } from "../src/lib/xep-hang";

const GHI = process.argv.includes("--ghi");

(async () => {
  const [members, leaders] = await Promise.all([
    prisma.member.findMany({
      select: {
        id: true,
        code: true,
        slug: true,
        name: true,
        company: true,
        memberType: true,
        hoiRole: true,
        note: true,
        headcount: true,
        capBac: true,
      },
    }),
    prisma.leader.findMany({
      where: { active: true },
      select: { memberSlug: true, title: true, group: true, order: true },
    }),
  ]);

  // Chức danh chính thức trong Ban Chủ nhiệm, tra theo slug hồ sơ doanh nghiệp
  const chucDanh = new Map<string, string>();
  for (const l of leaders) {
    if (!l.memberSlug) continue;
    const cu = chucDanh.get(l.memberSlug);
    // Một người có thể ở nhiều ban — giữ chức danh cao nhất (order nhỏ nhất)
    if (!cu || l.order < 99) chucDanh.set(l.memberSlug, cu ?? l.title);
  }

  const dem = new Map<number, number>();
  let doi = 0;

  for (const m of members) {
    const vaiTro = chucDanh.get(m.slug) ?? m.hoiRole ?? null;
    const { capBac, doanhNghiepLon } = xepHangHoiVien({
      memberType: m.memberType,
      hoiRole: vaiTro,
      note: m.note,
      headcount: m.headcount,
    });

    dem.set(capBac, (dem.get(capBac) ?? 0) + 1);
    if (capBac !== m.capBac) doi++;

    if (GHI) {
      await prisma.member.update({
        where: { id: m.id },
        data: {
          capBac,
          doanhNghiepLon,
          // Ghi luôn chức vụ trong Hội để hồ sơ công khai hiện đúng
          ...(vaiTro && !m.hoiRole ? { hoiRole: vaiTro } : {}),
        },
      });
    }

    if (capBac <= CAP_BAC.PHO_CHU_NHIEM) {
      console.log(`  ${TEN_CAP_BAC[capBac]}: ${m.name} — ${m.company.slice(0, 45)}`);
    }
  }

  console.log("\nPhân bố cấp bậc:");
  for (const [c, n] of [...dem.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`  ${c} · ${TEN_CAP_BAC[c] ?? "?"}: ${n} người`);
  }
  console.log(`\n${doi} hồ sơ đổi cấp bậc.`);
  if (!GHI) console.log('Chạy lại với "-- --ghi" để lưu.');
  await prisma.$disconnect();
})();
