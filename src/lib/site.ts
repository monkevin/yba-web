/**
 * Thông tin cố định của Chi hội, dùng chung cho header, footer, SEO.
 * Những gì ban chủ nhiệm cần đổi thường xuyên (banner, số liệu nổi bật) thì để
 * trong bảng `SiteSetting` chứ không đặt ở đây.
 */
export const SITE = {
  name: "YBA Chợ Lớn",
  fullName: "Chi hội Doanh nhân trẻ Chợ Lớn",
  parent: "Hội Doanh nhân trẻ TP.HCM (YBA HCM)",
  term: "Nhiệm kỳ XII (2023 – 2026)",
  slogan: "Dấn thân – Đổi mới – Đột phá – Vươn tầm",
  /// Khẩu hiệu thứ hai, dùng song song với slogan trên (theo web cũ)
  sloganPhu: "Kết nối – Sẻ chia – Kiến tạo giá trị",
  /// Cách Chi hội tự công bố quy mô — Ban Chủ nhiệm chốt là "trên 150 hội viên",
  /// dùng thống nhất mọi nơi thay vì lấy số hồ sơ trong CSDL (số đó gồm cả
  /// người đã ngưng sinh hoạt và doanh nghiệp ngoài Hội).
  quyMoCongBo: "trên 150 hội viên",
  tagline:
    "Ngôi nhà chung của doanh nhân trẻ Chợ Lớn — kết nối, giao thương, cùng nhau phát triển.",
  domain: "ybacholon.vn",
  url: "https://ybacholon.vn",
  email: "info@ybacholon.vn",
  hotline: "0903.096.680",
  address: "80-82 Đường 3/2, Phường Hoà Hưng, TP.HCM",
  /// Các quận Chi hội Chợ Lớn hoạt động (theo Profile Chi hội)
  areas: [
    "Quận 5",
    "Quận 6",
    "Quận 8",
    "Quận 10",
    "Quận 11",
    "Quận Bình Tân",
    "Huyện Bình Chánh",
  ],
  founded: 2009,
  social: {
    /// Fanpage Chi hội Chợ Lớn
    facebook: "https://www.facebook.com/ybacholon",
    /// Fanpage Hội Doanh nhân trẻ TP.HCM (tổng hội)
    facebookHoi: "https://www.facebook.com/YBAHCMC",
    /// Kênh YouTube Chi hội Chợ Lớn
    youtube: "https://www.youtube.com/@yba-chihoicholon1808",
    zalo: "",
  },
} as const;

/**
 * Menu chính của khu công khai. Giữ ở mức 7 mục để thanh điều hướng không tràn;
 * Video và Ban Chủ nhiệm vào menu phụ ở chân trang và trong từng trang liên quan.
 */
/**
 * Năm mục luôn hiện trên thanh điều hướng. Nhãn để NGẮN — dài quá thì thanh
 * chật, chữ tự xuống hàng và trông vỡ hết. Muốn thêm mục thì bỏ vào
 * `MENU_THEM` chứ đừng nhồi vào đây.
 */
export const MENU_CHINH: { href: string; label: string }[] = [
  { href: "/gioi-thieu", label: "Giới thiệu" },
  { href: "/doanh-nghiep", label: "Doanh nghiệp" },
  { href: "/giao-thuong", label: "Chợ nhu cầu" },
  { href: "/su-kien", label: "Sự kiện" },
  { href: "/lich-hoat-dong", label: "Lịch hoạt động" },
];

/** Các mục còn lại, gom vào nút "Thêm" trên thanh điều hướng. */
export const MENU_THEM: { href: string; label: string; mo?: string }[] = [
  // Game hội viên (cần đăng nhập — proxy tự đưa qua /login rồi quay lại).
  // Header điện thoại có hàng nổi bật riêng nên lọc mục này khỏi MAIN_MENU ở
  // đó; KHÔNG đưa /ngoi-nha vào sitemap (đã chặn trong robots.ts).
  {
    href: "/ngoi-nha",
    label: "Ngôi nhà Chợ Lớn",
    mo: "Game dành cho hội viên · cần đăng nhập",
  },
  {
    href: "/who-am-i",
    label: "WHO AM I?",
    mo: "Bộ trắc nghiệm dành cho doanh nhân",
  },
  // — Nhóm chung tay: đấu giá / vinh danh / tài trợ (sắp cạnh nhau theo
  //   yêu cầu Chủ tịch 25/09 — các mục "cống hiến" đứng chung một cụm)
  {
    href: "/dau-gia",
    label: "Đấu giá",
    mo: "Thiện nguyện & gây quỹ — ai cũng xem, hội viên trả giá",
  },
  {
    href: "/vinh-danh",
    label: "Vinh danh hội viên",
    mo: "Ghi nhận đóng góp theo kỳ",
  },
  {
    href: "/tai-tro",
    label: "Đồng hành & tài trợ",
    mo: "Các gói tài trợ chương trình",
  },
  // — Nhóm số liệu & thông tin Chi hội
  {
    href: "/xuc-tien-thuong-mai",
    label: "Xúc tiến thương mại",
    mo: "Chỉ số giao thương giữa hội viên",
  },
  {
    href: "/ban-chap-hanh",
    label: "Ban Chủ nhiệm",
    mo: "Nhân sự các ban nhiệm kỳ XII",
  },
  {
    href: "/tin-tuc",
    label: "Tin tức & bản tin",
    mo: "Hoạt động và tin thị trường",
  },
  { href: "/video", label: "Thư viện video", mo: "Kênh YouTube của Chi hội" },
  // Liên hệ phải có mặt trên menu — với người không rành công nghệ, đây là
  // mục họ tìm đầu tiên; bắt họ mò xuống chân trang là đánh rơi khách.
  {
    href: "/lien-he",
    label: "Liên hệ",
    mo: "Hotline, địa chỉ và gửi tin nhắn",
  },
];

/** Danh sách đầy đủ — dùng cho menu trên điện thoại và sơ đồ trang. */
export const MAIN_MENU: { href: string; label: string }[] = [
  ...MENU_CHINH,
  ...MENU_THEM.map(({ href, label }) => ({ href, label })),
];

/** Nhóm ban chuyên môn — thứ tự hiển thị ở trang /ban-chap-hanh. */
export const LEADER_GROUPS: { key: string; label: string }[] = [
  { key: "BAN_CHU_NHIEM", label: "Ban Chủ nhiệm" },
  { key: "BAN_CO_VAN", label: "Ban Cố vấn" },
  { key: "BAN_HOI_VIEN", label: "Ban Hội viên" },
  { key: "BAN_XTTM", label: "Ban Xúc tiến thương mại" },
  { key: "BAN_SU_KIEN", label: "Ban Sự kiện" },
  { key: "BAN_TRUYEN_THONG", label: "Ban Truyền thông" },
  { key: "BAN_DAO_TAO", label: "Ban Đào tạo" },
  { key: "BAN_TAI_TRO", label: "Ban Tài trợ" },
  { key: "BAN_DOI_NGOAI", label: "Ban Đối ngoại" },
];

/**
 * Giới thiệu Hội cấp trên — Hội Doanh nhân trẻ TP.HCM (YBA HCM).
 * Nguyên văn lấy từ website cũ ybacholon.vn, không viết lại.
 */
export const HOI_CAP_TREN = {
  ten: "Hội Doanh nhân trẻ TP.HCM (YBA)",
  moDau:
    "Hội Doanh Nhân Trẻ TP.HCM (YBA) là tổ chức Hội đầu tiên của các Doanh Nhân Trẻ cả nước. Hội được thành lập từ năm 1994 với 30 thành viên sáng lập. Tính đến nay YBA đang là nơi quy tụ của hàng trăm doanh nhân trẻ có chất lượng, năng động, nhiều hoài bão, khát khao vươn ra khu vực và toàn cầu.",
  tamNhin:
    "Đoàn kết, tập hợp và liên kết sức mạnh các doanh nhân trẻ trên địa bàn TP.HCM, đại diện tiếng nói và bảo vệ quyền lợi chính đáng của Hội viên.",
  suMenh:
    "Tạo điều kiện giao lưu, giao thương và hỗ trợ cho sự phát triển hoạt động sản xuất kinh doanh của các Hội viên, cùng phấn đấu vì sự thành đạt của Hội viên, vì mục tiêu chung của TP.HCM, vì sự phát triển của doanh nhân trẻ Việt Nam và góp phần tích cực vào sự nghiệp xây dựng đất nước.",
  mucTieu: [
    "Đại diện cho giới Doanh Nhân Trẻ Việt Nam trên địa bàn TP. Hồ Chí Minh nhằm bảo vệ lợi ích chính đáng và hợp pháp của Hội viên trước pháp luật và công luận.",
    "Tạo điều kiện hỗ trợ các doanh nhân trẻ nâng cao ý thức quản lý, nghề nghiệp, tiếp cận thị trường, hợp tác đầu tư và phát triển kinh doanh. Đồng thời để các doanh nhân tham gia các hoạt động xã hội.",
    "Là diễn đàn trao đổi thông tin, ý kiến của các doanh nhân trẻ, giữa các doanh nhân trẻ với cơ quan Nhà nước, các tổ chức, các doanh nghiệp khác trong và ngoài nước theo đúng Pháp luật.",
  ],
  /// Ba mốc pháp lý, ghi kèm số quyết định như trên web cũ
  mocLichSu: [
    {
      moc: "Tháng 9/1994",
      noiDung:
        "Thành lập Hội Doanh Nghiệp Trẻ TP.HCM với 30 thành viên, theo Quyết định số 01/QĐTLH-94 ngày 16/9/1994 của Ủy ban Hội Liên hiệp Thanh niên Việt Nam TP. Hồ Chí Minh.",
    },
    {
      moc: "Tháng 7/2003",
      noiDung:
        "Được công nhận là thành viên của Hội Liên hiệp Thanh niên Việt Nam TP. Hồ Chí Minh, có tư cách pháp nhân, được sử dụng con dấu riêng và mở tài khoản tại ngân hàng, theo Quyết định số 2900/QĐ-UB ngày 30/7/2003 của UBND TP.HCM.",
    },
    {
      moc: "Năm 2007",
      noiDung: "Đổi tên thành Hội Doanh nhân trẻ TP. Hồ Chí Minh.",
    },
  ],
} as const;

/**
 * Mục tiêu chiến lược nhiệm kỳ của Chi hội Chợ Lớn — ba trụ, lấy từ web cũ.
 */
export const MUC_TIEU_NHIEM_KY = [
  {
    tru: "Năng lực của Chi hội",
    y: [
      "Quản lý tài chính hiệu quả và minh bạch",
      "Thông tin và truyền thông đầy đủ",
      "Cam kết của Ban Chủ nhiệm",
    ],
  },
  {
    tru: "Hoạt động của Chi hội",
    y: ["Kết nối giao thương", "Gắn kết hội viên", "Nâng tầm doanh nhân"],
  },
  {
    tru: "Hội viên",
    y: ["Gắn kết", "Thu hút", "Đồng hành"],
  },
] as const;

/**
 * Điều kiện gia nhập Chi hội — nêu ở trang đăng ký hội viên, theo web cũ.
 */
export const DIEU_KIEN_GIA_NHAP = [
  "Từ 18 đến 45 tuổi",
  "Là người điều hành doanh nghiệp đang hoạt động",
  "Cam kết tham gia sinh hoạt định kỳ của Chi hội",
] as const;

/**
 * Sáu giá trị chạy quanh vành KV (key visual) của Chi hội — đọc thẳng
 * từ chính tấm KV, xếp theo chiều kim đồng hồ bắt đầu từ đỉnh trái.
 *
 * Khác với `slogan` (4 chữ) và `sloganPhu`: KV gộp thêm HỢP LỰC và
 * KIẾN TẠO. Đây là bộ chữ CHÍNH THỨC trên nhận diện, đừng tự thêm bớt
 * cho "cân" — sửa chỉ khi Ban Chủ nhiệm phát hành KV mới.
 */
export const GIA_TRI_KV = [
  "Đột phá",
  "Vươn tầm",
  "Kiến tạo",
  "Hợp lực",
  "Đổi mới",
  "Dấn thân",
] as const;

/** Bốn định hướng nhiệm kỳ XII — lấy từ Profile Chi hội. */
export const DINH_HUONG = [
  {
    no: "01",
    title: "Kế thừa và phát huy",
    desc: "Tiếp nối thành quả các nhiệm kỳ trước, giữ vững tinh thần gắn kết của Chi hội.",
  },
  {
    no: "02",
    title: "Kết nối giao thương",
    desc: "Đẩy mạnh xúc tiến thương mại giữa hội viên, với các chi hội và các hội bạn.",
  },
  {
    no: "03",
    title: "Nâng tầm doanh nhân",
    desc: "Đào tạo, chia sẻ kinh nghiệm quản trị, nâng cao năng lực cho doanh nghiệp hội viên.",
  },
  {
    no: "04",
    title: "Kết nối hội viên",
    desc: "Xây dựng tình huynh đệ, đồng hành và hỗ trợ nhau trong kinh doanh lẫn đời sống.",
  },
] as const;
