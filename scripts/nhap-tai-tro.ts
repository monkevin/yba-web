/**
 * Nhập danh sách nhà tài trợ theo sự kiện từ file CSV của thư ký.
 * Cột: Sự kiện | Nhà tài trợ | Mức tài trợ | Giá trị ước tính | Trạng thái | Ghi chú
 *
 *   npm run nhap-tai-tro -- "C:\đường\dẫn\tai-tro.csv"
 *   npm run nhap-tai-tro -- "…\tai-tro.csv" --ghi
 */
import { readFileSync } from "fs";
import { prisma } from "../src/lib/prisma";
import { normalizeSearch } from "../src/lib/search";

const args = process.argv.slice(2);
const GHI = args.includes("--ghi");
const FILE = args.find((a) => !a.startsWith("--"));

/** Tách CSV có dấu phẩy và xuống dòng trong ô. */
function docCsv(text: string): string[][] {
  const rows: string[][] = [];
  let o: string[] = [];
  let cur = "";
  let nhay = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (nhay) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else nhay = false;
      } else cur += c;
    } else if (c === '"') nhay = true;
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

/** Chuẩn hoá tên mức tài trợ về đúng bậc Chi hội đang dùng. */
function chuanMuc(s: string): string {
  const t = s.toLowerCase();
  if (t.includes("kim cương")) return "Kim cương";
  if (t.includes("vàng")) return "Vàng";
  if (t.includes("bạc")) return "Bạc";
  if (t.includes("đồng hành")) return "Đồng hành";
  if (t.includes("đồng")) return "Đồng";
  return s.trim() || "Đồng hành";
}

(async () => {
  if (!FILE) {
    console.error('Thiếu đường dẫn file. Ví dụ: npm run nhap-tai-tro -- "C:\\tai-tro.csv"');
    process.exit(1);
  }

  const rows = docCsv(readFileSync(FILE, "utf8").replace(/^\uFEFF/, ""));
  const dong = rows.slice(1).filter((r) => r[0]?.trim() && r[1]?.trim());
  console.log(`Đọc được ${dong.length} dòng tài trợ.\n`);

  const [members, events] = await Promise.all([
    prisma.member.findMany({ select: { id: true, company: true } }),
    prisma.event.findMany({ select: { id: true, title: true } }),
  ]);

  const theoCty = new Map<string, string>();
  for (const m of members) {
    const k = normalizeSearch(m.company);
    if (!theoCty.has(k)) theoCty.set(k, m.id);
  }

  /** Khớp sự kiện theo tên: khớp đúng trước, sau đó khớp chứa nhau. */
  function timSuKien(ten: string): string | null {
    const k = normalizeSearch(ten);
    for (const e of events) if (normalizeSearch(e.title) === k) return e.id;
    for (const e of events) {
      const ke = normalizeSearch(e.title);
      if (ke.length > 12 && (k.includes(ke) || ke.includes(k.slice(0, 30)))) return e.id;
    }
    return null;
  }

  let khopHV = 0;
  let khopSK = 0;
  let them = 0;
  let tongTien = 0;
  const chuaKhopHV = new Set<string>();

  for (const r of dong) {
    const suKien = r[0].trim();
    const nhaTaiTro = r[1].trim();
    const mucTaiTro = chuanMuc(r[2] ?? "");
    const giaTri = Number((r[3] ?? "").replace(/[^\d]/g, "")) || 0;
    const trangThai = (r[4] ?? "").trim() || "Hoàn tất";
    const ghiChu = (r[5] ?? "").trim();

    const memberId = theoCty.get(normalizeSearch(nhaTaiTro)) ?? null;
    if (memberId) khopHV++;
    else chuaKhopHV.add(nhaTaiTro);

    const eventId = timSuKien(suKien);
    if (eventId) khopSK++;

    tongTien += giaTri;

    if (!GHI) continue;

    // Chạy lại nhiều lần không tạo bản ghi trùng
    const daCo = await prisma.taiTroSuKien.findFirst({
      where: { suKien, nhaTaiTro },
      select: { id: true },
    });
    if (daCo) continue;

    await prisma.taiTroSuKien.create({
      data: {
        suKien,
        eventId,
        nhaTaiTro,
        memberId,
        mucTaiTro,
        giaTri,
        // Ghi chú nhắc tới hiện vật thì coi phần giá trị là hiện vật
        hienKim: ghiChu ? 0 : giaTri,
        hienVat: ghiChu || null,
        trangThai,
        ghiChu: ghiChu || null,
      },
    });
    them++;
  }

  console.log(
    `Khớp hội viên ${khopHV}/${dong.length} · khớp sự kiện ${khopSK}/${dong.length}`
  );
  console.log(`Tổng giá trị tài trợ: ${(tongTien / 1_000_000).toLocaleString("vi")} triệu ₫`);
  if (chuaKhopHV.size) {
    console.log(`\n${chuaKhopHV.size} nhà tài trợ không phải hội viên (hoặc chưa khớp tên):`);
    for (const t of [...chuaKhopHV].slice(0, 15)) console.log("  ·", t);
  }
  if (GHI) console.log(`\nĐã thêm ${them} dòng tài trợ.`);
  else console.log('\nChạy lại kèm "--ghi" để lưu.');

  await prisma.$disconnect();
})();
