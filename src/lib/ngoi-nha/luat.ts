/**
 * Luật chơi game "Ngôi nhà Chợ Lớn" — hằng số và hàm THUẦN.
 *
 * File này được client component import (màn chơi, bảng xếp hạng) nên KHÔNG
 * được import `@/lib/prisma`, `@/lib/auth` hay nội dung câu hỏi (đáp án phải
 * nằm ở máy chủ). Số liệu lấy đúng theo Kịch bản game Bản thảo 02.
 *
 * Từ 16/09/2026 Ban Điều hành chỉnh được phần lớn các số này ở quản trị
 * (`cai-dat/luat-choi.ts`); hằng số ở đây là MẶC ĐỊNH khi chưa lưu gì. Chỉ
 * `import type` từ `cai-dat/` — import giá trị sẽ thành vòng lặp module (luật
 * mặc định đọc hằng số của chính file này lúc nạp).
 */
import type { LuatChoi } from "./cai-dat/luat-choi";
import type { TinhNang } from "./cai-dat/tinh-nang";
import type { LuatManChoi } from "./kieu";

export type MaVon = "CN" | "TT" | "XH" | "TS";
export type LoaiCau = "chon" | "ds" | "th" | "xep" | "ghep";
export type CheDo = "TINH_DIEM" | "LUYEN_TAP" | "THU_THACH_NGAY";
export type TroGiup = "5050" | "HOI" | "GIO";
export type Von = Record<MaVon, number>;

export const MA_VON: MaVon[] = ["CN", "TT", "XH", "TS"];

export const VON: Record<
  MaVon,
  { ten: string; ngan: string; y: string; mau: string }
> = {
  CN: {
    ten: "Vốn cá nhân",
    ngan: "Cá nhân",
    y: "Kiến thức, kỹ năng, sức khỏe của người doanh chủ",
    mau: "#e3b94a",
  },
  TT: {
    ten: "Vốn tri thức",
    ngan: "Tri thức",
    y: "Bài học thực chiến được chia sẻ thẳng thắn",
    mau: "#6478b8",
  },
  XH: {
    ten: "Vốn xã hội",
    ngan: "Xã hội",
    y: "Mạng lưới quan hệ và uy tín",
    mau: "#e23a47",
  },
  TS: {
    ten: "Vốn tài sản",
    ngan: "Tài sản",
    y: "Nguồn lực tài chính được khai thác hiệu quả",
    mau: "#10b981",
  },
};

export const vonRong = (): Von => ({ CN: 0, TT: 0, XH: 0, TS: 0 });

export const LOAI_CAU: Record<
  LoaiCau,
  { ten: string; giay: number; huongDan: string }
> = {
  chon: { ten: "Trắc nghiệm", giay: 20, huongDan: "Chọn 1 trong 4 đáp án" },
  ds: { ten: "Đúng / Sai", giay: 15, huongDan: "Chọn Đúng hoặc Sai" },
  th: { ten: "Tình huống", giay: 30, huongDan: "Chọn cách xử lý đúng nhất" },
  xep: { ten: "Sắp xếp", giay: 45, huongDan: "Chạm lần lượt theo đúng thứ tự" },
  ghep: {
    ten: "Ghép cặp",
    giay: 45,
    huongDan: "Chạm một ô bên trái rồi một ô bên phải",
  },
};

export const DIEM = {
  DUNG: 100,
  TOC_DO_TOI_DA: 50,
  CHUOI_TU_3: 20,
  CHUOI_TU_5: 50,
  MOT_PHAN: 25,
  HE_SO_THU_THACH: 2,
  GIAY_THEM: 15,
  /// Bù độ trễ mạng khi chấm giờ ở máy chủ
  AN_HAN_MS: 2000,
  /// Câu đúng dưới mốc này mới tính vào chuỗi "Tia chớp"
  TIA_CHOP_MS: 5000,
} as const;

/** Câu thưởng cuối lượt: câu về hội viên thật (+100 nếu đúng), câu chia sẻ về mình (+50) */
export const DIEM_THUONG = { HOI_VIEN: 100, CHIA_SE: 50 } as const;

/** Lời khen / động viên hiện ở bảng phản hồi — chọn theo kết quả và tốc độ. */
export const LOI_KHEN = {
  nhanh: ["Chớp nhoáng!", "Phản xạ tuyệt vời!", "Nhanh như điện!"],
  dung: [
    "Chính xác!",
    "Chuẩn không cần chỉnh!",
    "Đúng chất Chợ Lớn!",
    "Tuyệt vời!",
    "Quá hiểu Hội!",
  ],
  sai: [
    "Chưa đúng — câu sau gỡ lại!",
    "Tiếc quá, gần đúng rồi!",
    "Ghi nhớ nhé, lần sau chắc chắn đúng!",
  ],
  hetGio: ["Hết giờ — câu sau nhanh tay hơn nhé!"],
} as const;

/** Mốc chuỗi đúng liên tiếp được ăn mừng riêng. */
export const MOC_CHUOI: { tu: number; ten: string; mo: string }[] = [
  { tu: 3, ten: "Chuỗi 3 – Nóng máy!", mo: "Từ câu này mỗi câu đúng thêm +20" },
  {
    tu: 5,
    ten: "Chuỗi 5 – Bùng cháy!",
    mo: "Thưởng chuỗi tăng lên +50 mỗi câu",
  },
  { tu: 7, ten: "Chuỗi 7 – Không thể cản!", mo: "Giữ nhịp tới câu cuối" },
  {
    tu: 10,
    ten: "Trọn bộ 10 – Hoàn hảo!",
    mo: "Không dùng trợ giúp là có huy hiệu Hoàn hảo",
  },
];
export const mocChuoi = (chuoi: number) =>
  MOC_CHUOI.find((m) => m.tu === chuoi) ?? null;

export const SO_CAU_MOI_TRAM = 10;

/**
 * Đấu trường 1-1 (gói chuyển giao từ Học viện Mon Amie, đã đổi sang điểm của
 * Ngôi nhà): 10 câu, 15 giây mỗi câu, đúng nhiều hơn thắng, hoà điểm thì ai
 * tổng thời gian nhanh hơn thắng. Thua vẫn có điểm an ủi để người ta dám nhận đấu.
 */
export const DAU_TRUONG = {
  SO_CAU: 10,
  GIAY: 15,
  THANG: 300,
  HOA: 150,
  THUA: 50,
  MOI_CAU_DUNG: 10,
  /** Vốn mỗi trận cho cả hai bên: tri thức (ôn kiến thức) và xã hội (kết nối) */
  VON_TT: 2,
  VON_XH: 2,
  /**
   * Chống cày điểm: mỗi người chỉ được cộng điểm tối đa 10 trận / ngày, và hai
   * người gặp nhau tối đa 2 trận có điểm / ngày. Quá trần vẫn đấu, vẫn tính
   * thắng thua, chỉ không cộng điểm và vốn.
   */
  TRAN_TINH_DIEM_MOI_NGAY: 10,
  CUNG_DOI_THU_MOI_NGAY: 2,
} as const;

/** Đấu trí sự kiện: chơi tại buổi sinh hoạt, bảng xếp hạng chiếu sân khấu. */
export const DAU_TRI = {
  SO_CAU: 10,
  GIAY_MAC_DINH: 20,
  /** Vốn xã hội vì có mặt tại sự kiện */
  VON_XH: 2,
  /** Mỗi câu đúng +1 vốn tri thức (ghi ở sổ cái) */
  VON_TT_MOI_CAU: 1,
} as const;

export const TRANG_THAI_TRAN: Record<string, string> = {
  CHO_THACH: "Chờ người thách chơi",
  CHO_DOI_THU: "Chờ đối thủ",
  XONG: "Đã xong",
};
export const LUOT_TINH_DIEM_TOI_DA = 3;

export const THU_THACH_NGAY = {
  SO_CAU: 5,
  THUONG_MOI_NGAY: 50,
  THUONG_TOI_DA: 300,
  /// Thử thách mới mở lúc 6:00 sáng giờ Việt Nam
  GIO_SANG_NGAY: 6,
} as const;

/** Vốn cộng khi qua trạm: vốn chính của chặng +5, chặng Vươn tầm +2 mỗi vốn. */
export const VON_QUA_TRAM = { CHINH: 5, CAN_BANG: 2 } as const;

/** Thưởng tốc độ: tối đa +50, giảm đều theo thời gian đã dùng. */
export function diemTocDo(daDungMs: number, gioiHanMs: number): number {
  if (gioiHanMs <= 0) return 0;
  const conLai = Math.max(0, 1 - daDungMs / gioiHanMs);
  return Math.round(DIEM.TOC_DO_TOI_DA * conLai);
}

/** Thưởng chuỗi đúng liên tiếp: từ câu thứ 3 +20, từ câu thứ 5 +50. */
export function diemChuoi(chuoi: number): number {
  if (chuoi >= 5) return DIEM.CHUOI_TU_5;
  if (chuoi >= 3) return DIEM.CHUOI_TU_3;
  return 0;
}

/**
 * Số sao của một lượt 10 câu. Trạm thường: 6–7 câu đúng 1 sao, 8–9 câu 2 sao,
 * 10/10 3 sao. Trạm Thử thách phải đúng tối thiểu 7 câu mới được sao.
 */
export function tinhSao(soDung: number, thuThach: boolean): number {
  if (soDung >= 10) return 3;
  if (soDung >= 8) return 2;
  if (soDung >= (thuThach ? 7 : 6)) return 1;
  return 0;
}

export function canDeQua(thuThach: boolean): number {
  return thuThach ? 7 : 6;
}

/** Thưởng chuỗi ngày chơi thử thách liên tiếp. */
export function thuongChuoiNgay(soNgay: number): number {
  return Math.min(
    THU_THACH_NGAY.THUONG_TOI_DA,
    THU_THACH_NGAY.THUONG_MOI_NGAY * Math.max(0, soNgay),
  );
}

// ─── Danh hiệu ────────────────────────────────────────────────────────

export type DanhHieu = { bac: number; ten: string; tuDiem: number; y: string };

export const DANH_HIEU: DanhHieu[] = [
  {
    bac: 1,
    ten: "Tân binh",
    tuDiem: 0,
    y: "Lần đầu bước vào Ngôi nhà Chợ Lớn",
  },
  {
    bac: 2,
    ten: "Huynh đệ",
    tuDiem: 3000,
    y: "Đã biết Hội, biết nhà – thành người nhà",
  },
  { bac: 3, ten: "Dấn thân", tuDiem: 10000, y: "Đã hiểu người, hiểu việc" },
  { bac: 4, ten: "Đột phá", tuDiem: 20000, y: "Bắt đầu tạo giá trị thật" },
  { bac: 5, ten: "Vươn tầm", tuDiem: 32000, y: "Đi gần trọn hành trình" },
  {
    bac: 6,
    ten: "Ngọn lửa Chợ Lớn",
    tuDiem: Infinity,
    y: "Người giữ lửa – tấm gương cho hội viên mới",
  },
];

/**
 * Cơ cấu giải mặc định gói trong đúng 20 phần quà (không tính quà mốc tiến độ
 * như áo thun). Mốc quà nằm ở `moc-qua.ts`, Ban Điều hành chỉnh ở quản trị.
 */
export const TONG_QUA_MUA = 20;

export const DIEU_KIEN_NGON_LUA = {
  SO_TRAM: 22,
  SO_SAO: 44,
  HUY_HIEU: "CAN_BANG",
} as const;

/**
 * Danh hiệu theo Điểm Vươn tầm. "Ngọn lửa Chợ Lớn" không tính bằng điểm mà
 * bằng điều kiện: qua đủ 22 trạm, từ 44 sao và có huy hiệu Doanh nhân cân bằng.
 */
export function danhHieu(
  diem: number,
  ngonLua: boolean,
): { hienTai: DanhHieu; tiepTheo: DanhHieu | null } {
  if (ngonLua) return { hienTai: DANH_HIEU[5], tiepTheo: null };
  let hienTai = DANH_HIEU[0];
  for (const d of DANH_HIEU.slice(0, 5)) if (diem >= d.tuDiem) hienTai = d;
  const tiepTheo = DANH_HIEU[hienTai.bac] ?? null;
  return { hienTai, tiepTheo };
}

// ─── Huy hiệu ─────────────────────────────────────────────────────────

export type HuyHieu = {
  ma: string;
  ten: string;
  dieuKien: string;
  diem: number;
  kyHieu: string;
};

export const HUY_HIEU: HuyHieu[] = [
  {
    ma: "NGUOI_BIET",
    ten: "Người Biết",
    dieuKien: "Vượt Trạm Thử thách chặng BIẾT",
    diem: 500,
    kyHieu: "B1",
  },
  {
    ma: "NGUOI_BAN",
    ten: "Người Bạn",
    dieuKien: "Vượt Trạm Thử thách chặng BẠN",
    diem: 500,
    kyHieu: "B2",
  },
  {
    ma: "NGUOI_BAN_VIEC",
    ten: "Người Bàn",
    dieuKien: "Vượt Trạm Thử thách chặng BÀN",
    diem: 500,
    kyHieu: "B3",
  },
  {
    ma: "NGUOI_BAN_HANG",
    ten: "Người Bán",
    dieuKien: "Vượt Trạm Thử thách chặng BÁN",
    diem: 500,
    kyHieu: "B4",
  },
  {
    ma: "NGUOI_VUON_TAM",
    ten: "Người Vươn tầm",
    dieuKien: "Vượt Trạm Thử thách chặng VƯƠN TẦM",
    diem: 500,
    kyHieu: "VT",
  },
  {
    ma: "HOAN_HAO",
    ten: "Hoàn hảo",
    dieuKien: "Một trạm 10/10, không dùng trợ giúp",
    diem: 200,
    kyHieu: "10",
  },
  {
    ma: "TIA_CHOP",
    ten: "Tia chớp",
    dieuKien: "Đúng 10 câu liên tiếp, mỗi câu dưới 5 giây",
    diem: 300,
    kyHieu: "TC",
  },
  {
    ma: "NHA_SU_HOC",
    ten: "Nhà sử học Chợ Lớn",
    dieuKien: "Đúng toàn bộ câu sắp xếp trong ngân hàng câu hỏi",
    diem: 300,
    kyHieu: "SH",
  },
  {
    ma: "CHUYEN_CAN",
    ten: "Chuyên cần",
    dieuKien: "Thử thách hằng ngày 7 ngày liên tiếp",
    diem: 500,
    kyHieu: "7N",
  },
  {
    ma: "NGUOI_BAC_CAU",
    ten: "Người bắc cầu",
    dieuKien: "Hoàn thành nhiệm vụ “Người bắc cầu” 3 lần",
    diem: 500,
    kyHieu: "BC",
  },
  {
    ma: "CAN_BANG",
    ten: "Doanh nhân cân bằng",
    dieuKien: "Cả 4 loại vốn đạt từ 30",
    diem: 1000,
    kyHieu: "4V",
  },
  {
    ma: "BO_SUU_TAP",
    ten: "Bộ sưu tập hoàn chỉnh",
    dieuKien: "Mở đủ 22 thẻ sưu tầm",
    diem: 500,
    kyHieu: "22",
  },
];

export const HUY_HIEU_THEO_MA = Object.fromEntries(
  HUY_HIEU.map((h) => [h.ma, h]),
) as Record<string, HuyHieu>;

/** Huy hiệu vượt Trạm Thử thách theo mã chặng trong chang.json. */
export const HUY_HIEU_CHANG: Record<string, string> = {
  BIET: "NGUOI_BIET",
  BAN_BE: "NGUOI_BAN",
  BAN_VIEC: "NGUOI_BAN_VIEC",
  BAN_HANG: "NGUOI_BAN_HANG",
  VUON_TAM: "NGUOI_VUON_TAM",
};

export const NGUONG_CAN_BANG = 30;

// ─── Nhiệm vụ Huynh đệ ────────────────────────────────────────────────

export const NHOM_NHIEM_VU: Record<string, string> = {
  KET_NOI: "Kết nối",
  GIAO_THUONG: "Giao thương",
  DAN_THAN: "Dấn thân",
  GAN_KET: "Gắn kết",
};

export const TRANG_THAI_NV: Record<string, string> = {
  CHO_XAC_NHAN: "Chờ xác nhận",
  DA_XAC_NHAN: "Đã xác nhận",
  TU_CHOI: "Không được xác nhận",
};

// ─── Tiện ích hiển thị ────────────────────────────────────────────────

/** Chữ cái đầu của tên gọi (từ cuối cùng bắt đầu bằng chữ), dùng thay ảnh đại diện. */
export function chuCaiTen(ten: string): string {
  const tu = ten
    .trim()
    .split(/\s+/)
    .reverse()
    .find((w) => /^\p{L}/u.test(w));
  return (tu?.[0] ?? "Y").toUpperCase();
}

export function soDep(n: number): string {
  return Math.round(n).toLocaleString("vi-VN");
}

export function vonDep(v: Partial<Von>): string {
  return MA_VON.filter((k) => v[k])
    .map((k) => `${VON[k].ngan} ${v[k]! > 0 ? "+" : ""}${v[k]}`)
    .join(" · ");
}

/**
 * Luật rút gọn cho màn chơi. `cauThuongChinh` = công tắc chính câu thưởng
 * (`nn.thongSo.cauThuong`); tắt thì không loại câu thưởng nào xuất hiện.
 */
export function luatManChoi(
  l: Pick<LuatChoi, "tram" | "thuThachNgay" | "cauThuong" | "huyHieu">,
  tn: Pick<
    TinhNang,
    | "troGiup5050"
    | "troGiupHoi"
    | "troGiupGio"
    | "cauThuongHoiVien"
    | "cauThuongChiaSe"
  >,
  cauThuongChinh: boolean,
): LuatManChoi {
  const troGiup: TroGiup[] = [];
  if (tn.troGiup5050) troGiup.push("5050");
  if (tn.troGiupHoi) troGiup.push("HOI");
  if (tn.troGiupGio) troGiup.push("GIO");
  const cauThuong: LuatManChoi["cauThuong"] = [];
  if (cauThuongChinh && tn.cauThuongHoiVien) cauThuong.push("HOI_VIEN");
  if (cauThuongChinh && tn.cauThuongChiaSe) cauThuong.push("CHIA_SE");
  return {
    heSoThuThach: l.tram.heSoThuThach,
    canDeQua: l.tram.saoMot,
    canDeQuaThuThach: l.tram.saoMotThuThach,
    chuoiTu3: l.tram.chuoiTu3,
    chuoiTu5: l.tram.chuoiTu5,
    giayThem: l.tram.giayThem,
    thuThachSoCau: l.thuThachNgay.soCau,
    thuongMoiNgay: l.thuThachNgay.thuongMoiNgay,
    thuongToiDa: l.thuThachNgay.thuongToiDa,
    troGiup,
    cauThuong,
    diemThuong: {
      HOI_VIEN: l.cauThuong.diemHoiVien,
      CHIA_SE: l.cauThuong.diemChiaSe,
    },
    giayThuong: {
      HOI_VIEN: l.cauThuong.giayHoiVien,
      CHIA_SE: l.cauThuong.giayChiaSe,
    },
    hoanHao: l.huyHieu.HOAN_HAO?.bat !== false,
  };
}

/** Đường dẫn trạm dùng gạch ngang ("1-3") thay dấu chấm để khỏi bị hiểu là tên tệp. */
export const duongDanTram = (ma: string) =>
  `/ngoi-nha/tram/${ma.replace(".", "-")}`;
export const maTuDuongDan = (s: string) =>
  decodeURIComponent(s).replace("-", ".");
