import { prisma } from "../src/lib/prisma";
import { MO_TA_CHI_SO, TEN_CHI_SO, thongKeHoiVien } from "../src/lib/diem-hoat-dong";

/**
 * Soát điểm đóng góp của một hội viên và chỉ ra chỉ số nào thiếu dữ liệu nguồn.
 *
 * Gọi THẲNG `thongKeHoiVien()` — cùng hàm mà Mini App dùng — nên số ở đây luôn
 * khớp với số hội viên nhìn thấy, không sợ lệch vì viết lại công thức.
 *
 * Chạy: npx tsx scripts/soat-diem-dong-gop.ts "Viên Khang"
 */
async function main() {
  const ten = process.argv[2] ?? "Viên Khang";
  const nam = new Date().getFullYear();

  const m = await prisma.member.findFirst({
    where: { name: { contains: ten }, active: true },
    select: { id: true, name: true, company: true },
  });
  if (!m) return console.log(`Không tìm thấy hội viên "${ten}"`);

  const tk = await thongKeHoiVien(m.id, nam);
  const c = tk.chiTiet;
  const trieu = (v: number) => (v / 1_000_000).toLocaleString("vi-VN") + " triệu";

  console.log(`${m.name} — ${m.company}`);
  console.log(`Số liệu năm ${nam}\n`);

  const nguon: Record<string, string> = {
    KET_NOI: `${c.soLanGioiThieu} giao dịch có anh/chị làm người giới thiệu`,
    DONG_GOP: `${c.soLanTaiTro} lần tài trợ (${trieu(c.giaTriTaiTro)}) + ${c.soLanTrongBTC} vai Ban Tổ chức`,
    HOAT_DONG: `có mặt ${c.soSuKienThamDu}/${c.soSuKienTrongNam} sự kiện trong năm`,
    GIAO_THUONG: `${c.soGiaoDichBan} đơn bán + ${c.soGiaoDichMua} đơn mua đã duyệt`,
    LAN_TOA: `${c.soUuDai} ưu đãi + ${c.soTinDang} tin đăng`,
  };

  console.log("CHỈ SỐ         ĐIỂM   NGUỒN DỮ LIỆU");
  console.log("─".repeat(74));
  for (const [ma, diem] of Object.entries(tk.diem)) {
    console.log(`${TEN_CHI_SO[ma].padEnd(13)} ${String(diem).padStart(5)}   ${nguon[ma]}`);
  }

  const trong = Object.entries(tk.diem).filter(([, d]) => d === 0);
  if (trong.length) {
    console.log("\n— Chỉ số đang bằng 0, thiếu dữ liệu nguồn —");
    trong.forEach(([ma]) => console.log(`  • ${TEN_CHI_SO[ma]}: ${MO_TA_CHI_SO[ma]}`));
  }
}

main().finally(() => prisma.$disconnect());
