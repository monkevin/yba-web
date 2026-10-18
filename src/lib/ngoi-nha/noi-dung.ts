/**
 * Nội dung game "Ngôi nhà Chợ Lớn": chặng, trạm, 220 câu hỏi, Thẻ Cơ hội,
 * Nhiệm vụ Huynh đệ.
 *
 * CHỈ DÙNG Ở MÁY CHỦ — file này chứa đáp án. Client component chỉ được nhận
 * dữ liệu đã lọc qua `cauHienThi()` trong `dong-co.ts`.
 *
 * Nguồn gốc: thư mục `Đại hội BDH Chợ lớn/_GAME NGOI NHA CHO LON/noi-dung/`
 * (dùng chung với file Word kịch bản). Sửa câu hỏi ở đó rồi chép sang
 * `src/lib/ngoi-nha/noi-dung/` và chạy `npm run test:ngoinha` để soát.
 */
import changJson from "./noi-dung/chang.json";
import cauHoi1 from "./noi-dung/cau-hoi-1.json";
import cauHoi2 from "./noi-dung/cau-hoi-2.json";
import cauHoi3 from "./noi-dung/cau-hoi-3.json";
import cauHoi4 from "./noi-dung/cau-hoi-4.json";
import cauHoi5 from "./noi-dung/cau-hoi-5.json";
import theCoHoiJson from "./noi-dung/the-co-hoi.json";
import nhiemVuJson from "./noi-dung/nhiem-vu.json";
import type { LoaiCau, MaVon, Von } from "./luat";

export type CauHoi = {
  id: string;
  t: LoaiCau;
  v: MaVon;
  q: string;
  /** Trắc nghiệm / tình huống: phương án đúng đứng đầu. Sắp xếp: thứ tự đúng. */
  a?: string[];
  /** Đúng / Sai */
  d?: boolean;
  /** Ghép cặp: [trái, phải] */
  p?: [string, string][];
  /** Giải thích "Bạn có biết?" */
  g: string;
  /** Mã nguồn tài liệu */
  n: string;
};

export type Tram = {
  ma: string;
  so: number;
  ten: string;
  thuThach: boolean;
  the: { ten: string; noiDung: string };
  changSo: number;
  changMa: string;
  changTen: string;
  /** Thứ tự trên toàn hành trình, tính từ 0 */
  thuTu: number;
};

export type Chang = {
  so: number;
  ma: string;
  ten: string;
  tieuDe: string;
  moTa: string;
  vonChinh: MaVon | "CAN_BANG";
  tram: Tram[];
};

export type TheCoHoi = {
  ma: string;
  ten: string;
  tinhHuong: string;
  /** Lựa chọn khôn ngoan đứng đầu */
  lua: { chon: string; von: Partial<Von>; giai: string }[];
};

export type NhiemVuNoiDung = {
  ma: string;
  ten: string;
  viec: string;
  xacNhan: string;
  von: Partial<Von>;
  diem: number;
  gioiHan: string;
  muc: string;
};

type ChangGoc = {
  so: number;
  ma: string;
  ten: string;
  tieuDe: string;
  moTa: string;
  vonChinh: string;
  tram: { so: number; ten: string; thuThach?: boolean; the: { ten: string; noiDung: string } }[];
};

let thuTu = 0;
export const CHANG: Chang[] = (changJson as unknown as ChangGoc[]).map((c) => ({
  so: c.so,
  ma: c.ma,
  ten: c.ten,
  tieuDe: c.tieuDe,
  moTa: c.moTa,
  vonChinh: c.vonChinh as Chang["vonChinh"],
  tram: c.tram.map((t) => ({
    ma: `${c.so}.${t.so}`,
    so: t.so,
    ten: t.ten.replace(/^THỬ THÁCH:\s*/, ""),
    thuThach: !!t.thuThach,
    the: t.the,
    changSo: c.so,
    changMa: c.ma,
    changTen: c.ten,
    thuTu: thuTu++,
  })),
}));

/** 22 trạm theo đúng thứ tự hành trình. */
export const TRAM: Tram[] = CHANG.flatMap((c) => c.tram);
export const TRAM_THEO_MA: Record<string, Tram> = Object.fromEntries(TRAM.map((t) => [t.ma, t]));
export const CHANG_THEO_SO: Record<number, Chang> = Object.fromEntries(CHANG.map((c) => [c.so, c]));

export const CAU_HOI: CauHoi[] = [cauHoi1, cauHoi2, cauHoi3, cauHoi4, cauHoi5].flat() as unknown as CauHoi[];
export const CAU_THEO_ID: Record<string, CauHoi> = Object.fromEntries(CAU_HOI.map((c) => [c.id, c]));

export function cauCuaTram(tramMa: string): CauHoi[] {
  return CAU_HOI.filter((c) => c.id.startsWith(`${tramMa}.`));
}

export const THE_CO_HOI: TheCoHoi[] = theCoHoiJson as unknown as TheCoHoi[];
export const THE_THEO_MA: Record<string, TheCoHoi> = Object.fromEntries(THE_CO_HOI.map((t) => [t.ma, t]));

export const NHIEM_VU: NhiemVuNoiDung[] = nhiemVuJson as unknown as NhiemVuNoiDung[];
export const NV_THEO_MA: Record<string, NhiemVuNoiDung> = Object.fromEntries(NHIEM_VU.map((n) => [n.ma, n]));

export const NGUON: Record<string, string> = {
  BC: "Báo cáo tổng kết Nhiệm kỳ XII – YBA Chợ Lớn",
  WEB: "Website ybacholon.vn",
  KTDN: "Kiến tạo đội ngũ 2026",
  LDLD: "“Lãnh đạo của những lãnh đạo” – anh Trần Bằng Việt",
  DLC: "Dữ liệu chung YBA HCM & Chợ Lớn (Điều lệ sửa đổi, văn kiện Đại hội lần thứ I)",
  PROFILE: "Profile YBA Chợ Lớn 2026",
};

/** Mã chặng → tên gian trong Ngôi nhà (thế giới 2D). */
export const GIAN_NHA: Record<string, { ten: string; y: string }> = {
  BIET: { ten: "Cổng nhà & Tường ký ức", y: "Dòng thời gian 1994 → 2026 và các dấu mốc của Hội" },
  BAN_BE: { ten: "Phòng khách Huynh đệ", y: "Bàn trà Coffee Connect, khung ảnh các thế hệ Chủ nhiệm" },
  BAN_VIEC: { ten: "Thư phòng", y: "Kệ sách Business & Library, sân khấu nhỏ Coffee Share" },
  BAN_HANG: { ten: "Gian giao thương", y: "Quầy Chợ nhu cầu, bến xe caravan Vươn Tầm Kết Nối" },
  VUON_TAM: { ten: "Sân thượng ngọn lửa", y: "Nhìn ra Nhịp Cầu Doanh Nhân, nơi ngọn lửa Chợ Lớn được thắp" },
};

/** Dữ liệu trạm an toàn để gửi xuống client (không có câu hỏi, đáp án). */
export type TramCongKhai = Pick<Tram, "ma" | "so" | "ten" | "thuThach" | "the" | "changSo" | "changMa" | "changTen" | "thuTu">;
export const tramCongKhai = (t: Tram): TramCongKhai => ({
  ma: t.ma,
  so: t.so,
  ten: t.ten,
  thuThach: t.thuThach,
  the: t.the,
  changSo: t.changSo,
  changMa: t.changMa,
  changTen: t.changTen,
  thuTu: t.thuTu,
});
