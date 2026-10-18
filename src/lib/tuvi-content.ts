/**
 * Bảng an sao + luận giải Tử Vi Đẩu Số (mức nhập môn, tham khảo).
 * Bảng tra soạn qua quy trình đa tác tử có tra cứu web, sau đó đối chiếu
 * bằng máy với các mốc chuẩn cổ truyền (Thủy nhị ngày 1 tại Sửu, Tứ Hóa
 * can Giáp Liêm-Phá-Vũ-Dương...). Muốn chỉnh câu chữ: sửa file này.
 */

export type TuViReading = { key: string; title: string; reading: string };
export type TuHoaRow = { can: string; loc: string; quyen: string; khoa: string; ky: string };
export type KhoiVietRow = { can: string; khoi: string; viet: string };

/** Vị trí sao Tử Vi theo Cục (2..6) và ngày âm lịch 1..30. */
export const TUVI_TABLE: Record<string, string[]> = {
  "2": [
    "Sửu",
    "Dần",
    "Dần",
    "Mão",
    "Mão",
    "Thìn",
    "Thìn",
    "Tỵ",
    "Tỵ",
    "Ngọ",
    "Ngọ",
    "Mùi",
    "Mùi",
    "Thân",
    "Thân",
    "Dậu",
    "Dậu",
    "Tuất",
    "Tuất",
    "Hợi",
    "Hợi",
    "Tý",
    "Tý",
    "Sửu",
    "Sửu",
    "Dần",
    "Dần",
    "Mão",
    "Mão",
    "Thìn"
  ],
  "3": [
    "Thìn",
    "Sửu",
    "Dần",
    "Tỵ",
    "Dần",
    "Mão",
    "Ngọ",
    "Mão",
    "Thìn",
    "Mùi",
    "Thìn",
    "Tỵ",
    "Thân",
    "Tỵ",
    "Ngọ",
    "Dậu",
    "Ngọ",
    "Mùi",
    "Tuất",
    "Mùi",
    "Thân",
    "Hợi",
    "Thân",
    "Dậu",
    "Tý",
    "Dậu",
    "Tuất",
    "Sửu",
    "Tuất",
    "Hợi"
  ],
  "4": [
    "Hợi",
    "Thìn",
    "Sửu",
    "Dần",
    "Tý",
    "Tỵ",
    "Dần",
    "Mão",
    "Sửu",
    "Ngọ",
    "Mão",
    "Thìn",
    "Dần",
    "Mùi",
    "Thìn",
    "Tỵ",
    "Mão",
    "Thân",
    "Tỵ",
    "Ngọ",
    "Thìn",
    "Dậu",
    "Ngọ",
    "Mùi",
    "Tỵ",
    "Tuất",
    "Mùi",
    "Thân",
    "Ngọ",
    "Hợi"
  ],
  "5": [
    "Ngọ",
    "Hợi",
    "Thìn",
    "Sửu",
    "Dần",
    "Mùi",
    "Tý",
    "Tỵ",
    "Dần",
    "Mão",
    "Thân",
    "Sửu",
    "Ngọ",
    "Mão",
    "Thìn",
    "Dậu",
    "Dần",
    "Mùi",
    "Thìn",
    "Tỵ",
    "Tuất",
    "Mão",
    "Thân",
    "Tỵ",
    "Ngọ",
    "Hợi",
    "Thìn",
    "Dậu",
    "Ngọ",
    "Mùi"
  ],
  "6": [
    "Dậu",
    "Ngọ",
    "Hợi",
    "Thìn",
    "Sửu",
    "Dần",
    "Tuất",
    "Mùi",
    "Tý",
    "Tỵ",
    "Dần",
    "Mão",
    "Hợi",
    "Thân",
    "Sửu",
    "Ngọ",
    "Mão",
    "Thìn",
    "Tý",
    "Dậu",
    "Dần",
    "Mùi",
    "Thìn",
    "Tỵ",
    "Sửu",
    "Tuất",
    "Mão",
    "Thân",
    "Tỵ",
    "Ngọ"
  ]
};

export const TU_HOA: TuHoaRow[] = [
  {
    "can": "Giáp",
    "loc": "Liêm Trinh",
    "quyen": "Phá Quân",
    "khoa": "Vũ Khúc",
    "ky": "Thái Dương"
  },
  {
    "can": "Ất",
    "loc": "Thiên Cơ",
    "quyen": "Thiên Lương",
    "khoa": "Tử Vi",
    "ky": "Thái Âm"
  },
  {
    "can": "Bính",
    "loc": "Thiên Đồng",
    "quyen": "Thiên Cơ",
    "khoa": "Văn Xương",
    "ky": "Liêm Trinh"
  },
  {
    "can": "Đinh",
    "loc": "Thái Âm",
    "quyen": "Thiên Đồng",
    "khoa": "Thiên Cơ",
    "ky": "Cự Môn"
  },
  {
    "can": "Mậu",
    "loc": "Tham Lang",
    "quyen": "Thái Âm",
    "khoa": "Hữu Bật",
    "ky": "Thiên Cơ"
  },
  {
    "can": "Kỷ",
    "loc": "Vũ Khúc",
    "quyen": "Tham Lang",
    "khoa": "Thiên Lương",
    "ky": "Văn Khúc"
  },
  {
    "can": "Canh",
    "loc": "Thái Dương",
    "quyen": "Vũ Khúc",
    "khoa": "Thái Âm",
    "ky": "Thiên Đồng"
  },
  {
    "can": "Tân",
    "loc": "Cự Môn",
    "quyen": "Thái Dương",
    "khoa": "Văn Khúc",
    "ky": "Văn Xương"
  },
  {
    "can": "Nhâm",
    "loc": "Thiên Lương",
    "quyen": "Tử Vi",
    "khoa": "Tả Phù",
    "ky": "Vũ Khúc"
  },
  {
    "can": "Quý",
    "loc": "Phá Quân",
    "quyen": "Cự Môn",
    "khoa": "Thái Âm",
    "ky": "Tham Lang"
  }
];

export const KHOI_VIET: KhoiVietRow[] = [
  {
    "can": "Giáp",
    "khoi": "Sửu",
    "viet": "Mùi"
  },
  {
    "can": "Ất",
    "khoi": "Tý",
    "viet": "Thân"
  },
  {
    "can": "Bính",
    "khoi": "Hợi",
    "viet": "Dậu"
  },
  {
    "can": "Đinh",
    "khoi": "Hợi",
    "viet": "Dậu"
  },
  {
    "can": "Mậu",
    "khoi": "Sửu",
    "viet": "Mùi"
  },
  {
    "can": "Kỷ",
    "khoi": "Tý",
    "viet": "Thân"
  },
  {
    "can": "Canh",
    "khoi": "Sửu",
    "viet": "Mùi"
  },
  {
    "can": "Tân",
    "khoi": "Ngọ",
    "viet": "Dần"
  },
  {
    "can": "Nhâm",
    "khoi": "Mão",
    "viet": "Tỵ"
  },
  {
    "can": "Quý",
    "khoi": "Mão",
    "viet": "Tỵ"
  }
];

export const DAO_HOA: Record<string, string> = {
  "Tý": "Dậu",
  "Sửu": "Ngọ",
  "Dần": "Mão",
  "Mão": "Tý",
  "Thìn": "Dậu",
  "Tỵ": "Ngọ",
  "Ngọ": "Mão",
  "Mùi": "Tý",
  "Thân": "Dậu",
  "Dậu": "Ngọ",
  "Tuất": "Mão",
  "Hợi": "Tý"
};

export const HONG_LOAN: Record<string, string> = {
  "Tý": "Mão",
  "Sửu": "Dần",
  "Dần": "Sửu",
  "Mão": "Tý",
  "Thìn": "Hợi",
  "Tỵ": "Tuất",
  "Ngọ": "Dậu",
  "Mùi": "Thân",
  "Thân": "Mùi",
  "Dậu": "Ngọ",
  "Tuất": "Tỵ",
  "Hợi": "Thìn"
};

/** Thứ tự 12 cung đi thuận từ Mệnh. */
export const CUNG_ORDER: string[] = [
  "Mệnh",
  "Phụ Mẫu",
  "Phúc Đức",
  "Điền Trạch",
  "Quan Lộc",
  "Nô Bộc",
  "Thiên Di",
  "Tật Ách",
  "Tài Bạch",
  "Tử Tức",
  "Phu Thê",
  "Huynh Đệ"
];

export const CUNG_READINGS: TuViReading[] = [
  {
    "key": "Mệnh",
    "title": "Gốc con người",
    "reading": "Cung Mệnh là gốc của lá số, nói về con người thật của bạn: tính cách, khí chất, cách bạn đứng trước cuộc đời. Xem Mệnh giống như đọc kỹ nội lực doanh nghiệp trước khi bàn chiến lược — hiểu đúng cái gốc rồi mới tính chuyện đi xa. Mệnh sáng hay tối không quyết định tất cả; cách bạn dùng nó mới là điều quan trọng."
  },
  {
    "key": "Phụ Mẫu",
    "title": "Cha mẹ, bề trên",
    "reading": "Cung Phụ Mẫu nói về cha mẹ và những người bề trên che chở bạn: duyên nợ, sự hậu thuẫn, cả cách bạn cư xử với người lớn tuổi. Cung này sáng thì thường được nâng đỡ từ sớm. Trong nghề tư vấn, người vượng Phụ Mẫu hay tạo thiện cảm tự nhiên với khách lớn tuổi — một lợi thế rất đáng dùng cho khéo."
  },
  {
    "key": "Phúc Đức",
    "title": "Phúc phần, tinh thần",
    "reading": "Cung Phúc Đức nói về phúc phần ông bà để lại và đời sống tinh thần của chính bạn: có dễ thấy an lòng không, hưởng lộc có bền không. Người xưa tin phúc dày thì gặp dữ hóa lành. Với người làm nghề phục vụ khách như chúng ta, giữ tâm ngay thẳng, tận tình với từng khách chính là cách tự bồi phúc mỗi ngày."
  },
  {
    "key": "Điền Trạch",
    "title": "Nhà cửa, tài sản",
    "reading": "Cung Điền Trạch nói về nhà cửa, đất đai và tài sản tích lũy: có duyên mua nhà sớm hay muộn, giữ của có chắc không. Cung này còn phản ánh sự ổn định của tổ ấm. Điền Trạch vượng hay không, nguyên tắc vẫn vậy: thu nhập từ nghề tư vấn đều đặn, chi tiêu có kỷ luật, thì viên gạch nào rồi cũng tự đến."
  },
  {
    "key": "Quan Lộc",
    "title": "Sự nghiệp, công danh",
    "reading": "Cung Quan Lộc nói về sự nghiệp và con đường công danh: hợp làm chủ hay làm chuyên môn, thăng tiến nhanh hay chậm, danh tiếng trong nghề ra sao. Đây là cung người đi làm nên xem kỹ nhất. Quan Lộc đẹp là thuận lợi, nhưng tay nghề tư vấn vững và uy tín với khách mới là thứ giữ được công danh lâu dài."
  },
  {
    "key": "Nô Bộc",
    "title": "Bạn bè, cộng sự",
    "reading": "Cung Nô Bộc nói về bạn bè, đồng nghiệp và người cộng sự quanh bạn: có quý nhân trong đám đông không, người dưới có trung thành không. Với người làm kinh doanh, cung này gợi chuyện mạng lưới quan hệ — bạn hàng rộng và bền chính là Nô Bộc vượng theo nghĩa hiện đại. Cư xử tử tế với cộng sự là cách nuôi cung này."
  },
  {
    "key": "Thiên Di",
    "title": "Đường ra ngoài",
    "reading": "Cung Thiên Di nói về đường ra ngoài: đi xa có lợi không, giao tế có duyên không, người ngoài nhìn bạn thế nào. Thiên Di sáng thì càng ra khỏi vùng quen càng gặp cơ hội. Nghề tư vấn vốn là nghề của Thiên Di — mỗi vị khách bước vào showroom là một phương xa thu nhỏ, cách bạn đón tiếp quyết định duyên ấy."
  },
  {
    "key": "Tật Ách",
    "title": "Sức khỏe",
    "reading": "Cung Tật Ách nói về sức khỏe và những trắc trở thân thể: tạng người khỏe hay yếu, cần giữ gìn chỗ nào. Xem cung này không phải để lo, mà để biết đường phòng. Nghề đứng tư vấn cả ngày cần chân khỏe, giọng bền, tinh thần tươi — ngủ đủ giấc, ăn đúng bữa là cách hóa giải Tật Ách thực tế nhất."
  },
  {
    "key": "Tài Bạch",
    "title": "Tiền bạc",
    "reading": "Cung Tài Bạch nói về tiền bạc: kiếm tiền bằng cách nào hợp nhất, tiền đến ào ạt hay đều đặn, giữ tiền có chắc tay không. Tài Bạch đẹp không có nghĩa ngồi chờ lộc; nó gợi ý cách kiếm hợp với mình. Với người làm chủ, mỗi hợp đồng chốt bằng sự tử tế là một dòng chảy nhỏ nuôi cung Tài Bạch thêm vững."
  },
  {
    "key": "Tử Tức",
    "title": "Con cái, hậu duệ",
    "reading": "Cung Tử Tức nói về con cái và duyên với thế hệ sau: con đông hay muộn, hợp cha mẹ không, về già có chỗ tựa không. Nghĩa rộng hơn, cung này còn chỉ những gì bạn sinh ra — học trò, sản phẩm, di sản nghề. Một lớp đàn em tư vấn giỏi do chính bạn kèm cặp cũng là Tử Tức theo cách riêng."
  },
  {
    "key": "Phu Thê",
    "title": "Hôn nhân",
    "reading": "Cung Phu Thê nói về hôn nhân và người bạn đời: duyên đến sớm hay muộn, người ấy tính cách ra sao, hai bên bù trừ nhau thế nào. Cung này chỉ là bản phác; kết quả ra sao là ở cách hai người điều chỉnh cho nhau mỗi ngày, giống một cuộc hợp tác lâu dài phải qua nhiều lần va chạm mới ăn ý."
  },
  {
    "key": "Huynh Đệ",
    "title": "Anh chị em",
    "reading": "Cung Huynh Đệ nói về anh chị em ruột và những người thân cận như tay chân: có nương tựa được nhau không, làm ăn chung có hợp không. Nghĩa mở rộng là tình đồng đội — với doanh nhân là anh em cùng hội, cùng ngành. Huynh Đệ vượng hay không, một tập thể biết nhường cơ hội và đỡ lời nhau vẫn luôn đi xa hơn."
  }
];

export const CUC_READINGS: TuViReading[] = [
  {
    "key": "Thủy nhị cục",
    "title": "Nước — linh hoạt, khởi sớm",
    "reading": "Thủy nhị cục khởi vận sớm nhất — từ 2 tuổi đã vào đại vận đầu. Người cục này linh hoạt như nước: thích nghi nhanh, giao tiếp mềm, đi đường vòng mà vẫn tới đích. Điểm cần giữ là sự bền chí, tránh chảy theo quá nhiều hướng. Làm tư vấn, chất nước giúp bạn đọc ý khách nhanh và uốn theo tình huống khéo léo."
  },
  {
    "key": "Mộc tam cục",
    "title": "Cây — bền bỉ vươn lên",
    "reading": "Mộc tam cục khởi vận từ 3 tuổi, nhịp đời như cây lớn: chậm mà chắc, mỗi năm thêm một vòng gỗ. Người cục Mộc giàu sức vươn, càng có môi trường tốt càng phát triển, nhưng cần thời gian bén rễ. Trong nghề, đừng sốt ruột so với người khác — tay nghề tư vấn của bạn thuộc loại càng lâu năm càng có giá."
  },
  {
    "key": "Kim tứ cục",
    "title": "Kim — sắc bén, kỷ luật",
    "reading": "Kim tứ cục khởi vận từ 4 tuổi, mang tính chất của kim loại: sắc bén, nguyên tắc, đã quyết là làm. Người cục Kim thường thành hình qua rèn giũa — áp lực với họ là lò luyện, không phải tai họa. Chất này rất hợp những ngành đòi hỏi chuẩn mực: quy trình phải chuẩn, cam kết với đối tác phải giữ. Chỉ cần nhớ mềm giọng hơn khi cần."
  },
  {
    "key": "Thổ ngũ cục",
    "title": "Đất — trầm ổn, đáng tin",
    "reading": "Thổ ngũ cục khởi vận từ 5 tuổi, tính chất như đất: trầm ổn, đáng tin, nói ít làm nhiều. Người cục Thổ vận đi chậm nhưng nền chắc, ít gặp cảnh lên voi xuống chó. Khách hàng đặc biệt yên tâm với kiểu người này — sự chắc chắn của bạn chính là lời tư vấn thuyết phục nhất. Chỉ đừng để sự ổn định thành ngại thay đổi."
  },
  {
    "key": "Hỏa lục cục",
    "title": "Lửa — nhiệt thành, bùng nổ",
    "reading": "Hỏa lục cục khởi vận muộn nhất — 6 tuổi — nhưng bùng lên thì mạnh nhất. Người cục Hỏa nhiệt thành, quyết đoán, truyền cảm hứng cho người xung quanh; vận trình thường có những giai đoạn thăng hoa rõ rệt. Cái cần luyện là độ bền của lửa: giữ nhiệt đều thay vì cháy bùng rồi nguội. Nhiệt tình đúng liều là vũ khí bán hàng lợi hại."
  }
];

export const THAN_CU_READINGS: TuViReading[] = [
  {
    "key": "Mệnh",
    "title": "Tự lực cả đời",
    "reading": "Thân cư Mệnh: cung Thân trùng với cung Mệnh, nghĩa là nửa sau cuộc đời vẫn xoay quanh chính con người bạn — tính cách nào theo mình từ trẻ sẽ theo tới già, tự lực là chủ đạo. Người này ít dựa ai, thành bại tự tay mình. Điều đáng mừng: mọi công sức rèn nghề hôm nay đều tích thẳng vào vốn liếng cả đời."
  },
  {
    "key": "Phúc Đức",
    "title": "Nghiêng về tinh thần",
    "reading": "Thân cư Phúc Đức: nửa sau cuộc đời nghiêng về đời sống tinh thần và phúc phần — càng lớn tuổi càng coi trọng sự an nhiên, họ hàng, việc thiện. Người này về hậu vận thường sống bằng cái tâm hơn cái danh. Gợi ý nhỏ: những điều tử tế bạn làm cho khách và đồng nghiệp hôm nay chính là của để dành cho chặng ấy."
  },
  {
    "key": "Quan Lộc",
    "title": "Nghiêng về sự nghiệp",
    "reading": "Thân cư Quan Lộc: nửa sau cuộc đời gắn chặt với sự nghiệp — càng trưởng thành, công việc càng là trung tâm, danh phận đến từ nghề. Người này thường phát muộn mà phát bền, hậu vận có vị trí. Với người làm chủ, đây là tín hiệu nên đi đường dài: tích uy tín, xây tệp khách riêng, cơ nghiệp sẽ trả công xứng đáng về sau."
  },
  {
    "key": "Thiên Di",
    "title": "Nghiêng về bên ngoài",
    "reading": "Thân cư Thiên Di: nửa sau cuộc đời nghiêng về bên ngoài — đi lại, giao thiệp, cơ hội đến từ người mới và nơi xa hơn là từ chỗ quen. Người này càng ra ngoài càng phát, ngồi yên một chỗ dễ thấy tù túng. Hợp với việc mở rộng quan hệ, chăm khách tỉnh xa, chạy sự kiện — đừng ngại những cuộc gặp ngoài showroom."
  },
  {
    "key": "Tài Bạch",
    "title": "Nghiêng về tiền bạc",
    "reading": "Thân cư Tài Bạch: nửa sau cuộc đời xoay quanh chuyện tiền bạc — kiếm, giữ, và làm cho tiền sinh sôi. Người này hậu vận thường vững túi, nhưng cũng dễ bận lòng vì tài chính. Lời nhắc kinh điển: hãy coi tiền là thước đo giá trị mình tạo ra. Mỗi khách hài lòng quay lại chính là khoản lãi kép đẹp nhất của cung này."
  },
  {
    "key": "Phu Thê",
    "title": "Nghiêng về hôn nhân",
    "reading": "Thân cư Phu Thê: nửa sau cuộc đời nghiêng về hôn nhân và người bạn đời — hạnh phúc hậu vận buồn vui theo mái ấm, và người phối ngẫu ảnh hưởng lớn đến vận mình. Chọn bạn đời với người này quan trọng chẳng kém chọn nghề. Tin vui: ai biết vun vén gia đình thường cũng tinh tế trong nghề — khách cảm được sự chu đáo ấy."
  }
];

export const CHINH_TINH_READINGS: TuViReading[] = [
  {
    "key": "Tử Vi",
    "title": "Đế tinh — khí chất thủ lĩnh",
    "reading": "Người có Tử Vi thủ Mệnh thường mang phong thái đĩnh đạc, tự trọng cao, đứng đâu cũng toát ra sự đàng hoàng. Khách hàng dễ tin tưởng và nghe theo lời tư vấn của bạn, nên rất hợp tiếp những vị khách quan trọng, đơn hàng lớn. Chỉ cần nhớ lắng nghe nhiều hơn một chút — người khí chất lớn đôi khi quen quyết thay người khác."
  },
  {
    "key": "Thiên Cơ",
    "title": "Trí tinh — nhanh nhạy, nhiều ý tưởng",
    "reading": "Thiên Cơ thủ Mệnh cho đầu óc linh hoạt, quan sát tinh, đọc ý khách rất nhanh. Bạn thuộc kiểu người vừa nghe vài câu đã đoán được khách cần gì, hợp tư vấn những ca khó, khách còn phân vân. Điểm cần lưu ý: hay nghĩ nhiều, đôi khi tự làm mình rối. Cứ tin vào phán đoán đầu tiên của mình — thường là đúng."
  },
  {
    "key": "Thái Dương",
    "title": "Mặt trời — nhiệt thành, tỏa sáng",
    "reading": "Thái Dương thủ Mệnh là người nhiệt tình, hào phóng, thích giúp đỡ, đi đến đâu mang năng lượng đến đó. Khách hàng cảm nhận được sự chân thành nên dễ mở lòng. Bạn hợp vai trò tạo không khí, dẫn dắt buổi tư vấn từ đầu đến cuối. Chỉ cần giữ sức — người cho đi nhiều cũng cần biết nghỉ ngơi để ngọn lửa cháy bền."
  },
  {
    "key": "Vũ Khúc",
    "title": "Tài tinh — quyết đoán, giỏi con số",
    "reading": "Vũ Khúc thủ Mệnh thường thực tế, dứt khoát, có duyên với tiền bạc. Bạn chốt việc nhanh, quản số liệu gọn gàng, nói chuyện giá cả rõ ràng khiến khách yên tâm. Đây là mẫu người nói được làm được trong đội. Điều nên bổ sung: thêm chút mềm mỏng khi khách còn do dự — dứt khoát quá sớm đôi khi làm khách chùn bước."
  },
  {
    "key": "Thiên Đồng",
    "title": "Phúc tinh — ôn hòa, dễ mến",
    "reading": "Thiên Đồng thủ Mệnh cho tính tình hiền hòa, vui vẻ, ít khi làm mất lòng ai. Khách ngồi với bạn thấy thoải mái như trò chuyện với người quen, nên rất hợp chăm sóc khách lâu dài, khách quay lại. Điểm cần rèn: đôi khi ngại thúc đẩy nên dễ bỏ lỡ thời điểm chốt. Hiền là quý, nhưng đúng lúc vẫn nên mạnh dạn mời khách quyết định."
  },
  {
    "key": "Liêm Trinh",
    "title": "Cương trực — trọng nguyên tắc",
    "reading": "Liêm Trinh thủ Mệnh là người thẳng thắn, nguyên tắc, đã hứa là làm, không ưa sự lươn lẹo. Khách quý bạn vì chữ tín — hẹn thử đồ đúng ngày, sai đâu nhận đó. Trong đội, bạn là người giữ chuẩn mực chung. Điều nên nhớ: tính hơi nóng, gặp khách khó cứ hít một nhịp rồi hãy trả lời, mọi việc sẽ êm hơn nhiều."
  },
  {
    "key": "Thiên Phủ",
    "title": "Kho trời — vững vàng, bao dung",
    "reading": "Thiên Phủ thủ Mệnh mang sự điềm đạm, ổn định, biết giữ gìn và vun vén. Bạn không phải người ồn ào nhất, nhưng là người khách nhớ đến khi cần sự tin cậy. Rất hợp giữ mối khách thân thiết, chăm sóc sau bán hàng. Lời nhắn nhỏ: thỉnh thoảng chủ động bước ra khỏi vùng quen thuộc — cơ hội mới thường nằm ở đó."
  },
  {
    "key": "Thái Âm",
    "title": "Mặt trăng — tinh tế, chu đáo",
    "reading": "Thái Âm thủ Mệnh cho sự dịu dàng, tinh tế và con mắt thẩm mỹ tốt. Bạn để ý những chi tiết nhỏ — dáng vai khách, tông da, sở thích màu sắc — nên lời tư vấn thường chạm đúng ý. Rất hợp tư vấn phom dáng, chất vải cho khách kỹ tính. Chỉ cần tự tin nói ra nhận định của mình nhiều hơn, vì bạn thường đúng."
  },
  {
    "key": "Tham Lang",
    "title": "Đa tài — giao tiếp có duyên",
    "reading": "Tham Lang thủ Mệnh là người quảng giao, nói chuyện có duyên, ham học hỏi và làm được nhiều việc. Khách gặp bạn một lần thường nhớ, vì trò chuyện với bạn rất cuốn — đây là lợi thế lớn khi xây quan hệ khách hàng. Điều cần rèn: nhiều mối quan tâm nên dễ phân tán. Chọn việc quan trọng làm trước, thành quả sẽ rõ hơn hẳn."
  },
  {
    "key": "Cự Môn",
    "title": "Khẩu tài — lý lẽ sắc bén",
    "reading": "Cự Môn thủ Mệnh cho tài ăn nói và tư duy phân tích tốt. Bạn thuyết phục khách bằng lý lẽ rõ ràng: giải thích được vì sao vải này bền, đường may này đáng giá. Khách thiên về lý trí đặc biệt hợp với bạn. Điểm cần nhớ: đừng để buổi tư vấn thành cuộc tranh luận — thắng khách một câu nói có khi mất một đơn hàng."
  },
  {
    "key": "Thiên Tướng",
    "title": "Ấn tinh — chững chạc, công tâm",
    "reading": "Thiên Tướng thủ Mệnh mang phong thái chững chạc, công bằng, sẵn lòng giúp người. Trong đội, bạn thường là người hòa giải, ai cũng quý. Khách hàng nhìn cách bạn làm việc chỉn chu mà yên tâm gửi gắm, nên rất hợp làm cầu nối giữa khách và nhà may. Chỉ cần tránh ôm đồm việc của người khác quá nhiều mà quên phần việc của mình."
  },
  {
    "key": "Thiên Lương",
    "title": "Thọ tinh — chính trực, che chở",
    "reading": "Thiên Lương thủ Mệnh là người chính trực, thích chỉ dẫn và bảo vệ người khác. Bạn tư vấn kiểu nói thật: hợp thì khen, chưa hợp thì góp ý thẳng — và chính điều đó khiến khách tin tuyệt đối, còn giới thiệu thêm bạn bè. Đây là mẫu người bán hàng bằng uy tín. Lưu ý nhỏ: góp ý thẳng nhưng chọn lời nhẹ, khách sẽ dễ nghe hơn."
  },
  {
    "key": "Thất Sát",
    "title": "Tướng tinh — quyết liệt, dám làm",
    "reading": "Thất Sát thủ Mệnh cho ý chí mạnh, dám nghĩ dám làm, gặp mục tiêu khó lại càng hăng. Chỉ tiêu doanh số với người khác là áp lực, với bạn giống một cuộc chơi. Bạn hợp những đợt cao điểm, chương trình mới cần người xông pha. Điều nên rèn: kiên nhẫn với khách chậm quyết — không phải ai cũng đi nhanh như bạn, chậm một nhịp đơn vẫn về."
  },
  {
    "key": "Phá Quân",
    "title": "Tiên phong — đổi mới, phá cách",
    "reading": "Phá Quân thủ Mệnh là người tiên phong, không thích lối mòn, luôn muốn thử cách làm mới. Bạn thường là người đầu tiên nghĩ ra cách tiếp cận khách khác biệt, ý tưởng trưng bày mới lạ — đội nào có bạn sẽ không bị cũ. Điều cần giữ: sự bền bỉ. Ý tưởng hay cần đi đến cùng mới thành kết quả, đừng đổi hướng giữa chừng."
  }
];

export const CANH_GIO_READINGS: TuViReading[] = [
  {
    "key": "Tý",
    "title": "Giờ Tý (23h–1h) — nhanh trí, tháo vát",
    "reading": "Dân gian nói người sinh giờ Tý lanh lợi như chuột đêm: nhanh trí, tháo vát, xoay xở giỏi trong tình huống bất ngờ. Khách đổi ý phút chót hay có việc phát sinh gấp, bạn thường là người tìm ra cách. Nét duyên của bạn là sự linh hoạt — nghề tư vấn rất cần điều này. Nhớ ngủ đủ giấc, vì người giờ Tý hay thức khuya."
  },
  {
    "key": "Sửu",
    "title": "Giờ Sửu (1h–3h) — bền bỉ, chậm mà chắc",
    "reading": "Người sinh giờ Sửu được ví như trâu cần mẫn: chăm chỉ, nhẫn nại, không ngại việc khó. Bạn có thể không phải người chốt đơn nhanh nhất, nhưng là người khách tin nhất vì làm gì cũng tới nơi tới chốn. Đơn hàng khó, khách kỹ tính giao cho bạn là yên tâm. Cứ giữ nhịp của mình — chậm mà chắc vẫn về đích đẹp."
  },
  {
    "key": "Dần",
    "title": "Giờ Dần (3h–5h) — mạnh mẽ, có khí chất",
    "reading": "Sinh giờ Dần, dân gian bảo mang chút uy của hổ: tự tin, quyết đoán, có khí chất khiến người khác nể. Bạn không ngại đứng ra nhận việc khó, nói chuyện với khách lớn cũng không run — đây là tố chất của người dẫn dắt. Điều nên nhớ: uy đi kèm sự ấm áp thì người ta vừa nể vừa quý, đủ cả hai mới bền."
  },
  {
    "key": "Mão",
    "title": "Giờ Mão (5h–7h) — khéo léo, được lòng người",
    "reading": "Người sinh giờ Mão thường hiền hòa, khéo léo như thỏ buổi sớm: nói năng nhẹ nhàng, biết ý người khác, đi đâu cũng dễ được quý mến. Khách khó tính đến mấy, ngồi với bạn một lúc cũng dịu lại. Nghề tư vấn cần đúng sự mềm mỏng này. Chỉ cần thêm chút quyết đoán khi đến lúc chốt, bạn sẽ rất toàn diện."
  },
  {
    "key": "Thìn",
    "title": "Giờ Thìn (7h–9h) — chí lớn, tự trọng",
    "reading": "Sinh giờ Thìn là mang bóng dáng của rồng: có chí lớn, tự trọng cao, không thích làm việc nửa vời. Bạn đặt tiêu chuẩn cao cho bản thân, nên việc qua tay bạn thường chỉn chu, khách cảm nhận được sự nghiêm túc đó. Lời nhắn nhỏ: thỉnh thoảng cho phép mình và đồng đội sai một chút — cầu toàn quá dễ mệt, thong thả lại đi xa."
  },
  {
    "key": "Tỵ",
    "title": "Giờ Tỵ (9h–11h) — sâu sắc, trực giác tốt",
    "reading": "Người sinh giờ Tỵ được cho là kín đáo, sâu sắc, trực giác nhạy. Bạn ít nói nhưng quan sát nhiều, thường bắt sóng được điều khách chưa nói ra — họ ngại giá, hay còn phân vân với người nhà. Đó là lợi thế lớn trong tư vấn. Cứ mạnh dạn hỏi đúng điều mình cảm nhận, khách sẽ ngạc nhiên vì bạn hiểu họ đến vậy."
  },
  {
    "key": "Ngọ",
    "title": "Giờ Ngọ (11h–13h) — nhiệt huyết, cởi mở",
    "reading": "Sinh giờ Ngọ — giờ mặt trời đứng bóng — dân gian bảo tính tình cởi mở, nhiệt huyết, thẳng thắn như ngựa phi ban trưa. Bạn mang năng lượng tích cực vào nơi làm việc, người xung quanh cảm nhận được ngay không khí hào hứng. Rất hợp những giai đoạn cao điểm cần sức bền và sự sôi nổi. Nhớ giữ nhịp — chạy nhanh nhưng đừng quên nghỉ."
  },
  {
    "key": "Mùi",
    "title": "Giờ Mùi (13h–15h) — ôn hòa, tinh tế",
    "reading": "Người sinh giờ Mùi thường ôn hòa, nhã nhặn, có mắt thẩm mỹ — dân gian ví như dê thong thả buổi chiều. Bạn nhạy với cái đẹp, để ý từng chi tiết nhỏ, nên tư vấn màu vải, phom dáng rất có duyên. Khách tinh tế đặc biệt hợp với bạn. Điều nên rèn: tin vào nhận định của mình và nói ra rõ ràng, dứt khoát hơn."
  },
  {
    "key": "Thân",
    "title": "Giờ Thân (15h–17h) — lanh lợi, ứng biến giỏi",
    "reading": "Sinh giờ Thân, dân gian bảo lanh lợi, hài hước, ứng biến nhanh như khỉ. Câu chuyện của bạn luôn có tiếng cười, tình huống nào cũng gỡ được. Khách đang căng chuyện giá hay hẹn sửa đồ, bạn pha một câu là không khí nhẹ hẳn — đó là tài sản quý. Chỉ cần đến việc quan trọng thì nghiêm túc trọn vẹn, ai cũng phục."
  },
  {
    "key": "Dậu",
    "title": "Giờ Dậu (17h–19h) — chỉn chu, mạch lạc",
    "reading": "Người sinh giờ Dậu thường chỉn chu, coi trọng hình thức, nói năng mạch lạc — như gà gọi rõ từng tiếng. Bạn ăn mặc gọn gàng, trình bày đâu ra đó, đối tác nghe là hiểu ngay. Trong kinh doanh, sự chỉn chu của người đứng đầu chính là lời chào hàng đầu tiên. Lưu ý nhỏ: khi góp ý người khác, nhẹ lời một chút sẽ càng được quý."
  },
  {
    "key": "Tuất",
    "title": "Giờ Tuất (19h–21h) — trung thành, trọng tình nghĩa",
    "reading": "Sinh giờ Tuất mang nét đáng quý của loài chó: trung thành, thật thà, trọng tình nghĩa. Bạn là đồng nghiệp đáng tin, khách dặn gì nhớ nấy, hứa gì làm nấy — khách quen thường chỉ muốn gặp đúng bạn. Chữ tín này là vốn quý nhất của người bán hàng. Cứ giữ vững, kèm thêm chút chủ động mở rộng khách mới là trọn vẹn."
  },
  {
    "key": "Hợi",
    "title": "Giờ Hợi (21h–23h) — phúc hậu, dễ gần",
    "reading": "Người sinh giờ Hợi được cho là phúc hậu, xởi lởi, sống thoải mái nên ai ở gần cũng thấy dễ chịu. Bạn không tạo áp lực cho khách, để họ tự nhiên chọn lựa — và chính sự thong thả đó khiến khách tin, mua xong còn vui. Dân gian bảo giờ Hợi có lộc ăn lộc mặc. Chỉ cần thêm chút kỷ luật với mục tiêu là đủ đầy."
  }
];

export function tuviReadingOf(list: TuViReading[], key: string): TuViReading | null {
  return list.find((r) => r.key === key) ?? null;
}
