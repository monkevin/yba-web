/**
 * Cào toàn bộ nội dung website CŨ ybacholon.vn (WordPress) qua REST API,
 * để đối chiếu xem web mới còn thiếu gì.
 *
 *   npm run cao-web-cu
 *
 * Kết quả ghi ra `soat/web-cu/` dạng JSON + một bản tóm tắt dễ đọc.
 * Chỉ ĐỌC, không sửa gì trên web cũ.
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const GOC = "https://ybacholon.vn/wp-json/wp/v2";
const RA = "soat/web-cu";

// Web cũ có chứng chỉ HTTPS hỏng ở tên miền www — chỉ đọc trang công khai nên
// bỏ kiểm chứng chỉ được. Đừng bê dòng này sang script nào có gửi dữ liệu đi.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

/** Bỏ thẻ HTML, trả về chữ thuần để đọc và so sánh. */
export function boThe(html: string): string {
  return (html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&#039;|&#39;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/&#8230;/g, "…")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function lay(duong: string): Promise<any[]> {
  const ra: any[] = [];
  for (let trang = 1; trang <= 20; trang++) {
    const r = await fetch(`${GOC}/${duong}?per_page=100&page=${trang}`, {
      headers: { "user-agent": "Mozilla/5.0 (doi-chieu-noi-dung-yba-cho-lon)" },
    });
    if (!r.ok) break;
    const d = (await r.json()) as any[];
    if (!Array.isArray(d) || d.length === 0) break;
    ra.push(...d);
    const tong = Number(r.headers.get("x-wp-totalpages") ?? "1");
    if (trang >= tong) break;
  }
  return ra;
}

(async () => {
  mkdirSync(RA, { recursive: true });

  const nhom: [string, string][] = [
    ["pages", "Trang tĩnh"],
    ["posts", "Bài viết / bản tin"],
    ["thanhvien-yba", "Hồ sơ thành viên"],
    ["event-ybacholon", "Sự kiện"],
  ];

  const tomTat: string[] = ["# Nội dung website cũ ybacholon.vn\n"];

  for (const [duong, ten] of nhom) {
    const d = await lay(duong);
    writeFileSync(join(RA, `${duong}.json`), JSON.stringify(d, null, 2));
    console.log(`${ten}: ${d.length} mục`);

    tomTat.push(`\n## ${ten} — ${d.length} mục\n`);
    for (const m of d) {
      const tieuDe = boThe(m.title?.rendered ?? "(không tên)");
      const noi = boThe(m.content?.rendered ?? "");
      tomTat.push(
        `\n### ${tieuDe}\n` +
          `- Địa chỉ cũ: ${m.link}\n` +
          `- Ngày: ${(m.date ?? "").slice(0, 10)}\n` +
          `- Dài: ${noi.length} ký tự\n` +
          (noi ? `\n${noi.slice(0, 4000)}${noi.length > 4000 ? "\n…(còn nữa)" : ""}\n` : "")
      );
    }
  }

  writeFileSync(join(RA, "toan-bo.md"), tomTat.join("\n"));
  console.log(`\n✓ Ghi vào ${RA}/toan-bo.md`);
})();
