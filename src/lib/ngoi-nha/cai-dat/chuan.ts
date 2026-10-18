/**
 * Hàm làm sạch dùng chung cho mọi mục cài đặt game (file THUẦN — client import
 * được). Quy ước: giá trị thiếu (`undefined`, `null`, chuỗi rỗng) lấy MẶC ĐỊNH,
 * không bị ép về số nhỏ nhất như `Number("") = 0`.
 */

export type GioiHan = readonly [number, number];

/** Số nguyên trong khoảng [min, max]; thiếu hoặc không phải số → mặc định. */
export function so(x: unknown, macDinh: number, [min, max]: GioiHan): number {
  if (x === undefined || x === null || x === "") return macDinh;
  const n = Math.round(Number(x));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : macDinh;
}

export function bat(x: unknown, macDinh: boolean): boolean {
  return typeof x === "boolean" ? x : macDinh;
}

/** Chuỗi đã cắt khoảng trắng và giới hạn độ dài; rỗng → mặc định. */
export function chu(x: unknown, dai: number, macDinh = ""): string {
  const s = typeof x === "string" ? x.trim().slice(0, dai) : "";
  return s || macDinh;
}

/** Chuỗi ngày "yyyy-mm-dd" hoặc null. */
export function ngay(x: unknown): string | null {
  return typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : null;
}

export const laDoiTuong = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);

/**
 * Mã mục nội dung (thẻ, câu, quà…): CHỈ chữ in hoa và số. Không dùng "_" hay
 * "%" vì Prisma trên SQLite không thoát ký tự đại diện trong `contains` /
 * `startsWith`.
 */
export function chuanMaMuc(x: unknown, dai = 24): string {
  return String(x ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, dai);
}

/**
 * Mã đã có sẵn trong nội dung gốc (vd "CH01", "cs01" — đã lưu trong CSDL): giữ
 * nguyên hoa/thường, chỉ bỏ ký tự lạ. So khớp mã luôn dùng so sánh bằng.
 */
export function giuMaGoc(x: unknown, dai = 24): string {
  return String(x ?? "")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, dai);
}

/** Sinh mã mới một lần khi thêm dòng ở form — giữ nguyên khi sửa / đổi chỗ. */
export function taoMaMuc(tienTo: string): string {
  return `${chuanMaMuc(tienTo, 6)}${Date.now().toString(36).toUpperCase()}${Math.floor(
    Math.random() * 1296,
  )
    .toString(36)
    .toUpperCase()}`;
}

/**
 * Làm sạch danh sách có mã: bỏ phần tử hỏng (hàm `lam` trả null), giới hạn số
 * dòng, mã trùng thêm hậu tố số, dòng thiếu mã được sinh mã theo `tienTo`.
 */
export function dsCoMa<T extends { ma: string }>(
  x: unknown,
  lam: (o: Record<string, unknown>) => Omit<T, "ma"> | null,
  toiDa: number,
  tienTo: string,
  chuanMa: (x: unknown) => string = chuanMaMuc,
): T[] {
  if (!Array.isArray(x)) return [];
  const daDung = new Set<string>();
  const kq: T[] = [];
  let dem = 1;
  for (const o of x) {
    if (kq.length >= toiDa) break;
    if (!laDoiTuong(o)) continue;
    const phan = lam(o);
    if (!phan) continue;
    let ma = chuanMa(o.ma);
    if (!ma) {
      do ma = `${tienTo}${dem++}`;
      while (daDung.has(ma));
    }
    const goc = ma;
    for (let i = 2; daDung.has(ma); i++) ma = `${goc}${i}`;
    daDung.add(ma);
    kq.push({ ...(phan as object), ma } as T);
  }
  return kq;
}
