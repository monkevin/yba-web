import type { Metadata } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

/**
 * Hai bộ chữ, mỗi bộ một việc.
 *
 * `next/font` tải font về máy chủ lúc dựng bản rồi phục vụ từ chính tên miền
 * này — không gọi ra Google lúc người xem mở trang. Nhờ vậy trang không bị
 * "nhảy chữ" lúc font về, và không lộ ai đang xem web cho bên thứ ba.
 *
 * `subsets: ["vietnamese"]` là BẮT BUỘC — thiếu là dấu tiếng Việt rơi về font
 * dự phòng, chữ có dấu và chữ không dấu lệch nhau trông rất xấu.
 */
const chuNoiDung = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noi-dung",
  display: "swap",
});

/** Chữ cho tiêu đề lớn — chân có chân, tạo cảm giác trang trọng. */
const chuTieuDe = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-tieu-de",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.fullName} — YBA Chợ Lớn`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.tagline,
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: SITE.name,
    url: SITE.url,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE.fullName} — ${SITE.slogan}`,
      },
    ],
  },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] },
  icons: { icon: "/logo-yba-cholon.png", apple: "/logo-yba-cholon.png" },
  // Chỉ cho phép lập chỉ mục khi chạy trên tên miền thật; bản chạy thử không lên
  // kết quả tìm kiếm được.
  robots:
    process.env.NODE_ENV === "production"
      ? { index: true, follow: true }
      : { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`h-full antialiased ${chuNoiDung.variable} ${chuTieuDe.variable}`}
    >
      <head>
        {/* Hiệu ứng hiện dần chạy bằng JavaScript. Máy nào tắt JavaScript thì
            các khối sẽ nằm im ở trạng thái mờ — tức là mất nội dung. Dòng dưới
            ép hiện lại đầy đủ cho đúng những máy đó. */}
        <noscript>
          <style>{`.hien-dan{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
