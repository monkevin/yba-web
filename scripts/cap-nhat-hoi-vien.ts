/**
 * Đồng bộ danh sách hội viên từ Google Sheet của Chi hội:
 *  - cập nhật loại hội viên, quy mô nhân sự, năm gia nhập, ghi chú
 *  - ghi nhận hội phí từng năm 2018–2027
 *  - đánh dấu người đã RỜI HỘI (có trong danh sách nhưng nhiều năm không đóng)
 *  - tính cấp bậc để xếp thứ tự hiển thị
 *
 *   npm run cap-nhat-hoi-vien            (xem trước)
 *   npm run cap-nhat-hoi-vien -- --ghi   (ghi vào cơ sở dữ liệu)
 */
import { prisma } from "../src/lib/prisma";
import { normalizeSearch } from "../src/lib/search";
import { xepHangHoiVien } from "../src/lib/xep-hang";

const GHI = process.argv.includes("--ghi");

const SHEET =
  "https://docs.google.com/spreadsheets/d/1SxGZjoDK3KBNDnfKcHNnzEFyFBWCic5o/export?format=csv&gid=1822453894";

/** Cột trong sheet (0-based) — xem hàng tiêu đề ở dòng 5 của file. */
const C = {
  xungHo: 1,
  hoLot: 2,
  ten: 3,
  chucVu: 4,
  doanhNghiep: 5,
  namGiaNhap: 17,
  loaiHoiVien: 18,
  traTu: 20, // Thanh toán 2018
  traDen: 29, // Thanh toán 2027
  soNhanVien: 33,
  ghiChu: 36,
};
const NAM_DAU = 2018;

/** Tách một dòng CSV có thể chứa dấu phẩy và xuống dòng trong ô. */
function docCsv(text: string): string[][] {
  const rows: string[][] = [];
  let o: string[] = [];
  let cur = "";
  let trongNhay = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (trongNhay) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else trongNhay = false;
      } else cur += c;
    } else if (c === '"') trongNhay = true;
    else if (c === ",") {
      o.push(cur);
      cur = "";
    } else if (c === "\n") {
      o.push(cur);
      rows.push(o);
      o = [];
      cur = "";
    } else if (c !== "\r") cur += c;
  }
  if (cur || o.length) {
    o.push(cur);
    rows.push(o);
  }
  return rows;
}

const o = (r: string[], i: number) => (i < r.length ? r[i].trim() : "");

(async () => {
  const res = await fetch(SHEET);
  if (!res.ok) {
    console.error(`Không tải được sheet (HTTP ${res.status}).`);
    process.exit(1);
  }
  const rows = docCsv(await res.text()).slice(5);
  const dong = rows.filter((r) => o(r, C.ten) || o(r, C.doanhNghiep));
  console.log(`Đọc được ${dong.length} hội viên từ sheet.\n`);

  const members = await prisma.member.findMany({
    select: { id: true, code: true, name: true, company: true },
  });

  // Khớp theo tên doanh nghiệp đã bỏ dấu; dự phòng khớp theo họ tên
  const theoCty = new Map<string, typeof members>();
  const theoTen = new Map<string, typeof members>();
  for (const m of members) {
    const kc = normalizeSearch(m.company);
    const kt = normalizeSearch(m.name);
    theoCty.set(kc, [...(theoCty.get(kc) ?? []), m]);
    theoTen.set(kt, [...(theoTen.get(kt) ?? []), m]);
  }

  const namNay = new Date().getFullYear();
  let khop = 0;
  let khongKhop = 0;
  let soChuaDongPhi = 0;
  const chuaKhop: string[] = [];
  const daKhop = new Set<string>();

  for (const r of dong) {
    const cty = o(r, C.doanhNghiep);
    const hoTen = `${o(r, C.hoLot)} ${o(r, C.ten)}`.replace(/\s+/g, " ").trim();

    let ung = theoCty.get(normalizeSearch(cty)) ?? [];
    if (ung.length !== 1) ung = theoTen.get(normalizeSearch(hoTen)) ?? [];
    if (ung.length !== 1) {
      khongKhop++;
      chuaKhop.push(`${hoTen} — ${cty}`);
      continue;
    }

    const m = ung[0];
    khop++;
    daKhop.add(m.id);

    // Các năm đã đóng phí
    const namDaDong: number[] = [];
    for (let i = C.traTu; i <= C.traDen; i++) {
      if (o(r, i)) namDaDong.push(NAM_DAU + (i - C.traTu));
    }

    const loai = o(r, C.loaiHoiVien) || "Hội viên";
    const ghiChu = o(r, C.ghiChu);
    const namGiaNhap = Number(o(r, C.namGiaNhap)) || 0;
    const soNv = Number(o(r, C.soNhanVien).replace(/[^\d]/g, "")) || 0;

    const { capBac, doanhNghiepLon } = xepHangHoiVien({
      memberType: loai,
      hoiRole: null,
      note: ghiChu,
      headcount: soNv,
    });

    const moiNhat = namDaDong.length ? Math.max(...namDaDong) : 0;
    if (moiNhat < namNay) soChuaDongPhi++;

    // KHÔNG tự động đánh dấu rời hội.
    // Ban Chủ nhiệm đã chốt: chưa đóng phí không có nghĩa là rời hội — hồ sơ và
    // doanh nghiệp của họ vẫn giữ nguyên và vẫn hiển thị bình thường, chỉ khác
    // ở chỗ người đã đóng phí được ưu tiên xếp lên trên.
    // Muốn đánh dấu ai thật sự rời hội thì làm tay ở trang quản trị hội viên.

    if (!GHI) continue;

    await prisma.member.update({
      where: { id: m.id },
      data: {
        memberType: loai,
        headcount: soNv > 0 ? String(soNv) : undefined,
        note: ghiChu || undefined,
        capBac,
        doanhNghiepLon,
        ...(namGiaNhap >= 1990 && namGiaNhap <= namNay
          ? { joinedAt: new Date(namGiaNhap, 0, 1) }
          : {}),
      },
    });

    // Ghi nhận hội phí từng năm (bỏ qua năm đã có bản ghi)
    for (const nam of namDaDong) {
      await prisma.feePayment
        .create({ data: { memberId: m.id, year: nam, note: "Nhập từ sheet Chi hội" } })
        .catch(() => null);
    }
  }

  console.log(
    `Khớp ${khop} · không khớp ${khongKhop} · chưa đóng phí ${namNay}: ${soChuaDongPhi} (vẫn hiển thị bình thường, chỉ xếp sau người đã đóng)`
  );
  if (chuaKhop.length) {
    console.log("\nChưa khớp được (cần đối chiếu tay):");
    for (const t of chuaKhop.slice(0, 20)) console.log("  ·", t);
    if (chuaKhop.length > 20) console.log(`  … và ${chuaKhop.length - 20} dòng nữa`);
  }

  // Hội viên có trong hệ thống nhưng KHÔNG còn trong sheet mới
  const thua = members.filter((m) => !daKhop.has(m.id));
  if (thua.length) {
    console.log(`\n${thua.length} hồ sơ trong hệ thống không có trong sheet mới:`);
    for (const m of thua.slice(0, 15)) console.log(`  · ${m.code} ${m.company}`);
    if (thua.length > 15) console.log(`  … và ${thua.length - 15} hồ sơ nữa`);
  }

  if (!GHI) console.log('\nChạy lại với "-- --ghi" để lưu.');
  await prisma.$disconnect();
})();
