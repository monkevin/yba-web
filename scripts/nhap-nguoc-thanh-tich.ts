import { prisma } from "../src/lib/prisma";
import { normalizeSearch } from "../src/lib/search";

/**
 * Nhập ngược vai trò Ban Tổ chức và lượt tham dự từ BÁO CÁO THÀNH TÍCH đã có
 * văn bản, để chỉ số đóng góp phản ánh đúng công sức thật.
 *
 * NGUYÊN TẮC: chỉ ghi những gì VĂN BẢN NÓI RÕ.
 *   - Văn bản ghi "Ban chỉ đạo / Trưởng BTC / Phó BTC / Trưởng đoàn" → BanToChuc
 *   - Văn bản ghi "Tham gia / Tham dự"                              → NguoiThamDu
 *   - KHÔNG suy diễn: không tự cho là có mặt chỉ vì đứng tên BTC.
 * Tài trợ KHÔNG nhập ở đây — bảng TaiTroSuKien đã có 78 bản ghi do thư ký nhập,
 * nhập chồng sẽ đếm hai lần.
 *
 * Ghép sự kiện theo TỪ KHOÁ + năm. Chỗ nào không ghép được thì bỏ qua và liệt
 * kê ra để Ban Thư ký đối chiếu tay — thà thiếu còn hơn gán nhầm sự kiện.
 *
 * Xem trước:  npx tsx scripts/nhap-nguoc-thanh-tich.ts
 * Ghi thật:   npx tsx scripts/nhap-nguoc-thanh-tich.ts -- --ghi
 */

type Vai = "BAN_CHI_DAO" | "TRUONG_BAN" | "PHO_BAN" | "THANH_VIEN";
type Muc = { tuKhoa: string; nam: number; vai?: Vai; thamDu?: boolean; ghiChu?: string };

/** Nguồn: "BÁO CÁO THÀNH TÍCH — Đặng Viên Khang" (Google Docs, bản 2026). */
const KHANG: Muc[] = [
  // ── Cấp Chi hội — Ban chỉ đạo ─────────────────────────────────
  { tuKhoa: "year end party yba cho lon 2025", nam: 2026, vai: "BAN_CHI_DAO" },
  { tuKhoa: "coffee share so 5", nam: 2025, vai: "BAN_CHI_DAO" },
  { tuKhoa: "coffee share so 6", nam: 2026, vai: "BAN_CHI_DAO" },
  { tuKhoa: "hop mat hoi vien quy ii", nam: 2025, vai: "BAN_CHI_DAO" },
  { tuKhoa: "connect beyond lan 1", nam: 2025, vai: "BAN_CHI_DAO" },
  { tuKhoa: "connect beyond lan 2", nam: 2025, vai: "BAN_CHI_DAO" },
  { tuKhoa: "connect beyond lan 3", nam: 2025, vai: "BAN_CHI_DAO" },
  { tuKhoa: "phan rang", nam: 2025, vai: "BAN_CHI_DAO", ghiChu: "Caravan Vươn Tầm Kết Nối" },
  { tuKhoa: "vung tau", nam: 2026, vai: "BAN_CHI_DAO", ghiChu: "Caravan Vươn Tầm Kết Nối" },
  { tuKhoa: "psc", nam: 2025, vai: "BAN_CHI_DAO" },
  { tuKhoa: "arobid", nam: 2025, vai: "BAN_CHI_DAO" },
  { tuKhoa: "goi von tu singapore", nam: 2025, vai: "BAN_CHI_DAO" },
  { tuKhoa: "he xanh cung con", nam: 2025, vai: "BAN_CHI_DAO" },
  { tuKhoa: "pickleball noi bo", nam: 2025, vai: "BAN_CHI_DAO", ghiChu: "Giải YPL" },
  { tuKhoa: "nha nhan ai", nam: 2026, vai: "BAN_CHI_DAO", ghiChu: "Cam Lâm" },

  // ── Cấp Hội ───────────────────────────────────────────────────
  { tuKhoa: "hoi tu vuon tam", nam: 2025, vai: "PHO_BAN", ghiChu: "Phó Trưởng BTC Thường trực, Trưởng ban Gian hàng" },
  { tuKhoa: "one yba", nam: 2026, vai: "TRUONG_BAN", ghiChu: "Trưởng ban Truyền thông" },
  { tuKhoa: "giai noi bo clb pickleball", nam: 2025, vai: "BAN_CHI_DAO" },
  { tuKhoa: "trung hau cup", nam: 2025, vai: "PHO_BAN" },
  { tuKhoa: "cau huu duyen", nam: 2025, vai: "BAN_CHI_DAO", ghiChu: "Nhịp Cầu Doanh Nhân" },
  // "cau an hoa" khớp cả buổi Tiền trạm lẫn Lễ khởi công — chỉ định rõ Lễ khởi
// công, vì đó mới là chương trình chính văn bản nhắc tới.
{ tuKhoa: "le khoi cong", nam: 2026, vai: "BAN_CHI_DAO", ghiChu: "Nhịp Cầu Doanh Nhân — Cầu An Hòa" },
  { tuKhoa: "vietnam pavilion", nam: 2025, vai: "TRUONG_BAN", ghiChu: "Trưởng đoàn Du học Singapore tại ISCA" },
  { tuKhoa: "ngay hoi viec lam", nam: 2025, vai: "BAN_CHI_DAO", ghiChu: "Việc làm cho 500 người khuyết tật" },
  { tuKhoa: "le cuoi tap the", nam: 2025, vai: "BAN_CHI_DAO", ghiChu: "50 cặp đôi" },

  // ── Tham dự (văn bản ghi rõ "Tham gia các chương trình") ───────
  { tuKhoa: "innoex", nam: 2026, thamDu: true },
  { tuKhoa: "green innovation summit", nam: 2026, thamDu: true },
  { tuKhoa: "khai xuan dau nam", nam: 2026, thamDu: true },
  { tuKhoa: "go-kart", nam: 2026, thamDu: true },
];

/**
 * Nguồn cho 10 người còn lại: "[YBA CHỢ LỚN] BẢNG TÓM TẮT BÁO CÁO THÀNH TÍCH"
 * (Mẫu 2, bản 25/7/2026). Chỉ chép những dòng nêu rõ vai trò hoặc nêu rõ
 * "tham gia / tham dự" một chương trình CỤ THỂ — câu chung chung kiểu "tham gia
 * 95% sự kiện" thì bỏ, vì không quy ra được sự kiện nào.
 */
const DUC_ANH: Muc[] = [
  { tuKhoa: "psc", nam: 2025, vai: "TRUONG_BAN" },
  { tuKhoa: "connect beyond lan 1", nam: 2025, vai: "TRUONG_BAN", ghiChu: "Chính sách thuế quan" },
  { tuKhoa: "connect beyond lan 2", nam: 2025, vai: "TRUONG_BAN", ghiChu: "Kèm Họp mặt Quý III" },
  { tuKhoa: "goi von tu singapore", nam: 2025, vai: "TRUONG_BAN" },
  { tuKhoa: "vietnam pavilion", nam: 2025, vai: "TRUONG_BAN", ghiChu: "Du học Singapore tại ISCA" },
  { tuKhoa: "arobid", nam: 2025, vai: "TRUONG_BAN" },
  { tuKhoa: "cau huu duyen", nam: 2025, vai: "TRUONG_BAN", ghiChu: "Nhịp Cầu Doanh Nhân" },
  { tuKhoa: "hop mat hoi vien quy ii", nam: 2025, vai: "PHO_BAN" },
  { tuKhoa: "one yba", nam: 2026, vai: "THANH_VIEN" },
  { tuKhoa: "coffee share so 6", nam: 2026, vai: "THANH_VIEN", ghiChu: "Host chương trình" },
];

const VAN_HOANG: Muc[] = [
  { tuKhoa: "khai xuan dau nam", nam: 2026, vai: "TRUONG_BAN" },
  { tuKhoa: "hoi tu vuon tam", nam: 2025, thamDu: true, ghiChu: "Giải Nhì tiết mục văn nghệ" },
];

const NGUYEN_TUNG: Muc[] = [
  { tuKhoa: "hoi tu vuon tam", nam: 2025, vai: "THANH_VIEN" },
  { tuKhoa: "coffee share so 5", nam: 2025, vai: "TRUONG_BAN" },
  { tuKhoa: "ngay hoi viec lam", nam: 2025, vai: "THANH_VIEN" },
  { tuKhoa: "one yba", nam: 2026, thamDu: true, ghiChu: "Biểu diễn tiết mục" },
];

const TRI_THUY: Muc[] = [
  { tuKhoa: "he xanh cung con", nam: 2025, vai: "TRUONG_BAN" },
  { tuKhoa: "connect beyond lan 1", nam: 2025, vai: "THANH_VIEN" },
  { tuKhoa: "hop mat hoi vien quy ii", nam: 2025, vai: "THANH_VIEN" },
  { tuKhoa: "vung tau", nam: 2026, vai: "THANH_VIEN" },
  { tuKhoa: "hoi tu vuon tam", nam: 2025, thamDu: true, ghiChu: "Giải Nhì tiết mục văn nghệ" },
];

const DUY_TRUNG: Muc[] = [
  { tuKhoa: "goi von tu singapore", nam: 2025, vai: "PHO_BAN" },
  { tuKhoa: "hoi tu vuon tam", nam: 2025, vai: "THANH_VIEN", ghiChu: "Ban gian hàng" },
  { tuKhoa: "connect beyond lan 2", nam: 2025, vai: "PHO_BAN" },
  { tuKhoa: "connect beyond lan 1", nam: 2025, vai: "PHO_BAN" },
  { tuKhoa: "year end party", nam: 2026, vai: "PHO_BAN" },
  { tuKhoa: "coffee share so 6", nam: 2026, vai: "PHO_BAN" },
  { tuKhoa: "vung tau", nam: 2026, thamDu: true, ghiChu: "Gian hàng" },
];

const MINH_TRI: Muc[] = [
  { tuKhoa: "hoi tu vuon tam", nam: 2025, vai: "THANH_VIEN" },
  { tuKhoa: "coffee share so 6", nam: 2026, vai: "TRUONG_BAN" },
  { tuKhoa: "connect beyond lan 2", nam: 2025, vai: "PHO_BAN" },
  { tuKhoa: "connect beyond lan 1", nam: 2025, vai: "PHO_BAN" },
  { tuKhoa: "arobid", nam: 2025, vai: "PHO_BAN" },
  { tuKhoa: "vung tau", nam: 2026, thamDu: true, ghiChu: "Gian hàng" },
];

const HOAI_TRANG: Muc[] = [
  { tuKhoa: "hop mat hoi vien quy ii", nam: 2025, vai: "TRUONG_BAN" },
  { tuKhoa: "base.vn", nam: 2026, vai: "TRUONG_BAN" },
  { tuKhoa: "khai xuan dau nam", nam: 2026, vai: "PHO_BAN" },
  { tuKhoa: "vung tau", nam: 2026, thamDu: true, ghiChu: "Gian hàng" },
];

const MINH_ANH: Muc[] = [
  { tuKhoa: "le khoi cong", nam: 2026, vai: "PHO_BAN", ghiChu: "Nhịp Cầu Doanh Nhân — Cầu An Hòa" },
  { tuKhoa: "khai xuan dau nam", nam: 2026, vai: "TRUONG_BAN" },
  { tuKhoa: "giang's care", nam: 2026, vai: "TRUONG_BAN" },
  { tuKhoa: "go-kart", nam: 2026, vai: "TRUONG_BAN", ghiChu: "Trưởng đoàn" },
  { tuKhoa: "year end party", nam: 2026, vai: "THANH_VIEN" },
  { tuKhoa: "coffee share so 6", nam: 2026, vai: "THANH_VIEN" },
  { tuKhoa: "connect beyond lan 3", nam: 2025, vai: "THANH_VIEN" },
  { tuKhoa: "vung tau", nam: 2026, vai: "THANH_VIEN" },
  { tuKhoa: "hoi tu vuon tam", nam: 2025, thamDu: true, ghiChu: "Giải Nhì tiết mục văn nghệ" },
];

const LE_THUY: Muc[] = [
  { tuKhoa: "connect beyond lan 1", nam: 2025, vai: "TRUONG_BAN" },
  { tuKhoa: "year end party", nam: 2026, vai: "TRUONG_BAN" },
  { tuKhoa: "vung tau", nam: 2026, vai: "TRUONG_BAN" },
  { tuKhoa: "coffee share so 5", nam: 2025, vai: "THANH_VIEN" },
  { tuKhoa: "psc", nam: 2025, vai: "PHO_BAN" },
  { tuKhoa: "connect beyond lan 2", nam: 2025, vai: "PHO_BAN" },
  { tuKhoa: "ngay hoi viec lam", nam: 2025, vai: "PHO_BAN", ghiChu: "500 người khuyết tật" },
  { tuKhoa: "goi von tu singapore", nam: 2025, vai: "THANH_VIEN" },
  { tuKhoa: "vietnam pavilion", nam: 2025, vai: "THANH_VIEN" },
  { tuKhoa: "arobid", nam: 2025, vai: "THANH_VIEN" },
  { tuKhoa: "cau huu duyen", nam: 2025, vai: "THANH_VIEN" },
  { tuKhoa: "hoi tu vuon tam", nam: 2025, thamDu: true, ghiChu: "Giải Nhì tiết mục văn nghệ" },
];

const NGUON: { ten: string; muc: Muc[] }[] = [
  { ten: "Đặng Viên Khang", muc: KHANG },
  { ten: "Nguyễn Đức Anh", muc: DUC_ANH },
  { ten: "Phạm Văn Hoàng", muc: VAN_HOANG },
  { ten: "Lê Nguyên Tùng", muc: NGUYEN_TUNG },
  { ten: "Ngô Trí Thủy", muc: TRI_THUY },
  { ten: "Nguyễn Duy Trung", muc: DUY_TRUNG },
  { ten: "Đỗ Minh Trí", muc: MINH_TRI },
  { ten: "Vũ Thị Hoài Trang", muc: HOAI_TRANG },
  { ten: "Trần Thị Minh Anh", muc: MINH_ANH },
  { ten: "Nguyễn Thị Lệ Thủy", muc: LE_THUY },
];

async function main() {
  const ghi = process.argv.includes("--ghi");
  console.log(ghi ? "— GHI THẬT —\n" : "— XEM TRƯỚC (thêm -- --ghi để ghi thật) —\n");

  const suKien = await prisma.event.findMany({
    select: { id: true, title: true, startAt: true },
  });

  /**
   * Ghép theo từ khoá đã bỏ dấu + đúng năm.
   *
   * Nhiều sự kiện cùng khớp thì lấy cái có TÊN NGẮN NHẤT — tên càng ngắn nghĩa
   * là từ khoá càng chiếm phần lớn tên, tức khớp sát nhất. Ví dụ "hội tụ vươn
   * tầm" khớp cả "Hội Tụ Vươn Tầm" lẫn "Pickleball Hội Tụ Vươn Tầm"; lấy cái
   * ngắn là đúng ý văn bản. Trả về kèm cảnh báo để còn soát lại bằng mắt.
   */
  const ghep = (m: Muc) => {
    const kq = suKien
      .filter(
        (e) =>
          e.startAt.getFullYear() === m.nam &&
          normalizeSearch(e.title).includes(normalizeSearch(m.tuKhoa))
      )
      .sort((a, b) => a.title.length - b.title.length);
    return { e: kq[0] ?? null, mapMo: kq.length > 1, khac: kq.slice(1).map((x) => x.title) };
  };

  for (const { ten, muc } of NGUON) {
    const hoiVien = await prisma.member.findFirst({
      where: { name: { contains: ten.split(" ").slice(-2).join(" ") }, active: true },
      select: { id: true, name: true },
    });
    if (!hoiVien) {
      console.log(`✗ Không tìm thấy hội viên "${ten}", bỏ qua\n`);
      continue;
    }

    console.log(`${hoiVien.name}`);
    const khong: string[] = [];
    let soBTC = 0;
    let soThamDu = 0;

    for (const m of muc) {
      const { e, mapMo, khac } = ghep(m);
      if (!e) {
        khong.push(`${m.tuKhoa} (${m.nam})`);
        continue;
      }

      const nhan = m.thamDu ? "tham dự" : (m.vai ?? "THANH_VIEN");
      console.log(`   ✓ ${String(nhan).padEnd(12)} ${e.title.slice(0, 52)}`);
      if (mapMo) {
        console.log(`     ⚠ từ khoá "${m.tuKhoa}" còn khớp: ${khac.join(" | ").slice(0, 60)}`);
      }

      if (!ghi) {
        m.thamDu ? soThamDu++ : soBTC++;
        continue;
      }

      if (m.thamDu) {
        const daCo = await prisma.nguoiThamDu.findFirst({
          where: { eventId: e.id, memberId: hoiVien.id },
          select: { id: true },
        });
        if (!daCo) {
          await prisma.nguoiThamDu.create({
            data: {
              eventId: e.id,
              memberId: hoiVien.id,
              hoTen: hoiVien.name,
              ghiChu: "Nhập từ báo cáo thành tích",
            },
          });
          soThamDu++;
        }
      } else {
        const daCo = await prisma.banToChuc.findFirst({
          where: { eventId: e.id, memberId: hoiVien.id },
          select: { id: true },
        });
        if (!daCo) {
          await prisma.banToChuc.create({
            data: {
              eventId: e.id,
              memberId: hoiVien.id,
              hoTen: hoiVien.name,
              vaiTro: m.vai ?? "THANH_VIEN",
              ghiChu: m.ghiChu ?? "Nhập từ báo cáo thành tích",
            },
          });
          soBTC++;
        }
      }
    }

    console.log(`\n   → ${soBTC} vai Ban Tổ chức · ${soThamDu} lượt tham dự`);
    if (khong.length) {
      console.log(`   → KHÔNG ghép được ${khong.length} mục, cần Ban Thư ký đối chiếu tay:`);
      khong.forEach((k) => console.log(`        · ${k}`));
    }
    console.log();
  }
}

main().finally(() => prisma.$disconnect());
