/**
 * Dữ liệu THẬT của Chi hội, chép từ "PROFILE YBA CHỢ LỚN" (nhiệm kỳ XII).
 * Tách riêng khỏi seed.ts để khi xoá dữ liệu mẫu vẫn giữ được phần này.
 *
 * ⚠️ Cần Ban Chủ nhiệm rà lại: slide "Ban Tài trợ" trong Profile ghi chú thích
 * là "Trưởng/Phó Ban Đào tạo" — nhiều khả năng là lỗi sao chép của bản thiết kế,
 * ở đây ghi theo TÊN BAN in trên slide.
 */

export type LeaderSeed = {
  name: string;
  title: string;
  position?: string;
  company?: string;
  group: string;
  order: number;
  /// Ảnh cắt từ Profile, nằm trong public/ban-chu-nhiem/
  photo?: string;
};

/** Thư mục chứa ảnh chân dung cắt từ Profile Chi hội. */
const A = "/ban-chu-nhiem";

export const NHIEM_KY = "XII (2023 - 2026)";

/**
 * Ảnh chân dung theo tên người, cắt tự động từ các trang giới thiệu ban trong
 * Profile (xem `scripts/cat-anh-ban.py`). Người xuất hiện ở hai ban dùng chung
 * một ảnh nên chỉ cần khoá theo tên.
 */
const ANH_CHAN_DUNG: Record<string, string> = {
  "Đặng Viên Khang": `${A}/chu-nhiem-1.jpg`,

  "Lê Tự Minh Phương": `${A}/co-van-1.jpg`,
  "Nguyễn Tấn Lực": `${A}/co-van-2.jpg`,
  "Đào Ngọc Long": `${A}/co-van-3.jpg`,
  "Lê Anh Tú": `${A}/co-van-4.jpg`,
  "Phạm Quang Tiến": `${A}/co-van-5.jpg`,

  "Phạm Văn Hoàng": `${A}/hoi-vien-1.jpg`,
  "Vũ Thị Hoài Trang": `${A}/hoi-vien-2.jpg`,
  "Trần Thị Minh Anh": `${A}/hoi-vien-3.jpg`,

  "Nguyễn Đức Anh": `${A}/xttm-1.jpg`,
  "Bùi Hữu Tài": `${A}/xttm-2.jpg`,
  "Nguyễn Duy Trung": `${A}/xttm-3.jpg`,

  "Lê Minh Tiến": `${A}/su-kien-1.jpg`,
  "Lê Quốc": `${A}/su-kien-2.jpg`,
  "Dương Hoài Hưng": `${A}/su-kien-3.jpg`,

  "Lê Nguyên Tùng": `${A}/truyen-thong-1.jpg`,
  "Lâm Trường Huy": `${A}/truyen-thong-2.jpg`,
  "Nguyễn Thái Hưng": `${A}/truyen-thong-3.jpg`,

  "Ngô Trí Thủy": `${A}/dao-tao-1.jpg`,
  "Nguyễn Tấn Trung": `${A}/dao-tao-2.jpg`,
  "Phạm Thị Yến Nhi": `${A}/dao-tao-3.jpg`,

  "Nguyễn Doãn San": `${A}/tai-tro-1.jpg`,
  "Nguyễn Anh Thy": `${A}/tai-tro-2.jpg`,
  "Trần Đức An": `${A}/tai-tro-3.jpg`,

  "Trương Chí Tâm": `${A}/doi-ngoai-1.jpg`,
  "Nguyễn Thúy Tiên": `${A}/doi-ngoai-2.jpg`,
  "Nguyễn Thị Lệ Thủy": `${A}/doi-ngoai-3.jpg`,
  "Phạm Nguyễn Hoài Ân": `${A}/doi-ngoai-4.jpg`,
};

const DANH_SACH_BAN: LeaderSeed[] = [
  // ── Ban Chủ nhiệm ────────────────────────────────────────────
  {
    name: "Đặng Viên Khang",
    title: "Chủ nhiệm Chi hội",
    position: "Uỷ viên Ban Chấp hành YBA HCM · CEO",
    company: "Công ty TNHH DV TKTT Hoàng Vy (Mon Amie)",
    group: "BAN_CHU_NHIEM",
    order: 1,
  },
  {
    name: "Phạm Văn Hoàng",
    title: "Phó Chủ nhiệm · Trưởng Ban Hội viên",
    group: "BAN_CHU_NHIEM",
    order: 2,
  },
  {
    name: "Nguyễn Đức Anh",
    title: "Phó Chủ nhiệm · Trưởng Ban Xúc tiến thương mại",
    group: "BAN_CHU_NHIEM",
    order: 3,
  },
  {
    name: "Lê Nguyên Tùng",
    title: "Phó Chủ nhiệm · Trưởng Ban Truyền thông",
    group: "BAN_CHU_NHIEM",
    order: 4,
  },
  {
    name: "Ngô Trí Thủy",
    title: "Phó Chủ nhiệm · Trưởng Ban Đào tạo",
    group: "BAN_CHU_NHIEM",
    order: 5,
  },
  {
    name: "Lê Minh Tiến",
    title: "Trưởng Ban Sự kiện",
    group: "BAN_CHU_NHIEM",
    order: 6,
  },

  // ── Ban Cố vấn ───────────────────────────────────────────────
  {
    name: "Lê Tự Minh Phương",
    title: "Cố vấn Ban Đào tạo",
    position: "Uỷ viên BCH YBA HCM · Chủ tịch HĐQT",
    company: "Công ty TNHH Kỹ Thuật Tự Động Việt Đông Hải",
    group: "BAN_CO_VAN",
    order: 1,
  },
  {
    name: "Nguyễn Tấn Lực",
    title: "Cố vấn Chi hội",
    position: "Phó Chủ tịch YBA HCM · Giám đốc",
    company: "Công ty TNHH TM Xây Dựng Toàn Lực",
    group: "BAN_CO_VAN",
    order: 2,
  },
  {
    name: "Đào Ngọc Long",
    title: "Cố vấn Hoạt động cộng đồng",
    position: "Uỷ viên BCH YBA HCM · Giám đốc Điều hành",
    company: "Công ty Cổ phần Greenpan",
    group: "BAN_CO_VAN",
    order: 3,
  },
  {
    name: "Lê Anh Tú",
    title: "Cố vấn Chi hội",
    position: "Phó Chủ tịch YBA HCM · Giám đốc",
    company: "Công ty TNHH TM - Kiến Trúc - XD Mộc Kiến Gia",
    group: "BAN_CO_VAN",
    order: 4,
  },
  {
    name: "Phạm Quang Tiến",
    title: "Cố vấn Ban Sự kiện",
    position: "Uỷ viên BCH YBA HCM · Tổng Giám đốc",
    company: "Công ty TNHH Thương mại Dịch vụ Đô Nét Cao (SAIGON HD)",
    group: "BAN_CO_VAN",
    order: 5,
  },

  // ── Ban Hội viên ─────────────────────────────────────────────
  { name: "Phạm Văn Hoàng", title: "Phó Chủ nhiệm · Trưởng Ban Hội viên", group: "BAN_HOI_VIEN", order: 1 },
  { name: "Vũ Thị Hoài Trang", title: "Phó Ban Hội viên", group: "BAN_HOI_VIEN", order: 2 },
  { name: "Trần Thị Minh Anh", title: "Phó Ban Hội viên", group: "BAN_HOI_VIEN", order: 3 },

  // ── Ban Xúc tiến thương mại ──────────────────────────────────
  { name: "Nguyễn Đức Anh", title: "Phó Chủ nhiệm · Trưởng Ban XTTM", group: "BAN_XTTM", order: 1 },
  { name: "Bùi Hữu Tài", title: "Phó Ban XTTM", group: "BAN_XTTM", order: 2 },
  { name: "Nguyễn Duy Trung", title: "Phó Ban XTTM", group: "BAN_XTTM", order: 3 },

  // ── Ban Sự kiện ──────────────────────────────────────────────
  { name: "Lê Minh Tiến", title: "Trưởng Ban Sự kiện", group: "BAN_SU_KIEN", order: 1 },
  { name: "Lê Quốc", title: "Phó Ban Sự kiện", group: "BAN_SU_KIEN", order: 2 },
  { name: "Dương Hoài Hưng", title: "Phó Ban Sự kiện", group: "BAN_SU_KIEN", order: 3 },

  // ── Ban Truyền thông ─────────────────────────────────────────
  { name: "Lê Nguyên Tùng", title: "Phó Chủ nhiệm · Trưởng Ban Truyền thông", group: "BAN_TRUYEN_THONG", order: 1 },
  { name: "Lâm Trường Huy", title: "Phó Ban Truyền thông", group: "BAN_TRUYEN_THONG", order: 2 },
  { name: "Nguyễn Thái Hưng", title: "Phó Ban Truyền thông", group: "BAN_TRUYEN_THONG", order: 3 },

  // ── Ban Đào tạo ──────────────────────────────────────────────
  { name: "Ngô Trí Thủy", title: "Phó Chủ nhiệm · Trưởng Ban Đào tạo", group: "BAN_DAO_TAO", order: 1 },
  { name: "Nguyễn Tấn Trung", title: "Phó Ban Đào tạo", group: "BAN_DAO_TAO", order: 2 },
  { name: "Phạm Thị Yến Nhi", title: "Phó Ban Đào tạo", group: "BAN_DAO_TAO", order: 3 },

  // ── Ban Tài trợ ──────────────────────────────────────────────
  // Anh Khang xác nhận 23/07/2026: chỉ anh Doãn San thuộc Ban Tài trợ; chị Anh
  // Thy và anh Đức An thuộc Ban Đối ngoại (slide Profile chú thích sai).
  {
    name: "Nguyễn Doãn San",
    title: "Trưởng Ban Tài trợ",
    position: "Uỷ viên BCH Hội Doanh nhân trẻ TP.HCM",
    group: "BAN_TAI_TRO",
    order: 1,
  },

  // ── Ban Đối ngoại ────────────────────────────────────────────
  { name: "Trương Chí Tâm", title: "Trưởng Ban Đối ngoại", group: "BAN_DOI_NGOAI", order: 1 },
  { name: "Nguyễn Thúy Tiên", title: "Phó Ban Đối ngoại", group: "BAN_DOI_NGOAI", order: 2 },
  { name: "Nguyễn Thị Lệ Thủy", title: "Phó Ban Đối ngoại", group: "BAN_DOI_NGOAI", order: 3 },
  { name: "Phạm Nguyễn Hoài Ân", title: "Phó Ban Đối ngoại", group: "BAN_DOI_NGOAI", order: 4 },
  { name: "Nguyễn Anh Thy", title: "Phó Ban Đối ngoại", group: "BAN_DOI_NGOAI", order: 5 },
  { name: "Trần Đức An", title: "Phó Ban Đối ngoại", group: "BAN_DOI_NGOAI", order: 6 },
];

export const LEADERS: LeaderSeed[] = DANH_SACH_BAN.map((l) => ({
  ...l,
  photo: ANH_CHAN_DUNG[l.name],
}));

/** Chủ nhiệm Chi hội qua các thời kỳ — dùng ở trang /gioi-thieu. */
export const CHU_NHIEM_CAC_THOI_KY = [
  { term: "Nhiệm kỳ VIII (2011 - 2014)", name: "Lâm Ngọc Minh", company: "Tổng Giám đốc Công ty TNHH SX Nệm Mousse Liên Á" },
  { term: "Nhiệm kỳ IX (2014 - 2017)", name: "Lê Minh Tiến", company: "Giám đốc Công ty Cổ phần Chăm sóc Ôtô Sài Gòn" },
  { term: "Nhiệm kỳ X (2017 - 2020)", name: "Lê Anh Tú", company: "Giám đốc Công ty TNHH TM - Kiến Trúc - XD Mộc Kiến Gia" },
  { term: "Nhiệm kỳ XI (2020 - 2023)", name: "Nguyễn Tấn Lực", company: "Giám đốc Công ty TNHH TM Xây Dựng Toàn Lực" },
  { term: "Nhiệm kỳ XII (2023 - 2026)", name: "Đặng Viên Khang", company: "Giám đốc Công ty TNHH DV TKTT Hoàng Vy (Mon Amie)" },
];

/**
 * Danh mục 29 ngành nghề CHUẨN của YBA — đúng như cột "Doanh nghiệp Ngành nghề
 * kinh doanh" trong Google Sheet danh sách hội viên. Giữ nguyên mã số để khi
 * nhập sheet chỉ cần đọc hai chữ số đầu là khớp được ngành.
 */
export const CATEGORIES: {
  code: string;
  slug: string;
  name: string;
  icon: string;
}[] = [
  { code: "01", slug: "website-phan-mem-thuong-mai-dien-tu", name: "Thiết kế Website - Phần mềm quản lý - Thương mại điện tử", icon: "💻" },
  { code: "02", slug: "thiet-bi-tin-hoc", name: "Kinh doanh các thiết bị tin học", icon: "🖥️" },
  { code: "03", slug: "co-khi-che-tao", name: "Cơ khí chế tạo - Máy móc thiết bị công nghiệp", icon: "⚙️" },
  { code: "04", slug: "da-giay", name: "Da giày", icon: "👞" },
  { code: "05", slug: "det-may-thoi-trang", name: "Dệt may - Thời trang", icon: "👔" },
  { code: "06", slug: "duoc-pham-y-te", name: "Dược phẩm - Trang thiết bị y tế - Chăm sóc sức khoẻ", icon: "⚕️" },
  { code: "07", slug: "du-lich-ve-may-bay", name: "Du lịch - Đại lý vé máy bay", icon: "✈️" },
  { code: "08", slug: "khach-san-lam-dep-an-uong", name: "Khách sạn - Dịch vụ làm đẹp - Kinh doanh dịch vụ ăn uống", icon: "🏨" },
  { code: "09", slug: "giay-in-an-bao-bi", name: "Giấy - In ấn - Thiết kế bao bì", icon: "🖨️" },
  { code: "10", slug: "hoa-chat-dau-nhot", name: "Hoá chất - Dầu nhớt", icon: "🛢️" },
  { code: "11", slug: "vat-lieu-xay-dung", name: "Vật liệu xây dựng (xi măng, sắt thép, gạch…)", icon: "🧱" },
  { code: "12", slug: "ngan-hang-tai-chinh-bao-hiem", name: "Ngân hàng - Tài chính - Bảo hiểm", icon: "🏦" },
  { code: "13", slug: "ke-toan-kiem-toan-luat", name: "Kế toán - Kiểm toán - Giám định - Luật", icon: "📊" },
  { code: "14", slug: "van-phong-pham", name: "Văn phòng phẩm - Máy móc thiết bị văn phòng", icon: "📎" },
  { code: "15", slug: "sach-bao-qua-tang", name: "Sách báo - Quà tặng", icon: "🎁" },
  { code: "16", slug: "xay-dung-thiet-ke-noi-that", name: "Xây dựng - Tư vấn thiết kế - Trang trí nội thất", icon: "🏗️" },
  { code: "17", slug: "bat-dong-san", name: "Địa ốc - Bất động sản - Kinh doanh nhà", icon: "🏙️" },
  { code: "18", slug: "dien-dien-tu-dien-lanh", name: "Điện - Điện tử - Điện lạnh", icon: "🔌" },
  { code: "19", slug: "cao-su-nhua", name: "Cao su - Nhựa - Các sản phẩm từ nhựa", icon: "🧴" },
  { code: "20", slug: "o-to-xe-may-phu-tung", name: "Ô tô - Xe máy - Xe đạp - Phụ tùng", icon: "🚗" },
  { code: "21", slug: "tu-van-dao-tao-nhan-luc", name: "Tư vấn - Đào tạo - Cung ứng nguồn nhân lực", icon: "🎓" },
  { code: "22", slug: "van-chuyen-giao-nhan-xnk", name: "Vận chuyển - Giao nhận - Xuất nhập khẩu", icon: "🚚" },
  { code: "23", slug: "truyen-thong-su-kien", name: "Truyền thông - Sự kiện - Nghiên cứu thị trường", icon: "📣" },
  { code: "24", slug: "luong-thuc-thuc-pham-do-uong", name: "Lương thực - Thực phẩm - Đồ uống", icon: "🍽️" },
  { code: "25", slug: "hoa-my-pham-hang-gia-dung", name: "Hoá mỹ phẩm - Hàng gia dụng", icon: "🧼" },
  { code: "26", slug: "moi-truong-nang-luong", name: "Môi trường - Năng lượng", icon: "♻️" },
  { code: "27", slug: "nong-lam-thuy-hai-san", name: "Nông - Lâm - Thuỷ hải sản", icon: "🌾" },
  { code: "28", slug: "vang-bac-thu-cong-my-nghe", name: "Vàng bạc - Thủ công mỹ nghệ", icon: "💍" },
  { code: "29", slug: "khac", name: "Ngành nghề khác", icon: "🔶" },
];

/** Nhóm sinh hoạt của Chi hội. */
export const CHAPTERS = [
  { code: "CL-SX", name: "Nhóm Sản xuất - Công nghiệp" },
  { code: "CL-TMDV", name: "Nhóm Thương mại - Dịch vụ" },
  { code: "CL-XD", name: "Nhóm Xây dựng - Bất động sản" },
  { code: "CL-CN", name: "Nhóm Công nghệ - Đổi mới sáng tạo" },
  { code: "CL-KN", name: "Nhóm Khởi nghiệp trẻ" },
];

/**
 * Doanh nghiệp hội viên / đối tác xuất hiện ở phần "Cảm ơn đồng hành" của
 * Profile. Dùng làm dữ liệu khởi tạo cho danh bạ trước khi nhập file thật.
 */
export const DOANH_NGHIEP_PROFILE: {
  company: string;
  phone?: string;
  website?: string;
  category: string;
}[] = [
  { company: "Công ty TNHH Thương mại - Kiến trúc - Xây dựng Mộc Kiến Gia", phone: "0918.242.328", website: "mockiengia.com", category: "xay-dung-thiet-ke-noi-that" },
  { company: "Công ty Cổ phần Thẩm định giá và Dịch vụ Tài sản Toàn Cầu", phone: "0928.111.666", website: "dauthau.asia", category: "ke-toan-kiem-toan-luat" },
  { company: "Công ty Cổ phần Nhựa Bình Minh", phone: "0903.842.571", website: "www.binhminhplastic.com.vn", category: "cao-su-nhua" },
  { company: "Công ty TNHH Công nghệ Môi trường Tái Tạo", phone: "0919.847.927", website: "reenvitech.vn", category: "moi-truong-nang-luong" },
  { company: "Công ty TNHH CI Research", phone: "0903.087.886", website: "ciresearch.com.vn", category: "truyen-thong-su-kien" },
  { company: "VPĐD Công ty Cổ phần MISA tại TP.HCM", phone: "0903.443.775", website: "www.misa.vn", category: "website-phan-mem-thuong-mai-dien-tu" },
  { company: "Công ty Cổ phần Sản xuất Nhựa Duy Tân", phone: "0903.813.170", website: "www.duytan.com", category: "cao-su-nhua" },
  { company: "Công ty TNHH SX Hàng tiêu dùng Bình Tân (BITA'S)", phone: "0913.929.186", website: "bitas.com.vn", category: "da-giay" },
  { company: "Ngân hàng TMCP Tiên Phong - Trung tâm Kinh doanh Quận 6", phone: "0909.884.009", website: "tpb.vn", category: "ngan-hang-tai-chinh-bao-hiem" },
  { company: "Công ty TNHH TM Du lịch Liên Bang (Lienbang Travelink)", phone: "0903.817.133", website: "lienbangtravel.com", category: "du-lich-ve-may-bay" },
  { company: "Công ty Cổ phần Gạch Thanh Bình", phone: "0903.807.951", category: "vat-lieu-xay-dung" },
  { company: "Công ty Cổ phần VN An Phú Hưng Group", phone: "0913.728.078", website: "www.vnanphuhunggroup.vn", category: "bat-dong-san" },
  { company: "Công ty TNHH Trục Chà Lúa Tân Lúa Vàng", phone: "0836.779.393", website: "www.luavang.com.vn", category: "co-khi-che-tao" },
  { company: "Công ty TNHH Quốc tế ĐKH", phone: "0978.759.090", website: "kinghoney.vn", category: "luong-thuc-thuc-pham-do-uong" },
  { company: "Công ty TNHH Nha khoa ST Group", phone: "0971.869.154", website: "stdentist.com", category: "duoc-pham-y-te" },
  { company: "Công ty TNHH Thương mại & Đầu tư HL (HL Global)", phone: "0929.988.882", category: "van-chuyen-giao-nhan-xnk" },
  { company: "Công ty Cổ phần Đại Lộc Long An", phone: "0917.778.899", category: "nong-lam-thuy-hai-san" },
  { company: "Công ty Cổ phần Xuất nhập khẩu Bến Tre (Betrimex)", phone: "0901.233.789", category: "nong-lam-thuy-hai-san" },
  { company: "Công ty TNHH Maruten Sushi - Soba", phone: "0932.707.722", category: "luong-thuc-thuc-pham-do-uong" },
  { company: "Công ty TNHH DV TKTT Hoàng Vy (Mon Amie)", phone: "0903.096.680", website: "monamie.vn", category: "det-may-thoi-trang" },
];
