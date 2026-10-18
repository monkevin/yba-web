/**
 * Tính toán thần số học đầy đủ (hệ Pythagoras) — số chủ đạo, các chỉ số theo
 * HỌ TÊN, các chỉ số phụ theo ngày sinh, biểu đồ ngày sinh và các mũi tên.
 * Nội dung diễn giải nằm ở numerology-content.ts.
 */

/** Bỏ dấu tiếng Việt (kể cả Đ→D) để tra bảng chữ cái Pythagoras. */
export function stripDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/** Giá trị Pythagoras: A=1..I=9, J=1..R=9, S=1..Z=8. */
function letterValue(ch: string): number {
  const idx = ch.toUpperCase().charCodeAt(0) - 65; // A=0
  if (idx < 0 || idx > 25) return 0;
  return (idx % 9) + 1;
}

/** Nguyên âm — trong tên tiếng Việt, Y được tính là nguyên âm (Thúy, Lý...). */
const VOWELS = new Set(["A", "E", "I", "O", "U", "Y"]);

/** Rút gọn về 1 chữ số, giữ số chủ 11/22. */
export function reduceKeepMaster(n: number): number {
  while (n > 9 && n !== 11 && n !== 22) {
    n = String(n)
      .split("")
      .reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

/** Rút gọn về 1-9 (không giữ số chủ) — dùng cho số thái độ, năm cá nhân. */
export function reduceToDigit(n: number): number {
  while (n > 9) {
    n = String(n)
      .split("")
      .reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

function lettersOf(fullName: string): string[] {
  return stripDiacritics(fullName)
    .toUpperCase()
    .split("")
    .filter((c) => /[A-Z]/.test(c));
}

/** Số sứ mệnh (Expression): cộng toàn bộ chữ cái của họ tên. */
export function expressionNumber(fullName: string): number {
  const total = lettersOf(fullName).reduce((s, c) => s + letterValue(c), 0);
  return reduceKeepMaster(total);
}

/** Số linh hồn (Soul Urge): chỉ cộng nguyên âm. */
export function soulUrgeNumber(fullName: string): number {
  const total = lettersOf(fullName)
    .filter((c) => VOWELS.has(c))
    .reduce((s, c) => s + letterValue(c), 0);
  return reduceKeepMaster(total);
}

/** Số nhân cách (Personality): chỉ cộng phụ âm. */
export function personalityNumber(fullName: string): number {
  const total = lettersOf(fullName)
    .filter((c) => !VOWELS.has(c))
    .reduce((s, c) => s + letterValue(c), 0);
  return reduceKeepMaster(total);
}

/** Số ngày sinh: ngày trong tháng rút gọn (giữ 11/22). */
export function birthdayNumber(d: Date): number {
  return reduceKeepMaster(d.getDate());
}

/** Số thái độ: ngày + tháng, rút gọn về 1-9. */
export function attitudeNumber(d: Date): number {
  return reduceToDigit(reduceToDigit(d.getDate()) + reduceToDigit(d.getMonth() + 1));
}

/** Số trưởng thành: số chủ đạo + số sứ mệnh (giữ 11/22). */
export function maturityNumber(lifePath: number, expression: number): number {
  return reduceKeepMaster(lifePath + expression);
}

/** Năm cá nhân: ngày + tháng sinh + năm đang xét, rút gọn 1-9. */
export function personalYearNumber(d: Date, year: number): number {
  return reduceToDigit(
    reduceToDigit(d.getDate()) +
      reduceToDigit(d.getMonth() + 1) +
      reduceToDigit(year)
  );
}

/** Số karmic thiếu trong TÊN: các giá trị 1-9 không xuất hiện. */
export function missingNameNumbers(fullName: string): number[] {
  const present = new Set(lettersOf(fullName).map(letterValue));
  const missing: number[] = [];
  for (let i = 1; i <= 9; i++) if (!present.has(i)) missing.push(i);
  return missing;
}

// ── Biểu đồ ngày sinh ───────────────────────────────────────────

/** Đếm các chữ số 1-9 trong chuỗi ddmmyyyy (bỏ số 0). */
export function birthChart(d: Date): Record<number, number> {
  const digits = `${String(d.getDate()).padStart(2, "0")}${String(
    d.getMonth() + 1
  ).padStart(2, "0")}${d.getFullYear()}`;
  const counts: Record<number, number> = {};
  for (let i = 1; i <= 9; i++) counts[i] = 0;
  for (const ch of digits) {
    const n = Number(ch);
    if (n >= 1) counts[n]++;
  }
  return counts;
}

/** 8 tổ hợp mũi tên trong biểu đồ 3×3. */
export const ARROW_KEYS = [
  "123",
  "456",
  "789",
  "147",
  "258",
  "369",
  "159",
  "357",
] as const;
export type ArrowKey = (typeof ARROW_KEYS)[number];

/** Trả về các mũi tên CÓ ĐỦ và các mũi tên TRỐNG hoàn toàn. */
export function birthChartArrows(counts: Record<number, number>): {
  present: ArrowKey[];
  missing: ArrowKey[];
} {
  const present: ArrowKey[] = [];
  const missing: ArrowKey[] = [];
  for (const key of ARROW_KEYS) {
    const nums = key.split("").map(Number);
    if (nums.every((n) => counts[n] > 0)) present.push(key);
    else if (nums.every((n) => counts[n] === 0)) missing.push(key);
  }
  return { present, missing };
}

/**
 * Lưới 3×3 hiển thị theo bố cục biểu đồ ngày sinh truyền thống:
 *   3 6 9
 *   2 5 8
 *   1 4 7
 */
export const CHART_LAYOUT: number[][] = [
  [3, 6, 9],
  [2, 5, 8],
  [1, 4, 7],
];
