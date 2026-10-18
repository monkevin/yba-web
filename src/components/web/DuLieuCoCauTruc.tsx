import { SITE } from "@/lib/site";

/**
 * Dữ liệu có cấu trúc (JSON-LD) mô tả Chi hội cho Google. Nhờ đó khi ai đó tìm
 * "YBA Chợ Lớn", kết quả hiện kèm logo, địa chỉ, hotline và liên kết fanpage.
 */
export default function DuLieuCoCauTruc() {
  const duLieu = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.fullName,
    alternateName: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/logo-yba-cholon.png`,
    description: SITE.tagline,
    foundingDate: String(SITE.founded),
    email: SITE.email,
    telephone: SITE.hotline,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address,
      addressLocality: "TP. Hồ Chí Minh",
      addressCountry: "VN",
    },
    parentOrganization: {
      "@type": "Organization",
      name: SITE.parent,
      url: SITE.social.facebookHoi,
    },
    sameAs: [
      SITE.social.facebook,
      SITE.social.facebookHoi,
      SITE.social.youtube,
    ].filter(Boolean),
    areaServed: SITE.areas.map((a) => ({ "@type": "Place", name: a })),
  };

  return (
    <script
      type="application/ld+json"
      // Nội dung do chính mình dựng từ hằng số trong mã nguồn, không phải dữ liệu người dùng
      dangerouslySetInnerHTML={{ __html: JSON.stringify(duLieu) }}
    />
  );
}
