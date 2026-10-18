import fs from "fs";
import path from "path";

/**
 * Ảnh đại diện CÔNG KHAI của khách mời 10/10 trên landing — tạo từ cột
 * "ẢNH GỐC ĐÃ DÙNG" của Excel thư mời (script tao-anh-khach.py), lưu ở
 * public/su-kien-1010/khach/<số thư>.webp (320×320, nền navy). Chỉ ~2/3
 * khách có ảnh; khách không có thì giao diện hiện chữ cái đầu.
 *
 * Tên file theo SỐ THƯ (đoán được) là chấp nhận được vì ảnh này dùng để
 * hiển thị công khai — khác thiệp mời riêng tư trong thiep-1010/.
 */
/**
 * Ảnh chân dung BTC TỰ TẢI LÊN từ trang quản trị (khách thêm sau, chưa có
 * trong bộ ảnh nạp từ Excel). Lưu ở ổ dữ liệu để nâng cấp web không mất:
 * máy chủ Docker `/data/anh-khach`, máy dev `public/su-kien-1010/khach/tai-len`.
 * Tên file = mã CL của khách; phục vụ qua /api/khach-moi-1010/anh/<mã>.
 */
export function thuMucAnhKhachLen(): string {
  return fs.existsSync("/data")
    ? path.join("/data", "anh-khach")
    : path.join(process.cwd(), "public", "su-kien-1010", "khach", "tai-len");
}

export const DUOI_ANH_KHACH: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  png: "image/png",
};

export function timAnhKhachLen(
  ma: string
): { duongDan: string; loai: string; duoi: string } | null {
  if (!/^CL-[A-Z0-9]{5}$/.test(ma)) return null;
  for (const [duoi, loai] of Object.entries(DUOI_ANH_KHACH)) {
    const p = path.join(thuMucAnhKhachLen(), `${ma}.${duoi}`);
    if (fs.existsSync(p)) return { duongDan: p, loai, duoi };
  }
  return null;
}

export function anhKhach1010(
  soThu: string | null,
  ma?: string | null
): string | null {
  // 1) ảnh BTC tự tải lên (mới nhất, nằm ngoài mã nguồn)
  if (ma && timAnhKhachLen(ma)) return `/api/khach-moi-1010/anh/${ma}`;
  // Khách BTC thêm tay (dán danh sách / thêm lẻ) không có số thư — ảnh chân
  // dung đặt tên theo mã CL: public/su-kien-1010/khach/CL-XXXXX.webp
  if (ma && /^CL-[A-Z0-9]{5}$/.test(ma)) {
    const fm = path.join(
      process.cwd(),
      "public",
      "su-kien-1010",
      "khach",
      `${ma}.webp`
    );
    if (fs.existsSync(fm)) return `/su-kien-1010/khach/${ma}.webp`;
  }
  if (!soThu || !/^\d{3}$/.test(soThu)) return null;
  const f = path.join(
    process.cwd(),
    "public",
    "su-kien-1010",
    "khach",
    `${soThu}.webp`
  );
  return fs.existsSync(f) ? `/su-kien-1010/khach/${soThu}.webp` : null;
}
