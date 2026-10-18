/**
 * Giới hạn số lượt gửi ở cổng QR khách (/sk/[ma]) — đếm trong bộ nhớ tiến
 * trình như gioi-han-dang-nhap.ts (khởi động lại thì đếm lại, chấp nhận được).
 *
 * Mỗi khoá là một "xô" đếm trong cửa sổ cố định. Dùng hai tầng: theo máy (IP
 * từ layIp — sau Nginx là IP thật) và theo cả sự kiện (không giả được bằng
 * header) để chặn dò PIN check-in hay xả rác câu hỏi.
 */

type Xo = { dem: number; batDau: number };

const g = globalThis as unknown as { __gioiHanCongSk?: Map<string, Xo> };
const kho: Map<string, Xo> = (g.__gioiHanCongSk ??= new Map());

function don(bayGio: number) {
  if (kho.size < 5000) return;
  for (const [k, x] of kho) if (bayGio - x.batDau > 60 * 60 * 1000) kho.delete(k);
}

/** Ghi một lượt; trả `true` nếu ĐÃ VƯỢT trần (lượt này bị chặn). */
export function vuotTran(khoa: string, toiDa: number, cuaSoMs: number): boolean {
  const bayGio = Date.now();
  don(bayGio);
  const x = kho.get(khoa);
  if (!x || bayGio - x.batDau > cuaSoMs) {
    kho.set(khoa, { dem: 1, batDau: bayGio });
    return false;
  }
  x.dem++;
  return x.dem > toiDa;
}

/** Chỉ xem đã chạm trần chưa (không ghi thêm lượt) — dùng cho đếm PIN sai. */
export function daChamTran(khoa: string, toiDa: number, cuaSoMs: number): boolean {
  const x = kho.get(khoa);
  return !!x && Date.now() - x.batDau <= cuaSoMs && x.dem >= toiDa;
}

export function datLaiGioiHanCong() {
  kho.clear();
}
