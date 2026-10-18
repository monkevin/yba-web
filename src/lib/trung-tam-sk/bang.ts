/**
 * TRUNG TÂM SỰ KIỆN — cấu hình các bảng sửa trực tiếp (khách mời, công việc,
 * kịch bản, thu chi, hậu cần, Ban tổ chức, nhà tài trợ…).
 *
 * Một cấu hình dùng cho CẢ HAI phía: API `/api/quan-tri/su-kien/bang/[bang]`
 * chỉ nhận đúng các trường khai ở đây (danh sách trắng) và ép kiểu bằng
 * `epKieu`; component `BangDuLieu` dựng cột, ô sửa, bộ lọc từ cùng cấu hình.
 *
 * File này được client component import → KHÔNG import prisma / auth.
 */

import { normalizeSearch } from "@/lib/search";
import { TRANG_THAI_TAI_TRO } from "@/lib/tai-tro";

export type Tong = "slate" | "blue" | "green" | "amber" | "red" | "violet" | "navy";

export const LOP_TONG: Record<Tong, string> = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-sky-100 text-sky-800",
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-do-100 text-do-700",
  violet: "bg-violet-100 text-violet-800",
  navy: "bg-navy-100 text-navy-800",
};

export type LuaChon = { value: string; label: string; tong?: Tong };

export type KieuTruong =
  | "chu"
  | "doan"
  | "so"
  | "tien"
  | "ngay"
  | "ngayGio"
  | "chon"
  | "co";

export type Truong = {
  label: string;
  kieu: KieuTruong;
  luaChon?: LuaChon[];
  rong?: number;
  /** Tên cột khác khi dán từ Excel */
  tenKhac?: string[];
};

export type QuyenBang = "QUAN_LY" | "TAI_CHINH";

export type CauHinhBang = {
  ten: string;
  /** Bảng con của: sk = SkSuKien, event = Event (bảng cũ dùng lại), taiTro = TaiTroSuKien */
  cha: "sk" | "event" | "taiTro";
  /** Trường bắt buộc, dùng làm tên dòng */
  tieuDe: string;
  quyen: QuyenBang;
  truong: Record<string, Truong>;
  /** Có cột memberId gán bằng ô chọn hội viên */
  coHoiVien?: boolean;
};

// ─────────────────────────── lựa chọn dùng chung ───────────────────────────

export const TRANG_THAI_VIEC: LuaChon[] = [
  { value: "CHUA", label: "Chưa làm", tong: "slate" },
  { value: "DANG", label: "Đang làm", tong: "blue" },
  { value: "VUONG", label: "Vướng", tong: "red" },
  { value: "XONG", label: "Xong", tong: "green" },
];

export const UU_TIEN: LuaChon[] = [
  { value: "P0", label: "P0 · Gấp", tong: "red" },
  { value: "P1", label: "P1 · Cao", tong: "amber" },
  { value: "P2", label: "P2 · Thường", tong: "slate" },
];

export const LOAI_VIEC: LuaChon[] = [
  { value: "VIEC", label: "Việc chuẩn bị" },
  { value: "CHECKLIST", label: "Checklist ngày D", tong: "violet" },
];

export const MOI: LuaChon[] = [
  { value: "CHUA_MOI", label: "Chưa mời", tong: "slate" },
  { value: "DA_GUI", label: "Đã gửi thư mời", tong: "blue" },
  { value: "DA_GOI", label: "Đã gọi xác nhận", tong: "green" },
  { value: "TU_CHOI", label: "Từ chối", tong: "red" },
];

export const XAC_NHAN: LuaChon[] = [
  { value: "CHO", label: "Chờ phản hồi", tong: "slate" },
  { value: "CO", label: "Tham dự", tong: "green" },
  { value: "KHONG", label: "Không dự", tong: "red" },
];

export const TRANG_THAI_THU_CHI: LuaChon[] = [
  { value: "DU_KIEN", label: "Dự kiến", tong: "slate" },
  { value: "CHUA_TT", label: "Chưa thanh toán", tong: "amber" },
  { value: "DA_TT", label: "Đã thanh toán", tong: "green" },
];

export const LOAI_THU_CHI: LuaChon[] = [
  { value: "CHI", label: "Chi", tong: "red" },
  { value: "THU", label: "Thu", tong: "green" },
];

export const TRANG_THAI_HAU_CAN: LuaChon[] = [
  { value: "CHUA", label: "Chưa chuẩn bị", tong: "slate" },
  { value: "DANG", label: "Đang chuẩn bị", tong: "blue" },
  { value: "XONG", label: "Đã có", tong: "green" },
];

/** Vai trò trong BanToChuc — giữ đúng 4 mã cũ để điểm cống hiến không đổi */
export const VAI_TRO_BTC: LuaChon[] = [
  { value: "BAN_CHI_DAO", label: "Ban chỉ đạo", tong: "violet" },
  { value: "TRUONG_BAN", label: "Trưởng ban", tong: "navy" },
  { value: "PHO_BAN", label: "Phó ban", tong: "blue" },
  { value: "THANH_VIEN", label: "Thành viên", tong: "slate" },
];

const TONG_TAI_TRO: Record<string, Tong> = {
  "Đang vận động": "slate",
  "Cam kết": "blue",
  "Còn thiếu": "amber",
  "Hoàn tất": "green",
  Huỷ: "red",
};
export const TT_TAI_TRO: LuaChon[] = TRANG_THAI_TAI_TRO.map((t) => ({
  value: t,
  label: t,
  tong: TONG_TAI_TRO[t],
}));

export const BAC_TAI_TRO_CHON: LuaChon[] = [
  "Nhà tài trợ chính",
  "Kim cương",
  "Vàng",
  "Bạc",
  "Đồng",
  "Đồng hành",
].map((t) => ({ value: t, label: t }));

export const TRANG_THAI_SU_KIEN: LuaChon[] = [
  { value: "KE_HOACH", label: "Lên kế hoạch", tong: "slate" },
  { value: "CHUAN_BI", label: "Đang chuẩn bị", tong: "blue" },
  { value: "DANG_DIEN_RA", label: "Đang diễn ra", tong: "red" },
  { value: "DA_XONG", label: "Đã xong", tong: "green" },
  { value: "HUY", label: "Huỷ", tong: "slate" },
];

// ─────────────────────────────── các bảng ───────────────────────────────

export const BANG: Record<string, CauHinhBang> = {
  phien: {
    ten: "Phiên",
    cha: "sk",
    tieuDe: "ten",
    quyen: "QUAN_LY",
    truong: {
      ten: { label: "Tên phiên", kieu: "chu", rong: 180 },
      batDau: { label: "Bắt đầu", kieu: "ngayGio", rong: 160 },
      diaDiem: { label: "Địa điểm", kieu: "chu", rong: 200 },
      sucChua: { label: "Sức chứa", kieu: "so", rong: 90 },
    },
  },
  khach: {
    ten: "Khách mời",
    cha: "sk",
    tieuDe: "ten",
    quyen: "QUAN_LY",
    coHoiVien: true,
    truong: {
      danhXung: { label: "Danh xưng", kieu: "chu", rong: 80, tenKhac: ["Xưng hô"] },
      ten: { label: "Họ và tên", kieu: "chu", rong: 180, tenKhac: ["Họ tên", "Tên", "Khách mời"] },
      chucDanh: { label: "Chức danh", kieu: "doan", rong: 200, tenKhac: ["Chức vụ"] },
      donVi: { label: "Đơn vị", kieu: "doan", rong: 220, tenKhac: ["Doanh nghiệp", "Công ty"] },
      phone: { label: "SĐT", kieu: "chu", rong: 120, tenKhac: ["Số điện thoại", "Điện thoại"] },
      email: { label: "Email", kieu: "chu", rong: 160 },
      nhom: { label: "Nhóm khách", kieu: "chu", rong: 140, tenKhac: ["Nhóm", "Phân loại"] },
      nguoiMoi: { label: "Người mời", kieu: "chu", rong: 130, tenKhac: ["Người phụ trách"] },
      moi: { label: "Tình trạng mời", kieu: "chon", luaChon: MOI, rong: 140 },
      vip: { label: "VIP", kieu: "co", rong: 60 },
      ban: { label: "Bàn", kieu: "chu", rong: 70, tenKhac: ["Số bàn"] },
      ghiChu: { label: "Ghi chú", kieu: "doan", rong: 200 },
    },
  },
  btc: {
    ten: "Ban tổ chức",
    cha: "event",
    tieuDe: "hoTen",
    quyen: "QUAN_LY",
    coHoiVien: true,
    truong: {
      ban: { label: "Ban", kieu: "chu", rong: 170 },
      hoTen: { label: "Họ và tên", kieu: "chu", rong: 170, tenKhac: ["Họ tên", "Tên"] },
      vaiTro: { label: "Vai trò", kieu: "chon", luaChon: VAI_TRO_BTC, rong: 120 },
      nhiemVu: { label: "Nhiệm vụ", kieu: "doan", rong: 240 },
      soDienThoai: { label: "SĐT liên hệ", kieu: "chu", rong: 120, tenKhac: ["SĐT", "Số điện thoại"] },
      caTruc: { label: "Ca trực / vị trí", kieu: "chu", rong: 140 },
      ghiChu: { label: "Ghi chú", kieu: "doan", rong: 180 },
    },
  },
  viec: {
    ten: "Công việc",
    cha: "sk",
    tieuDe: "tieuDe",
    quyen: "QUAN_LY",
    truong: {
      ban: { label: "Ban", kieu: "chu", rong: 160 },
      tieuDe: { label: "Công việc", kieu: "doan", rong: 280, tenKhac: ["Việc", "Hạng mục"] },
      nguoiLam: { label: "Người làm", kieu: "chu", rong: 130, tenKhac: ["Phụ trách"] },
      hanChot: { label: "Hạn chót", kieu: "ngay", rong: 110, tenKhac: ["Deadline", "Hạn"] },
      uuTien: { label: "Ưu tiên", kieu: "chon", luaChon: UU_TIEN, rong: 110 },
      trangThai: { label: "Trạng thái", kieu: "chon", luaChon: TRANG_THAI_VIEC, rong: 110 },
      loai: { label: "Loại", kieu: "chon", luaChon: LOAI_VIEC, rong: 130 },
      ghiChu: { label: "Ghi chú", kieu: "doan", rong: 200 },
    },
  },
  kichban: {
    ten: "Kịch bản",
    cha: "sk",
    tieuDe: "noiDung",
    quyen: "QUAN_LY",
    truong: {
      phienId: { label: "Phiên", kieu: "chon", rong: 120 },
      gio: { label: "Giờ", kieu: "chu", rong: 70 },
      thoiLuong: { label: "Phút", kieu: "so", rong: 60 },
      noiDung: { label: "Nội dung", kieu: "doan", rong: 300, tenKhac: ["Hạng mục", "Tiết mục"] },
      phuTrach: { label: "Phụ trách", kieu: "chu", rong: 140 },
      kyThuat: { label: "Âm thanh / LED", kieu: "doan", rong: 180 },
      noiBo: { label: "Nội bộ BTC", kieu: "co", rong: 80 },
      ghiChu: { label: "Ghi chú", kieu: "doan", rong: 180 },
    },
  },
  haucan: {
    ten: "Hậu cần",
    cha: "sk",
    tieuDe: "ten",
    quyen: "QUAN_LY",
    truong: {
      nhom: { label: "Nhóm", kieu: "chu", rong: 120 },
      ten: { label: "Hạng mục", kieu: "doan", rong: 240, tenKhac: ["Vật phẩm", "Tên"] },
      soLuong: { label: "SL", kieu: "so", rong: 60, tenKhac: ["Số lượng"] },
      donVi: { label: "ĐVT", kieu: "chu", rong: 70, tenKhac: ["Đơn vị tính"] },
      phuTrach: { label: "Phụ trách", kieu: "chu", rong: 150 },
      hanChot: { label: "Hạn", kieu: "ngay", rong: 110 },
      trangThai: { label: "Trạng thái", kieu: "chon", luaChon: TRANG_THAI_HAU_CAN, rong: 130 },
      ghiChu: { label: "Ghi chú", kieu: "doan", rong: 200 },
    },
  },
  thuchi: {
    ten: "Thu chi",
    cha: "sk",
    tieuDe: "hangMuc",
    quyen: "TAI_CHINH",
    truong: {
      loai: { label: "Thu / Chi", kieu: "chon", luaChon: LOAI_THU_CHI, rong: 80 },
      hangMuc: { label: "Hạng mục", kieu: "doan", rong: 240, tenKhac: ["Nội dung", "Khoản"] },
      ban: { label: "Ban", kieu: "chu", rong: 140 },
      duTru: { label: "Dự trù", kieu: "tien", rong: 120, tenKhac: ["Dự toán", "Kế hoạch"] },
      thucTe: { label: "Thực tế", kieu: "tien", rong: 120, tenKhac: ["Thực chi", "Thực thu"] },
      trangThai: { label: "Trạng thái", kieu: "chon", luaChon: TRANG_THAI_THU_CHI, rong: 130 },
      phuTrach: { label: "Phụ trách", kieu: "chu", rong: 130 },
      ngay: { label: "Ngày", kieu: "ngay", rong: 110 },
      ghiChu: { label: "Ghi chú", kieu: "doan", rong: 200 },
    },
  },
  taitro: {
    ten: "Nhà tài trợ",
    cha: "event",
    tieuDe: "nhaTaiTro",
    quyen: "TAI_CHINH",
    coHoiVien: true,
    truong: {
      nhaTaiTro: { label: "Nhà tài trợ", kieu: "chu", rong: 220, tenKhac: ["Doanh nghiệp", "Đơn vị"] },
      mucTaiTro: { label: "Hạng", kieu: "chon", luaChon: BAC_TAI_TRO_CHON, rong: 110, tenKhac: ["Mức tài trợ"] },
      hienKim: { label: "Tiền mặt cam kết", kieu: "tien", rong: 130, tenKhac: ["Hiện kim"] },
      hienVat: { label: "Hiện vật", kieu: "doan", rong: 180 },
      giaTri: { label: "Tổng giá trị", kieu: "tien", rong: 130, tenKhac: ["Giá trị"] },
      daThu: { label: "Đã thu", kieu: "tien", rong: 120 },
      ngayThu: { label: "Ngày thu", kieu: "ngay", rong: 110 },
      trangThai: { label: "Trạng thái", kieu: "chon", luaChon: TT_TAI_TRO, rong: 120 },
      nguoiVanDong: { label: "Người vận động", kieu: "chu", rong: 140 },
      lienHe: { label: "Liên hệ", kieu: "chu", rong: 160 },
      ghiChu: { label: "Ghi chú", kieu: "doan", rong: 180 },
    },
  },
  hangtaitro: {
    ten: "Hạng tài trợ",
    cha: "sk",
    tieuDe: "ten",
    quyen: "TAI_CHINH",
    truong: {
      ten: { label: "Hạng", kieu: "chu", rong: 160 },
      mucTien: { label: "Mức tài trợ", kieu: "tien", rong: 130, tenKhac: ["Số tiền", "Mức tiền"] },
      soSuat: { label: "Số suất", kieu: "so", rong: 80 },
      quyenLoi: { label: "Quyền lợi (mỗi dòng một mục)", kieu: "doan", rong: 360 },
    },
  },
  giai: {
    ten: "Giải bốc thăm",
    cha: "sk",
    tieuDe: "ten",
    quyen: "QUAN_LY",
    truong: {
      ten: { label: "Giải", kieu: "chu", rong: 160 },
      phanQua: { label: "Phần quà", kieu: "doan", rong: 220 },
      nhaTaiTro: { label: "Nhà tài trợ giải", kieu: "chu", rong: 180 },
      soLuong: { label: "Số lượng", kieu: "so", rong: 80 },
    },
  },
  cauhoi: {
    ten: "Câu hỏi",
    cha: "sk",
    tieuDe: "noiDung",
    quyen: "QUAN_LY",
    truong: {
      noiDung: { label: "Câu hỏi", kieu: "doan", rong: 360 },
      ten: { label: "Người hỏi", kieu: "chu", rong: 140 },
      trangThai: { label: "Trạng thái", kieu: "chon", luaChon: [], rong: 120 },
    },
  },
  tailieu: {
    ten: "Link quan trọng",
    cha: "sk",
    tieuDe: "ten",
    quyen: "QUAN_LY",
    truong: {
      ten: { label: "Tên", kieu: "chu", rong: 220 },
      url: { label: "Link", kieu: "chu", rong: 260 },
      nhom: { label: "Nhóm", kieu: "chu", rong: 140 },
      ghiChu: { label: "Ghi chú", kieu: "doan", rong: 200 },
    },
  },
  baidang: {
    ten: "Bài đã đăng",
    cha: "sk",
    tieuDe: "tieuDe",
    quyen: "QUAN_LY",
    truong: {
      ngay: { label: "Ngày đăng", kieu: "ngay", rong: 110 },
      kenh: { label: "Kênh", kieu: "chu", rong: 120 },
      tieuDe: { label: "Tiêu đề", kieu: "doan", rong: 260 },
      link: { label: "Link", kieu: "chu", rong: 140 },
      reach: { label: "Reach", kieu: "so", rong: 90 },
      tuongTac: { label: "Tương tác", kieu: "so", rong: 90 },
      ghiChu: { label: "Ghi chú", kieu: "doan", rong: 180 },
    },
  },
  ncc: {
    ten: "Nhà cung cấp",
    cha: "sk",
    tieuDe: "hangMuc",
    quyen: "QUAN_LY",
    truong: {
      hangMuc: { label: "Hạng mục", kieu: "chu", rong: 170 },
      ten: { label: "Nhà cung cấp", kieu: "chu", rong: 200 },
      lienHe: { label: "Liên hệ", kieu: "chu", rong: 160 },
      giaTri: { label: "Giá trị HĐ", kieu: "tien", rong: 120 },
      daCoc: { label: "Đã cọc", kieu: "tien", rong: 110 },
      trangThai: { label: "Trạng thái", kieu: "chon", luaChon: [], rong: 130 },
      ghiChu: { label: "Ghi chú", kieu: "doan", rong: 200 },
    },
  },
  ruiro: {
    ten: "Rủi ro",
    cha: "sk",
    tieuDe: "ruiRo",
    quyen: "QUAN_LY",
    truong: {
      ruiRo: { label: "Rủi ro", kieu: "doan", rong: 240 },
      khaNang: { label: "Khả năng (1–3)", kieu: "so", rong: 90 },
      tacDong: { label: "Tác động (1–3)", kieu: "so", rong: 90 },
      phuongAn: { label: "Phương án dự phòng", kieu: "doan", rong: 280 },
      nguoiXuLy: { label: "Người xử lý", kieu: "chu", rong: 130 },
      trangThai: { label: "Trạng thái", kieu: "chon", luaChon: [], rong: 110 },
    },
  },
  quyenloi: {
    ten: "Quyền lợi",
    cha: "taiTro",
    tieuDe: "noiDung",
    quyen: "TAI_CHINH",
    truong: {
      noiDung: { label: "Quyền lợi", kieu: "doan", rong: 280 },
      xong: { label: "Đã thực hiện", kieu: "co", rong: 100 },
      ghiChu: { label: "Ghi chú / bằng chứng", kieu: "doan", rong: 220 },
    },
  },
};

// ─────────────────────────────── hàm thuần ───────────────────────────────

export const chuan = (s: string) => normalizeSearch(s ?? "");

export function nhanLuaChon(ds: LuaChon[] | undefined, v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  return ds?.find((o) => o.value === v)?.label ?? String(v);
}

export function tongLuaChon(ds: LuaChon[] | undefined, v: unknown): Tong {
  return ds?.find((o) => o.value === v)?.tong ?? "slate";
}

const MUI_GIO = "Asia/Ho_Chi_Minh";

/** "YYYY-MM-DD" theo giờ Việt Nam (máy chủ chạy UTC) */
export function ngayNhap(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: MUI_GIO }).format(date);
}

/** "YYYY-MM-DDTHH:mm" theo giờ Việt Nam, cho <input type="datetime-local"> */
export function ngayGioNhap(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: MUI_GIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
}

export function ngayVN(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: MUI_GIO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function gioVN(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: MUI_GIO,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

/** Ngày (không giờ) lưu lúc 12:00 giờ VN — hiện đúng ngày dù đọc theo UTC hay giờ VN */
export function tuNgayNhap(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00+07:00`);
  // Kiểu Việt Nam dd/mm/yyyy (dán từ Excel)
  const v = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s.trim());
  if (v) {
    const dd = v[1].padStart(2, "0");
    const mm = v[2].padStart(2, "0");
    return new Date(`${v[3]}-${mm}-${dd}T12:00:00+07:00`);
  }
  return null;
}

export function tuNgayGioNhap(s: string): Date | null {
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/.exec(s.trim());
  if (m) return new Date(`${m[1]}T${m[2]}:${m[3]}:00+07:00`);
  return tuNgayNhap(s);
}

export function soVN(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "";
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n);
}

/** Đọc số kiểu Việt Nam: "1.500.000", "1,5tr", "2 triệu", "500k" */
export function docSo(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = chuan(String(v ?? "")).replace(/\s+/g, "");
  if (!s) return null;
  let heSo = 1;
  let t = s;
  if (/(ty|ti)$/.test(t)) {
    heSo = 1e9;
    t = t.replace(/(ty|ti)$/, "");
  } else if (/(tr|trieu)$/.test(t)) {
    heSo = 1e6;
    t = t.replace(/(tr|trieu)$/, "");
  } else if (/(k|nghin|ngan)$/.test(t)) {
    heSo = 1e3;
    t = t.replace(/(k|nghin|ngan)$/, "");
  }
  t = t.replace(/[^0-9.,-]/g, "");
  if (!/\d/.test(t)) return null;
  if (heSo > 1) t = t.replace(",", ".");
  else t = t.replace(/[.,](?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * heSo) : null;
}

/**
 * Ép giá trị gửi lên về đúng kiểu của trường. Trả `undefined` = giá trị không
 * hợp lệ (bỏ qua), `null` = xoá trống.
 */
export function epKieu(t: Truong, v: unknown): unknown {
  if (v === undefined) return undefined;
  switch (t.kieu) {
    case "co":
      return v === true || v === "true" || v === 1 || v === "1" || chuan(String(v)) === "co" || String(v).toLowerCase() === "x";
    case "so": {
      if (v === null || v === "") return null;
      const n = docSo(v);
      return n === null ? undefined : Math.round(n);
    }
    case "tien": {
      if (v === null || v === "") return 0;
      const n = docSo(v);
      return n === null ? undefined : n;
    }
    case "ngay": {
      if (v === null || v === "") return null;
      if (v instanceof Date) return v;
      return tuNgayNhap(String(v)) ?? undefined;
    }
    case "ngayGio": {
      if (v === null || v === "") return null;
      if (v instanceof Date) return v;
      return tuNgayGioNhap(String(v)) ?? undefined;
    }
    case "chon": {
      if (v === null || v === "") return null;
      const s = String(v).trim();
      if (!t.luaChon) return s.slice(0, 200);
      const khop =
        t.luaChon.find((o) => o.value === s) ??
        t.luaChon.find((o) => chuan(o.label) === chuan(s) || chuan(o.value) === chuan(s));
      return khop ? khop.value : undefined;
    }
    case "doan":
      return v === null ? null : String(v).slice(0, 4000).trim() || null;
    default:
      return v === null ? null : String(v).slice(0, 300).trim() || null;
  }
}

/**
 * Quyền lợi chuẩn theo hạng — tự sinh danh sách nghiệm thu khi thêm nhà tài
 * trợ có hạng (sửa / thêm / xoá từng dòng sau đó tuỳ hợp đồng).
 */
export const QUYEN_LOI_THEO_HANG: Record<string, string[]> = {
  "Nhà tài trợ chính": [
    "Đồng tổ chức: tên / logo đứng cùng Chi hội trên mọi ấn phẩm",
    "Logo lớn nhất, vị trí trung tâm backdrop, LED, thư mời, standee",
    "Phát biểu chào mừng + trao quà trên sân khấu",
    "Clip giới thiệu doanh nghiệp 90 giây trên LED",
    "Booth trưng bày vị trí đẹp nhất",
    "Bài giới thiệu riêng trên fanpage + website Chi hội + báo chí",
    "MC xướng tên nhiều lần trong chương trình",
    "Vinh danh + kỷ niệm chương đặc biệt",
    "6 suất tham dự khu VIP",
    "Ảnh bằng chứng quyền lợi gửi kèm báo cáo NTT",
  ],
  "Kim cương": [
    "Logo vị trí trung tâm trên backdrop, LED, thư mời, standee",
    "Phát biểu / trao quà trên sân khấu",
    "Clip giới thiệu doanh nghiệp 60 giây trên LED",
    "Booth trưng bày sản phẩm",
    "Bài giới thiệu riêng trên fanpage + website Chi hội",
    "MC xướng tên trong chương trình",
    "Vinh danh + kỷ niệm chương",
    "4 suất tham dự khu VIP",
    "Ảnh bằng chứng quyền lợi gửi kèm báo cáo NTT",
  ],
  Vàng: [
    "Logo trên backdrop, LED, thư mời",
    "Clip giới thiệu 30 giây trên LED",
    "Booth trưng bày sản phẩm",
    "Bài cảm ơn nhà tài trợ trên fanpage",
    "MC xướng tên trong chương trình",
    "Vinh danh + kỷ niệm chương",
    "2 suất tham dự khu VIP",
  ],
  Bạc: [
    "Logo trên backdrop, LED",
    "Bài cảm ơn nhà tài trợ trên fanpage",
    "Vinh danh + kỷ niệm chương",
    "2 suất tham dự",
  ],
  Đồng: ["Logo trên LED", "Vinh danh trên sân khấu", "1 suất tham dự"],
  "Đồng hành": ["Logo trên LED", "Cảm ơn trên fanpage"],
};

export const TRANG_THAI_CAU_HOI: LuaChon[] = [
  { value: "MOI", label: "Chờ duyệt", tong: "slate" },
  { value: "CHIEU", label: "Đang chiếu", tong: "red" },
  { value: "DA_TRA_LOI", label: "Đã trả lời", tong: "green" },
  { value: "AN", label: "Ẩn", tong: "slate" },
];
/** SkKhach.nguon — khách vào danh sách bằng đường nào */
export const NGUON_KHACH: LuaChon[] = [
  { value: "BTC", label: "BTC nhập" },
  { value: "EXCEL", label: "File Excel" },
  { value: "LE_TAN", label: "Lễ tân thêm", tong: "amber" },
  { value: "ONLINE", label: "Đăng ký QR", tong: "blue" },
  { value: "TU_CHECKIN", label: "Vãng lai tự check-in", tong: "amber" },
  { value: "LICH", label: "Lịch hoạt động", tong: "violet" },
];
export const TRANG_THAI_NCC: LuaChon[] = [
  { value: "TIM", label: "Đang tìm", tong: "slate" },
  { value: "BAO_GIA", label: "Đã báo giá", tong: "blue" },
  { value: "DA_CHOT", label: "Đã chốt / cọc", tong: "amber" },
  { value: "DA_TT", label: "Đã thanh toán", tong: "green" },
];
export const TRANG_THAI_RUI_RO: LuaChon[] = [
  { value: "MO", label: "Đang theo dõi", tong: "amber" },
  { value: "DA_XU_LY", label: "Đã xử lý", tong: "green" },
];
BANG.cauhoi.truong.trangThai.luaChon = TRANG_THAI_CAU_HOI;
BANG.ncc.truong.trangThai.luaChon = TRANG_THAI_NCC;
BANG.ruiro.truong.trangThai.luaChon = TRANG_THAI_RUI_RO;

/**
 * Ban → tab phụ trách (thẻ ban ở Ban tổ chức / Công việc dẫn thẳng sang).
 * So khớp theo chữ trong tên ban nên ban tự đặt tên khác vẫn nhận được.
 */
export function tabCuaBan(ten: string): { duong: string; nhan: string } | null {
  const n = chuan(ten);
  if (n.includes("noi dung") || n.includes("mc")) return { duong: "kich-ban", nhan: "Kịch bản" };
  if (n.includes("hau can")) return { duong: "hau-can", nhan: "Hậu cần" };
  if (n.includes("truyen thong") || n.includes("media")) return { duong: "truyen-thong", nhan: "Truyền thông" };
  if (n.includes("tai tro") || n.includes("tai chinh")) return { duong: "tai-tro", nhan: "Tài trợ" };
  if (n.includes("khach") || n.includes("le tan")) return { duong: "khach", nhan: "Khách mời" };
  if (n.includes("ky thuat") || n.includes("hien truong")) return { duong: "ncc-rui-ro", nhan: "NCC & rủi ro" };
  return null;
}


/** Chỉ mở link http(s) — chặn "javascript:" gõ / dán nhầm vào ô link */
export function linkAnToan(url: unknown): string | null {
  const t = typeof url === "string" ? url.trim() : "";
  if (/^https?:\/\//i.test(t)) return t;
  // Dán thiếu giao thức: "drive.google.com/…"
  if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(t)) return `https://${t}`;
  return null;
}
