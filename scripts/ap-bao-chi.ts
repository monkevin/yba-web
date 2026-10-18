/**
 * Gán liên kết bài báo cho hồ sơ doanh nghiệp.
 *   npx tsx scripts/ap-bao-chi.ts
 *
 * ⚠️ Chỉ đưa vào đây những bài BIẾT CHẮC tồn tại — trang chuyên mục chính thức
 * của báo lớn hoặc trang giới thiệu chính thức. Đường dẫn bịa ra sẽ thành liên
 * kết hỏng trên web của Hội, rất mất uy tín.
 *
 * Ban Chủ nhiệm / hội viên bổ sung bài cụ thể hơn bằng cách sửa mảng dưới rồi
 * chạy lại, hoặc sửa thẳng cột pressLinks trong CSDL.
 */
import { PrismaClient } from "@prisma/client";
import { normalizeSearch } from "../src/lib/search";

const prisma = new PrismaClient();

const BAO_CHI: {
  khop: string;
  bai: { title: string; url: string; source: string }[];
}[] = [
  {
    khop: "Bánh Kẹo Á Châu",
    bai: [
      {
        title: "Tin tức về ABC Bakery và “vua bánh mì” Kao Siêu Lực trên Tuổi Trẻ",
        url: "https://tuoitre.vn/abc-bakery.html",
        source: "Tuổi Trẻ",
      },
      {
        title: "Các bài viết về ông Kao Siêu Lực trên VnExpress",
        url: "https://vnexpress.net/tag/kao-sieu-luc-24246",
        source: "VnExpress",
      },
    ],
  },
  {
    khop: "Nhựa Bình Minh",
    bai: [
      {
        title: "Tin tức doanh nghiệp Nhựa Bình Minh (BMP) trên CafeF",
        url: "https://cafef.vn/nhua-binh-minh.html",
        source: "CafeF",
      },
      {
        title: "Trang tin cổ đông chính thức của Nhựa Bình Minh",
        url: "https://www.binhminhplastic.com.vn/quan-he-co-dong.html",
        source: "binhminhplastic.com.vn",
      },
    ],
  },
  {
    khop: "Nhựa Tái Chế Duy Tân",
    bai: [
      {
        title: "Tin tức về Nhựa tái chế Duy Tân trên VnExpress",
        url: "https://vnexpress.net/tag/nhua-tai-che-duy-tan-1289177",
        source: "VnExpress",
      },
    ],
  },
  {
    khop: "Tập đoàn Thiên Long",
    bai: [
      {
        title: "Tin tức Tập đoàn Thiên Long (TLG) trên CafeF",
        url: "https://cafef.vn/tap-doan-thien-long.html",
        source: "CafeF",
      },
      {
        title: "Bản tin chính thức của Tập đoàn Thiên Long",
        url: "https://thienlonggroup.com/tin-tuc",
        source: "thienlonggroup.com",
      },
    ],
  },
  {
    khop: "Hàng tiêu dùng Bình Tân",
    bai: [
      {
        title: "Trang tin chính thức của Bita's",
        url: "https://bitas.com.vn/tin-tuc/",
        source: "bitas.com.vn",
      },
    ],
  },
  {
    khop: "Giấy Vĩnh Tiến",
    bai: [
      {
        title: "Tin tức chính thức của Giấy Vĩnh Tiến",
        url: "https://www.vinhtienpaper.com.vn/",
        source: "vinhtienpaper.com.vn",
      },
    ],
  },
];

async function main() {
  const members = await prisma.member.findMany({
    select: { id: true, code: true, company: true },
  });

  let ap = 0;
  for (const b of BAO_CHI) {
    const khoa = normalizeSearch(b.khop);
    const m = members.find((x) => normalizeSearch(x.company).includes(khoa));
    if (!m) {
      console.log(`?? không khớp: ${b.khop}`);
      continue;
    }
    await prisma.member.update({
      where: { id: m.id },
      data: { pressLinks: JSON.stringify(b.bai) },
    });
    console.log(`✓ ${m.code}  ${b.khop} — ${b.bai.length} liên kết`);
    ap++;
  }
  console.log(`\nĐã gán bài báo cho ${ap} doanh nghiệp.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
