/**
 * Giới thiệu doanh nghiệp tổng hợp từ WEBSITE CHÍNH THỨC của hội viên.
 *
 * Khác với phần giới thiệu do `lam-day-ho-so.ts` dựng tự động (chỉ diễn đạt lại
 * dữ liệu trong Google Sheet của Hội), phần này là nội dung đọc được từ chính
 * trang chủ doanh nghiệp — nên đầy đặn và chính xác hơn nhiều.
 *
 * CÁCH BỔ SUNG THÊM: mỗi lần đọc thêm website của hội viên, thêm một mục vào
 * mảng dưới đây rồi chạy `npm run ap-gioi-thieu -- --ghi`.
 *
 * `khop` là mảnh tên dùng để tìm đúng doanh nghiệp trong CSDL (không phân biệt
 * hoa thường, không cần đủ tên).
 */

export type GioiThieuWeb = {
  khop: string;
  gioiThieu: string;
  sanPham?: string[];
  namThanhLap?: number;
  nangLuc?: string[];
};

export const GIOI_THIEU_WEB: GioiThieuWeb[] = [
  {
    khop: "Nhựa Bình Minh",
    namThanhLap: 1977,
    gioiThieu:
      "Nhựa Bình Minh là một trong những thương hiệu lâu đời và lớn nhất ngành ống nhựa Việt Nam, chuyên sản xuất và kinh doanh ống cùng phụ tùng ống nhựa phục vụ ngành cấp thoát nước, xây dựng dân dụng và công nghiệp.\n\nCông ty vận hành 4 nhà máy với sản lượng khoảng 150.000 tấn sản phẩm mỗi năm, đạt các chứng nhận ISO 9001 và ISO 14001.",
    sanPham: [
      "Ống và phụ tùng PVC-U (đường kính 20–630 mm)",
      "Ống và phụ tùng PP-R (20–200 mm), có loại kháng tia UV",
      "Ống HDPE (16–1.200 mm) và HDPE gân thành đôi",
      "Ống luồn dây điện PVC-U",
      "Keo dán PVC đạt tiêu chuẩn ASTM D2564",
      "Phụ tùng tưới tiêu, bình xịt nông nghiệp",
    ],
    nangLuc: [
      "4 nhà máy sản xuất, sản lượng ~150.000 tấn/năm",
      "Chứng nhận ISO 9001 và ISO 14001",
      "Keo dán đạt tiêu chuẩn quốc tế ASTM D2564",
    ],
  },
  {
    khop: "Nhựa Tái Chế Duy Tân",
    namThanhLap: 1987,
    gioiThieu:
      "Nhựa Duy Tân là thương hiệu nhựa hàng đầu Việt Nam, thành lập năm 1987, với định hướng trở thành nhà sản xuất nhựa hàng đầu khu vực ASEAN.\n\nSản phẩm của công ty đạt chuẩn quốc tế và được xuất khẩu sang Mỹ, Nhật Bản và châu Âu.",
    sanPham: [
      "Sản phẩm gia dụng: đồ dùng gia đình, đồ cho trẻ em, nội thất nhựa",
      "Sản phẩm công nghiệp: pallet, thùng nhựa, kệ nhựa, rổ",
      "Bao bì: chai lọ mỹ phẩm, bao bì hoá phẩm, thực phẩm, dược phẩm",
    ],
    nangLuc: [
      "Thành lập năm 1987, thương hiệu nhựa hàng đầu Việt Nam",
      "Xuất khẩu sang Mỹ, Nhật Bản và châu Âu",
      "Chứng nhận ISO 9001, ISO 14001",
    ],
  },
  {
    khop: "Hàng tiêu dùng Bình Tân",
    namThanhLap: 2006,
    gioiThieu:
      "Bita's là doanh nghiệp sản xuất và kinh doanh hàng tiêu dùng, chuyên về giày dép cho nam, nữ và trẻ em, trụ sở chính tại TP.HCM.\n\nCông ty có hai chi nhánh tại miền Bắc (Hà Nội) và miền Nam (TP.HCM), phân phối qua hệ thống cửa hàng bán lẻ và kênh bán hàng trực tuyến.",
    sanPham: [
      "Giày thể thao nam nữ",
      "Dép quai ngang",
      "Sandal các loại",
      "Giày dép trẻ em (bé trai, bé gái)",
    ],
    nangLuc: [
      "Hệ thống chi nhánh tại Hà Nội và TP.HCM",
      "Phân phối qua cửa hàng bán lẻ và thương mại điện tử",
    ],
  },
  {
    khop: "Bánh Kẹo Á Châu",
    gioiThieu:
      "ABC Bakery là thương hiệu bánh nổi tiếng của TP.HCM, hoạt động trong lĩnh vực sản xuất và kinh doanh bánh, với phương châm “Giữ Truyền Thống, Sống Hiện Đại” — kết hợp giá trị truyền thống với thiết kế và hương vị hiện đại.\n\nCông ty giao hàng tới 63 tỉnh thành, có dịch vụ giao nhanh trong 30 phút nội thành.",
    sanPham: [
      "Bánh mì, bánh ngọt các loại",
      "Bánh trung thu nhiều hương vị truyền thống và hiện đại",
      "Hộp bánh quà tặng (hộp 2 bánh, hộp 4 bánh)",
      "Dịch vụ in logo, in thiệp theo yêu cầu doanh nghiệp",
    ],
    nangLuc: [
      "Giao hàng tới 63 tỉnh thành",
      "Giao nhanh trong 30 phút khu vực nội thành",
      "Nhận in logo và thiệp riêng cho đơn hàng doanh nghiệp",
      "Có chính sách chiết khấu cho đơn hàng số lượng lớn",
    ],
  },
  {
    khop: "Tập Đoàn Thiên Long",
    gioiThieu:
      "Tập đoàn Thiên Long là doanh nghiệp sản xuất và phân phối văn phòng phẩm hàng đầu Việt Nam, phục vụ nhu cầu học tập, làm việc và sáng tạo, với hành trình 45 năm phát triển.\n\nCông ty có mạng lưới phân phối toàn quốc qua cả kênh truyền thống lẫn thương mại điện tử.",
    sanPham: [
      "Bút viết các loại",
      "Văn phòng phẩm cho doanh nghiệp",
      "Dụng cụ học tập",
      "Sản phẩm thân thiện môi trường",
    ],
    nangLuc: [
      "45 năm hoạt động trong ngành văn phòng phẩm",
      "Mạng lưới phân phối toàn quốc",
      "Kênh thương mại điện tử riêng (thienlong.vn)",
    ],
  },
  {
    khop: "Giấy Vĩnh Tiến",
    gioiThieu:
      "Giấy Vĩnh Tiến là thương hiệu uy tín trong ngành giấy Việt Nam với hơn 39 năm hoạt động, chuyên sản xuất và kinh doanh giấy, in ấn và gia công giấy.\n\nCông ty đạt danh hiệu Hàng Việt Nam Chất Lượng Cao 20 năm liền và có hệ thống phân phối rộng khắp cả nước.",
    sanPham: [
      "Vibook — tập học sinh",
      "Vipaper — giấy photocopy",
      "Vifile — bìa lá nhựa, file văn phòng",
      "Khẩu trang y tế 3H Mask",
      "Dịch vụ thiết kế và in theo yêu cầu",
    ],
    nangLuc: [
      "Hơn 39 năm hoạt động trong ngành giấy",
      "20 năm liền đạt danh hiệu Hàng Việt Nam Chất Lượng Cao",
      "Hệ thống phân phối rộng khắp cả nước",
    ],
  },
];
