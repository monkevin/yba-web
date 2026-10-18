/**
 * Nội dung chữ nghĩa cho "Chân dung doanh nhân" — thần số học, tử vi tham khảo
 * và trắc nghiệm tính cách.
 *
 * Toàn bộ diễn giải viết cho NGƯỜI CHỦ DOANH NGHIỆP: cách ra quyết định, cách
 * dựng đội ngũ, cách đàm phán và kết nối trong Hội. Không gắn với ngành hàng
 * hay thương hiệu cụ thể nào.
 *
 * Muốn sửa câu chữ: sửa thẳng file này rồi build lại.
 */

export type ThanSoEntry = {
  so: number;
  tieuDe: string;
  tongQuan: string;
  theManh: string[];
  luuY: string[];
  phongCachKinhDoanh: string;
  loiKhuyen: string;
};

export type ConGiap = {
  chi: string;
  ten: string;
  emoji: string;
  tinhCach: string;
  phongCachLamViec: string;
};

export type NapAmEntry = {
  canChi: string;
  tenNapAm: string;
  nguHanh: "Kim" | "Mộc" | "Thủy" | "Hỏa" | "Thổ";
};

export type MenhInfo = {
  nguHanh: "Kim" | "Mộc" | "Thủy" | "Hỏa" | "Thổ";
  moTa: string;
  mauHop: string[];
  mauTranh: string[];
  /// Gợi ý dùng màu bản mệnh trong công việc kinh doanh
  ungDung: string;
};

export type TinhCachCauHoi = {
  q: string;
  options: { text: string; type: "lua" | "gio" | "dat" | "nuoc" }[];
};

export type TinhCachType = {
  key: "lua" | "gio" | "dat" | "nuoc";
  ten: string;
  emoji: string;
  motCau: string;
  tongQuan: string;
  theManh: string[];
  luuY: string[];
  phongCachKinhDoanh: string;
  /// Cách làm việc với một đối tác thuộc nhóm này
  lamViecVoi: string;
  /// Hoạt động trong Chi hội mà nhóm này phát huy tốt nhất
  hopVoiHoatDong: string[];
};

// ═══════════════════════════════════════════════════════════════
// THẦN SỐ HỌC — số chủ đạo 1–9, 11, 22
// ═══════════════════════════════════════════════════════════════

export const THAN_SO: ThanSoEntry[] = [
  {
    so: 1,
    tieuDe: "Người mở đường",
    tongQuan:
      "Số 1 là năng lượng của người khởi sự. Bạn thuộc kiểu chủ doanh nghiệp không chờ thị trường rõ ràng mới bước vào — bạn bước vào rồi làm cho nó rõ ràng. Quyết định của bạn nhanh, trách nhiệm bạn tự gánh, và bạn hiếm khi đổ lỗi cho hoàn cảnh. Chính sự tự tin ấy khiến nhân viên và đối tác yên tâm đi theo, kể cả những lúc con đường phía trước chưa ai đi qua.",
    theManh: [
      "Dám khởi sự khi người khác còn cân nhắc",
      "Ra quyết định nhanh và tự chịu trách nhiệm",
      "Đặt tiêu chuẩn cho đội ngũ bằng chính việc mình làm",
      "Không dựa dẫm, tự tìm ra lối đi riêng cho doanh nghiệp",
    ],
    luuY: [
      "Quyết nhanh nên đôi khi thiếu dữ liệu, dễ trả học phí đắt",
      "Khó giao việc vì tin rằng mình làm sẽ nhanh hơn",
      "Nghe góp ý trái chiều dễ tự ái, làm cấp dưới ngại nói thật",
    ],
    phongCachKinhDoanh:
      "Bạn kinh doanh bằng tốc độ và sự dứt khoát: thấy cơ hội là chốt, thấy sai là dừng, ít khi để một quyết định treo lơ lửng làm mất nhịp cả bộ máy.",
    loiKhuyen:
      "Hãy xây quanh mình một người dám nói ngược. Tốc độ của bạn cộng với một tiếng nói phản biện đáng tin là công thức giúp doanh nghiệp đi nhanh mà không đi lệch.",
  },
  {
    so: 2,
    tieuDe: "Người kết nối",
    tongQuan:
      "Số 2 là năng lượng của sự hòa hợp. Bạn đọc được không khí một cuộc họp trước khi ai nói câu nào, biết ai đang giữ ý và ai đang thật lòng. Trong kinh doanh, thế mạnh này biến thành khả năng giữ đối tác lâu dài và hòa giải những xung đột mà người khác phải cắt đứt quan hệ mới xong. Bạn không phải người ồn ào nhất trong phòng, nhưng thường là người được cả phòng tin.",
    theManh: [
      "Đọc được ý người đối diện, đàm phán bằng thấu hiểu",
      "Giữ quan hệ đối tác bền, ít khi đứt gãy",
      "Hòa giải mâu thuẫn nội bộ trước khi nó thành chuyện lớn",
      "Xây được đội ngũ gắn bó, tỉ lệ nghỉ việc thấp",
    ],
    luuY: [
      "Ngại ra điều kiện cứng nên dễ chịu thiệt trong thương lượng giá",
      "Quyết định chậm vì muốn mọi người cùng đồng thuận",
      "Nhận quá nhiều việc vì khó nói lời từ chối",
    ],
    phongCachKinhDoanh:
      "Bạn kinh doanh bằng quan hệ: hợp đồng đến từ niềm tin đã gây dựng nhiều năm, và khách hàng cũ giới thiệu khách mới còn nhiều hơn mọi kênh quảng cáo cộng lại.",
    loiKhuyen:
      "Hãy đặt sẵn giới hạn trước mỗi cuộc thương lượng và giữ đúng giới hạn đó. Người ta quý sự tử tế của bạn, nhưng chỉ tôn trọng lâu dài khi thấy bạn có ranh giới rõ ràng.",
  },
  {
    so: 3,
    tieuDe: "Người truyền cảm hứng",
    tongQuan:
      "Số 3 là năng lượng của sáng tạo và biểu đạt. Bạn kể câu chuyện doanh nghiệp hay hơn hầu hết mọi người, làm không khí một buổi gặp trở nên nhẹ nhõm và khiến người nghe muốn đồng hành. Thương hiệu của bạn thường có màu sắc riêng, không lẫn với ai. Đây là lợi thế lớn ở thời mà sản phẩm dễ bị sao chép nhưng câu chuyện thì không.",
    theManh: [
      "Truyền thông và kể chuyện thương hiệu tự nhiên, có duyên",
      "Nghĩ ra hướng đi mới khi thị trường bão hòa",
      "Tạo năng lượng tích cực, đội ngũ làm việc hào hứng",
      "Mở rộng quan hệ nhanh, đi đâu cũng có người nhớ",
    ],
    luuY: [
      "Nhiều ý tưởng nhưng ít ý tưởng được làm tới nơi tới chốn",
      "Ngại phần số liệu, quy trình, giấy tờ — chỗ dễ phát sinh rủi ro nhất",
      "Hứa trong lúc hào hứng rồi quên, làm giảm uy tín tích lũy",
    ],
    phongCachKinhDoanh:
      "Bạn kinh doanh bằng câu chuyện và hình ảnh: khách hàng chọn bạn không chỉ vì sản phẩm mà vì họ thích cái cách bạn làm nghề và muốn được gắn tên mình vào đó.",
    loiKhuyen:
      "Hãy chọn đúng một ý tưởng lớn mỗi năm và giao cho một người kỷ luật theo sát tiến độ. Sức sáng tạo của bạn chỉ thành tiền khi có ai đó giữ nhịp thực thi.",
  },
  {
    so: 4,
    tieuDe: "Người xây nền",
    tongQuan:
      "Số 4 là năng lượng của nền móng. Bạn xây doanh nghiệp theo lối chậm mà chắc: quy trình rõ, sổ sách sạch, cam kết với khách là giữ. Trong những giai đoạn thị trường khó, doanh nghiệp của bạn thường là loại trụ được lâu nhất, vì nó không được dựng lên bằng may mắn. Đối tác làm ăn với bạn một lần rồi thường gắn bó rất lâu.",
    theManh: [
      "Vận hành kỷ luật, quy trình rõ ràng, ít sai sót",
      "Giữ chữ tín tuyệt đối, đối tác yên tâm giao việc lớn",
      "Quản trị dòng tiền và chi phí chặt chẽ",
      "Bền bỉ qua giai đoạn khó, không bỏ cuộc giữa chừng",
    ],
    luuY: [
      "Cứng nhắc với cái mới, dễ chậm chân khi thị trường đổi",
      "Đòi hỏi sự chỉn chu khiến cấp dưới áp lực",
      "Quá tập trung vào vận hành mà ít dành thời gian nghĩ đường dài",
    ],
    phongCachKinhDoanh:
      "Bạn kinh doanh bằng độ tin cậy: khách hàng chọn bạn vì biết chắc chất lượng và tiến độ, chứ không vì lời chào hàng hoa mỹ.",
    loiKhuyen:
      "Mỗi quý hãy dành trọn một ngày ra khỏi guồng vận hành để nhìn lại mô hình kinh doanh. Nền móng vững chỉ có giá trị khi ngôi nhà được xây đúng hướng.",
  },
  {
    so: 5,
    tieuDe: "Người xoay chuyển",
    tongQuan:
      "Số 5 là năng lượng của tự do và thích nghi. Bạn chán sự lặp lại, giỏi đánh hơi xu hướng và không sợ đổi mô hình khi thấy hướng cũ hết dư địa. Nhiều doanh nghiệp chết vì cố giữ cái đã từng thành công — đó là cái bẫy bạn ít khi mắc. Bạn cũng là kiểu người quen biết rộng, thông tin thị trường đến tai bạn sớm hơn người khác.",
    theManh: [
      "Nhạy xu hướng, chuyển hướng kinh doanh nhanh khi cần",
      "Quan hệ rộng, nguồn thông tin thị trường đa dạng",
      "Xoay xở tốt trong khủng hoảng, ít khi bế tắc",
      "Giao tiếp tự nhiên với mọi kiểu đối tác",
    ],
    luuY: [
      "Đổi hướng liên tục khiến đội ngũ mất phương hướng",
      "Chán khâu vận hành lặp lại — chỗ tạo ra phần lớn lợi nhuận",
      "Làm theo hứng nên kết quả kinh doanh lên xuống thất thường",
    ],
    phongCachKinhDoanh:
      "Bạn kinh doanh bằng sự nhanh nhạy: nắm cơ hội sớm, thử nhanh, sai thì bỏ, đúng thì nhân lên — hiếm khi mắc kẹt trong một mô hình đã hết thời.",
    loiKhuyen:
      "Hãy cam kết giữ nguyên một hướng đi ít nhất trong 12 tháng trước khi đánh giá lại. Sự linh hoạt chỉ sinh lời khi có đủ thời gian để một hướng đi kịp cho quả.",
  },
  {
    so: 6,
    tieuDe: "Người dựng tổ ấm",
    tongQuan:
      "Số 6 là năng lượng của trách nhiệm và chăm sóc. Bạn coi nhân viên như người nhà, nhớ tên vợ con của người làm lâu năm, và thấy áy náy thật sự khi phải cắt giảm. Doanh nghiệp của bạn thường có văn hóa ấm, người giỏi ở lại lâu. Với khách hàng cũng vậy: bạn phục vụ quá mức cam kết, và đó là lý do họ không đi đâu khác.",
    theManh: [
      "Giữ người giỏi rất tốt, đội ngũ trung thành",
      "Chăm sóc khách hàng vượt mức mong đợi",
      "Có gu thẩm mỹ, sản phẩm và không gian đều chỉn chu",
      "Được cộng đồng quý mến, dễ nhận được hỗ trợ khi khó khăn",
    ],
    luuY: [
      "Nể nang nên chậm thay người không còn phù hợp",
      "Ôm việc của cấp dưới, tự làm mình quá tải",
      "Nhận lời phàn nàn về sản phẩm như lời trách cá nhân",
    ],
    phongCachKinhDoanh:
      "Bạn kinh doanh bằng sự tận tâm: khách quay lại vì được đối đãi tử tế, nhân viên ở lại vì thấy mình được coi trọng — hai thứ tiền không mua được.",
    loiKhuyen:
      "Hãy tách bạch giữa quý một con người và đánh giá đúng năng lực họ ở vị trí đó. Giữ người sai chỗ là thiệt cho cả doanh nghiệp lẫn chính người ấy.",
  },
  {
    so: 7,
    tieuDe: "Người tìm chiều sâu",
    tongQuan:
      "Số 7 là năng lượng của phân tích và chiều sâu. Bạn không tin vào cảm tính, muốn hiểu bản chất trước khi bỏ tiền. Trong khi nhiều người chạy theo phong trào, bạn ngồi lại đọc số liệu và thường nhận ra chỗ bất ổn mà đám đông chưa thấy. Bạn nói ít, nhưng khi bạn kết luận điều gì thì người trong ngành lắng nghe.",
    theManh: [
      "Phân tích thị trường và đối thủ sâu, ít bị dẫn dắt bởi phong trào",
      "Am hiểu chuyên môn tới tận gốc, khó ai qua mặt",
      "Bình tĩnh trước tin đồn và biến động ngắn hạn",
      "Quyết định đầu tư dựa trên dữ liệu nên tỉ lệ sai thấp",
    ],
    luuY: [
      "Phân tích quá lâu, cơ hội trôi mất trước khi ra quyết định",
      "Kiệm lời nên đội ngũ khó đoán ý, dễ làm sai hướng",
      "Ngại giao tiếp xã giao — chỗ nhiều cơ hội kinh doanh xuất hiện",
    ],
    phongCachKinhDoanh:
      "Bạn kinh doanh bằng chuyên môn: đối tác tin bạn vì mỗi nhận định của bạn đều có căn cứ, và bạn thẳng thắn nói không khi thấy phương án không ổn.",
    loiKhuyen:
      "Hãy tự đặt hạn chót cho mỗi quyết định lớn — quá hạn thì chốt với dữ liệu đang có. Trong kinh doanh, một quyết định đúng 80% đưa ra đúng lúc thắng một quyết định đúng 100% đưa ra quá muộn.",
  },
  {
    so: 8,
    tieuDe: "Người nắm mục tiêu",
    tongQuan:
      "Số 8 là năng lượng của quyền lực và thành quả. Bạn thực tế, nghĩ bằng con số và nhìn ra giá trị của một thương vụ rất nhanh. Mục tiêu tăng trưởng với bạn không phải áp lực mà là trò chơi. Bạn cũng là kiểu người nghĩ lớn: mới làm một điểm bán đã hình dung cả chuỗi, mới bán trong nước đã tính đường xuất khẩu.",
    theManh: [
      "Tư duy con số tốt, kiểm soát hiệu quả tài chính chặt",
      "Đàm phán mạnh, ít khi chịu phần thiệt",
      "Đặt mục tiêu cao và có kỷ luật đi đến cùng",
      "Nhìn ra cơ hội mở rộng quy mô sớm hơn người khác",
    ],
    luuY: [
      "Đặt kết quả trên con người, đội ngũ dễ kiệt sức",
      "Ôm nhiều mục tiêu cùng lúc làm nguồn lực bị dàn mỏng",
      "Khó chấp nhận thất bại, chậm dừng một dự án đã hỏng",
    ],
    phongCachKinhDoanh:
      "Bạn kinh doanh bằng chiến lược và con số: mỗi quyết định đều quy ra được lợi nhuận, dòng tiền và thời gian hoàn vốn.",
    loiKhuyen:
      "Hãy đặt thêm một chỉ số phi tài chính vào bảng theo dõi hằng tháng — mức độ gắn bó của đội ngũ chẳng hạn. Doanh nghiệp lớn nhanh mà người rời đi liên tục thì không giữ được thành quả.",
  },
  {
    so: 9,
    tieuDe: "Người cho đi",
    tongQuan:
      "Số 9 là năng lượng của lý tưởng và lòng bao dung. Bạn làm kinh doanh nhưng luôn có một phần hướng ra cộng đồng: tạo việc làm, hỗ trợ người khó, đóng góp cho ngành. Tầm nhìn của bạn rộng, ít khi bị chuyện nhỏ làm bận tâm. Đây cũng là lý do bạn được nhiều người kính trọng, và uy tín ấy mở ra những cánh cửa mà tiền không mở được.",
    theManh: [
      "Uy tín cộng đồng cao, được nhiều người sẵn lòng giúp",
      "Nhìn dài hạn, không chạy theo lợi nhuận ngắn hạn bằng mọi giá",
      "Truyền được lý tưởng cho đội ngũ, người giỏi tìm đến",
      "Rộng lượng với đối tác nên hợp tác thường bền",
    ],
    luuY: [
      "Dễ nhẹ tay khi cần đòi quyền lợi chính đáng",
      "Ôm việc cộng đồng nhiều tới mức doanh nghiệp thiếu người cầm lái",
      "Kỳ vọng cao vào con người nên hay thất vọng",
    ],
    phongCachKinhDoanh:
      "Bạn kinh doanh bằng giá trị: khách hàng và đối tác chọn bạn vì tin vào điều bạn theo đuổi, chứ không đơn thuần vì giá tốt hơn vài phần trăm.",
    loiKhuyen:
      "Hãy đặt ra tỉ lệ thời gian rõ ràng cho việc cộng đồng và giữ đúng. Doanh nghiệp khỏe thì phần đóng góp cho xã hội mới bền — đó không phải ích kỷ mà là trách nhiệm.",
  },
  {
    so: 11,
    tieuDe: "Người dẫn đường (số chủ)",
    tongQuan:
      "Số 11 là số chủ — mang năng lượng của số 2 nhưng ở cường độ cao hơn nhiều. Bạn có trực giác mạnh, thường cảm nhận được xu hướng hoặc con người trước khi có bằng chứng. Nhiều quyết định lớn của bạn xuất phát từ linh cảm và về sau chứng minh là đúng. Cùng với đó là sự nhạy cảm: bạn chịu áp lực tinh thần nặng hơn người khác trong cùng một hoàn cảnh.",
    theManh: [
      "Trực giác tốt về con người và thời điểm",
      "Truyền cảm hứng mạnh, người khác dễ tin và đi theo",
      "Nhìn ra ý nghĩa lớn phía sau công việc thường ngày",
      "Nhạy với thay đổi của thị trường trước khi nó rõ ràng",
    ],
    luuY: [
      "Nhạy cảm quá mức, dễ căng thẳng và mất ngủ vì công việc",
      "Kỳ vọng cao vào bản thân, khó tha thứ cho chính mình khi sai",
      "Trực giác không phải lúc nào cũng đúng — cần số liệu đối chiếu",
    ],
    phongCachKinhDoanh:
      "Bạn kinh doanh bằng tầm nhìn và cảm nhận: đi trước thị trường một nhịp, và thuyết phục người khác bằng niềm tin chứ không chỉ bằng bảng tính.",
    loiKhuyen:
      "Hãy tập thói quen viết linh cảm của mình ra giấy rồi kiểm chứng bằng dữ liệu trong vòng một tuần. Trực giác được kiểm chứng thường xuyên sẽ thành năng lực thật sự, không còn là may rủi.",
  },
  {
    so: 22,
    tieuDe: "Người kiến tạo (số chủ)",
    tongQuan:
      "Số 22 là số chủ mạnh nhất — kết hợp tầm nhìn của số 11 với khả năng thực thi của số 4. Bạn không chỉ nghĩ lớn mà còn biết chia nhỏ giấc mơ thành từng bước làm được. Những người mang số này thường xây được thứ tồn tại lâu hơn chính họ: một hệ thống, một thương hiệu, một tổ chức. Đổi lại, gánh nặng trách nhiệm bạn mang cũng lớn hơn người khác.",
    theManh: [
      "Biến tầm nhìn lớn thành kế hoạch thực thi cụ thể",
      "Huy động được nguồn lực và con người cho việc lớn",
      "Vừa nghĩ đường dài vừa nắm được chi tiết vận hành",
      "Xây hệ thống bền vững, không phụ thuộc vào một cá nhân",
    ],
    luuY: [
      "Ôm quá nhiều trọng trách, dễ kiệt sức âm thầm",
      "Tiêu chuẩn cao khiến người xung quanh thấy khó theo",
      "Khó buông bỏ một dự án lớn ngay cả khi nó không còn khả thi",
    ],
    phongCachKinhDoanh:
      "Bạn kinh doanh bằng hệ thống: xây bộ máy chạy được khi mình vắng mặt, và đo thành công bằng thứ để lại chứ không bằng doanh số một năm.",
    loiKhuyen:
      "Hãy chủ động tìm cho mình một người cố vấn ngang tầm để trao đổi. Người gánh việc lớn mà không có ai để nói chuyện thật lòng thường gục ở chặng giữa.",
  },
];

// ═══════════════════════════════════════════════════════════════
// TỬ VI THAM KHẢO — con giáp, nạp âm, ngũ hành
// ═══════════════════════════════════════════════════════════════

export const CON_GIAP: ConGiap[] = [
  {
    chi: "Tý",
    ten: "Chuột",
    emoji: "🐭",
    tinhCach:
      "Người tuổi Tý nhanh nhẹn, tinh tế và giỏi quan sát. Họ nhạy với cơ hội, tính toán chu đáo và luôn có phương án dự phòng. Trong giao tiếp, họ hoạt ngôn, dễ tạo thiện cảm và biết lắng nghe. Đôi khi họ lo xa hơn mức cần thiết, nhưng chính sự cẩn trọng ấy giúp họ ít khi bị bất ngờ trước thay đổi.",
    phongCachLamViec:
      "Ra quyết định nhanh, xoay chuyển linh hoạt khi tình hình đổi chiều. Mạnh ở khâu tìm nguồn hàng, thương lượng giá và giữ quan hệ đối tác.",
  },
  {
    chi: "Sửu",
    ten: "Trâu",
    emoji: "🐃",
    tinhCach:
      "Người tuổi Sửu bền bỉ, đáng tin và trọng chữ tín. Họ không thích phô trương, làm việc gì cũng chắc chắn, đến nơi đến chốn. Sự điềm tĩnh của họ tạo cảm giác an tâm cho người xung quanh. Điểm cần lưu ý là họ hơi cứng nhắc khi phải thay đổi kế hoạch, nhưng một khi đã nhận việc thì hiếm khi bỏ dở giữa chừng.",
    phongCachLamViec:
      "Vận hành kỷ luật, giữ tiến độ đều đặn qua từng giai đoạn. Mạnh ở sản xuất, quản lý chất lượng và những cam kết dài hạn với khách lớn.",
  },
  {
    chi: "Dần",
    ten: "Hổ",
    emoji: "🐯",
    tinhCach:
      "Người tuổi Dần mạnh mẽ, quyết đoán và giàu năng lượng. Họ dám nghĩ dám làm, không ngại đứng ra gánh vác khi tập thể cần. Sự tự tin của họ dễ truyền cảm hứng cho người khác. Tuy vậy, đôi lúc họ nóng vội và muốn mọi thứ theo ý mình; nếu chịu khó lắng nghe thêm, uy tín của họ sẽ càng thêm vững vàng.",
    phongCachLamViec:
      "Dẫn dắt trực diện, quyết nhanh, thích thị trường có cạnh tranh. Mạnh ở mở thị trường mới và những giai đoạn doanh nghiệp cần bứt phá.",
  },
  {
    chi: "Mão",
    ten: "Mèo",
    emoji: "🐱",
    tinhCach:
      "Người tuổi Mão nhẹ nhàng, tinh tế và chu đáo. Họ để ý những chi tiết nhỏ mà người khác dễ bỏ qua, cư xử khéo léo nên được lòng nhiều người. Họ chuộng sự hài hòa, ngại va chạm, đôi khi giữ ý kiến trong lòng thay vì nói thẳng. Khi được tin tưởng, họ là người đồng hành ân cần và đáng tin cậy bậc nhất.",
    phongCachLamViec:
      "Làm việc tỉ mỉ, coi trọng trải nghiệm khách hàng và hình ảnh thương hiệu. Mạnh ở ngành dịch vụ, thiết kế và những nghề đòi hỏi gu thẩm mỹ.",
  },
  {
    chi: "Thìn",
    ten: "Rồng",
    emoji: "🐉",
    tinhCach:
      "Người tuổi Thìn giàu hoài bão, tự tin và có sức hút riêng. Họ suy nghĩ lớn, thích đặt mục tiêu cao và sẵn sàng dốc sức vì điều mình tin. Nhiệt huyết của họ dễ lan tỏa sang người xung quanh. Đôi khi họ cầu toàn và tự đặt áp lực nặng lên bản thân; học cách kiên nhẫn với chính mình sẽ giúp họ đi xa hơn.",
    phongCachLamViec:
      "Đặt mục tiêu tham vọng và kéo cả đội ngũ theo. Mạnh ở việc gọi vốn, mở rộng quy mô và dẫn dắt những dự án cần người truyền lửa.",
  },
  {
    chi: "Tỵ",
    ten: "Rắn",
    emoji: "🐍",
    tinhCach:
      "Người tuổi Tỵ sâu sắc, điềm tĩnh và có trực giác tốt. Họ quan sát kỹ trước khi hành động, nói ít nhưng lời nói thường có trọng lượng. Gu thẩm mỹ của họ tinh tế, chuộng sự thanh lịch kín đáo. Vì kín tiếng nên đôi khi họ bị hiểu nhầm là xa cách, nhưng với người thân thiết, họ chân thành và chu đáo hiếm thấy.",
    phongCachLamViec:
      "Tính kỹ rồi mới xuống tiền, quyết định dựa trên phân tích. Mạnh ở đầu tư, quản trị rủi ro và các cuộc đàm phán giá trị lớn.",
  },
  {
    chi: "Ngọ",
    ten: "Ngựa",
    emoji: "🐴",
    tinhCach:
      "Người tuổi Ngọ phóng khoáng, lạc quan và tràn đầy sức sống. Họ thích vận động, ghét sự trì trệ, đi đến đâu cũng mang theo không khí vui vẻ. Tinh thần tự do giúp họ thích nghi nhanh với môi trường mới. Điểm cần lưu ý là họ dễ hào hứng lúc đầu rồi giảm nhiệt về sau; giữ được sự bền bỉ thì khó ai theo kịp họ.",
    phongCachLamViec:
      "Năng động, đi nhiều gặp nhiều, mở rộng mạng lưới rất nhanh. Mạnh ở phát triển thị trường, phân phối và các mảng cần đi lại thường xuyên.",
  },
  {
    chi: "Mùi",
    ten: "Dê",
    emoji: "🐐",
    tinhCach:
      "Người tuổi Mùi hiền hòa, tình cảm và giàu lòng vị tha. Họ sống chan hòa, hay nghĩ cho người khác, tạo cảm giác dễ chịu khi làm việc cùng. Óc thẩm mỹ của họ tốt, yêu cái đẹp nhẹ nhàng, hài hòa. Họ đôi khi thiếu quyết đoán vì ngại làm mất lòng, nhưng bù lại luôn được đồng đội quý mến và tin cậy.",
    phongCachLamViec:
      "Điều hành mềm mỏng, giữ hòa khí và văn hóa doanh nghiệp. Mạnh ở ngành chăm sóc con người, giáo dục, sức khỏe và dịch vụ tận tâm.",
  },
  {
    chi: "Thân",
    ten: "Khỉ",
    emoji: "🐵",
    tinhCach:
      "Người tuổi Thân thông minh, hoạt bát và giàu ý tưởng. Họ học nhanh, xoay xở giỏi, gặp vấn đề khó thường tìm ra cách giải quyết bất ngờ. Sự dí dỏm giúp họ dễ hòa nhập với mọi nhóm, mọi hoàn cảnh. Đôi khi họ ôm nhiều việc cùng lúc nên dễ phân tán; biết chọn việc trọng tâm thì hiệu quả sẽ vượt trội.",
    phongCachLamViec:
      "Sáng tạo, tìm cách làm mới thay vì đi lối mòn. Mạnh ở đổi mới sản phẩm, ứng dụng công nghệ và gỡ những nút thắt vận hành khó.",
  },
  {
    chi: "Dậu",
    ten: "Gà",
    emoji: "🐓",
    tinhCach:
      "Người tuổi Dậu chỉn chu, thẳng thắn và có trách nhiệm cao. Họ chuộng sự rõ ràng, làm việc có kế hoạch và để ý từng chi tiết nhỏ. Ngoại hình, tác phong của họ thường gọn gàng, lịch sự, tạo ấn tượng chuyên nghiệp. Tính thẳng của họ đôi khi làm người khác chạnh lòng, nhưng ai hiểu rồi sẽ quý sự chân thật ấy.",
    phongCachLamViec:
      "Ngăn nắp, đúng hẹn, chuộng quy trình và số liệu rõ ràng. Mạnh ở tài chính kế toán, kiểm soát chất lượng và chuẩn hóa hệ thống.",
  },
  {
    chi: "Tuất",
    ten: "Chó",
    emoji: "🐕",
    tinhCach:
      "Người tuổi Tuất trung thực, tận tâm và trọng nghĩa tình. Họ đã nhận lời thì giữ lời, đã tin ai thì hết lòng đồng hành. Sự chân thành khiến họ trở thành chỗ dựa tin cậy của tập thể. Họ đôi khi lo lắng hơi nhiều và khắt khe với bản thân; được ghi nhận đúng lúc, họ càng gắn bó và cống hiến hết mình.",
    phongCachLamViec:
      "Làm việc tận tụy, đặt lợi ích chung lên trước lợi ích riêng. Mạnh ở giữ đội ngũ, xây văn hóa và những hợp tác cần chữ tín lâu dài.",
  },
  {
    chi: "Hợi",
    ten: "Heo",
    emoji: "🐷",
    tinhCach:
      "Người tuổi Hợi chân thành, rộng rãi và dễ mến. Họ sống đơn giản, không toan tính thiệt hơn, sẵn lòng giúp đỡ khi người khác cần. Sự lạc quan của họ khiến không khí chung lúc nào cũng nhẹ nhõm. Vì hay tin người nên đôi lúc họ chịu thiệt; song chính sự tử tế ấy lại mang đến cho họ nhiều quý nhân trong đời.",
    phongCachLamViec:
      "Hợp tác thoải mái, ít so đo hơn thua nên dễ có bạn hàng. Mạnh ở những mô hình cần liên kết nhiều bên và giữ quan hệ lâu năm.",
  },
];

export const NAP_AM: NapAmEntry[] = [
  { canChi: "Giáp Tý – Ất Sửu", tenNapAm: "Hải Trung Kim", nguHanh: "Kim" },
  { canChi: "Bính Dần – Đinh Mão", tenNapAm: "Lư Trung Hỏa", nguHanh: "Hỏa" },
  { canChi: "Mậu Thìn – Kỷ Tỵ", tenNapAm: "Đại Lâm Mộc", nguHanh: "Mộc" },
  { canChi: "Canh Ngọ – Tân Mùi", tenNapAm: "Lộ Bàng Thổ", nguHanh: "Thổ" },
  { canChi: "Nhâm Thân – Quý Dậu", tenNapAm: "Kiếm Phong Kim", nguHanh: "Kim" },
  { canChi: "Giáp Tuất – Ất Hợi", tenNapAm: "Sơn Đầu Hỏa", nguHanh: "Hỏa" },
  { canChi: "Bính Tý – Đinh Sửu", tenNapAm: "Giản Hạ Thủy", nguHanh: "Thủy" },
  { canChi: "Mậu Dần – Kỷ Mão", tenNapAm: "Thành Đầu Thổ", nguHanh: "Thổ" },
  { canChi: "Canh Thìn – Tân Tỵ", tenNapAm: "Bạch Lạp Kim", nguHanh: "Kim" },
  { canChi: "Nhâm Ngọ – Quý Mùi", tenNapAm: "Dương Liễu Mộc", nguHanh: "Mộc" },
  { canChi: "Giáp Thân – Ất Dậu", tenNapAm: "Tuyền Trung Thủy", nguHanh: "Thủy" },
  { canChi: "Bính Tuất – Đinh Hợi", tenNapAm: "Ốc Thượng Thổ", nguHanh: "Thổ" },
  { canChi: "Mậu Tý – Kỷ Sửu", tenNapAm: "Tích Lịch Hỏa", nguHanh: "Hỏa" },
  { canChi: "Canh Dần – Tân Mão", tenNapAm: "Tùng Bách Mộc", nguHanh: "Mộc" },
  { canChi: "Nhâm Thìn – Quý Tỵ", tenNapAm: "Trường Lưu Thủy", nguHanh: "Thủy" },
  { canChi: "Giáp Ngọ – Ất Mùi", tenNapAm: "Sa Trung Kim", nguHanh: "Kim" },
  { canChi: "Bính Thân – Đinh Dậu", tenNapAm: "Sơn Hạ Hỏa", nguHanh: "Hỏa" },
  { canChi: "Mậu Tuất – Kỷ Hợi", tenNapAm: "Bình Địa Mộc", nguHanh: "Mộc" },
  { canChi: "Canh Tý – Tân Sửu", tenNapAm: "Bích Thượng Thổ", nguHanh: "Thổ" },
  { canChi: "Nhâm Dần – Quý Mão", tenNapAm: "Kim Bạch Kim", nguHanh: "Kim" },
  { canChi: "Giáp Thìn – Ất Tỵ", tenNapAm: "Phúc Đăng Hỏa", nguHanh: "Hỏa" },
  { canChi: "Bính Ngọ – Đinh Mùi", tenNapAm: "Thiên Hà Thủy", nguHanh: "Thủy" },
  { canChi: "Mậu Thân – Kỷ Dậu", tenNapAm: "Đại Trạch Thổ", nguHanh: "Thổ" },
  { canChi: "Canh Tuất – Tân Hợi", tenNapAm: "Thoa Xuyến Kim", nguHanh: "Kim" },
  { canChi: "Nhâm Tý – Quý Sửu", tenNapAm: "Tang Đố Mộc", nguHanh: "Mộc" },
  { canChi: "Giáp Dần – Ất Mão", tenNapAm: "Đại Khê Thủy", nguHanh: "Thủy" },
  { canChi: "Bính Thìn – Đinh Tỵ", tenNapAm: "Sa Trung Thổ", nguHanh: "Thổ" },
  { canChi: "Mậu Ngọ – Kỷ Mùi", tenNapAm: "Thiên Thượng Hỏa", nguHanh: "Hỏa" },
  { canChi: "Canh Thân – Tân Dậu", tenNapAm: "Thạch Lựu Mộc", nguHanh: "Mộc" },
  { canChi: "Nhâm Tuất – Quý Hợi", tenNapAm: "Đại Hải Thủy", nguHanh: "Thủy" },
];

export const MENH: MenhInfo[] = [
  {
    nguHanh: "Kim",
    moTa:
      "Người mệnh Kim quyết đoán, có chí tiến thủ và trọng chữ tín. Họ chuộng sự sắc sảo, gọn gàng, thích mọi thứ rõ ràng đâu ra đấy. Trong kinh doanh, họ kiên định với mục tiêu đã chọn và đã cam kết là giữ.",
    mauHop: ["Trắng", "Xám", "Ghi", "Ánh kim", "Vàng", "Nâu đất"],
    mauTranh: ["Đỏ", "Hồng", "Tím"],
    ungDung:
      "Tông trắng – xám – ánh kim rất hợp để làm nhận diện thương hiệu và không gian làm việc của người mệnh Kim: sạch, sắc nét, tạo cảm giác chuyên nghiệp. Thổ sinh Kim nên các sắc be, nâu nhạt cũng thuận, dùng làm màu phụ rất hài hòa. Nếu muốn thêm điểm nhấn ấm, hãy chọn vàng đồng thay cho đỏ.",
  },
  {
    nguHanh: "Mộc",
    moTa:
      "Người mệnh Mộc hướng ngoại, giàu lòng nhân ái và luôn muốn phát triển. Như cây vươn lên đón nắng, họ bền bỉ, ham học hỏi và mong mỗi ngày tiến bộ hơn hôm qua. Trong hợp tác, họ dễ gần và sẵn lòng nâng đỡ đối tác nhỏ hơn mình.",
    mauHop: ["Xanh lá", "Xanh rêu", "Đen", "Xanh nước biển sẫm"],
    mauTranh: ["Trắng", "Xám", "Ánh kim"],
    ungDung:
      "Sắc xanh lá và xanh rêu hợp bản mệnh, lại đang là tông được nhiều thương hiệu chọn vì gắn với phát triển bền vững — rất thuận cho người mệnh Mộc dùng làm màu chủ đạo. Thủy sinh Mộc nên xanh navy sẫm cũng tốt, phù hợp tài liệu và trang phục gặp đối tác lớn. Hạn chế lạm dụng tông xám bạc làm màu chính.",
  },
  {
    nguHanh: "Thủy",
    moTa:
      "Người mệnh Thủy linh hoạt, khéo giao tiếp và giỏi thích nghi như nước len qua đá. Họ nhạy với người đối diện, biết mềm biết cứng đúng lúc. Trí tuệ và sự uyển chuyển là thế mạnh lớn nhất của họ trên bàn đàm phán.",
    mauHop: ["Đen", "Xanh nước biển", "Trắng", "Xám", "Ghi"],
    mauTranh: ["Vàng", "Nâu đất"],
    ungDung:
      "Đây là mệnh dễ chọn màu nhất: navy, đen, xám đều thuận — navy đúng bản mệnh, xám ghi thuộc Kim tương sinh. Bộ ba này cũng là tông an toàn nhất cho hồ sơ năng lực, danh thiếp và trang phục dự sự kiện. Nếu cần tông sáng cho không gian, chọn xám nhạt thay vì be hay nâu đất.",
  },
  {
    nguHanh: "Hỏa",
    moTa:
      "Người mệnh Hỏa nhiệt huyết, mạnh mẽ và có nguồn năng lượng dễ lan tỏa. Họ nói được làm được, thích dẫn dắt và không ngại thử thách. Sự ấm áp của họ khiến đội ngũ và đối tác muốn đồng hành lâu dài.",
    mauHop: ["Đỏ", "Hồng", "Tím", "Cam", "Xanh lá"],
    mauTranh: ["Đen", "Xanh nước biển"],
    ungDung:
      "Đỏ và cam là màu bản mệnh, rất mạnh khi dùng làm điểm nhấn thương hiệu — nhưng nên dùng có chừng mực để không lấn át thông tin. Mộc sinh Hỏa nên xanh lá, xanh ô liu là lựa chọn nền tốt, vừa hợp mệnh vừa dịu mắt. Hạn chế lấy đen hoặc navy làm màu chủ đạo duy nhất.",
  },
  {
    nguHanh: "Thổ",
    moTa:
      "Người mệnh Thổ vững chãi, thật thà và đáng tin như đất lành. Họ kiên nhẫn, chịu thương chịu khó, là chỗ dựa âm thầm của gia đình và tập thể. Chậm mà chắc, họ thường gặt hái những thành quả bền vững.",
    mauHop: ["Vàng", "Nâu đất", "Đỏ", "Hồng", "Tím"],
    mauTranh: ["Xanh lá", "Xanh rêu"],
    ungDung:
      "Nâu, be, vàng đất là tông bản mệnh — hợp với những thương hiệu muốn gợi cảm giác truyền thống, tin cậy, gắn với nghề lâu năm. Hỏa sinh Thổ nên sắc đỏ trầm dùng làm điểm nhấn rất đắt. Nếu cần một tông trung tính cho tài liệu trang trọng, xám than là phương án an toàn hơn xanh rêu.",
  },
];

// ═══════════════════════════════════════════════════════════════
// TRẮC NGHIỆM TÍNH CÁCH — 12 câu, bối cảnh điều hành doanh nghiệp
// ═══════════════════════════════════════════════════════════════

export const TINH_CACH_CAU_HOI: TinhCachCauHoi[] = [
  {
    q: "Một cơ hội hợp tác bất ngờ đến vào lúc bạn đang bận kín lịch. Bạn thường:",
    options: [
      { text: "Gạt lịch, gặp ngay trong hôm nay để không mất cơ hội", type: "lua" },
      { text: "Gọi điện trò chuyện trước cho thân, hẹn cà phê tuần này", type: "gio" },
      { text: "Hẹn một buổi cụ thể, chuẩn bị kỹ rồi mới gặp", type: "dat" },
      { text: "Tìm hiểu kỹ về đối tác trước khi quyết định có gặp hay không", type: "nuoc" },
    ],
  },
  {
    q: "Trong cuộc họp ban giám đốc, vai trò quen thuộc của bạn là:",
    options: [
      { text: "Người chốt: nghe đủ rồi quyết, giao việc, định thời hạn", type: "lua" },
      { text: "Người giữ nhịp: khơi chuyện, làm không khí cởi mở", type: "gio" },
      { text: "Người ghi nhận: tóm lại việc ai làm, khi nào xong", type: "dat" },
      { text: "Người phản biện: hỏi lại những giả định chưa ai kiểm chứng", type: "nuoc" },
    ],
  },
  {
    q: "Doanh nghiệp gặp một tháng doanh thu sụt mạnh. Phản ứng đầu tiên của bạn:",
    options: [
      { text: "Họp khẩn, ra ngay vài hành động để chặn đà giảm", type: "lua" },
      { text: "Gọi cho khách hàng lớn và anh em trong ngành để nghe tình hình", type: "gio" },
      { text: "Rà lại chi phí, giữ bộ máy ổn định trước đã", type: "dat" },
      { text: "Mở số liệu ra, tìm cho ra nguyên nhân gốc rồi mới hành động", type: "nuoc" },
    ],
  },
  {
    q: "Khi tuyển một vị trí quan trọng, điều bạn coi trọng nhất là:",
    options: [
      { text: "Người dám nhận việc khó và làm ra kết quả nhanh", type: "lua" },
      { text: "Người hòa đồng, tạo được năng lượng tốt cho cả nhóm", type: "gio" },
      { text: "Người ổn định, gắn bó lâu dài và làm việc có trách nhiệm", type: "dat" },
      { text: "Người có chuyên môn sâu và tư duy chặt chẽ", type: "nuoc" },
    ],
  },
  {
    q: "Trong một buổi kết nối giao thương của Hội, bạn thường:",
    options: [
      { text: "Chủ động tìm đúng người mình cần và vào thẳng vấn đề", type: "lua" },
      { text: "Đi một vòng chào hỏi, quen thêm càng nhiều người càng tốt", type: "gio" },
      { text: "Trò chuyện sâu với vài người, giữ liên lạc lâu dài về sau", type: "dat" },
      { text: "Quan sát trước, chọn lọc người thật sự phù hợp mới bắt chuyện", type: "nuoc" },
    ],
  },
  {
    q: "Một nhân sự lâu năm làm hỏng việc gây thiệt hại. Bạn xử lý thế nào?",
    options: [
      { text: "Nói thẳng ngay, rõ hậu quả và yêu cầu khắc phục trong bao lâu", type: "lua" },
      { text: "Gặp riêng, động viên trước rồi mới góp ý để họ không mất tinh thần", type: "gio" },
      { text: "Bình tĩnh cùng họ rà lại quy trình để lần sau không lặp lại", type: "dat" },
      { text: "Tìm hiểu đầu đuôi từ nhiều phía trước khi kết luận trách nhiệm", type: "nuoc" },
    ],
  },
  {
    q: "Bạn đánh giá một năm kinh doanh là thành công khi:",
    options: [
      { text: "Vượt mục tiêu doanh số và mở được thị trường mới", type: "lua" },
      { text: "Thương hiệu được biết đến rộng hơn, quan hệ mở rộng nhiều", type: "gio" },
      { text: "Bộ máy chạy ổn định, đội ngũ không ai rời đi", type: "dat" },
      { text: "Sản phẩm và quy trình được nâng chuẩn rõ rệt so với năm trước", type: "nuoc" },
    ],
  },
  {
    q: "Trước một khoản đầu tư lớn, bạn thấy mình gần với câu nào nhất?",
    options: [
      { text: "Cơ hội không chờ ai — thấy đúng thì xuống tiền", type: "lua" },
      { text: "Hỏi vài người mình tin, nghe trực giác rồi quyết", type: "gio" },
      { text: "Chia nhỏ ra làm từng bước, chắc bước nào đi bước đó", type: "dat" },
      { text: "Làm bài tính kỹ, có kịch bản xấu nhất rồi mới quyết", type: "nuoc" },
    ],
  },
  {
    q: "Đối tác đề nghị giảm giá sâu để lấy một đơn hàng lớn. Bạn:",
    options: [
      { text: "Ra điều kiện đổi lại rõ ràng, không giảm suông", type: "lua" },
      { text: "Trò chuyện để hiểu khó khăn của họ rồi tìm cách hai bên cùng có lợi", type: "gio" },
      { text: "Giữ giá, giải thích cặn kẽ vì sao chất lượng đáng mức đó", type: "dat" },
      { text: "Tính lại biên lợi nhuận, chỉ nhận nếu con số vẫn an toàn", type: "nuoc" },
    ],
  },
  {
    q: "Điều khiến bạn khó chịu nhất khi làm việc với người khác là:",
    options: [
      { text: "Họp nhiều mà không ai quyết, việc cứ treo", type: "lua" },
      { text: "Không khí căng thẳng, mọi người giữ kẽ với nhau", type: "gio" },
      { text: "Hứa rồi không giữ, kế hoạch thay đổi liên tục", type: "dat" },
      { text: "Nói theo cảm tính, không có số liệu chứng minh", type: "nuoc" },
    ],
  },
  {
    q: "Nếu được chọn một việc để đóng góp cho Chi hội, bạn chọn:",
    options: [
      { text: "Đứng ra chủ trì một chương trình lớn", type: "lua" },
      { text: "Kết nối hội viên với nhau, mở rộng quan hệ cho Hội", type: "gio" },
      { text: "Lo phần hậu cần, tổ chức để mọi việc chạy trơn tru", type: "dat" },
      { text: "Xây bộ tiêu chí, số liệu để hoạt động của Hội đo được", type: "nuoc" },
    ],
  },
  {
    q: "Cuối ngày, điều gì khiến bạn thấy hài lòng nhất?",
    options: [
      { text: "Giải quyết xong một việc khó tồn đọng lâu nay", type: "lua" },
      { text: "Có một cuộc trò chuyện thú vị, gặp được người hợp ý", type: "gio" },
      { text: "Mọi việc diễn ra đúng kế hoạch, không có sự cố nào", type: "dat" },
      { text: "Hiểu ra một điều mới mà trước nay mình nghĩ chưa tới", type: "nuoc" },
    ],
  },
];

export const TINH_CACH: TinhCachType[] = [
  {
    key: "lua",
    ten: "Người dẫn dắt (Lửa)",
    emoji: "🔥",
    motCau: "Quyết đoán, hướng về kết quả",
    tongQuan:
      "Bạn là người của hành động. Có mục tiêu là bạn tìm đường ngắn nhất, ít vòng vo nhất để tới đó. Trong doanh nghiệp, bạn là người dám quyết những việc người khác còn cân nhắc, và cũng là người đứng ra nhận trách nhiệm khi quyết định đó sai. Đội ngũ theo bạn vì mọi thứ rõ ràng: nói là làm, giao việc là có hạn chót. Áp lực với người khác là gánh nặng, với bạn lại là nhiên liệu.",
    theManh: [
      "Ra quyết định nhanh, dám chịu trách nhiệm về kết quả",
      "Càng áp lực càng tập trung, giỏi xử lý khủng hoảng",
      "Đàm phán dứt khoát, hiếm khi chịu phần thiệt",
      "Nói thẳng nên cộng sự không phải đoán ý",
    ],
    luuY: [
      "Quyết trước khi nghe hết, bỏ lỡ thông tin quan trọng từ cấp dưới",
      "Sốt ruột với người cần thời gian, vô tình tạo cảm giác bị thúc ép",
      "Cuốn theo mục tiêu lớn mà bỏ qua chi tiết vận hành dễ sinh rủi ro",
    ],
    phongCachKinhDoanh:
      "Bạn kinh doanh bằng tốc độ và sự chắc chắn. Đối tác cảm nhận được bạn biết mình muốn gì, và điều đó giúp thương vụ chốt nhanh. Thế mạnh của bạn là ra quyết định — hãy nhớ dành thêm mười phút lắng nghe trước khi chốt.",
    lamViecVoi:
      "Đối tác nhóm Lửa đi thẳng vào việc, ghét vòng vo. Hãy chuẩn bị sẵn phương án và con số, đưa tối đa hai lựa chọn, chốt mốc thời gian rõ ràng ngay trong buổi gặp. Họ trọng người dứt khoát và đúng hẹn.",
    hopVoiHoatDong: [
      "Chủ trì các chương trình lớn của Chi hội",
      "Dẫn đầu đoàn xúc tiến thương mại, mở thị trường mới",
      "Đứng ra thương lượng hợp tác giữa Hội với đối tác bên ngoài",
    ],
  },
  {
    key: "gio",
    ten: "Người kết nối (Gió)",
    emoji: "🌬️",
    motCau: "Nhiệt huyết, quan hệ rộng, kể chuyện có duyên",
    tongQuan:
      "Bạn mang năng lượng đến bất cứ chỗ nào mình xuất hiện. Với bạn, làm ăn trước hết là chuyện giữa người với người — hợp đồng là kết quả tự nhiên của một mối quan hệ tử tế. Bạn kể chuyện có duyên, nhớ tên nhớ mặt rất giỏi, và khiến người mới gặp cũng thấy như đã quen từ lâu. Mạng lưới quan hệ chính là tài sản lớn nhất của doanh nghiệp bạn.",
    theManh: [
      "Mở rộng quan hệ nhanh, nguồn khách và đối tác dồi dào",
      "Kể câu chuyện thương hiệu sinh động, dễ được nhớ",
      "Truyền năng lượng cho đội ngũ, môi trường làm việc cởi mở",
      "Làm ấm lại những quan hệ tưởng đã nguội",
    ],
    luuY: [
      "Câu chuyện hay nhưng thiếu số liệu khi gặp đối tác khó tính",
      "Nhận lời trong lúc hào hứng rồi quên — nên ghi lại mọi cam kết",
      "Quan hệ rộng mà không sâu, lúc cần thì không ai đủ thân để nhờ",
    ],
    phongCachKinhDoanh:
      "Bạn kinh doanh bằng con người: khách tìm đến vì tin bạn, đối tác giới thiệu bạn cho người khác. Hãy bồi thêm phần số liệu và quy trình để mạng lưới ấy chuyển thành doanh thu đều đặn.",
    lamViecVoi:
      "Đối tác nhóm Gió cởi mở, quyết định nhiều phần bằng cảm tình. Hãy dành thời gian trò chuyện trước khi vào việc, và luôn chốt lại nội dung đã thống nhất bằng tin nhắn hoặc email — họ dễ quên chi tiết.",
    hopVoiHoatDong: [
      "Kết nối hội viên với nhau, giới thiệu cơ hội giao thương",
      "Đại diện Chi hội trong quan hệ với các hội bạn",
      "Truyền thông, lan tỏa hình ảnh và hoạt động của Hội",
    ],
  },
  {
    key: "dat",
    ten: "Người bền bỉ (Đất)",
    emoji: "⛰️",
    motCau: "Ổn định, chu đáo, giữ lời",
    tongQuan:
      "Bạn là điểm tựa. Không ồn ào, không vội, bạn làm việc đều đặn và giữ lời một cách đáng tin. Doanh nghiệp của bạn hiếm khi bùng nổ trong một năm, nhưng cũng hiếm khi đổ vỡ — vì mọi thứ được dựng trên nền chắc. Đối tác làm với bạn một lần rồi thường ở lại rất lâu, và nhân sự của bạn cũng vậy. Điều bạn cần thêm chỉ là một chút mạnh dạn khi cơ hội lớn xuất hiện.",
    theManh: [
      "Giữ chữ tín tuyệt đối, đã nhận là theo đến cùng",
      "Vận hành ổn định, ít sự cố, chi phí kiểm soát tốt",
      "Giữ được người giỏi và khách hàng lâu năm",
      "Bình tĩnh trong giai đoạn thị trường khó",
    ],
    luuY: [
      "Chậm nắm cơ hội vì muốn chắc chắn tuyệt đối",
      "Ngại thay đổi mô hình dù thấy dấu hiệu hết dư địa",
      "Ôm quá nhiều việc vì ngại nhờ vả và ngại từ chối",
    ],
    phongCachKinhDoanh:
      "Bạn kinh doanh bằng độ tin cậy. Người ta chọn bạn vì biết chắc chất lượng và tiến độ. Thế mạnh của bạn là giữ được quan hệ lâu dài — thứ tài sản khó xây nhất trong kinh doanh.",
    lamViecVoi:
      "Đối tác nhóm Đất cần cảm giác an toàn: hỏi kỹ về cam kết, bảo hành, phương án xử lý khi có sự cố. Đừng thúc ép, hãy đưa cam kết bằng văn bản rõ ràng và giữ đúng từ lần hợp tác đầu tiên.",
    hopVoiHoatDong: [
      "Tổ chức hậu cần, điều phối cho các sự kiện của Hội",
      "Quản lý hội phí, sổ sách và những việc cần sự đều đặn",
      "Đồng hành lâu dài với hội viên mới trong giai đoạn đầu",
    ],
  },
  {
    key: "nuoc",
    ten: "Người tính kỹ (Nước)",
    emoji: "💧",
    motCau: "Chính xác, sâu sắc, quyết bằng dữ liệu",
    tongQuan:
      "Bạn thấy những điều người khác bỏ qua: một dòng chi phí bất thường, một điều khoản hợp đồng có thể gây rắc rối, một con số không khớp. Bạn không tin cảm tính và cũng không bị đám đông cuốn đi. Bạn nói ít, nhưng khi bạn đã kết luận thì thường có căn cứ vững. Những đối tác khó tính nhất lại thường là người tin bạn nhất, vì họ nhận ra mình đang làm việc với người có chiều sâu.",
    theManh: [
      "Phân tích kỹ, ít khi ra quyết định sai vì cảm tính",
      "Đọc được rủi ro trong hợp đồng và mô hình kinh doanh",
      "Am hiểu chuyên môn sâu, đối tác nể trọng",
      "Không bị lung lay bởi tin đồn hay phong trào ngắn hạn",
    ],
    luuY: [
      "Cầu toàn nên chậm quyết, cơ hội trôi qua trước khi đủ dữ liệu",
      "Sa vào chi tiết kỹ thuật khi người nghe chỉ cần kết luận",
      "Ít bộc lộ nên đối tác dễ hiểu nhầm là lạnh nhạt hoặc thiếu thiện chí",
    ],
    phongCachKinhDoanh:
      "Bạn kinh doanh bằng chuyên môn và sự chính xác. Khi bạn giải thích vì sao một phương án không ổn, người nghe hiểu rằng mình đang nói chuyện với người thật sự am hiểu.",
    lamViecVoi:
      "Đối tác nhóm Nước hỏi sâu về số liệu, xuất xứ và cam kết. Hãy trả lời chính xác, thẳng thắn nhận điều mình chưa chắc và hẹn phản hồi sau — một con số nói vống lên có thể làm mất niềm tin vĩnh viễn.",
    hopVoiHoatDong: [
      "Xây bộ tiêu chí và số liệu đánh giá hoạt động của Hội",
      "Thẩm định, phản biện các đề án trước khi Chi hội triển khai",
      "Chia sẻ chuyên môn sâu trong các buổi đào tạo hội viên",
    ],
  },
];
