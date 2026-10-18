/**
 * Lá bài mỗi ngày — kiểu dữ liệu, cấu hình mặc định và hàm làm sạch (file
 * THUẦN, client import được). Máy chủ: `la-bai.ts`. Cấu hình lưu SiteSetting
 * `nn.laBai`; danh ngôn / lời nhắn gốc nằm ở `noi-dung/la-bai/*.json` và được
 * máy chủ đưa vào khi `danhNgon` / `loiNhan` còn `null` (chưa sửa).
 *
 * Luật cố định (không cho chỉnh): mỗi người 1 lá / ngày, ngày mới lúc 6:00 giờ
 * VN (`ngayThuThach`); QUÀ chỉ rơi khi mùa giải chính thức đang diễn ra.
 */
import {
  bat,
  chu,
  chuanMaMuc,
  dsCoMa,
  laDoiTuong,
  ngay,
  so,
} from "./cai-dat/chuan";

export type LoaiLa = "DANH_NGON" | "LOI_NHAN" | "DIEM" | "QUA";

export const TEN_LOAI_LA: Record<LoaiLa, string> = {
  DANH_NGON: "Danh ngôn",
  LOI_NHAN: "Lời nhắn nhủ",
  DIEM: "Điểm tích lũy",
  QUA: "Quà tặng đặc biệt",
};

export type DanhNgon = {
  ma: string;
  bat: boolean;
  /** Mã nhóm chủ đề, vd TAM_NHIN */
  nhom: string;
  noiDung: string;
  tacGia: string;
  moTaTacGia: string;
  nguyenVan: string | null;
  nguon: string;
  yNghia: string;
};

export type LoiNhan = {
  ma: string;
  bat: boolean;
  noiDung: string;
  goiY: string | null;
  chuDe: string;
  /** Người ký; mặc định "Ban Chủ nhiệm Chi hội" — không tự điền tên người thật */
  nguoiKy: string;
  tuNgay: string | null;
  denNgay: string | null;
};

export type QuaLaBai = {
  ma: string;
  bat: boolean;
  ten: string;
  moTa: string;
  nhaDongHanh: string;
  giaTri: number;
  /** Tổng số suất của quà này (tính mọi mùa) */
  tongSo: number;
  /** 0 = không giới hạn theo ngày */
  toiDaMoiNgay: number;
  /** Tỉ trọng giữa các quà với nhau khi đã rơi vào loại QUA */
  trongSo: number;
  tuNgay: string | null;
  denNgay: string | null;
};

export type CauHinhLaBai = {
  /** Số lá úp cho người chơi chọn */
  soLa: number;
  /** Tự bật bảng chọn lá khi mở trang chủ game (nếu hôm nay chưa lật) */
  tuMo: boolean;
  /** Tỉ trọng các loại lá (không cần cộng đủ 100) */
  trongSo: Record<LoaiLa, number>;
  /** Điểm kèm theo lá danh ngôn / lời nhắn */
  diemKem: { DANH_NGON: number; LOI_NHAN: number };
  /** Lá điểm: các bậc điểm và tỉ trọng */
  bacDiem: { diem: number; trongSo: number }[];
  /** Thưởng thêm khi lật bài nhiều ngày liên tiếp */
  chuoi: { bat: boolean; moiNgay: number; toiDa: number };
  dieuKienQua: {
    canGanHoiVien: boolean;
    toiThieuTramQua: number;
    /** Người bị ẩn khỏi bảng xếp hạng (Ban soạn đề, vận hành) không trúng quà */
    boQuaAnXepHang: boolean;
    toiDaMoiNguoiMua: number;
    toiDaQuaMoiNgay: number;
  };
  /** Ưu tiên danh ngôn người chơi chưa gặp trong N ngày */
  khongLapDanhNgonNgay: number;
  dsQua: QuaLaBai[];
  /** null = dùng bộ gốc trong JSON */
  danhNgon: DanhNgon[] | null;
  loiNhan: LoiNhan[] | null;
};

export const LA_BAI_MAC_DINH: CauHinhLaBai = {
  soLa: 3,
  tuMo: true,
  trongSo: { DANH_NGON: 50, LOI_NHAN: 20, DIEM: 28, QUA: 2 },
  diemKem: { DANH_NGON: 20, LOI_NHAN: 20 },
  bacDiem: [
    { diem: 40, trongSo: 60 },
    { diem: 60, trongSo: 30 },
    { diem: 100, trongSo: 10 },
  ],
  chuoi: { bat: true, moiNgay: 5, toiDa: 50 },
  dieuKienQua: {
    canGanHoiVien: true,
    toiThieuTramQua: 1,
    boQuaAnXepHang: true,
    toiDaMoiNguoiMua: 1,
    toiDaQuaMoiNgay: 1,
  },
  khongLapDanhNgonNgay: 60,
  dsQua: [],
  danhNgon: null,
  loiNhan: null,
};

export const GIOI_HAN_LA_BAI = {
  soLa: [2, 5],
  trongSo: [0, 1000],
  diemKem: [0, 200],
  diemBac: [1, 1000],
  soBac: 10,
  chuoiMoiNgay: [0, 100],
  chuoiToiDa: [0, 1000],
  toiThieuTramQua: [0, 22],
  toiDaMoiNguoiMua: [1, 10],
  toiDaQuaMoiNgay: [0, 50],
  khongLapDanhNgonNgay: [0, 365],
  tongSoQua: [0, 1000],
  toiDaMoiNgayQua: [0, 50],
  giaTriQua: [0, 1_000_000_000],
  soQua: 30,
  soDanhNgon: 400,
  soLoiNhan: 200,
} as const;

export const NGUOI_KY_MAC_DINH = "Ban Chủ nhiệm Chi hội";

export function chuanDanhNgon(x: unknown): DanhNgon[] {
  return dsCoMa<DanhNgon>(
    x,
    (o) => {
      const noiDung = chu(o.noiDung, 220);
      const tacGia = chu(o.tacGia, 80);
      if (!noiDung || !tacGia) return null;
      return {
        bat: bat(o.bat, true),
        nhom: chuanMaMuc(o.nhom, 20) || "KHAC",
        noiDung,
        tacGia,
        moTaTacGia: chu(o.moTaTacGia, 80),
        nguyenVan: chu(o.nguyenVan, 300) || null,
        nguon: chu(o.nguon, 200),
        yNghia: chu(o.yNghia, 200),
      };
    },
    GIOI_HAN_LA_BAI.soDanhNgon,
    "DN",
  );
}

export function chuanLoiNhan(x: unknown): LoiNhan[] {
  return dsCoMa<LoiNhan>(
    x,
    (o) => {
      const noiDung = chu(o.noiDung, 300);
      if (!noiDung) return null;
      return {
        bat: bat(o.bat, true),
        noiDung,
        goiY: chu(o.goiY, 160) || null,
        chuDe: chu(o.chuDe, 30) || "chung",
        nguoiKy: chu(o.nguoiKy, 80, NGUOI_KY_MAC_DINH),
        tuNgay: ngay(o.tuNgay),
        denNgay: ngay(o.denNgay),
      };
    },
    GIOI_HAN_LA_BAI.soLoiNhan,
    "LN",
  );
}

export function chuanQuaLaBai(x: unknown): QuaLaBai[] {
  const g = GIOI_HAN_LA_BAI;
  return dsCoMa<QuaLaBai>(
    x,
    (o) => {
      const ten = chu(o.ten, 120);
      if (!ten) return null;
      return {
        bat: bat(o.bat, true),
        ten,
        moTa: chu(o.moTa, 300),
        nhaDongHanh: chu(o.nhaDongHanh, 80),
        giaTri: so(o.giaTri, 0, g.giaTriQua),
        tongSo: so(o.tongSo, 1, g.tongSoQua),
        toiDaMoiNgay: so(o.toiDaMoiNgay, 0, g.toiDaMoiNgayQua),
        trongSo: so(o.trongSo, 10, g.trongSo),
        tuNgay: ngay(o.tuNgay),
        denNgay: ngay(o.denNgay),
      };
    },
    g.soQua,
    "QLB",
  );
}

/** Mã mới cho quà vừa thêm ở form (chỉ A-Z0-9, sinh một lần). */
export function taoMaQuaLaBai(): string {
  return `QLB${Date.now().toString(36).toUpperCase()}${Math.floor(
    Math.random() * 1296,
  )
    .toString(36)
    .toUpperCase()}`;
}

/** Mã ghi "đã trao" quà Lá bài vào NnTraoQua.loai, vd LB_20260916. */
export const maTraoQuaLaBai = (ngayLat: string) =>
  `LB_${ngayLat.replaceAll("-", "")}`;

export function chuanLaBai(x: unknown): CauHinhLaBai {
  const o = laDoiTuong(x) ? x : {};
  const m = LA_BAI_MAC_DINH;
  const g = GIOI_HAN_LA_BAI;
  const ts = laDoiTuong(o.trongSo) ? o.trongSo : {};
  const dk = laDoiTuong(o.diemKem) ? o.diemKem : {};
  const ch = laDoiTuong(o.chuoi) ? o.chuoi : {};
  const q = laDoiTuong(o.dieuKienQua) ? o.dieuKienQua : {};
  const bacDiem = (Array.isArray(o.bacDiem) ? o.bacDiem : m.bacDiem)
    .filter(laDoiTuong)
    .slice(0, g.soBac)
    .map((b) => ({
      diem: so(b.diem, 0, g.diemBac),
      trongSo: so(b.trongSo, 0, g.trongSo),
    }))
    .filter((b) => b.diem > 0);
  return {
    soLa: so(o.soLa, m.soLa, g.soLa),
    tuMo: bat(o.tuMo, m.tuMo),
    trongSo: {
      DANH_NGON: so(ts.DANH_NGON, m.trongSo.DANH_NGON, g.trongSo),
      LOI_NHAN: so(ts.LOI_NHAN, m.trongSo.LOI_NHAN, g.trongSo),
      DIEM: so(ts.DIEM, m.trongSo.DIEM, g.trongSo),
      QUA: so(ts.QUA, m.trongSo.QUA, g.trongSo),
    },
    diemKem: {
      DANH_NGON: so(dk.DANH_NGON, m.diemKem.DANH_NGON, g.diemKem),
      LOI_NHAN: so(dk.LOI_NHAN, m.diemKem.LOI_NHAN, g.diemKem),
    },
    bacDiem: bacDiem.length ? bacDiem : m.bacDiem,
    chuoi: {
      bat: bat(ch.bat, m.chuoi.bat),
      moiNgay: so(ch.moiNgay, m.chuoi.moiNgay, g.chuoiMoiNgay),
      toiDa: so(ch.toiDa, m.chuoi.toiDa, g.chuoiToiDa),
    },
    dieuKienQua: {
      canGanHoiVien: bat(q.canGanHoiVien, m.dieuKienQua.canGanHoiVien),
      toiThieuTramQua: so(
        q.toiThieuTramQua,
        m.dieuKienQua.toiThieuTramQua,
        g.toiThieuTramQua,
      ),
      boQuaAnXepHang: bat(q.boQuaAnXepHang, m.dieuKienQua.boQuaAnXepHang),
      toiDaMoiNguoiMua: so(
        q.toiDaMoiNguoiMua,
        m.dieuKienQua.toiDaMoiNguoiMua,
        g.toiDaMoiNguoiMua,
      ),
      toiDaQuaMoiNgay: so(
        q.toiDaQuaMoiNgay,
        m.dieuKienQua.toiDaQuaMoiNgay,
        g.toiDaQuaMoiNgay,
      ),
    },
    khongLapDanhNgonNgay: so(
      o.khongLapDanhNgonNgay,
      m.khongLapDanhNgonNgay,
      g.khongLapDanhNgonNgay,
    ),
    dsQua: chuanQuaLaBai(o.dsQua),
    danhNgon: Array.isArray(o.danhNgon) ? chuanDanhNgon(o.danhNgon) : null,
    loiNhan: Array.isArray(o.loiNhan) ? chuanLoiNhan(o.loiNhan) : null,
  };
}

// ─── Kiểu dữ liệu trả cho giao diện ───────────────────────────────────

export type KetQuaLaBai = {
  /** Ngày lật "yyyy-mm-dd" (đổi ngày lúc 6:00 giờ VN) */
  ngay: string;
  viTri: number;
  soLa: number;
  loai: LoaiLa;
  danhNgon?: Pick<
    DanhNgon,
    | "ma"
    | "noiDung"
    | "tacGia"
    | "moTaTacGia"
    | "nguyenVan"
    | "nguon"
    | "yNghia"
  >;
  loiNhan?: Pick<LoiNhan, "ma" | "noiDung" | "goiY" | "nguoiKy">;
  qua?: Pick<QuaLaBai, "ma" | "ten" | "moTa" | "nhaDongHanh"> & {
    daTrao: boolean;
  };
  /** Điểm của lá (lá điểm, hoặc điểm kèm lá chữ) */
  diem: number;
  /** Thưởng chuỗi ngày lật bài liên tiếp */
  diemChuoi: number;
  chuoiNgay: number;
  /** Điểm có được ghi vào sổ cái không (mùa đã kết thúc thì không) */
  ghiNhan: boolean;
  choiThu: boolean;
};

export type LaBaiHomNay = {
  bat: boolean;
  ngay: string;
  soLa: number;
  tuMo: boolean;
  /** Mùa chính thức đang diễn ra và có quà còn suất → hiện "có thể trúng quà" */
  coQua: boolean;
  /** Số ngày lật liên tiếp tính tới hôm qua (hoặc hôm nay nếu đã lật) */
  chuoiNgay: number;
  ketQua: KetQuaLaBai | null;
};

// ─── Chọn kết quả & kỳ vọng (hàm thuần — test và trang quản trị dùng) ──

/** Thứ tự cố định của các loại lá (chia tỉ trọng, hiện bảng). */
export const CAC_LOAI_LA: LoaiLa[] = ["DANH_NGON", "LOI_NHAN", "DIEM", "QUA"];

/** Nội dung còn rút được hôm nay (máy chủ đã lọc bật/tắt, ngày, suất quà, điều kiện). */
export type KhaDungLaBai = {
  danhNgon: DanhNgon[];
  loiNhan: LoiNhan[];
  qua: QuaLaBai[];
};

export type LuaChonLaBai = {
  loai: LoaiLa;
  danhNgon?: DanhNgon;
  loiNhan?: LoiNhan;
  qua?: QuaLaBai;
  /** Điểm của lá (chưa gồm thưởng chuỗi) */
  diem: number;
};

/** "yyyy-mm-dd" nằm trong [tu, den] (đầu mút trống = không giới hạn). */
export function trongKhoangNgay(
  ngayXet: string,
  tu: string | null,
  den: string | null,
): boolean {
  return (!tu || ngayXet >= tu) && (!den || ngayXet <= den);
}

/** Thưởng chuỗi ngày lật liên tiếp (tính cả hôm nay), có trần. */
export function thuongChuoiLaBai(c: CauHinhLaBai, chuoiNgay: number): number {
  if (!c.chuoi.bat) return 0;
  return Math.min(c.chuoi.toiDa, c.chuoi.moiNgay * Math.max(0, chuoiNgay));
}

/** Bốc một phần tử theo tỉ trọng; tổng 0 thì lấy phần tử đầu. */
function bocTheoTrongSo<T>(
  ds: T[],
  trongSo: (x: T) => number,
  rand: () => number,
): T {
  const tong = ds.reduce((s, x) => s + Math.max(0, trongSo(x)), 0);
  if (tong <= 0) return ds[0];
  let r = rand() * tong;
  for (const x of ds) {
    r -= Math.max(0, trongSo(x));
    if (r < 0) return x;
  }
  return ds[ds.length - 1];
}

/** Phần tử ngẫu nhiên đều nhau (rand trả 1 cũng không vượt mảng). */
function bocDeu<T>(ds: T[], rand: () => number): T {
  return ds[Math.min(ds.length - 1, Math.floor(rand() * ds.length))];
}

/** Tỉ trọng thực tế sau khi bỏ nhóm rỗng (nhóm rỗng → 0, phần còn lại chia lại). */
export function trongSoThucTe(
  c: CauHinhLaBai,
  coSan: Record<LoaiLa, boolean>,
): Record<LoaiLa, number> {
  const kq = { DANH_NGON: 0, LOI_NHAN: 0, DIEM: 0, QUA: 0 };
  for (const l of CAC_LOAI_LA) kq[l] = coSan[l] ? c.trongSo[l] : 0;
  // Tất cả bằng 0 (hoặc mọi nhóm rỗng) → luôn ra lá điểm, người chơi không trắng tay
  if (CAC_LOAI_LA.every((l) => kq[l] <= 0)) kq.DIEM = 1;
  return kq;
}

/**
 * Chọn kết quả một lần lật. Kết quả quyết định ở MÁY CHỦ, vị trí lá người chơi
 * bấm chỉ để hiển thị. Nhóm không còn gì để rút thì tỉ trọng của nhóm đó chia
 * lại cho các nhóm khác.
 */
export function chonKetQua(
  c: CauHinhLaBai,
  kd: KhaDungLaBai,
  rand: () => number,
): LuaChonLaBai {
  const qua = kd.qua.filter((q) => q.trongSo > 0);
  const ts = trongSoThucTe(c, {
    DANH_NGON: kd.danhNgon.length > 0,
    LOI_NHAN: kd.loiNhan.length > 0,
    DIEM: c.bacDiem.length > 0,
    QUA: qua.length > 0,
  });
  const loai = bocTheoTrongSo(CAC_LOAI_LA, (l) => ts[l], rand);
  if (loai === "DANH_NGON")
    return {
      loai,
      danhNgon: bocDeu(kd.danhNgon, rand),
      diem: c.diemKem.DANH_NGON,
    };
  if (loai === "LOI_NHAN")
    return {
      loai,
      loiNhan: bocDeu(kd.loiNhan, rand),
      diem: c.diemKem.LOI_NHAN,
    };
  if (loai === "QUA")
    return { loai, qua: bocTheoTrongSo(qua, (q) => q.trongSo, rand), diem: 0 };
  const bac = c.bacDiem.length
    ? bocTheoTrongSo(c.bacDiem, (b) => b.trongSo, rand)
    : LA_BAI_MAC_DINH.bacDiem[0];
  return { loai: "DIEM", diem: bac.diem };
}

/** Điểm trung bình của một lá điểm theo các bậc. */
export function diemTrungBinhBac(c: CauHinhLaBai): number {
  const tong = c.bacDiem.reduce((s, b) => s + b.trongSo, 0);
  if (!c.bacDiem.length) return 0;
  if (tong <= 0) return c.bacDiem[0].diem;
  return c.bacDiem.reduce((s, b) => s + b.diem * b.trongSo, 0) / tong;
}

export type KyVongLaBai = {
  /** Tỉ lệ từng loại (0–1) với người ĐỦ điều kiện quà trong mùa chính thức */
  tiLe: Record<LoaiLa, number>;
  /** Tỉ lệ từng loại khi không có quà (chơi thử, chưa đủ điều kiện, hết suất) */
  tiLeKhongQua: Record<LoaiLa, number>;
  /** Điểm trung bình mỗi lá (chưa gồm thưởng chuỗi) */
  diemMoiNgay: number;
  diemMoiNgayKhongQua: number;
  /** Xác suất trúng quà mỗi lần lật (người đủ điều kiện) */
  tiLeQua: number;
  diemTrungBinhBac: number;
};

/**
 * Kỳ vọng để Ban Điều hành hình dung trước khi lưu: mỗi ngày trung bình được
 * bao nhiêu điểm, bao nhiêu phần trăm ra quà. `coSan` cho biết nhóm nào còn nội
 * dung (mặc định: danh ngôn / lời nhắn gốc luôn có, quà khi có quà đang bật).
 */
export function kyVong(
  c: CauHinhLaBai,
  coSan?: Partial<Record<LoaiLa, boolean>>,
): KyVongLaBai {
  const co = {
    DANH_NGON:
      coSan?.DANH_NGON ?? (!c.danhNgon || c.danhNgon.some((d) => d.bat)),
    LOI_NHAN: coSan?.LOI_NHAN ?? (!c.loiNhan || c.loiNhan.some((d) => d.bat)),
    DIEM: true,
    QUA:
      coSan?.QUA ?? c.dsQua.some((q) => q.bat && q.trongSo > 0 && q.tongSo > 0),
  };
  const tb = diemTrungBinhBac(c);
  const diemLoai: Record<LoaiLa, number> = {
    DANH_NGON: c.diemKem.DANH_NGON,
    LOI_NHAN: c.diemKem.LOI_NHAN,
    DIEM: tb,
    QUA: 0,
  };
  const tinh = (ts: Record<LoaiLa, number>) => {
    const tong = CAC_LOAI_LA.reduce((s, l) => s + ts[l], 0);
    const tiLe = { DANH_NGON: 0, LOI_NHAN: 0, DIEM: 0, QUA: 0 };
    for (const l of CAC_LOAI_LA) tiLe[l] = tong > 0 ? ts[l] / tong : 0;
    const diem = CAC_LOAI_LA.reduce((s, l) => s + tiLe[l] * diemLoai[l], 0);
    return { tiLe, diem };
  };
  const coQua = tinh(trongSoThucTe(c, co));
  const khongQua = tinh(trongSoThucTe(c, { ...co, QUA: false }));
  return {
    tiLe: coQua.tiLe,
    tiLeKhongQua: khongQua.tiLe,
    diemMoiNgay: coQua.diem,
    diemMoiNgayKhongQua: khongQua.diem,
    tiLeQua: coQua.tiLe.QUA,
    diemTrungBinhBac: tb,
  };
}

// ─── Hiển thị (dùng chung trang máy chủ và client) ─────────────────────

/** Tên biểu tượng `BieuTuong` cho từng loại lá. */
export const BIEU_TUONG_LA = {
  DANH_NGON: "sach",
  LOI_NHAN: "tay",
  DIEM: "sao",
  QUA: "qua",
} as const satisfies Record<LoaiLa, string>;

/** "2026-09-16" → "16/09/2026" */
export const ngayLaDep = (ngayLat: string) =>
  ngayLat.split("-").reverse().join("/");
