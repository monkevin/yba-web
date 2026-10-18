/**
 * Đánh lại mã hội viên theo đúng thứ tự ưu tiên của Chi hội:
 * HV0001 là Chủ nhiệm, kế tiếp các Phó Chủ nhiệm, Ban Chấp hành, rồi hội viên
 * (đã đóng phí và doanh nghiệp lớn lên trước), cuối cùng là người đã rời hội.
 *
 * Script này CHỈ đổi `code`. Từ 21/09/2026 (Chủ nhiệm chốt) tên đăng nhập
 * phải LUÔN trùng mã hiện tại — nên đổi mã xong BẮT BUỘC chạy tiếp
 * `npm run dong-bo-tai-khoan -- --ghi` để tên đăng nhập + cột tìm kiếm khớp
 * mã mới. Hội viên lỡ quen tên cũ vẫn đăng nhập được bằng số điện thoại.
 *
 *   npm run danh-lai-ma            (xem trước)
 *   npm run danh-lai-ma -- --ghi   (ghi vào cơ sở dữ liệu)
 */
import { prisma } from "../src/lib/prisma";
import { TEN_CAP_BAC } from "../src/lib/xep-hang";

const GHI = process.argv.includes("--ghi");

(async () => {
  const ds = await prisma.member.findMany({
    orderBy: [
      { trangThai: "asc" },
      { capBac: "asc" },
      { feePaidYear: "desc" },
      { doanhNghiepLon: "desc" },
      { joinedAt: "asc" },
      { company: "asc" },
    ],
    select: {
      id: true,
      code: true,
      name: true,
      company: true,
      capBac: true,
      trangThai: true,
      feePaidYear: true,
      doanhNghiepLon: true,
    },
  });

  console.log(`${ds.length} hội viên · thứ tự mới 20 người đầu:\n`);
  ds.slice(0, 20).forEach((m, i) => {
    const ma = `HV${String(i + 1).padStart(4, "0")}`;
    const nhan = [
      TEN_CAP_BAC[m.capBac],
      m.feePaidYear >= new Date().getFullYear() ? "đã đóng phí" : null,
      m.doanhNghiepLon ? "DN lớn" : null,
    ]
      .filter(Boolean)
      .join(" · ");
    console.log(
      `  ${ma}  ${m.name.padEnd(22)} ${m.company.slice(0, 40).padEnd(42)} ${nhan}`
    );
  });

  const doi = ds.filter((m, i) => m.code !== `HV${String(i + 1).padStart(4, "0")}`).length;
  console.log(`\n${doi}/${ds.length} hồ sơ sẽ đổi mã.`);

  if (!GHI) {
    console.log('Chạy lại với "-- --ghi" để lưu.');
    await prisma.$disconnect();
    return;
  }

  // Đổi qua mã tạm trước để không đụng ràng buộc "mã không được trùng"
  for (const [i, m] of ds.entries()) {
    await prisma.member.update({
      where: { id: m.id },
      data: { code: `TMP${i}-${m.id.slice(-6)}` },
    });
  }
  for (const [i, m] of ds.entries()) {
    await prisma.member.update({
      where: { id: m.id },
      data: { code: `HV${String(i + 1).padStart(4, "0")}` },
    });
  }

  // Mã nằm TRONG cột tìm kiếm searchText — đổi mã mà không tính lại là ô
  // tìm hội viên khớp theo mã CŨ, gõ "0018" ra người mang mã cũ HV0018
  // (lỗi đã lên web thật, Chủ nhiệm phát hiện 20/09/2026). Tính lại tại
  // chỗ, đừng bắt ai phải nhớ chạy thêm bước thứ hai.
  const { buildMemberSearchText } = await import("../src/lib/search");
  const moi = await prisma.member.findMany();
  for (const m of moi) {
    await prisma.member.update({
      where: { id: m.id },
      data: { searchText: buildMemberSearchText(m) },
    });
  }

  console.log(
    "Đã đánh lại mã và tính lại cột tìm kiếm.\n" +
      "BƯỚC TIẾP THEO BẮT BUỘC: npm run dong-bo-tai-khoan -- --ghi\n" +
      "(đồng bộ tên đăng nhập = mã mới — quy tắc Chủ nhiệm chốt 21/09/2026)"
  );
  await prisma.$disconnect();
})();
