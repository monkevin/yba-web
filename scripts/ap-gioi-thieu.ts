/**
 * Áp phần giới thiệu đọc từ website chính thức của hội viên vào hồ sơ.
 *
 *   npm run ap-gioi-thieu             → xem trước
 *   npm run ap-gioi-thieu -- --ghi    → ghi thật
 *
 * Nội dung nằm trong `prisma/gioi-thieu-tu-website.ts`. Mỗi lần đọc thêm website
 * của hội viên thì thêm mục vào file đó rồi chạy lại lệnh này.
 */
import { PrismaClient } from "@prisma/client";
import { GIOI_THIEU_WEB } from "../prisma/gioi-thieu-tu-website";
import { normalizeSearch } from "../src/lib/search";
import { tenDoanhNghiep } from "../src/lib/ten-doanh-nghiep";

const prisma = new PrismaClient();

async function main() {
  const ghi = process.argv.includes("--ghi");
  const members = await prisma.member.findMany({
    select: { id: true, code: true, company: true, searchText: true, foundedYear: true },
  });

  let ap = 0;
  const khongKhop: string[] = [];

  for (const g of GIOI_THIEU_WEB) {
    const khoa = normalizeSearch(g.khop);
    const hop = members.filter((m) => normalizeSearch(m.company).includes(khoa));

    if (hop.length === 0) {
      khongKhop.push(g.khop);
      continue;
    }
    if (hop.length > 1) {
      console.log(
        `⚠ "${g.khop}" khớp ${hop.length} doanh nghiệp — dùng cái đầu: ${hop.map((h) => h.code).join(", ")}`
      );
    }

    const m = hop[0];
    console.log(`${ghi ? "→ ghi" : "  khớp"}  ${m.code}  ${tenDoanhNghiep(m.company)}`);

    if (ghi) {
      await prisma.member.update({
        where: { id: m.id },
        data: {
          description: g.gioiThieu,
          intro: g.gioiThieu.split("\n")[0].slice(0, 200),
          foundedYear: g.namThanhLap ?? m.foundedYear,
          ...(g.nangLuc?.length ? { capabilities: g.nangLuc.join("\n") } : {}),
        },
      });

      if (g.sanPham?.length) {
        // Thay danh sách sản phẩm tách máy móc bằng danh sách chuẩn từ website
        await prisma.product.deleteMany({ where: { memberId: m.id } });
        await prisma.product.createMany({
          data: g.sanPham.map((sp, i) => ({
            memberId: m.id,
            name: sp,
            priceText: "Liên hệ báo giá",
            order: i,
          })),
        });
      }
    }
    ap++;
  }

  console.log(`\nĐã ${ghi ? "áp" : "khớp"} ${ap}/${GIOI_THIEU_WEB.length} doanh nghiệp.`);
  if (khongKhop.length) {
    console.log(`Không tìm thấy trong CSDL: ${khongKhop.join(" | ")}`);
  }
  if (!ghi) console.log("\nMuốn ghi thật: npm run ap-gioi-thieu -- --ghi\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
