/**
 * Chuẩn hoá số điện thoại Việt Nam — hàm THUẦN (không đụng CSDL, không import
 * prisma) để dùng chung cho đăng nhập web, Zalo Mini App, form hồ sơ và script.
 *
 * Dạng lưu trong CSDL là `0xxxxxxxxx` (10 chữ số). Zalo trả `84xxxxxxxxx`, hội
 * viên khai vào Google Sheet đủ kiểu: có dấu chấm, khoảng trắng, +84, mất số 0
 * đầu vì ô Excel để kiểu số.
 */

/** Đưa một chuỗi SĐT bất kỳ về dạng `0xxxxxxxxx` nếu nhận ra được. */
export function chuanSoDienThoai(raw: string | null | undefined): string {
  let so = String(raw ?? "").replace(/\D/g, "");
  // Quay số quốc tế kiểu 0084…
  if (so.startsWith("0084")) so = so.slice(2);
  if (so.startsWith("84")) {
    // 84 + 9 số (Zalo trả dạng này)
    if (so.length === 11) return "0" + so.slice(2);
    // "+84 (0) 903…" → còn dính số 0 sau 84
    if (so.length === 12 && so[2] === "0") return so.slice(2);
  }
  if (so.startsWith("0")) return so;
  // Thiếu số 0 đầu (sheet lưu dạng số nên mất số 0). Xét độ dài trước khi xét
  // tiền tố 84 để số 084xxxxxxx mất số 0 không bị cắt nhầm.
  if (so.length === 9) return "0" + so;
  return so;
}

/** Đúng dạng SĐT di động Việt Nam đã chuẩn hoá: 0 + 9 chữ số. */
export function laSoDienThoaiVN(so: string): boolean {
  return /^0\d{9}$/.test(so);
}

/**
 * Người dùng gõ vào ô đăng nhập có phải một SĐT không: chỉ gồm chữ số và các ký
 * tự hay đi kèm (+ . - khoảng trắng ngoặc) và chuẩn hoá xong ra SĐT hợp lệ.
 * Tên đăng nhập luôn có chữ cái (đã chặn tên toàn số), nên hai loại không lẫn.
 */
export function laDauVaoSoDienThoai(raw: string): boolean {
  const t = String(raw ?? "").trim();
  if (!/^[+\d\s.\-()]+$/.test(t)) return false;
  return laSoDienThoaiVN(chuanSoDienThoai(t));
}

/**
 * Giá trị đem LƯU khi người dùng sửa SĐT ở form: nhận ra SĐT di động thì lưu
 * dạng chuẩn; còn lại (số bàn 11 chữ số, ghi hai số, ghi chú…) giữ nguyên chữ
 * đã gõ để không làm mất thông tin. Rỗng → null.
 */
export function soDienThoaiDeLuu(
  raw: string | null | undefined,
): string | null {
  const t = String(raw ?? "").trim();
  if (!t) return null;
  const so = chuanSoDienThoai(t);
  return laSoDienThoaiVN(so) ? so : t;
}

/** Che giữa SĐT khi hiện cho chính chủ xem: 0903 *** 456. */
export function cheSoDienThoai(so: string | null | undefined): string {
  const s = chuanSoDienThoai(so);
  if (!laSoDienThoaiVN(s)) return s ? `${s.slice(0, 2)}***` : "";
  return `${s.slice(0, 4)} *** ${s.slice(7)}`;
}
