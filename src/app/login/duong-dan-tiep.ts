/**
 * Chọn trang chuyển tới sau khi đăng nhập từ tham số `?tiep=` — hàm THUẦN để
 * form client và script kiểm thử dùng chung.
 *
 * Chỉ nhận đường dẫn NỘI BỘ. Ba cái bẫy đã gặp:
 *  1. `/\evil.example` qua được kiểm tra cũ `/^\/[^/]/` vì trình duyệt hiểu `\`
 *     như `/` → nhảy sang tên miền khác.
 *  2. Trình duyệt bỏ qua tab / xuống dòng trong URL ("/\t/evil" thành "//evil").
 *  3. `/..//evil.example` qua hết mọi kiểm tra trên CHỮ GÕ VÀO (một gạch chéo
 *     đầu, không có `\`, origin vẫn nội bộ) nhưng bộ phân giải URL rút gọn `..`
 *     thành `//evil.example` — địa chỉ tuyệt đối sang tên miền khác.
 * Vì vậy: chặn ký tự điều khiển / khoảng trắng / `\` ở đầu vào, so origin, RỒI
 * soát lại chính chuỗi kết quả trước khi trả về.
 */
export const TRANG_MAC_DINH = "/tai-khoan";

export function duongDanTiep(tiep: string | null | undefined): string {
  if (!tiep || tiep.length > 500) return TRANG_MAC_DINH;
  if (!tiep.startsWith("/") || tiep.startsWith("//")) return TRANG_MAC_DINH;
  // Ký tự điều khiển 0x00–0x20 (tab, xuống dòng, khoảng trắng), DEL và gạch chéo ngược
  if (/[\\\x00-\x20\x7f]/.test(tiep)) return TRANG_MAC_DINH;

  const goc = "http://yba.invalid";
  let u: URL;
  try {
    u = new URL(tiep, goc);
  } catch {
    return TRANG_MAC_DINH;
  }
  if (u.origin !== goc) return TRANG_MAC_DINH;
  // Không quay lại chính trang đăng nhập (vòng lặp) hay gọi thẳng API
  if (u.pathname === "/login" || u.pathname.startsWith("/api/"))
    return TRANG_MAC_DINH;

  const ra = u.pathname + u.search + u.hash;
  // Soát lại KẾT QUẢ, không chỉ chữ người dùng gõ: "/..//evil.example" qua được
  // hết các kiểm tra trên (bắt đầu bằng một dấu /, không có \, origin vẫn là
  // yba.invalid) nhưng bộ phân giải URL rút gọn ".." thành "//evil.example" —
  // trình duyệt hiểu hai gạch chéo đầu là địa chỉ TUYỆT ĐỐI sang tên miền khác.
  if (!ra.startsWith("/") || ra.startsWith("//")) return TRANG_MAC_DINH;
  if (/[\\\x00-\x20\x7f]/.test(ra)) return TRANG_MAC_DINH;
  return ra;
}
