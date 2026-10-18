import qrcode from "qrcode-generator";

/**
 * Sinh mã QR thành đường vẽ SVG — hàm THUẦN, chạy được cả máy chủ lẫn trình
 * duyệt, không gọi dịch vụ ngoài (ngày sự kiện mạng chập chờn vẫn hiện mã).
 *
 * Trả về `path` (mỗi dải ô đen liền nhau trên một hàng là một hình chữ nhật
 * cao 1 đơn vị) và `canh` = số ô mỗi cạnh; nơi dùng tự thêm viền trắng.
 *
 * Nội dung chỉ gồm chữ số, chữ HOA và " $%*+-./:" (vd mã thư mời
 * "CL-AB2CD") thì mã hoá kiểu Alphanumeric: cùng nội dung mà ít ô hơn, ô to
 * hơn — lễ tân quét từ màn hình điện thoại của khách dễ ăn hơn hẳn.
 */
export function duongQr(
  noiDung: string,
  mucSua: "L" | "M" | "Q" | "H" = "H"
): { path: string; canh: number } {
  const q = qrcode(0, mucSua);
  q.addData(
    noiDung,
    /^[0-9A-Z $%*+\-./:]+$/.test(noiDung) ? "Alphanumeric" : "Byte"
  );
  q.make();
  const n = q.getModuleCount();
  let d = "";
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!q.isDark(r, c)) {
        c++;
        continue;
      }
      let e = c;
      while (e < n && q.isDark(r, e)) e++;
      d += `M${c} ${r}h${e - c}v1h-${e - c}z`;
      c = e;
    }
  }
  return { path: d, canh: n };
}
