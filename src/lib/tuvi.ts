/**
 * Máy lập lá số Tử Vi Đẩu Số (mức nhập môn, tham khảo):
 * an cung Mệnh/Thân, định Cục theo nạp âm, an 14 chính tinh + 12 phụ tinh
 * thông dụng và gắn Tứ Hóa theo can năm.
 *
 * Quy tắc cổ truyền được dùng:
 * - Cung Mệnh: khởi Dần là tháng Giêng đếm THUẬN tới tháng sinh, từ đó khởi
 *   giờ Tý đếm NGHỊCH tới giờ sinh. Cung Thân: như trên nhưng đếm THUẬN.
 * - Cục = ngũ hành nạp âm của can-chi cung Mệnh (can lấy theo ngũ hổ độn).
 * - Tử Vi an theo Cục + ngày âm (bảng TUVI_TABLE, đã đối chiếu mốc chuẩn).
 */
import { solarToLunar, hourChiIndex, type LunarDate } from "./lunar";
import { NAP_AM as NAP_AM_CYCLE } from "./chan-dung-noi-dung";
import {
  TUVI_TABLE,
  TU_HOA,
  KHOI_VIET,
  DAO_HOA,
  HONG_LOAN,
  CUNG_ORDER,
} from "./tuvi-content";

const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

const chiIdx = (name: string) => CHI.indexOf(name);
const mod12 = (n: number) => ((n % 12) + 12) % 12;

export type Star = {
  name: string;
  type: "chinh" | "phu";
  /// Lộc | Quyền | Khoa | Kỵ nếu sao được Tứ Hóa năm nay chiếu
  hoa?: string;
};

export type Palace = {
  chi: string;
  /// Tên cung chức năng (Mệnh, Quan Lộc...)
  cung: string;
  stars: Star[];
  isMenh: boolean;
  isThan: boolean;
};

export type LaSo = {
  lunar: LunarDate;
  canChiYear: string;
  gioChi: string;
  cuc: { so: number; ten: string; nguHanh: string };
  menhChi: string;
  thanChi: string;
  /// Thân cư cung nào (tên cung chức năng)
  thanCu: string;
  palaces: Palace[]; // 12 cung theo chi Tý..Hợi
  /// Chính tinh tại Mệnh; rỗng nếu vô chính diệu
  menhChinhTinh: string[];
  voChinhDieu: boolean;
  /// Nếu vô chính diệu: mượn chính tinh cung Thiên Di (đối cung)
  borrowedStars: string[];
};

/** Nạp âm ngũ hành từ can-chi (tra chu kỳ 60 hoa giáp). */
function napAmOfCanChi(canIdx: number, chi: number): string {
  for (let x = canIdx; x < 60; x += 10) {
    if (x % 12 === chi) return NAP_AM_CYCLE[Math.floor(x / 2)].nguHanh;
  }
  return "Thổ";
}

const CUC_BY_HANH: Record<string, { so: number; ten: string }> = {
  Thủy: { so: 2, ten: "Thủy nhị cục" },
  Mộc: { so: 3, ten: "Mộc tam cục" },
  Kim: { so: 4, ten: "Kim tứ cục" },
  Thổ: { so: 5, ten: "Thổ ngũ cục" },
  Hỏa: { so: 6, ten: "Hỏa lục cục" },
};

/** Can của cung Dần theo can năm (ngũ hổ độn). */
function canDanOfYear(yearCanIdx: number): number {
  // Giáp/Kỷ→Bính(2), Ất/Canh→Mậu(4), Bính/Tân→Canh(6), Đinh/Nhâm→Nhâm(8), Mậu/Quý→Giáp(0)
  return [2, 4, 6, 8, 0][yearCanIdx % 5];
}

/** Lộc Tồn theo can năm. */
const LOC_TON: Record<string, string> = {
  Giáp: "Dần", Ất: "Mão", Bính: "Tỵ", Đinh: "Ngọ", Mậu: "Tỵ",
  Kỷ: "Ngọ", Canh: "Thân", Tân: "Dậu", Nhâm: "Hợi", Quý: "Tý",
};

/** Thiên Mã theo chi năm (tam hợp). */
function thienMa(yearChi: number): number {
  const group = yearChi % 4; // Thân Tý Thìn=0, Tỵ Dậu Sửu=1, Dần Ngọ Tuất=2, Hợi Mão Mùi=3
  return chiIdx(["Dần", "Hợi", "Thân", "Tỵ"][group]);
}

export function lapLaSo(birthDate: Date, birthHour: number): LaSo {
  const lunar = solarToLunar(
    birthDate.getDate(),
    birthDate.getMonth() + 1,
    birthDate.getFullYear()
  );
  const yearCanIdx = (lunar.year - 4) % 10;
  const yearChiIdx = (lunar.year - 4) % 12;
  const canChiYear = `${CAN[yearCanIdx]} ${CHI[yearChiIdx]}`;

  const h = hourChiIndex(birthHour);
  const gioChi = CHI[h];

  // Cung Mệnh / Thân
  const thangCung = mod12(2 + lunar.month - 1);
  const menh = mod12(thangCung - h);
  const than = mod12(thangCung + h);

  // Cục theo nạp âm can-chi cung Mệnh
  const canDan = canDanOfYear(yearCanIdx);
  const menhCan = (canDan + mod12(menh - 2)) % 10;
  const menhHanh = napAmOfCanChi(menhCan, menh);
  const cucInfo = CUC_BY_HANH[menhHanh];

  // An 14 chính tinh
  const day = Math.min(Math.max(lunar.day, 1), 30);
  const tuViChi = chiIdx(TUVI_TABLE[String(cucInfo.so)][day - 1]);
  const phuChi = mod12(16 - tuViChi);
  const starAt = new Map<number, Star[]>();
  const put = (pos: number, name: string, type: "chinh" | "phu") => {
    const arr = starAt.get(mod12(pos)) ?? [];
    arr.push({ name, type });
    starAt.set(mod12(pos), arr);
  };
  put(tuViChi, "Tử Vi", "chinh");
  put(tuViChi - 1, "Thiên Cơ", "chinh");
  put(tuViChi - 3, "Thái Dương", "chinh");
  put(tuViChi - 4, "Vũ Khúc", "chinh");
  put(tuViChi - 5, "Thiên Đồng", "chinh");
  put(tuViChi - 8, "Liêm Trinh", "chinh");
  put(phuChi, "Thiên Phủ", "chinh");
  put(phuChi + 1, "Thái Âm", "chinh");
  put(phuChi + 2, "Tham Lang", "chinh");
  put(phuChi + 3, "Cự Môn", "chinh");
  put(phuChi + 4, "Thiên Tướng", "chinh");
  put(phuChi + 5, "Thiên Lương", "chinh");
  put(phuChi + 6, "Thất Sát", "chinh");
  put(phuChi + 10, "Phá Quân", "chinh");

  // Phụ tinh thông dụng
  const locTon = chiIdx(LOC_TON[CAN[yearCanIdx]]);
  put(locTon, "Lộc Tồn", "phu");
  put(locTon + 1, "Kình Dương", "phu");
  put(locTon - 1, "Đà La", "phu");
  put(10 - h, "Văn Xương", "phu");
  put(4 + h, "Văn Khúc", "phu");
  put(4 + (lunar.month - 1), "Tả Phù", "phu");
  put(10 - (lunar.month - 1), "Hữu Bật", "phu");
  const kv = KHOI_VIET.find((x) => x.can === CAN[yearCanIdx]);
  if (kv) {
    put(chiIdx(kv.khoi), "Thiên Khôi", "phu");
    put(chiIdx(kv.viet), "Thiên Việt", "phu");
  }
  put(thienMa(yearChiIdx), "Thiên Mã", "phu");
  put(chiIdx(DAO_HOA[CHI[yearChiIdx]]), "Đào Hoa", "phu");
  put(chiIdx(HONG_LOAN[CHI[yearChiIdx]]), "Hồng Loan", "phu");

  // Tứ Hóa theo can năm
  const hoa = TU_HOA.find((x) => x.can === CAN[yearCanIdx]);
  if (hoa) {
    const mark = (starName: string, label: string) => {
      for (const arr of starAt.values()) {
        const s = arr.find((x) => x.name === starName);
        if (s) s.hoa = label;
      }
    };
    mark(hoa.loc, "Lộc");
    mark(hoa.quyen, "Quyền");
    mark(hoa.khoa, "Khoa");
    mark(hoa.ky, "Kỵ");
  }

  // 12 cung chức năng đi THUẬN từ Mệnh
  const cungNameAt = new Map<number, string>();
  CUNG_ORDER.forEach((name, i) => cungNameAt.set(mod12(menh + i), name));

  const palaces: Palace[] = CHI.map((chi, i) => ({
    chi,
    cung: cungNameAt.get(i) ?? "",
    stars: (starAt.get(i) ?? []).sort((a, b) =>
      a.type === b.type ? 0 : a.type === "chinh" ? -1 : 1
    ),
    isMenh: i === menh,
    isThan: i === than,
  }));

  const menhChinhTinh = (starAt.get(menh) ?? [])
    .filter((s) => s.type === "chinh")
    .map((s) => s.name);
  const voChinhDieu = menhChinhTinh.length === 0;
  const borrowedStars = voChinhDieu
    ? (starAt.get(mod12(menh + 6)) ?? [])
        .filter((s) => s.type === "chinh")
        .map((s) => s.name)
    : [];

  return {
    lunar,
    canChiYear,
    gioChi,
    cuc: { so: cucInfo.so, ten: cucInfo.ten, nguHanh: menhHanh },
    menhChi: CHI[menh],
    thanChi: CHI[than],
    thanCu: cungNameAt.get(than) ?? "Mệnh",
    palaces,
    menhChinhTinh,
    voChinhDieu,
    borrowedStars,
  };
}

/**
 * Bố cục lưới lá số truyền thống 4×4 (ô giữa 2×2 dành cho thông tin):
 *   Tỵ  Ngọ  Mùi  Thân
 *   Thìn  [thông tin]  Dậu
 *   Mão   [thông tin]  Tuất
 *   Dần  Sửu  Tý   Hợi
 */
export const LASO_LAYOUT: string[] = [
  "Tỵ", "Ngọ", "Mùi", "Thân",
  "Thìn", "", "", "Dậu",
  "Mão", "", "", "Tuất",
  "Dần", "Sửu", "Tý", "Hợi",
];
