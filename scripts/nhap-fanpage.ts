/**
 * Nhập hàng loạt fanpage Facebook của hội viên từ file CSV.
 *
 * File chỉ cần 2 cột, có tiêu đề ở dòng đầu:
 *     Mã HV hoặc Tên doanh nghiệp , Fanpage
 *     HV0033                      , facebook.com/giayvinhtien
 *
 * Nhận cả link fanpage đầy đủ lẫn dạng rút gọn. Link không phải trang Facebook
 * (nhóm, bài viết lẻ, sự kiện) bị bỏ qua và báo ra để sửa tay.
 *
 *   npm run nhap-fanpage -- "C:\đường\dẫn\fanpage.csv"          → xem trước
 *   npm run nhap-fanpage -- "C:\đường\dẫn\fanpage.csv" --ghi    → ghi thật
 */
import { readFileSync } from "fs";
import { chuanFanpage } from "../src/components/web/FanpageHoiVien";
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

(async () => {
  if (!FILE) {
    console.error(
      'Thiếu đường dẫn file. Ví dụ:\n  npm run nhap-fanpage -- "D:\\fanpage.csv"'
    );
    process.exit(1);
  }

  const rows = docCsv(readFileSync(FILE, "utf8")).filter((r) =>
    r.some((o) => o.trim())
  );
  if (rows.length < 2) {
    console.error("File không có dòng dữ liệu nào.");
    process.exit(1);
  }

  const members = await prisma.member.findMany({
    select: { id: true, code: true, company: true, facebook: true },
  });

  let khop = 0;
  let boQuaLink = 0;
  const khongTim: string[] = [];

  // Dòng đầu là tiêu đề cột
  for (const r of rows.slice(1)) {
    const khoa = (r[0] ?? "").trim();
    const link = (r[1] ?? "").trim();
    if (!khoa || !link) continue;

    const href = chuanFanpage(link);
    if (!href) {
      boQuaLink++;
      console.log(`  ⚠ Không phải fanpage, bỏ qua: ${khoa} → ${link}`);
      continue;
    }

    const k = normalizeSearch(khoa);
    const m =
      members.find((x) => x.code.toLowerCase() === khoa.toLowerCase()) ??
      members.find((x) => normalizeSearch(x.company) === k) ??
      members.find((x) => normalizeSearch(x.company).includes(k));

    if (!m) {
      khongTim.push(khoa);
      continue;
    }

    khop++;
    if (GHI) {
      await prisma.member.update({ where: { id: m.id }, data: { facebook: href } });
    } else {
      console.log(`  ${m.code} ${m.company.slice(0, 38)} → ${href}`);
    }
  }

  console.log(
    `\nKhớp ${khop} hội viên · ${boQuaLink} link không hợp lệ · ${khongTim.length} dòng không tìm thấy hội viên.`
  );
  if (khongTim.length) console.log("  Không tìm thấy: " + khongTim.join(", "));
  if (!GHI) console.log("\nGhi thật: thêm --ghi vào cuối lệnh.\n");
  else console.log("✓ Đã ghi. Fanpage hiện ngay ở cuối hồ sơ công khai.");

  await prisma.$disconnect();
})();
