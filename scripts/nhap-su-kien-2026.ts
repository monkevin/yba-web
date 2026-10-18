/**
 * Nhập sự kiện 2026 từ thư mục ảnh của Ban Truyền thông.
 *
 * Mỗi thư mục con là một sự kiện, bên trong có ảnh và file `NỘI DUNG.docx`.
 * Chạy trước để rút chữ ra khỏi .docx:
 *     python scripts/doc-noi-dung-docx.py "SỰ KIỆN YBA CHỢ LỚN 2026"
 * Rồi:
 *     npm run nhap-su-kien-2026            → xem trước
 *     npm run nhap-su-kien-2026 -- --ghi   → chép ảnh + ghi vào CSDL
 *
 * Nguyên tắc:
 *  - GIỮ NGUYÊN VĂN bài viết của Ban Truyền thông, không viết lại.
 *  - Sự kiện KHÔNG tìm được ngày trong file thì vẫn nhập kèm đủ ảnh nhưng để
 *    `published = false`, chờ Ban Chủ nhiệm điền ngày rồi mới bật. Thà chưa
 *    hiện còn hơn hiện sai ngày.
 *  - Chạy lại an toàn: sự kiện đã có thì bỏ qua.
 */
import { copyFileSync, mkdirSync, readFileSync } from "fs";
import { basename, extname, join } from "path";
import { prisma } from "../src/lib/prisma";
import { normalizeSearch } from "../src/lib/search";
import { uniqueSlug } from "../src/lib/slug";

const GHI = process.argv.includes("--ghi");

type Muc = {
  ten: string;
  thuMuc: string;
  noiDung: string;
  taiTro: string;
  anh: string[];
  ngayDoan: { ngay: number; thang: number; nam: number | null } | null;
  diaDiem: string | null;
};

/**
 * Xếp mảng hoạt động theo tên sự kiện — dùng lại đúng các mảng đã có trên web
 * để bộ lọc ở /su-kien không sinh thêm mảng lạ.
 */
function mangHoatDong(ten: string): string {
  const t = normalizeSearch(ten);
  if (/tham doanh ngh?iep|khai xuan/.test(t)) return "Kết nối hội viên";
  if (/nhip cau|nha nhan ai|tien tram/.test(t)) return "Trách nhiệm cộng đồng";
  if (/pickleball|go-kart|go kart|hoi thao/.test(t)) return "Thể thao & gia đình";
  if (/vuon tam ket noi|ky ket|innoex|summit/.test(t)) return "Xúc tiến thương mại";
  if (/hop ban|kick off|hop mat/.test(t)) return "Kết nối hội viên";
  return "Kết nối hội viên";
}

/** Chương trình định kỳ, để các kỳ nhóm được với nhau. */
function chuongTrinh(ten: string): string | null {
  const t = normalizeSearch(ten);
  if (/coffee share/.test(t)) return "Coffee Share";
  if (/nhip cau doanh nhan/.test(t)) return "Nhịp cầu Doanh nhân";
  if (/vuon tam ket noi/.test(t)) return "Vươn Tầm Kết Nối";
  if (/tham doanh ngh?iep/.test(t)) return "Thăm doanh nghiệp hội viên";
  if (/year end party/.test(t)) return "Year End Party";
  if (/hop ban|kick off/.test(t)) return "Họp Ban Chủ nhiệm";
  return null;
}

/** Dòng đầu tiên đủ dài làm tóm tắt; bỏ dòng tiêu đề viết hoa toàn bộ. */
function tomTat(noiDung: string): string {
  const dong = noiDung
    .split("\n")
    .map((d) => d.trim())
    .filter((d) => d.length > 40);
  const cau = dong.find((d) => d !== d.toUpperCase()) ?? dong[0] ?? "";
  return cau.length > 260 ? cau.slice(0, 257).replace(/\s+\S*$/, "") + "…" : cau;
}

(async () => {
  const ds = JSON.parse(readFileSync("soat/su-kien-2026.json", "utf8")) as Muc[];

  let them = 0;
  let boQua = 0;
  let choNgay = 0;
  let tongAnh = 0;

  for (const m of ds) {
    const daCo = await prisma.event.findFirst({
      where: { title: m.ten },
      select: { id: true, slug: true },
    });
    if (daCo) {
      boQua++;
      console.log(`  (đã có) ${m.ten}`);
      continue;
    }

    // Năm để trống trong file thì lấy 2026 — cả thư mục là hoạt động năm 2026
    const coNgay = Boolean(m.ngayDoan);
    const startAt = m.ngayDoan
      ? new Date(m.ngayDoan.nam ?? 2026, m.ngayDoan.thang - 1, m.ngayDoan.ngay, 8, 0)
      : new Date(2026, 0, 1, 8, 0);

    const slug = await uniqueSlug(m.ten, async (s) =>
      Boolean(await prisma.event.findUnique({ where: { slug: s }, select: { id: true } }))
    );

    // Chép ảnh sang public/su-kien/<slug>/
    const duongAnh: string[] = [];
    if (GHI) {
      const dich = join("public", "su-kien", slug);
      mkdirSync(dich, { recursive: true });
      let i = 0;
      for (const a of m.anh) {
        i++;
        const duoi = extname(a).toLowerCase() || ".jpg";
        const ten = `${String(i).padStart(2, "0")}${duoi}`;
        try {
          copyFileSync(a, join(dich, ten));
          duongAnh.push(`/su-kien/${slug}/${ten}`);
        } catch {
          console.log(`      ! không chép được ${basename(a)}`);
        }
      }
    }
    tongAnh += GHI ? duongAnh.length : m.anh.length;

    console.log(
      `  + ${m.ten}\n` +
        `      ${coNgay ? startAt.toLocaleDateString("vi-VN") : "CHƯA RÕ NGÀY → để chưa hiện công khai"}` +
        ` · ${m.anh.length} ảnh · ${mangHoatDong(m.ten)}` +
        `${chuongTrinh(m.ten) ? ` · ${chuongTrinh(m.ten)}` : ""}` +
        `${m.diaDiem ? `\n      địa điểm: ${m.diaDiem.slice(0, 70)}` : ""}`
    );

    if (!coNgay) choNgay++;

    if (GHI) {
      await prisma.event.create({
        data: {
          slug,
          title: m.ten,
          summary: tomTat(m.noiDung),
          content: m.noiDung,
          coverImage: duongAnh[0] ?? null,
          gallery: duongAnh.length ? JSON.stringify(duongAnh) : null,
          startAt,
          location: m.diaDiem,
          seriesName: chuongTrinh(m.ten),
          activityGroup: mangHoatDong(m.ten),
          // Chưa rõ ngày thì chưa cho hiện — tránh đăng sai ngày lên web
          published: coNgay,
        },
      });
    }
    them++;
  }

  console.log(
    `\n${them} sự kiện ${GHI ? "đã nhập" : "sẽ nhập"} · ${boQua} đã có sẵn · ` +
      `${tongAnh} ảnh · ${choNgay} sự kiện chờ Ban Chủ nhiệm điền ngày.`
  );
  if (!GHI) console.log("Ghi thật: npm run nhap-su-kien-2026 -- --ghi\n");
  await prisma.$disconnect();
})();
