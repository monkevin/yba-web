/**
 * Văn mẫu giới thiệu doanh nghiệp hội viên — nhiều giọng, chọn theo tên để 257
 * hồ sơ không bài nào giống bài nào.
 *
 * Nguyên tắc viết (bắt buộc giữ):
 *  - CHỈ diễn đạt lại dữ liệu hội viên ĐÃ KHAI: ngành, sản phẩm, dịch vụ, quy
 *    mô, năm thành lập, năm gia nhập, địa bàn, vai trò trong Hội, đóng góp tài
 *    trợ. TUYỆT ĐỐI không bịa thành tích, giải thưởng hay lịch sử.
 *  - Câu nào không có dữ liệu thì bỏ hẳn, không viết chung chung cho dài.
 *  - Giọng tự hào nhưng không sáo rỗng; câu ngắn, đọc như người viết thật.
 */

export type DuLieuDN = {
  ten: string;
  nganh: string | null;
  sanPham: string | null;
  dichVu: string | null;
  /// Năm gia nhập Chi hội
  nam: number;
  /// Năm thành lập doanh nghiệp
  namThanhLap: number | null;
  quyMo: string | null;
  khuVuc: string | null;
  diaChi: string | null;
  website: string | null;
  nguoiDaiDien: string;
  chucVu: string | null;
  /// Chức vụ trong Hội, ví dụ "Phó Chủ nhiệm · Trưởng Ban Hội viên"
  vaiTroHoi: string | null;
  laHoiVienVang: boolean;
  laDoanhNghiepLon: boolean;
  /// Nhu cầu đang tìm mua / tìm đối tác
  dangTim: string | null;
  /// Số lần đã tài trợ cho chương trình của Chi hội
  soLanTaiTro: number;
};

const NAM_NAY = new Date().getFullYear();

/** Hạ chữ cái đầu và bỏ dấu chấm cuối để ghép vào giữa câu. */
function ha(s: string): string {
  const t = s.trim().replace(/\.$/, "");
  // Từ đầu là viết tắt toàn hoa (SX, TM, VPP, OEM…) thì giữ nguyên — hạ sẽ ra
  // "sX", "vPP". Bỏ dấu câu dính đuôi trước khi kiểm, vì "VPP," vẫn là viết tắt.
  const tuDau = t.split(/\s+/)[0].replace(/[^\p{L}]+$/u, "");
  if (/^[A-ZĐ]{2,}$/.test(tuDau)) return t;
  return t.charAt(0).toLocaleLowerCase("vi") + t.slice(1);
}

/** Cắt danh sách dài thành 2–3 ý đầu để câu văn không lê thê. */
function vaiY(s: string, toiDa = 3): string {
  const y = s
    .split(/\r?\n|;|,(?=\s*[A-ZĐÀ-Ỹ])/)
    .map((x) => x.trim().replace(/^[-•▸*]\s*/, ""))
    .filter((x) => x.length > 2);
  if (y.length <= 1) return ha(s);
  // Chỉ hạ chữ cái đầu mỗi ý; KHÔNG hạ cả cụm vì sẽ phá viết tắt (VPP, OEM, LED)
  const lay = y.slice(0, toiDa).map((x) => ha(x));
  return lay.join(", ") + (y.length > toiDa ? " cùng nhiều mặt hàng khác" : "");
}

/** Băm tên → số, để mỗi doanh nghiệp luôn nhận cùng một bộ câu qua các lần chạy. */
function bam(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 1000003;
  return n;
}

// ── Đoạn 1: mở đầu ──────────────────────────────────────────────
const MO_DAU: ((d: DuLieuDN) => string)[] = [
  (d) =>
    `${d.ten} là gương mặt quen thuộc của cộng đồng doanh nhân trẻ Chợ Lớn${
      d.nganh ? ` trong lĩnh vực ${d.nganh}` : ""
    }.`,
  (d) =>
    d.nganh
      ? `Hoạt động trong lĩnh vực ${d.nganh}, ${d.ten} là một trong những doanh nghiệp hội viên tích cực của Chi hội Doanh nhân trẻ Chợ Lớn.`
      : `${d.ten} là một trong những doanh nghiệp hội viên tích cực của Chi hội Doanh nhân trẻ Chợ Lớn.`,
  (d) =>
    `Gia nhập Chi hội từ năm ${d.nam}, ${d.ten} đã đồng hành cùng cộng đồng doanh nhân trẻ Chợ Lớn qua nhiều hoạt động giao thương và kết nối${
      d.nganh ? `, với thế mạnh ở mảng ${d.nganh}` : ""
    }.`,
  (d) =>
    d.khuVuc
      ? `Đặt trụ sở tại ${d.khuVuc}, ${d.ten} phục vụ khách hàng khu vực Chợ Lớn và toàn TP.HCM${
          d.nganh ? ` trong mảng ${d.nganh}` : ""
        }.`
      : `${d.ten} phục vụ khách hàng khu vực Chợ Lớn và toàn TP.HCM${
          d.nganh ? ` trong mảng ${d.nganh}` : ""
        }.`,
  (d) =>
    d.laHoiVienVang
      ? `Là hội viên vàng của Chi hội Doanh nhân trẻ Chợ Lớn, ${d.ten} thuộc nhóm doanh nghiệp gắn bó và đóng góp bền bỉ nhất cho hoạt động của Hội.`
      : `${d.ten} mang tinh thần "Dấn thân – Đổi mới – Đột phá – Vươn tầm" của doanh nhân trẻ Chợ Lớn vào từng sản phẩm, dịch vụ của mình.`,
  (d) =>
    `Trong bức tranh ${
      d.nganh ? `ngành ${d.nganh}` : "kinh doanh"
    } tại TP.HCM, ${d.ten} chọn con đường phát triển bằng chất lượng và uy tín — đúng chất doanh nhân trẻ Chợ Lớn.`,
];

// ── Đoạn 2: bề dày (chỉ khi biết năm thành lập) ─────────────────
const BE_DAY: ((d: DuLieuDN, tuoi: number) => string)[] = [
  (d, t) =>
    `Thành lập năm ${d.namThanhLap}, doanh nghiệp đã có ${t} năm trong nghề. Chừng ấy thời gian đủ để tích luỹ những thứ không mua được bằng tiền: hiểu biết về thị trường, quan hệ với nhà cung cấp và một tệp khách hàng gắn bó.`,
  (d, t) =>
    `Với ${t} năm hoạt động kể từ khi thành lập năm ${d.namThanhLap}, ${d.ten} đã đi qua đủ chu kỳ thăng trầm của thị trường và giữ được nhịp phát triển ổn định.`,
  (d, t) =>
    `${t} năm là quãng đường ${d.ten} đã đi kể từ năm ${d.namThanhLap} — đủ dài để chứng minh sức bền, và vẫn còn nguyên tinh thần của một doanh nghiệp trẻ.`,
];

// ── Đoạn 3: sản phẩm ────────────────────────────────────────────
const SAN_PHAM: ((d: DuLieuDN) => string)[] = [
  (d) =>
    `Thế mạnh của doanh nghiệp nằm ở ${vaiY(d.sanPham!)} — những sản phẩm đã được khách hàng và đối tác trong Hội tin dùng.`,
  (d) =>
    `Doanh nghiệp tập trung vào ${vaiY(d.sanPham!)}, luôn sẵn sàng hợp tác cùng các hội viên có nhu cầu trong và ngoài ngành.`,
  (d) =>
    `Sản phẩm chủ lực gồm ${vaiY(d.sanPham!)}. Anh chị hội viên quan tâm có thể xem chi tiết ở mục sản phẩm bên dưới.`,
  (d) =>
    `Đến với ${d.ten}, đối tác tìm thấy ${vaiY(d.sanPham!)} cùng cam kết đồng hành lâu dài.`,
];

// ── Đoạn 4: dịch vụ đi kèm ──────────────────────────────────────
const DICH_VU: ((d: DuLieuDN) => string)[] = [
  (d) => `Bên cạnh sản phẩm, doanh nghiệp còn cung cấp ${vaiY(d.dichVu!)}.`,
  (d) =>
    `${d.ten} không chỉ bán hàng mà đi cùng khách suốt quá trình sử dụng, với ${vaiY(d.dichVu!)}.`,
  (d) => `Phần dịch vụ gồm ${vaiY(d.dichVu!)} — thứ tạo nên khác biệt so với việc chỉ giao hàng rồi thôi.`,
];

// ── Đoạn 5: quy mô ──────────────────────────────────────────────
const QUY_MO: ((d: DuLieuDN) => string)[] = [
  (d) =>
    `Với đội ngũ khoảng ${d.quyMo} nhân sự, doanh nghiệp duy trì được chất lượng ổn định cho từng đơn hàng, kể cả khi vào mùa cao điểm.`,
  (d) =>
    `Bộ máy ${d.quyMo} con người của ${d.ten} là nền tảng để doanh nghiệp nhận và hoàn thành tốt những hợp đồng lớn.`,
  (d) =>
    `Quy mô nhân sự hiện khoảng ${d.quyMo} người — đủ sức đáp ứng đơn hàng lớn mà vẫn giữ được sự linh hoạt khi khách cần gấp.`,
];

/** Câu thêm khi là doanh nghiệp quy mô lớn. */
const DN_LON: ((d: DuLieuDN) => string)[] = [
  () =>
    `Đây là một trong những doanh nghiệp có quy mô lớn nhất trong Chi hội, đủ năng lực nhận các đơn hàng dài hạn và yêu cầu cao về tiến độ.`,
  () =>
    `Quy mô này xếp doanh nghiệp vào nhóm lớn của Chi hội — nhóm thường được các hội viên tìm đến khi cần một nhà cung cấp đủ sức làm dài hơi.`,
];

// ── Đoạn 6: vai trò trong Hội ───────────────────────────────────
function vaiTro(d: DuLieuDN): string | null {
  const y: string[] = [];

  if (d.vaiTroHoi) {
    // Chức danh giữ nguyên hoa/thường như Ban Chủ nhiệm ghi; và nếu bản thân
    // chức danh đã có chữ "Chi hội" thì không thêm đuôi nữa cho khỏi lặp
    const daCoChiHoi = /chi hội/i.test(d.vaiTroHoi);
    y.push(
      `${d.nguoiDaiDien} hiện giữ vai trò ${d.vaiTroHoi}${
        daCoChiHoi ? "" : " của Chi hội Doanh nhân trẻ Chợ Lớn"
      }.`
    );
  }
  if (d.soLanTaiTro >= 3) {
    y.push(
      `Doanh nghiệp đã ${d.soLanTaiTro} lần đồng hành tài trợ cho các chương trình của Chi hội.`
    );
  } else if (d.soLanTaiTro > 0) {
    y.push(`Doanh nghiệp từng đồng hành tài trợ cho chương trình của Chi hội.`);
  }

  const namGanBo = NAM_NAY - d.nam;
  if (namGanBo >= 10) {
    y.push(`Đây cũng là hội viên đã gắn bó với Chi hội hơn ${namGanBo} năm.`);
  }

  return y.length ? y.join(" ") : null;
}

// ── Đoạn 7: đang tìm gì ─────────────────────────────────────────
const DANG_TIM: ((d: DuLieuDN) => string)[] = [
  (d) =>
    `Ở chiều ngược lại, ${d.ten} đang tìm ${vaiY(d.dangTim!)}. Hội viên nào cung cấp được, đây chính là cơ hội hợp tác ngay trong nhà.`,
  (d) =>
    `Doanh nghiệp cũng đang có nhu cầu tìm ${vaiY(d.dangTim!)} — ưu tiên hợp tác với anh chị em trong Chi hội.`,
];

// ── Đoạn cuối: mời kết nối ──────────────────────────────────────
const KET: ((d: DuLieuDN) => string)[] = [
  (d) =>
    `Anh chị hội viên và đối tác muốn tìm hiểu cơ hội hợp tác, hãy liên hệ trực tiếp ${d.nguoiDaiDien}${
      d.chucVu ? ` — ${d.chucVu}` : ""
    } qua thông tin bên cạnh.`,
  (d) =>
    `${d.nguoiDaiDien}${d.chucVu ? `, ${d.chucVu},` : ""} luôn sẵn lòng trao đổi với anh chị em trong Hội về mọi cơ hội mua bán, hợp tác.`,
  (d) =>
    `Ưu tiên dùng hàng của nhau là văn hoá của Chi hội — mời anh chị kết nối với ${d.ten} qua thông tin liên hệ bên cạnh.`,
  (d) =>
    `Hãy để ${d.ten} trở thành nhà cung cấp, đối tác tiếp theo của doanh nghiệp anh chị. Thông tin liên hệ có ở cột bên.`,
];

/**
 * Dựng bài giới thiệu 4–7 đoạn tuỳ lượng dữ liệu doanh nghiệp đã khai.
 * Giọng và thứ tự câu thay đổi theo tên nên mỗi hồ sơ đọc một khác.
 */
export function vietGioiThieu(d: DuLieuDN): string {
  const h = bam(d.ten);
  const doan: string[] = [];

  doan.push(MO_DAU[h % MO_DAU.length](d));

  // Bề dày — chỉ viết khi biết năm thành lập và hợp lý
  const tuoi =
    d.namThanhLap && d.namThanhLap >= 1900 && d.namThanhLap <= NAM_NAY
      ? NAM_NAY - d.namThanhLap
      : 0;
  if (tuoi >= 3) {
    doan.push(BE_DAY[(h >> 2) % BE_DAY.length](d, tuoi));
  }

  if (d.sanPham) doan.push(SAN_PHAM[(h >> 4) % SAN_PHAM.length](d));
  if (d.dichVu) doan.push(DICH_VU[(h >> 6) % DICH_VU.length](d));

  // Quy mô + ghi chú doanh nghiệp lớn + năm gia nhập gộp thành một đoạn
  const cauQuyMo: string[] = [];
  if (d.quyMo) cauQuyMo.push(QUY_MO[(h >> 8) % QUY_MO.length](d));
  if (d.laDoanhNghiepLon) cauQuyMo.push(DN_LON[(h >> 10) % DN_LON.length](d));
  if (!tuoi) cauQuyMo.push(`Doanh nghiệp sinh hoạt tại Chi hội từ năm ${d.nam}.`);
  if (cauQuyMo.length) doan.push(cauQuyMo.join(" "));

  const vt = vaiTro(d);
  if (vt) doan.push(vt);

  if (d.dangTim) doan.push(DANG_TIM[(h >> 12) % DANG_TIM.length](d));

  doan.push(KET[(h >> 14) % KET.length](d));

  return doan.join("\n\n");
}
