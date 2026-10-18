import { timBoMau } from "@/lib/giao-dien";

/**
 * Đổi màu chủ đạo toàn web bằng cách ghi đè biến CSS của Tailwind.
 *
 * Chỉ ghi đè các sắc độ thực sự dùng nhiều (navy 600/700/800 và đỏ 600/700) —
 * các sắc độ nhạt giữ nguyên để nền, viền, thẻ không bị chói.
 */
export default function MauTheoCauHinh({ ma }: { ma: string }) {
  const bo = timBoMau(ma);

  // Bộ mặc định thì không cần ghi đè gì
  if (bo.ma === "yba") return null;

  const css = `:root{
    --color-navy-600:${bo.chinh};
    --color-navy-700:${toi(bo.chinh, 0.15)};
    --color-navy-800:${toi(bo.chinh, 0.3)};
    --color-navy-900:${toi(bo.chinh, 0.45)};
    --color-do-500:${nhat(bo.nhan, 0.12)};
    --color-do-600:${bo.nhan};
    --color-do-700:${toi(bo.nhan, 0.15)};
  }`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

/** Làm tối một màu hex theo tỉ lệ 0–1. */
function toi(hex: string, ty: number): string {
  return bien(hex, (v) => Math.round(v * (1 - ty)));
}

/** Làm sáng một màu hex theo tỉ lệ 0–1. */
function nhat(hex: string, ty: number): string {
  return bien(hex, (v) => Math.round(v + (255 - v) * ty));
}

function bien(hex: string, f: (v: number) => number): string {
  const s = hex.replace("#", "");
  const n = parseInt(s.length === 3 ? s.replace(/(.)/g, "$1$1") : s, 16);
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  const kep = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
  return `#${kep(r)}${kep(g)}${kep(b)}`;
}
