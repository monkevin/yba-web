/**
 * Tạo ưu đãi mẫu để xem thử màn "Ưu đãi hội viên" trên Mini App.
 *
 * CHỈ tạo ưu đãi của Mon Amie — doanh nghiệp của chính anh Khang, và chính
 * anh đã nêu "Mon Amie ưu đãi 20% cho hội viên" trong đặc tả. TUYỆT ĐỐI
 * không tự tạo ưu đãi thay cho doanh nghiệp hội viên khác: họ chưa cam kết
 * gì, đăng lên là nói thay họ và Chi hội mất uy tín.
 *
 * Các doanh nghiệp khác tự đăng ưu đãi của mình qua trang quản trị.
 *
 * Chạy: npx tsx scripts/tao-uu-dai-mau.ts
 */
import { PrismaClient } from "@prisma/client";
import { normalizeSearch } from "../src/lib/search";

const prisma = new PrismaClient();

async function main() {
  const monAmie = await prisma.member.findFirst({
    where: { company: { contains: "HOÀNG VY" } },
    select: { id: true, company: true },
  });

  if (!monAmie) {
    console.log("Không tìm thấy Mon Amie (Hoàng Vy) trong danh sách hội viên.");
    return;
  }

  const uuDai = {
    slug: "mon-amie-uu-dai-hoi-vien-yba-cho-lon",
    memberId: monAmie.id,
    title: "Ưu đãi may đo vest cho hội viên YBA Chợ Lớn",
    mucUuDai: "Giảm 20%",
    summary:
      "Hội viên Chi hội Chợ Lớn được giảm 20% khi đặt may vest, tuxedo và sơ mi tại Mon Amie. " +
      "Áp dụng cho cả 5 chi nhánh, có dịch vụ đo tại doanh nghiệp.",
    dieuKien: [
      "Xuất trình thẻ hội viên điện tử trên Zalo Mini App khi đến cửa hàng",
      "Áp dụng cho đơn may đo, không áp dụng đồng thời chương trình khuyến mãi khác",
      "Đặt lịch trước để chuyên viên chuẩn bị vải và số đo",
    ].join("\n"),
    status: "DANG_HIEN",
    pinned: true,
  };

  await prisma.uuDai.upsert({
    where: { slug: uuDai.slug },
    create: {
      ...uuDai,
      searchText: normalizeSearch(
        `${uuDai.title} ${uuDai.mucUuDai} ${uuDai.summary} ${monAmie.company}`
      ),
    },
    update: {},
  });

  console.log(`Đã tạo ưu đãi cho ${monAmie.company}`);
  console.log(
    "Các doanh nghiệp khác cần TỰ đăng ưu đãi của mình — không tạo hộ."
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
