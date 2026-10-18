/**
 * Đưa chương trình "Nhịp Cầu Doanh Nhân 4 – Hướng về Quảng Trị" lên website
 * (và Mini App — cùng đọc một CSDL qua /api/mobile/tai-tro và /api/mobile/lich).
 *
 * Nội dung chép NGUYÊN VĂN từ proposal chính thức 14 trang
 * (`Nhip cau doanh nhân/Nhip-Cau-Doanh-Nhan-4_Huong-ve-Quang-Tri_Proposal.pdf`,
 * bản 31/08/2026) — không tự đặt thêm quyền lợi hay hạng mục nào.
 *
 * Idempotent — chạy lại bao nhiêu lần cũng an toàn: đã có bản ghi (theo slug)
 * thì BỎ QUA, không ghi đè nội dung Ban Chủ nhiệm đã sửa ở /quan-tri.
 * Import TƯƠNG ĐỐI để chạy được trong container (như tao-tai-khoan-kiem-duyet).
 *
 *   npx tsx scripts/tao-ncdn4.ts
 *
 * Ảnh bìa nằm ở `tai-len/tai-tro/` (ổ đĩa gắn ngoài của Docker) chứ KHÔNG ở
 * `public/` — cố ý, để đưa lên máy chủ chỉ cần chép file vào /opt/yba-web/tai-len
 * và `docker cp` script này vào container, KHÔNG phải build lại ảnh Docker.
 */
import { prisma } from "../src/lib/prisma";

const SLUG = "nhip-cau-doanh-nhan-4";

const DU_AN = {
  slug: SLUG,
  ten: "Nhịp Cầu Doanh Nhân 4 – Hướng về Quảng Trị",
  tomTat:
    "Công trình an sinh 500 triệu đồng tại xã A Dơi, tỉnh Quảng Trị — nước sạch, " +
    "y tế và tiếp sức trẻ em — chào mừng Lễ chuyển giao và ra mắt Ban Điều hành " +
    "YBA Chợ Lớn Nhiệm kỳ I (2026–2029). Hoạt động chào mừng 32 năm YBA HCM.",
  moTa: `Tiếp nối ba cây cầu đã hoàn thành của chuỗi "Nhịp Cầu Doanh Nhân" (cầu Cần Thảo – An Giang, cầu Hữu Duyên – Vĩnh Long, cầu An Hòa – An Giang), chương trình số 4 hướng về xã A Dơi — xã biên giới tỉnh Quảng Trị, tiếp giáp nước bạn Lào, hơn 90% dân số là đồng bào Bru – Vân Kiều và Pa Cô, điều kiện tiếp cận nước sạch và y tế còn nhiều hạn chế.

SÁU HẠNG MỤC — TỔNG NGÂN SÁCH 500 TRIỆU ĐỒNG:
• 03 giếng nước sạch tại thôn Vầng, thôn Hùn và thôn Măng Sông — 105.000.000 đ
• 01 hệ thống nước sạch tại Trạm Y tế xã A Dơi — 120.000.000 đ
• 01 phòng kho bảo quản thuốc, vật tư và thiết bị y tế — 100.000.000 đ
• 01 phòng chăm sóc, lưu bệnh nhân nghèo — 100.000.000 đ
• 150 suất quà tiếp sức trẻ em có hoàn cảnh khó khăn (500.000 đ/suất) — 75.000.000 đ

Trong đó 85% dành cho các công trình an sinh có giá trị sử dụng lâu dài, 15% hỗ trợ trực tiếp trẻ em. Mỗi đồng tài trợ đều gắn với một hạng mục cụ thể; các hạng mục được nghiệm thu, bàn giao có xác nhận của địa phương và công khai báo cáo thu – chi.

GIÁ TRỊ QUY ĐỔI: 5 triệu = 10 phần quà tiếp sức trẻ em · 35 triệu = hoàn thiện 01 giếng nước sạch cho một thôn · 100 triệu = 01 phòng chăm sóc bệnh nhân hoặc 01 phòng kho y tế · 120 triệu = hệ thống nước sạch cho Trạm Y tế xã.

Đơn vị chỉ đạo: Hội Doanh nhân trẻ TP.HCM · Thực hiện: YBA Chợ Lớn · Phối hợp: UBND, Công an & UB MTTQ VN xã A Dơi · Đồng hành: CLB Pickleball YBA HCM, Nhóm thiện nguyện HCM.

Ban Chỉ đạo & Ban Tổ chức: anh Võ Đại Khôi (Phó Chủ tịch YBA HCM) – Trưởng ban Chỉ đạo · anh Đặng Viên Khang (Phó Chủ tịch YBA HCM) – Thành viên Ban Chỉ đạo · anh Nguyễn Doãn San (Phó Chủ tịch YBA HCM) – Trưởng dự án · anh Nguyễn Đức Anh (Ủy viên BCH YBA HCM) – Trưởng ban Tổ chức.

THÔNG TIN CHUYỂN KHOẢN
Tên tài khoản: HỘI DOANH NHÂN TRẺ TP.HCM
Số tài khoản: 1903 6898 405 015 — Techcombank, CN Sài Gòn
Nội dung: "Nhip Cau Doanh Nhan 4 + tên doanh nghiệp/cá nhân"
(ghi rõ tên để Ban Tổ chức đối soát và gửi thư cảm ơn)`,
  anh: "/tai-len/tai-tro/nhip-cau-doanh-nhan-4.jpg",
  mucTieu: 500_000_000,
  order: 0, // đứng trên hai chương trình khung có sẵn
};

/** Sáu gói — tên, mức tiền và quyền lợi nguyên văn trang 11 của proposal. */
const CAC_GOI = [
  {
    ten: "Nhà tài trợ Chính",
    soTien: 100_000_000,
    noiBat: true,
    quyenLoi: `Nhận diện cao nhất
Logo nổi bật trên toàn bộ ấn phẩm, KV và backdrop
Phát biểu tại lễ
Tham gia nghi thức bàn giao
Bài truyền thông riêng
Ghi nhận tại bảng tri ân công trình`,
    order: 1,
  },
  {
    ten: "Kim Cương",
    soTien: 50_000_000,
    quyenLoi: `Logo nhóm ưu tiên trên KV, backdrop và ấn phẩm
Tham gia lễ bàn giao
Bài tri ân riêng
Xuất hiện nổi bật trong clip và bài tổng kết
Chứng nhận tài trợ`,
    order: 2,
  },
  {
    ten: "Vàng",
    soTien: 30_000_000,
    quyenLoi: `Logo trên backdrop và ấn phẩm
Vinh danh tại chương trình
Xuất hiện trong nội dung truyền thông
Hoa và chứng nhận tài trợ`,
    order: 3,
  },
  {
    ten: "Bạc",
    soTien: 20_000_000,
    quyenLoi: `Logo trên bảng Nhà tài trợ và ấn phẩm số
Cảm ơn tại chương trình
Chứng nhận tài trợ`,
    order: 4,
  },
  {
    ten: "Đồng",
    soTien: 10_000_000,
    quyenLoi: `Logo hoặc tên trong danh sách Nhà tài trợ
Bài cảm ơn chung
Chứng nhận tài trợ`,
    order: 5,
  },
  {
    ten: "Đồng hành",
    soTien: 5_000_000,
    quyenLoi: `Tên hoặc logo trong danh sách đơn vị đồng hành
Thư cảm ơn hoặc chứng nhận từ Ban Tổ chức`,
    order: 6,
  },
];

/**
 * Mục lịch hoạt động — cửa sổ vận động 05/09 → 10/10/2026 theo kế hoạch
 * truyền thông 10 bài đã duyệt (TRUYEN THONG/KE-HOACH-TRUYEN-THONG_*.pdf).
 */
const LICH = {
  slug: SLUG,
  tieuDe: "Nhịp Cầu Doanh Nhân 4 – Hướng về Quảng Trị",
  moTa:
    "Vận động tài trợ công trình an sinh 500 triệu đồng tại xã A Dơi: nước sạch, " +
    "y tế và 150 suất quà tiếp sức trẻ em — chào mừng Lễ chuyển giao BĐH Nhiệm kỳ I.",
  yNghia:
    "Nhiệm kỳ mới bắt đầu bằng một công trình có thật — mỗi nguồn nước được khơi thông, " +
    "mỗi phòng bệnh được hoàn thiện đều là giá trị còn ở lại với cộng đồng.",
  anhBia: "/tai-len/tai-tro/nhip-cau-doanh-nhan-4.jpg",
  banToChuc: "YBA Chợ Lớn · CLB Pickleball YBA HCM · Nhóm thiện nguyện HCM",
  tuNgay: new Date(2026, 8, 5), // 05/09/2026 — bài truyền thông đầu tiên
  denNgay: new Date(2026, 9, 10), // 10/10/2026 — Lễ chuyển giao BĐH
  diaDiem: "Xã A Dơi, tỉnh Quảng Trị",
  nguon: "CHI_HOI",
  noiBat: true,
  lienKet: "/tai-tro",
};

(async () => {
  // ── Dự án tài trợ + gói ──────────────────────────────────────────
  let duAn = await prisma.duAnTaiTro.findUnique({ where: { slug: SLUG } });
  if (duAn) {
    console.log(`= Dự án "${duAn.ten}" đã có — giữ nguyên.`);
  } else {
    duAn = await prisma.duAnTaiTro.create({ data: DU_AN });
    console.log(`+ Dự án: ${duAn.ten}`);
  }

  let themGoi = 0;
  for (const g of CAC_GOI) {
    const co = await prisma.goiTaiTro.findFirst({
      where: { duAnId: duAn.id, ten: g.ten },
      select: { id: true },
    });
    if (co) continue;
    await prisma.goiTaiTro.create({ data: { ...g, duAnId: duAn.id } });
    themGoi++;
  }
  console.log(`+ Gói tài trợ mới: ${themGoi}/${CAC_GOI.length}`);

  // ── Lịch hoạt động ───────────────────────────────────────────────
  const coLich = await prisma.lichHoatDong.findUnique({
    where: { slug: SLUG },
    select: { id: true },
  });
  if (coLich) {
    console.log("= Mục lịch hoạt động đã có — giữ nguyên.");
  } else {
    await prisma.lichHoatDong.create({ data: LICH });
    console.log(`+ Lịch hoạt động: ${LICH.tieuDe} (05/09 → 10/10/2026)`);
  }

  const tongGoi = await prisma.goiTaiTro.count({ where: { duAnId: duAn.id } });
  console.log(`\nXong. Chương trình có ${tongGoi} gói, mục tiêu 500 triệu đồng.`);
  await prisma.$disconnect();
})();
