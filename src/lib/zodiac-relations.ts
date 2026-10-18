/**
 * Quan hệ giữa các con giáp (tam hợp, tứ hành xung, lục hợp) và
 * tương sinh ngũ hành — bảng tra cứu cổ truyền, thuần tính toán.
 */

const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

/** Tam hợp: 3 tuổi cách nhau 4 năm, hỗ trợ nhau bền vững. */
const TAM_HOP: string[][] = [
  ["Thân", "Tý", "Thìn"],
  ["Dần", "Ngọ", "Tuất"],
  ["Tỵ", "Dậu", "Sửu"],
  ["Hợi", "Mão", "Mùi"],
];

/** Tứ hành xung: 4 tuổi dễ va chạm quan điểm, cần dung hoà khi hợp tác. */
const TU_XUNG: string[][] = [
  ["Tý", "Ngọ", "Mão", "Dậu"],
  ["Thìn", "Tuất", "Sửu", "Mùi"],
  ["Dần", "Thân", "Tỵ", "Hợi"],
];

/** Lục hợp (nhị hợp): từng cặp tương trợ âm thầm. */
const LUC_HOP: Record<string, string> = {
  Tý: "Sửu",
  Sửu: "Tý",
  Dần: "Hợi",
  Hợi: "Dần",
  Mão: "Tuất",
  Tuất: "Mão",
  Thìn: "Dậu",
  Dậu: "Thìn",
  Tỵ: "Thân",
  Thân: "Tỵ",
  Ngọ: "Mùi",
  Mùi: "Ngọ",
};

export function chiOfYear(year: number): string {
  return CHI[(year - 4) % 12];
}

export function zodiacRelations(chi: string): {
  tamHop: string[];
  tuXung: string[];
  lucHop: string;
} {
  const tamHop = (TAM_HOP.find((g) => g.includes(chi)) ?? []).filter((c) => c !== chi);
  const tuXung = (TU_XUNG.find((g) => g.includes(chi)) ?? []).filter((c) => c !== chi);
  return { tamHop, tuXung, lucHop: LUC_HOP[chi] ?? "" };
}

/** Vòng tương sinh: Kim→Thủy→Mộc→Hỏa→Thổ→Kim. */
const SINH_NEXT: Record<string, string> = {
  Kim: "Thủy",
  Thủy: "Mộc",
  Mộc: "Hỏa",
  Hỏa: "Thổ",
  Thổ: "Kim",
};
const SINH_PREV: Record<string, string> = {
  Thủy: "Kim",
  Mộc: "Thủy",
  Hỏa: "Mộc",
  Thổ: "Hỏa",
  Kim: "Thổ",
};
/** Vòng tương khắc: Kim khắc Mộc, Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim. */
const KHAC: Record<string, string> = {
  Kim: "Mộc",
  Mộc: "Thổ",
  Thổ: "Thủy",
  Thủy: "Hỏa",
  Hỏa: "Kim",
};

export function menhRelations(nguHanh: string): {
  /** Mệnh sinh cho mình (quý nhân) */
  duocSinh: string;
  /** Mệnh mình sinh cho (mình hỗ trợ họ) */
  sinhCho: string;
  /** Mệnh khắc mình (cần dung hoà) */
  biKhac: string;
  /** Mệnh mình khắc */
  khac: string;
} {
  return {
    duocSinh: SINH_PREV[nguHanh] ?? "",
    sinhCho: SINH_NEXT[nguHanh] ?? "",
    biKhac: Object.entries(KHAC).find(([, v]) => v === nguHanh)?.[0] ?? "",
    khac: KHAC[nguHanh] ?? "",
  };
}
