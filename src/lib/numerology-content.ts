/**
 * Nội dung diễn giải thần số học mở rộng + chiều sâu 12 con giáp.
 * Soạn bằng quy trình đa tác tử, đã kiểm tra cấu trúc đầy đủ (11 giá trị mỗi
 * chỉ số chính, 8 mũi tên, 12 con giáp). Muốn chỉnh câu chữ: sửa file này.
 */
import type { ArrowKey } from "./numerology";

export type NumberReading = {
  number: number;
  title: string;
  overview: string;
  strengths: string[];
  watchouts: string[];
  advice: string;
};

export type PersonalYearReading = {
  number: number;
  title: string;
  overview: string;
  focus: string[];
  advice: string;
};

export type ArrowReading = {
  key: ArrowKey;
  name: string;
  presentDesc: string;
  presentTips: string[];
  missingName: string;
  missingDesc: string;
  missingTips: string[];
};

export type ChartDigitMeaning = { digit: number; meaning: string };

export type ZodiacDepth = {
  chi: string;
  strengths: string[];
  watchouts: string[];
  businessStyle: string;
  careerFit: string;
  tip: string;
};

export const EXPRESSION_READINGS: NumberReading[] = [
  {
    "number": 1,
    "title": "Người mở lối",
    "overview": "Số sứ mệnh 1 vẽ ra con đường của người đi trước. Tài năng của bạn nằm ở sự chủ động: dám khởi xướng, dám nhận việc khó và dám chịu trách nhiệm. Trong kinh doanh, đó là lợi thế khi phải mở một thị trường chưa ai đi, hoặc ra quyết định lúc thông tin còn chưa đủ. Sứ mệnh của bạn là mở ra những cánh cửa mà người khác còn ngần ngại.",
    "strengths": [
      "Chủ động khởi xướng, không chờ được nhắc việc",
      "Quyết đoán khi cần chốt phương án cho khách",
      "Truyền tinh thần dám làm cho cả đội"
    ],
    "watchouts": [
      "Dễ nóng vội, đi nhanh hơn nhịp của khách",
      "Đôi khi bảo vệ ý kiến quá chặt, ít lắng nghe",
      "Có xu hướng ôm việc thay vì san sẻ"
    ],
    "advice": "Hãy lắng nghe trọn vẹn trước khi đề xuất. Người mở lối giỏi nhất là người khiến khách cảm thấy chính họ đang chọn con đường."
  },
  {
    "number": 2,
    "title": "Người kết nối",
    "overview": "Số sứ mệnh 2 là con đường của sự hợp tác và tinh tế. Tài năng của bạn nằm ở đôi tai biết lắng nghe và khả năng cảm nhận điều khách chưa nói thành lời. Bạn hợp với vai trò cầu nối: giữa khách và thợ may, giữa các thành viên trong đội. Sứ mệnh của bạn là làm cho mọi mối quan hệ quanh mình trở nên êm đẹp và bền lâu.",
    "strengths": [
      "Lắng nghe sâu, nắm được mong muốn thật của khách",
      "Khéo léo dàn xếp khi có ý kiến trái chiều",
      "Kiên nhẫn với khách cần thời gian cân nhắc"
    ],
    "watchouts": [
      "Ngại va chạm nên đôi khi né những cuộc trao đổi cần thiết",
      "Dễ nhạy cảm quá mức với lời nhận xét",
      "Chần chừ khi phải quyết định một mình"
    ],
    "advice": "Sự mềm mỏng của bạn là tài sản, nhưng khách cũng cần một lời khuyên rõ ràng. Hãy tập nói điều mình thấy đúng một cách nhẹ nhàng mà dứt khoát."
  },
  {
    "number": 3,
    "title": "Người kể chuyện",
    "overview": "Số sứ mệnh 3 mang tài năng của ngôn từ và sáng tạo. Bạn có duyên ăn nói, biết biến một sản phẩm bình thường thành một câu chuyện đáng nghe: vì sao ra đời, giải quyết nỗi khổ nào, ai đã dùng và thay đổi ra sao. Đối tác nhớ bạn vì những cuộc trò chuyện dễ chịu chứ không phải vì bảng giá. Sứ mệnh của bạn là truyền niềm vui và cảm hứng qua từng lời nói.",
    "strengths": [
      "Diễn đạt sinh động, khiến sản phẩm trở nên hấp dẫn",
      "Tạo bầu không khí thoải mái ngay từ phút đầu",
      "Nhiều ý tưởng mới cho cách giới thiệu và trưng bày"
    ],
    "watchouts": [
      "Nói nhiều hơn nghe nếu không để ý",
      "Dễ phân tán, bắt đầu nhiều việc nhưng khó hoàn tất",
      "Đôi khi hứa vui miệng rồi quên"
    ],
    "advice": "Câu chuyện hay nhất là câu chuyện của chính khách hàng. Hãy hỏi nhiều hơn một chút, rồi dùng tài kể chuyện của mình để giúp họ thấy phiên bản đẹp nhất của họ."
  },
  {
    "number": 4,
    "title": "Người xây nền",
    "overview": "Số sứ mệnh 4 là con đường của sự bền bỉ và kỷ luật. Tài năng của bạn nằm ở việc làm mọi thứ đâu ra đấy: sổ sách rõ, quy trình chuẩn, hẹn đúng, giao đúng. Ở những ngành mà một sai sót nhỏ đủ mất cả hợp đồng, sự cẩn trọng của bạn chính là nền móng cho chữ tín. Sứ mệnh của bạn là xây những giá trị vững chắc theo thời gian.",
    "strengths": [
      "Cẩn thận, chính xác trong từng số đo và ghi chú",
      "Đáng tin cậy, đã hứa là làm",
      "Kiên trì theo đuổi mục tiêu dài hạn"
    ],
    "watchouts": [
      "Đôi khi cứng nhắc, khó thích nghi khi kế hoạch đổi",
      "Dễ khắt khe với bản thân và đồng nghiệp",
      "Ngại thử cách làm mới dù cách cũ chưa tối ưu"
    ],
    "advice": "Nền móng vững là quý, nhưng ngôi nhà đẹp cần cả sự linh hoạt. Thỉnh thoảng hãy cho phép mình thử một cách làm khác và xem điều gì xảy ra."
  },
  {
    "number": 5,
    "title": "Người khai phá",
    "overview": "Số sứ mệnh 5 mang tài năng của sự linh hoạt và thích nghi. Bạn học nhanh, xoay chuyển giỏi và không ngại thay đổi. Mỗi thị trường, mỗi đối tác là một thế giới khác nhau, và bạn có khả năng bắt nhịp với từng bên: từ tập đoàn quy trình chặt chẽ đến hộ kinh doanh làm ăn bằng niềm tin. Sứ mệnh của bạn là mang làn gió mới đến bất cứ nơi nào mình có mặt.",
    "strengths": [
      "Thích nghi nhanh với mọi kiểu khách và tình huống",
      "Ham học hỏi, cập nhật xu hướng sớm",
      "Giao tiếp tự nhiên, không bị khuôn mẫu"
    ],
    "watchouts": [
      "Dễ chán khi công việc lặp lại",
      "Thiếu kiên nhẫn với quy trình và giấy tờ",
      "Đôi khi thay đổi nhanh khiến đồng đội khó theo"
    ],
    "advice": "Tự do lớn nhất đến từ việc làm chủ được sự bền bỉ. Hãy chọn một vài việc nền tảng và giữ chúng đều đặn, phần còn lại cứ để sự linh hoạt của bạn tỏa sáng."
  },
  {
    "number": 6,
    "title": "Người vun đắp",
    "overview": "Số sứ mệnh 6 là con đường của sự chăm sóc và thẩm mỹ. Bạn có tài chăm chút cho người khác một cách tự nhiên, cùng con mắt nhạy với cái đẹp hài hòa. Những ngành phục vụ con người gần như sinh ra cho bạn: vừa giải quyết được nhu cầu, vừa khiến khách thấy mình được quan tâm thật lòng. Sứ mệnh của bạn là vun đắp cho con người và không gian quanh mình.",
    "strengths": [
      "Chăm sóc khách chu đáo, nhớ những chi tiết nhỏ",
      "Gu thẩm mỹ tốt, phối màu và form dáng hài hòa",
      "Tinh thần trách nhiệm cao với đội ngũ và doanh nghiệp"
    ],
    "watchouts": [
      "Dễ ôm đồm việc của người khác rồi quá tải",
      "Cầu toàn, khó hài lòng với kết quả của mình",
      "Đôi khi quan tâm quá mức khiến khách thấy áp lực"
    ],
    "advice": "Chăm sóc người khác bắt đầu từ việc chăm sóc chính mình. Hãy giữ lại một phần năng lượng cho bản thân để sự ấm áp của bạn luôn đầy đặn."
  },
  {
    "number": 7,
    "title": "Nhà phân tích",
    "overview": "Số sứ mệnh 7 mang tài năng của chiều sâu. Bạn không hài lòng với hiểu biết bề mặt mà muốn nắm tận gốc: vì sao loại vải này đứng form, vì sao dáng người này hợp ve áo kia. Chính chiều sâu ấy khiến lời tư vấn của bạn có sức nặng, và khách tìm đến bạn như tìm một chuyên gia. Sứ mệnh của bạn là trở thành người hiểu nghề sâu nhất trong phòng.",
    "strengths": [
      "Kiến thức chuyên môn sâu, tư vấn có căn cứ",
      "Quan sát tinh, nhận ra điều người khác bỏ qua",
      "Bình tĩnh, không bị cuốn theo cảm xúc nhất thời"
    ],
    "watchouts": [
      "Dễ bị xem là kín đáo, khó gần lúc mới gặp",
      "Cân nhắc lâu, đôi khi lỡ nhịp chốt với khách",
      "Thích làm việc một mình hơn phối hợp"
    ],
    "advice": "Kiến thức của bạn quý nhất khi được chia sẻ giản dị. Hãy tập kể điều mình biết bằng ngôn ngữ đời thường để khách nào cũng hiểu được."
  },
  {
    "number": 8,
    "title": "Người kiến tạo thành quả",
    "overview": "Số sứ mệnh 8 là con đường của thành tựu và điều hành. Bạn có đầu óc thực tế, nhạy với con số và biết cách biến nỗ lực thành kết quả nhìn thấy được: doanh số, khách quay lại, đơn hàng lớn. Bạn cũng có tố chất dẫn dắt đội nhóm hướng tới mục tiêu chung. Sứ mệnh của bạn là tạo ra thành quả xứng đáng cho mình và cho những người cùng làm.",
    "strengths": [
      "Định hướng mục tiêu rõ, làm việc có kết quả",
      "Nhạy bén với con số và cơ hội kinh doanh",
      "Tố chất quản lý, biết tổ chức công việc cho đội"
    ],
    "watchouts": [
      "Dễ đặt nặng doanh số mà quên trải nghiệm của khách",
      "Đôi khi áp tiêu chuẩn cao của mình lên người khác",
      "Khó thư giãn, dễ căng thẳng kéo dài"
    ],
    "advice": "Thành quả bền nhất trong nghề này là niềm tin của khách. Hãy đo thành công bằng số khách quay lại, con số doanh thu sẽ tự theo sau."
  },
  {
    "number": 9,
    "title": "Người cống hiến",
    "overview": "Số sứ mệnh 9 mang tài năng của tấm lòng rộng. Bạn dễ đồng cảm, đối xử tử tế với đủ mọi kiểu người và luôn muốn công việc của mình có ý nghĩa lớn hơn một giao dịch. Đối tác cảm nhận được sự chân thành ấy: bạn bán một sản phẩm, nhưng thứ họ nhận về là sự tử tế trong cách làm ăn. Sứ mệnh của bạn là để lại điều tốt đẹp ở bất cứ đâu mình đi qua.",
    "strengths": [
      "Chân thành, khách cảm được sự tử tế thật",
      "Hòa hợp với nhiều kiểu người khác nhau",
      "Nhìn xa, hiểu giá trị lớn hơn của công việc"
    ],
    "watchouts": [
      "Dễ mềm lòng, khó từ chối những yêu cầu quá đà",
      "Đôi khi lý tưởng hóa, thất vọng khi thực tế khác đi",
      "Quên chăm lo quyền lợi của chính mình"
    ],
    "advice": "Tấm lòng rộng cần đi cùng ranh giới rõ. Giúp khách hết lòng, nhưng hãy nhớ giá trị công sức của mình cũng xứng đáng được trân trọng."
  },
  {
    "number": 11,
    "title": "Người soi đường",
    "overview": "Số 11 là số chủ đạo, mang sứ mệnh của trực giác và cảm hứng. Bạn nhạy cảm hơn người thường, hay linh cảm đúng về người đối diện và có khả năng nâng tinh thần người khác chỉ bằng sự hiện diện của mình. Trong tiệm, bạn thường đoán được khách cần gì trước cả khi họ nói. Sứ mệnh của bạn là dùng sự nhạy bén ấy để soi đường cho người quanh mình.",
    "strengths": [
      "Trực giác tốt, đọc được cảm xúc của khách",
      "Truyền cảm hứng tự nhiên cho đội nhóm",
      "Nhạy với cái đẹp và những giá trị tinh thần"
    ],
    "watchouts": [
      "Nhạy cảm cao nên dễ mệt ở nơi đông người",
      "Kỳ vọng lớn vào bản thân, dễ tự tạo áp lực",
      "Tâm trạng lên xuống ảnh hưởng đến ngày làm việc"
    ],
    "advice": "Trực giác của bạn là món quà, nhưng nó cần một cơ thể được nghỉ ngơi đầy đủ. Hãy giữ nhịp sống điều độ để sự nhạy bén luôn trong trẻo."
  },
  {
    "number": 22,
    "title": "Người kiến tạo lớn",
    "overview": "Số 22 là số chủ đạo mạnh nhất, kết hợp tầm nhìn xa với khả năng thực thi bền bỉ. Bạn không chỉ mơ lớn mà còn biết xây từng viên gạch để giấc mơ thành hình: một quy trình vận hành chuẩn, một hệ thống chạy được khi mình vắng mặt, một lớp quản lý kế cận đủ giỏi. Sứ mệnh của bạn là xây những công trình mà nhiều người cùng được hưởng.",
    "strengths": [
      "Tầm nhìn dài hạn đi cùng khả năng thực thi",
      "Kiên định, không nản trước mục tiêu lớn",
      "Biết tổ chức con người và hệ thống bài bản"
    ],
    "watchouts": [
      "Tự đòi hỏi mình quá cao, dễ kiệt sức",
      "Sốt ruột với những người đi chậm hơn",
      "Đôi khi ôm hết phần khó về mình"
    ],
    "advice": "Công trình lớn không xây trong một ngày và không xây một mình. Hãy tin tưởng giao việc, bạn sẽ đi xa hơn cùng cả đội."
  }
];

export const SOUL_READINGS: NumberReading[] = [
  {
    "number": 1,
    "title": "Khát khao tự chủ",
    "overview": "Sâu bên trong, điều thúc đẩy bạn là được tự quyết định con đường của mình. Bạn thấy tràn năng lượng khi được tin tưởng giao hẳn một việc, và hụt hơi khi bị kèm cặp quá sát. Với bạn, một ngày làm việc đẹp là ngày được chủ động: tự nhận khách, tự đề xuất, tự chịu trách nhiệm với kết quả của mình.",
    "strengths": [
      "Động lực tự thân mạnh, không cần ai thúc",
      "Dám nhận trách nhiệm về kết quả của mình",
      "Luôn muốn tự nâng chuẩn của bản thân"
    ],
    "watchouts": [
      "Khó chịu khi bị góp ý cách làm",
      "Ngại nhờ giúp đỡ dù đang quá tải",
      "Dễ xem nhẹ những việc cần làm chung"
    ],
    "advice": "Tự chủ không có nghĩa là một mình. Hãy chủ động chia sẻ tiến độ với đội để sự độc lập của bạn được tin tưởng thay vì bị hiểu lầm."
  },
  {
    "number": 2,
    "title": "Khát khao hòa hợp",
    "overview": "Điều nuôi dưỡng bạn từ bên trong là những mối quan hệ êm ấm. Bạn thấy bình yên khi mọi người quanh mình vui vẻ với nhau, và trăn trở rất lâu sau một cuộc va chạm nhỏ. Được đồng hành cùng ai đó, được lắng nghe và được cần đến, đó là lúc bạn làm việc tốt nhất và thấy công việc thật sự có ý nghĩa.",
    "strengths": [
      "Nuôi dưỡng quan hệ lâu dài với khách và đồng nghiệp",
      "Nhạy với bầu không khí, biết lúc nào cần xoa dịu",
      "Tận tâm khi được làm việc cùng người mình quý"
    ],
    "watchouts": [
      "Dễ nhún nhường quá mức để giữ hòa khí",
      "Buồn lâu vì những chuyện người khác đã quên",
      "Phụ thuộc cảm xúc vào sự công nhận của người khác"
    ],
    "advice": "Hòa hợp thật sự bao gồm cả tiếng nói của bạn. Hãy tập bày tỏ mong muốn của mình sớm hơn, trước khi nó trở thành nỗi ấm ức."
  },
  {
    "number": 3,
    "title": "Khát khao được thể hiện",
    "overview": "Bên trong bạn có một nguồn vui cần được cất tiếng. Bạn thấy sống động nhất khi được nói, được sáng tạo, được khiến người khác bật cười. Một ngày không có cuộc trò chuyện thú vị nào là một ngày dài với bạn. Được khách khen duyên, được đồng nghiệp chờ nghe chuyện của mình, đó là phần thưởng bạn âm thầm mong đợi.",
    "strengths": [
      "Năng lượng tươi vui lan tỏa sang người khác",
      "Luôn có ý tưởng và góc nhìn thú vị",
      "Hồi phục tinh thần nhanh sau ngày khó khăn"
    ],
    "watchouts": [
      "Buồn hơn mình thể hiện khi không được chú ý",
      "Dễ nói quá đà lúc hào hứng",
      "Né những cảm xúc nặng thay vì đối diện"
    ],
    "advice": "Niềm vui của bạn là thật và đáng quý, cả những lúc lặng lại cũng vậy. Hãy cho phép mình có ngày trầm mà không thấy áy náy."
  },
  {
    "number": 4,
    "title": "Khát khao vững vàng",
    "overview": "Điều bạn thật sự tìm kiếm là cảm giác an toàn và ổn định. Bạn dễ chịu khi mọi thứ có kế hoạch, có nề nếp: lịch làm việc rõ ràng, thu nhập đều đặn, quy trình chuẩn mực. Sự chắc chắn không làm bạn nhàm chán mà ngược lại, nó cho bạn nền tảng để yên tâm làm tốt từng việc nhỏ mỗi ngày.",
    "strengths": [
      "Bền bỉ, giữ phong độ đều đặn qua thời gian",
      "Tạo cảm giác an tâm cho người xung quanh",
      "Quản lý thời gian và tiền bạc chắc chắn"
    ],
    "watchouts": [
      "Lo lắng nhiều khi có thay đổi đột ngột",
      "Bám kế hoạch cứng, khó buông khi cần",
      "Trì hoãn cơ hội mới vì sợ rủi ro"
    ],
    "advice": "Sự vững vàng thật nằm ở khả năng thích nghi, không chỉ ở kế hoạch. Mỗi lần đón nhận một thay đổi nhỏ, bạn đang xây thêm một lớp an toàn mới cho mình."
  },
  {
    "number": 5,
    "title": "Khát khao tự do",
    "overview": "Sâu bên trong, bạn khao khát được trải nghiệm nhiều hơn: gặp người mới, học điều mới, đi những nơi chưa từng đến. Sự lặp lại kéo dài khiến bạn tụt năng lượng nhanh hơn cả việc nặng. Bạn làm việc tốt nhất khi mỗi ngày có chút khác biệt, và trong một môi trường tin tưởng cho bạn không gian xoay xở theo cách riêng.",
    "strengths": [
      "Năng lượng tươi mới, không ngại thay đổi",
      "Ham trải nghiệm nên hiểu biết rộng, nói chuyện cuốn",
      "Xoay xở nhanh trong tình huống bất ngờ"
    ],
    "watchouts": [
      "Dễ chán rồi buông ngang những gì đang dang dở",
      "Quyết định bốc đồng khi thấy tù túng",
      "Ngại ràng buộc, kể cả những cam kết cần thiết"
    ],
    "advice": "Tự do bền vững cần một điểm neo. Hãy giữ vài cam kết cốt lõi thật chắc, để những chuyến phiêu lưu của bạn luôn có nơi để trở về."
  },
  {
    "number": 6,
    "title": "Khát khao yêu thương",
    "overview": "Điều thúc đẩy bạn mỗi ngày là được chăm lo cho người khác và được yêu quý lại. Bạn thấy hạnh phúc khi khách hài lòng thật sự, khi một nhân sự mình dìu dắt trưởng thành, khi gia đình êm ấm. Với bạn, công việc chỉ thật sự có ý nghĩa khi nó làm cuộc sống của ai đó tốt lên.",
    "strengths": [
      "Tận tụy hết lòng với người mình quan tâm",
      "Tạo cảm giác được chào đón cho mọi người",
      "Trách nhiệm cao, không bỏ ai lại phía sau"
    ],
    "watchouts": [
      "Cho đi nhiều hơn khả năng rồi âm thầm tủi thân",
      "Khó từ chối, dễ bị tận dụng lòng tốt",
      "Can thiệp quá sâu vào việc của người khác"
    ],
    "advice": "Tình thương của bạn có giá trị, vì vậy hãy trao nó có chọn lọc. Học cách nhận lại cũng là một phần của yêu thương."
  },
  {
    "number": 7,
    "title": "Khát khao thấu hiểu",
    "overview": "Bên trong bạn là một người luôn muốn hiểu tận gốc: hiểu nghề, hiểu người, hiểu chính mình. Bạn cần những khoảng lặng một mình để suy ngẫm và nạp lại năng lượng sau ngày dài tiếp khách. Niềm vui của bạn không ồn ào: một cuốn sách hay, một kỹ thuật mới hiểu được, một cuộc trò chuyện thật sâu.",
    "strengths": [
      "Suy nghĩ độc lập, không chạy theo đám đông",
      "Học sâu, hiểu kỹ những gì mình quan tâm",
      "Bình thản, ít bị cuốn vào thị phi"
    ],
    "watchouts": [
      "Thu mình quá lâu khiến người khác khó hiểu mình",
      "Phân tích nhiều đến mức chậm hành động",
      "Khắt khe với những gì mình cho là hời hợt"
    ],
    "advice": "Thế giới nội tâm của bạn giàu có, và nó càng giàu hơn khi được chia sẻ. Mỗi ngày hãy mở lòng với một người, một chút thôi cũng đủ."
  },
  {
    "number": 8,
    "title": "Khát khao thành tựu",
    "overview": "Điều thật sự thúc đẩy bạn là được ghi nhận xứng đáng: vị trí tốt hơn, thu nhập cao hơn, tiếng nói có trọng lượng hơn. Bạn không ngại làm nhiều, chỉ ngại làm mà không đi đến đâu. Nhìn thấy con số tăng lên, mục tiêu được chinh phục, đó là lúc bạn cảm nhận rõ nhất giá trị của mình.",
    "strengths": [
      "Tham vọng lành mạnh, dám đặt mục tiêu cao",
      "Chịu khó, sẵn sàng nhận phần việc khó",
      "Thực tế, biết quy đổi nỗ lực thành kết quả"
    ],
    "watchouts": [
      "Gắn giá trị bản thân vào thành tích, hụt hẫng sâu khi lỡ mục tiêu",
      "So sánh mình với người khác quá nhiều",
      "Bỏ quên sức khỏe và người thân vì công việc"
    ],
    "advice": "Thành tựu là hành trình dài, không phải một cuộc đua từng ngày. Hãy ăn mừng cả những bước tiến nhỏ, chúng cộng lại thành con đường lớn."
  },
  {
    "number": 9,
    "title": "Khát khao sẻ chia",
    "overview": "Sâu thẳm bên trong, bạn muốn cuộc đời mình có ích cho nhiều người. Bạn xúc động trước những hoàn cảnh khó và thấy vui lạ khi giúp được ai đó, dù chẳng ai biết. Với bạn, bán hàng không chỉ là doanh số mà là dịp chạm vào cuộc sống của người khác một cách tử tế, và chính điều đó giữ bạn gắn bó với nghề.",
    "strengths": [
      "Lòng trắc ẩn thật, không phô trương",
      "Cho đi mà không tính toán thiệt hơn",
      "Truyền cảm hứng sống tử tế cho người quanh mình"
    ],
    "watchouts": [
      "Ôm nỗi buồn của người khác thành của mình",
      "Dễ bị lợi dụng lòng tốt",
      "Thấy trống rỗng khi công việc thiếu ý nghĩa"
    ],
    "advice": "Bạn không cần cứu cả thế giới trong một ngày. Làm thật tốt việc trước mắt với một người trước mặt, đó đã là sự sẻ chia trọn vẹn."
  },
  {
    "number": 11,
    "title": "Khát khao thắp sáng",
    "overview": "Bên trong bạn là một lý tưởng lớn: muốn nâng đỡ tinh thần người khác, muốn công việc chạm tới điều gì đó đẹp đẽ hơn thường ngày. Bạn nhạy cảm với cảm xúc của mọi người quanh mình, đôi khi nhạy đến mức mang về nhà cả những nỗi niềm không phải của mình. Được là nguồn động viên cho ai đó, với bạn, là phần thưởng lớn nhất.",
    "strengths": [
      "Đồng cảm sâu, người khác thấy an toàn khi ở cạnh",
      "Có lý tưởng, làm việc vì điều lớn hơn bản thân",
      "Nhạy bén với những chuyển biến tinh tế của con người"
    ],
    "watchouts": [
      "Hấp thụ cảm xúc tiêu cực của người khác",
      "Dằn vặt khi thực tế không đẹp như kỳ vọng",
      "Quên rằng mình cũng cần được nâng đỡ"
    ],
    "advice": "Ngọn đèn muốn sáng lâu cần được châm dầu. Hãy tìm cho mình một người, một thói quen giúp bạn được lắng nghe, thay vì chỉ lắng nghe người khác."
  },
  {
    "number": 22,
    "title": "Khát khao dựng xây",
    "overview": "Điều thúc đẩy bạn từ bên trong là mong muốn để lại một điều gì đó bền vững: một sự nghiệp vững chắc, một gia đình êm ấm, một đội ngũ trưởng thành nhờ mình. Bạn không hứng thú với thành công chớp nhoáng. Bạn kiên nhẫn gom từng viên gạch mỗi ngày, và chính sự bền bỉ ấy là nguồn sức mạnh ít ai nhìn thấy.",
    "strengths": [
      "Kiên nhẫn hiếm có với mục tiêu dài hạn",
      "Nghĩ cho tập thể, không chỉ cho riêng mình",
      "Biến ước mơ thành kế hoạch cụ thể được"
    ],
    "watchouts": [
      "Gánh trách nhiệm nặng trong im lặng",
      "Khó hài lòng vì đích đến luôn còn xa",
      "Hy sinh niềm vui hiện tại quá nhiều cho tương lai"
    ],
    "advice": "Công trình của bạn được xây bằng năm tháng, nên đừng quên sống trong lúc xây. Mỗi ngày hãy dành một khoảng cho niềm vui không cần lý do."
  }
];

export const PERSONALITY_NUM_READINGS: NumberReading[] = [
  {
    "number": 1,
    "title": "Phong thái tự tin",
    "overview": "Ấn tượng đầu tiên bạn để lại là sự tự tin và rõ ràng. Khách bước vào tiệm thường cảm nhận ngay bạn là người nắm việc, nói được làm được. Dáng đứng thẳng, ánh nhìn trực diện, câu trả lời không vòng vo khiến người đối diện yên tâm trao quyết định cho bạn. Đây là lợi thế lớn khi tư vấn cho những vị khách bận rộn, cần người dẫn dắt dứt khoát.",
    "strengths": [
      "Tạo niềm tin nhanh với khách mới",
      "Được khách bận rộn quý vì sự dứt khoát",
      "Khí chất dẫn dắt, hợp vai trò mở lời trước"
    ],
    "watchouts": [
      "Với khách rụt rè, sự mạnh mẽ có thể thành lấn át",
      "Dễ bị nhìn là người khó góp ý"
    ],
    "advice": "Sự tự tin của bạn đã đủ để khách chú ý, hãy dùng phần còn lại của cuộc gặp để lắng nghe. Khách nhớ người hiểu họ lâu hơn người gây ấn tượng."
  },
  {
    "number": 2,
    "title": "Phong thái dịu dàng",
    "overview": "Bạn tạo cảm giác dễ gần và an toàn ngay từ phút đầu. Giọng nói nhẹ, cử chỉ từ tốn, cách bạn nhường lời khiến khách thấy được tôn trọng chứ không bị chèo kéo. Những đối tác vốn dè chừng thường thả lỏng rất nhanh khi ngồi với bạn. Đây là kiểu ấn tượng khiến người ta muốn gặp lại, dù lần đầu chưa ký được gì.",
    "strengths": [
      "Khách e dè cũng nhanh chóng cởi mở",
      "Không tạo cảm giác bị ép mua",
      "Được quý nhờ sự khiêm nhường, lịch thiệp"
    ],
    "watchouts": [
      "Dễ bị đánh giá thấp về sự quyết đoán",
      "Khách mạnh mẽ có thể lấn lướt cuộc trao đổi"
    ],
    "advice": "Sự dịu dàng là cánh cửa mở, nhưng khách vẫn cần một lời khuyên chắc chắn để chốt. Khi đã hiểu khách, hãy tự tin nói rõ phương án bạn tin là đúng."
  },
  {
    "number": 3,
    "title": "Phong thái tươi sáng",
    "overview": "Người mới gặp thường nhớ về bạn với nụ cười và nguồn năng lượng vui vẻ. Bạn khiến không gian nhẹ đi, câu chuyện tự nhiên hơn và buổi thử đồ giống một cuộc gặp bạn bè hơn là một giao dịch. Khách hay kể về bạn với người quen, và đó là kênh giới thiệu quý giá mà không quảng cáo nào mua được.",
    "strengths": [
      "Ấn tượng đầu vui vẻ, khó quên",
      "Khách thoải mái nên dễ mở lòng chia sẻ nhu cầu",
      "Hay được khách giới thiệu cho bạn bè"
    ],
    "watchouts": [
      "Khách nghiêm nghị có thể cần bạn chậm và sâu hơn",
      "Vui quá đà dễ làm loãng thông tin tư vấn quan trọng"
    ],
    "advice": "Niềm vui của bạn là chất dẫn tuyệt vời, hãy đệm vào đó vài khoảng lặng đúng lúc. Một phút nghiêm túc khi chốt số đo sẽ khiến sự tươi vui còn lại đáng tin hơn."
  },
  {
    "number": 4,
    "title": "Phong thái chỉn chu",
    "overview": "Ấn tượng bạn để lại là sự chỉn chu và đáng tin. Từ trang phục phẳng phiu đến cách ghi chép cẩn thận, mọi thứ ở bạn nói với khách rằng việc của họ sẽ được làm đến nơi đến chốn. Với những hợp đồng đòi hỏi độ chính xác cao, kiểu ấn tượng này quý như vàng: đối tác giao việc rồi yên tâm, không phải hỏi đi hỏi lại.",
    "strengths": [
      "Tạo cảm giác chuyên nghiệp, làm việc có quy củ",
      "Khách yên tâm về lời hẹn giao đúng ngày",
      "Hợp với khách kỹ tính, coi trọng chi tiết"
    ],
    "watchouts": [
      "Có thể bị nhìn là nguyên tắc, thiếu thoải mái",
      "Khách trẻ có thể thấy hơi khuôn phép"
    ],
    "advice": "Sự chỉn chu đã nói thay bạn phần chuyên môn. Thêm một nụ cười và một câu hỏi thăm ngoài công việc, ấn tượng của bạn sẽ tròn đầy."
  },
  {
    "number": 5,
    "title": "Phong thái năng động",
    "overview": "Bạn hiện lên trong mắt người mới gặp là người nhanh nhẹn, hoạt bát và bắt chuyện tự nhiên. Khách kiểu gì bạn cũng trò chuyện được, từ chú lớn tuổi đến bạn trẻ sành điệu. Sự linh hoạt ấy khiến buổi tư vấn không bao giờ gượng gạo, và khách có cảm giác bạn luôn có sẵn giải pháp cho mọi tình huống.",
    "strengths": [
      "Bắt nhịp nhanh với mọi kiểu khách",
      "Không khí trò chuyện tự nhiên, không gượng ép",
      "Xử lý tình huống bất ngờ gọn gàng"
    ],
    "watchouts": [
      "Nhanh quá có thể khiến khách lớn tuổi thấy vội",
      "Dễ bị nhìn là thiếu chiều sâu nếu chỉ nói bề mặt"
    ],
    "advice": "Tốc độ của bạn là lợi thế, nhưng hãy để khách đặt nhịp. Chậm lại một nhịp khi khách cần suy nghĩ, họ sẽ thấy bạn nhanh mà không vội."
  },
  {
    "number": 6,
    "title": "Phong thái ấm áp",
    "overview": "Điều người khác cảm nhận đầu tiên ở bạn là sự ấm áp. Cách bạn hỏi han, nhớ chuyện cũ, để ý những chi tiết nhỏ khiến người ta thấy mình được đón tiếp thật lòng. Người ta tìm đến bạn không chỉ vì công việc, mà vì cảm giác được đối đãi như người thân quen lâu năm.",
    "strengths": [
      "Khách cảm nhận được sự quan tâm chân thành",
      "Xây quan hệ thân thiết, khách gắn bó lâu dài",
      "Không gian quanh bạn luôn dễ chịu"
    ],
    "watchouts": [
      "Thân tình quá sớm có thể khiến khách kín đáo dè chừng",
      "Dễ cuốn vào chuyện riêng của khách mà quên giờ giấc"
    ],
    "advice": "Sự ấm áp của bạn là điều khách kể lại cho người khác. Chỉ cần giữ thêm ranh giới thời gian hợp lý cho từng cuộc gặp, bạn sẽ chăm được nhiều người hơn."
  },
  {
    "number": 7,
    "title": "Phong thái trầm tĩnh",
    "overview": "Bạn để lại ấn tượng của một người điềm đạm và sâu sắc. Bạn không nói nhiều, nhưng câu nào ra câu đó, khiến người nghe có cảm giác đang đứng trước một người thật sự hiểu nghề. Khách trí thức, kỹ tính đặc biệt quý kiểu phong thái này: họ không cần người nói hay, họ cần người nói đúng.",
    "strengths": [
      "Lời tư vấn có trọng lượng, khách chịu lắng nghe",
      "Tạo cảm giác chuyên gia, đáng tin cậy",
      "Giữ bình tĩnh tốt trước khách khó"
    ],
    "watchouts": [
      "Dễ bị hiểu lầm là lạnh lùng, xa cách lúc đầu",
      "Ít nói khiến khách cởi mở khó bắt chuyện"
    ],
    "advice": "Sự trầm tĩnh của bạn tạo niềm tin, chỉ cần thêm một lời chào ấm và một nụ cười khi khách bước vào. Cánh cửa mở sớm giúp chiều sâu của bạn được đón nhận."
  },
  {
    "number": 8,
    "title": "Phong thái uy tín",
    "overview": "Bạn toát ra vẻ chững chạc của người làm được việc. Cách ăn mặc gọn gàng, lời nói chắc chắn, tác phong đâu ra đấy khiến người mới gặp mặc định bạn là quản lý, dù có khi bạn chưa phải. Khách doanh nhân đặc biệt tin kiểu phong thái này, vì họ nhìn thấy ở bạn hình ảnh của chính họ.",
    "strengths": [
      "Được tôn trọng ngay từ lần gặp đầu",
      "Hợp tư vấn khách doanh nhân, đơn hàng lớn",
      "Lời nói có sức nặng khi thương lượng"
    ],
    "watchouts": [
      "Có thể tạo khoảng cách với khách bình dân",
      "Dễ bị nhìn là nghiêm nghị, khó gần"
    ],
    "advice": "Uy tín của bạn mở cửa những cuộc gặp lớn. Hãy chủ động thân thiện trước để khách trẻ hơn hay e ngại cũng thấy thoải mái khi làm việc cùng bạn."
  },
  {
    "number": 9,
    "title": "Phong thái rộng lượng",
    "overview": "Ấn tượng bạn để lại là sự bao dung và thân thiện với tất cả mọi người. Không phân biệt khách sang hay khách bình dân, bạn tiếp ai cũng trọn vẹn như nhau, và người ta cảm nhận được điều đó rất nhanh. Kiểu phong thái này khiến bạn được quý rộng rãi, từ khách hàng, đồng nghiệp đến cả những người chỉ gặp một lần.",
    "strengths": [
      "Được cảm tình rộng rãi từ nhiều kiểu người",
      "Khách bình dân không thấy ngại, khách sang không thấy phiền",
      "Dễ được tin tưởng nhờ sự không toan tính"
    ],
    "watchouts": [
      "Dễ bị nhờ vả vượt phạm vi công việc",
      "Sự xuề xòa có thể làm mờ hình ảnh cao cấp của tiệm"
    ],
    "advice": "Tấm lòng rộng của bạn là điều hiếm, hãy giữ nó đi cùng sự chỉn chu trong tác phong. Rộng lượng trong đối đãi, chuẩn mực trong hình ảnh, đó là sự kết hợp đẹp."
  },
  {
    "number": 11,
    "title": "Phong thái cuốn hút",
    "overview": "Bạn có một sức hút khó gọi tên. Người mới gặp thường cảm thấy dễ chịu lạ khi trò chuyện với bạn, như thể bạn hiểu họ nhiều hơn những gì họ nói. Ánh mắt chăm chú, sự tinh tế trong từng phản hồi khiến khách có cảm giác được nhìn thấy thật sự. Nhiều người quay lại tiệm chỉ để được gặp đúng bạn.",
    "strengths": [
      "Sức hút tự nhiên, khách nhớ và tìm gặp lại",
      "Khiến người đối diện cảm thấy được thấu hiểu",
      "Nhạy bén nhận ra điều khách ngại nói"
    ],
    "watchouts": [
      "Năng lượng dễ hao hụt sau ngày tiếp nhiều khách",
      "Kỳ vọng của mọi người dồn về khiến bạn áp lực"
    ],
    "advice": "Sức hút của bạn đến từ sự nhạy cảm, và sự nhạy cảm cần được nghỉ ngơi. Hãy dành những khoảng lặng giữa các cuộc gặp để luôn trọn vẹn với người đối diện."
  },
  {
    "number": 22,
    "title": "Phong thái vững chãi",
    "overview": "Ấn tượng bạn để lại là sự vững vàng hiếm có. Người đối diện cảm nhận ở bạn một điểm tựa: nói ít làm nhiều, không hứa suông, gặp chuyện lớn vẫn bình tĩnh. Khách có việc quan trọng thường tìm đến bạn, vì họ tin rằng chuyện đã vào tay bạn thì sẽ xong. Đây là kiểu uy tín được xây bằng hành động, không phải lời nói.",
    "strengths": [
      "Được tin cậy giao những việc quan trọng",
      "Bình tĩnh trước tình huống căng thẳng",
      "Uy tín xây bằng kết quả, bền theo thời gian"
    ],
    "watchouts": [
      "Vẻ nghiêm cẩn có thể khiến người mới ngại tiếp cận",
      "Mọi người quen dựa vào bạn nên quên hỏi bạn có ổn không"
    ],
    "advice": "Sự vững chãi của bạn là điểm tựa cho cả đội, và điểm tựa cũng cần được chăm sóc. Hãy tập nói ra khi cần hỗ trợ, đó cũng là một dạng sức mạnh."
  }
];

export const BIRTHDAY_READINGS: NumberReading[] = [
  {
    "number": 1,
    "title": "Người tiên phong",
    "overview": "Sinh vào ngày mang số 1, bạn có sẵn tinh thần chủ động và dám đi trước. Bạn thích tự quyết định, không ngại mở lời và thường là người khởi xướng trong nhóm. Trên bàn đàm phán, đây là lợi thế rõ rệt: đối tác cảm nhận được sự tự tin và dứt khoát ở bạn, và ấn tượng đầu bạn tạo ra thường rất chắc chắn.",
    "strengths": [
      "Chủ động mở lời, dẫn dắt cuộc trò chuyện với khách",
      "Quyết đoán, đưa ra đề xuất rõ ràng khi khách phân vân",
      "Tinh thần tự lập, ít cần nhắc nhở trong công việc"
    ],
    "watchouts": [
      "Đôi khi nói nhiều hơn nghe, dễ lấn lướt khách",
      "Nóng lòng chốt đơn khi khách chưa sẵn sàng",
      "Khó tiếp nhận góp ý vì quen tự quyết"
    ],
    "advice": "Hãy dùng sự quyết đoán để dẫn dắt, nhưng dành phần mở đầu để lắng nghe. Người ta chọn hợp tác vì thấy mình được thấu hiểu trước khi nghe đề xuất."
  },
  {
    "number": 2,
    "title": "Người kết nối",
    "overview": "Số 2 cho bạn sự nhạy cảm tinh tế với cảm xúc người đối diện. Bạn lắng nghe giỏi, biết chờ đúng lúc để lên tiếng và thường là người giữ hòa khí trong đội. Với khách hàng, bạn dễ nhận ra điều họ ngại nói ra, ví dụ băn khoăn về vóc dáng hay ngân sách. Sự dịu dàng có chừng mực này khiến khách tin tưởng và muốn quay lại.",
    "strengths": [
      "Lắng nghe tinh tế, đọc được điều khách chưa nói ra",
      "Khéo léo giữ hòa khí, hợp làm việc nhóm",
      "Kiên nhẫn đồng hành với khách khó tính"
    ],
    "watchouts": [
      "Ngại từ chối, dễ nhận phần thiệt về mình",
      "Do dự khi cần quyết định nhanh",
      "Dễ chạnh lòng vì lời nhận xét vô ý"
    ],
    "advice": "Sự nhạy cảm là tài sản của nghề tư vấn, miễn là bạn giữ được ranh giới. Tập nói rõ quan điểm của mình một cách nhẹ nhàng nhưng dứt khoát."
  },
  {
    "number": 3,
    "title": "Người truyền cảm hứng",
    "overview": "Số 3 mang đến khả năng diễn đạt sinh động và óc sáng tạo tự nhiên. Bạn kể chuyện có duyên, biết làm không khí nhẹ nhõm và giúp người nghe thấy hào hứng. Bạn là người khiến một buổi làm việc không còn khô cứng mà thành cuộc trò chuyện dễ chịu. Khả năng gợi hình ảnh giúp đối tác hình dung được kết quả trước khi nó xảy ra.",
    "strengths": [
      "Nói chuyện có duyên, tạo không khí thoải mái",
      "Sáng tạo trong cách phối và gợi ý trang phục",
      "Truyền cảm hứng, giúp khách hào hứng với lựa chọn"
    ],
    "watchouts": [
      "Dễ sa đà chuyện vui mà quên mục tiêu buổi tư vấn",
      "Hứng thú nhanh nhưng cũng nguội nhanh",
      "Đôi khi hứa nhanh hơn khả năng thực hiện"
    ],
    "advice": "Giữ nét duyên trong lời nói, nhưng luôn quay về trọng tâm là nhu cầu của khách. Ghi chú lại lời hứa để chắc chắn thực hiện đủ."
  },
  {
    "number": 4,
    "title": "Người xây nền",
    "overview": "Số 4 cho bạn tính thực tế, cẩn thận và đáng tin cậy. Bạn làm việc có quy trình, ghi nhớ chi tiết và hiếm khi bỏ sót cam kết hay lịch hẹn. Sự chỉn chu này chính là nền tảng của chữ tín trong kinh doanh. Người ta có thể quên bạn nói gì, nhưng sẽ nhớ cảm giác yên tâm vì bạn luôn làm đúng lời.",
    "strengths": [
      "Cẩn thận với số đo, chi tiết và lịch hẹn",
      "Làm việc có quy trình, ổn định và bền bỉ",
      "Giữ lời, tạo cảm giác đáng tin nơi khách"
    ],
    "watchouts": [
      "Cứng nhắc khi tình huống cần linh hoạt",
      "Chậm thích nghi với cách làm mới",
      "Dễ khắt khe với đồng nghiệp làm khác cách mình"
    ],
    "advice": "Sự chắc chắn của bạn là điểm tựa của cả đội. Thỉnh thoảng hãy cho phép mình thử một cách làm mới, nền móng vững không có nghĩa là không thể mở rộng."
  },
  {
    "number": 5,
    "title": "Người linh hoạt",
    "overview": "Số 5 mang năng lượng tự do, ham trải nghiệm và thích nghi nhanh. Bạn bắt chuyện dễ với nhiều kiểu người, từ lãnh đạo tập đoàn tới chủ xưởng nhỏ. Sự linh hoạt giúp bạn xoay chuyển khéo léo khi kế hoạch thay đổi giữa chừng. Bạn cũng là người nắm xu hướng thị trường sớm hơn phần đông.",
    "strengths": [
      "Thích nghi nhanh với nhiều kiểu khách khác nhau",
      "Nhạy với xu hướng mới về kiểu dáng, chất liệu",
      "Xử lý tình huống phát sinh một cách linh hoạt"
    ],
    "watchouts": [
      "Dễ chán việc lặp lại, khó theo quy trình dài",
      "Phân tán năng lượng vào nhiều thứ cùng lúc",
      "Nhận lời thoáng, đôi khi thiếu theo dõi đến cùng"
    ],
    "advice": "Tận dụng sự linh hoạt để phục vụ đa dạng khách hàng, nhưng mỗi ngày hãy chọn vài việc trọng tâm và hoàn tất trọn vẹn."
  },
  {
    "number": 6,
    "title": "Người chăm sóc",
    "overview": "Số 6 gắn với tinh thần trách nhiệm, gu thẩm mỹ và mong muốn chăm lo cho người khác. Bạn phục vụ bằng sự tận tâm thật lòng, muốn khách được lợi chứ không chỉ muốn bán được hàng. Con mắt thẩm mỹ giúp bạn chăm chút cả sản phẩm lẫn hình ảnh doanh nghiệp. Khách cảm nhận được điều đó và thường giới thiệu thêm người quen.",
    "strengths": [
      "Tận tâm, chăm sóc khách như người thân",
      "Gu thẩm mỹ tốt, tư vấn phối đồ tinh tế",
      "Tinh thần trách nhiệm cao với lời hứa"
    ],
    "watchouts": [
      "Ôm đồm việc của người khác đến quá tải",
      "Dễ phật lòng khi sự tận tâm không được ghi nhận",
      "Can thiệp quá sâu vào lựa chọn của khách"
    ],
    "advice": "Chăm sóc là thế mạnh, nhưng hãy để khách giữ quyền quyết định cuối cùng. Bạn gợi ý, khách lựa chọn, đó là sự tận tâm trưởng thành."
  },
  {
    "number": 7,
    "title": "Người quan sát",
    "overview": "Số 7 cho bạn óc phân tích và chiều sâu suy nghĩ. Bạn thích quan sát trước khi nói, đặt câu hỏi đúng trọng tâm và không tư vấn theo lối mòn. Khách hàng khó tính thường quý kiểu nhân viên như bạn, vì họ nhận được lời khuyên có cơ sở thay vì lời khen xã giao. Bạn cũng học nhanh kiến thức về chất liệu, form dáng và kỹ thuật may.",
    "strengths": [
      "Quan sát kỹ, đặt câu hỏi đúng trọng tâm",
      "Tư vấn có cơ sở, tạo uy tín với khách khó tính",
      "Ham học hỏi kiến thức chuyên môn sâu"
    ],
    "watchouts": [
      "Kín đáo quá mức, khách thấy khó gần lúc đầu",
      "Suy nghĩ nhiều, dễ chần chừ khi cần chốt",
      "Ít chia sẻ khiến đồng nghiệp khó hiểu mình"
    ],
    "advice": "Chiều sâu của bạn là điểm khác biệt, chỉ cần thêm một nụ cười mở đầu. Khách cần cảm thấy được chào đón trước khi được phân tích."
  },
  {
    "number": 8,
    "title": "Người quản trị",
    "overview": "Số 8 mang tư duy kinh doanh và khả năng nhìn ra giá trị. Bạn hiểu con số, nhớ doanh thu, biết gợi ý gói sản phẩm hợp túi tiền mà vẫn nâng giá trị đơn hàng. Bạn đặt mục tiêu rõ ràng và có sức bền để theo đuổi. Trong đội ngũ, bạn thường là người được tin tưởng giao việc lớn và dẫn dắt chỉ tiêu chung.",
    "strengths": [
      "Tư duy con số, nắm chắc doanh thu và chỉ tiêu",
      "Biết nâng giá trị đơn hàng một cách hợp lý",
      "Bền bỉ theo đuổi mục tiêu đã đặt"
    ],
    "watchouts": [
      "Dễ nhìn khách qua giá trị đơn hàng",
      "Tham việc, quên nghỉ ngơi và gia đình",
      "Đôi khi áp tiêu chuẩn cao lên đồng nghiệp"
    ],
    "advice": "Con số là công cụ, mối quan hệ mới là tài sản. Khách được phục vụ tận tình hôm nay chính là doanh thu bền vững của ngày mai."
  },
  {
    "number": 9,
    "title": "Người rộng lượng",
    "overview": "Số 9 gắn với lòng bao dung, lý tưởng và khả năng nhìn bức tranh lớn. Bạn phục vụ khách bằng sự chân thành, không phân biệt đơn lớn hay nhỏ. Sự rộng lượng khiến bạn dễ được quý mến và tạo bầu không khí tích cực trong đội. Bạn cũng có khiếu truyền đạt, giúp đồng nghiệp mới hòa nhập và tiến bộ nhanh hơn.",
    "strengths": [
      "Chân thành, phục vụ đồng đều mọi khách hàng",
      "Bao dung, dễ được đồng nghiệp và khách quý mến",
      "Có khiếu hướng dẫn, nâng đỡ người mới"
    ],
    "watchouts": [
      "Dễ xúc động, mang cảm xúc công việc về nhà",
      "Lý tưởng hóa, thất vọng khi thực tế không như mong đợi",
      "Quên chăm lo quyền lợi của chính mình"
    ],
    "advice": "Cho đi là bản năng đẹp của bạn, hãy cho đi có chọn lọc để không cạn năng lượng. Người phục vụ tốt nhất là người còn đầy năng lượng."
  },
  {
    "number": 11,
    "title": "Người trực giác",
    "overview": "Số 11 là số bậc cao, mang trực giác mạnh và khả năng truyền cảm hứng tự nhiên. Bạn thường cảm nhận đúng tâm trạng khách ngay khi họ bước vào, và lời nói của bạn có sức chạm hơn bình thường. Đi kèm là độ nhạy cảm cao, bạn dễ căng thẳng khi môi trường ồn ào áp lực. Khi giữ được bình tĩnh, bạn là người tư vấn khiến khách nhớ mãi.",
    "strengths": [
      "Trực giác nhạy, đọc đúng tâm trạng khách",
      "Lời nói có sức truyền cảm hứng",
      "Tiêu chuẩn cao, hướng đến sự tinh tế"
    ],
    "watchouts": [
      "Nhạy cảm cao, dễ căng thẳng khi áp lực",
      "Kỳ vọng lớn ở bản thân, dễ tự trách",
      "Tâm trạng lên xuống ảnh hưởng chất lượng phục vụ"
    ],
    "advice": "Tin vào trực giác nhưng nuôi nó bằng nghỉ ngơi điều độ. Một tâm trí yên là chiếc ăng-ten tốt nhất của người số 11."
  },
  {
    "number": 22,
    "title": "Người kiến tạo",
    "overview": "Số 22 là số bậc cao hiếm gặp, kết hợp tầm nhìn lớn với khả năng thực thi thực tế. Bạn không chỉ muốn bán tốt hôm nay mà còn nghĩ đến cách xây quy trình, xây tập khách lâu dài. Bạn kiên trì, làm việc có hệ thống và truyền được sự tin cậy. Nếu được giao việc xây dựng, từ chuẩn dịch vụ đến đào tạo người mới, bạn phát huy trọn vẹn.",
    "strengths": [
      "Tầm nhìn dài hạn đi kèm khả năng thực thi",
      "Kiên trì xây quy trình, nền tảng bền vững",
      "Tạo được niềm tin lớn nơi khách và đồng đội"
    ],
    "watchouts": [
      "Ôm việc lớn một mình, chậm chia sẻ gánh nặng",
      "Khắt khe với chính mình khi kết quả chưa như ý",
      "Dễ xem nhẹ những niềm vui nhỏ hằng ngày"
    ],
    "advice": "Nghĩ lớn nhưng bắt đầu từ việc chuẩn từng số đo, từng lời hẹn. Công trình bền nhất được xây từ những viên gạch đều tay."
  }
];

export const ATTITUDE_READINGS: NumberReading[] = [
  {
    "number": 1,
    "title": "Thái độ chủ động",
    "overview": "Ấn tượng đầu bạn tạo ra là sự nhanh nhẹn và dứt khoát. Gặp việc, bạn phản ứng bằng hành động thay vì chờ đợi, nên người khác thấy bạn tự tin và có chính kiến. Ở showroom, khách cảm nhận được sự sốt sắng ngay khi bạn chào đón. Chỉ cần nhớ rằng phản ứng nhanh của bạn đôi khi bị hiểu nhầm là vội vàng hoặc lấn át người đối diện.",
    "strengths": [
      "Gây ấn tượng tự tin, dứt khoát từ lần gặp đầu",
      "Phản ứng nhanh, không để khách phải chờ",
      "Sẵn sàng nhận việc, nhận trách nhiệm"
    ],
    "watchouts": [
      "Dễ bị xem là vội hoặc áp đảo người đối diện",
      "Phản ứng trước khi nghe hết vấn đề"
    ],
    "advice": "Chậm lại một nhịp trước khi phản hồi. Sự chủ động cộng thêm sự lắng nghe sẽ thành phong thái của người dẫn dắt."
  },
  {
    "number": 2,
    "title": "Thái độ hòa nhã",
    "overview": "Người khác thấy ở bạn sự mềm mỏng và dễ chịu ngay lần đầu tiếp xúc. Bạn phản ứng bằng cách lắng nghe, quan sát và tìm sự đồng thuận trước khi nêu ý kiến. Điều này khiến khách thấy được tôn trọng và thoải mái chia sẻ nhu cầu thật. Tuy vậy, đôi khi sự nhún nhường khiến người khác tưởng bạn không có quan điểm riêng.",
    "strengths": [
      "Tạo cảm giác dễ chịu, được tôn trọng ngay lần đầu",
      "Lắng nghe trước, phản hồi sau",
      "Khéo giữ hòa khí trong tình huống căng thẳng"
    ],
    "watchouts": [
      "Dễ bị hiểu nhầm là thiếu chính kiến",
      "Ngại va chạm nên chậm nói ra vấn đề"
    ],
    "advice": "Giữ sự hòa nhã nhưng tập kết thúc bằng một đề xuất rõ ràng. Khách quý người dễ chịu và tin người có quan điểm."
  },
  {
    "number": 3,
    "title": "Thái độ tươi vui",
    "overview": "Bạn xuất hiện với năng lượng vui vẻ, lời nói dí dỏm và nụ cười sẵn trên môi. Người đối diện thấy dễ gần, không khí quanh bạn thường nhẹ nhõm. Người mới gặp bạn lần đầu cũng bớt dè dặt, dễ nói ra điều họ thật sự cần. Điều cần lưu ý là trong tình huống nghiêm túc, sự tếu táo không đúng lúc có thể làm giảm độ tin cậy.",
    "strengths": [
      "Dễ gần, làm khách thoải mái nhanh chóng",
      "Khéo pha trò, giảm căng thẳng khi thử đồ",
      "Năng lượng tích cực lan tỏa trong đội"
    ],
    "watchouts": [
      "Đùa chưa đúng lúc trong tình huống nghiêm túc",
      "Dễ bị đánh giá là thiếu chiều sâu nếu chỉ thấy mặt vui"
    ],
    "advice": "Niềm vui là món quà bạn mang cho khách, hãy dùng đúng liều. Biết lúc nào cười và lúc nào nghiêm túc là đẳng cấp của người tư vấn."
  },
  {
    "number": 4,
    "title": "Thái độ chỉn chu",
    "overview": "Ấn tượng bạn để lại là sự nghiêm túc, gọn gàng và đáng tin. Bạn phản ứng với mọi việc một cách có trật tự, hỏi rõ ràng, ghi chép cẩn thận. Khách nhìn vào thấy yên tâm khi giao số đo và ngày hẹn cho bạn. Mặt còn lại là bạn có thể bị xem là nguyên tắc, thiếu cởi mở trong lần gặp đầu tiên.",
    "strengths": [
      "Tạo cảm giác đáng tin ngay từ đầu",
      "Tác phong gọn gàng, hỏi và ghi chép rõ ràng",
      "Phản ứng bình tĩnh, có trật tự"
    ],
    "watchouts": [
      "Dễ bị xem là khô khan, nguyên tắc",
      "Chậm bắt nhịp với khách thích không khí thoải mái"
    ],
    "advice": "Thêm một câu hỏi thăm ngoài công việc để làm ấm cuộc gặp. Sự chỉn chu cộng chút gần gũi là công thức của niềm tin."
  },
  {
    "number": 5,
    "title": "Thái độ cởi mở",
    "overview": "Bạn phản ứng với cái mới bằng sự hào hứng, bắt chuyện nhanh và không ngại thay đổi. Người khác thấy bạn thú vị, linh hoạt và giàu năng lượng. Với khách lạ, bạn phá băng giỏi hơn hầu hết mọi người, giúp buổi tư vấn khởi động nhẹ nhàng. Điểm cần để ý là sự hứng khởi dễ khiến bạn nói nhanh, chuyển đề tài liên tục làm khách chưa kịp theo.",
    "strengths": [
      "Phá băng nhanh với khách lần đầu ghé",
      "Hào hứng đón nhận cái mới, xu hướng mới",
      "Linh hoạt đổi hướng khi tình huống thay đổi"
    ],
    "watchouts": [
      "Nói nhanh, đổi đề tài khiến khách khó theo kịp",
      "Dễ hứng thú rồi bỏ dở giữa chừng"
    ],
    "advice": "Giữ nhịp nói chậm hơn suy nghĩ của mình một chút. Cởi mở đúng nhịp của khách sẽ biến sự thú vị thành sự tin cậy."
  },
  {
    "number": 6,
    "title": "Thái độ ân cần",
    "overview": "Người khác cảm nhận ngay sự quan tâm chu đáo ở bạn. Bạn phản ứng bằng cách hỏi han, chăm lo, để ý những chi tiết nhỏ mà người khác bỏ qua. Đây là thái độ rất hợp với các ngành dịch vụ cao cấp, nơi khách trả tiền cho cả trải nghiệm. Chỉ cần tránh chăm sóc quá mức khiến người ta ngại, hoặc ôm việc thay cấp dưới.",
    "strengths": [
      "Chu đáo tự nhiên, khách cảm nhận được ngay",
      "Để ý chi tiết nhỏ trong trải nghiệm của khách",
      "Tạo cảm giác được chăm lo như người thân"
    ],
    "watchouts": [
      "Chăm sóc quá mức khiến khách thấy ngại",
      "Nhận việc thay người khác đến quá tải"
    ],
    "advice": "Ân cần vừa đủ để khách thấy được quý trọng mà vẫn tự nhiên. Sự chăm sóc tinh tế nhất là loại không gây áp lực."
  },
  {
    "number": 7,
    "title": "Thái độ điềm tĩnh",
    "overview": "Ấn tượng đầu bạn tạo ra là sự trầm ổn và kín đáo. Bạn quan sát trước, nói sau, và lời nói ra thường có trọng lượng. Khách nghiêm túc đánh giá cao phong thái này vì thấy mình được tư vấn bởi người có suy nghĩ, không nói cho có. Đổi lại, người mới gặp có thể thấy bạn hơi xa cách, khó bắt chuyện trong vài phút đầu.",
    "strengths": [
      "Phong thái trầm ổn, lời nói có trọng lượng",
      "Quan sát kỹ trước khi phản hồi",
      "Được khách nghiêm túc tin tưởng"
    ],
    "watchouts": [
      "Dễ bị xem là lạnh hoặc xa cách lúc đầu",
      "Ít nói khiến khách khó đoán suy nghĩ của bạn"
    ],
    "advice": "Chủ động mỉm cười và mở lời trước, phần còn lại phong thái của bạn sẽ tự thuyết phục. Điềm tĩnh cộng thân thiện chính là sự sang trọng."
  },
  {
    "number": 8,
    "title": "Thái độ tự tin",
    "overview": "Bạn xuất hiện với dáng vẻ chắc chắn, nói năng rõ ràng và toát ra năng lượng của người làm được việc. Người khác dễ tin tưởng và giao phó cho bạn. Khách hàng doanh nhân đặc biệt hợp với phong thái này, họ thấy mình đang nói chuyện với người ngang tầm. Điều nên để ý là sự tự tin mạnh có thể bị nhìn thành áp đặt nếu thiếu sự mềm mỏng đi kèm.",
    "strengths": [
      "Toát ra sự chắc chắn, đáng tin cậy",
      "Nói năng rõ ràng, đi thẳng vào việc",
      "Hợp phong thái với khách hàng doanh nhân"
    ],
    "watchouts": [
      "Dễ bị nhìn thành áp đặt, hơn thua",
      "Thiếu kiên nhẫn với người chậm quyết định"
    ],
    "advice": "Dùng sự tự tin để dẫn đường, không phải để thắng cuộc trò chuyện. Người bán giỏi nhất khiến khách thấy chính họ là người quyết định."
  },
  {
    "number": 9,
    "title": "Thái độ bao dung",
    "overview": "Người đối diện cảm nhận ở bạn sự rộng rãi, thân thiện và không phán xét. Bạn phản ứng với mọi người bằng thiện chí, kể cả khách khó tính hay đồng nghiệp đang căng thẳng. Điều này giúp bạn hóa giải nhiều tình huống khó một cách nhẹ nhàng. Mặt cần lưu ý là bạn dễ cả nể, nhận thiệt về mình và đôi khi cảm xúc dâng cao hơn mức cần thiết.",
    "strengths": [
      "Thiện chí với mọi kiểu khách, không phán xét",
      "Hóa giải khéo các tình huống căng thẳng",
      "Tạo thiện cảm rộng rãi trong đội và với khách"
    ],
    "watchouts": [
      "Cả nể, dễ nhận phần thiệt về mình",
      "Cảm xúc dâng cao khi gặp chuyện bất bình"
    ],
    "advice": "Lòng bao dung của bạn là điều hiếm, hãy kèm theo ranh giới rõ ràng. Giúp người đúng cách quan trọng hơn giúp bằng mọi giá."
  }
];

export const MATURITY_READINGS: NumberReading[] = [
  {
    "number": 1,
    "title": "Trưởng thành tự chủ",
    "overview": "Càng chín chắn, bạn càng hướng đến sự độc lập và vai trò dẫn dắt. Sau tuổi 35-40, bạn không còn muốn chỉ làm theo mà muốn tự mở lối: lập doanh nghiệp riêng, dẫn một đội hoặc chuyển sang một hướng đi mới. Giai đoạn này thưởng cho người dám nhận trách nhiệm, và bản lĩnh tích luỹ từ những năm làm nghề sẽ thành vốn quý.",
    "strengths": [
      "Ngày càng vững trong vai trò dẫn dắt",
      "Dám nhận trách nhiệm lớn hơn",
      "Tự tin mở lối đi riêng cho mình"
    ],
    "watchouts": [
      "Dễ đơn độc nếu không xây đội ngũ đồng hành",
      "Cái tôi lớn dần theo thành tựu"
    ],
    "advice": "Trưởng thành của số 1 là dẫn dắt mà không cần áp đặt. Hãy nâng người khác lên cùng, vị trí của bạn sẽ tự vững."
  },
  {
    "number": 2,
    "title": "Trưởng thành kết nối",
    "overview": "Chặng sau của đời bạn xoay quanh các mối quan hệ sâu sắc và vai trò người kết nối. Bạn dần trở thành chỗ dựa tinh thần của đội, người mà khách lâu năm chỉ muốn gặp đúng bạn mỗi lần ghé tiệm. Thành công giai đoạn này không đến từ sự nổi bật, mà từ mạng lưới tin cậy bạn kiên nhẫn vun đắp qua từng năm tháng làm nghề.",
    "strengths": [
      "Trở thành chỗ dựa tin cậy của đội",
      "Giữ chân khách lâu năm bằng mối quan hệ thật",
      "Khéo léo hòa giải, gắn kết mọi người"
    ],
    "watchouts": [
      "Sống vì người khác mà quên chính mình",
      "Nhạy cảm hơn với những đổi thay trong quan hệ"
    ],
    "advice": "Mạng lưới bạn vun đắp chính là sự nghiệp. Hãy chăm nó như chăm một khu vườn, đều đặn và không vụ lợi."
  },
  {
    "number": 3,
    "title": "Trưởng thành biểu đạt",
    "overview": "Càng về sau, bạn càng tìm thấy niềm vui trong việc thể hiện và truyền đạt. Kinh nghiệm nghề tích lũy sẽ muốn được kể ra, qua đào tạo người mới, chia sẻ trên mạng xã hội hay góp phần xây hình ảnh cho thương hiệu. Giai đoạn này cuộc sống của bạn nhẹ nhõm hơn, sáng tạo hơn, miễn là bạn giữ được sự tập trung vào điều quan trọng.",
    "strengths": [
      "Truyền đạt kinh nghiệm hấp dẫn, dễ hiểu",
      "Sáng tạo nội dung, hình ảnh cho nghề",
      "Tinh thần lạc quan lan tỏa quanh mình"
    ],
    "watchouts": [
      "Phân tán vào quá nhiều mối quan tâm",
      "Nói giỏi hơn làm nếu thiếu kỷ luật"
    ],
    "advice": "Chọn một sân khấu chính cho tiếng nói của mình và đầu tư nghiêm túc. Câu chuyện nghề của bạn xứng đáng được kể có chiều sâu."
  },
  {
    "number": 4,
    "title": "Trưởng thành nền tảng",
    "overview": "Sau tuổi 35-40, bạn hướng đến sự ổn định và những công trình bền vững. Bạn muốn quy trình chuẩn, tài chính vững, tay nghề sâu thay vì thành tích nhất thời. Đây là giai đoạn bạn tự nhiên trở thành trụ cột chuyên môn, người giữ chuẩn mực chất lượng cho cả đội. Sự bền bỉ âm thầm của bạn sẽ được nhìn nhận một cách xứng đáng.",
    "strengths": [
      "Trở thành trụ cột chuyên môn của đội",
      "Xây quy trình, chuẩn mực bền vững",
      "Tài chính và sự nghiệp ổn định dần"
    ],
    "watchouts": [
      "Ngại thay đổi khi thị trường dịch chuyển",
      "Quá tập trung công việc, quên tận hưởng cuộc sống"
    ],
    "advice": "Nền móng bạn xây rất quý, hãy chừa cửa cho cái mới. Ổn định thật sự là khả năng thích nghi mà không mất gốc."
  },
  {
    "number": 5,
    "title": "Trưởng thành tự do",
    "overview": "Chặng trưởng thành của bạn mở rộng về trải nghiệm. Bạn muốn được thử vai trò mới, đi nhiều nơi, học thêm kỹ năng thay vì đóng khung một chỗ. Với nghề thời trang, đây là lợi thế vì thị hiếu luôn đổi. Người số 5 trưởng thành đẹp nhất khi biến sự ưa thay đổi thành khả năng dẫn đầu xu hướng, thay vì thành sự bất ổn trong công việc.",
    "strengths": [
      "Luôn tươi mới, bắt nhịp xu hướng nhanh",
      "Dám thử vai trò và thử thách mới",
      "Kể chuyện trải nghiệm hấp dẫn, cuốn khách"
    ],
    "watchouts": [
      "Bất ổn nếu thay đổi thiếu định hướng",
      "Khó cam kết dài hạn với một con đường"
    ],
    "advice": "Tự do có kỷ luật là đích đến của bạn. Chọn chiếc neo là giá trị nghề, còn cánh buồm cứ thoải mái đón gió."
  },
  {
    "number": 6,
    "title": "Trưởng thành yêu thương",
    "overview": "Càng chín chắn, bạn càng đặt gia đình, đội ngũ và trách nhiệm cộng đồng vào trung tâm. Bạn muốn nơi làm việc như mái nhà thứ hai, muốn khách được chăm như người thân. Giai đoạn này bạn hợp với vai trò quản lý con người, đào tạo và giữ văn hóa đội. Hạnh phúc của bạn đến từ sự trưởng thành của những người quanh mình.",
    "strengths": [
      "Hợp vai trò quản lý và đào tạo con người",
      "Giữ văn hóa đội ấm áp, gắn bó",
      "Chăm sóc khách hàng thân thiết bền lâu"
    ],
    "watchouts": [
      "Gánh trách nhiệm của người khác quá nhiều",
      "Buồn lòng khi người mình lo không như kỳ vọng"
    ],
    "advice": "Yêu thương trưởng thành là trao quyền, không phải làm thay. Hãy để người khác lớn lên bằng chính trải nghiệm của họ."
  },
  {
    "number": 7,
    "title": "Trưởng thành chiêm nghiệm",
    "overview": "Chặng sau cuộc đời bạn hướng vào chiều sâu, hiểu nghề, hiểu người, hiểu mình. Bạn ít quan tâm hào nhoáng, muốn trở thành chuyên gia thật sự về vải vóc, form dáng, phong cách. Người số 7 trưởng thành thường thành cố vấn được kính trọng, người mà cả đội tìm đến khi gặp ca khó. Hãy dành đủ thời gian tĩnh lặng để nạp lại chính mình.",
    "strengths": [
      "Trở thành chuyên gia có chiều sâu về nghề",
      "Được tin tưởng hỏi ý trong những ca khó",
      "Bình thản trước áp lực bên ngoài"
    ],
    "watchouts": [
      "Thu mình quá mức, xa rời đội ngũ",
      "Khắt khe với sự hời hợt của người khác"
    ],
    "advice": "Chiều sâu của bạn cần được chia sẻ mới trọn giá trị. Mỗi tuần một lần, hãy chủ động truyền lại điều mình chiêm nghiệm được."
  },
  {
    "number": 8,
    "title": "Trưởng thành thành tựu",
    "overview": "Sau tuổi 35-40, năng lượng của bạn dồn vào thành tựu và sự vững vàng tài chính. Bạn muốn thấy kết quả đo đếm được, vị trí xứng đáng và sự ghi nhận rõ ràng. Đây là giai đoạn bạn có thể vươn lên vai trò điều hành, quản lý doanh thu hoặc phát triển kinh doanh. Bài học đi kèm là giữ cân bằng giữa thành tựu và con người.",
    "strengths": [
      "Năng lực điều hành, quản lý theo kết quả",
      "Nhạy bén với cơ hội kinh doanh",
      "Tạo được vị thế và sự ghi nhận rõ ràng"
    ],
    "watchouts": [
      "Đo mọi thứ bằng con số, kể cả quan hệ",
      "Áp lực thành tựu lấn át sức khỏe và gia đình"
    ],
    "advice": "Thành tựu bền nhất là đội ngũ giỏi và khách hàng trung thành. Đầu tư vào con người, con số sẽ theo sau."
  },
  {
    "number": 9,
    "title": "Trưởng thành cống hiến",
    "overview": "Chặng trưởng thành của bạn mang màu sắc cho đi. Bạn muốn kinh nghiệm của mình giúp được nhiều người hơn, qua đào tạo, dẫn dắt hay các hoạt động cộng đồng. Bạn nhìn nghề rộng ra: không chỉ bán một sản phẩm mà tạo ra việc làm, đào tạo con người và góp phần cho ngành mình đang theo. Ý nghĩa đó sẽ là nguồn năng lượng chính của bạn giai đoạn này.",
    "strengths": [
      "Truyền nghề, dẫn dắt thế hệ sau",
      "Nhìn được ý nghĩa lớn trong việc nhỏ",
      "Được quý trọng bởi sự chân thành cho đi"
    ],
    "watchouts": [
      "Cho đi quá sức, quên tích lũy cho mình",
      "Thất vọng khi sự cống hiến bị xem nhẹ"
    ],
    "advice": "Cống hiến bền vững cần một nền tài chính và sức khỏe vững. Lo cho mình đủ đầy để có thể cho đi lâu dài."
  },
  {
    "number": 11,
    "title": "Trưởng thành soi đường",
    "overview": "Số 11 ở giai đoạn trưởng thành mời gọi bạn trở thành người truyền cảm hứng. Trực giác và độ nhạy tích lũy qua năm tháng giúp bạn nhìn thấu vấn đề nhanh hơn người khác. Bạn hợp vai trò cố vấn, người định hướng tinh thần cho đội. Thử thách là giữ tinh thần vững trước sự nhạy cảm của chính mình, để ngọn đèn sáng đều thay vì chập chờn.",
    "strengths": [
      "Trực giác chín, nhìn thấu vấn đề nhanh",
      "Truyền cảm hứng và định hướng cho đội",
      "Tiêu chuẩn thẩm mỹ và tinh thần cao"
    ],
    "watchouts": [
      "Căng thẳng nội tâm nếu thiếu nghỉ ngơi",
      "Kỳ vọng cao dễ chuyển thành thất vọng sâu"
    ],
    "advice": "Người soi đường trước hết phải giữ ngọn đèn của mình sáng đều. Nghỉ ngơi và đời sống tinh thần ổn định là nhiệm vụ, không phải phần thưởng."
  },
  {
    "number": 22,
    "title": "Trưởng thành kiến tạo lớn",
    "overview": "Số 22 ở chặng trưởng thành hướng bạn đến những công trình để đời: một hệ thống vận hành trơn tru, một lớp quản lý do chính bạn đào tạo, một chuẩn mực nghề mang dấu ấn của bạn. Bạn có cả tầm nhìn lẫn tính thực tế để làm được điều đó. Điều cần nhất là sự kiên nhẫn với chính mình và dám chia việc cho người khác cùng gánh.",
    "strengths": [
      "Kết hợp tầm nhìn lớn và thực thi chắc tay",
      "Xây hệ thống, chuẩn mực để lại lâu dài",
      "Uy tín ngày càng vững trong tổ chức"
    ],
    "watchouts": [
      "Tự tạo áp lực phải làm điều vĩ đại",
      "Ôm việc, chậm ủy quyền cho người khác"
    ],
    "advice": "Công trình lớn cần nhiều bàn tay. Trưởng thành của số 22 là biến tầm nhìn của mình thành việc chung mà ai cũng muốn góp phần."
  }
];

export const PERSONAL_YEAR_READINGS: PersonalYearReading[] = [
  {
    "number": 1,
    "title": "Năm khởi đầu",
    "overview": "Năm cá nhân số 1 mở ra một chu kỳ chín năm mới. Đây là lúc gieo hạt, bắt đầu thói quen mới, học kỹ năng mới, nhận thử thách mới trong công việc. Năng lượng năm nay ủng hộ sự chủ động và dám làm. Điều bạn khởi sự năm nay sẽ định hình vài năm tới, nên hãy chọn hướng đi có chủ đích thay vì để trôi theo quán tính cũ.",
    "focus": [
      "Bắt đầu một kỹ năng hoặc vai trò mới trong nghề",
      "Chủ động đề xuất ý tưởng với quản lý",
      "Xây thói quen làm việc mới, kỷ luật hơn"
    ],
    "advice": "Đừng chờ đủ tự tin mới bắt đầu. Năm số 1 thưởng cho người dám đi bước đầu tiên."
  },
  {
    "number": 2,
    "title": "Năm vun đắp",
    "overview": "Sau năm khởi đầu, năm số 2 chậm lại để vun đắp. Trọng tâm là các mối quan hệ, với khách hàng, đồng nghiệp và người thân. Việc lớn tiến triển từ từ, cần kiên nhẫn và hợp tác thay vì thúc ép. Đây là năm đẹp để chăm sóc khách cũ, hàn gắn những mối quan hệ đang lỏng lẻo và học cách lắng nghe sâu hơn người đối diện.",
    "focus": [
      "Chăm sóc lại danh sách khách cũ, khách thân thiết",
      "Vun đắp quan hệ đồng nghiệp, học cách phối hợp",
      "Kiên nhẫn với các kế hoạch đang ươm mầm"
    ],
    "advice": "Năm nay hạt giống đang bén rễ dưới đất, đừng sốt ruột đào lên xem. Kiên nhẫn và tử tế là chiến lược tốt nhất."
  },
  {
    "number": 3,
    "title": "Năm nở rộ",
    "overview": "Năm số 3 mang năng lượng vui tươi, giao tiếp và sáng tạo. Các mối quan hệ xã hội mở rộng, lời nói của bạn có sức hút hơn, ý tưởng đến dễ dàng hơn. Đây là năm đẹp để xuất hiện nhiều hơn, trước khách, trên mạng xã hội, trong các buổi sinh hoạt đội. Lưu ý duy nhất là giữ tập trung, tránh vui quá đà mà xao nhãng mục tiêu chính.",
    "focus": [
      "Xuất hiện nhiều hơn khi tư vấn, chia sẻ, kết nối",
      "Thử sức sáng tạo nội dung, hình ảnh cho nghề",
      "Giữ một mục tiêu chính để không phân tán"
    ],
    "advice": "Hãy để mình được tỏa sáng năm nay, nhưng chọn sân khấu xứng đáng. Niềm vui có định hướng sẽ thành cơ hội."
  },
  {
    "number": 4,
    "title": "Năm xây nền",
    "overview": "Năm số 4 gọi bạn về với sự chăm chỉ và trật tự. Đây là năm của làm việc bền bỉ, hoàn thiện kỹ năng, sắp xếp lại tài chính và sức khỏe. Kết quả năm nay không ồn ào nhưng chắc chắn, từng viên gạch bạn đặt sẽ đỡ cho những năm sau. Tránh tâm lý thấy nặng nhọc mà buông, vì đây chính là năm tạo độ vững cho cả chu kỳ.",
    "focus": [
      "Rèn kỹ năng chuyên môn một cách hệ thống",
      "Sắp xếp lại tài chính cá nhân, chi tiêu kỷ luật",
      "Chăm nền tảng sức khỏe, ngủ nghỉ điều độ"
    ],
    "advice": "Năm nay chậm mà chắc. Mỗi việc nhỏ làm tử tế hôm nay là phần móng cho thành quả hai ba năm tới."
  },
  {
    "number": 5,
    "title": "Năm chuyển động",
    "overview": "Năm số 5 mang theo gió thay đổi. Có thể là vai trò mới, môi trường mới, cơ hội bất ngờ hoặc những chuyến đi. Năng lượng năm nay khuyến khích bạn linh hoạt, thử cái mới và bước ra khỏi vùng quen thuộc. Thay đổi sẽ đến dù bạn muốn hay không, nên tư thế tốt nhất là chủ động đón nó với tinh thần học hỏi và cởi mở.",
    "focus": [
      "Đón nhận thay đổi trong công việc với tâm thế mở",
      "Học một điều mới hẳn về kỹ năng, công cụ, xu hướng",
      "Cẩn trọng với quyết định bốc đồng về tiền bạc"
    ],
    "advice": "Gió đổi chiều là lúc người biết chỉnh buồm đi nhanh nhất. Linh hoạt nhưng giữ chặt vài nguyên tắc cốt lõi."
  },
  {
    "number": 6,
    "title": "Năm trách nhiệm",
    "overview": "Năm số 6 đặt gia đình, đội ngũ và trách nhiệm vào trung tâm. Bạn có thể được giao thêm việc, được nhờ cậy nhiều hơn, và người thân cũng cần bạn hơn. Đây là năm đẹp để vun vén tổ ấm, gắn kết đội và chăm sóc khách hàng bằng sự tận tâm. Điều bạn cho đi năm nay sẽ được đáp lại bằng sự tin yêu bền vững về sau.",
    "focus": [
      "Dành thời gian chất lượng cho gia đình",
      "Nhận vai trò chăm lo, gắn kết trong đội",
      "Nâng chất lượng chăm sóc khách hàng thân thiết"
    ],
    "advice": "Trách nhiệm năm nay là vinh dự chứ không phải gánh nặng. Chỉ cần nhớ chia sức, đừng gánh một mình."
  },
  {
    "number": 7,
    "title": "Năm chiêm nghiệm",
    "overview": "Năm số 7 lắng xuống để bạn học và hiểu. Nhịp bên ngoài có thể chậm lại, bù lại chiều sâu bên trong tăng lên. Đây là năm đẹp để học bài bản, đọc sách, rèn tay nghề và nhìn lại con đường mình đang đi. Đừng lo lắng nếu thấy mình muốn ở một mình nhiều hơn, đó là cách năm số 7 giúp bạn nạp lại năng lượng.",
    "focus": [
      "Học sâu một mảng chuyên môn như vải, form dáng, phong cách",
      "Dành thời gian tĩnh để nhìn lại định hướng",
      "Chăm đời sống tinh thần, ngủ đủ, bớt ồn ào"
    ],
    "advice": "Năm nay phần thưởng nằm ở bên trong. Điều bạn hiểu ra trong năm số 7 sẽ thành lợi thế khi chu kỳ tăng tốc trở lại."
  },
  {
    "number": 8,
    "title": "Năm gặt hái",
    "overview": "Năm số 8 là mùa gặt của chu kỳ. Nỗ lực những năm trước có cơ hội quy thành kết quả cụ thể như thăng tiến, thu nhập, sự ghi nhận. Năng lượng năm nay ủng hộ sự quyết đoán, đàm phán và quản lý tài chính khôn ngoan. Hãy đặt mục tiêu rõ ràng và dám nhận việc lớn, đây là năm nỗ lực của bạn được nhìn thấy rõ nhất.",
    "focus": [
      "Đặt mục tiêu doanh số, thu nhập cụ thể và theo sát",
      "Dám nhận dự án lớn, vị trí lớn hơn",
      "Quản lý tiền bạc chặt chẽ, tránh phô trương"
    ],
    "advice": "Gặt hái xứng đáng nhưng đừng gặt non. Làm việc đàng hoàng, con số đẹp năm nay sẽ mở cửa cho nhiều năm sau."
  },
  {
    "number": 9,
    "title": "Năm hoàn tất",
    "overview": "Năm số 9 khép lại chu kỳ chín năm. Đây là lúc hoàn tất việc dang dở, tổng kết bài học và buông những gì không còn phù hợp, một thói quen cũ, một cách làm cũ, có khi là một mối quan hệ đã cạn. Cảm xúc năm nay có thể dâng cao hơn thường lệ. Dọn dẹp xong, bạn sẽ nhẹ nhõm bước vào chu kỳ mới với đôi tay rảnh rang.",
    "focus": [
      "Hoàn tất các việc còn dang dở trong năm",
      "Tổng kết bài học, ghi lại điều muốn giữ và muốn bỏ",
      "Buông bớt điều không còn phù hợp một cách nhẹ nhàng"
    ],
    "advice": "Đừng vội gieo hạt mới trên mảnh đất chưa dọn. Kết thúc trọn vẹn năm nay chính là món quà cho năm khởi đầu sắp tới."
  }
];

export const ARROW_READINGS: ArrowReading[] = [
  {
    "key": "123",
    "name": "Mũi tên Kế hoạch",
    "presentDesc": "Có đủ 1, 2, 3 trong biểu đồ, bạn là người có óc tổ chức và yêu sự ngăn nắp. Bạn thích sắp xếp công việc theo trình tự, làm đâu gọn đấy. Trong bán hàng, bạn là người quản lý lịch hẹn, đơn hàng và quy trình chăm khách rất đáng tin cậy.",
    "presentTips": [
      "Nhận vai trò sắp xếp lịch hẹn, quy trình cho đội",
      "Chia mục tiêu tháng thành kế hoạch tuần rõ ràng"
    ],
    "missingName": "Mũi tên Hoài nghi",
    "missingDesc": "Trống cả 1, 2, 3, bạn có xu hướng làm việc theo cảm hứng và hay tự hỏi lại quyết định của mình. Kế hoạch dài hơi dễ khiến bạn thấy ngợp. Bù lại, bạn thường cẩn trọng, không cả tin và ít khi bị cuốn theo phong trào.",
    "missingTips": [
      "Dùng sổ tay hoặc ứng dụng nhắc việc mỗi ngày",
      "Chia việc lớn thành từng bước nhỏ vài ngày một để dễ theo"
    ]
  },
  {
    "key": "456",
    "name": "Mũi tên Ý chí",
    "presentDesc": "Có đủ 4, 5, 6, bạn sở hữu ý chí mạnh và sự kiên định hiếm có. Khi đã quyết, bạn theo đến cùng, khó khăn chỉ làm bạn thêm bền bỉ. Trong nghề, bạn là người giữ vững chỉ tiêu kể cả những tháng thấp điểm.",
    "presentTips": [
      "Nhận những mục tiêu thách thức để phát huy sức bền",
      "Chia sẻ cách giữ kỷ luật của mình cho đồng nghiệp trẻ"
    ],
    "missingName": "Mũi tên Thất vọng",
    "missingDesc": "Trống 4, 5, 6, bạn dễ nản khi kết quả không đến nhanh và hay so kỳ vọng với thực tế. Cảm giác thất vọng thường đến từ việc đặt mong đợi quá cao. Nhận ra điều này, bạn hoàn toàn rèn được sức bền qua từng mục tiêu nhỏ.",
    "missingTips": [
      "Đặt kỳ vọng thực tế, ghi nhận từng bước tiến nhỏ",
      "Khi nản, cho phép mình nghỉ ngắn rồi quay lại, đừng bỏ hẳn"
    ]
  },
  {
    "key": "789",
    "name": "Mũi tên Hoạt động",
    "presentDesc": "Có đủ 7, 8, 9, bạn là người của hành động, tay chân luôn muốn được làm việc. Bạn học qua thực hành nhanh hơn qua sách vở, và showroom đông khách chính là môi trường của bạn. Năng lượng dồi dào này dễ lan tỏa sang cả đội.",
    "presentTips": [
      "Xung phong đứng ca ở khung giờ cao điểm đông khách",
      "Xen kẽ nghỉ ngắn để năng lượng bền suốt cả ngày"
    ],
    "missingName": "Mũi tên Thụ động",
    "missingDesc": "Trống 7, 8, 9, bạn thiên về suy nghĩ hơn hành động, thích được giao việc rõ ràng rồi mới bắt tay làm. Nhịp của bạn chậm rãi và chắc chắn, nhưng dễ bỏ lỡ cơ hội cần sự nhanh nhạy. Chủ động từng việc nhỏ sẽ thay đổi đáng kể kết quả.",
    "missingTips": [
      "Mỗi ngày chủ động làm trước một việc không cần ai nhắc",
      "Đặt quy tắc phản hồi khách trong khung thời gian cố định"
    ]
  },
  {
    "key": "147",
    "name": "Mũi tên Thực tế",
    "presentDesc": "Có đủ 1, 4, 7, bạn có đôi tay khéo và đầu óc thực tế. Bạn đánh giá mọi việc bằng kết quả cụ thể, ít khi mơ hồ. Bạn nhạy với chất lượng vật tư, độ chuẩn của quy trình và những chi tiết làm nên giá trị thật của sản phẩm.",
    "presentTips": [
      "Tận dụng sự tinh tường về chất liệu khi tư vấn khách",
      "Làm cầu nối giữa bộ phận bán hàng và xưởng may"
    ],
    "missingName": "Mũi tên Thiếu thực tế",
    "missingDesc": "Trống 1, 4, 7, bạn giàu trí tưởng tượng và hay nghĩ về bức tranh lớn, nhưng phần triển khai chi tiết dễ bị bỏ ngỏ. Ý tưởng của bạn thường hay, chỉ cần thêm người đồng hành hoặc công cụ giúp bám sát thực tế.",
    "missingTips": [
      "Ghép cặp với đồng nghiệp giỏi chi tiết khi làm việc lớn",
      "Trước khi đề xuất, tự hỏi ai làm, bao giờ xong, tốn bao nhiêu"
    ]
  },
  {
    "key": "258",
    "name": "Mũi tên Cảm xúc thăng bằng",
    "presentDesc": "Có đủ 2, 5, 8, bạn giữ được sự điềm tĩnh hiếm có trước cảm xúc của người khác. Khách nóng tính hay đồng nghiệp căng thẳng đều dịu lại khi làm việc với bạn. Đây là năng lực quý trong dịch vụ cao cấp, nơi trải nghiệm êm ái là điều khách trả tiền để có.",
    "presentTips": [
      "Nhận xử lý các ca khách phàn nàn, khiếu nại",
      "Làm điểm tựa tinh thần cho đội trong mùa cao điểm"
    ],
    "missingName": "Mũi tên Nhạy cảm",
    "missingDesc": "Trống 2, 5, 8, cảm xúc của bạn dễ dao động theo lời nói và thái độ của người khác. Một câu chê của khách có thể theo bạn cả ngày. Độ nhạy này thực ra là chiếc ăng-ten quý nếu bạn học được cách tiếp nhận mà không tự trách.",
    "missingTips": [
      "Tách bạch rõ: khách góp ý về sản phẩm, không chê con người bạn",
      "Cuối ngày ghi ra một điều mình làm tốt để cân lại cảm xúc"
    ]
  },
  {
    "key": "369",
    "name": "Mũi tên Trí tuệ",
    "presentDesc": "Có đủ 3, 6, 9, bạn có trí nhớ tốt và đầu óc sáng. Bạn nhớ tên khách, nhớ sở thích, nhớ lịch sử đơn hàng, những điều khiến khách cảm thấy mình đặc biệt. Khả năng tiếp thu nhanh giúp bạn nắm kiến thức sản phẩm vượt trội so với mặt bằng chung.",
    "presentTips": [
      "Tận dụng trí nhớ để cá nhân hóa trải nghiệm từng khách",
      "Nhận vai trò đào tạo kiến thức sản phẩm cho đội"
    ],
    "missingName": "Mũi tên Trí nhớ kém",
    "missingDesc": "Trống 3, 6, 9, bạn dễ quên chi tiết nếu không ghi lại, nhất là khi nhiều việc dồn dập. Đây không phải là kém thông minh, mà là kiểu trí nhớ cần công cụ hỗ trợ. Thói quen ghi chép tốt sẽ xóa gần hết bất lợi này.",
    "missingTips": [
      "Ghi chú ngay sau mỗi buổi tư vấn: tên, số đo, sở thích của khách",
      "Dùng nhắc lịch cho mọi cam kết với khách"
    ]
  },
  {
    "key": "159",
    "name": "Mũi tên Quyết tâm",
    "presentDesc": "Có đủ 1, 5, 9, bạn là người bền chí hiếm thấy. Mục tiêu đã đặt thì gần như chắc chắn theo đến cùng, dù nhanh hay chậm. Trở ngại với bạn giống bài kiểm tra hơn là lý do dừng lại. Trong nghề bán hàng, bạn là người không bỏ khách giữa chừng.",
    "presentTips": [
      "Theo đuổi tập khách lớn cần chăm sóc dài hạn",
      "Học cách buông đúng lúc với mục tiêu không còn xứng đáng"
    ],
    "missingName": "Mũi tên Trì hoãn",
    "missingDesc": "Trống 1, 5, 9, bạn hay để việc quan trọng lại sau và chờ đủ hứng mới làm. Việc càng lớn càng dễ bị dời. Tin tốt là trì hoãn chỉ là thói quen, không phải tính cách, và có thể thay đổi bằng cách bắt đầu thật nhỏ.",
    "missingTips": [
      "Áp dụng quy tắc 5 phút: cứ bắt đầu 5 phút rồi tính tiếp",
      "Hẹn giờ cụ thể cho việc quan trọng thay vì để lúc nào rảnh"
    ]
  },
  {
    "key": "357",
    "name": "Mũi tên Nhạy bén",
    "presentDesc": "Có đủ 3, 5, 7, bạn có độ nhạy đặc biệt với con người và không khí xung quanh. Bạn cảm được khách đang thoải mái hay gượng gạo trước cả khi họ nói ra. Trực giác này giúp bạn chọn đúng thời điểm tư vấn, đúng lúc im lặng và đúng lúc chốt.",
    "presentTips": [
      "Tin vào cảm nhận đầu tiên về nhu cầu thật của khách",
      "Dùng độ nhạy để chọn thời điểm chốt đơn tự nhiên"
    ],
    "missingName": "Mũi tên Đa nghi",
    "missingDesc": "Trống 3, 5, 7, bạn thường cần bằng chứng rõ ràng mới tin và hay đặt câu hỏi ngược lại mọi lời khẳng định. Điểm mạnh là bạn khó bị qua mặt và thẩm định rất kỹ. Chỉ cần tránh để sự dè chừng thành rào cản với những người thành thật.",
    "missingTips": [
      "Cho khách và đồng nghiệp cơ hội chứng minh trước khi kết luận",
      "Dùng sự cẩn trọng vào việc thẩm định chất lượng, hợp đồng"
    ]
  }
];

export const CHART_DIGIT_MEANINGS: ChartDigitMeaning[] = [
  {
    "digit": 1,
    "meaning": "Số 1 trong biểu đồ đại diện cho khả năng diễn đạt và cái tôi, càng nhiều số 1 càng có nhu cầu thể hiện bản thân qua lời nói."
  },
  {
    "digit": 2,
    "meaning": "Số 2 đại diện cho trực giác và độ nhạy cảm, người có số 2 thường cảm nhận tốt cảm xúc của người đối diện."
  },
  {
    "digit": 3,
    "meaning": "Số 3 đại diện cho trí tưởng tượng và tư duy, gắn với khả năng sáng tạo và diễn đạt ý tưởng một cách sinh động."
  },
  {
    "digit": 4,
    "meaning": "Số 4 đại diện cho sự thực tế, ngăn nắp và khéo tay, nền tảng của tính kỷ luật và cách làm việc chắc chắn."
  },
  {
    "digit": 5,
    "meaning": "Số 5 đại diện cho cảm xúc và khát khao tự do, nằm ở trung tâm biểu đồ và kết nối mọi hướng năng lượng."
  },
  {
    "digit": 6,
    "meaning": "Số 6 đại diện cho tình cảm gia đình, tinh thần trách nhiệm và óc sáng tạo trong việc chăm lo cho người khác."
  },
  {
    "digit": 7,
    "meaning": "Số 7 đại diện cho bài học trải nghiệm, sự hy sinh và chiều sâu nội tâm được rút ra từ những va vấp thực tế."
  },
  {
    "digit": 8,
    "meaning": "Số 8 đại diện cho tư duy logic, sự độc lập và khả năng quản lý tiền bạc, công việc."
  },
  {
    "digit": 9,
    "meaning": "Số 9 đại diện cho tham vọng, lý tưởng và lòng nhân ái, mong muốn cống hiến cho điều lớn hơn bản thân mình."
  }
];

export const ZODIAC_DEPTH: ZodiacDepth[] = [
  {
    "chi": "Tý",
    "strengths": [
      "Nhanh nhạy, đọc tình huống và bắt tín hiệu của khách rất giỏi",
      "Giao tiếp khéo, biết mở đầu câu chuyện tự nhiên",
      "Xoay xở tốt khi kế hoạch thay đổi bất ngờ",
      "Ham học hỏi, cập nhật xu hướng nhanh"
    ],
    "watchouts": [
      "Dễ ôm nhiều việc cùng lúc rồi dàn trải sức",
      "Đôi khi lo xa quá mức, tự tạo áp lực không cần thiết",
      "Nói nhanh hơn nghe, có lúc bỏ lỡ điều khách thật sự muốn"
    ],
    "businessStyle": "Người tuổi Tý làm việc theo kiểu linh hoạt, thấy cơ hội là nắm ngay và luôn có sẵn phương án dự phòng. Trên bàn thương lượng, họ thường là người đầu tiên nhận ra bên kia đang vướng ở đâu và tìm cách gỡ đúng nút thắt đó.",
    "careerFit": "Hợp với tư vấn bán hàng trực tiếp, chăm sóc khách hàng, marketing và những vai trò cần phản xạ nhanh với con người.",
    "tip": "Mỗi ngày chọn ra hai việc quan trọng nhất và làm trọn vẹn trước khi nhận thêm việc mới. Sự nhanh nhạy sẽ giá trị gấp đôi khi đi cùng sự tập trung."
  },
  {
    "chi": "Sửu",
    "strengths": [
      "Bền bỉ, việc khó đến đâu cũng kiên trì làm đến nơi",
      "Đáng tin cậy, đã hứa với khách là giữ lời",
      "Kỹ lưỡng trong từng chi tiết, ít khi để sót",
      "Chịu được áp lực mùa cao điểm mà không nản"
    ],
    "watchouts": [
      "Thích nghi với thay đổi hơi chậm, cần thời gian làm quen",
      "Ít nói về đóng góp của mình nên đôi khi bị đánh giá thấp hơn thực tế"
    ],
    "businessStyle": "Người tuổi Sửu làm việc chắc từng bước, không hứa những gì chưa chắc làm được. Khách hàng khó tính thường lại rất quý kiểu người này, vì cảm nhận được sự thật thà và cẩn trọng trong từng lời tư vấn.",
    "careerFit": "Hợp với chăm sóc khách hàng lâu dài, quản lý đơn hàng, vận hành, kho vận và các vai trò cần độ chính xác cao.",
    "tip": "Đừng ngại kể lại cho quản lý và đồng đội nghe những việc mình đã làm tốt. Chia sẻ không phải là khoe, mà là giúp mọi người phối hợp với mình đúng cách hơn."
  },
  {
    "chi": "Dần",
    "strengths": [
      "Quyết đoán, dám nhận việc khó và chịu trách nhiệm",
      "Có tố chất dẫn dắt, tạo khí thế cho cả nhóm",
      "Năng lượng dồi dào, làm việc hết mình",
      "Không ngại đặt mục tiêu cao"
    ],
    "watchouts": [
      "Nóng vội, muốn có kết quả ngay nên dễ chốt ép khách",
      "Khi đã tin mình đúng thì ít lắng nghe ý kiến khác",
      "Dễ va chạm với đồng nghiệp cũng cá tính mạnh"
    ],
    "businessStyle": "Người tuổi Dần làm việc theo kiểu dám nghĩ dám làm, đặt mục tiêu rõ và đi thẳng tới đích. Trong đội bán hàng, họ thường là người kéo doanh số những lúc cả nhóm chùng xuống.",
    "careerFit": "Hợp với vai trò trưởng nhóm bán hàng, phát triển thị trường, mở điểm bán mới và những việc cần người tiên phong.",
    "tip": "Trước khi đưa ra lời khuyên cho khách, hãy hỏi thêm một câu và nghe trọn câu trả lời. Sức mạnh của người dẫn dắt nằm ở chỗ biết khi nào nên chậm lại."
  },
  {
    "chi": "Mão",
    "strengths": [
      "Tinh tế, cảm nhận thẩm mỹ tốt, chăm chút hình ảnh thương hiệu có gu",
      "Khéo léo trong giao tiếp, ít khi làm khách phật lòng",
      "Quan sát kỹ, nhận ra những chi tiết nhỏ người khác bỏ qua",
      "Tạo cảm giác dễ chịu, khách muốn quay lại"
    ],
    "watchouts": [
      "Ngại va chạm nên đôi khi né những cuộc trao đổi cần thiết",
      "Do dự khi phải quyết nhanh, dễ bỏ lỡ thời điểm chốt"
    ],
    "businessStyle": "Người tuổi Mão làm việc nhẹ nhàng, giữ hòa khí và chăm chút trải nghiệm của khách từ những điều nhỏ nhất. Họ thuyết phục không bằng lời nói mạnh, mà bằng sự tinh tế khiến khách tự thấy được lựa chọn phù hợp.",
    "careerFit": "Hợp với tư vấn phong cách, chăm sóc khách VIP, hỗ trợ thiết kế và các vai trò cần con mắt thẩm mỹ.",
    "tip": "Gu thẩm mỹ của mình là một tài sản, hãy mạnh dạn nói ra nhận định khi tư vấn. Khách đến nhà may là để nghe ý kiến của người có nghề, không phải để nghe sự dè dặt."
  },
  {
    "chi": "Thìn",
    "strengths": [
      "Có tầm nhìn, nghĩ xa hơn công việc trước mắt",
      "Tự tin, tạo ấn tượng mạnh khi đứng trước khách hàng lớn",
      "Truyền cảm hứng, kéo được người khác theo mục tiêu chung",
      "Không ngại thử thách mới"
    ],
    "watchouts": [
      "Cầu toàn, dễ thất vọng khi thực tế chưa theo kịp kỳ vọng",
      "Mải nghĩ chuyện lớn nên đôi khi lơ là chi tiết nhỏ",
      "Ít kiên nhẫn với công việc lặp lại"
    ],
    "businessStyle": "Người tuổi Thìn làm việc với tinh thần nghĩ lớn, luôn muốn nâng chuẩn của mình và của cả nhóm lên. Họ hợp với những mục tiêu có sức nặng, kiểu như biến một đơn hàng thử nghiệm thành quan hệ đối tác chiến lược nhiều năm.",
    "careerFit": "Hợp với xây dựng thương hiệu, tổ chức sự kiện, đào tạo đội ngũ và các vai trò đại diện hình ảnh doanh nghiệp.",
    "tip": "Tầm nhìn lớn cần được đỡ bằng những việc nhỏ làm đều mỗi ngày. Hãy tập quý trọng cả những bước tiến chậm, vì gây dựng cơ nghiệp vốn là chuyện của sự kiên nhẫn."
  },
  {
    "chi": "Tỵ",
    "strengths": [
      "Sâu sắc, nhìn ra điều khách chưa nói thành lời",
      "Điềm tĩnh, càng áp lực càng giữ được cái đầu lạnh",
      "Tư duy chiến lược, biết tính đường dài",
      "Nói ít nhưng lời nói có trọng lượng"
    ],
    "watchouts": [
      "Giữ suy nghĩ trong lòng, đồng đội khó đoán ý",
      "Cần thời gian mới mở lòng tin với người mới"
    ],
    "businessStyle": "Người tuổi Tỵ làm việc điềm tĩnh và tính toán kỹ, ít khi hành động theo cảm hứng nhất thời. Khi tư vấn, họ thường lặng lẽ quan sát rồi đưa ra đúng một gợi ý trúng tâm lý khách, thay vì nói nhiều phương án.",
    "careerFit": "Hợp với phân tích khách hàng, đàm phán hợp đồng may đồng phục, quản lý tài chính và các việc cần sự chín chắn.",
    "tip": "Hãy chia sẻ suy nghĩ của mình với đồng đội sớm hơn một chút. Sự sâu sắc của mình sẽ giúp được nhiều người hơn khi nó được nói ra."
  },
  {
    "chi": "Ngọ",
    "strengths": [
      "Nhiệt huyết, mang năng lượng tích cực cho cả đội ngũ",
      "Quen biết rộng, kết nối khách mới rất tự nhiên",
      "Làm việc tốc độ, xử lý yêu cầu của khách nhanh gọn",
      "Lạc quan, ít khi để thất bại làm chùn bước"
    ],
    "watchouts": [
      "Thiếu kiên trì với việc lặp đi lặp lại như ghi chép, báo cáo",
      "Dễ phân tán khi có việc mới hấp dẫn hơn xuất hiện",
      "Hào hứng quá đà đôi khi khiến khách trầm tính thấy ngợp"
    ],
    "businessStyle": "Người tuổi Ngọ làm việc theo nhịp nhanh và giàu cảm hứng, ở đâu có họ ở đó có không khí. Họ bán hàng giỏi nhất khi được gặp gỡ, trò chuyện và di chuyển, thay vì ngồi yên một chỗ với giấy tờ.",
    "careerFit": "Hợp với bán hàng trực tiếp, sự kiện, đối ngoại, phát triển khách hàng mới và các vai trò cần sự sôi nổi.",
    "tip": "Sức bật của mình đã có sẵn, thứ cần rèn là sự đều đặn. Một thói quen nhỏ như nhắn hỏi thăm khách cũ mỗi tuần sẽ biến sự nhiệt tình thành doanh số bền vững."
  },
  {
    "chi": "Mùi",
    "strengths": [
      "Chu đáo, để ý đến cảm xúc của khách và đồng nghiệp",
      "Mềm mỏng, hạ nhiệt được những tình huống căng thẳng",
      "Thẩm mỹ tốt, chăm chút sản phẩm và trải nghiệm khách hàng rất tinh tế",
      "Tận tâm với khách như với người thân"
    ],
    "watchouts": [
      "Nhạy cảm với lời chê, dễ buồn lâu vì một góp ý",
      "Ngại đưa ra quyết định dứt khoát khi ý kiến trái chiều"
    ],
    "businessStyle": "Người tuổi Mùi làm việc với sự tận tâm, luôn đặt sự hài lòng của khách lên trước. Họ giỏi ở những khoảnh khắc cần sự ân cần, như lúc khách thử đồ chưa ưng hay lúc cần sửa lại một chi tiết nhỏ cho vừa lòng.",
    "careerFit": "Hợp với chăm sóc khách hàng, hậu mãi, xử lý phản hồi và các vai trò giữ chân khách quay lại.",
    "tip": "Khi nghe góp ý, hãy tách công việc ra khỏi con người, người ta góp ý cho việc chứ không chê mình. Giữ được điều đó, sự nhạy cảm của mình sẽ thành lợi thế lớn nhất trong nghề dịch vụ."
  },
  {
    "chi": "Thân",
    "strengths": [
      "Sáng tạo, luôn có góc nhìn mới cho vấn đề cũ",
      "Ứng biến giỏi, tình huống khó mấy cũng tìm được lối ra",
      "Hoạt ngôn, kể chuyện có duyên khiến khách thoải mái",
      "Học nhanh, việc mới chỉ cần chỉ một lần"
    ],
    "watchouts": [
      "Dễ chán khi công việc vào guồng ổn định",
      "Nhận lời nhanh nhưng đôi khi quên theo tới cùng",
      "Thích đùa nên có lúc bị hiểu là thiếu nghiêm túc"
    ],
    "businessStyle": "Người tuổi Thân làm việc bằng sự linh hoạt và trí tưởng tượng, không có tình huống nào làm khó được họ lâu. Khi khách phân vân giữa hai lựa chọn, họ thường nghĩ ra được phương án thứ ba khiến cả hai bên đều vui.",
    "careerFit": "Hợp với sáng tạo nội dung, quảng cáo, bán hàng trong tình huống khó và các việc cần sự khéo léo ứng biến.",
    "tip": "Hãy tập thói quen chốt lại bằng văn bản mỗi khi hứa với khách điều gì. Ý tưởng hay chỉ có giá trị khi được làm đến nơi đến chốn."
  },
  {
    "chi": "Dậu",
    "strengths": [
      "Tỉ mỉ, soi được từng đường kim mũi chỉ chưa chuẩn",
      "Đúng giờ, đúng hẹn, làm việc có kế hoạch rõ ràng",
      "Chuẩn mực trong tác phong, tự bản thân đã là hình ảnh đẹp của doanh nghiệp",
      "Thẳng thắn, nói đúng thực trạng không né tránh"
    ],
    "watchouts": [
      "Khắt khe với người khác như với chính mình, dễ khiến đồng đội áp lực",
      "Góp ý thẳng quá đôi khi làm người nghe tổn thương"
    ],
    "businessStyle": "Người tuổi Dậu làm việc kỷ luật, mọi thứ phải đâu ra đấy từ số đo của khách đến lịch hẹn thử đồ. Ở một nhà may, đây chính là người bảo vệ chữ tín, vì khách tin vào sự chính xác trước khi tin vào lời hay.",
    "careerFit": "Hợp với kiểm soát chất lượng, quản lý đơn hàng, quản trị vận hành và các vai trò cần chuẩn mực cao.",
    "tip": "Trước khi góp ý, hãy bắt đầu bằng một điều người kia đã làm tốt. Lời thẳng thắn được bọc trong sự tử tế sẽ đi xa hơn rất nhiều."
  },
  {
    "chi": "Tuất",
    "strengths": [
      "Trung thực, khách và đồng nghiệp đều yên tâm khi giao việc",
      "Trách nhiệm, đã nhận là làm tròn không cần ai nhắc",
      "Bênh vực và bảo vệ đồng đội, giữ tinh thần nhóm",
      "Bền lòng với khách hàng cũ, chăm sóc chu đáo qua nhiều năm"
    ],
    "watchouts": [
      "Hay lo lắng trước khi việc xảy ra, tự làm mình mệt",
      "Khi đã tin một cách làm thì hơi ngại thay đổi sang cách mới"
    ],
    "businessStyle": "Người tuổi Tuất làm việc bằng chữ tín, thà nhận ít việc mà làm trọn còn hơn hứa nhiều rồi bỏ dở. Khách quay lại với họ không phải vì lời mời chào, mà vì cảm giác được một người đáng tin trông nom từ đầu đến cuối.",
    "careerFit": "Hợp với chăm sóc khách hàng thân thiết, quản lý đội nhóm, hành chính vận hành và các vai trò cần sự tin cậy.",
    "tip": "Không phải nỗi lo nào cũng thành sự thật, hãy dành sức cho những việc mình kiểm soát được. Thỉnh thoảng cho phép mình thử một cách làm mới, biết đâu lại hay hơn cách cũ."
  },
  {
    "chi": "Hợi",
    "strengths": [
      "Chân thành, khách cảm nhận được sự thật lòng ngay lần gặp đầu",
      "Hào phóng, sẵn sàng hỗ trợ đồng nghiệp không tính toán",
      "Dễ mến, tạo không khí ấm áp cho nơi làm việc",
      "Bình tĩnh, ít khi để cảm xúc tiêu cực kéo dài"
    ],
    "watchouts": [
      "Cả tin, dễ nhận phần thiệt về mình khi thương lượng",
      "Nể nang nên khó từ chối, đôi khi ôm việc quá sức",
      "Thoải mái quá mức với chi tiết, cần người soát lại"
    ],
    "businessStyle": "Người tuổi Hợi làm việc bằng sự chân thành, xây quan hệ trước rồi việc bán hàng tự nhiên theo sau. Với họ, một khách hàng là một mối duyên lâu dài, nên họ chăm sóc tận tình mà không cần ai giao chỉ tiêu.",
    "careerFit": "Hợp với bán hàng dựa trên quan hệ, tiếp đón khách, xây dựng cộng đồng khách hàng và các vai trò cần sự ấm áp.",
    "tip": "Tấm lòng rộng rãi là điều quý, nhưng hãy học cách nói không đúng lúc để giữ sức cho những người và những việc xứng đáng. Từ chối khéo cũng là một kỹ năng của người bán hàng giỏi."
  }
];

export function readingOf(
  list: NumberReading[],
  n: number
): NumberReading | null {
  return list.find((r) => r.number === n) ?? null;
}
