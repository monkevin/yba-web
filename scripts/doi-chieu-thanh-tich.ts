import { prisma } from "../src/lib/prisma";
import { normalizeSearch } from "../src/lib/search";

/**
 * Đối chiếu danh sách đề xuất khen thưởng với hồ sơ hội viên trong CSDL —
 * xem ai khớp được, ai không, trước khi nhập vào mục Vinh danh.
 *
 * Nguồn: 2 văn bản của Ban Thư ký (bản 27/3 và bản 25/7/2026).
 * Chạy: npx tsx scripts/doi-chieu-thanh-tich.ts
 */

const BAN_27_3 = [
  "Đặng Viên Khang",
  "Bùi Hữu Tài",
  "Lê Nguyên Tùng",
  "Nguyễn Doãn San",
  "Nguyễn Đức Anh",
  "Lê Minh Tiến",
  "Nguyễn Thị Lệ Thủy",
  "Phạm Văn Hoàng",
  "Trương Chí Tâm",
  "Ngô Trí Thủy",
  "Nguyễn Duy Trung",
  "Nguyễn Thủy Tiên",
  "Vũ Thị Hoài Trang",
  "Trần Thị Minh Anh",
  "Phạm Nguyễn Hoài Ân",
  "Trần Đức An",
  "Dương Hoài Hưng",
  "Đỗ Minh Trí",
  "Giang Quốc Cơ",
];

const BAN_25_7 = [
  "Nguyễn Đức Anh",
  "Phạm Văn Hoàng",
  "Lê Nguyên Tùng",
  "Ngô Trí Thủy",
  "Nguyễn Duy Trung",
  "Đỗ Minh Trí",
  "Vũ Thị Hoài Trang",
  "Trần Đức An",
  "Trần Thị Minh Anh",
  "Lê Văn Chí Huy",
  "Nguyễn Thị Lệ Thủy",
];

async function main() {
  const tatCa = [...new Set([...BAN_27_3, ...BAN_25_7])];

  const hoiVien = await prisma.member.findMany({
    where: { active: true },
    select: { id: true, name: true, company: true, slug: true, hoiRole: true },
  });

  const timTheoTen = (ten: string) => {
    const chuan = normalizeSearch(ten);
    return (
      hoiVien.find((m) => normalizeSearch(m.name) === chuan) ??
      hoiVien.find((m) => normalizeSearch(m.name).includes(chuan)) ??
      null
    );
  };

  const khop: string[] = [];
  const khongKhop: string[] = [];

  console.log("— Đối chiếu với hồ sơ hội viên —\n");
  for (const ten of tatCa.sort()) {
    const m = timTheoTen(ten);
    const o = [BAN_27_3.includes(ten) ? "27/3" : "    ", BAN_25_7.includes(ten) ? "25/7" : "    "].join(" ");
    if (m) {
      khop.push(ten);
      console.log(`  ✓ ${o}  ${ten.padEnd(22)} → ${m.company.slice(0, 42)}`);
    } else {
      khongKhop.push(ten);
      console.log(`  ✗ ${o}  ${ten.padEnd(22)} → KHÔNG TÌM THẤY trong danh bạ`);
    }
  }

  console.log(`\nKhớp ${khop.length}/${tatCa.length} người.`);
  if (khongKhop.length) {
    console.log("Chưa khớp:", khongKhop.join(", "));
    console.log("(có thể do viết tên khác trong danh bạ, hoặc chưa có hồ sơ)");
  }

  console.log("\n— Chênh lệch giữa hai bản —");
  const chiO273 = BAN_27_3.filter((t) => !BAN_25_7.includes(t));
  const chiO257 = BAN_25_7.filter((t) => !BAN_27_3.includes(t));
  console.log(`  Chỉ có ở bản 27/3 (${chiO273.length}):`, chiO273.join(", "));
  console.log(`  Chỉ có ở bản 25/7 (${chiO257.length}):`, chiO257.join(", "));
}

main().finally(() => prisma.$disconnect());
