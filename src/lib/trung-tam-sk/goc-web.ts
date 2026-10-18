import { headers } from "next/headers";
import { SITE } from "@/lib/site";

/**
 * Gốc đường dẫn in lên mã QR cổng khách.
 * - Vào bằng tên miền thật (sau Nginx) → https://<tên miền đó>.
 * - Thử trong mạng LAN (http://192.168.x.x:3002 từ máy anh Khang) → đúng địa
 *   chỉ LAN đó, để điện thoại cùng wifi quét thử được trước khi lên máy chủ.
 * - Còn lại (localhost, 127.0.0.1 khi Nginx không chuyển Host, IP công khai
 *   gõ thẳng cổng) → SITE.url: QR in ra phải luôn dùng được với khách.
 */
export async function gocWeb(): Promise<string> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim().toLowerCase();
  if (!/^[a-z0-9.\-]+(:\d+)?$/.test(host)) return SITE.url;
  const ten = host.replace(/:\d+$/, "");
  if (ten === SITE.domain || ten.endsWith(`.${SITE.domain}`)) return `https://${host}`;
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ten)) return `http://${host}`;
  return SITE.url;
}
