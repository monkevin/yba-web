/**
 * Nhúng dòng thời gian một fanpage bằng Facebook Page Plugin.
 * Không cần app id hay đăng nhập — chỉ là iframe công khai của Facebook.
 *
 * Lưu ý: một số trình chặn quảng cáo chặn iframe Facebook — khi đó khối này
 * trống, nên bên ngoài luôn phải kèm liên kết mở thẳng fanpage.
 */
import { SITE } from "@/lib/site";

export default function FanpageNhung({
  href = SITE.social.facebook,
  tieuDe = "Fanpage YBA Chợ Lớn",
  cao = 600,
}: {
  href?: string;
  tieuDe?: string;
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
      // Ảnh bìa + tên trang đè lên nhau khi trang không có ảnh bìa chuẩn —
      // ẩn hẳn phần bìa cho ổn định trên mọi fanpage
      hide_cover: "true",
      adapt_container_width: "true",
      show_facepile: "false",
    }).toString();

  return (
    <div className="flex justify-center bg-slate-50">
      <iframe
        src={src}
        width={500}
        height={cao}
        style={{ border: "none", overflow: "hidden", maxWidth: "100%" }}
        scrolling="no"
        allow="encrypted-media"
        loading="lazy"
        title={tieuDe}
      />
    </div>
  );
}
