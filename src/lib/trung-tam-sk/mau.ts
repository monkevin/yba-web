/**
 * TRUNG TÂM SỰ KIỆN — mẫu sự kiện theo LOẠI × QUY MÔ.
 * Bấm "Tạo sự kiện" → chọn loại + quy mô → sinh sẵn: phiên, các ban trong BTC,
 * công việc theo mốc D-x, kịch bản khung, hậu cần, dự trù chi.
 * Đây là "quy trình chuẩn" của Chi hội — sửa file này là cập nhật quy trình
 * cho mọi sự kiện tạo SAU đó (sự kiện đã tạo không đổi).
 * Rủi ro & nhà cung cấp giữ sẵn dữ liệu cho đợt 2.
 *
 * Hàm thuần, không import prisma — trang tạo sự kiện (client) dùng được.
 */

export type QuyMo = "nho" | "vua" | "lon";
const RANK: Record<QuyMo, number> = { nho: 1, vua: 2, lon: 3 };
export const atLeast = (scale: QuyMo, min: QuyMo) => RANK[scale] >= RANK[min];

type TaskT = { t: string; c: string; d: number; p?: "P0" | "P1" | "P2"; min?: QuyMo; kind?: "task" | "checklist" };
type AgendaT = { section: string; session?: number; title: string; min: number; owner?: string; internal?: boolean; key?: boolean };
type ItemT = { cat: string; name: string; qty?: number; unit?: string; owner?: string; d?: number; min?: QuyMo };
type RiskT = { t: string; l: 1 | 2 | 3; i: 1 | 2 | 3; m: string; min?: QuyMo };

export const THONG_TIN_QUY_MO: Record<QuyMo, { label: string; guests: number; desc: string }> = {
  nho: { label: "Nhỏ", guests: 40, desc: "≤ 50 khách · 1 phiên · BTC 5–8 người · chuẩn bị 2–3 tuần" },
  vua: { label: "Vừa", guests: 120, desc: "50–150 khách · 1–2 phiên · BTC 10–20 người · chuẩn bị 4–6 tuần" },
  lon: { label: "Lớn", guests: 300, desc: "150+ khách · 2–3 phiên · BTC 20–40 người · chuẩn bị 8–10 tuần" },
};

/** Các ban theo quy mô. Ban nhỏ hơn được gộp việc. */
export function cacBanTheoQuyMo(scale: QuyMo): { name: string; desc: string }[] {
  const all = [
    { name: "Trưởng BTC", desc: "Chỉ đạo, duyệt nội dung, đối ngoại, quyết định phát sinh", min: "nho" as QuyMo },
    { name: "Phó BTC thường trực", desc: "Điều phối liên ban, theo dõi tiến độ, báo cáo hằng ngày", min: "vua" as QuyMo },
    { name: "Ban Nội dung & MC", desc: "Chủ đề, diễn giả, kịch bản, MC, bài phát biểu", min: "nho" as QuyMo },
    { name: "Ban Khách mời – Lễ tân", desc: "Danh sách, thư mời 1–1, xác nhận, check-in, xếp bàn", min: "nho" as QuyMo },
    { name: "Ban Truyền thông", desc: "KV, bài đăng, ảnh/video, báo chí, hậu kỳ", min: "nho" as QuyMo },
    { name: "Ban Hậu cần", desc: "Địa điểm, F&B, quà, hoa, đạo cụ, vận chuyển, an toàn", min: "nho" as QuyMo },
    { name: "Ban Tài trợ – Tài chính", desc: "Proposal, NTT, quyền lợi, thu chi, quyết toán", min: "vua" as QuyMo },
    { name: "Ban Sự kiện – Kỹ thuật", desc: "Sân khấu, âm thanh, ánh sáng, LED, cue sheet, tiết mục", min: "lon" as QuyMo },
    { name: "Điều phối hiện trường", desc: "Show caller, call sheet, xử lý sự cố ngày diễn ra", min: "lon" as QuyMo },
    { name: "Thư ký – Văn phòng", desc: "Biên bản, quyết định, danh sách xướng tên, lưu trữ hồ sơ", min: "lon" as QuyMo },
  ];
  return all.filter((c) => atLeast(scale, c.min)).map(({ name, desc }) => ({ name, desc }));
}

/** Công việc chung theo mốc ngày (d = số ngày so với ngày diễn ra, âm = trước). */
const BASE_TASKS: TaskT[] = [
  { t: "Chốt mục tiêu, quy mô, thông điệp, ngân sách sơ bộ", c: "Trưởng BTC", d: -60, p: "P0", min: "lon" },
  { t: "Chốt mục tiêu, quy mô, chủ đề, ngân sách sơ bộ", c: "Trưởng BTC", d: -30, p: "P0", min: "nho" },
  { t: "Họp BTC lần 1: giao ban, chủ sheet, quy tắc cập nhật", c: "Phó BTC thường trực", d: -45, p: "P0", min: "vua" },
  { t: "Chốt địa điểm, đặt cọc, khảo sát mặt bằng", c: "Ban Hậu cần", d: -40, p: "P0", min: "vua" },
  { t: "Chốt địa điểm & suất ăn/teabreak", c: "Ban Hậu cần", d: -14, p: "P0", min: "nho" },
  { t: "Proposal tài trợ + bảng quyền lợi theo hạng", c: "Ban Tài trợ – Tài chính", d: -45, p: "P0", min: "vua" },
  { t: "Danh sách NTT mục tiêu, phân công người vận động", c: "Ban Tài trợ – Tài chính", d: -40, p: "P1", min: "vua" },
  { t: "Chốt diễn giả / khách mời đặc biệt", c: "Ban Nội dung & MC", d: -30, p: "P0", min: "nho" },
  { t: "KV master + bộ template truyền thông", c: "Ban Truyền thông", d: -30, p: "P0", min: "vua" },
  { t: "Ảnh thông báo / thư mời mẫu", c: "Ban Truyền thông", d: -14, p: "P0", min: "nho" },
  { t: "Lập danh sách khách mời theo nhóm, gán người mời", c: "Ban Khách mời – Lễ tân", d: -30, p: "P0", min: "nho" },
  { t: "Mở form đăng ký online + QR", c: "Ban Khách mời – Lễ tân", d: -28, p: "P0", min: "nho" },
  { t: "Gửi thư mời 1–1, theo dõi xác nhận", c: "Ban Khách mời – Lễ tân", d: -21, p: "P0", min: "nho" },
  { t: "Dán link thư mục Drive, KV, kế hoạch truyền thông vào tab Truyền thông", c: "Ban Truyền thông", d: -28, p: "P1", min: "nho" },
  { t: "Lịch nội dung chi tiết (trước – trong – sau)", c: "Ban Truyền thông", d: -28, p: "P1", min: "lon" },
  { t: "Kịch bản chương trình bản 1", c: "Ban Nội dung & MC", d: -21, p: "P0", min: "nho" },
  { t: "Thuê MC / chốt MC nội bộ", c: "Ban Nội dung & MC", d: -21, p: "P1", min: "vua" },
  { t: "Chốt nhà cung cấp âm thanh – ánh sáng – LED", c: "Ban Sự kiện – Kỹ thuật", d: -21, p: "P0", min: "lon" },
  { t: "Chốt tiết mục văn nghệ, ca sĩ, ban nhạc", c: "Ban Sự kiện – Kỹ thuật", d: -21, p: "P1", min: "lon" },
  { t: "Đặt quà, hoa, kỷ niệm chương (cần 7–10 ngày khắc)", c: "Ban Hậu cần", d: -14, p: "P0", min: "vua" },
  { t: "Thu tiền NTT, xuất chứng từ", c: "Ban Tài trợ – Tài chính", d: -10, p: "P0", min: "vua" },
  { t: "Thu logo + clip NTT đúng chuẩn", c: "Ban Tài trợ – Tài chính", d: -12, p: "P0", min: "vua" },
  { t: "Danh sách giới thiệu đại biểu (chức danh chính xác)", c: "Thư ký – Văn phòng", d: -7, p: "P0", min: "lon" },
  { t: "Sơ đồ mặt bằng: sân khấu, bàn, check-in, booth", c: "Ban Sự kiện – Kỹ thuật", d: -10, p: "P0", min: "lon" },
  { t: "Đóng đăng ký, chốt số khách, báo suất ăn", c: "Ban Khách mời – Lễ tân", d: -5, p: "P0", min: "nho" },
  { t: "Xếp bàn VIP / NTT / hội viên", c: "Ban Khách mời – Lễ tân", d: -4, p: "P0", min: "vua" },
  { t: "Cue sheet kỹ thuật + call sheet nhân sự theo giờ", c: "Điều phối hiện trường", d: -4, p: "P0", min: "lon" },
  { t: "In thẻ tên, phiếu bốc thăm, bảng hướng dẫn", c: "Ban Khách mời – Lễ tân", d: -3, p: "P1", min: "vua" },
  { t: "Kịch bản MC bản cuối + slide/video bản cuối, sao lưu 2 USB", c: "Ban Nội dung & MC", d: -3, p: "P0", min: "nho" },
  { t: "Tổng duyệt full run tại địa điểm", c: "Điều phối hiện trường", d: -2, p: "P0", min: "lon" },
  { t: "Nhắc khách (tin nhắn/Zalo) trước 1 ngày", c: "Ban Khách mời – Lễ tân", d: -1, p: "P1", min: "nho" },
  { t: "BTC tập trung, check list hiện trường, phát bộ đàm", c: "Phó BTC thường trực", d: 0, p: "P0", min: "vua", kind: "checklist" },
  { t: "Check-in khách bằng app, cập nhật người có mặt cho MC", c: "Ban Khách mời – Lễ tân", d: 0, p: "P0", min: "nho", kind: "checklist" },
  { t: "Chụp ảnh bằng chứng quyền lợi NTT (logo, booth, sân khấu)", c: "Ban Truyền thông", d: 0, p: "P0", min: "vua", kind: "checklist" },
  { t: "Bài recap + album ảnh trong 24–48 giờ", c: "Ban Truyền thông", d: 2, p: "P0", min: "nho" },
  { t: "Cập nhật link bài đã đăng + reach vào tab Truyền thông (cho báo cáo NTT)", c: "Ban Truyền thông", d: 3, p: "P0", min: "nho" },
  { t: "Gửi form đánh giá cho khách tham dự", c: "Ban Khách mời – Lễ tân", d: 1, p: "P1", min: "nho" },
  { t: "Thư cảm ơn + báo cáo quyền lợi gửi từng NTT", c: "Ban Tài trợ – Tài chính", d: 7, p: "P0", min: "vua" },
  { t: "Chốt điểm hoạt động hội viên", c: "Trưởng BTC", d: 5, p: "P1", min: "nho" },
  { t: "Quyết toán thu – chi, công nợ, chứng từ", c: "Ban Tài trợ – Tài chính", d: 14, p: "P0", min: "vua" },
  { t: "Họp rút kinh nghiệm, ghi bài học vào tab Thông tin", c: "Trưởng BTC", d: 10, p: "P1", min: "nho" },
  // Checklist theo ban (18/10/2026 — Chủ nhiệm: "mỗi ban có checklist khối lượng công việc")
  { t: "Lập danh sách vật phẩm ở tab Hậu cần, giao người phụ trách từng món", c: "Ban Hậu cần", d: -21, p: "P1", min: "nho" },
  { t: "Kiểm kê toàn bộ vật phẩm theo tab Hậu cần, đóng thùng / chất xe", c: "Ban Hậu cần", d: -1, p: "P0", min: "nho" },
  { t: "Setup địa điểm: bàn check-in, backdrop, âm thanh, bàn quà, khu NTT", c: "Ban Hậu cần", d: 0, p: "P0", min: "nho", kind: "checklist" },
  { t: "Thu hồi đạo cụ, kiểm đếm, bàn giao địa điểm", c: "Ban Hậu cần", d: 0, p: "P1", min: "nho", kind: "checklist" },
  { t: "Đăng bài công bố sự kiện + link đăng ký (QR ở tab Cổng QR)", c: "Ban Truyền thông", d: -21, p: "P0", min: "nho" },
  { t: "In bảng QR đăng ký / check-in / hỏi đáp / đánh giá từ tab Cổng QR", c: "Ban Truyền thông", d: -4, p: "P0", min: "nho" },
  { t: "Chụp ảnh, quay clip trong ngày; livestream nếu có", c: "Ban Truyền thông", d: 0, p: "P0", min: "nho", kind: "checklist" },
  { t: "Kịch bản chi tiết từng phút ở tab Kịch bản, chốt người phụ trách từng mục", c: "Ban Nội dung & MC", d: -10, p: "P0", min: "nho" },
  { t: "Bám kịch bản theo giờ: nhắc MC / diễn giả từng mục, giữ đúng thời lượng", c: "Ban Nội dung & MC", d: 0, p: "P0", min: "nho", kind: "checklist" },
  { t: "Duyệt câu hỏi khách gửi qua QR, chọn câu chiếu lên màn hình", c: "Ban Nội dung & MC", d: 0, p: "P1", min: "vua", kind: "checklist" },
  { t: "Khai báo giải bốc thăm + nhà tài trợ giải ở tab Bốc thăm", c: "Ban Tài trợ – Tài chính", d: -7, p: "P1", min: "vua" },
];

type TypeT = {
  sessions: Record<QuyMo, string[]>;
  agenda: AgendaT[];
  tasks: TaskT[];
  items: ItemT[];
  vendors: string[];
  risks: RiskT[];
  budget: string[];
};

const COMMON_ITEMS: ItemT[] = [
  { cat: "Ấn phẩm", name: "Thẻ tên khách + BTC", owner: "Ban Khách mời – Lễ tân", d: -3, min: "vua" },
  { cat: "Ấn phẩm", name: "Bảng QR đăng ký / check-in / hỏi đáp", owner: "Ban Truyền thông", d: -3 },
  { cat: "Ấn phẩm", name: "Backdrop / standee", owner: "Ban Truyền thông", d: -5, min: "vua" },
  { cat: "Hoa", name: "Hoa tặng diễn giả / khách mời đặc biệt", owner: "Ban Hậu cần", d: -2 },
  { cat: "Đạo cụ", name: "Micro, máy chiếu/màn hình, laptop dự phòng", owner: "Ban Hậu cần", d: -1 },
  { cat: "F&B", name: "Teabreak / nước uống", owner: "Ban Hậu cần", d: -3 },
  { cat: "An toàn", name: "Bộ sơ cứu, danh bạ khẩn cấp", owner: "Ban Hậu cần", d: -1, min: "vua" },
];


const COMMON_RISKS: RiskT[] = [
  { t: "Âm thanh / màn hình lỗi", l: 2, i: 3, m: "Soundcheck trước 2 giờ; laptop + 2 USB dự phòng; kỹ thuật trực cạnh sân khấu" },
  { t: "Khách đến ít hơn đăng ký (no-show)", l: 2, i: 2, m: "Nhắc khách D-1 & sáng ngày diễn ra; báo suất ăn theo tỉ lệ đến thực tế các kỳ trước" },
  { t: "Diễn giả / khách VIP đến trễ hoặc huỷ", l: 1, i: 3, m: "Xác nhận lại D-2; có người dự phòng; MC chuẩn bị nội dung chèn" },
  { t: "NTT chậm chuyển tiền", l: 2, i: 2, m: "Ghi hạn thanh toán trong xác nhận tài trợ; theo dõi tab Tài trợ", min: "vua" },
  { t: "Khách đông hơn dự kiến", l: 1, i: 2, m: "Dự phòng 10% ghế & suất ăn; khu đứng networking", min: "vua" },
];

const TYPES: Record<string, TypeT> = {
  coffee: {
    sessions: { nho: ["Coffee Share"], vua: ["Coffee Share"], lon: ["Chia sẻ", "Networking"] },
    agenda: [
      { section: "I. CHƯƠNG TRÌNH", title: "Đón khách, check-in, networking", min: 30 },
      { section: "I. CHƯƠNG TRÌNH", title: "MC khai mạc, giới thiệu đại biểu", min: 5 },
      { section: "I. CHƯƠNG TRÌNH", title: "Chủ tịch phát biểu chào mừng", min: 5 },
      { section: "I. CHƯƠNG TRÌNH", title: "Chia sẻ chủ đề chính", min: 40, key: true },
      { section: "I. CHƯƠNG TRÌNH", title: "Hỏi đáp", min: 20 },
      { section: "I. CHƯƠNG TRÌNH", title: "Giới thiệu hội viên mới / doanh nghiệp (1 phút/người)", min: 20 },
      { section: "I. CHƯƠNG TRÌNH", title: "Chụp ảnh lưu niệm, bế mạc", min: 10 },
    ],
    tasks: [{ t: "Chọn chủ đề + người chia sẻ, gửi nội dung tóm tắt", c: "Ban Nội dung & MC", d: -14, p: "P0" }],
    items: [{ cat: "Quà", name: "Quà cảm ơn người chia sẻ", qty: 1, owner: "Ban Hậu cần", d: -2 }],
    vendors: ["Quán cà phê / địa điểm"],
    risks: [],
    budget: ["Địa điểm + đồ uống", "Quà người chia sẻ", "In ấn"],
  },
  workshop: {
    sessions: { nho: ["Hội thảo"], vua: ["Hội thảo", "Networking"], lon: ["Hội thảo", "Networking"] },
    agenda: [
      { section: "0. CHUẨN BỊ — NỘI BỘ", title: "Setup, test slide & micro, brief diễn giả", min: 60, internal: true },
      { section: "I. HỘI THẢO", session: 0, title: "Đón khách, check-in", min: 30 },
      { section: "I. HỘI THẢO", session: 0, title: "Tuyên bố lý do, giới thiệu đại biểu", min: 5 },
      { section: "I. HỘI THẢO", session: 0, title: "Phát biểu khai mạc", min: 5 },
      { section: "I. HỘI THẢO", session: 0, title: "Phần trình bày / tọa đàm của diễn giả", min: 60, key: true },
      { section: "I. HỘI THẢO", session: 0, title: "Hỏi đáp qua QR", min: 20 },
      { section: "I. HỘI THẢO", session: 0, title: "Tặng hoa, quà diễn giả, chụp ảnh", min: 10 },
      { section: "II. NETWORKING", session: 1, title: "Kết nối, giao lưu tự do", min: 30 },
    ],
    tasks: [
      { t: "Bộ câu hỏi tọa đàm ≥ 10 câu, gửi diễn giả trước 3 ngày", c: "Ban Nội dung & MC", d: -5, p: "P0" },
      { t: "Nhận slide diễn giả, kiểm tra hiển thị", c: "Ban Nội dung & MC", d: -3, p: "P0" },
      { t: "Mở cổng hỏi đáp QR trên app", c: "Ban Nội dung & MC", d: -1, p: "P1" },
    ],
    items: [
      { cat: "Quà", name: "Kỷ niệm chương / quà diễn giả", qty: 3, owner: "Ban Hậu cần", d: -7 },
      { cat: "Ấn phẩm", name: "Tài liệu / slide in cho khách (nếu có)", owner: "Ban Nội dung & MC", d: -2 },
    ],
    vendors: ["Địa điểm / hội trường", "Âm thanh – máy chiếu"],
    risks: [{ t: "Hội trường im lặng phần hỏi đáp", l: 2, i: 1, m: "Giao trước 3 hội viên câu hỏi mở màn; câu hỏi mồi dự phòng" }],
    budget: ["Địa điểm", "Teabreak", "Quà + KNC diễn giả", "Hoa", "In ấn", "Truyền thông"],
  },
  gala: {
    sessions: { nho: ["Gala"], vua: ["Lễ", "Gala"], lon: ["Tọa đàm", "Lễ", "Gala"] },
    agenda: [
      { section: "0. CHUẨN BỊ — NỘI BỘ BTC", title: "Setup sân khấu, LED, âm thanh, bàn tiệc", min: 60, internal: true },
      { section: "0. CHUẨN BỊ — NỘI BỘ BTC", title: "Soundcheck & chạy thử cue", min: 30, internal: true },
      { section: "I. LỄ", session: -2, title: "Đón khách, check-in", min: 30 },
      { section: "I. LỄ", session: -2, title: "Clip mở màn", min: 3 },
      { section: "I. LỄ", session: -2, title: "Tuyên bố lý do, giới thiệu đại biểu", min: 5 },
      { section: "I. LỄ", session: -2, title: "Phát biểu khai mạc", min: 6 },
      { section: "I. LỄ", session: -2, title: "Nghi thức chính (công bố / trao quyết định / chuyển giao)", min: 15, key: true },
      { section: "I. LỄ", session: -2, title: "Vinh danh – khen thưởng", min: 10 },
      { section: "I. LỄ", session: -2, title: "Chụp ảnh tập thể", min: 5 },
      { section: "II. GALA", session: -1, title: "Check-in Gala, welcome drink", min: 30 },
      { section: "II. GALA", session: -1, title: "Tiết mục mở màn", min: 5 },
      { section: "II. GALA", session: -1, title: "Nâng ly khai tiệc", min: 7, key: true },
      { section: "II. GALA", session: -1, title: "Tri ân nhà tài trợ", min: 15 },
      { section: "II. GALA", session: -1, title: "Văn nghệ – giao lưu", min: 40 },
      { section: "II. GALA", session: -1, title: "Quay số may mắn", min: 15 },
      { section: "II. GALA", session: -1, title: "Bế mạc, chụp ảnh", min: 10 },
      { section: "III. SAU CHƯƠNG TRÌNH — NỘI BỘ", title: "Tiễn khách, thu hồi đạo cụ, bàn giao địa điểm", min: 30, internal: true },
    ],
    tasks: [
      { t: "Clip mở màn / clip tổng kết", c: "Ban Truyền thông", d: -10, p: "P0", min: "vua" },
      { t: "Danh sách vinh danh + thứ tự xướng tên + người trao", c: "Thư ký – Văn phòng", d: -7, p: "P0", min: "vua" },
      { t: "Danh sách giải quay số + nhà tài trợ giải", c: "Ban Tài trợ – Tài chính", d: -7, p: "P1", min: "vua" },
      { t: "Chốt thực đơn, giờ ra món với nhà hàng", c: "Ban Hậu cần", d: -7, p: "P0" },
    ],
    items: [
      { cat: "Kỷ niệm chương", name: "Kỷ niệm chương NTT theo hạng", owner: "Ban Tài trợ – Tài chính", d: -7, min: "vua" },
      { cat: "Hoa", name: "Hoa vinh danh / chúc mừng", owner: "Ban Hậu cần", d: -3 },
      { cat: "Đạo cụ", name: "Champagne + tháp ly khai tiệc", qty: 3, unit: "chai", owner: "Ban Hậu cần", d: -3, min: "vua" },
      { cat: "Ấn phẩm", name: "Sơ đồ bàn, bảng Reserved/VIP, menu", owner: "Ban Khách mời – Lễ tân", d: -3, min: "vua" },
      { cat: "Giải thưởng", name: "Quà quay số may mắn", owner: "Ban Tài trợ – Tài chính", d: -5, min: "vua" },
    ],
    vendors: ["Nhà hàng / trung tâm tiệc", "Âm thanh – ánh sáng – LED", "MC", "Ca sĩ / ban nhạc", "Media (ảnh, quay phim)", "In ấn – backdrop", "Hoa", "Kỷ niệm chương"],
    risks: [
      { t: "Chương trình trễ giờ, khách về sớm trước phần quan trọng", l: 2, i: 2, m: "Show caller duy nhất; ghi rõ mục được rút ngắn (Q&A, văn nghệ)", min: "vua" },
      { t: "Suất ăn không đủ / thừa nhiều", l: 2, i: 2, m: "Chốt số với nhà hàng theo tỉ lệ đến thực tế; dự phòng 5%" },
    ],
    budget: ["Địa điểm + tiệc", "Âm thanh – ánh sáng – LED", "MC", "Ca sĩ / tiết mục", "Media", "In ấn – backdrop", "Hoa", "Kỷ niệm chương", "Quà tặng", "Truyền thông – báo chí"],
  },
  sport: {
    sessions: { nho: ["Thi đấu"], vua: ["Khai mạc", "Thi đấu", "Trao giải"], lon: ["Khai mạc", "Thi đấu", "Bế mạc & trao giải"] },
    agenda: [
      { section: "0. CHUẨN BỊ — NỘI BỘ", title: "Setup sân, bàn trọng tài, khu nước, y tế", min: 60, internal: true },
      { section: "I. KHAI MẠC", session: 0, title: "Check-in VĐV, nhận áo / số", min: 30 },
      { section: "I. KHAI MẠC", session: 0, title: "Khai mạc, phổ biến luật, bốc thăm", min: 15 },
      { section: "II. THI ĐẤU", session: 1, title: "Vòng bảng", min: 120 },
      { section: "II. THI ĐẤU", session: 1, title: "Tứ kết – bán kết – chung kết", min: 90, key: true },
      { section: "III. TRAO GIẢI", session: -1, title: "Trao giải, quay số, chụp ảnh", min: 30, key: true },
    ],
    tasks: [
      { t: "Điều lệ giải, nội dung thi đấu, lệ phí", c: "Ban Nội dung & MC", d: -30, p: "P0" },
      { t: "Đăng ký VĐV, chia bảng / xếp lịch thi đấu", c: "Ban Khách mời – Lễ tân", d: -5, p: "P0" },
      { t: "Đặt sân, trọng tài", c: "Ban Hậu cần", d: -21, p: "P0" },
      { t: "Đặt áo thi đấu, cúp, huy chương", c: "Ban Hậu cần", d: -14, p: "P0" },
    ],
    items: [
      { cat: "Thi đấu", name: "Bóng / dụng cụ thi đấu", owner: "Ban Hậu cần", d: -3 },
      { cat: "Giải thưởng", name: "Cúp, huy chương, giấy chứng nhận", owner: "Ban Hậu cần", d: -5 },
      { cat: "Trang phục", name: "Áo thi đấu", owner: "Ban Hậu cần", d: -7 },
      { cat: "F&B", name: "Nước, đá, khăn lạnh", owner: "Ban Hậu cần", d: -1 },
    ],
    vendors: ["Sân thi đấu", "Trọng tài", "Áo thi đấu", "Cúp – huy chương", "Media"],
    risks: [
      { t: "Mưa / thời tiết xấu (sân ngoài trời)", l: 2, i: 3, m: "Đặt sân có mái hoặc sân dự phòng; dời lịch theo điều lệ" },
      { t: "VĐV chấn thương", l: 2, i: 3, m: "Y tế trực sân, bộ sơ cứu, đá lạnh; bảo hiểm sự kiện" },
    ],
    budget: ["Thuê sân", "Trọng tài", "Áo thi đấu", "Cúp – huy chương", "Nước – F&B", "Y tế", "Media"],
  },
  csr: {
    sessions: { nho: ["Trao tặng"], vua: ["Trao tặng"], lon: ["Lễ trao tặng", "Hoạt động thực địa"] },
    agenda: [
      { section: "0. CHUẨN BỊ — NỘI BỘ", title: "Tập trung, kiểm đếm quà, di chuyển", min: 90, internal: true },
      { section: "I. TRAO TẶNG", session: 0, title: "Gặp gỡ địa phương / đơn vị thụ hưởng", min: 15 },
      { section: "I. TRAO TẶNG", session: 0, title: "Phát biểu, công bố giá trị trao tặng", min: 10 },
      { section: "I. TRAO TẶNG", session: 0, title: "Trao quà / bàn giao công trình", min: 30, key: true },
      { section: "I. TRAO TẶNG", session: 0, title: "Chụp ảnh, ký biên bản bàn giao", min: 15 },
    ],
    tasks: [
      { t: "Khảo sát đơn vị thụ hưởng, danh sách nhận quà", c: "Ban Nội dung & MC", d: -30, p: "P0" },
      { t: "Kêu gọi đóng góp, công khai danh sách ủng hộ", c: "Ban Tài trợ – Tài chính", d: -21, p: "P0" },
      { t: "Làm việc với chính quyền địa phương", c: "Trưởng BTC", d: -14, p: "P0" },
      { t: "Biên bản bàn giao + báo cáo minh bạch quỹ", c: "Ban Tài trợ – Tài chính", d: 7, p: "P0" },
    ],
    items: [
      { cat: "Quà", name: "Quà / hiện vật trao tặng", owner: "Ban Hậu cần", d: -5 },
      { cat: "Ấn phẩm", name: "Băng rôn, bảng tượng trưng giá trị trao tặng", owner: "Ban Truyền thông", d: -5 },
      { cat: "Vận chuyển", name: "Xe đoàn + xe chở quà", owner: "Ban Hậu cần", d: -7 },
    ],
    vendors: ["Nhà xe", "Nhà cung cấp quà / vật tư"],
    risks: [{ t: "Thời tiết, đường đi xa", l: 2, i: 2, m: "Kiểm tra lộ trình, xuất phát sớm, áo mưa, nước uống" }],
    budget: ["Quà / hiện vật trao tặng", "Vận chuyển", "Ăn uống đoàn", "Băng rôn – in ấn"],
  },
  trade: {
    sessions: { nho: ["Kết nối"], vua: ["Hội thảo", "Kết nối 1–1"], lon: ["Hội thảo", "Kết nối 1–1", "Gala networking"] },
    agenda: [
      { section: "I. HỘI THẢO", session: 0, title: "Đón khách, check-in", min: 30 },
      { section: "I. HỘI THẢO", session: 0, title: "Giới thiệu doanh nghiệp tham gia (pitch 2 phút)", min: 40, key: true },
      { section: "II. KẾT NỐI 1–1", session: 1, title: "Gặp gỡ theo lịch hẹn đã ghép", min: 60, key: true },
      { section: "II. KẾT NỐI 1–1", session: 1, title: "Ghi nhận cơ hội hợp tác", min: 15 },
    ],
    tasks: [
      { t: "Thu thập nhu cầu mua – bán của doanh nghiệp tham gia", c: "Ban Khách mời – Lễ tân", d: -21, p: "P0" },
      { t: "Ghép cặp kết nối 1–1, gửi lịch hẹn", c: "Ban Nội dung & MC", d: -5, p: "P0" },
      { t: "Khảo sát giá trị hợp tác phát sinh sau 30 ngày", c: "Ban Nội dung & MC", d: 30, p: "P1" },
    ],
    items: [
      { cat: "Ấn phẩm", name: "Kỷ yếu / danh bạ doanh nghiệp tham gia", owner: "Ban Truyền thông", d: -3 },
      { cat: "Đạo cụ", name: "Bàn kết nối đánh số", owner: "Ban Hậu cần", d: -1 },
    ],
    vendors: ["Địa điểm", "In ấn kỷ yếu"],
    risks: [{ t: "Doanh nghiệp không đến đúng lịch hẹn", l: 2, i: 2, m: "Xác nhận lịch D-1; có danh sách dự bị để ghép lại" }],
    budget: ["Địa điểm", "Teabreak", "Kỷ yếu", "Truyền thông"],
  },
  trip: {
    sessions: { nho: ["Ngày 1"], vua: ["Ngày 1", "Ngày 2"], lon: ["Ngày 1", "Ngày 2", "Ngày 3"] },
    agenda: [
      { section: "NGÀY 1", session: 0, title: "Tập trung, điểm danh, khởi hành", min: 30 },
      { section: "NGÀY 1", session: 0, title: "Thăm doanh nghiệp / địa phương", min: 120, key: true },
      { section: "NGÀY 1", session: 0, title: "Gala / giao lưu buổi tối", min: 150 },
    ],
    tasks: [
      { t: "Chốt lịch trình, báo giá tour / xe / khách sạn", c: "Ban Hậu cần", d: -30, p: "P0" },
      { t: "Danh sách đoàn + thông tin CCCD (bảo hiểm, khách sạn)", c: "Ban Khách mời – Lễ tân", d: -10, p: "P0" },
      { t: "Thu phí tham gia", c: "Ban Tài trợ – Tài chính", d: -10, p: "P0" },
      { t: "Phân phòng, phân xe", c: "Ban Hậu cần", d: -3, p: "P1" },
    ],
    items: [
      { cat: "Vận chuyển", name: "Xe đoàn", owner: "Ban Hậu cần", d: -14 },
      { cat: "Lưu trú", name: "Khách sạn / phân phòng", owner: "Ban Hậu cần", d: -14 },
      { cat: "An toàn", name: "Bảo hiểm du lịch", owner: "Ban Hậu cần", d: -5 },
      { cat: "Trang phục", name: "Áo đồng phục đoàn", owner: "Ban Hậu cần", d: -7 },
    ],
    vendors: ["Công ty lữ hành", "Nhà xe", "Khách sạn", "Nhà hàng"],
    risks: [
      { t: "Thành viên trễ giờ tập trung", l: 3, i: 1, m: "Nhóm Zalo đoàn, trưởng xe điểm danh, giờ xuất phát có 15 phút đệm" },
      { t: "Sự cố sức khỏe / ngộ độc thực phẩm", l: 1, i: 3, m: "Bảo hiểm, thuốc cơ bản, nhà hàng uy tín, số cấp cứu địa phương" },
    ],
    budget: ["Xe", "Khách sạn", "Ăn uống", "Vé tham quan", "Bảo hiểm", "Áo đoàn"],
  },
  other: {
    sessions: { nho: ["Chương trình"], vua: ["Chương trình"], lon: ["Phần 1", "Phần 2"] },
    agenda: [
      { section: "I. CHƯƠNG TRÌNH", title: "Đón khách, check-in", min: 30 },
      { section: "I. CHƯƠNG TRÌNH", title: "Khai mạc", min: 10 },
      { section: "I. CHƯƠNG TRÌNH", title: "Nội dung chính", min: 60, key: true },
      { section: "I. CHƯƠNG TRÌNH", title: "Bế mạc, chụp ảnh", min: 10 },
    ],
    tasks: [],
    items: [],
    vendors: ["Địa điểm"],
    risks: [],
    budget: ["Địa điểm", "F&B", "In ấn", "Quà tặng"],
  },
};


export const LOAI_SU_KIEN: { value: string; label: string }[] = [
  { value: "coffee", label: "Coffee Share / sinh hoạt hội viên" },
  { value: "workshop", label: "Hội thảo / Tọa đàm / Đào tạo" },
  { value: "gala", label: "Lễ / Đại hội / Gala" },
  { value: "sport", label: "Giải thể thao (Pickleball, Golf…)" },
  { value: "csr", label: "Thiện nguyện / Trách nhiệm cộng đồng" },
  { value: "trade", label: "Xúc tiến thương mại / Kết nối kinh doanh" },
  { value: "trip", label: "Caravan / Đi thăm doanh nghiệp / Teambuilding" },
  { value: "other", label: "Khác" },
];

export const QUY_MO: { value: QuyMo; label: string }[] = (["nho", "vua", "lon"] as QuyMo[]).map(
  (q) => ({ value: q, label: THONG_TIN_QUY_MO[q].label })
);

const MOT_NGAY = 86_400_000;

const nhanD = (d: number) => (d === 0 ? "Ngày D" : d < 0 ? `D${d}` : `D+${d}`);

/**
 * Sinh toàn bộ dữ liệu khởi tạo cho một sự kiện mới.
 * `ngay` là ngày diễn ra (12:00 giờ VN) — hạn chót tính lùi/tiến theo D-x.
 */
export function taoDuLieuMau(loai: string, quyMo: QuyMo, ngay: Date | null, gioBatDau = "08:00") {
  const T = TYPES[loai] ?? TYPES.other;
  const cacBan = cacBanTheoQuyMo(quyMo);
  const coBan = new Set(cacBan.map((c) => c.name));
  // Việc của ban không có ở quy mô này → dồn cho Phó BTC thường trực / Trưởng BTC
  const banCua = (c: string) =>
    coBan.has(c) ? c : coBan.has("Phó BTC thường trực") ? "Phó BTC thường trực" : "Trưởng BTC";
  const hanTheoD = (d: number | undefined) =>
    ngay && d !== undefined ? new Date(ngay.getTime() + d * MOT_NGAY) : null;

  const tenPhien = T.sessions[quyMo];
  const phien = tenPhien.map((ten, i) => ({ ten, order: i + 1 }));
  const viTriPhien = (n: number | undefined) =>
    n === undefined ? null : n < 0 ? Math.max(0, tenPhien.length + n) : Math.min(n, tenPhien.length - 1);

  const viec = [...BASE_TASKS, ...T.tasks]
    .filter((t) => atLeast(quyMo, t.min ?? "nho"))
    .sort((a, b) => a.d - b.d)
    .map((t, i) => ({
      ban: banCua(t.c),
      tieuDe: t.t,
      hanChot: hanTheoD(t.d),
      uuTien: t.p ?? "P1",
      loai: t.kind === "checklist" ? "CHECKLIST" : "VIEC",
      ghiChu: nhanD(t.d),
      order: i + 1,
    }));

  let phut = Number(gioBatDau.split(":")[0]) * 60 + Number(gioBatDau.split(":")[1] || 0);
  const kichBan = T.agenda
    // Gala quy mô nhỏ chỉ có 1 phiên → bỏ phần Lễ
    .filter((a) => !(loai === "gala" && tenPhien.length === 1 && a.session === -2))
    .map((a, i) => {
      const gio = `${String(Math.floor(phut / 60) % 24).padStart(2, "0")}:${String(phut % 60).padStart(2, "0")}`;
      phut += a.min;
      return {
        viTriPhien: viTriPhien(a.session),
        gio,
        thoiLuong: a.min,
        noiDung: a.key ? `★ ${a.title}` : a.title,
        phuTrach: a.owner ?? null,
        noiBo: !!a.internal,
        ghiChu: a.section,
        order: i + 1,
      };
    });

  const hauCan = [...COMMON_ITEMS, ...T.items]
    .filter((it) => atLeast(quyMo, it.min ?? "nho"))
    .map((it, i) => ({
      nhom: it.cat,
      ten: it.name,
      soLuong: it.qty ?? null,
      donVi: it.unit ?? null,
      phuTrach: banCua(it.owner ?? "Ban Hậu cần"),
      hanChot: hanTheoD(it.d),
      order: i + 1,
    }));

  const thuChi = T.budget.map((b, i) => ({ loai: "CHI", hangMuc: b, order: i + 1 }));

  return {
    phien,
    viec,
    kichBan,
    hauCan,
    thuChi,
    cacBan: cacBan.map((c) => ({ ten: c.name, moTa: c.desc })),
    mucTieuKhach: THONG_TIN_QUY_MO[quyMo].guests,
  };
}

/** Giải bốc thăm gợi ý (gala, thể thao, hoặc quy mô lớn) */
const GIAI_MAU: Record<QuyMo, { ten: string; soLuong: number }[]> = {
  nho: [],
  vua: [
    { ten: "Giải Ba", soLuong: 1 },
    { ten: "Giải Nhì", soLuong: 1 },
    { ten: "Giải Nhất", soLuong: 1 },
  ],
  lon: [
    { ten: "Giải Khuyến khích", soLuong: 10 },
    { ten: "Giải Ba", soLuong: 1 },
    { ten: "Giải Nhì", soLuong: 1 },
    { ten: "Giải Nhất", soLuong: 1 },
    { ten: "Giải Đặc biệt", soLuong: 1 },
  ],
};

/**
 * Bảng hạng tài trợ gợi ý theo quy mô (triệu đồng) — mỗi chương trình sửa
 * lại mức tiền, số suất, quyền lợi ở tab Tài trợ.
 */
const MUC_HANG: Record<QuyMo, number[]> = {
  nho: [30, 20, 10, 5, 3, 2],
  vua: [100, 50, 30, 20, 10, 5],
  lon: [200, 100, 50, 30, 15, 5],
};
const TEN_HANG = ["Nhà tài trợ chính", "Kim cương", "Vàng", "Bạc", "Đồng", "Đồng hành"];

export function hangTaiTroMau(quyMo: QuyMo, quyenLoi: Record<string, string[]>) {
  return TEN_HANG.map((ten, i) => ({
    ten,
    mucTien: MUC_HANG[quyMo][i] * 1_000_000,
    soSuat: i === 0 ? 1 : null,
    quyenLoi: (quyenLoi[ten] ?? []).join("\n") || null,
    order: i + 1,
  }));
}

/** Nhà cung cấp, rủi ro, giải bốc thăm theo mẫu (đợt 2) */
export function taoDuLieuMauDot2(loai: string, quyMo: QuyMo) {
  const T = TYPES[loai] ?? TYPES.other;
  return {
    nhaCungCap: T.vendors.map((v, i) => ({ hangMuc: v, order: i + 1 })),
    ruiRo: [...COMMON_RISKS, ...T.risks]
      .filter((r) => atLeast(quyMo, r.min ?? "nho"))
      .map((r, i) => ({ ruiRo: r.t, khaNang: r.l, tacDong: r.i, phuongAn: r.m, order: i + 1 })),
    giai: (loai === "gala" || loai === "sport" || quyMo === "lon" ? GIAI_MAU[quyMo] : []).map((g, i) => ({
      ...g,
      order: i + 1,
    })),
  };
}

