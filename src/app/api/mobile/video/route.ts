import { prisma } from "@/lib/prisma";
import { moJson, moOptions } from "@/lib/mobile-cors";

export const OPTIONS = moOptions;

/**
 * Thư viện video — cùng dữ liệu với /video trên web.
 * GET /api/mobile/video?trang=1
 *
 * Trả kèm `anh` (ảnh đại diện) để Mini App khỏi phải nhúng iframe chỉ để hiện
 * cái ảnh: iframe YouTube trong webview Zalo vừa nặng vừa hay bị chặn. App chỉ
 * mở YouTube khi hội viên bấm xem.
 *
 * `anh` trỏ về CHÍNH máy chủ này (`/api/mobile/video/anh/...`) chứ không trỏ
 * thẳng i.ytimg.com — Zalo Mini App chỉ cho gọi ra tên miền đã khai trong danh
 * sách cho phép, đi vòng qua đây thì chắc chắn hiện được ảnh.
 */

const MOI_TRANG = 20;

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const trang = Math.max(1, Number(sp.get("trang") ?? 1) || 1);

  const where = { published: true };

  const [tong, ds] = await Promise.all([
    prisma.video.count({ where }),
    prisma.video.findMany({
      where,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { order: "asc" }],
      skip: (trang - 1) * MOI_TRANG,
      take: MOI_TRANG,
      select: {
        youtubeId: true,
        title: true,
        summary: true,
        publishedAt: true,
        featured: true,
      },
    }),
  ]);

  return moJson({
    tong,
    trang,
    soTrang: Math.max(1, Math.ceil(tong / MOI_TRANG)),
    video: ds.map((v) => ({
      ...v,
      // Đường dẫn TƯƠNG ĐỐI — Mini App tự ghép tên miền qua `urlAnh()`
      anh: `/api/mobile/video/anh/${v.youtubeId}`,
      lienKet: `https://www.youtube.com/watch?v=${v.youtubeId}`,
    })),
  });
}
