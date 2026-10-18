/**
 * Dự án kêu gọi và các gói tài trợ khởi tạo ban đầu.
 * Ban Chủ nhiệm sửa lại nội dung, số tiền và quyền lợi ở /quan-tri/tai-tro.
 */

export const DU_AN_MAC_DINH = [
  {
    slug: "nhip-cau-doanh-nhan",
    ten: "Nhịp Cầu Doanh Nhân",
    tomTat:
      "Xây cầu dân sinh cho bà con vùng sâu — công trình mang tên cộng đồng doanh nhân trẻ.",
    moTa: `Nhịp Cầu Doanh Nhân là chương trình trách nhiệm cộng đồng tiêu biểu của Chi hội: góp sức xây những cây cầu dân sinh thay cho cầu tạm ở các vùng còn khó khăn.

Mỗi cây cầu là một công trình cụ thể, có địa chỉ rõ ràng, có ngày khánh thành và có bà con đi lại hằng ngày trên đó. Nhà tài trợ được mời tham dự lễ khởi công và khánh thành, tên doanh nghiệp được ghi trên bảng công trình.

Toàn bộ đóng góp được công khai và quyết toán với các nhà tài trợ sau khi công trình hoàn thành.`,
    mucTieu: 0,
    order: 1,
  },
  {
    slug: "hoat-dong-clb",
    ten: "Hoạt động các CLB Chi hội",
    tomTat:
      "Đồng hành cùng CLB Pickleball, Golf, Coffee Business và các sinh hoạt định kỳ của hội viên.",
    moTa: `Các câu lạc bộ là nơi hội viên gặp nhau thường xuyên nhất ngoài các kỳ sinh hoạt chính thức — nơi những mối làm ăn bắt đầu từ một buổi cà phê hay một trận đấu.

Tài trợ cho hoạt động CLB giúp Chi hội duy trì lịch sinh hoạt đều đặn, tổ chức giải đấu nội bộ và mời diễn giả chia sẻ chuyên môn cho hội viên.

Nhà tài trợ được nhận diện thương hiệu tại sự kiện và trên các ấn phẩm truyền thông của chương trình.`,
    mucTieu: 0,
    order: 2,
  },
];

/** Bốn mức tài trợ dùng chung cho mọi chương trình. */
export const GOI_MAC_DINH = [
  {
    ten: "Kim cương",
    soTien: 100_000_000,
    noiBat: true,
    quyenLoi: `Logo vị trí trang trọng nhất trên backdrop và mọi ấn phẩm chương trình
Phát biểu đại diện nhà tài trợ tại lễ khởi công / khánh thành
Bài viết riêng giới thiệu doanh nghiệp trên fanpage và website Chi hội
Vinh danh tại kỳ tổng kết năm của Chi hội
Được mời tham dự cùng đoàn Ban Chủ nhiệm trong suốt chương trình`,
    order: 1,
  },
  {
    ten: "Vàng",
    soTien: 50_000_000,
    quyenLoi: `Logo trên backdrop và ấn phẩm chương trình
Ghi danh trên bảng công trình / bảng nhà tài trợ
Bài đăng cảm ơn riêng trên fanpage Chi hội
Vinh danh tại kỳ tổng kết năm`,
    order: 2,
  },
  {
    ten: "Bạc",
    soTien: 30_000_000,
    quyenLoi: `Logo trên backdrop chương trình
Ghi danh trong danh sách nhà tài trợ
Bài đăng cảm ơn chung trên fanpage Chi hội`,
    order: 3,
  },
  {
    ten: "Đồng hành",
    soTien: 10_000_000,
    quyenLoi: `Ghi danh trong danh sách nhà tài trợ
Lời cảm ơn trên fanpage và website Chi hội
Được mời tham dự lễ khánh thành / sự kiện`,
    order: 4,
  },
];
