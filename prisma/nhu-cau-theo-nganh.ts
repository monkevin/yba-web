/**
 * Nhu cầu MUA thường gặp theo từng ngành nghề, và nhóm hàng hoá – dịch vụ mà
 * doanh nghiệp nào cũng cần (dùng chung cho mọi ngành).
 *
 * Dùng để khởi tạo tin "cần mua" cho hội viên trên chợ giao thương. Đây là bản
 * NHÁP để hội viên vào sửa lại cho đúng nhu cầu thật của mình, không phải nhu
 * cầu do doanh nghiệp tự khai.
 *
 * Khoá là mã ngành theo danh mục 29 ngành của YBA (xem `du-lieu-chi-hoi.ts`).
 */

/** Nhu cầu chung mọi doanh nghiệp đều có — luôn ghép thêm vào tin cần mua. */
export const NHU_CAU_CHUNG = [
  "văn phòng phẩm",
  "in ấn — danh thiếp, catalogue, biểu mẫu",
  "quà tặng doanh nghiệp dịp lễ Tết",
  "dịch vụ kế toán – tư vấn thuế",
];

export const NHU_CAU_MUA: Record<string, string[]> = {
  "01": ["hạ tầng máy chủ – cloud", "dịch vụ kiểm thử phần mềm", "nhân sự lập trình thời vụ", "công cụ thiết kế bản quyền"],
  "02": ["linh kiện máy tính số lượng lớn", "dịch vụ bảo hành – sửa chữa", "kho bãi lưu hàng", "vận chuyển nội thành"],
  "03": ["thép tấm – thép hình", "vật tư cơ khí, vòng bi, dây curoa", "dịch vụ gia công CNC", "sơn tĩnh điện"],
  "04": ["da thuộc, da tổng hợp", "đế giày, phụ liệu", "keo dán công nghiệp", "bao bì đóng gói giày dép"],
  "05": ["vải nguyên liệu các loại", "phụ liệu may: chỉ, nút, khoá kéo", "dịch vụ giặt – wash", "túi đựng, móc treo, nhãn mác"],
  "06": ["bao bì dược phẩm đạt chuẩn", "dịch vụ kiểm nghiệm chất lượng", "thiết bị bảo quản lạnh", "vận chuyển chuyên dụng"],
  "07": ["dịch vụ vận chuyển hành khách", "phòng khách sạn giá đoàn", "suất ăn đoàn", "quà tặng lưu niệm"],
  "08": ["thực phẩm tươi sống theo ngày", "đồ vải khách sạn, khăn – ga – gối", "hoá mỹ phẩm buồng phòng", "tinh dầu và hương thơm không gian"],
  "09": ["giấy in các loại", "mực in – vật tư in", "dịch vụ cán màng, bế hộp", "vận chuyển hàng cồng kềnh"],
  "10": ["hoá chất cơ bản", "thùng phuy – can nhựa chứa", "dịch vụ xử lý chất thải công nghiệp", "vận chuyển hàng nguy hiểm"],
  "11": ["xi măng, cát đá", "sắt thép xây dựng", "dịch vụ vận chuyển vật liệu", "kho bãi tập kết"],
  "12": ["dịch vụ công nghệ – phần mềm quản trị", "dịch vụ pháp lý – thu hồi nợ", "quà tặng tri ân khách hàng", "in ấn ấn phẩm truyền thông"],
  "13": ["phần mềm kế toán – hoá đơn điện tử", "dịch vụ lưu trữ hồ sơ", "văn phòng phẩm chuyên ngành", "đào tạo cập nhật chính sách thuế"],
  "14": ["giấy in, mực in", "thiết bị văn phòng: máy in, máy chiếu", "nội thất văn phòng", "dịch vụ bảo trì thiết bị"],
  "15": ["giấy in, bìa cứng", "dịch vụ in offset số lượng lớn", "vận chuyển – phát hành", "quà tặng kèm sách"],
  "16": ["vật liệu xây dựng, gạch – đá – xi măng", "thiết bị điện – nước công trình", "nội thất gỗ, kính, nhôm", "nhân công thi công thời vụ"],
  "17": ["dịch vụ môi giới – phân phối dự án", "dịch vụ pháp lý bất động sản", "thiết kế nội thất nhà mẫu", "truyền thông – quảng cáo dự án"],
  "18": ["thiết bị điện, dây cáp điện", "linh kiện điện tử", "gas lạnh và vật tư điện lạnh", "dịch vụ lắp đặt – bảo trì"],
  "19": ["hạt nhựa nguyên sinh và tái sinh", "khuôn mẫu ngành nhựa", "dịch vụ ép nhựa gia công", "bao bì đóng gói thành phẩm"],
  "20": ["phụ tùng xe chính hãng", "dầu nhớt – hoá chất bảo dưỡng", "thiết bị sửa chữa gara", "dịch vụ vận chuyển xe"],
  "21": ["dịch vụ tổ chức sự kiện – hội thảo", "in ấn tài liệu đào tạo", "phòng hội nghị theo buổi", "phần mềm quản lý nhân sự"],
  "22": ["dịch vụ khai thuê hải quan", "kho bãi cho thuê", "bảo hiểm hàng hoá", "nhiên liệu – bảo dưỡng đội xe"],
  "23": ["dịch vụ in ấn – sản xuất ấn phẩm", "thiết bị quay chụp, âm thanh ánh sáng", "quà tặng và vật phẩm sự kiện", "địa điểm tổ chức sự kiện"],
  "24": ["nguyên liệu nông sản đầu vào", "bao bì thực phẩm đạt chuẩn", "dịch vụ kiểm nghiệm an toàn thực phẩm", "kho lạnh và vận chuyển lạnh"],
  "25": ["nguyên liệu hoá mỹ phẩm", "chai lọ – bao bì mỹ phẩm", "dịch vụ gia công OEM", "kiểm nghiệm và công bố sản phẩm"],
  "26": ["thiết bị xử lý môi trường", "vật tư tiêu hao ngành nước", "dịch vụ quan trắc – phân tích", "vận chuyển chuyên dụng"],
  "27": ["giống cây trồng – vật nuôi", "phân bón, thức ăn chăn nuôi", "kho lạnh bảo quản", "bao bì nông sản xuất khẩu"],
  "28": ["nguyên liệu vàng bạc, đá quý", "hộp đựng trang sức", "dịch vụ chế tác – đánh bóng", "thiết bị kiểm định"],
  "29": ["văn phòng phẩm", "dịch vụ truyền thông – quảng cáo", "phần mềm quản lý doanh nghiệp", "quà tặng doanh nghiệp"],
};

/** Câu mở đầu cho tin CẦN BÁN theo ngành, để tin đọc tự nhiên hơn. */
export const CACH_CHAO_BAN: Record<string, string> = {
  "01": "Nhận triển khai và cung cấp giải pháp công nghệ",
  "03": "Nhận gia công và cung cấp",
  "05": "Nhận đặt hàng và cung cấp",
  "09": "Nhận in ấn và cung cấp",
  "16": "Nhận thi công và cung cấp",
  "21": "Nhận tư vấn và cung cấp dịch vụ",
  "22": "Nhận vận chuyển và cung cấp dịch vụ",
  "23": "Nhận triển khai và cung cấp dịch vụ",
};
