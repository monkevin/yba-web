/**
 * Mốc thời gian theo giờ Việt Nam (UTC+7, không đổi giờ mùa) cho game.
 * Máy chủ Docker chạy giờ UTC nên KHÔNG dùng getDate()/getDay() trực tiếp.
 * Hàm thuần — client component import được.
 */

const GIO_VN_MS = 7 * 3600 * 1000;
const NGAY_MS = 24 * 3600 * 1000;

/** Các thành phần ngày giờ theo giờ Việt Nam. */
function vn(d: Date) {
  const x = new Date(d.getTime() + GIO_VN_MS);
  return { nam: x.getUTCFullYear(), thang: x.getUTCMonth() + 1, ngay: x.getUTCDate(), thu: x.getUTCDay(), gio: x.getUTCHours() };
}

const hai = (n: number) => String(n).padStart(2, "0");

/** "yyyy-mm-dd" theo giờ Việt Nam. */
export function ngayVN(d: Date = new Date()): string {
  const t = vn(d);
  return `${t.nam}-${hai(t.thang)}-${hai(t.ngay)}`;
}

/** Ngày của thử thách hằng ngày: sang ngày mới lúc 6:00 sáng giờ Việt Nam. */
export function ngayThuThach(d: Date = new Date(), gioSang = 6): string {
  return ngayVN(new Date(d.getTime() - gioSang * 3600 * 1000));
}

/** Lùi / tiến một số ngày trên chuỗi "yyyy-mm-dd". */
export function congNgay(ngay: string, soNgay: number): string {
  const [y, m, dd] = ngay.split("-").map(Number);
  const x = new Date(Date.UTC(y, m - 1, dd) + soNgay * NGAY_MS);
  return `${x.getUTCFullYear()}-${hai(x.getUTCMonth() + 1)}-${hai(x.getUTCDate())}`;
}

/** Thời điểm 0:00 giờ Việt Nam của ngày chứa `d`. */
export function dauNgay(d: Date = new Date()): Date {
  const t = vn(d);
  return new Date(Date.UTC(t.nam, t.thang - 1, t.ngay) - GIO_VN_MS);
}

/** 0:00 thứ Hai giờ Việt Nam của tuần chứa `d` (tuần tính thứ Hai – Chủ nhật). */
export function dauTuan(d: Date = new Date()): Date {
  const t = vn(d);
  const lui = (t.thu + 6) % 7;
  return new Date(dauNgay(d).getTime() - lui * NGAY_MS);
}

/** 0:00 ngày 1 giờ Việt Nam của tháng chứa `d`. */
export function dauThang(d: Date = new Date()): Date {
  const t = vn(d);
  return new Date(Date.UTC(t.nam, t.thang - 1, 1) - GIO_VN_MS);
}

export function ngayThangVN(d: Date): { ngay: number; thang: number } {
  const t = vn(d);
  return { ngay: t.ngay, thang: t.thang };
}

export type KyGioiHan = "NGAY" | "TUAN" | "THANG" | "MUA";

/** Khoảng [từ, đến) của kỳ giới hạn chứa thời điểm `d`. */
export function khoangKy(ky: Exclude<KyGioiHan, "MUA">, d: Date): { tu: Date; den: Date } {
  if (ky === "NGAY") {
    const tu = dauNgay(d);
    return { tu, den: new Date(tu.getTime() + NGAY_MS) };
  }
  if (ky === "TUAN") {
    const tu = dauTuan(d);
    return { tu, den: new Date(tu.getTime() + 7 * NGAY_MS) };
  }
  const tu = dauThang(d);
  const t = vn(d);
  const den = new Date(Date.UTC(t.thang === 12 ? t.nam + 1 : t.nam, t.thang === 12 ? 0 : t.thang, 1) - GIO_VN_MS);
  return { tu, den };
}

export function ngayGioDep(d: Date): string {
  const t = vn(d);
  const x = new Date(d.getTime() + GIO_VN_MS);
  return `${hai(t.ngay)}/${hai(t.thang)}/${t.nam} ${hai(t.gio)}:${hai(x.getUTCMinutes())}`;
}

export function ngayDep(d: Date): string {
  const t = vn(d);
  return `${hai(t.ngay)}/${hai(t.thang)}/${t.nam}`;
}
