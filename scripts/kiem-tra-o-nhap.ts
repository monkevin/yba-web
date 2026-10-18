/**
 * Bắt lỗi "gõ vào ô mà không thấy chữ".
 *
 * Tailwind đặt nền ô nhập là TRONG SUỐT. Ô nào khai màu chữ tối mà quên khai
 * nền, đặt trên khối nền tối, thì chữ chìm hẳn — người dùng tưởng ô hỏng.
 * Lỗi này mắt thường soi từng trang rất dễ sót nên để máy quét mã nguồn.
 *
 *   npm run test:onhap
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

/** Liệt kê mọi tệp .tsx trong một thư mục, đi sâu vào thư mục con. */
function moiTepTsx(thuMuc: string): string[] {
  const ra: string[] = [];
  for (const m of readdirSync(thuMuc, { withFileTypes: true })) {
    const d = join(thuMuc, m.name);
    if (m.isDirectory()) ra.push(...moiTepTsx(d));
    else if (m.name.endsWith(".tsx")) ra.push(d);
  }
  return ra;
}

let dat = 0;
let hong = 0;

function kiem(ten: string, dung: boolean, chiTiet = "") {
  if (dung) {
    dat++;
    console.log(`  PASS  ${ten}`);
  } else {
    hong++;
    console.log(`  FAIL  ${ten}${chiTiet ? ` — ${chiTiet}` : ""}`);
  }
}

/** Lấy mọi thẻ input/textarea/select cùng chuỗi className của nó. */
function oNhapTrong(ma: string): { the: string; lop: string; dong: number }[] {
  const ra: { the: string; lop: string; dong: number }[] = [];
  // [^>] đã bao cả xuống dòng nên không cần cờ /s (cờ đó cần ES2018 trở lên)
  const re = /<(input|textarea|select)\b([^>]*)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(ma))) {
    const thuoc = m[2];
    const lop = thuoc.match(/className=\{?["'`]([^"'`]*)["'`]/)?.[1] ?? "";
    ra.push({ the: m[1], lop, dong: ma.slice(0, m.index).split("\n").length });
  }
  return ra;
}

const TEP = moiTepTsx("src");

console.log("── Ô nhập phải có nền rõ ràng ──");

for (const t of TEP) {
  const ma = readFileSync(t, "utf8");
  for (const o of oNhapTrong(ma)) {
    // Ô dùng lớp dùng chung `.inp` đã có bg-white sẵn — bỏ qua
    if (/\binp\b/.test(o.lop)) continue;

    const coMauChu = /\btext-(navy|slate|do)-[5-9]\d\d\b/.test(o.lop);
    const coNen = /\bbg-[a-z]/.test(o.lop);
    if (coMauChu && !coNen) {
      kiem(
        `${t}:${o.dong} <${o.the}> khai màu chữ tối nhưng không khai nền`,
        false,
        o.lop.slice(0, 70)
      );
    }
  }
}

if (hong === 0) console.log("  PASS  không ô nhập nào thiếu nền");

console.log(
  `\n${hong === 0 ? `Tất cả ${Math.max(dat, 1)} phép kiểm đều đạt.` : `${dat} đạt · ${hong} HỎNG.`}`
);
if (hong) process.exit(1);
