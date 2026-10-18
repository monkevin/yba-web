/**
 * Test "5 Khí Chất Doanh Nhân" — Ưng · Hổ · Xà · Hồ · Long.
 *
 * Bộ 15 câu và hồ sơ 5 khí chất do anh Đặng Viên Khang soạn cho cộng đồng doanh
 * nhân. Phần diễn giải ở đây viết cho hội viên YBA Chợ Lớn: mỗi khí chất mạnh ở
 * vai trò nào trong doanh nghiệp, nên kết hợp với khí chất nào và đóng góp được
 * gì cho hoạt động của Chi hội.
 */

export type KhiChatKey = "ung" | "ho" | "xa" | "holy" | "long";

export type KhiChatCauHoi = {
  q: string;
  options: { text: string; type: KhiChatKey }[];
};

export type KhiChatType = {
  key: KhiChatKey;
  ten: string;
  danhHieu: string;
  emoji: string;
  anh: string;
  cauNoi: string;
  tongQuan: string;
  theManh: string[];
  luuY: string[];
  vaiTro: string[];
  /// Khí chất bổ trợ tốt nhất khi bắt tay làm ăn
  ketHopVoi: { key: KhiChatKey; vi: string };
  /// Đóng góp phù hợp trong hoạt động Chi hội
  trongHoi: string;
};

/** 15 câu — mỗi lựa chọn ứng một khí chất (A=Ưng B=Hổ C=Xà D=Hồ E=Long). */
export const KHI_CHAT_CAU_HOI: KhiChatCauHoi[] = [
  {
    q: "Khi gặp một cơ hội kinh doanh mới, bạn thường:",
    options: [
      { text: "Nhìn xem 5 năm tới nó đi đến đâu", type: "ung" },
      { text: "Làm thử ngay", type: "ho" },
      { text: "Phân tích rủi ro trước", type: "xa" },
      { text: "Hỏi ý kiến nhiều người", type: "holy" },
      { text: "Xem có thể xây thành mô hình lớn không", type: "long" },
    ],
  },
  {
    q: "Điều khiến bạn hứng thú nhất là:",
    options: [
      { text: "Tương lai", type: "ung" },
      { text: "Chiến thắng", type: "ho" },
      { text: "Chiến lược", type: "xa" },
      { text: "Con người", type: "holy" },
      { text: "Di sản", type: "long" },
    ],
  },
  {
    q: "Trong cuộc họp bạn thường:",
    options: [
      { text: "Đưa góc nhìn tổng thể", type: "ung" },
      { text: "Chốt hành động", type: "ho" },
      { text: "Đặt câu hỏi phản biện", type: "xa" },
      { text: "Kết nối mọi người", type: "holy" },
      { text: "Xây quy trình", type: "long" },
    ],
  },
  {
    q: "Người khác thường nhận xét bạn:",
    options: [
      { text: "Nhìn xa", type: "ung" },
      { text: "Quyết liệt", type: "ho" },
      { text: "Thâm sâu", type: "xa" },
      { text: "Khéo léo", type: "holy" },
      { text: "Lãnh đạo", type: "long" },
    ],
  },
  {
    q: "Bạn thích đọc:",
    options: [
      { text: "Xu hướng tương lai", type: "ung" },
      { text: "Tiểu sử doanh nhân", type: "ho" },
      { text: "Binh pháp", type: "xa" },
      { text: "Tâm lý học", type: "holy" },
      { text: "Quản trị", type: "long" },
    ],
  },
  {
    q: "Điều làm bạn khó chịu nhất:",
    options: [
      { text: "Thiếu tầm nhìn", type: "ung" },
      { text: "Chậm chạp", type: "ho" },
      { text: "Thiếu suy nghĩ", type: "xa" },
      { text: "Xung đột", type: "holy" },
      { text: "Hỗn loạn", type: "long" },
    ],
  },
  {
    q: "Nếu có 1 tỷ đồng:",
    options: [
      { text: "Đầu tư tương lai", type: "ung" },
      { text: "Mở rộng ngay", type: "ho" },
      { text: "Chờ đúng thời điểm", type: "xa" },
      { text: "Tìm đối tác", type: "holy" },
      { text: "Xây hệ thống", type: "long" },
    ],
  },
  {
    q: "Trong nhóm bạn thường là:",
    options: [
      { text: "Người định hướng", type: "ung" },
      { text: "Người dẫn đầu", type: "ho" },
      { text: "Người bày kế", type: "xa" },
      { text: "Người kết nối", type: "holy" },
      { text: "Người tổ chức", type: "long" },
    ],
  },
  {
    q: "Bạn tin thành công đến từ:",
    options: [
      { text: "Nhìn đúng", type: "ung" },
      { text: "Làm mạnh", type: "ho" },
      { text: "Tính đúng", type: "xa" },
      { text: "Quan hệ đúng", type: "holy" },
      { text: "Hệ thống đúng", type: "long" },
    ],
  },
  {
    q: "Bạn mạnh nhất:",
    options: [
      { text: "Quan sát xu hướng", type: "ung" },
      { text: "Hành động", type: "ho" },
      { text: "Phân tích", type: "xa" },
      { text: "Giao tiếp", type: "holy" },
      { text: "Xây dựng đội ngũ", type: "long" },
    ],
  },
  {
    q: "Khi thất bại bạn:",
    options: [
      { text: "Điều chỉnh hướng đi", type: "ung" },
      { text: "Làm lại ngay", type: "ho" },
      { text: "Tìm nguyên nhân", type: "xa" },
      { text: "Tìm người hỗ trợ", type: "holy" },
      { text: "Tái cấu trúc hệ thống", type: "long" },
    ],
  },
  {
    q: "Bạn thích vai trò:",
    options: [
      { text: "Chiến lược", type: "ung" },
      { text: "Tiên phong", type: "ho" },
      { text: "Cố vấn", type: "xa" },
      { text: "Đối ngoại", type: "holy" },
      { text: "Chủ tịch", type: "long" },
    ],
  },
  {
    q: "Môi trường phù hợp với bạn:",
    options: [
      { text: "Đổi mới", type: "ung" },
      { text: "Cạnh tranh", type: "ho" },
      { text: "Đấu trí", type: "xa" },
      { text: "Cộng đồng", type: "holy" },
      { text: "Tập đoàn", type: "long" },
    ],
  },
  {
    q: "Khi ra quyết định:",
    options: [
      { text: "Theo tầm nhìn", type: "ung" },
      { text: "Theo cơ hội", type: "ho" },
      { text: "Theo dữ liệu", type: "xa" },
      { text: "Theo con người", type: "holy" },
      { text: "Theo hệ thống", type: "long" },
    ],
  },
  {
    q: "Mục tiêu cuối cùng của bạn:",
    options: [
      { text: "Dẫn đầu xu hướng", type: "ung" },
      { text: "Chinh phục thị trường", type: "ho" },
      { text: "Làm chủ cuộc chơi", type: "xa" },
      { text: "Được yêu mến và ảnh hưởng", type: "holy" },
      { text: "Để lại di sản", type: "long" },
    ],
  },
];

export const KHI_CHAT: KhiChatType[] = [
  {
    key: "ung",
    ten: "ƯNG",
    danhHieu: "Nhà Chiến Lược — Tầm Nhìn",
    emoji: "🦅",
    anh: "/khi-chat/ung.webp",
    cauNoi: "Ưng không cần bay nhanh nhất, nhưng luôn nhìn thấy xa nhất.",
    tongQuan:
      "Ưng là hình mẫu của tầm nhìn và khả năng nhìn xa trông rộng. Bạn thấy cơ hội trước khi người khác nhận ra, luôn hỏi về tương lai thay vì tranh luận hiện tại, và có khả năng định hướng để dẫn dắt tổ chức đi đúng con đường. Bạn nói ít nhưng trọng tâm — mỗi câu đều có giá trị.",
    theManh: [
      "Tầm nhìn chiến lược vượt trội, nhìn 5–10 năm thay vì 5–10 ngày",
      "Ra quyết định nhanh và chính xác khi đủ dữ liệu",
      "Độc lập, không chạy theo đám đông, có chính kiến",
      "Bình tĩnh trước biến động, truyền cảm hứng bằng tầm nhìn",
    ],
    luuY: [
      "Dễ xa rời chi tiết và khâu thực thi",
      "Đòi hỏi tiêu chuẩn cao, khó hài lòng",
      "Có thể bị hiểu là lạnh lùng, khó gần",
    ],
    vaiTro: ["Chủ doanh nghiệp", "Giám đốc chiến lược", "Nhà đầu tư dài hạn", "Người định hướng tổ chức"],
    ketHopVoi: {
      key: "ho",
      vi: "Ưng nhìn ra hướng đi, Hổ là người xông lên biến hướng đi đó thành kết quả trong quý này. Thiếu Hổ, tầm nhìn của Ưng dễ nằm mãi trên giấy.",
    },
    trongHoi:
      "Ưng hợp vai trò định hướng dài hạn cho Chi hội: góp ý chiến lược nhiệm kỳ, nhìn ra xu hướng ngành để cảnh báo sớm cho anh em hội viên, và dẫn dắt những chương trình mở đường mà kết quả phải vài năm sau mới thấy.",
  },
  {
    key: "ho",
    ten: "HỔ",
    danhHieu: "Nhà Tiên Phong — Chúa Sơn Lâm",
    emoji: "🐯",
    anh: "/khi-chat/ho.webp",
    cauNoi: "Hổ không đi theo dấu chân, Hổ để lại dấu ấn của riêng mình.",
    tongQuan:
      "Hổ là biểu tượng của sức mạnh, uy quyền và năng lượng bùng nổ. Bạn dám nghĩ lớn, dám làm lớn, dám chịu trách nhiệm và bảo vệ đội ngũ của mình. Hổ bước đến đâu thiết lập trật tự và nắm quyền kiểm soát đến đó — hành động nhanh, quyết liệt, thích kết quả, không thích vòng vo.",
    theManh: [
      "Lãnh đạo tự nhiên, tạo ảnh hưởng mạnh",
      "Truyền năng lượng và động lực lớn cho đội ngũ",
      "Dám đối mặt và giải quyết vấn đề khó",
      "Xây đội ngũ kỷ luật, chiếm lĩnh thị trường nhanh",
    ],
    luuY: [
      "Dễ nóng nảy, thiếu kiên nhẫn",
      "Có thể quá quyết liệt, gây áp lực lớn lên người khác",
      "Ít chú ý chi tiết, dễ bỏ qua rủi ro nhỏ",
      "Cần học cách lắng nghe và mềm mỏng hơn",
    ],
    vaiTro: ["Nhà sáng lập", "Giám đốc điều hành", "Giám đốc kinh doanh", "Người mở thị trường mới"],
    ketHopVoi: {
      key: "xa",
      vi: "Hổ lao nhanh, Xà là người tính trước nước cờ và chỉ ra cái bẫy trên đường. Cặp này giúp doanh nghiệp vừa nhanh vừa ít trả học phí.",
    },
    trongHoi:
      "Hổ hợp việc đứng mũi chịu sào: chủ trì chương trình lớn, dẫn đoàn xúc tiến thương mại, đại diện Chi hội thương lượng với đối tác. Ở đâu cần người dám nhận và đẩy việc chạy đúng hạn, ở đó cần Hổ.",
  },
  {
    key: "xa",
    ten: "XÀ",
    danhHieu: "Nhà Mưu Lược — Kiểm Soát",
    emoji: "🐍",
    anh: "/khi-chat/xa.webp",
    cauNoi: "Xà không vội vã, nhưng ra đòn thì trúng đích.",
    tongQuan:
      "Xà là biểu tượng của trí tuệ sắc lạnh, sự kiên nhẫn và khả năng kiểm soát. Bạn nhìn xa nhiều bước, không lộ ý đồ, biết chờ thời cơ hoàn hảo và luôn nắm quyền chủ động. Bình tĩnh như nước, sắc bén như dao — thắng bằng trí tuệ chứ không bằng sức mạnh.",
    theManh: [
      "Tư duy chiến lược sắc bén, luôn có phương án A, B, C",
      "Khả năng dự đoán và chuẩn bị tốt",
      "Kiểm soát rủi ro và cảm xúc xuất sắc",
      "Ra quyết định chính xác, hiệu quả cao",
    ],
    luuY: [
      "Quá thận trọng có thể bỏ lỡ cơ hội lớn",
      "Dễ bị hiểu lầm là lạnh lùng, khó gần",
      "Tư duy quá nhiều lớp khiến hành động chậm lại",
    ],
    vaiTro: ["Cố vấn chiến lược", "Giám đốc đầu tư", "Người phụ trách đàm phán", "Kiểm soát rủi ro"],
    ketHopVoi: {
      key: "holy",
      vi: "Xà tính đúng nước cờ, Hồ là người mở được cánh cửa để nước cờ ấy đi được. Mưu lược cộng quan hệ là tổ hợp rất khó cản.",
    },
    trongHoi:
      "Xà hợp vai trò thẩm định và phản biện: soi kỹ một đề án trước khi Chi hội triển khai, dựng bộ tiêu chí đánh giá, và cố vấn cho hội viên trẻ trong những thương vụ giá trị lớn.",
  },
  {
    key: "holy",
    ten: "HỒ",
    danhHieu: "Nhà Kết Nối — Ngoại Giao",
    emoji: "🦊",
    anh: "/khi-chat/holy.webp",
    cauNoi:
      "Hồ không thắng bằng sức mạnh, mà bằng cách khiến mọi người muốn đi cùng mình.",
    tongQuan:
      "Hồ là biểu tượng của trí tuệ xã hội, sự linh hoạt và khả năng kết nối. Bạn tạo ra những mối quan hệ đôi bên cùng có lợi, biết lắng nghe, thấu hiểu và biến người khác thành đồng minh. Không chỉ nói hay — bạn biết khi nào nên tiến, nên lùi, và tạo giá trị thông qua con người.",
    theManh: [
      "Giao tiếp xuất sắc, tạo thiện cảm nhanh",
      "Mạng lưới quan hệ rộng, biết đúng người vào đúng lúc",
      "Đàm phán khéo léo, dung hòa lợi ích nhiều bên",
      "Tạo ảnh hưởng mà không cần áp đặt",
    ],
    luuY: [
      "Dễ bị hiểu lầm là thiếu quyết đoán",
      "Phụ thuộc nhiều vào quan hệ hơn là hệ thống",
      "Dễ phân tán nếu không có mục tiêu rõ ràng",
    ],
    vaiTro: ["Giám đốc phát triển kinh doanh", "Phụ trách đối ngoại", "Người xây thương hiệu cá nhân", "Kết nối đối tác"],
    ketHopVoi: {
      key: "long",
      vi: "Hồ mở ra quan hệ, Long biến những quan hệ rời rạc ấy thành một hệ sinh thái vận hành được lâu dài.",
    },
    trongHoi:
      "Hồ là khí chất quý nhất cho công tác hội viên và đối ngoại: giới thiệu hội viên với nhau, kết nối Chi hội với các hội bạn, và giữ ấm quan hệ để mạng lưới không nguội đi giữa hai kỳ sinh hoạt.",
  },
  {
    key: "long",
    ten: "LONG",
    danhHieu: "Nhà Kiến Tạo — Người Tạo Thời Thế",
    emoji: "🐲",
    anh: "/khi-chat/long.webp",
    cauNoi: "Long không chạy theo thời thế — Long tạo ra thời thế.",
    tongQuan:
      "Long là biểu tượng của sự hội tụ và kiến tạo. Bạn biết khi nào dùng tầm nhìn của Ưng, sức mạnh của Hổ, mưu lược của Xà và sự linh hoạt của Hồ để tạo nên sức mạnh tổng hợp lớn nhất. Bạn xây hệ thống bền vững, phát triển con người và hướng tới di sản vượt thời gian.",
    theManh: [
      "Tầm nhìn xa và khả năng tạo thời thế",
      "Huy động và tổng hợp nguồn lực lớn",
      "Dẫn dắt đội ngũ, truyền cảm hứng mạnh",
      "Xây hệ thống bền vững, tạo giá trị dài hạn",
    ],
    luuY: [
      "Dễ cô đơn ở tầm cao nếu thiếu người đồng hành tin cậy",
      "Áp lực và trách nhiệm rất lớn",
      "Dễ tập trung vào bức tranh lớn mà bỏ sót chi tiết vận hành",
    ],
    vaiTro: ["Chủ tịch", "Nhà sáng lập hệ thống", "Nhà đầu tư chiến lược", "Người cố vấn thế hệ sau"],
    ketHopVoi: {
      key: "ung",
      vi: "Long xây được hệ thống, Ưng là người bảo đảm hệ thống ấy đang đi đúng hướng của mười năm tới chứ không chỉ của năm nay.",
    },
    trongHoi:
      "Long hợp vai trò kiến tạo nền nếp cho Chi hội: xây quy chế, chuẩn hóa hoạt động để nhiệm kỳ sau kế thừa được, và dìu dắt lớp doanh nhân trẻ trở thành người kế cận.",
  },
];
