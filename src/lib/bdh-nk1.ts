/**
 * BAN ĐIỀU HÀNH NHIỆM KỲ I (2026–2029) — chép NGUYÊN VĂN từ Tờ trình kiện
 * toàn nhân sự BĐH Chi hội Chợ Lớn NK I (thư mục `_TO TRINH KIEN TOAN
 * BDH`, 21 người: 1 Chủ tịch · 8 Phó Chủ tịch · 12 Thành viên, thứ tự giữ
 * theo tờ trình). Ra mắt chính thức tại Lễ chuyển giao 10.10.2026 — trước
 * đó hiển thị kèm nhãn "dự kiến", KHÔNG dùng chức danh mới ở nơi khác khi
 * chưa có Quyết định (ghi chú của chính BTC trong master file).
 *
 * Ảnh: bộ vest NAVY đồng màu chụp 23/09 (public/bdh-nk1/<slug>.webp, dựng
 * bằng scratchpad/tao-anh-bdh-nk1.py — NK XII giữ nguyên bộ đồ NÂU).
 * Sau 10/10 muốn chuyển thành bộ máy chính thức thì nhập vào bảng Leader.
 */

export type ThanhVienNk1 = {
  ten: string;
  /** Chức vụ trong Chi hội theo tờ trình */
  chucVuHoi: string;
  /** Chức vụ tại doanh nghiệp + tên doanh nghiệp */
  mota: string;
  /** Ảnh thẻ vest navy, null nếu chưa có */
  anh: string | null;
};

const a = (slug: string) => `/bdh-nk1/${slug}.webp`;

export const BDH_NK1: ThanhVienNk1[] = [
  {
    ten: "Nguyễn Đức Anh",
    chucVuHoi: "Chủ tịch Chi hội",
    mota: "Chủ tịch HĐQT kiêm Tổng Giám đốc · Công ty Cổ phần VES",
    anh: a("nguyen-duc-anh"),
  },
  {
    ten: "Bùi Thị Kim Ngân",
    chucVuHoi: "Phó Chủ tịch Chi hội",
    mota: "Giám đốc · Công ty Cổ phần Tài Xế Công Nghệ",
    anh: a("bui-thi-kim-ngan"),
  },
  {
    ten: "Đỗ Minh Trí",
    chucVuHoi: "Phó Chủ tịch Chi hội",
    mota: "Giám đốc · Công ty TNHH Thương mại Dịch vụ Công nghệ Song Thành",
    anh: a("do-minh-tri"),
  },
  {
    ten: "Nguyễn Duy Trung",
    chucVuHoi: "Phó Chủ tịch Chi hội",
    mota: "Giám đốc · Công ty TNHH Thanh Trung Phát",
    anh: a("nguyen-duy-trung"),
  },
  {
    ten: "Dương Hoài Hưng",
    chucVuHoi: "Phó Chủ tịch Chi hội",
    mota: "Giám đốc · Công ty TNHH Chu My",
    anh: a("duong-hoai-hung"),
  },
  {
    ten: "Trần Đức An",
    chucVuHoi: "Phó Chủ tịch Chi hội",
    mota: "Chủ tịch HĐQT kiêm Giám đốc · Công ty Cổ phần Sâm Ngọc Linh Tu Mơ Rông Kon Tum",
    anh: a("tran-duc-an"),
  },
  {
    ten: "Lê Minh Tiến",
    chucVuHoi: "Phó Chủ tịch Chi hội",
    mota: "Giám đốc Vận hành · Công ty TNHH JW Wedding & Event Academy Vietnam",
    anh: a("le-minh-tien"),
  },
  {
    ten: "Ngô Trí Thủy",
    chucVuHoi: "Phó Chủ tịch Chi hội",
    mota: "Tổng Giám đốc · Công ty Cổ phần Kết Nối Tri Thức ACC",
    anh: a("ngo-tri-thuy"),
  },
  {
    ten: "Nguyễn Thị Mến",
    chucVuHoi: "Phó Chủ tịch Chi hội",
    mota: "Giám đốc · Công ty Luật TNHH Luật sư Mến & cộng sự",
    anh: a("nguyen-thi-men"),
  },
  {
    ten: "Trương Thị Tuyết Ánh",
    chucVuHoi: "Thành viên Ban Điều hành",
    mota: "Giám đốc Kinh doanh · Công ty TNHH Xây dựng và Thương mại Diệp Gia",
    anh: a("truong-thi-tuyet-anh"),
  },
  {
    ten: "Trương Trịnh Vĩnh Ký",
    chucVuHoi: "Thành viên Ban Điều hành",
    mota: "Giám đốc Kinh doanh · Công ty Cổ phần Sản xuất Thương mại Dịch vụ Mỹ thuật Tân Việt",
    anh: a("truong-trinh-vinh-ky"),
  },
  {
    ten: "Phạm Nguyễn Hoài Ân",
    chucVuHoi: "Thành viên Ban Điều hành",
    mota: "Giám đốc · Công ty TNHH Yến Sào Khang",
    anh: a("pham-nguyen-hoai-an"),
  },
  {
    ten: "Phạm Thị Anh Trâm",
    chucVuHoi: "Thành viên Ban Điều hành",
    mota: "Giám đốc · Công ty TNHH Giáo dục và Đào tạo Premier",
    anh: a("pham-thi-anh-tram"),
  },
  {
    ten: "Nguyễn Thái Hưng",
    chucVuHoi: "Thành viên Ban Điều hành",
    mota: "Giám đốc Marketing · Công ty Cổ phần VES",
    anh: a("nguyen-thai-hung"),
  },
  {
    ten: "Quách Hồng Thái",
    chucVuHoi: "Thành viên Ban Điều hành",
    mota: "Giám đốc · Công ty TNHH Thương mại và Lữ hành Famtrip Global",
    anh: a("quach-hong-thai"),
  },
  {
    ten: "Trần Thị Minh Anh",
    chucVuHoi: "Thành viên Ban Điều hành",
    mota: "Tổng Giám đốc · Công ty Cổ phần Thương mại Dịch vụ Auxin Agrico",
    anh: a("tran-thi-minh-anh"),
  },
  {
    ten: "Nguyễn Anh Thy",
    chucVuHoi: "Thành viên Ban Điều hành",
    mota: "Tổng Giám đốc · Công ty Cổ phần Big Boss Việt Nam",
    anh: a("nguyen-anh-thy"),
  },
  {
    ten: "Lê Quốc",
    chucVuHoi: "Thành viên Ban Điều hành",
    mota: "Giám đốc · Công ty TNHH Thương mại Thời trang Khang Gia Hưng",
    anh: a("le-quoc"),
  },
  {
    ten: "Nguyễn Thanh Hà",
    chucVuHoi: "Thành viên Ban Điều hành",
    mota: "Trưởng Văn phòng đại diện · Công ty TNHH Triển lãm Sự kiện và Vận tải BEX",
    anh: a("nguyen-thanh-ha"),
  },
  {
    ten: "Trần Dương Xuân Vũ",
    chucVuHoi: "Thành viên Ban Điều hành",
    mota: "Chủ tịch HĐQT kiêm Tổng Giám đốc · Công ty Cổ phần Tim Corp",
    anh: a("tran-duong-xuan-vu"),
  },
  {
    ten: "Lê Hữu Quân",
    chucVuHoi: "Thành viên Ban Điều hành",
    mota: "Phó Tổng Giám đốc · Công ty Cổ phần Kỹ nghệ lạnh Hoa Sáng",
    anh: a("le-huu-quan"),
  },
];
