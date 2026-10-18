import { prisma } from "@/lib/prisma";

/**
 * Danh sách chương trình định kỳ và mảng hoạt động đang dùng — đổ vào ô gợi ý
 * của biểu mẫu sự kiện để Ban Chủ nhiệm gõ nhất quán, không đẻ ra biến thể mới.
 */
export async function goiYPhanLoai() {
  const [chuongTrinh, mang] = await Promise.all([
    prisma.event.groupBy({
      by: ["seriesName"],
      where: { seriesName: { not: null } },
      orderBy: { seriesName: "asc" },
    }),
    prisma.event.groupBy({
      by: ["activityGroup"],
      where: { activityGroup: { not: null } },
      orderBy: { activityGroup: "asc" },
    }),
  ]);

  return {
    cacChuongTrinh: chuongTrinh.map((c) => c.seriesName!).filter(Boolean),
    cacMang: mang.map((m) => m.activityGroup!).filter(Boolean),
  };
}
