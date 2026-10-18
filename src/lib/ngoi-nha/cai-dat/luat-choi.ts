/**
 * Luật chơi & điểm Ban Điều hành chỉnh được (SiteSetting `nn.luat`). File THUẦN.
 *
 * Mặc định lấy đúng hằng số trong `luat.ts` (nguồn sự thật của kịch bản gốc),
 * nên chưa lưu gì thì game chạy y như cũ. Số câu / giây / điểm thắng thua Đấu
 * trường và số lượt tính điểm vẫn nằm ở `nn.thongSo` (moc-qua.ts) như trước.
 *
 * Mọi hàm trong `src/lib/ngoi-nha/` đọc luật TRƯỚC khi mở `$transaction` rồi
 * truyền vào (SQLite một kết nối). Thứ gì ảnh hưởng công bằng của lượt đang dở
 * (vd giây mỗi câu) phải chụp vào đề bài lúc tạo lượt.
 */
import {
  DANH_HIEU,
  DAU_TRI,
  DAU_TRUONG,
  DIEM,
  DIEM_THUONG,
  DIEU_KIEN_NGON_LUA,
  HUY_HIEU,
  LOAI_CAU,
  NGUONG_CAN_BANG,
  THU_THACH_NGAY,
  VON_QUA_TRAM,
  type LoaiCau,
} from "../luat";
import { bat, chu, laDoiTuong, so, type GioiHan } from "./chuan";

export type LuatChoi = {
  tram: {
    dung: number;
    tocDoToiDa: number;
    chuoiTu3: number;
    chuoiTu5: number;
    motPhan: number;
    heSoThuThach: number;
    giayThem: number;
    /** Số câu đúng (trên 10) để được 1 / 2 / 3 sao; trạm Thử thách có ngưỡng 1 sao riêng */
    saoMot: number;
    saoMotThuThach: number;
    saoHai: number;
    saoBa: number;
    vonChinh: number;
    vonCanBang: number;
    giay: Record<LoaiCau, number>;
  };
  thuThachNgay: {
    soCau: number;
    thuongMoiNgay: number;
    thuongToiDa: number;
    /** Số ngày liên tiếp để nhận huy hiệu Chuyên cần */
    ngayChuyenCan: number;
  };
  cauThuong: {
    diemHoiVien: number;
    diemChiaSe: number;
    giayHoiVien: number;
    giayChiaSe: number;
  };
  dauTruong: {
    vonTT: number;
    vonXH: number;
    tranTinhDiemMoiNgay: number;
    cungDoiThuMoiNgay: number;
  };
  dauTri: {
    soCau: number;
    giayMacDinh: number;
    vonXH: number;
    vonTTMoiCau: number;
  };
  von: { nguongCanBang: number };
  /** 5 bậc tính theo điểm (bậc 1 luôn từ 0 điểm) */
  danhHieu: { ten: string; tuDiem: number; y: string }[];
  ngonLua: { ten: string; y: string; soTram: number; soSao: number };
  huyHieu: Record<string, { bat: boolean; diem: number }>;
  /** Số lần hoàn thành nhiệm vụ Người bắc cầu để có huy hiệu */
  nguoiBacCauSoLan: number;
};

export const LUAT_MAC_DINH: LuatChoi = {
  tram: {
    dung: DIEM.DUNG,
    tocDoToiDa: DIEM.TOC_DO_TOI_DA,
    chuoiTu3: DIEM.CHUOI_TU_3,
    chuoiTu5: DIEM.CHUOI_TU_5,
    motPhan: DIEM.MOT_PHAN,
    heSoThuThach: DIEM.HE_SO_THU_THACH,
    giayThem: DIEM.GIAY_THEM,
    saoMot: 6,
    saoMotThuThach: 7,
    saoHai: 8,
    saoBa: 10,
    vonChinh: VON_QUA_TRAM.CHINH,
    vonCanBang: VON_QUA_TRAM.CAN_BANG,
    giay: {
      chon: LOAI_CAU.chon.giay,
      ds: LOAI_CAU.ds.giay,
      th: LOAI_CAU.th.giay,
      xep: LOAI_CAU.xep.giay,
      ghep: LOAI_CAU.ghep.giay,
    },
  },
  thuThachNgay: {
    soCau: THU_THACH_NGAY.SO_CAU,
    thuongMoiNgay: THU_THACH_NGAY.THUONG_MOI_NGAY,
    thuongToiDa: THU_THACH_NGAY.THUONG_TOI_DA,
    ngayChuyenCan: 7,
  },
  cauThuong: {
    diemHoiVien: DIEM_THUONG.HOI_VIEN,
    diemChiaSe: DIEM_THUONG.CHIA_SE,
    giayHoiVien: 20,
    giayChiaSe: 30,
  },
  dauTruong: {
    vonTT: DAU_TRUONG.VON_TT,
    vonXH: DAU_TRUONG.VON_XH,
    tranTinhDiemMoiNgay: DAU_TRUONG.TRAN_TINH_DIEM_MOI_NGAY,
    cungDoiThuMoiNgay: DAU_TRUONG.CUNG_DOI_THU_MOI_NGAY,
  },
  dauTri: {
    soCau: DAU_TRI.SO_CAU,
    giayMacDinh: DAU_TRI.GIAY_MAC_DINH,
    vonXH: DAU_TRI.VON_XH,
    vonTTMoiCau: DAU_TRI.VON_TT_MOI_CAU,
  },
  von: { nguongCanBang: NGUONG_CAN_BANG },
  danhHieu: DANH_HIEU.slice(0, 5).map((d) => ({
    ten: d.ten,
    tuDiem: d.tuDiem,
    y: d.y,
  })),
  ngonLua: {
    ten: DANH_HIEU[5].ten,
    y: DANH_HIEU[5].y,
    soTram: DIEU_KIEN_NGON_LUA.SO_TRAM,
    soSao: DIEU_KIEN_NGON_LUA.SO_SAO,
  },
  huyHieu: Object.fromEntries(
    HUY_HIEU.map((h) => [h.ma, { bat: true, diem: h.diem }]),
  ),
  nguoiBacCauSoLan: 3,
};

/** Giới hạn nhập — form quản trị hiện "Từ a đến b · mặc định x" theo bảng này. */
export const GIOI_HAN_LUAT = {
  tram: {
    dung: [10, 1000],
    tocDoToiDa: [0, 500],
    chuoiTu3: [0, 500],
    chuoiTu5: [0, 1000],
    motPhan: [0, 500],
    heSoThuThach: [1, 5],
    giayThem: [5, 60],
    saoMot: [1, 10],
    saoMotThuThach: [1, 10],
    saoHai: [1, 10],
    saoBa: [1, 10],
    vonChinh: [0, 20],
    vonCanBang: [0, 20],
    giay: [8, 120],
  },
  thuThachNgay: {
    soCau: [3, 10],
    thuongMoiNgay: [0, 500],
    thuongToiDa: [0, 5000],
    ngayChuyenCan: [2, 60],
  },
  cauThuong: {
    diemHoiVien: [0, 1000],
    diemChiaSe: [0, 1000],
    giayHoiVien: [8, 60],
    giayChiaSe: [8, 90],
  },
  dauTruong: {
    vonTT: [0, 20],
    vonXH: [0, 20],
    tranTinhDiemMoiNgay: [1, 50],
    cungDoiThuMoiNgay: [1, 20],
  },
  dauTri: {
    soCau: [5, 30],
    giayMacDinh: [10, 60],
    vonXH: [0, 20],
    vonTTMoiCau: [0, 5],
  },
  nguongCanBang: [5, 500],
  tuDiem: [1, 10_000_000],
  ngonLuaSoTram: [1, 22],
  ngonLuaSoSao: [1, 66],
  diemHuyHieu: [0, 10_000],
  nguoiBacCauSoLan: [1, 20],
} as const satisfies Record<string, GioiHan | Record<string, GioiHan>>;

const nhom = <T extends Record<string, number>>(
  x: unknown,
  macDinh: T,
  gioiHan: Record<string, GioiHan>,
): T => {
  const o = laDoiTuong(x) ? x : {};
  return Object.fromEntries(
    Object.entries(macDinh).map(([k, v]) => [k, so(o[k], v, gioiHan[k])]),
  ) as T;
};

export function chuanLuat(x: unknown): LuatChoi {
  const o = laDoiTuong(x) ? x : {};
  const m = LUAT_MAC_DINH;
  const g = GIOI_HAN_LUAT;

  const tramO = laDoiTuong(o.tram) ? o.tram : {};
  const { giay: giayMacDinh, ...soTram } = m.tram;
  const { giay: gioiHanGiay, ...gioiHanTram } = g.tram;
  const tram = {
    ...nhom(tramO, soTram, gioiHanTram),
    giay: nhom(tramO.giay, giayMacDinh, {
      chon: gioiHanGiay,
      ds: gioiHanGiay,
      th: gioiHanGiay,
      xep: gioiHanGiay,
      ghep: gioiHanGiay,
    }),
  };
  // Ngưỡng sao phải tăng dần: 1 sao ≤ 2 sao ≤ 3 sao
  tram.saoBa = Math.max(tram.saoBa, 1);
  tram.saoHai = Math.min(tram.saoHai, tram.saoBa);
  tram.saoMot = Math.min(tram.saoMot, tram.saoHai);
  tram.saoMotThuThach = Math.min(tram.saoMotThuThach, tram.saoHai);

  const thuThachNgay = nhom(o.thuThachNgay, m.thuThachNgay, g.thuThachNgay);
  thuThachNgay.thuongToiDa = Math.max(
    thuThachNgay.thuongToiDa,
    thuThachNgay.thuongMoiNgay,
  );

  // Danh hiệu: đúng 5 bậc, điểm tăng dần, bậc 1 từ 0
  const dhO = Array.isArray(o.danhHieu) ? o.danhHieu : [];
  let truoc = 0;
  const danhHieu = m.danhHieu.map((md, i) => {
    const d = laDoiTuong(dhO[i]) ? dhO[i] : {};
    const tuDiem =
      i === 0 ? 0 : Math.max(truoc + 1, so(d.tuDiem, md.tuDiem, g.tuDiem));
    truoc = tuDiem;
    return { ten: chu(d.ten, 40, md.ten), tuDiem, y: chu(d.y, 160, md.y) };
  });

  const nlO = laDoiTuong(o.ngonLua) ? o.ngonLua : {};
  const ngonLua = {
    ten: chu(nlO.ten, 40, m.ngonLua.ten),
    y: chu(nlO.y, 160, m.ngonLua.y),
    soTram: so(nlO.soTram, m.ngonLua.soTram, g.ngonLuaSoTram),
    soSao: so(nlO.soSao, m.ngonLua.soSao, g.ngonLuaSoSao),
  };

  const hhO = laDoiTuong(o.huyHieu) ? o.huyHieu : {};
  const huyHieu = Object.fromEntries(
    Object.entries(m.huyHieu).map(([ma, md]) => {
      const h = laDoiTuong(hhO[ma]) ? hhO[ma] : {};
      return [
        ma,
        { bat: bat(h.bat, md.bat), diem: so(h.diem, md.diem, g.diemHuyHieu) },
      ];
    }),
  );

  const vonO = laDoiTuong(o.von) ? o.von : {};
  return {
    tram,
    thuThachNgay,
    cauThuong: nhom(o.cauThuong, m.cauThuong, g.cauThuong),
    dauTruong: nhom(o.dauTruong, m.dauTruong, g.dauTruong),
    dauTri: nhom(o.dauTri, m.dauTri, g.dauTri),
    von: {
      nguongCanBang: so(
        vonO.nguongCanBang,
        m.von.nguongCanBang,
        g.nguongCanBang,
      ),
    },
    danhHieu,
    ngonLua,
    huyHieu,
    nguoiBacCauSoLan: so(
      o.nguoiBacCauSoLan,
      m.nguoiBacCauSoLan,
      g.nguoiBacCauSoLan,
    ),
  };
}

// ─── Hàm tính theo luật (thuần) — dùng thay các hằng số cứng ─────────────

export function diemTocDoTheoLuat(
  l: LuatChoi,
  daDungMs: number,
  gioiHanMs: number,
): number {
  if (gioiHanMs <= 0) return 0;
  const conLai = Math.max(0, 1 - daDungMs / gioiHanMs);
  return Math.round(l.tram.tocDoToiDa * conLai);
}

export function diemChuoiTheoLuat(l: LuatChoi, chuoi: number): number {
  if (chuoi >= 5) return l.tram.chuoiTu5;
  if (chuoi >= 3) return l.tram.chuoiTu3;
  return 0;
}

/**
 * Số sao theo luật. Ngưỡng tính trên thang 10 câu rồi quy theo số câu thật của
 * lượt (trạm luôn 10 câu nên thường là chính ngưỡng đó).
 */
export function tinhSaoTheoLuat(
  l: LuatChoi,
  soDung: number,
  thuThach: boolean,
  tongCau = 10,
): number {
  const quy = (nguong: number) => Math.ceil((nguong * tongCau) / 10);
  if (soDung >= quy(l.tram.saoBa)) return 3;
  if (soDung >= quy(l.tram.saoHai)) return 2;
  if (soDung >= quy(thuThach ? l.tram.saoMotThuThach : l.tram.saoMot))
    return 1;
  return 0;
}

export function canDeQuaTheoLuat(l: LuatChoi, thuThach: boolean): number {
  return thuThach ? l.tram.saoMotThuThach : l.tram.saoMot;
}

export function thuongChuoiNgayTheoLuat(l: LuatChoi, soNgay: number): number {
  return Math.min(
    l.thuThachNgay.thuongToiDa,
    l.thuThachNgay.thuongMoiNgay * Math.max(0, soNgay),
  );
}

export type DanhHieuTheoLuat = {
  bac: number;
  ten: string;
  tuDiem: number;
  y: string;
};

export function danhHieuTheoLuat(
  l: LuatChoi,
  diem: number,
  ngonLua: boolean,
): { hienTai: DanhHieuTheoLuat; tiepTheo: DanhHieuTheoLuat | null } {
  const ds: DanhHieuTheoLuat[] = [
    ...l.danhHieu.map((d, i) => ({ bac: i + 1, ...d })),
    { bac: 6, ten: l.ngonLua.ten, tuDiem: Infinity, y: l.ngonLua.y },
  ];
  if (ngonLua) return { hienTai: ds[5], tiepTheo: null };
  let hienTai = ds[0];
  for (const d of ds.slice(0, 5)) if (diem >= d.tuDiem) hienTai = d;
  return { hienTai, tiepTheo: ds[hienTai.bac] ?? null };
}

/** Điểm của huy hiệu theo luật; null nếu huy hiệu đang tắt. */
export function diemHuyHieuTheoLuat(l: LuatChoi, ma: string): number | null {
  const h = l.huyHieu[ma];
  if (!h) return null;
  return h.bat ? h.diem : null;
}
