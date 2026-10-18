/**
 * Tab quản trị "Người chơi" — hàm THUẦN (client import được, test chạy không
 * cần CSDL): giới hạn + kiểm tra điều chỉnh điểm tay, tìm người trong danh
 * sách tài khoản, đổi mã sổ cái sang chữ dễ đọc. Máy chủ: `nguoi-choi-loi.ts`.
 */
import { MA_VON, VON, soDep, vonRong, type Von } from "@/lib/ngoi-nha/luat";
import { TEN_LOAI_LA, type LoaiLa } from "@/lib/ngoi-nha/la-bai-luat";
import { normalizeSearch } from "@/lib/search";

export const GIOI_HAN_DIEU_CHINH = {
  diem: [-100_000, 100_000],
  von: [-50, 50],
  lyDoToiThieu: 5,
  lyDoToiDa: 300,
} as const;

/** Lượt bỏ dở lâu hơn chừng này thì Ban được đóng hộ (khớp `LUOT_CU_MS` trong dong-co.ts). */
export const GIO_LUOT_CU = 6;

export type DieuChinh = {
  userId: string;
  /** Mùa trang quản trị đang hiện lúc bấm — lệch mùa hiện tại thì từ chối */
  muaId: string | null;
  diem: number;
  von: Von;
  lyDo: string;
};

export type KetQuaKiemTra =
  { ok: true; data: DieuChinh } | { ok: false; loi: string };

const soNguyenTrong = (x: unknown, [min, max]: readonly [number, number]) =>
  typeof x === "number" && Number.isInteger(x) && x >= min && x <= max;

/** Số có dấu kiểu Việt: "+1.000", "−50". */
export const soCoDau = (n: number) =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${soDep(Math.abs(n))}`;

/**
 * Kiểm tra dữ liệu điều chỉnh gửi từ trình duyệt. KHÔNG tự chặn về giới hạn:
 * cộng trừ điểm tay phải đúng con số Ban nhập, sai thì báo để nhập lại.
 */
export function kiemTraDieuChinh(x: unknown): KetQuaKiemTra {
  if (!x || typeof x !== "object" || Array.isArray(x))
    return { ok: false, loi: "Dữ liệu gửi lên không đúng dạng" };
  const o = x as Record<string, unknown>;
  const userId = typeof o.userId === "string" ? o.userId.trim() : "";
  if (!userId || userId.length > 100)
    return { ok: false, loi: "Thiếu người chơi cần điều chỉnh" };
  const muaId =
    typeof o.muaId === "string" && o.muaId.trim() ? o.muaId.trim() : null;

  const diem = o.diem ?? 0;
  if (!soNguyenTrong(diem, GIOI_HAN_DIEU_CHINH.diem))
    return {
      ok: false,
      loi: `Điểm phải là số nguyên từ ${soCoDau(GIOI_HAN_DIEU_CHINH.diem[0])} đến ${soDep(GIOI_HAN_DIEU_CHINH.diem[1])}`,
    };

  const vonTho = o.von ?? {};
  if (typeof vonTho !== "object" || vonTho === null || Array.isArray(vonTho))
    return { ok: false, loi: "Vốn gửi lên không đúng dạng" };
  const von = vonRong();
  for (const k of MA_VON) {
    const v = (vonTho as Record<string, unknown>)[k] ?? 0;
    if (!soNguyenTrong(v, GIOI_HAN_DIEU_CHINH.von))
      return {
        ok: false,
        loi: `${VON[k].ten} phải là số nguyên từ ${soCoDau(GIOI_HAN_DIEU_CHINH.von[0])} đến ${GIOI_HAN_DIEU_CHINH.von[1]}`,
      };
    von[k] = (v as number) || 0; // bỏ -0
  }
  if (diem === 0 && MA_VON.every((k) => von[k] === 0))
    return { ok: false, loi: "Chưa nhập số điểm hoặc vốn nào cần điều chỉnh" };

  const lyDo =
    typeof o.lyDo === "string"
      ? o.lyDo.normalize("NFC").replace(/\s+/g, " ").trim()
      : "";
  const dai = [...lyDo].length;
  if (dai < GIOI_HAN_DIEU_CHINH.lyDoToiThieu)
    return {
      ok: false,
      loi: `Lý do cần ít nhất ${GIOI_HAN_DIEU_CHINH.lyDoToiThieu} ký tự — ghi rõ vì sao điều chỉnh để sau này đối chiếu`,
    };
  if (dai > GIOI_HAN_DIEU_CHINH.lyDoToiDa)
    return {
      ok: false,
      loi: `Lý do dài quá ${GIOI_HAN_DIEU_CHINH.lyDoToiDa} ký tự`,
    };
  return {
    ok: true,
    data: { userId, muaId, diem: (diem as number) || 0, von, lyDo },
  };
}

/**
 * Phần TRỪ không được kéo tổng mùa xuống dưới 0 (game không bao giờ tự sinh
 * số âm — mốc quà, danh hiệu, bảng xếp hạng đều tính từ 0). Phần cộng thì
 * luôn được. Trả câu báo lỗi, hoặc null khi hợp lệ. Máy chủ gọi trong giao
 * dịch với tổng thật; trang quản trị gọi với số lúc mở trang để báo sớm.
 */
export function loiTongAm(
  truoc: { diem: number; von: Von },
  doi: { diem: number; von: Von },
): string | null {
  if (doi.diem < 0 && truoc.diem + doi.diem < 0) {
    const co = Math.max(truoc.diem, 0);
    return `Điểm mùa hiện có ${soDep(co)} — chỉ trừ được tối đa ${soDep(co)} để không thành số âm`;
  }
  for (const k of MA_VON)
    if (doi.von[k] < 0 && truoc.von[k] + doi.von[k] < 0) {
      const co = Math.max(truoc.von[k], 0);
      return `${VON[k].ten} hiện có ${co} — chỉ trừ được tối đa ${co} để không thành số âm`;
    }
  return null;
}

/** "Tri thức +3 · Xã hội −2" (bỏ vốn bằng 0; rỗng khi không đổi vốn nào). */
export function moTaVon(von: Partial<Von>): string {
  return MA_VON.filter((k) => von[k])
    .map((k) => `${VON[k].ngan} ${soCoDau(von[k] ?? 0)}`)
    .join(" · ");
}

/** "+500 điểm · Tri thức +3 · Xã hội −2" */
export function moTaThayDoi(diem: number, von: Partial<Von>): string {
  const phan = [diem ? `${soCoDau(diem)} điểm` : "", moTaVon(von)].filter(
    Boolean,
  );
  return phan.join(" · ") || "không đổi điểm, vốn";
}

// ─── tìm người ─────────────────────────────────────────────────────────

export type UngVien = {
  id: string;
  username: string;
  /** Tên hội viên, hoặc tên tài khoản khi không gắn hội viên */
  ten: string;
  congTy: string | null;
  ma: string | null;
  dienThoai: string | null;
};

/** Chỉ còn chữ số, đầu "84" đổi về "0" để gõ kiểu nào cũng khớp. */
export function chuanSoDienThoai(s: string | null | undefined): string {
  const d = (s ?? "").replace(/\D/g, "");
  return d.startsWith("84") && d.length >= 11 ? `0${d.slice(2)}` : d;
}

/**
 * Tìm trong danh sách tài khoản theo tên hội viên, doanh nghiệp, tên đăng nhập,
 * mã hội viên, số điện thoại — không phân biệt dấu / hoa thường. Lọc trong bộ
 * nhớ (vài trăm tài khoản) thay vì LIKE của SQLite: LIKE phân biệt hoa thường
 * với chữ có dấu và không so được số điện thoại ghi kiểu "0903.123.456".
 */
export function timUngVien<T extends UngVien>(
  ds: T[],
  q: string,
  gioiHan = 30,
): T[] {
  const nq = normalizeSearch(q);
  if (!nq) return [];
  const tu = nq.split(" ");
  const so = chuanSoDienThoai(q);
  const giongSo = /^[\d\s.+()-]+$/.test(q.trim()) && so.length >= 3;

  const cham = (u: T): number => {
    const user = normalizeSearch(u.username);
    const ma = normalizeSearch(u.ma ?? "");
    const ten = normalizeSearch(u.ten);
    const ct = normalizeSearch(u.congTy ?? "");
    const dt = chuanSoDienThoai(u.dienThoai);
    let d = 0;
    const len = (n: number) => (d = Math.max(d, n));
    if (user === nq || ma === nq) len(100);
    if (giongSo && dt && dt.includes(so)) len(dt === so ? 95 : 60);
    if (ten === nq) len(85);
    if (user.startsWith(nq) || ma.startsWith(nq)) len(70);
    if (ten.startsWith(nq) || ten.includes(` ${nq}`)) len(55);
    if (ten.includes(nq) || user.includes(nq) || ma.includes(nq)) len(45);
    if (ct.includes(nq)) len(35);
    // Gõ lẫn tên + doanh nghiệp ("an mon amie"): mọi từ đều có mặt ở đâu đó
    const tatCa = `${ten} ${ct} ${user} ${ma}`;
    if (tu.length > 1 && tu.every((t) => tatCa.includes(t))) len(25);
    return d;
  };

  return ds
    .map((u) => ({ u, d: cham(u) }))
    .filter((x) => x.d > 0)
    .sort((a, b) => b.d - a.d || a.u.ten.localeCompare(b.u.ten, "vi"))
    .slice(0, gioiHan)
    .map((x) => x.u);
}

// ─── sổ cái dễ đọc ─────────────────────────────────────────────────────

export const TEN_LOAI_SO_CAI: Record<string, string> = {
  TRAM: "Trạm",
  THU_THACH_NGAY: "Thử thách ngày",
  DAU_TRI: "Đấu trí sự kiện",
  DAU_TRUONG: "Đấu trường",
  THE_CO_HOI: "Thẻ Cơ hội",
  NHIEM_VU: "Nhiệm vụ Huynh đệ",
  HUY_HIEU: "Huy hiệu",
  LA_BAI: "Lá bài mỗi ngày",
  DIEU_CHINH: "Ban điều chỉnh",
};

export const tenLoaiSoCai = (loai: string) => TEN_LOAI_SO_CAI[loai] ?? loai;

const ngayNgan = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s)
    ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`
    : s;

/** Tra tên cho các mã trong `nguon` — máy chủ đưa vào, test đưa bản giả. */
export type TraNguon = {
  tenTram?: (ma: string) => string | undefined;
  tenHuyHieu?: (ma: string) => string | undefined;
  tenDauTri?: (id: string) => string | undefined;
  /** Tên đối thủ của người đang xem trong trận `tran:<id>` */
  doiThuTran?: (id: string) => string | undefined;
};

/** `nguon` của một dòng sổ cái ("tram:1.3", "hh:HOAN_HAO"…) → chữ tiếng Việt. */
export function nhanNguon(nguon: string, tra: TraNguon = {}): string {
  const i = nguon.indexOf(":");
  const tien = i < 0 ? nguon : nguon.slice(0, i);
  const sau = i < 0 ? "" : nguon.slice(i + 1);
  switch (tien) {
    case "tram": {
      const ten = tra.tenTram?.(sau);
      return `Trạm ${sau}${ten ? ` · ${ten}` : ""}`;
    }
    case "ngay":
      return `Thử thách ngày ${ngayNgan(sau)}`;
    case "labai":
      return `Lá bài ngày ${ngayNgan(sau)}`;
    case "hh":
      return `Huy hiệu ${tra.tenHuyHieu?.(sau) ?? sau}`;
    case "the": {
      const tram = sau.split(":")[1];
      return `Thẻ Cơ hội${tram ? ` sau trạm ${tram}` : ""}`;
    }
    case "nv":
      return "Nhiệm vụ Huynh đệ";
    case "dau-tri": {
      const ten = tra.tenDauTri?.(sau);
      return ten ? `Đấu trí “${ten}”` : "Đấu trí sự kiện";
    }
    case "tran": {
      const ten = tra.doiThuTran?.(sau);
      return ten ? `Trận Đấu trường với ${ten}` : "Trận Đấu trường";
    }
    case "dc":
      return "Ban Điều hành điều chỉnh tay";
    default:
      return nguon;
  }
}

/**
 * Ghi chú sổ cái để hiện. Dòng Lá bài lưu JSON ảnh chụp kết quả — đổi thành
 * một câu ngắn thay vì hiện nguyên chuỗi JSON.
 */
export function docGhiChu(loai: string, ghiChu: string | null): string {
  if (!ghiChu) return "";
  if (loai !== "LA_BAI" || !ghiChu.trimStart().startsWith("{")) return ghiChu;
  try {
    const o = JSON.parse(ghiChu) as {
      loai?: string;
      qua?: { ten?: string; nhaDongHanh?: string } | null;
      chuoiNgay?: number;
    };
    const phan: string[] = [];
    if (o.loai && Object.prototype.hasOwnProperty.call(TEN_LOAI_LA, o.loai))
      phan.push(TEN_LOAI_LA[o.loai as LoaiLa]);
    if (o.qua?.ten)
      phan.push(
        `quà: ${o.qua.ten}${o.qua.nhaDongHanh ? ` (${o.qua.nhaDongHanh})` : ""}`,
      );
    if (typeof o.chuoiNgay === "number" && o.chuoiNgay > 1)
      phan.push(`chuỗi ${o.chuoiNgay} ngày`);
    return phan.join(" · ") || "Lá bài";
  } catch {
    return "Lá bài";
  }
}

export const TEN_CHE_DO_LUOT: Record<string, string> = {
  TINH_DIEM: "Tính điểm",
  LUYEN_TAP: "Luyện tập",
  THU_THACH_NGAY: "Thử thách ngày",
};
