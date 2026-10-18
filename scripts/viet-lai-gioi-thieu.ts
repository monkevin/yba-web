/**
 * Viết lại phần giới thiệu cho toàn bộ hồ sơ bằng văn mẫu đa giọng.
 *
 *   npm run viet-lai-gioi-thieu            → xem trước 6 bài mẫu
 *   npm run viet-lai-gioi-thieu -- --ghi   → ghi thật
 *
 * KHÔNG đè lên 6 hồ sơ đã có nội dung đọc từ website chính thức
 * (danh sách trong prisma/gioi-thieu-tu-website.ts) và hồ sơ hội viên tự sửa.
 */
import { PrismaClient } from "@prisma/client";
import { GIOI_THIEU_WEB } from "../prisma/gioi-thieu-tu-website";
import { vietGioiThieu } from "../prisma/van-mau-gioi-thieu";
import { normalizeSearch } from "../src/lib/search";
import { tenDoanhNghiep } from "../src/lib/ten-doanh-nghiep";

const prisma = new PrismaClient();

async function main() {
  const ghi = process.argv.includes("--ghi");

  const members = await prisma.member.findMany({
    include: {
      category: { select: { name: true } },
      // Số lần đã tài trợ chương trình của Chi hội — dữ liệu thật để viết vào bài
      _count: { select: { taiTroSuKien: true } },
    },
    orderBy: { code: "asc" },
  });

  // Hồ sơ có nội dung thật đọc từ website chính thức của doanh nghiệp.
  // Lấy bản GỐC từ file nguồn chứ không đọc lại `description` trong CSDL —
  // đọc từ CSDL thì lần chạy thứ hai sẽ nối chồng lên phần đã nối lần trước.
  const banGoc = new Map<string, string>();
  for (const g of GIOI_THIEU_WEB) {
    const khoa = normalizeSearch(g.khop);
    for (const m of members) {
      if (normalizeSearch(m.company).includes(khoa)) banGoc.set(m.id, g.gioiThieu);
    }
  }

  let soViet = 0;
  let soGiuMoDau = 0;
  const mau: string[] = [];

  for (const m of members) {
    // Hồ sơ đang chờ duyệt = hội viên vừa tự sửa — không đè công sức của họ
    if (m.profileStatus === "CHO_DUYET") continue;

    const bai = vietGioiThieu({
      ten: tenDoanhNghiep(m.company),
      nganh: m.category?.name ?? m.industry,
      sanPham: m.offering,
      dichVu: m.services,
      nam: m.joinedAt.getFullYear(),
      namThanhLap: m.foundedYear,
      quyMo: m.headcount,
      khuVuc: m.district ? `${m.district}, TP.HCM` : null,
      diaChi: m.address,
      website: m.website,
      nguoiDaiDien: m.name,
      chucVu: m.position,
      vaiTroHoi: m.hoiRole,
      laHoiVienVang: m.memberType === "Hội viên vàng",
      laDoanhNghiepLon: m.doanhNghiepLon,
      dangTim: m.needing,
      soLanTaiTro: m._count.taiTroSuKien,
    });

    // Hồ sơ có nội dung thật đọc từ website: GIỮ NGUYÊN phần đó làm mở đầu,
    // chỉ nối thêm các đoạn dựng từ dữ liệu để bài đủ dày.
    let noiDung = bai;
    let intro = bai.split("\n")[0].slice(0, 200);

    const goc = banGoc.get(m.id)?.trim();
    if (goc) {

      // Bỏ đoạn mở đầu tự sinh, chỉ lấy các đoạn thông tin phía sau
      const themVao = bai
        .split(/\n{2,}/)
        .slice(1)
        .filter((d) => {
          // Không nối lại ý đã có sẵn trong bài gốc
          const dau = d.slice(0, 25).toLowerCase();
          return !goc.toLowerCase().includes(dau);
        });
      if (!themVao.length) continue;

      noiDung = [goc, ...themVao].join("\n\n");
      intro = goc.split("\n")[0].slice(0, 200);
      soGiuMoDau++;
    }

    if (ghi) {
      await prisma.member.update({
        where: { id: m.id },
        data: { description: noiDung, intro },
      });
    } else if (mau.length < 6) {
      mau.push(`── ${tenDoanhNghiep(m.company)} ──\n${noiDung}`);
    }
    soViet++;
  }

  console.log(
    `Cập nhật ${soViet} hồ sơ · trong đó ${soGiuMoDau} hồ sơ giữ nguyên phần viết từ website và chỉ nối thêm.`
  );
  if (!ghi) {
    console.log("\n" + mau.join("\n\n"));
    console.log("\nGhi thật: npm run viet-lai-gioi-thieu -- --ghi\n");
  } else {
    console.log("✓ Xong.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
