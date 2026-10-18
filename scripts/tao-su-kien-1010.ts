/**
 * Tạo (hoặc cập nhật) bản ghi lịch hoạt động cho LỄ CHUYỂN GIAO & RA MẮT
 * BAN ĐIỀU HÀNH YBA CHỢ LỚN — Nhiệm kỳ I (2026–2029), ngày 10/10/2026.
 *
 * Landing 1010.ybacholon.vn (route /1010) đăng ký THAM DỰ qua đúng bản ghi
 * này — đăng ký chảy vào /quan-tri/lich-hoat-dong như mọi hoạt động khác,
 * Ban Tổ chức duyệt ở một chỗ quen thuộc. Đăng ký TÀI TRỢ của landing đi
 * qua Google Form riêng do Chủ nhiệm quản (không qua đây).
 *
 * Nội dung lấy NGUYÊN VĂN từ trang bìa proposal Ver5 (10.10_Ver5.pdf) —
 * đừng "viết lại cho hay": giờ giấc, địa điểm là thông tin in trên thư mời.
 *
 * Chạy lại an toàn (upsert theo slug):
 *   Máy dev :  npx tsx scripts/tao-su-kien-1010.ts
 *   Máy chủ :  sudo docker compose exec web npx tsx scripts/tao-su-kien-1010.ts
 */
import { prisma } from "../src/lib/prisma";

export const SLUG_1010 = "le-chuyen-giao-10-10-2026";

const DU_LIEU = {
  tieuDe: "Lễ chuyển giao & ra mắt Ban Điều hành YBA Chợ Lớn nhiệm kỳ I (2026 – 2029)",
  moTa:
    "Kỷ nguyên hội tụ – Huynh đệ vươn tầm. Ba phần trong một buổi chiều: " +
    "Tọa đàm doanh nhân, Lễ chuyển giao Ban Điều hành và Gala Dinner.",
  noiDung:
    "Chương trình gồm ba phần:\n" +
    "1. Tọa đàm doanh nhân\n" +
    "2. Lễ chuyển giao & ra mắt Ban Điều hành nhiệm kỳ I (2026 – 2029)\n" +
    "3. Gala Dinner\n" +
    "Chi tiết chương trình xem trong proposal đính kèm tại trang sự kiện.",
  yNghia:
    "Cột mốc chuyển giao giữa nhiệm kỳ XII và Ban Điều hành nhiệm kỳ I của " +
    "YBA Chợ Lớn — tri ân thế hệ đi trước, ra mắt đội ngũ mới.",
  banToChuc: "Chi hội Doanh nhân trẻ Chợ Lớn (YBA Chợ Lớn)",
  tuNgay: new Date("2026-10-10T07:00:00.000Z"), // 14:00 giờ Việt Nam
  gioText: "Thứ Bảy 10.10.2026 · 14:00 – 21:30",
  diaDiem: "Capella Gallery Hall — 24 Đường 3 Tháng 2, P. Hòa Hưng, TP.HCM",
  anhBia: "/su-kien-1010/trang-01.webp",
  lienKet: "/1010",
  nguon: "CHI_HOI",
  noiBat: true,
  published: true,
  choDangKy: true,
  // Danh sách khách mời không công bố trên web — chỉ Ban Tổ chức xem
  hienDanhSach: false,
  hanDangKy: new Date("2026-10-09T16:59:00.000Z"), // 23:59 ngày 09/10 giờ VN — đêm trước sự kiện
};

async function main() {
  const lich = await prisma.lichHoatDong.upsert({
    where: { slug: SLUG_1010 },
    create: { slug: SLUG_1010, ...DU_LIEU },
    update: DU_LIEU,
  });
  console.log("Đã có bản ghi lịch:", lich.slug, "· id =", lich.id);
  console.log("  ", lich.gioText, "·", lich.diaDiem);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
