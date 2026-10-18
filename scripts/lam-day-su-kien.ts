/**
 * Viết phần nội dung cho các sự kiện nhập tự động từ thư mục ảnh.
 *
 *   npm run lam-day-su-kien           → xem trước
 *   npm run lam-day-su-kien -- --ghi  → ghi vào cơ sở dữ liệu
 *
 * ⚠️ Nội dung mô tả các chương trình định kỳ lấy từ chính Profile Chi hội
 * (phần giới thiệu Coffee Share, Business & Library, Thư viện Container…).
 * Script KHÔNG bịa số người tham dự, khách mời hay kết quả cụ thể của từng kỳ —
 * những chi tiết đó Ban Truyền thông bổ sung sau trong trang quản trị.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Giới thiệu từng chương trình định kỳ — trích từ Profile Chi hội. */
const GIOI_THIEU_CHUONG_TRINH: Record<string, string> = {
  "Coffee Share":
    "Coffee Share là chương trình gặp gỡ định kỳ của Chi hội Chợ Lớn, tạo ra một môi trường giao lưu thân thiện để hội viên chia sẻ kinh nghiệm quản trị, ý tưởng kinh doanh và thông tin thị trường. Mỗi kỳ xoay quanh một chủ đề riêng do chính hội viên đứng lớp hoặc mời chuyên gia chia sẻ.",
  "Business & Library":
    "Business & Library là hoạt động gắn kết các thành viên Chi hội, nơi hội viên trao đổi và học hỏi kinh nghiệm kinh doanh lẫn nhau. Chương trình hướng tới nâng tầm năng lực quản trị cho từng doanh nghiệp trong Hội.",
  "Connect Beyond":
    "Connect Beyond là chuỗi toạ đàm chuyên đề của Chi hội Chợ Lớn, bàn về những vấn đề đang tác động trực tiếp tới doanh nghiệp: chính sách, thuế quan, thị trường và cơ hội hợp tác quốc tế.",
  "Caravan xúc tiến thương mại":
    "Caravan xúc tiến thương mại là hành trình kết nối giao thương giữa doanh nghiệp hội viên YBA Chợ Lớn với hội doanh nhân trẻ các tỉnh thành. Mỗi chuyến đi gồm thăm doanh nghiệp địa phương, gặp gỡ lãnh đạo tỉnh và kết nối cơ hội hợp tác cụ thể giữa hai bên.",
  "CLB Pickleball":
    "CLB Pickleball YBA là sân chơi thể thao giao lưu của Chi hội, giúp hội viên rèn luyện sức khoẻ đồng thời tăng cường kết nối qua tinh thần thể thao vui khoẻ — năng động — tích cực.",
  "Thư viện Container":
    "Thư viện Container là dự án cộng đồng của Hội Doanh nhân trẻ TP.HCM với thông điệp “Mỗi trang sách, vạn ước mơ”. Chi hội Chợ Lớn cùng chung tay đưa thư viện tới học sinh vùng sâu vùng xa, tạo điều kiện cho các em được đọc sách và vui chơi.",
  "Nhịp cầu Doanh nhân":
    "Nhịp cầu Doanh nhân là chương trình thiện nguyện xây cầu dân sinh tại các địa phương còn khó khăn, do doanh nghiệp hội viên Chi hội Chợ Lớn đóng góp và trực tiếp tham gia.",
  "Rạp phim Yêu thương":
    "Rạp phim Yêu thương mang những buổi chiếu phim tới các em nhỏ có hoàn cảnh đặc biệt — một hoạt động cộng đồng thường niên của Chi hội Chợ Lớn.",
  "Họp mặt hội viên":
    "Họp mặt hội viên là dịp sinh hoạt định kỳ theo quý của Chi hội: điểm lại hoạt động trong kỳ, chào đón hội viên mới, và tạo cơ hội để anh chị em gặp gỡ, kết nối giao thương trực tiếp.",
  "Ăn trưa cùng hội viên":
    "Ăn trưa cùng hội viên là buổi gặp gỡ quy mô nhỏ, không khí thân mật, giúp Ban Chủ nhiệm lắng nghe hội viên và kết nối các doanh nghiệp có nhu cầu hợp tác với nhau.",
  "Thăm doanh nghiệp hội viên":
    "Thăm doanh nghiệp hội viên là hoạt động tham quan trực tiếp nhà xưởng, văn phòng của anh chị em trong Chi hội — vừa để hiểu năng lực của nhau, vừa mở ra cơ hội hợp tác cụ thể.",
  "Tiệc tất niên YEP":
    "Tiệc tất niên YEP là sự kiện lớn nhất trong năm của Chi hội: tổng kết hoạt động, tri ân hội viên và các đơn vị đồng hành, đồng thời công bố định hướng cho năm tiếp theo.",
  "Coffee Connect":
    "Coffee Connect là buổi cà phê kết nối giữa hội viên Chi hội Chợ Lớn với doanh nhân từ các chi hội và hội bạn.",
};

/** Nội dung mặc định theo mảng hoạt động, dùng khi sự kiện không thuộc chương trình định kỳ. */
const GIOI_THIEU_MANG: Record<string, string> = {
  "Kết nối hội viên":
    "Hoạt động thuộc mảng kết nối hội viên của Chi hội Chợ Lớn — tạo thêm cơ hội để anh chị em doanh nhân gặp gỡ, hiểu nhau và hợp tác cùng phát triển.",
  "Kết nối & hội nhập":
    "Hoạt động thuộc mảng kết nối và hội nhập của Chi hội Chợ Lớn — mở rộng quan hệ với doanh nghiệp ngoài Hội, các hội bạn và đối tác quốc tế.",
  "Xúc tiến thương mại":
    "Hoạt động thuộc mảng xúc tiến thương mại của Chi hội Chợ Lớn — kết nối trực tiếp cơ hội mua bán, hợp tác giữa doanh nghiệp hội viên với các đối tác trong và ngoài Hội.",
  "Thể thao & gia đình":
    "Hoạt động thuộc mảng thể thao và gia đình của Chi hội Chợ Lớn — nơi hội viên cùng gia đình rèn luyện sức khoẻ và gắn kết ngoài công việc.",
  "Trách nhiệm cộng đồng":
    "Hoạt động thuộc mảng trách nhiệm cộng đồng của Chi hội Chợ Lớn — doanh nghiệp hội viên chung tay đóng góp cho xã hội, đúng tinh thần “kinh doanh gắn liền với trách nhiệm”.",
};

function demAnh(gallery: string | null): number {
  if (!gallery) return 0;
  try {
    const a = JSON.parse(gallery);
    return Array.isArray(a) ? a.length : 0;
  } catch {
    return 0;
  }
}

async function main() {
  const ghi = process.argv.includes("--ghi");
  const ds = await prisma.event.findMany({ orderBy: { startAt: "desc" } });

  let soViet = 0;
  const viDu: string[] = [];

  for (const e of ds) {
    if (e.content) continue; // đã có nội dung do người viết — không đè

    const doan: string[] = [];

    const gioiThieu =
      (e.seriesName && GIOI_THIEU_CHUONG_TRINH[e.seriesName]) ||
      (e.activityGroup && GIOI_THIEU_MANG[e.activityGroup]) ||
      "Hoạt động của Chi hội Doanh nhân trẻ Chợ Lớn, trực thuộc Hội Doanh nhân trẻ TP.HCM.";
    doan.push(gioiThieu);

    const ngay = new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(e.startAt);
    const denNgay = e.endAt
      ? ` đến ${new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(e.endAt)}`
      : "";

    doan.push(
      `Chương trình “${e.title}” được Chi hội tổ chức ngày ${ngay}${denNgay}${
        e.location ? ` tại ${e.location}` : ""
      }.`
    );

    const soAnh = demAnh(e.gallery);
    if (soAnh > 0) {
      doan.push(
        `Dưới đây là ${soAnh} hình ảnh ghi lại không khí của chương trình. Anh chị hội viên muốn nhận file ảnh gốc, vui lòng liên hệ Ban Truyền thông Chi hội.`
      );
    }

    doan.push(
      "Theo dõi các hoạt động sắp tới của Chi hội tại mục Sự kiện trên website hoặc fanpage YBA Chợ Lớn."
    );

    const noiDung = doan.join("\n\n");
    if (ghi) {
      await prisma.event.update({ where: { id: e.id }, data: { content: noiDung } });
    } else if (viDu.length < 2) {
      viDu.push(`── ${e.title} ──\n${noiDung}`);
    }
    soViet++;
  }

  console.log(`Sự kiện được viết nội dung: ${soViet}/${ds.length}`);
  if (!ghi) {
    console.log("\n── XEM TRƯỚC, chưa ghi gì ──\n");
    console.log(viDu.join("\n\n"));
    console.log("\n\nMuốn ghi thật: npm run lam-day-su-kien -- --ghi\n");
  } else {
    console.log("✓ Đã ghi xong.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
