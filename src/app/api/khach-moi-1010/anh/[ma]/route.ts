import fs from "fs";
import { NextRequest } from "next/server";
import { timAnhKhachLen } from "@/lib/khach-1010";

/**
 * Phục vụ ẢNH CHÂN DUNG khách mời 10/10 do BTC tải lên từ trang quản trị
 * (file nằm ở ổ dữ liệu `/data/anh-khach`, ngoài public/ nên phải qua đây).
 * Ảnh này hiển thị CÔNG KHAI trên landing nên không cần đăng nhập.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ma: string }> }
) {
  const { ma } = await params;
  const maChuan = decodeURIComponent(ma).trim().toUpperCase();
  const file = timAnhKhachLen(maChuan);
  if (!file) return new Response("Không có ảnh", { status: 404 });

  const anh = fs.readFileSync(file.duongDan);
  return new Response(new Uint8Array(anh), {
    headers: {
      "Content-Type": file.loai,
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}
