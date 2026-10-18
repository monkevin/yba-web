/** Định dạng tiền VND: 1250000 → "1.250.000 ₫" */
export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Rút gọn cho bảng xếp hạng: 1250000000 → "1,25 tỷ" */
export function formatShortVnd(amount: number): string {
  const nf = (n: number) =>
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(n);
  if (Math.abs(amount) >= 1_000_000_000) return `${nf(amount / 1_000_000_000)} tỷ`;
  if (Math.abs(amount) >= 1_000_000) return `${nf(amount / 1_000_000)} triệu`;
  if (Math.abs(amount) >= 1_000) return `${nf(amount / 1_000)} nghìn`;
  return nf(amount);
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Giá trị cho <input type="date"> */
export function toDateInput(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
