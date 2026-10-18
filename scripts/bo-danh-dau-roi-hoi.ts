/**
 * Trả toàn bộ hội viên về trạng thái đang sinh hoạt.
 *
 * Ban Chủ nhiệm đã chốt: chưa đóng hội phí KHÔNG đồng nghĩa với rời hội. Hồ sơ
 * và doanh nghiệp của họ vẫn giữ nguyên và vẫn hiển thị bình thường; khác biệt
 * duy nhất là người đã đóng phí được ưu tiên xếp lên trên.
 *
 *   npm run bo-roi-hoi
 */
import { prisma } from "../src/lib/prisma";

(async () => {
  const truoc = await prisma.member.count({ where: { trangThai: "ROI_HOI" } });

  const kq = await prisma.member.updateMany({
    where: { trangThai: { not: "HOAT_DONG" } },
    data: { trangThai: "HOAT_DONG" },
  });

  const tong = await prisma.member.count();
  const hienThi = await prisma.member.count({
    where: { active: true, publicVisible: true },
  });

  console.log(`Đã trả ${kq.count} hồ sơ về trạng thái đang sinh hoạt (trước đó ${truoc} bị đánh rời hội).`);
  console.log(`${hienThi}/${tong} hội viên đang hiển thị công khai.`);
  await prisma.$disconnect();
})();
