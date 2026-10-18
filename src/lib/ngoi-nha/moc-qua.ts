/**
 * Mốc quà theo tiến độ và thông số game mà Ban Điều hành chỉnh được ở
 * /quan-tri/ngoi-nha. File THUẦN (không prisma) — client component import được.
 *
 * - Mốc quà: ai đạt ngưỡng cũng nhận (áo thun, vé bốc thăm…). Khác với giải
 *   xếp hạng (Nhất, Nhì…) chỉ trao cho vài người đứng đầu.
 * - Thông số: số câu / giây / điểm thưởng Đấu trường, số lượt tính điểm mỗi
 *   trạm, bật tắt câu thưởng. Máy chủ luôn đọc qua `chuanThongSo()` nên dữ liệu
 *   hỏng hay nhập quá tay cũng không làm vỡ luật chơi.
 */
import { DAU_TRUONG, LUOT_TINH_DIEM_TOI_DA } from "./luat";

export const LOAI_MOC = {
  CHANG: {
    ten: "Qua đủ các trạm của một chặng",
    donVi: "chặng",
    goiY: "Ngưỡng là số thứ tự chặng: 1 BIẾT · 2 BẠN · 3 BÀN · 4 BÁN · 5 VƯƠN TẦM",
  },
  SO_TRAM: {
    ten: "Qua đủ số trạm",
    donVi: "trạm",
    goiY: "Hành trình có 22 trạm",
  },
  SAO: {
    ten: "Đạt tổng số sao",
    donVi: "sao",
    goiY: "Mỗi trạm tối đa 3 sao, cả hành trình 66 sao",
  },
  DIEM: {
    ten: "Đạt Điểm Vươn tầm",
    donVi: "điểm",
    goiY: "Tính trong mùa giải",
  },
  TRAN_THANG: {
    ten: "Thắng số trận Đấu trường",
    donVi: "trận",
    goiY: "Chỉ tính trận CÓ cộng điểm (trong trần chống cày mỗi ngày)",
  },
} as const;
export type LoaiMoc = keyof typeof LOAI_MOC;

export type MocQua = {
  /** Mã ghi vào `NnTraoQua.loai` — chữ in hoa, số, gạch dưới */
  ma: string;
  ten: string;
  loai: LoaiMoc;
  nguong: number;
  qua: string;
  /** "Mỗi người đạt" hoặc số suất */
  soLuong: string;
  giaTri?: number;
  nhaDongHanh?: string;
};

/** Mốc mặc định (anh Khang chốt 15/09/2026): áo thun khi qua đủ Chặng BIẾT, vé bốc thăm khi đi hết 22 trạm. */
export const MOC_QUA_MAC_DINH: MocQua[] = [
  {
    ma: "AO_THUN",
    ten: "Áo thun YBA Chợ Lớn",
    loai: "CHANG",
    nguong: 1,
    qua: "01 áo thun YBA Chợ Lớn",
    soLuong: "Mỗi người đạt",
  },
  {
    ma: "HOAN_THANH",
    ten: "Vé bốc thăm cuối mùa",
    loai: "SO_TRAM",
    nguong: 22,
    qua: "Vào bốc thăm quà từ nhà đồng hành",
    soLuong: "Mỗi người đạt",
  },
];

/** Mã trao quà dành riêng cho giải xếp hạng — mốc không được dùng mã này. */
export const MA_GIAI = "GIAI";

export type SoLieuMoc = {
  tram: { changSo: number; changTen: string; daQua: boolean }[];
  soTramQua: number;
  soSao: number;
  diem: number;
  tranThang: number;
};

/** Tiến độ của một người với một mốc: đã đạt bao nhiêu / cần bao nhiêu. */
export function tienDoMoc(
  m: MocQua,
  s: SoLieuMoc,
): { da: number; tong: number; moTa: string; donVi: string } {
  switch (m.loai) {
    case "CHANG": {
      const ds = s.tram.filter((t) => t.changSo === m.nguong);
      const ten = ds[0]?.changTen ?? `${m.nguong}`;
      return {
        da: ds.filter((t) => t.daQua).length,
        tong: Math.max(1, ds.length),
        moTa: `Qua đủ ${ds.length} trạm Chặng ${ten}`,
        donVi: "trạm",
      };
    }
    case "SO_TRAM":
      return {
        da: s.soTramQua,
        tong: m.nguong,
        moTa: `Qua đủ ${m.nguong} trạm`,
        donVi: "trạm",
      };
    case "SAO":
      return {
        da: s.soSao,
        tong: m.nguong,
        moTa: `Đạt ${m.nguong} sao`,
        donVi: "sao",
      };
    case "DIEM":
      return {
        da: s.diem,
        tong: m.nguong,
        moTa: `Đạt ${m.nguong.toLocaleString("vi-VN")} Điểm Vươn tầm`,
        donVi: "điểm",
      };
    case "TRAN_THANG":
      return {
        da: s.tranThang,
        tong: m.nguong,
        moTa: `Thắng ${m.nguong} trận Đấu trường`,
        donVi: "trận",
      };
  }
}

const soNguyen = (x: unknown, macDinh: number, min: number, max: number) => {
  const n = Math.round(Number(x));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : macDinh;
};
const chu = (x: unknown, dai: number) =>
  String(x ?? "")
    .trim()
    .slice(0, dai);

/** Ngưỡng hợp lệ của từng loại mốc. */
export const GIOI_HAN_MOC: Record<LoaiMoc, [number, number]> = {
  CHANG: [1, 5],
  SO_TRAM: [1, 22],
  SAO: [1, 66],
  DIEM: [1, 10_000_000],
  TRAN_THANG: [1, 1000],
};

const chuanMa = (x: unknown) =>
  chu(x, 30)
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/^_+|_+$/g, "");

/** Mã mới cho mốc vừa thêm ở form — sinh một lần, giữ nguyên khi sửa / đổi chỗ. */
export function taoMaMoc(): string {
  return `MOC_${Date.now().toString(36).toUpperCase()}${Math.floor(
    Math.random() * 1296,
  )
    .toString(36)
    .toUpperCase()}`;
}

/**
 * Làm sạch danh sách mốc từ form / CSDL. Bỏ dòng thiếu tên. Mã đã có được giữ
 * nguyên (lượt 1) để hồ sơ "đã trao" không nhảy sang mốc khác khi xoá hay đổi
 * chỗ; chỉ dòng chưa có mã mới được sinh mã, tránh mọi mã đã dùng (lượt 2).
 */
export function chuanMoc(ds: unknown): MocQua[] {
  if (!Array.isArray(ds)) return [];
  const dong = (ds as Record<string, unknown>[])
    .filter((x) => chu(x?.ten, 80))
    .slice(0, 20);
  const daDung = new Set<string>();
  const maDong = dong.map((x) => {
    let ma = chuanMa(x.ma);
    if (ma === MA_GIAI) ma = "MOC_GIAI";
    if (!ma) return "";
    const goc = ma;
    for (let i = 2; daDung.has(ma); i++) ma = `${goc}_${i}`;
    daDung.add(ma);
    return ma;
  });
  let dem = 1;
  return dong.map((x, k) => {
    let ma = maDong[k];
    if (!ma) {
      do ma = `MOC_${dem++}`;
      while (daDung.has(ma));
      daDung.add(ma);
    }
    const loai = (Object.keys(LOAI_MOC) as LoaiMoc[]).includes(
      x.loai as LoaiMoc,
    )
      ? (x.loai as LoaiMoc)
      : "SO_TRAM";
    const giaTri = soNguyen(x.giaTri, 0, 0, 10_000_000_000);
    const nhaDongHanh = chu(x.nhaDongHanh, 80);
    return {
      ma,
      ten: chu(x.ten, 80),
      loai,
      nguong: soNguyen(x.nguong, GIOI_HAN_MOC[loai][0], ...GIOI_HAN_MOC[loai]),
      qua: chu(x.qua, 120),
      soLuong: chu(x.soLuong, 40) || "Mỗi người đạt",
      ...(giaTri > 0 ? { giaTri } : {}),
      ...(nhaDongHanh ? { nhaDongHanh } : {}),
    };
  });
}

export type ThongSoGame = {
  dauTruong: {
    soCau: number;
    giay: number;
    thang: number;
    hoa: number;
    thua: number;
    moiCauDung: number;
  };
  /** Số lượt đầu mỗi trạm được tính điểm, sau đó là luyện tập */
  luotTinhDiemToiDa: number;
  /** Có câu thưởng (hội viên thật / chia sẻ) cuối mỗi lượt không */
  cauThuong: boolean;
};

export const THONG_SO_MAC_DINH: ThongSoGame = {
  dauTruong: {
    soCau: DAU_TRUONG.SO_CAU,
    giay: DAU_TRUONG.GIAY,
    thang: DAU_TRUONG.THANG,
    hoa: DAU_TRUONG.HOA,
    thua: DAU_TRUONG.THUA,
    moiCauDung: DAU_TRUONG.MOI_CAU_DUNG,
  },
  luotTinhDiemToiDa: LUOT_TINH_DIEM_TOI_DA,
  cauThuong: true,
};

/** Giới hạn nhập cho từng thông số (hiện luôn ở form quản trị). */
export const GIOI_HAN_THONG_SO = {
  soCau: [5, 10],
  giay: [8, 60],
  thang: [0, 5000],
  hoa: [0, 5000],
  thua: [0, 5000],
  moiCauDung: [0, 500],
  luotTinhDiemToiDa: [1, 10],
} as const;

export function chuanThongSo(x: unknown): ThongSoGame {
  const o = (x ?? {}) as Partial<ThongSoGame> & {
    dauTruong?: Partial<ThongSoGame["dauTruong"]>;
  };
  const d: Partial<ThongSoGame["dauTruong"]> = o.dauTruong ?? {};
  const m = THONG_SO_MAC_DINH;
  const g = GIOI_HAN_THONG_SO;
  return {
    dauTruong: {
      soCau: soNguyen(d.soCau, m.dauTruong.soCau, ...g.soCau),
      giay: soNguyen(d.giay, m.dauTruong.giay, ...g.giay),
      thang: soNguyen(d.thang, m.dauTruong.thang, ...g.thang),
      hoa: soNguyen(d.hoa, m.dauTruong.hoa, ...g.hoa),
      thua: soNguyen(d.thua, m.dauTruong.thua, ...g.thua),
      moiCauDung: soNguyen(
        d.moiCauDung,
        m.dauTruong.moiCauDung,
        ...g.moiCauDung,
      ),
    },
    luotTinhDiemToiDa: soNguyen(
      o.luotTinhDiemToiDa,
      m.luotTinhDiemToiDa,
      ...g.luotTinhDiemToiDa,
    ),
    cauThuong: typeof o.cauThuong === "boolean" ? o.cauThuong : m.cauThuong,
  };
}
