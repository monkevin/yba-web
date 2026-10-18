"use client";

/**
 * Âm thanh ngắn cho game — tổng hợp bằng Web Audio, không cần tải tệp âm thanh.
 * Người chơi tắt / bật bằng nút loa; lựa chọn nhớ trong localStorage.
 */
const KHOA = "nn-am-thanh";
let ngucanh: AudioContext | null = null;

export function amThanhDangBat(): boolean {
  try {
    return localStorage.getItem(KHOA) !== "tat";
  } catch {
    return true;
  }
}

export function datAmThanh(bat: boolean) {
  try {
    localStorage.setItem(KHOA, bat ? "bat" : "tat");
  } catch {
    /* trình duyệt chặn bộ nhớ — bỏ qua */
  }
  window.dispatchEvent(new Event(KHOA));
}

/** Đăng ký nghe thay đổi bật / tắt âm thanh (dùng với useSyncExternalStore). */
export function theoDoiAmThanh(cb: () => void): () => void {
  window.addEventListener(KHOA, cb);
  return () => window.removeEventListener(KHOA, cb);
}

function phat(not: { tanSo: number; batDau: number; dai: number; kieu?: OscillatorType; to?: number }[]) {
  if (typeof window === "undefined" || !amThanhDangBat()) return;
  try {
    ngucanh ??= new AudioContext();
    const ctx = ngucanh;
    if (ctx.state === "suspended") void ctx.resume();
    const goc = ctx.currentTime + 0.01;
    for (const n of not) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.kieu ?? "sine";
      osc.frequency.value = n.tanSo;
      const to = n.to ?? 0.12;
      gain.gain.setValueAtTime(0.0001, goc + n.batDau);
      gain.gain.exponentialRampToValueAtTime(to, goc + n.batDau + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, goc + n.batDau + n.dai);
      osc.connect(gain).connect(ctx.destination);
      osc.start(goc + n.batDau);
      osc.stop(goc + n.batDau + n.dai + 0.05);
    }
  } catch {
    /* máy không hỗ trợ Web Audio */
  }
}

export const am = {
  dung: () =>
    phat([
      { tanSo: 880, batDau: 0, dai: 0.18 },
      { tanSo: 1318.5, batDau: 0.09, dai: 0.32 },
    ]),
  sai: () =>
    phat([
      { tanSo: 196, batDau: 0, dai: 0.22, kieu: "triangle", to: 0.16 },
      { tanSo: 155.6, batDau: 0.14, dai: 0.3, kieu: "triangle", to: 0.14 },
    ]),
  tich: () => phat([{ tanSo: 1600, batDau: 0, dai: 0.05, kieu: "square", to: 0.03 }]),
  bam: () => phat([{ tanSo: 660, batDau: 0, dai: 0.06, to: 0.05 }]),
  sao: (i: number) => phat([{ tanSo: 784 * Math.pow(1.26, i), batDau: 0, dai: 0.35, to: 0.1 }]),
  thang: () =>
    phat([
      { tanSo: 523.3, batDau: 0, dai: 0.2 },
      { tanSo: 659.3, batDau: 0.12, dai: 0.2 },
      { tanSo: 784, batDau: 0.24, dai: 0.2 },
      { tanSo: 1046.5, batDau: 0.36, dai: 0.55 },
    ]),
  lat: () => phat([{ tanSo: 420, batDau: 0, dai: 0.12, kieu: "triangle", to: 0.06 }, { tanSo: 840, batDau: 0.08, dai: 0.16, to: 0.05 }]),
  /** Ăn mừng mốc chuỗi đúng liên tiếp */
  chuoi: () =>
    phat([
      { tanSo: 659.3, batDau: 0, dai: 0.12 },
      { tanSo: 830.6, batDau: 0.1, dai: 0.12 },
      { tanSo: 1046.5, batDau: 0.2, dai: 0.12 },
      { tanSo: 1318.5, batDau: 0.3, dai: 0.4, to: 0.14 },
    ]),
  /** Lên danh hiệu mới */
  lenHang: () =>
    phat([
      { tanSo: 392, batDau: 0, dai: 0.18 },
      { tanSo: 523.3, batDau: 0.15, dai: 0.18 },
      { tanSo: 659.3, batDau: 0.3, dai: 0.18 },
      { tanSo: 784, batDau: 0.45, dai: 0.5, to: 0.14 },
      { tanSo: 1046.5, batDau: 0.6, dai: 0.7, to: 0.12 },
    ]),
  /** Đếm ngược 3-2-1 và tiếng "bắt đầu" */
  dem: () => phat([{ tanSo: 880, batDau: 0, dai: 0.1, kieu: "square", to: 0.05 }]),
  batDau: () => phat([{ tanSo: 1318.5, batDau: 0, dai: 0.35, to: 0.12 }]),
};

/** Rung nhẹ trên điện thoại khi trả lời sai (máy không hỗ trợ thì thôi). */
export function rung(ms = 120) {
  try {
    if (amThanhDangBat()) navigator.vibrate?.(ms);
  } catch {
    /* bỏ qua */
  }
}
