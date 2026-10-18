import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  chuanSoDienThoai,
  laDauVaoSoDienThoai,
  laSoDienThoaiVN,
} from "@/lib/so-dien-thoai";

/**
 * Lõi đăng nhập web, tách khỏi `api/auth/login/route.ts` để script kiểm thử gọi
 * thẳng được (file route chỉ được export GET/POST…). Không import `@/lib/auth`
 * vì file đó kéo `next/headers`.
 *
 * SỰ THẬT về định danh (đo 15/09/2026): tên đăng nhập hội viên dạng hv0xxx là mã
 * CŨ trước lần đánh lại mã 26/07 — không trùng mã hội viên hiện tại (0/257), nên
 * mã hội viên KHÔNG bao giờ là định danh đăng nhập. Chỉ nhận tên đăng nhập hoặc
 * SĐT đã đăng ký với Chi hội.
 */

/**
 * Băm bcrypt (cost 10 như auth.ts) của một chuỗi ngẫu nhiên không ai biết. So mật
 * khẩu với nó khi không tìm thấy tài khoản để thời gian trả lời như nhau — không
 * dò được tên đăng nhập / SĐT nào có thật bằng cách đo tốc độ.
 */
const HASH_GIA = "$2b$10$7xNMBJGWvvWlhtfHGoUZ2.diJ374bYI/7yf.f99xH5qkL4iGRiuOe";

export type TaiKhoanDangNhap = {
  id: string;
  username: string;
  passwordHash: string;
};

/**
 * Hồ sơ hội viên còn được dùng SĐT để đăng nhập: đang mở VÀ chưa bị Ban Chủ
 * nhiệm đánh dấu rời hội. Dùng chung cho lúc tìm tài khoản và lúc soát SĐT trùng
 * để hai chỗ không lệch nhau (người đã rời hội giữ số cũ thì không được chặn
 * hội viên đang sinh hoạt đăng nhập bằng số đó).
 */
const HOI_VIEN_DUNG_SDT = {
  active: true,
  trangThai: { not: "ROI_HOI" },
} as const;

/**
 * Tìm tài khoản ứng với chữ người dùng gõ. Thứ tự: tên đăng nhập trước; không có
 * mà chữ gõ giống SĐT thì tìm hội viên đang sinh hoạt có SĐT khớp. SĐT phải chỉ
 * ra ĐÚNG MỘT hội viên — trùng hai hồ sơ thì coi như không tìm thấy (không đoán
 * người). Tài khoản bị khoá cũng trả null.
 */
export async function timTaiKhoanDangNhap(
  dinhDanh: string,
): Promise<TaiKhoanDangNhap | null> {
  const raw = String(dinhDanh ?? "").trim();
  if (!raw) return null;

  const theoTen = await prisma.user.findUnique({
    where: { username: raw.toLowerCase() },
    select: { id: true, username: true, passwordHash: true, active: true },
  });
  if (theoTen) {
    return theoTen.active
      ? {
          id: theoTen.id,
          username: theoTen.username,
          passwordHash: theoTen.passwordHash,
        }
      : null;
  }

  if (!laDauVaoSoDienThoai(raw)) return null;
  const so = chuanSoDienThoai(raw);

  // So sánh BẰNG trên số đã chuẩn hoá (mọi đường ghi SĐT đều chuẩn hoá trước khi
  // lưu). take 2 là đủ biết có trùng hay không.
  const hoiVien = await prisma.member.findMany({
    where: { phone: so, ...HOI_VIEN_DUNG_SDT },
    take: 2,
    select: {
      user: {
        select: { id: true, username: true, passwordHash: true, active: true },
      },
    },
  });
  if (hoiVien.length !== 1) return null;
  const u = hoiVien[0].user;
  if (!u || !u.active) return null;
  return { id: u.id, username: u.username, passwordHash: u.passwordHash };
}

/**
 * Tìm tài khoản + so mật khẩu. LUÔN chạy bcrypt đúng một lần (so với hash giả
 * khi không có tài khoản). Trả null cho mọi kiểu thất bại — nơi gọi hiện MỘT
 * thông báo chung.
 */
export async function xacThucDangNhap(
  dinhDanh: string,
  matKhau: string,
): Promise<TaiKhoanDangNhap | null> {
  const tk = await timTaiKhoanDangNhap(dinhDanh);
  const dung = await bcrypt.compare(
    String(matKhau ?? ""),
    tk?.passwordHash ?? HASH_GIA,
  );
  return tk && dung ? tk : null;
}

/** Thông báo chung cho mọi lần đăng nhập thất bại (sai tên, sai SĐT, sai mật khẩu, bị khoá). */
export const LOI_DANG_NHAP =
  "Tên đăng nhập / số điện thoại hoặc mật khẩu không đúng";

// ─── Mật khẩu mới ──────────────────────────────────────────────────────────

/** Mật khẩu đoán được trong vài lần thử — không cho đặt. */
const MAT_KHAU_YEU = new Set([
  "123456",
  "1234567",
  "12345678",
  "123456789",
  "1234567890",
  "87654321",
  "11111111",
  "00000000",
  "66666666",
  "88888888",
  "99999999",
  "12341234",
  "abcd1234",
  "abc12345",
  "password",
  "password1",
  "matkhau",
  "matkhau123",
  "qwerty123",
  "ybacholon",
  "yba123456",
]);

/**
 * Kiểm tra mật khẩu mới (thuần). Trả chuỗi lỗi hoặc null nếu dùng được.
 * `soDienThoai` là SĐT của hội viên — ai đăng nhập cũng xem được SĐT hội viên
 * khác nên không được làm mật khẩu.
 */
export function loiMatKhauMoi(
  matKhau: string,
  {
    tenDangNhap,
    soDienThoai,
    toiThieu = 8,
  }: {
    tenDangNhap?: string;
    soDienThoai?: string | null;
    toiThieu?: number;
  } = {},
): string | null {
  if (matKhau.length < toiThieu)
    return `Mật khẩu mới cần ít nhất ${toiThieu} ký tự`;
  if (matKhau.length > 128) return "Mật khẩu quá dài (tối đa 128 ký tự)";
  if (matKhau !== matKhau.trim()) {
    return "Mật khẩu không được bắt đầu hoặc kết thúc bằng khoảng trắng";
  }
  const thuong = matKhau.toLowerCase();
  if (MAT_KHAU_YEU.has(thuong) || /^(.)\1+$/.test(matKhau)) {
    return "Mật khẩu này quá dễ đoán — chọn mật khẩu khác";
  }
  const ten = (tenDangNhap ?? "").toLowerCase();
  // Tên ngắn (vd "abc") thì chỉ chặn trùng hẳn, tránh chặn oan mật khẩu dài
  if (ten && (thuong === ten || (ten.length >= 4 && thuong.includes(ten)))) {
    return "Mật khẩu không được trùng hoặc chứa tên đăng nhập";
  }
  const so = chuanSoDienThoai(soDienThoai);
  if (
    laSoDienThoaiVN(so) &&
    (matKhau.includes(so) || matKhau.includes(so.slice(1)))
  ) {
    return "Mật khẩu không được chứa số điện thoại";
  }
  return null;
}

// ─── Mã hội viên ───────────────────────────────────────────────────────────

/**
 * Số thứ tự lớn nhất trong các mã dạng HV + chữ số. Bỏ qua mã khác kiểu (KDZ003 —
 * hồ sơ kiểm duyệt Zalo) và so bằng SỐ chứ không theo thứ tự chuỗi ("HV9999" >
 * "HV10000" nếu so chuỗi).
 */
export function soLonNhatMaHoiVien(dsMa: string[]): number {
  let lon = 0;
  for (const ma of dsMa) {
    const m = /^HV(\d+)$/.exec(ma);
    if (m) lon = Math.max(lon, Number(m[1]));
  }
  return lon;
}

export function taoMaHoiVien(so: number): string {
  return `HV${String(so).padStart(4, "0")}`;
}

/**
 * Mã hội viên kế tiếp còn trống. Nếu `canTenDangNhap` thì tìm tiếp tới khi cả mã
 * lẫn tên đăng nhập `hv…` cùng số đều chưa ai dùng (kết nạp tạo tài khoản theo mã).
 */
export async function maHoiVienTiepTheo(
  canTenDangNhap = false,
): Promise<string> {
  // `startsWith` của Prisma SQLite là LIKE không phân biệt hoa thường → lọc lại
  // bằng regex phân biệt hoa thường ở soLonNhatMaHoiVien.
  const ds = await prisma.member.findMany({
    where: { code: { startsWith: "HV" } },
    select: { code: true },
  });
  let so = soLonNhatMaHoiVien(ds.map((d) => d.code)) + 1;
  for (let lan = 0; lan < 50; lan++, so++) {
    const ma = taoMaHoiVien(so);
    const [trungMa, trungTen] = await Promise.all([
      prisma.member.findUnique({ where: { code: ma }, select: { id: true } }),
      canTenDangNhap
        ? prisma.user.findUnique({
            where: { username: ma.toLowerCase() },
            select: { id: true },
          })
        : null,
    ]);
    if (!trungMa && !trungTen) return ma;
  }
  return taoMaHoiVien(so);
}

/**
 * Hội viên ĐANG SINH HOẠT khác đang dùng SĐT này (đã chuẩn hoá). Dùng khi lưu SĐT
 * để giữ SĐT đăng nhập không trùng. Trả null nếu không phải SĐT di động hợp lệ.
 */
export async function hoiVienKhacCungSdt(
  soDienThoai: string | null | undefined,
  boQuaMemberId?: string | null,
): Promise<{ id: string; code: string } | null> {
  const so = chuanSoDienThoai(soDienThoai);
  if (!laSoDienThoaiVN(so)) return null;
  return prisma.member.findFirst({
    where: {
      phone: so,
      ...HOI_VIEN_DUNG_SDT,
      ...(boQuaMemberId ? { id: { not: boQuaMemberId } } : {}),
    },
    select: { id: true, code: true },
  });
}

/**
 * Số hồ sơ hội viên đang sinh hoạt đang giữ SĐT này. Trang Tổng quan dùng để
 * nói cho hội viên biết số của họ có đăng nhập được không — phải đếm theo ĐÚNG
 * điều kiện mà `timTaiKhoanDangNhap` dùng, không thì báo một đằng làm một nẻo.
 */
export async function soHoSoCungSdt(
  soDienThoai: string | null | undefined,
): Promise<number> {
  const so = chuanSoDienThoai(soDienThoai);
  if (!laSoDienThoaiVN(so)) return 0;
  return prisma.member.count({ where: { phone: so, ...HOI_VIEN_DUNG_SDT } });
}

/** Lỗi trùng khoá duy nhất của Prisma (mã hội viên, slug, tên đăng nhập…). */
export function laLoiTrungKhoa(e: unknown): boolean {
  return (e as { code?: string } | null)?.code === "P2002";
}
