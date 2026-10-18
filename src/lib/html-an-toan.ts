/**
 * Lọc HTML bài viết trước khi đưa ra trang.
 *
 * Bài nhập từ website cũ có sẵn thẻ HTML (đoạn văn, danh sách, ảnh trong bài).
 * Muốn hiện đúng thì phải cho trình duyệt đọc HTML, mà cho đọc HTML thô thì ai
 * sửa được bài cũng chèn được thẻ lạ. Nên ở đây dựng DANH SÁCH TRẮNG rất hẹp:
 * chỉ đúng những thẻ cần để trình bày một bài báo, mọi thứ khác bị bỏ.
 *
 * Cố ý KHÔNG dùng thư viện lọc HTML đầy đủ — danh sách trắng ngắn thế này đọc
 * hết được bằng mắt, và không phụ thuộc thêm gói bên ngoài.
 */

/** Thẻ được giữ lại. Không có `script`, `iframe`, `style`, `form`, `svg`. */
const THE_CHO_PHEP = new Set([
  "p", "br", "strong", "b", "em", "i", "u",
  "ul", "ol", "li",
  "h2", "h3", "h4",
  "blockquote", "figure", "figcaption",
  "a", "img",
]);

/** Ảnh chỉ được lấy từ chính máy chủ này — không nhúng ảnh từ tên miền lạ. */
function anhNoiBo(src: string): boolean {
  return src.startsWith("/") && !src.startsWith("//");
}

/** Liên kết chỉ nhận http(s), mailto, tel và đường dẫn nội bộ. */
function lienKetAnToan(href: string): boolean {
  return /^(https?:\/\/|mailto:|tel:|\/)/i.test(href);
}

export function locHtmlBaiViet(html: string): string {
  return (
    html
      // Bỏ hẳn phần thân của các thẻ nguy hiểm, không chỉ bỏ thẻ mở
      .replace(/<(script|style|iframe|object|embed|form)[\s\S]*?<\/\1>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<\/?([a-zA-Z][\w-]*)([^>]*)>/g, (all, ten: string, thuoc: string) => {
        const t = ten.toLowerCase();
        if (!THE_CHO_PHEP.has(t)) return "";
        if (all.startsWith("</")) return `</${t}>`;

        if (t === "img") {
          const src = thuoc.match(/\ssrc=["']([^"']+)["']/)?.[1] ?? "";
          if (!anhNoiBo(src)) return "";
          const alt = (thuoc.match(/\salt=["']([^"']*)["']/)?.[1] ?? "")
            .replace(/["<>]/g, "");
          return `<img src="${src}" alt="${alt}" loading="lazy">`;
        }

        if (t === "a") {
          const href = thuoc.match(/\shref=["']([^"']+)["']/)?.[1] ?? "";
          if (!lienKetAnToan(href)) return "<span>";
          const ngoai = /^https?:\/\//i.test(href);
          return `<a href="${href.replace(/["<>]/g, "")}"${
            ngoai ? ' target="_blank" rel="noopener noreferrer nofollow"' : ""
          }>`;
        }

        // Các thẻ còn lại: giữ thẻ, bỏ sạch thuộc tính (kể cả onclick, style)
        return `<${t}>`;
      })
      .replace(/<p>\s*<\/p>/g, "")
      .trim()
  );
}

/** Nội dung có phải HTML không — bài admin tự gõ thì là chữ thuần. */
export function laHtml(s: string): boolean {
  return /<(p|div|ul|ol|h[2-4]|img|br)\b/i.test(s);
}
