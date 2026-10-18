import crypto from "crypto";
import {
  datDiemTuDong,
  docQuyTacDiem,
  goDiemTuDong,
  type NguoiGhiDiem,
  type QuyTacDiem,
} from "@/lib/diem-tu-dong";
import { prisma } from "@/lib/prisma";
import { normalizeSearch } from "@/lib/search";
import { chuanSoDienThoai, laSoDienThoaiVN } from "@/lib/so-dien-thoai";

/**
 * LÕI CHECK-IN Lễ chuyển giao 10/10 (viết lại 01/10/2026 khi Chủ tịch đặt
 * hàng "quét mã QR + tính điểm hoạt động"). MỌI đường check-in đều đi qua
 * `ghiCheckin` / `huyCheckin` ở đây:
 *   - khách tự check-in (/1010/checkin, nút trên thư mời riêng),
 *   - lễ tân bấm nút ở quản trị,
 *   - lễ tân QUÉT MÃ QR thư mời hoặc thẻ hội viên bằng camera.
 * Nhờ vậy điểm hoạt động và bản ghi tham dự luôn khớp với trạng thái
 * check-in, bấm huỷ là điểm tự rút.
 *
 * Khách mời (`KhachMoi1010`) nối với hồ sơ hội viên qua cột `memberId` —
 * máy tự ghép theo SĐT / tên, BTC sửa tay được. Chỉ khách ĐÃ GHÉP hồ sơ
 * hội viên Chợ Lớn mới có điểm; khách ngoài Chi hội vẫn được ghi nhận có
 * mặt như cũ.
 *
 * Điểm chỉ tính cho lượt check-in ghi TỪ ngày sự kiện trở đi (kể cả thư ký
 * bổ sung hôm sau); lượt bấm thử trước ngày 10/10 không sinh điểm, trừ khi
 * bật "Diễn tập" trong quy tắc điểm.
 */

export const SLUG_1010 = "le-chuyen-giao-10-10-2026";
export const NGAY_1010 = "2026-10-10";
/** 00:00 ngày 10.10.2026 theo giờ Việt Nam */
export const MOC_1010 = new Date("2026-10-09T17:00:00.000Z");
export const TEN_SU_KIEN_1010 = "Lễ chuyển giao 10.10.2026";

export type Phien1010 = "TOA_DAM" | "LE" | "GALA";
export const CAC_PHIEN: Phien1010[] = ["TOA_DAM", "LE", "GALA"];
export const TEN_PHIEN_CI: Record<Phien1010, string> = {
  TOA_DAM: "Tọa đàm",
  LE: "Lễ chuyển giao",
  GALA: "Gala",
};
/** Mã phiên dùng ở cột `phien` / `phienDuocMoi` (suất mời) */
const MA_SUAT: Record<Phien1010, string> = {
  TOA_DAM: "TOA_DAM",
  LE: "CHUYEN_GIAO",
  GALA: "GALA",
};

export type CachCheckin = "TU" | "THIEP" | "LE_TAN" | "QUET" | "QUET_THE";
const TEN_CACH: Record<CachCheckin, string> = {
  TU: "khách tự check-in tại cửa",
  THIEP: "khách bấm check-in trên thư mời",
  LE_TAN: "lễ tân bấm check-in",
  QUET: "lễ tân quét mã QR thư mời",
  QUET_THE: "lễ tân quét thẻ hội viên",
};
/** Nhãn ngắn của từng cách check-in trong bảng lịch sử (gồm cả lượt huỷ) */
export const NHAN_CACH: Record<string, string> = {
  TU: "Khách tự quét QR",
  THIEP: "Nút trên thiệp",
  LE_TAN: "Lễ tân bấm",
  QUET: "Lễ tân quét thiệp",
  QUET_THE: "Quét thẻ hội viên",
  HUY: "Huỷ check-in",
};

/** Người đứng tên dòng điểm khi không có lễ tân nào bấm (khách tự làm, máy tính lại) */
export const NGUOI_TU_DONG: NguoiGhiDiem = {
  id: "tu-dong",
  ten: "Tự động theo check-in",
};

/** Dấu ở `ThamDuSuKien.checkinBoi` cho bản ghi do luồng 10/10 trên web tạo */
const DAU_WEB_1010 = "WEB-1010";

export type BoiAi = { cach: CachCheckin; nguoi: NguoiGhiDiem };

/**
 * Giá trị `KhachMoi1010.memberId` khi BTC bấm "Không phải hội viên": máy
 * thôi tự ghép dòng này (không thì lần "Ghép & tính lại" sau lại ghép vào
 * đúng hồ sơ BTC vừa gỡ) và không tính là "chưa ghép".
 */
export const KHONG_HOI_VIEN = "KHONG";
/** memberId có trỏ tới một hồ sơ hội viên thật không */
export const coHoSo = (memberId: string | null | undefined): memberId is string =>
  !!memberId && memberId !== KHONG_HOI_VIEN;

// ───────────────────────── Giờ Việt Nam ─────────────────────────

/** Ngày (yyyy-mm-dd) và số phút trong ngày theo giờ Việt Nam. */
export function gioVietNam(d: Date = new Date()): { ngay: string; phut: number } {
  const phan = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const lay = (t: string) => phan.find((p) => p.type === t)?.value ?? "00";
  return {
    ngay: `${lay("year")}-${lay("month")}-${lay("day")}`,
    // Intl trả "24" cho 0 giờ ở một số máy — quy về 0 cho chắc
    phut: (Number(lay("hour")) % 24) * 60 + Number(lay("minute")),
  };
}

/** "14:35" theo giờ Việt Nam */
export function gioPhut(d: Date): string {
  const { phut } = gioVietNam(d);
  return `${String(Math.floor(phut / 60)).padStart(2, "0")}:${String(phut % 60).padStart(2, "0")}`;
}

/** "07/10" theo giờ Việt Nam */
export function ngayThang(d: Date): string {
  const [, m, dd] = gioVietNam(d).ngay.split("-");
  return `${dd}/${m}`;
}

/** "19:32 ngày 07/10/2026" theo giờ Việt Nam — dùng trong câu báo cho khách */
export function gioNgayDayDu(d: Date): string {
  const [y, m, dd] = gioVietNam(d).ngay.split("-");
  return `${gioPhut(d)} ngày ${dd}/${m}/${y}`;
}

/**
 * Phiên đang diễn ra theo giờ VN (Chủ tịch chốt 25/09): trước 16:30 = Tọa
 * đàm, 16:30–17:30 = Lễ chuyển giao, từ 17:30 = Gala.
 */
export function phienTheoGio(phut: number): Phien1010 {
  return phut >= 17 * 60 + 30 ? "GALA" : phut >= 16 * 60 + 30 ? "LE" : "TOA_DAM";
}

/** Hôm nay so với ngày sự kiện (giờ VN). */
export function soVoiNgaySuKien(d: Date = new Date()): "TRUOC" | "DUNG_NGAY" | "SAU" {
  const { ngay } = gioVietNam(d);
  return ngay < NGAY_1010 ? "TRUOC" : ngay > NGAY_1010 ? "SAU" : "DUNG_NGAY";
}

// ───────────────────────── Mã quét được ─────────────────────────

/**
 * Đọc chuỗi máy quét trả về. Nhận:
 *  - mã thư mời "CL-AB2CD", hoặc cả đường link thư mời có chứa mã đó;
 *  - thẻ hội viên trên Zalo Mini App "YBACL:HV0001", hoặc gõ tay "HV0001".
 */
export function docMaQuet(
  tho: string
): { loai: "KHACH"; ma: string } | { loai: "HOI_VIEN"; code: string } | null {
  const s = String(tho ?? "").trim().toUpperCase();
  if (!s || s.length > 300) return null;
  const k = s.match(/(?<![A-Z0-9])CL-[A-Z0-9]{5}(?![A-Z0-9])/);
  if (k) return { loai: "KHACH", ma: k[0] };
  const h = s.match(/^(?:YBACL:)?\s*(HV\d{1,6})$/);
  if (h) return { loai: "HOI_VIEN", code: h[1] };
  return null;
}

/** Mã thư mời in trên thiệp: CL-XXXXX, bỏ ký tự dễ nhìn nhầm (0/O, 1/I/L). */
export function sinhMaThuMoi(): string {
  const bo = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return (
    "CL-" + Array.from(crypto.randomBytes(5), (b) => bo[b % bo.length]).join("")
  );
}

export async function maThuMoiChuaTrung(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const ma = sinhMaThuMoi();
    const daCo = await prisma.khachMoi1010.findUnique({
      where: { ma },
      select: { id: true },
    });
    if (!daCo) return ma;
  }
  throw new Error("Không sinh được mã thư mời");
}

/** "Thư #001 · Phụ trách: Anh Khang" → "Anh Khang" */
export function phuTrachCua(ghiChuBTC: string | null | undefined): string | null {
  return ghiChuBTC?.match(/Phụ trách:\s*([^·]+)/)?.[1]?.trim() || null;
}

// ───────────────────── Ghép khách ↔ hồ sơ hội viên ─────────────────────

export type HoiVienGon = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  company: string;
};

export type ChiMucHoiVien = {
  theoSdt: Map<string, HoiVienGon[]>;
  theoTen: Map<string, HoiVienGon[]>;
};

export function lapChiMucHoiVien(ds: HoiVienGon[]): ChiMucHoiVien {
  const theoSdt = new Map<string, HoiVienGon[]>();
  const theoTen = new Map<string, HoiVienGon[]>();
  for (const m of ds) {
    const s = chuanSoDienThoai(m.phone);
    if (laSoDienThoaiVN(s)) theoSdt.set(s, [...(theoSdt.get(s) ?? []), m]);
    const t = normalizeSearch(m.name);
    if (t) theoTen.set(t, [...(theoTen.get(t) ?? []), m]);
  }
  return { theoSdt, theoTen };
}

export async function napChiMucHoiVien(): Promise<ChiMucHoiVien> {
  return lapChiMucHoiVien(
    await prisma.member.findMany({
      where: { active: true },
      select: { id: true, code: true, name: true, phone: true, company: true },
    })
  );
}

/** Nhóm khách thuộc Chi hội Chợ Lớn: chữ gốc Excel "YBA CHỢ LỚN" hoặc mã HOI_VIEN. */
export function laNhomChoLon(nhom: string | null | undefined): boolean {
  const n = normalizeSearch(nhom ?? "");
  return n === "hoi_vien" || n.includes("cho lon");
}

const TU_BO_DON_VI =
  /\b(cong ty|cty|co phan|cp|tnhh|mtv|mot thanh vien|tap doan|thuong mai|tm|dich vu|dv|san xuat|sx|xuat nhap khau|xnk|dau tu|va|group|jsc|ltd|co|ceo)\b/g;

/** Phần "lõi" của tên đơn vị để so gần đúng (bỏ loại hình, bỏ dấu). */
export function loiTenDonVi(s: string | null | undefined): string {
  return normalizeSearch(s ?? "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(TU_BO_DON_VI, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function donViGiong(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = loiTenDonVi(a);
  const y = loiTenDonVi(b);
  if (x.length < 4 || y.length < 4) return false;
  return x.includes(y) || y.includes(x);
}

/** Hai họ tên "gần nhau": trùng hẳn, cái này chứa cái kia, hoặc cùng tên gọi (chữ cuối). */
function tenGan(a: string, b: string): boolean {
  const x = normalizeSearch(a);
  const y = normalizeSearch(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  return x.split(" ").pop() === y.split(" ").pop();
}

/**
 * Tìm hồ sơ hội viên của một khách mời — hàm THUẦN, thà sót còn hơn ghép
 * nhầm (ghép nhầm là cộng điểm cho người khác):
 *  1. SĐT trùng đúng MỘT hội viên và tên không lệch hẳn (tránh SĐT trợ lý);
 *  2. họ tên trùng đúng một hội viên VÀ (khách thuộc nhóm Chợ Lớn HOẶC tên
 *     đơn vị gần giống) — khách ngoài Chi hội trùng tên thì không tự ghép;
 *  3. nhiều hội viên trùng tên → chỉ ghép khi đơn vị chỉ ra đúng một người.
 */
export function timHoiVienKhop(
  khach: { ten: string; phone: string | null; donVi: string | null; nhom: string },
  cm: ChiMucHoiVien
): { hoiVien: HoiVienGon; cach: "SDT" | "TEN" } | null {
  const sdt = chuanSoDienThoai(khach.phone);
  if (laSoDienThoaiVN(sdt)) {
    const ds = cm.theoSdt.get(sdt) ?? [];
    if (ds.length === 1 && tenGan(ds[0].name, khach.ten)) {
      return { hoiVien: ds[0], cach: "SDT" };
    }
  }
  const ds = cm.theoTen.get(normalizeSearch(khach.ten)) ?? [];
  if (ds.length === 1) {
    if (laNhomChoLon(khach.nhom) || donViGiong(khach.donVi, ds[0].company)) {
      return { hoiVien: ds[0], cach: "TEN" };
    }
  } else if (ds.length > 1) {
    const dung = ds.filter((m) => donViGiong(khach.donVi, m.company));
    if (dung.length === 1) return { hoiVien: dung[0], cach: "TEN" };
  }
  return null;
}

type KhachDeGhep = {
  id: string;
  ten: string;
  phone: string | null;
  donVi: string | null;
  nhom: string;
  memberId: string | null;
};

/** Khách chưa ghép thì thử ghép ngay (gọi lúc check-in). Trả memberId hoặc null. */
async function tuGhepKhach(khach: KhachDeGhep): Promise<string | null> {
  if (khach.memberId) return coHoSo(khach.memberId) ? khach.memberId : null;
  if (khach.nhom === "BTC") return null; // ê-kíp phục vụ, không phải hội viên
  const khop = timHoiVienKhop(khach, await napChiMucHoiVien());
  if (!khop) return null;
  await prisma.khachMoi1010.updateMany({
    where: { id: khach.id, memberId: null },
    data: { memberId: khop.hoiVien.id },
  });
  return khop.hoiVien.id;
}

// ───────────────────── Bản ghi sự kiện + tham dự ─────────────────────

let idSuKienNho: string | null = null;

/**
 * Bản ghi `Event` của Lễ chuyển giao — nơi `ThamDuSuKien` bám vào để điểm
 * "Hoạt động" (Mini App) và nhiệm vụ game đếm được lần tham dự này. Chưa
 * có thì tạo ở dạng CHƯA CÔNG BỐ; sau lễ thư ký thêm ảnh rồi bật công bố.
 */
export async function idSuKien1010(): Promise<string> {
  if (idSuKienNho) {
    const con = await prisma.event.findUnique({
      where: { id: idSuKienNho },
      select: { id: true },
    });
    if (con) return con.id;
    idSuKienNho = null;
  }
  let ev = await prisma.event.findUnique({
    where: { slug: SLUG_1010 },
    select: { id: true },
  });
  if (!ev) {
    const lich = await prisma.lichHoatDong.findUnique({
      where: { slug: SLUG_1010 },
      select: { tieuDe: true, moTa: true, tuNgay: true, diaDiem: true },
    });
    try {
      ev = await prisma.event.create({
        data: {
          slug: SLUG_1010,
          title:
            lich?.tieuDe ??
            "Lễ chuyển giao & ra mắt Ban Điều hành YBA Chợ Lớn nhiệm kỳ I (2026 – 2029)",
          summary: lich?.moTa ?? null,
          startAt: lich?.tuNgay ?? new Date("2026-10-10T07:00:00.000Z"),
          location: lich?.diaDiem ?? null,
          published: false,
        },
        select: { id: true },
      });
    } catch {
      // Hai yêu cầu cùng tạo — bên thua đọc lại bản bên thắng vừa ghi
      ev = await prisma.event.findUnique({
        where: { slug: SLUG_1010 },
        select: { id: true },
      });
      if (!ev) throw new Error("Không tạo được bản ghi sự kiện 10/10");
    }
  }
  idSuKienNho = ev.id;
  return ev.id;
}

async function dongBoThamDu(memberId: string, somNhat: Date | null): Promise<void> {
  if (!somNhat) {
    const ev = await prisma.event.findUnique({
      where: { slug: SLUG_1010 },
      select: { id: true },
    });
    if (!ev) return;
    // Chỉ lùi bản ghi do chính luồng này đánh dấu — không đụng lượt Ban Tổ
    // chức quét bằng Mini App
    await prisma.thamDuSuKien.updateMany({
      where: {
        eventId: ev.id,
        memberId,
        trangThai: "DA_CHECKIN",
        checkinBoi: DAU_WEB_1010,
      },
      data: { trangThai: "DANG_KY", checkinAt: null, checkinBoi: null },
    });
    return;
  }
  const eventId = await idSuKien1010();
  await prisma.thamDuSuKien.upsert({
    where: { eventId_memberId: { eventId, memberId } },
    create: {
      eventId,
      memberId,
      trangThai: "DA_CHECKIN",
      checkinAt: somNhat,
      checkinBoi: DAU_WEB_1010,
    },
    update: { trangThai: "DA_CHECKIN", checkinAt: somNhat, checkinBoi: DAU_WEB_1010 },
  });
}

// ───────────────────────── Điểm hoạt động ─────────────────────────

export const TIEN_TO_DIEM_1010 = "ci1010:";
export const khoaDiem1010 = (memberId: string, phien: Phien1010) =>
  `${TIEN_TO_DIEM_1010}${memberId}:${phien}`;

export type KetQuaDongBo = {
  /** Điểm vừa cộng thêm ở lần gọi này */
  cong: number;
  /** Điểm vừa rút ở lần gọi này */
  tru: number;
  /** Tổng điểm tự động của hội viên cho sự kiện 10/10 sau khi đồng bộ */
  tong: number;
};

type BaCotCheckin = {
  checkinLuc: Date | null;
  checkinLeLuc: Date | null;
  checkinGalaLuc: Date | null;
};

/** Giờ check-in của một phiên (null = chưa vào) */
export const lucCheckin = (d: BaCotCheckin, p: Phien1010) =>
  p === "GALA" ? d.checkinGalaLuc : p === "LE" ? d.checkinLeLuc : d.checkinLuc;

/**
 * Đưa sổ điểm + bản ghi tham dự của MỘT hội viên về đúng với trạng thái
 * check-in hiện tại (gộp mọi dòng khách mời đã ghép vào hội viên đó — một
 * người có hai dòng vẫn chỉ được điểm một lần mỗi phiên). Gọi lại bao
 * nhiêu lần cũng ra cùng kết quả.
 */
export async function dongBoDiemHoiVien(
  memberId: string,
  boi?: BoiAi & { phien?: Phien1010 },
  quyTac?: QuyTacDiem
): Promise<KetQuaDongBo> {
  const q = quyTac ?? (await docQuyTacDiem());
  const [hoiVien, dong] = await Promise.all([
    prisma.member.findUnique({ where: { id: memberId }, select: { id: true } }),
    prisma.khachMoi1010.findMany({
      where: { memberId },
      select: { checkinLuc: true, checkinLeLuc: true, checkinGalaLuc: true },
    }),
  ]);

  let cong = 0;
  let tru = 0;
  let tong = 0;
  let somNhat: Date | null = null;

  for (const p of CAC_PHIEN) {
    // Giờ có mặt sớm nhất của phiên này, chỉ tính lượt ghi từ ngày sự kiện
    const luc: Date | null =
      dong
        .map((d) => lucCheckin(d, p))
        .filter((x): x is Date => !!x)
        .filter((x) => q.dienTap || x >= MOC_1010)
        .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
    const nguon = khoaDiem1010(memberId, p);

    if (hoiVien && luc && (!somNhat || luc < somNhat)) somNhat = luc;

    if (hoiVien && luc && q.bat && q.phien1010 > 0) {
      const dungPhien = !!boi && boi.phien === p;
      const r = await datDiemTuDong({
        nguon,
        memberId,
        diem: q.phien1010,
        loai: "THAM_GIA",
        lyDo:
          `Tham gia ${TEN_SU_KIEN_1010} — phiên ${TEN_PHIEN_CI[p]} · có mặt ${gioPhut(luc)}` +
          (dungPhien && boi ? ` (${TEN_CACH[boi.cach]})` : ""),
        nguoi: dungPhien && boi ? boi.nguoi : NGUOI_TU_DONG,
      });
      if (r.taoMoi) cong += r.diem;
      tong += r.diem;
    } else {
      tru += await goDiemTuDong(nguon);
    }
  }

  if (hoiVien) await dongBoThamDu(memberId, somNhat);
  return { cong, tru, tong };
}

// ───────────────────────── Ghi / huỷ check-in ─────────────────────────

const datCot = (p: Phien1010, v: Date | null) =>
  p === "GALA" ? { checkinGalaLuc: v } : p === "LE" ? { checkinLeLuc: v } : { checkinLuc: v };

export type KetQuaGhi = {
  /** true = lần đầu check-in phiên này; false = check-in LẠI (đã có từ trước) */
  moi: boolean;
  /** Giờ của lần check-in vừa ghi (mới nhất) */
  luc: Date;
  /** Giờ của lần check-in trước đó ở phiên này (null = lần đầu) */
  lanTruoc: Date | null;
  memberId: string | null;
  diem: KetQuaDongBo | null;
};

/**
 * Ghi check-in một phiên cho một khách. CHECK-IN NHIỀU LẦN (Chủ tịch chốt
 * 07/10/2026): mỗi lần quét đều CẬP NHẬT giờ của phiên thành giờ mới nhất
 * và ghi thêm một dòng `LuotCheckin1010` — khách quét thử hôm trước rồi
 * quét lại ngày lễ thì cột giữ giờ ngày lễ, lịch sử giữ đủ cả hai.
 * Khách đã ghép hồ sơ hội viên thì đồng bộ điểm + tham dự ngay.
 */
export async function ghiCheckin(
  khachId: string,
  phien: Phien1010,
  boi: BoiAi
): Promise<KetQuaGhi | null> {
  const khach = await prisma.khachMoi1010.findUnique({ where: { id: khachId } });
  if (!khach) return null;

  const now = new Date();
  const lanTruoc = lucCheckin(khach, phien);
  // Đến dự thật (từ ngày sự kiện) mà chưa từng xác nhận thì coi như xác
  // nhận luôn. Lượt check-in TRƯỚC ngày sự kiện không được đổi trạng thái —
  // khách "đã xác nhận" hiện tên công khai trên landing.
  const tinhXacNhan = now >= MOC_1010;
  await prisma.khachMoi1010.update({
    where: { id: khachId },
    data: {
      ...datCot(phien, now),
      ...(tinhXacNhan
        ? { trangThai: "XAC_NHAN", xacNhanLuc: khach.xacNhanLuc ?? now }
        : {}),
    },
  });
  await prisma.luotCheckin1010.create({
    data: {
      khachId,
      phien,
      luc: now,
      cach: boi.cach,
      nguoi: boi.nguoi.id === NGUOI_TU_DONG.id ? null : boi.nguoi.ten,
    },
  });

  const memberId = await tuGhepKhach(khach);
  const diem = memberId
    ? await dongBoDiemHoiVien(memberId, { ...boi, phien })
    : null;
  return { moi: !lanTruoc, luc: now, lanTruoc, memberId, diem };
}

/** Huỷ check-in một phiên (bấm nhầm) — điểm của phiên đó tự rút theo.
 *  Lịch sử giữ lại, thêm một dòng "HUY" để biết ai huỷ lúc nào. */
export async function huyCheckin(
  khachId: string,
  phien: Phien1010,
  nguoi?: string
): Promise<{ daHuy: boolean; memberId: string | null; diem: KetQuaDongBo | null } | null> {
  const khach = await prisma.khachMoi1010.findUnique({
    where: { id: khachId },
    select: { id: true, memberId: true },
  });
  if (!khach) return null;
  const kq = await prisma.khachMoi1010.updateMany({
    where: { id: khachId, NOT: datCot(phien, null) },
    data: datCot(phien, null),
  });
  if (kq.count === 1) {
    await prisma.luotCheckin1010.create({
      data: { khachId, phien, cach: "HUY", nguoi: nguoi ?? null },
    });
  }
  const diem = coHoSo(khach.memberId)
    ? await dongBoDiemHoiVien(khach.memberId)
    : null;
  return { daHuy: kq.count === 1, memberId: khach.memberId, diem };
}

/** Phiên có nằm trong SUẤT MỜI của khách không (null = mời đủ ba phiên). */
export function trongSuatMoi(phienDuocMoi: string | null, phien: Phien1010): boolean {
  if (!phienDuocMoi) return true;
  return phienDuocMoi.split(",").filter(Boolean).includes(MA_SUAT[phien]);
}

// ───────────────── Hội viên đến cửa bằng thẻ hội viên ─────────────────

/**
 * Lễ tân quét THẺ HỘI VIÊN (mã HV) thay vì thư mời: tìm dòng khách đã ghép
 * với hội viên đó; chưa có thì dò ngược dòng chưa ghép trùng SĐT / tên;
 * vẫn không có và `taoNeuThieu` thì thêm hội viên vào danh sách (nhóm Hội
 * viên) để quân số tại cửa không hụt.
 */
export async function khachCuaHoiVien(
  code: string,
  taoNeuThieu: boolean
): Promise<
  | { loi: "KHONG_CO_HOI_VIEN" }
  | { loi?: undefined; hoiVien: HoiVienGon; khachId: string | null; vuaThem: boolean }
> {
  const hv = await prisma.member.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      name: true,
      phone: true,
      company: true,
      active: true,
      salutation: true,
      position: true,
    },
  });
  if (!hv || !hv.active) return { loi: "KHONG_CO_HOI_VIEN" };
  const gon: HoiVienGon = {
    id: hv.id,
    code: hv.code,
    name: hv.name,
    phone: hv.phone,
    company: hv.company,
  };

  const daGhep = await prisma.khachMoi1010.findFirst({
    where: { memberId: hv.id },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (daGhep) return { hoiVien: gon, khachId: daGhep.id, vuaThem: false };

  // Dò ngược: dòng chưa ghép mà chính hàm ghép chỉ ra đúng hội viên này
  const cm = await napChiMucHoiVien();
  const chuaGhep = await prisma.khachMoi1010.findMany({
    where: { memberId: null, nhom: { not: "BTC" } },
    select: { id: true, ten: true, phone: true, donVi: true, nhom: true, memberId: true },
  });
  const ungVien = chuaGhep.filter(
    (k) => timHoiVienKhop(k, cm)?.hoiVien.id === hv.id
  );
  if (ungVien.length >= 1) {
    await prisma.khachMoi1010.updateMany({
      where: { id: { in: ungVien.map((k) => k.id) }, memberId: null },
      data: { memberId: hv.id },
    });
    return { hoiVien: gon, khachId: ungVien[0].id, vuaThem: false };
  }

  if (!taoNeuThieu) return { hoiVien: gon, khachId: null, vuaThem: false };
  const moi = await prisma.khachMoi1010.create({
    data: {
      ma: await maThuMoiChuaTrung(),
      ten: hv.name,
      danhXung: hv.salutation || null,
      chucDanh: hv.position || null,
      donVi: hv.company || null,
      phone: hv.phone || null,
      nhom: "HOI_VIEN",
      memberId: hv.id,
      ghiChuBTC: "Tự thêm khi lễ tân quét thẻ hội viên tại cửa",
    },
    select: { id: true },
  });
  return { hoiVien: gon, khachId: moi.id, vuaThem: true };
}

// ───────────────────── Ghép hàng loạt + tính lại ─────────────────────

export type KetQuaDongBoTatCa = {
  tongKhach: number;
  daGhep: number;
  moiGhep: number;
  /** Khách nhóm Chợ Lớn chưa ghép được hồ sơ — cần BTC ghép tay */
  chuaGhepChoLon: string[];
  soHoiVienCoDiem: number;
  tongDiem: number;
};

/**
 * Ghép mọi khách chưa có hồ sơ hội viên rồi tính lại điểm cho tất cả —
 * nút "Ghép hội viên & tính lại điểm" ở quản trị, cũng chạy sau khi đổi
 * quy tắc điểm. An toàn khi bấm nhiều lần.
 */
export async function dongBoTatCa1010(): Promise<KetQuaDongBoTatCa> {
  const cm = await napChiMucHoiVien();
  const khach = await prisma.khachMoi1010.findMany({
    select: { id: true, ten: true, phone: true, donVi: true, nhom: true, memberId: true },
  });
  let moiGhep = 0;
  for (const k of khach) {
    if (k.memberId || k.nhom === "BTC") continue;
    const khop = timHoiVienKhop(k, cm);
    if (!khop) continue;
    const r = await prisma.khachMoi1010.updateMany({
      where: { id: k.id, memberId: null },
      data: { memberId: khop.hoiVien.id },
    });
    if (r.count === 1) {
      k.memberId = khop.hoiVien.id;
      moiGhep++;
    }
  }

  // Tính lại cho mọi hội viên đang được ghép + mọi hội viên còn dòng điểm
  // 10/10 (người vừa bị bỏ ghép phải được rút điểm)
  const conDiem = await prisma.diemHoatDong.findMany({
    where: { nguon: { startsWith: TIEN_TO_DIEM_1010 } },
    select: { nguon: true },
  });
  const ids = new Set<string>();
  for (const k of khach) if (coHoSo(k.memberId)) ids.add(k.memberId);
  for (const d of conDiem) {
    const id = d.nguon?.slice(TIEN_TO_DIEM_1010.length).split(":")[0];
    if (id) ids.add(id);
  }
  const q = await docQuyTacDiem();
  for (const id of ids) await dongBoDiemHoiVien(id, undefined, q);

  const sau = await prisma.diemHoatDong.groupBy({
    by: ["memberId"],
    where: { nguon: { startsWith: TIEN_TO_DIEM_1010 } },
    _sum: { diem: true },
  });
  return {
    tongKhach: khach.length,
    daGhep: khach.filter((k) => coHoSo(k.memberId)).length,
    moiGhep,
    chuaGhepChoLon: khach
      .filter((k) => !k.memberId && laNhomChoLon(k.nhom))
      .map((k) => k.ten),
    soHoiVienCoDiem: sau.length,
    tongDiem: sau.reduce((a, x) => a + (x._sum.diem ?? 0), 0),
  };
}

/**
 * Xoá các lượt check-in ghi TRƯỚC ngày sự kiện (đều là bấm thử) rồi tính
 * lại điểm — để quân số ngày 10/10 bắt đầu từ 0. Không đụng lượt ghi từ
 * 00:00 ngày 10.10 trở đi.
 */
export async function xoaCheckinThu(): Promise<number> {
  const truoc = { lt: MOC_1010 };
  const a = await prisma.khachMoi1010.updateMany({
    where: { checkinLuc: truoc },
    data: { checkinLuc: null },
  });
  const b = await prisma.khachMoi1010.updateMany({
    where: { checkinLeLuc: truoc },
    data: { checkinLeLuc: null },
  });
  const c = await prisma.khachMoi1010.updateMany({
    where: { checkinGalaLuc: truoc },
    data: { checkinGalaLuc: null },
  });
  await dongBoTatCa1010();
  return a.count + b.count + c.count;
}

export type ThongKeCheckin = {
  /** Số lượt check-in ghi trước ngày sự kiện (bấm thử còn sót) */
  luotThu: number;
  daGhep: number;
  chuaGhepChoLon: number;
  /** Hội viên Chợ Lớn có mặt ít nhất một phiên (lượt hợp lệ) */
  hoiVienCoMat: number;
  /** Khách ngoài Chi hội có mặt ít nhất một phiên (không tính ê-kíp BTC) */
  khachNgoaiCoMat: number;
  soHoiVienCoDiem: number;
  tongDiem: number;
  /** Mỗi người phụ trách mời: đã mời bao nhiêu, bao nhiêu khách có mặt */
  theoPhuTrach: { ten: string; moi: number; coMat: number }[];
};

export async function thongKeCheckin1010(): Promise<ThongKeCheckin> {
  const [khach, diem, q] = await Promise.all([
    prisma.khachMoi1010.findMany({
      select: {
        nhom: true,
        memberId: true,
        ghiChuBTC: true,
        checkinLuc: true,
        checkinLeLuc: true,
        checkinGalaLuc: true,
      },
    }),
    prisma.diemHoatDong.groupBy({
      by: ["memberId"],
      where: { nguon: { startsWith: TIEN_TO_DIEM_1010 } },
      _sum: { diem: true },
    }),
    docQuyTacDiem(),
  ]);
  const hopLe = (d: Date | null) => !!d && (q.dienTap || d >= MOC_1010);

  let luotThu = 0;
  const hv = new Set<string>();
  let khachNgoai = 0;
  const pt = new Map<string, { moi: number; coMat: number }>();
  for (const k of khach) {
    for (const d of [k.checkinLuc, k.checkinLeLuc, k.checkinGalaLuc]) {
      if (d && d < MOC_1010) luotThu++;
    }
    const den =
      hopLe(k.checkinLuc) || hopLe(k.checkinLeLuc) || hopLe(k.checkinGalaLuc);
    if (den && coHoSo(k.memberId)) hv.add(k.memberId);
    if (den && !coHoSo(k.memberId) && k.nhom !== "BTC") khachNgoai++;
    if (k.nhom !== "BTC") {
      const ten = phuTrachCua(k.ghiChuBTC) ?? "(chưa ghi người phụ trách)";
      const o = pt.get(ten) ?? { moi: 0, coMat: 0 };
      o.moi++;
      if (den) o.coMat++;
      pt.set(ten, o);
    }
  }
  return {
    luotThu,
    daGhep: khach.filter((k) => coHoSo(k.memberId)).length,
    chuaGhepChoLon: khach.filter((k) => !k.memberId && laNhomChoLon(k.nhom)).length,
    hoiVienCoMat: hv.size,
    khachNgoaiCoMat: khachNgoai,
    soHoiVienCoDiem: diem.length,
    tongDiem: diem.reduce((a, x) => a + (x._sum.diem ?? 0), 0),
    theoPhuTrach: [...pt.entries()]
      .map(([ten, o]) => ({ ten, ...o }))
      .sort((a, b) => b.coMat - a.coMat || b.moi - a.moi),
  };
}
