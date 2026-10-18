/**
 * Nhận biết hội viên có chức danh trong Ban Chủ nhiệm / Ban Chấp hành.
 *
 * Dùng cho hai việc:
 *   1. Miễn duyệt khi đăng tin (Ban Chủ nhiệm đăng là hiện ngay, hội viên
 *      thường thì chờ duyệt) — Ban Chủ nhiệm chốt 20/08/2026.
 *   2. Đánh dấu ưu tiên khi hiển thị hội viên trên Mini App.
 *
 * Căn cứ DUY NHẤT là cột `Member.hoiRole` (chức vụ trong Hội) — cột này do Ban
 * Thư ký nhập tay, KHÔNG phải tài khoản đăng nhập web (`User.role`): một người
 * có thể là Chủ nhiệm Chi hội mà chưa từng đăng nhập website bao giờ.
 *
 * Danh sách từ khoá giữ trùng với `laBTC` trong Mini App
 * (`miniapp-ybacholon/src/components/ThamDuSuKien.jsx`) — sửa một bên phải
 * sửa cả bên kia.
 */

const TU_KHOA_BAN_CHU_NHIEM = [
  "Chủ nhiệm",
  "Phó Chủ nhiệm",
  "Ban Chấp hành",
  "Trưởng ban",
  "Phó ban",
  "Chủ tịch",
  "Phó Chủ tịch",
  "Thư ký",
] as const;

/** Người này có chức danh trong Ban Chủ nhiệm / Ban Chấp hành hay không. */
export function laBanChuNhiem(hoiRole?: string | null): boolean {
  if (!hoiRole?.trim()) return false;
  return TU_KHOA_BAN_CHU_NHIEM.some((tu) => hoiRole.includes(tu));
}

/**
 * Nhãn ngắn để hiện lên thẻ hội viên trong Mini App. Chức vụ trong Hội thường
 * viết dài ("Phó Chủ nhiệm Chi hội Doanh nhân trẻ Chợ Lớn") — cắt phần đuôi
 * lặp lại tên Chi hội cho gọn màn hình điện thoại.
 */
export function nhanChucDanh(hoiRole?: string | null): string | null {
  const s = hoiRole?.trim();
  if (!s) return null;
  return s
    .replace(/\s*Chi hội\s+(Doanh nhân trẻ\s+)?Chợ Lớn\s*/i, " ")
    .replace(/\s*-\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
