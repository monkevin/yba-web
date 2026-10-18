import fs from "fs";
import path from "path";

/**
 * Vị trí file thiệp mời 10/10 — CHỈ dùng ở máy chủ.
 *
 * Có hai nguồn thiệp:
 * 1. Thiệp nạp hàng loạt từ Excel + thư mục ảnh của BTC: `thiep-1010/<số thư>.jpg`
 *    (nằm trong mã nguồn, được COPY vào ảnh Docker lúc build).
 * 2. Thiệp TẢI LÊN từ trang quản trị cho khách mời thêm sau: lưu ở ổ DỮ LIỆU
 *    để nâng cấp phiên bản web không mất — trên máy chủ Docker là `/data/thiep-len`
 *    (volume ./du-lieu), máy dev không có /data thì nằm ở `thiep-1010/tai-len`.
 *    Trong CSDL, `soThu` của thiệp tải lên có dạng `len:CL-XXXXX.jpg`.
 *
 * Cả hai đều NGOÀI public/ — chỉ phục vụ qua API theo mã CL không đoán được.
 */

export function thuMucThiepGoc(): string {
  return path.join(process.cwd(), "thiep-1010");
}

export function thuMucThiepLen(): string {
  return fs.existsSync("/data")
    ? path.join("/data", "thiep-len")
    : path.join(thuMucThiepGoc(), "tai-len");
}

export const DUOI_THIEP: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * Từ `soThu` trong CSDL → file thiệp trên đĩa + content-type.
 * Trả null khi soThu không hợp lệ hoặc file không tồn tại.
 */
export function timFileThiep(
  soThu: string
): { duongDan: string; loai: string; duoi: string } | null {
  if (soThu.startsWith("len:")) {
    const ten = soThu.slice(4);
    const m = /^CL-[A-Z0-9]{5}\.(jpg|png|webp)$/.exec(ten);
    if (!m) return null;
    const duongDan = path.join(thuMucThiepLen(), ten);
    if (!fs.existsSync(duongDan)) return null;
    return { duongDan, loai: DUOI_THIEP[m[1]], duoi: m[1] };
  }
  // Thiệp gốc đặt tên theo số thư trong Excel (001…315)
  if (!/^[\w-]+$/.test(soThu)) return null;
  const duongDan = path.join(thuMucThiepGoc(), `${soThu}.jpg`);
  if (!fs.existsSync(duongDan)) return null;
  return { duongDan, loai: "image/jpeg", duoi: "jpg" };
}
