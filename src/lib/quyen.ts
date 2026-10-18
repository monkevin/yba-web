/**
 * Danh sách quyền chi tiết cho tài khoản quản trị.
 *
 * File này chỉ chứa hằng số và hàm thuần — được import bởi CẢ client component,
 * nên KHÔNG được import `@/lib/auth` hay `@/lib/prisma` vào đây (xem AGENTS.md).
 *
 * Cách hoạt động (Chủ nhiệm chốt lại 24/09/2026):
 *  - Vai trò ADMIN  = cấp lãnh đạo (Admin / Chủ tịch / Phó Chủ tịch / Thư ký
 *                     Chi hội — phân biệt bằng `User.chucVu`). MẶC ĐỊNH toàn
 *                     quyền; nhưng nếu `permissions` CÓ danh sách thì chỉ còn
 *                     đúng các quyền đó ("muốn xem ít thôi").
 *  - Vai trò STAFF  = Ban Điều hành, chỉ có đúng những quyền được tích trong
 *                     `User.permissions` (chuỗi JSON mảng mã quyền).
 *  - Vai trò MEMBER = hội viên thường, không có quyền quản trị nào.
 */

export const QUYEN = {
  HOI_VIEN_XEM: "hoi_vien.xem",
  HOI_VIEN_SUA: "hoi_vien.sua",
  HO_SO_DUYET: "ho_so.duyet",
  GIAO_DICH_DUYET: "giao_dich.duyet",
  TIN_DANG_DUYET: "tin_dang.duyet",
  NOI_DUNG_VIET: "noi_dung.viet",
  SU_KIEN_QUAN_LY: "su_kien.quan_ly",
  TRANG_TINH_SUA: "trang_tinh.sua",
  VINH_DANH_QUAN_LY: "vinh_danh.quan_ly",
  HOI_PHI_QUAN_LY: "hoi_phi.quan_ly",
  BIEU_MAU_XU_LY: "bieu_mau.xu_ly",
  GIAO_DIEN_SUA: "giao_dien.sua",
  TAI_KHOAN_QUAN_LY: "tai_khoan.quan_ly",
  NGOI_NHA_QUAN_LY: "ngoi_nha.quan_ly",
  NGOI_NHA_CAI_DAT: "ngoi_nha.cai_dat",
} as const;

export type MaQuyen = (typeof QUYEN)[keyof typeof QUYEN];

/** Nhóm quyền để hiện thành checklist có tiêu đề trong trang quản trị. */
export const NHOM_QUYEN: {
  nhom: string;
  quyen: { ma: MaQuyen; ten: string; mo: string }[];
}[] = [
  {
    nhom: "Hội viên",
    quyen: [
      {
        ma: QUYEN.HOI_VIEN_XEM,
        ten: "Xem danh sách hội viên",
        mo: "Vào được mục Hội viên và xem thông tin liên hệ.",
      },
      {
        ma: QUYEN.HOI_VIEN_SUA,
        ten: "Thêm / sửa hồ sơ hội viên",
        mo: "Nhập hội viên mới, sửa thông tin, gắn nhóm sinh hoạt.",
      },
      {
        ma: QUYEN.HO_SO_DUYET,
        ten: "Duyệt hồ sơ doanh nghiệp",
        mo: "Duyệt hoặc trả lại hồ sơ hội viên tự sửa, chọn doanh nghiệp tiêu biểu.",
      },
      {
        ma: QUYEN.HOI_PHI_QUAN_LY,
        ten: "Quản lý hội phí",
        mo: "Ghi nhận hội viên đã đóng hội phí theo năm.",
      },
    ],
  },
  {
    nhom: "Giao thương",
    quyen: [
      {
        ma: QUYEN.GIAO_DICH_DUYET,
        ten: "Duyệt giao dịch giao thương",
        mo: "Duyệt hoặc từ chối đơn giao dịch — ảnh hưởng trực tiếp tới số liệu thi đua.",
      },
      {
        ma: QUYEN.TIN_DANG_DUYET,
        ten: "Kiểm soát chợ nhu cầu",
        mo: "Duyệt, gỡ, ghim tin mua bán của hội viên.",
      },
      {
        ma: QUYEN.VINH_DANH_QUAN_LY,
        ten: "Quản lý vinh danh",
        mo: "Tạo kỳ vinh danh, chọn người được vinh danh, công bố lên web.",
      },
    ],
  },
  {
    nhom: "Nội dung website",
    quyen: [
      {
        ma: QUYEN.NOI_DUNG_VIET,
        ten: "Viết tin tức, bản tin",
        mo: "Viết, sửa, công bố bài trên mục Tin tức.",
      },
      {
        ma: QUYEN.SU_KIEN_QUAN_LY,
        ten: "Quản lý sự kiện",
        mo: "Tạo và sửa sự kiện, xem danh sách đăng ký tham dự.",
      },
      {
        ma: QUYEN.TRANG_TINH_SUA,
        ten: "Sửa các trang giới thiệu",
        mo: "Sửa nội dung trang Giới thiệu, Ban Chủ nhiệm và các trang cố định khác.",
      },
      {
        ma: QUYEN.GIAO_DIEN_SUA,
        ten: "Đổi giao diện website",
        mo: "Đổi banner trang chủ, màu chủ đạo, thông tin liên hệ hiển thị.",
      },
      {
        ma: QUYEN.BIEU_MAU_XU_LY,
        ten: "Xử lý hồ sơ & tin nhắn",
        mo: "Xem và xử lý hồ sơ đăng ký hội viên, tin nhắn liên hệ gửi từ web.",
      },
    ],
  },
  {
    nhom: "Game Ngôi nhà Chợ Lớn",
    quyen: [
      {
        ma: QUYEN.NGOI_NHA_QUAN_LY,
        ten: "Vận hành game Ngôi nhà Chợ Lớn",
        mo: "Duyệt Nhiệm vụ Huynh đệ, ghi nhận trao quà, mở phiên Đấu trí, quản lý người chơi, xem thống kê.",
      },
      {
        ma: QUYEN.NGOI_NHA_CAI_DAT,
        ten: "Cài đặt game Ngôi nhà Chợ Lớn",
        mo: "Mở / đóng mùa giải, soạn quà, bật tắt tính năng, sửa luật điểm, Lá bài mỗi ngày và nội dung game. Đổi luật giữa mùa ảnh hưởng mọi người chơi — cấp cẩn trọng.",
      },
    ],
  },
  {
    nhom: "Hệ thống",
    quyen: [
      {
        ma: QUYEN.TAI_KHOAN_QUAN_LY,
        ten: "Quản lý tài khoản",
        mo: "Tạo tài khoản, phân quyền, khoá tài khoản người khác. Cấp quyền này rất cẩn trọng.",
      },
    ],
  },
];

/** Bộ quyền gợi ý sẵn theo từng ban chuyên môn của Chi hội. */
export const BO_QUYEN_MAU: { ten: string; mo: string; quyen: MaQuyen[] }[] = [
  {
    ten: "Thư ký Chi hội",
    mo: "Nhập hộ hội viên, giao dịch, xử lý hồ sơ gửi về — không tự duyệt.",
    quyen: [QUYEN.HOI_VIEN_XEM, QUYEN.HOI_VIEN_SUA, QUYEN.BIEU_MAU_XU_LY, QUYEN.HOI_PHI_QUAN_LY],
  },
  {
    ten: "Ban Truyền thông",
    mo: "Viết tin tức, quản lý sự kiện, sửa trang giới thiệu và giao diện.",
    quyen: [
      QUYEN.HOI_VIEN_XEM,
      QUYEN.NOI_DUNG_VIET,
      QUYEN.SU_KIEN_QUAN_LY,
      QUYEN.TRANG_TINH_SUA,
      QUYEN.GIAO_DIEN_SUA,
    ],
  },
  {
    ten: "Ban Xúc tiến thương mại",
    mo: "Duyệt giao dịch, kiểm soát chợ nhu cầu, quản lý vinh danh.",
    quyen: [
      QUYEN.HOI_VIEN_XEM,
      QUYEN.GIAO_DICH_DUYET,
      QUYEN.TIN_DANG_DUYET,
      QUYEN.VINH_DANH_QUAN_LY,
    ],
  },
  {
    ten: "Ban Hội viên",
    mo: "Quản lý hội viên, duyệt hồ sơ doanh nghiệp, xử lý đơn đăng ký.",
    quyen: [
      QUYEN.HOI_VIEN_XEM,
      QUYEN.HOI_VIEN_SUA,
      QUYEN.HO_SO_DUYET,
      QUYEN.HOI_PHI_QUAN_LY,
      QUYEN.BIEU_MAU_XU_LY,
    ],
  },
  {
    ten: "Ban vận hành game",
    mo: "Vận hành Ngôi nhà Chợ Lớn hằng ngày: duyệt nhiệm vụ, trao quà, Đấu trí sự kiện.",
    quyen: [QUYEN.HOI_VIEN_XEM, QUYEN.NGOI_NHA_QUAN_LY],
  },
  {
    ten: "Ban Sự kiện",
    mo: "Quản lý sự kiện và danh sách đăng ký tham dự.",
    quyen: [QUYEN.HOI_VIEN_XEM, QUYEN.SU_KIEN_QUAN_LY, QUYEN.NOI_DUNG_VIET],
  },
];

export const TEN_QUYEN: Record<string, string> = Object.fromEntries(
  NHOM_QUYEN.flatMap((n) => n.quyen.map((q) => [q.ma, q.ten]))
);

/**
 * Sáu vai trò hiển thị trong form phân quyền (Chủ nhiệm chốt 24/09/2026).
 * `ma` là giá trị form; ánh xạ xuống CSDL = cặp (role, chucVu).
 * Nhóm role ADMIN: mặc định TOÀN QUYỀN, tích chọn = giới hạn bớt.
 * BDH (role STAFF): PHẢI tích mới có quyền. MEMBER: không quyền quản trị.
 */
export const VAI_TRO_CHON: {
  ma: string;
  ten: string;
  role: "ADMIN" | "STAFF" | "MEMBER";
  chucVu: string | null;
}[] = [
  { ma: "ADMIN", ten: "Admin", role: "ADMIN", chucVu: null },
  { ma: "CHU_TICH", ten: "Chủ tịch Chi hội", role: "ADMIN", chucVu: "CHU_TICH" },
  { ma: "PHO_CHU_TICH", ten: "Phó Chủ tịch Chi hội", role: "ADMIN", chucVu: "PHO_CHU_TICH" },
  { ma: "THU_KY", ten: "Thư ký Chi hội", role: "ADMIN", chucVu: "THU_KY" },
  { ma: "BDH", ten: "Ban Điều hành — quyền theo tích chọn", role: "STAFF", chucVu: "BDH" },
  { ma: "MEMBER", ten: "Hội viên", role: "MEMBER", chucVu: null },
];

/** Từ (role, chucVu) trong CSDL → mã vai trò của form. */
export function maVaiTro(role: string, chucVu: string | null | undefined): string {
  if (role === "ADMIN")
    return ["CHU_TICH", "PHO_CHU_TICH", "THU_KY"].includes(chucVu ?? "")
      ? (chucVu as string)
      : "ADMIN";
  if (role === "STAFF") return "BDH";
  return "MEMBER";
}

/** Nhãn vai trò hiển thị, kèm ghi chú toàn quyền / giới hạn. */
export function tenVaiTro(
  role: string,
  chucVu: string | null | undefined,
  permissions?: string | null
): string {
  const goc = VAI_TRO_CHON.find((v) => v.ma === maVaiTro(role, chucVu));
  const ten = goc?.ten ?? role;
  if (role === "ADMIN") {
    return docQuyen(permissions).length > 0
      ? `${ten} — giới hạn theo tích chọn`
      : `${ten} — toàn quyền`;
  }
  return ten;
}

type NguoiDung = { role: string; permissions?: string | null };

/** Đọc chuỗi JSON `permissions` thành mảng mã quyền. */
export function docQuyen(permissions: string | null | undefined): string[] {
  if (!permissions) return [];
  try {
    const a = JSON.parse(permissions);
    return Array.isArray(a) ? a.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Người dùng có quyền này không.
 * Role ADMIN (cấp lãnh đạo): permissions TRỐNG = toàn quyền; CÓ danh sách
 * = chỉ đúng các quyền đó (Chủ nhiệm chốt 24/09 — "muốn xem ít thôi").
 * Chống tự khoá: action lưu quyền chặn việc tự bỏ quyền tài khoản của mình.
 */
export function co(user: NguoiDung | null | undefined, ma: MaQuyen): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") {
    const ds = docQuyen(user.permissions);
    return ds.length === 0 ? true : ds.includes(ma);
  }
  if (user.role !== "STAFF") return false;
  return docQuyen(user.permissions).includes(ma);
}

/** Có ít nhất một trong các quyền liệt kê. */
export function coMot(user: NguoiDung | null | undefined, ...ds: MaQuyen[]): boolean {
  return ds.some((m) => co(user, m));
}

/** Có bất kỳ quyền quản trị nào — dùng để quyết định hiện menu Quản trị. */
export function coQuyenQuanTri(user: NguoiDung | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.role !== "STAFF") return false;
  return docQuyen(user.permissions).length > 0;
}
