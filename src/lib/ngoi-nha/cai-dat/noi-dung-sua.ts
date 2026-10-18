/**
 * Nội dung game Ban Điều hành sửa được ở quản trị (file THUẦN — client import
 * được). Bản gốc nằm trong các tệp JSON ở `noi-dung/`; bản sửa lưu SiteSetting.
 *
 * KHÔNG import JSON gốc vào đây: thẻ Cơ hội có lựa chọn khôn ngoan đứng đầu
 * (coi như đáp án) — bản gốc được máy chủ đưa vào qua tham số `macDinh`.
 *
 * Mã (`ma`) đã lưu trong CSDL (NnTienDo.theCoHoi, NnChiaSe.maCau, NnNhiemVu.maNv)
 * nên giữ nguyên hoa / thường của mã gốc; mục bỏ đi thì TẮT (`bat: false`), không
 * xoá, để lịch sử người chơi vẫn đọc được.
 */
import type { MaVon, Von } from "../luat";
import type { KyGioiHan } from "../thoi-gian";
import {
  bat,
  chu,
  dsCoMa,
  giuMaGoc,
  laDoiTuong,
  so,
} from "./chuan";

const MA_VON: MaVon[] = ["CN", "TT", "XH", "TS"];

function vonSach(x: unknown, [min, max]: readonly [number, number]): Partial<Von> {
  const o = laDoiTuong(x) ? x : {};
  const kq: Partial<Von> = {};
  for (const k of MA_VON) {
    const v = so(o[k], 0, [min, max]);
    if (v) kq[k] = v;
  }
  return kq;
}

// ─── Thẻ Cơ hội ───────────────────────────────────────────────────────

export type TheCoHoiSua = {
  ma: string;
  bat: boolean;
  ten: string;
  tinhHuong: string;
  /** Đúng 2 lựa chọn; lựa chọn KHÔN NGOAN đứng đầu (máy xáo khi hiện) */
  lua: { chon: string; von: Partial<Von>; giai: string }[];
};
export type NoiDungTheCoHoi = { ds: TheCoHoiSua[] };

export function chuanTheCoHoi(
  x: unknown,
  macDinh: TheCoHoiSua[],
): NoiDungTheCoHoi {
  const nguon = laDoiTuong(x) && Array.isArray(x.ds) ? x.ds : macDinh;
  const ds = dsCoMa<TheCoHoiSua>(
    nguon,
    (o) => {
      const ten = chu(o.ten, 80);
      const tinhHuong = chu(o.tinhHuong, 400);
      const lua = (Array.isArray(o.lua) ? o.lua : [])
        .filter(laDoiTuong)
        .slice(0, 2)
        .map((l) => ({
          chon: chu(l.chon, 200),
          von: vonSach(l.von, [-10, 10]),
          giai: chu(l.giai, 300),
        }));
      if (!ten || !tinhHuong || lua.length < 2 || lua.some((l) => !l.chon))
        return null;
      return { bat: bat(o.bat, true), ten, tinhHuong, lua };
    },
    60,
    "CH",
    giuMaGoc,
  );
  return { ds: ds.length ? ds : macDinh };
}

// ─── Nhiệm vụ Huynh đệ ────────────────────────────────────────────────

export const KY_GIOI_HAN: KyGioiHan[] = ["NGAY", "TUAN", "THANG", "MUA"];

export type NhiemVuSua = {
  ma: string;
  bat: boolean;
  ten: string;
  viec: string;
  xacNhan: string;
  diem: number;
  von: Partial<Von>;
  /** Chữ hiện cho người chơi, vd "Tối đa 4 lần/tháng" */
  gioiHan: string;
  /** 0 = không giới hạn */
  toiDa: number;
  ky: KyGioiHan | null;
  canAnh: boolean;
  goiY: string;
};
export type NoiDungNhiemVu = { ds: NhiemVuSua[] };

/**
 * Nhiệm vụ gắn với logic ghi nhận tự động nên KHÔNG thêm mới được: chỉ nhận
 * đúng các mã có trong bản gốc, thiếu mã nào lấy bản gốc mã đó.
 */
export function chuanNhiemVu(
  x: unknown,
  macDinh: NhiemVuSua[],
): NoiDungNhiemVu {
  const sua = new Map<string, Record<string, unknown>>();
  if (laDoiTuong(x) && Array.isArray(x.ds))
    for (const o of x.ds)
      if (laDoiTuong(o) && typeof o.ma === "string") sua.set(o.ma, o);
  return {
    ds: macDinh.map((g) => {
      const o = sua.get(g.ma);
      if (!o) return g;
      const ky = KY_GIOI_HAN.includes(o.ky as KyGioiHan)
        ? (o.ky as KyGioiHan)
        : o.ky === null
          ? null
          : g.ky;
      return {
        ma: g.ma,
        bat: bat(o.bat, g.bat),
        ten: chu(o.ten, 80, g.ten),
        viec: chu(o.viec, 300, g.viec),
        xacNhan: chu(o.xacNhan, 200, g.xacNhan),
        diem: so(o.diem, g.diem, [0, 5000]),
        von: laDoiTuong(o.von) ? vonSach(o.von, [0, 20]) : g.von,
        gioiHan: chu(o.gioiHan, 80, g.gioiHan),
        toiDa: so(o.toiDa, g.toiDa, [0, 100]),
        ky,
        canAnh: bat(o.canAnh, g.canAnh),
        goiY: typeof o.goiY === "string" ? chu(o.goiY, 200) : g.goiY,
      };
    }),
  };
}

// ─── Câu chia sẻ về mình (câu thưởng) ─────────────────────────────────

export type CauChiaSeSua = {
  ma: string;
  bat: boolean;
  hoi: string;
  luaChon: string[];
};
export type NoiDungChiaSe = { ds: CauChiaSeSua[] };

export function chuanChiaSe(
  x: unknown,
  macDinh: CauChiaSeSua[],
): NoiDungChiaSe {
  const nguon = laDoiTuong(x) && Array.isArray(x.ds) ? x.ds : macDinh;
  const ds = dsCoMa<CauChiaSeSua>(
    nguon,
    (o) => {
      const hoi = chu(o.hoi, 200);
      const luaChon = [
        ...new Set(
          (Array.isArray(o.luaChon) ? o.luaChon : [])
            .map((l) => chu(l, 80))
            .filter(Boolean),
        ),
      ].slice(0, 6);
      if (!hoi || luaChon.length < 2) return null;
      return { bat: bat(o.bat, true), hoi, luaChon };
    },
    60,
    "cs",
    giuMaGoc,
  );
  return { ds: ds.length ? ds : macDinh };
}

// ─── Ẩn câu / bộ câu trong kho thách đấu ──────────────────────────────

export type BoCauAn = {
  /** Mã bộ, vd "kinh-te-viet-nam-01" */
  bo: string[];
  /** Mã câu dạng "dt:<mã bộ>:<n>" */
  cau: string[];
};

export const BO_CAU_AN_MAC_DINH: BoCauAn = { bo: [], cau: [] };

export function chuanBoCauAn(x: unknown): BoCauAn {
  const o = laDoiTuong(x) ? x : {};
  const ds = (v: unknown, re: RegExp) => [
    ...new Set(
      (Array.isArray(v) ? v : [])
        .filter((s): s is string => typeof s === "string" && re.test(s))
        .slice(0, 2000),
    ),
  ];
  return {
    bo: ds(o.bo, /^[a-z0-9-]{1,80}$/),
    cau: ds(o.cau, /^dt:[a-z0-9-]{1,80}:\d{1,3}$/),
  };
}

// ─── Hướng dẫn người mới ──────────────────────────────────────────────

export type BuocHuongDan = { tieuDe: string; noiDung: string };
export type NoiDungHuongDan = { buoc: BuocHuongDan[] };

export const HUONG_DAN_MAC_DINH: NoiDungHuongDan = {
  buoc: [
    {
      tieuDe: "Chào mừng về Ngôi nhà Chợ Lớn",
      noiDung:
        "Hành trình đi qua 5 gian Chợ Bình Tây theo đúng cơ chế 4B: Biết → Bạn → Bàn → Bán → Vươn tầm. 5 chặng, 22 trạm, mỗi trạm 10 câu.",
    },
    {
      tieuDe: "Tích lũy 4 loại vốn",
      noiDung:
        "Mỗi câu đúng cộng một loại vốn. Qua trạm được mở thẻ sưu tầm và rút Thẻ Cơ hội — chọn khôn ngoan thì vốn tăng, chọn vội vàng thì vốn giảm. Mỗi ngày lật một Lá bài để nhận danh ngôn, lời nhắn hoặc điểm thưởng.",
    },
    {
      tieuDe: "Việc thật ngoài đời mới là vốn lớn",
      noiDung:
        "Vào Góc Huynh đệ nhận nhiệm vụ: đi sự kiện, giới thiệu mối quan hệ tốt, dùng hàng hội viên… Đạt mốc là có quà — xem ở mục Phần thưởng. Muốn so tài thì vào Đấu trường, thách bất kỳ ai trên bảng xếp hạng với hơn 100 bộ câu hỏi.",
    },
  ],
};

export function chuanHuongDan(x: unknown): NoiDungHuongDan {
  const ds = laDoiTuong(x) && Array.isArray(x.buoc) ? x.buoc : [];
  return {
    buoc: HUONG_DAN_MAC_DINH.buoc.map((md, i) => {
      const b = laDoiTuong(ds[i]) ? ds[i] : {};
      return {
        tieuDe: chu(b.tieuDe, 80, md.tieuDe),
        noiDung: chu(b.noiDung, 600, md.noiDung),
      };
    }),
  };
}
