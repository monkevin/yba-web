"use server";

/**
 * Server action Lá bài mỗi ngày. Người chơi lấy từ phiên đăng nhập (qua
 * `chay()` — đã chặn khi Ban tạm dừng game); `viTri` từ trình duyệt chỉ để
 * hiển thị, kết quả quyết định ở máy chủ.
 */
import { chay } from "@/lib/ngoi-nha/chay-action";
import { latLaBai } from "@/lib/ngoi-nha/la-bai";

export async function aLatLaBai(viTri: number) {
  return chay((nguoi) => latLaBai(nguoi, Number(viTri)));
}
