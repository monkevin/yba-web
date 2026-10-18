import { moOptions } from "@/lib/mobile-cors";

export const OPTIONS = moOptions;

/**
 * Lấy hộ ảnh đại diện video từ YouTube.
 * GET /api/mobile/video/anh/[youtubeId]
 *
 * VÌ SAO phải đi vòng qua máy chủ mình thay vì trỏ thẳng i.ytimg.com: Zalo Mini
 * App chỉ cho gọi ra các tên miền đã khai trong danh sách cho phép ở trang quản
 * trị. ybacholon.vn thì app vốn đã gọi (toàn bộ dữ liệu lấy từ đây), nên đi qua
 * đường này là chắc chắn hiện được ảnh, không phụ thuộc cấu hình bên Zalo.
 *
 * YouTube không phải lúc nào cũng có bản `maxresdefault`; thử lần lượt từ đẹp
 * xuống thấp, hết mới chịu thua.
 */

const CO_ANH = ["maxresdefault", "hqdefault", "mqdefault", "default"] as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ youtubeId: string }> }
) {
  const { youtubeId } = await params;

  // Mã video YouTube luôn là 11 ký tự chữ–số–gạch; chặn ở đây để không biến
  // đường dẫn này thành cổng tải hộ bất kỳ thứ gì trên mạng.
  if (!/^[A-Za-z0-9_-]{11}$/.test(youtubeId)) {
    return new Response("Mã video không hợp lệ", { status: 400 });
  }

  for (const co of CO_ANH) {
    try {
      const r = await fetch(`https://i.ytimg.com/vi/${youtubeId}/${co}.jpg`, {
        // Ảnh đại diện gần như không đổi — cho phép nằm bộ nhớ đệm cả ngày
        next: { revalidate: 86400 },
      });
      if (!r.ok) continue;
      // YouTube trả ảnh xám 120x90 khi không có cỡ đó — bỏ qua, thử cỡ nhỏ hơn
      const dai = Number(r.headers.get("content-length") ?? 0);
      if (co !== "default" && dai > 0 && dai < 2000) continue;

      return new Response(r.body, {
        status: 200,
        headers: {
          "content-type": r.headers.get("content-type") ?? "image/jpeg",
          "cache-control": "public, max-age=86400, s-maxage=604800",
          "access-control-allow-origin": "*",
        },
      });
    } catch {
      /* thử cỡ tiếp theo */
    }
  }

  return new Response("Không lấy được ảnh video", { status: 404 });
}
