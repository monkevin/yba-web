/**
 * "Chân dung doanh nhân" — phần tính toán thuần: thần số học, tử vi tham khảo,
 * trắc nghiệm tính cách và khí chất doanh nhân.
 *
 * File này KHÔNG import prisma hay auth để client component dùng được.
 * Chữ nghĩa nằm ở `chan-dung-noi-dung.ts` và `khi-chat-noi-dung.ts`.
 */
import {
  THAN_SO,
  CON_GIAP,
  NAP_AM,
  MENH,
  TINH_CACH,
  type ThanSoEntry,
  type ConGiap,
  type NapAmEntry,
  type MenhInfo,
  type TinhCachType,
} from "./chan-dung-noi-dung";
import {
  KHI_CHAT_CAU_HOI,
  KHI_CHAT,
  type KhiChatKey,
  type KhiChatType,
} from "./khi-chat-noi-dung";

// ── Thần số học ─────────────────────────────────────────────────

/** Cộng dồn các chữ số tới khi còn 1 chữ số, giữ lại số chủ 11/22. */
function rutGon(n: number): number {
  while (n > 9 && n !== 11 && n !== 22) {
    n = String(n)
      .split("")
      .reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

/** Số chủ đạo (Life Path): cộng toàn bộ chữ số của ngày-tháng-năm sinh. */
export function soChuDao(d: Date): number {
  const so = `${d.getDate()}${d.getMonth() + 1}${d.getFullYear()}`;
  return rutGon(so.split("").reduce((s, x) => s + Number(x), 0));
}

export function thanSoCua(d: Date): ThanSoEntry | null {
  const n = soChuDao(d);
  return THAN_SO.find((e) => e.so === n) ?? null;
}

// ── Tử vi Đông phương (tham khảo) ───────────────────────────────

const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

/** Tên can chi của một năm dương lịch, VD 1990 → "Canh Ngọ". */
export function canChiCua(nam: number): string {
  return `${CAN[(nam - 4) % 10]} ${CHI[(nam - 4) % 12]}`;
}

export function conGiapCua(nam: number): ConGiap {
  return CON_GIAP[(nam - 4) % 12];
}

/** Nạp âm của năm sinh (chu kỳ 60 năm, mốc Giáp Tý 1924). */
export function napAmCua(nam: number): NapAmEntry {
  const i = Math.floor((((nam - 1924) % 60) + 60) % 60 / 2);
  return NAP_AM[i];
}

export function menhCua(nam: number): MenhInfo {
  const na = napAmCua(nam);
  return MENH.find((m) => m.nguHanh === na.nguHanh)!;
}

/** Sinh tháng 1–2 dương lịch có thể còn thuộc năm âm lịch trước. */
export function gapRanhAmLich(d: Date): boolean {
  return d.getMonth() <= 1;
}

// ── Trắc nghiệm tính cách ───────────────────────────────────────

export type TinhCachKey = "lua" | "gio" | "dat" | "nuoc";

/** Đếm điểm 4 nhóm và trả về nhóm trội + nhóm phụ. */
export function chamTinhCach(traLoi: TinhCachKey[]): {
  diem: Record<TinhCachKey, number>;
  chinh: TinhCachKey;
  phu: TinhCachKey | null;
} {
  const diem: Record<TinhCachKey, number> = { lua: 0, gio: 0, dat: 0, nuoc: 0 };
  for (const a of traLoi) if (a in diem) diem[a]++;
  const xep = (Object.keys(diem) as TinhCachKey[]).sort((a, b) => diem[b] - diem[a]);
  return { diem, chinh: xep[0], phu: diem[xep[1]] > 0 ? xep[1] : null };
}

export function tinhCachCua(key: string): TinhCachType | null {
  return TINH_CACH.find((t) => t.key === key) ?? null;
}

// ── Khí chất doanh nhân (Ưng · Hổ · Xà · Hồ · Long) ─────────────

/**
 * Chấm test khí chất: phần trăm = số câu chọn nhóm đó / tổng câu; khí chất
 * chính là nhóm cao nhất, kèm tối đa 2 khí chất phụ có điểm.
 */
export function chamKhiChat(traLoi: KhiChatKey[]): {
  diem: Record<KhiChatKey, number>;
  phanTram: Record<KhiChatKey, number>;
  chinh: KhiChatKey;
  phu: { key: KhiChatKey; phanTram: number }[];
} {
  const diem: Record<KhiChatKey, number> = { ung: 0, ho: 0, xa: 0, holy: 0, long: 0 };
  for (const a of traLoi) if (a in diem) diem[a]++;

  const tong = KHI_CHAT_CAU_HOI.length;
  const phanTram = Object.fromEntries(
    (Object.keys(diem) as KhiChatKey[]).map((k) => [k, Math.round((diem[k] / tong) * 100)])
  ) as Record<KhiChatKey, number>;

  const xep = (Object.keys(diem) as KhiChatKey[]).sort((a, b) => diem[b] - diem[a]);
  return {
    diem,
    phanTram,
    chinh: xep[0],
    phu: xep
      .slice(1, 3)
      .filter((k) => diem[k] > 0)
      .map((k) => ({ key: k, phanTram: phanTram[k] })),
  };
}

export function khiChatCua(key: string): KhiChatType | null {
  return KHI_CHAT.find((t) => t.key === key) ?? null;
}
