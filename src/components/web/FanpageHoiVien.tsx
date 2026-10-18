/**
 * Nhúng fanpage Facebook của một doanh nghiệp hội viên vào cuối bài giới thiệu.
 *
 * Khác `FanpageNhung` (dùng cho fanpage của Chi hội và của Hội): ở đây đường dẫn
 * do hội viên tự khai nên phải kiểm lại — chỉ nhận địa chỉ facebook.com thật,
 * còn lại thì không nhúng gì để tránh iframe rác.
 *
 * Trình chặn quảng cáo hay chặn iframe Facebook nên luôn kèm liên kết mở thẳng
 * fanpage bên dưới; người xem vẫn bấm sang được khi khối nhúng trống.
 */

/** Trả về địa chỉ fanpage đã chuẩn hoá, hoặc null nếu không phải fanpage. */
export function chuanFanpage(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
  if (host !== "facebook.com" && host !== "fb.com") return null;

  // Bỏ các đường dẫn không phải trang: bài viết lẻ, nhóm, hồ sơ cá nhân.
  // profile.php?id=… là trang CÁ NHÂN — Page Plugin không nhúng được, và cắt
  // query đi thì link thành vô nghĩa, nên loại hẳn.
  const duong = u.pathname.replace(/\/+$/, "");
  if (!duong || duong === "/") return null;
  if (/^\/(groups|events|share|watch|photo|reel|stories|profile\.php|permalink\.php)/i.test(duong)) {
    return null;
  }

  return `https://www.facebook.com${duong}`;
}

/** Tên hiển thị gọn của fanpage: lấy phần cuối đường dẫn. */
function tenGon(href: string): string {
  const cuoi = href.split("/").filter(Boolean).pop() ?? "";
  return decodeURIComponent(cuoi).replace(/-\d+$/, "").replace(/[-_.]+/g, " ");
}

export default function FanpageHoiVien({
  href,
  tenDoanhNghiep,
  cao = 520,
}: {
  href: string;
  tenDoanhNghiep: string;
  cao?: number;
}) {
  const src =
    "https://www.facebook.com/plugins/page.php?" +
    new URLSearchParams({
      href,
      tabs: "timeline",
      width: "500", // Facebook giới hạn tối đa 500
      height: String(cao),
      small_header: "true",
      hide_cover: "true",
      adapt_container_width: "true",
      show_facepile: "false",
    }).toString();

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-100 bg-navy-50 px-4 py-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-navy-800">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0 fill-[#1877F2]">
            <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
          </svg>
          Bài đăng mới nhất trên fanpage
        </span>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-sm font-semibold text-do-600 hover:underline"
        >
          Mở fanpage ↗
        </a>
      </div>

      <div className="flex justify-center bg-slate-50">
        <iframe
          src={src}
          width={500}
          height={cao}
          style={{ border: "none", overflow: "hidden", maxWidth: "100%" }}
          scrolling="no"
          allow="encrypted-media"
          loading="lazy"
          title={`Fanpage ${tenDoanhNghiep}`}
        />
      </div>

      <p className="border-t border-navy-100 px-4 py-2.5 text-xs leading-relaxed text-slate-500">
        Không thấy nội dung? Trình duyệt của bạn đang chặn khung Facebook — bấm{" "}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="font-medium text-navy-700 underline"
        >
          facebook.com/{tenGon(href)}
        </a>{" "}
        để xem trực tiếp.
      </p>
    </div>
  );
}
