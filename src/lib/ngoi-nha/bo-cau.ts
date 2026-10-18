/**
 * Kho bộ câu hỏi thách đấu — CHỈ MÁY CHỦ (có đáp án). Dùng chung cho Đấu
 * trường 1-1 và Đấu trí sự kiện.
 *
 * ~100 bộ chia 10 chủ đề (kinh tế, pháp lý, tài chính, quản trị, marketing,
 * nhân sự, công nghệ, doanh nhân, văn hoá – kỹ năng…) nằm ở
 * `noi-dung/bo-cau/*.json`, cộng thêm lựa chọn "Hành trình 22 trạm" rút từ
 * ngân hàng câu của game.
 *
 * Mã câu trong đề bài có dạng `dt:<mã bộ>:<số thứ tự gốc trong tệp JSON>` — nhờ
 * vậy đọc lại được trận đã chơi bộ nào mà không cần thêm cột CSDL, và Ban Điều
 * hành ẩn đúng câu đó (`nn.boCauAn`) dù đề đã xáo thứ tự.
 *
 * Ban Điều hành ẩn câu / cả bộ ở quản trị: đọc `docBoCauAn()` TRƯỚC rồi truyền
 * vào các hàm dưới đây (tham số tuỳ chọn — không truyền là dùng cả kho).
 */
import { CHU_DE_JSON } from "./noi-dung/bo-cau";
import type { BoCauAn } from "./cai-dat/noi-dung-sua";
import {
  deBaiTuBoCau,
  rutCauTracNghiem,
  xaoLaiPhuongAn,
  type MucDeBai,
} from "./dong-co";

export type CauBoJson = {
  hoi: string;
  phuongAn: string[];
  dung: number;
  giai: string;
};
export type BoCauJson = {
  ma: string;
  ten: string;
  moTa: string;
  cau: CauBoJson[];
};
export type ChuDeBoCauJson = { chuDe: string; ten: string; bo: BoCauJson[] };
/** Câu kèm số thứ tự gốc (tính từ 1) trong tệp JSON — dùng làm mã câu cố định */
export type CauBo = CauBoJson & { so: number };
export type BoCau = Omit<BoCauJson, "cau"> & {
  cau: CauBo[];
  chuDe: string;
  tenChuDe: string;
};

/** Lựa chọn bộ câu khi thách đấu */
export const NGAU_NHIEN = "NGAU_NHIEN";
export const HANH_TRINH = "HANH_TRINH";
export const TIEN_TO_CHU_DE = "CD:";
/** Bộ còn ít hơn số câu này (sau khi lọc câu hỏng / câu bị ẩn) thì không dùng */
export const SO_CAU_TOI_THIEU_BO = 5;

/** Mã câu cố định trong đề bài: `dt:<mã bộ>:<số thứ tự gốc>`. */
export const maCauBo = (maBo: string, so: number) => `dt:${maBo}:${so}`;

const hopLe = (c: CauBoJson) =>
  !!c?.hoi?.trim() &&
  Array.isArray(c.phuongAn) &&
  c.phuongAn.length === 4 &&
  c.phuongAn.every((p) => typeof p === "string" && p.trim()) &&
  new Set(c.phuongAn).size === 4 &&
  Number.isInteger(c.dung) &&
  c.dung >= 0 &&
  c.dung < 4;

/** Chủ đề đã lọc câu hỏng; bộ còn dưới 5 câu dùng được thì bỏ hẳn. */
export const CHU_DE_BO_CAU: { ma: string; ten: string; bo: BoCau[] }[] =
  CHU_DE_JSON.map((cd) => ({
    ma: cd.chuDe,
    ten: cd.ten,
    bo: cd.bo
      .map((b) => ({
        ...b,
        // Đánh số TRƯỚC khi lọc để mã câu bám đúng vị trí trong tệp gốc
        cau: b.cau.map((c, i) => ({ ...c, so: i + 1 })).filter(hopLe),
        chuDe: cd.chuDe,
        tenChuDe: cd.ten,
      }))
      .filter((b) => b.cau.length >= SO_CAU_TOI_THIEU_BO),
  })).filter((cd) => cd.bo.length > 0);

export const TAT_CA_BO: BoCau[] = CHU_DE_BO_CAU.flatMap((cd) => cd.bo);
export const BO_THEO_MA: Record<string, BoCau> = Object.fromEntries(
  TAT_CA_BO.map((b) => [b.ma, b]),
);

export type KhoBoCau = {
  chuDe: { ma: string; ten: string; bo: BoCau[] }[];
  tatCa: BoCau[];
  theoMa: Record<string, BoCau>;
};

const KHO_DAY_DU: KhoBoCau = {
  chuDe: CHU_DE_BO_CAU,
  tatCa: TAT_CA_BO,
  theoMa: BO_THEO_MA,
};

/**
 * Kho sau khi bỏ bộ / câu Ban Điều hành ẩn. Bộ còn dưới 5 câu hiện thì loại
 * khỏi kho (đề quá ngắn không công bằng), chủ đề hết bộ thì bỏ chủ đề.
 */
export function khoBoCau(an?: BoCauAn | null): KhoBoCau {
  if (!an || (!an.bo.length && !an.cau.length)) return KHO_DAY_DU;
  const boAn = new Set(an.bo);
  const cauAn = new Set(an.cau);
  const chuDe = CHU_DE_BO_CAU.map((cd) => ({
    ...cd,
    bo: cd.bo
      .filter((b) => !boAn.has(b.ma))
      .map((b) => ({
        ...b,
        cau: b.cau.filter((c) => !cauAn.has(maCauBo(b.ma, c.so))),
      }))
      .filter((b) => b.cau.length >= SO_CAU_TOI_THIEU_BO),
  })).filter((cd) => cd.bo.length > 0);
  const tatCa = chuDe.flatMap((cd) => cd.bo);
  return {
    chuDe,
    tatCa,
    theoMa: Object.fromEntries(tatCa.map((b) => [b.ma, b])),
  };
}

function xao<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Đề bài từ một bộ trong kho, giữ mã câu theo số thứ tự gốc (`dt:<bộ>:<so>`)
 * dù câu đã lọc / xáo — `deBaiTuBoCau` đánh số theo vị trí nên đổi lại ở đây.
 */
export function deBaiTuBo(bo: BoCau, cau: CauBo[] = bo.cau): MucDeBai[] {
  return deBaiTuBoCau(bo.ma, cau, `Bộ câu ${bo.ten}`).map((m, i) => {
    const id = maCauBo(bo.ma, cau[i].so);
    return { ...m, id, ...(m.cau ? { cau: { ...m.cau, id } } : {}) };
  });
}

/**
 * Các lựa chọn hiện ở ô "Bộ câu" khi thách đấu (client chỉ nhận mã + tên,
 * không có câu). Truyền `an` để đếm đúng số bộ còn hiện.
 */
export function luaChonThachDau(
  an?: BoCauAn | null,
): { ma: string; ten: string }[] {
  const kho = khoBoCau(an);
  return [
    ...(kho.tatCa.length
      ? [{ ma: NGAU_NHIEN, ten: `Ngẫu nhiên trong ${kho.tatCa.length} bộ câu` }]
      : []),
    ...kho.chuDe.map((cd) => ({
      ma: `${TIEN_TO_CHU_DE}${cd.ma}`,
      ten: `${cd.ten} (${cd.bo.length} bộ)`,
    })),
    { ma: HANH_TRINH, ten: "Hành trình 22 trạm — kiến thức về Hội" },
  ];
}

/** Mã bộ của một đề bài đã lưu (null = rút từ 22 trạm hoặc bộ không còn trong kho). */
export function maBoCuaDeBai(deBai: MucDeBai[]): string | null {
  const id = deBai[0]?.id ?? "";
  if (!id.startsWith("dt:")) return null;
  const ma = id.slice(3, id.lastIndexOf(":"));
  return ma || null;
}

/** Tên bộ của trận đã lưu — tra cả bộ đang ẩn để trận cũ vẫn hiện đúng tên. */
export function tenBoCuaDeBai(deBai: MucDeBai[]): string {
  const ma = maBoCuaDeBai(deBai);
  if (!ma) return "Hành trình 22 trạm";
  const b = BO_THEO_MA[ma];
  return b ? `${b.tenChuDe} · ${b.ten}` : "Bộ câu soạn riêng";
}

/** Mã bộ từng người đã gặp (đã thấy đáp án ở màn xem lại) */
export type DaGapBo = { thach: Set<string>; doiThu: Set<string> };

/**
 * Chọn bộ theo thứ tự: cả hai chưa gặp → người thách chưa gặp (trong kho đã
 * chọn, rồi mở ra toàn kho) → đành lặp. Người thách đã xem đáp án một bộ thì
 * không được bốc lại bộ đó khi kho còn bộ họ chưa gặp.
 */
function chonBo(kho: BoCau[], daGap: DaGapBo, tatCa: BoCau[]): BoCau {
  const chuaGapCaHai = (ds: BoCau[]) =>
    ds.filter((b) => !daGap.thach.has(b.ma) && !daGap.doiThu.has(b.ma));
  const thachChuaGap = (ds: BoCau[]) =>
    ds.filter((b) => !daGap.thach.has(b.ma));
  for (const ds of [
    chuaGapCaHai(kho),
    thachChuaGap(kho),
    chuaGapCaHai(tatCa),
    thachChuaGap(tatCa),
    kho,
  ]) {
    if (ds.length) return xao(ds)[0];
  }
  return xao(tatCa)[0];
}

/**
 * Dựng đề bài cho một trận thách đấu.
 * `chon`: NGAU_NHIEN | "CD:<chủ đề>" | mã một bộ | HANH_TRINH.
 * Ưu tiên bộ mà hai người CHƯA gặp (`daGap`), hết bộ mới thì mới lặp lại.
 * `an`: bộ / câu Ban Điều hành ẩn — không bao giờ ra trong đề. Kho bị ẩn hết
 * thì rút từ 22 trạm để trận vẫn mở được.
 */
export function deBaiThachDau(
  chon: string,
  soCau: number,
  giay: number,
  daGap: DaGapBo,
  an?: BoCauAn | null,
): { deBai: MucDeBai[]; tenBo: string } {
  const k = khoBoCau(an);
  let kho: BoCau[] = [];
  if (chon === HANH_TRINH) kho = [];
  else if (chon.startsWith(TIEN_TO_CHU_DE))
    kho =
      k.chuDe.find((cd) => cd.ma === chon.slice(TIEN_TO_CHU_DE.length))?.bo ??
      k.tatCa;
  else if (k.theoMa[chon]) kho = [k.theoMa[chon]];
  else kho = k.tatCa;

  if (!kho.length) {
    const ids = rutCauTracNghiem(soCau);
    return {
      deBai: xaoLaiPhuongAn(
        ids.map((id) => ({ id, tt: [] })),
        giay,
      ),
      tenBo: "Hành trình 22 trạm",
    };
  }
  const bo = chonBo(kho, daGap, k.tatCa);
  const cau = xao(bo.cau).slice(0, Math.min(soCau, bo.cau.length));
  return {
    deBai: xaoLaiPhuongAn(deBaiTuBo(bo, cau), giay),
    tenBo: `${bo.tenChuDe} · ${bo.ten}`,
  };
}
