import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Chặn máy tìm kiếm vào khu hội viên và khu quản trị — vừa tránh lộ dữ liệu nội
 * bộ trong kết quả tìm kiếm, vừa để Google dồn công sức quét vào phần công khai.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/tai-khoan",
        "/quan-tri",
        "/giao-dich",
        "/hoi-vien",
        "/bao-cao",
        "/mang-luoi",
        "/ngoi-nha",
        "/uu-dai",
        "/bang-hoat-dong",
        "/login",
        // Cổng QR khách của từng sự kiện — chỉ phát qua mã QR của Ban tổ chức
        "/sk/",
        "/api/",
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
