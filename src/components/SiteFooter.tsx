import Link from "next/link";
import { SITE } from "@/lib/site";

const COT_KHAM_PHA: { href: string; label: string; prefetch?: false }[] = [
  { href: "/gioi-thieu", label: "Giới thiệu Chi hội" },
  { href: "/ban-chap-hanh", label: "Ban Chủ nhiệm" },
  { href: "/dat-lich", label: "Đặt lịch gặp Ban Chủ nhiệm" },
  { href: "/lich-hoat-dong", label: "Lịch hoạt động sắp tới" },
  { href: "/su-kien", label: "Sự kiện & chương trình" },
  { href: "/tham-doanh-nghiep", label: "Đi thăm doanh nghiệp" },
  { href: "/video", label: "Thư viện video" },
  { href: "/tin-tuc", label: "Tin tức" },
  { href: "/vinh-danh", label: "Vinh danh hội viên" },
  // Game cần đăng nhập: không nạp trước (khách bị chuyển sang /login)
  { href: "/ngoi-nha", label: "Ngôi nhà Chợ Lớn (hội viên)", prefetch: false },
  { href: "/huong-dan-dang-nhap", label: "Hướng dẫn đăng nhập" },
];

const COT_GIAO_THUONG = [
  { href: "/doanh-nghiep", label: "Danh bạ doanh nghiệp" },
  { href: "/giao-thuong?loai=CAN_BAN", label: "Nhu cầu bán" },
  { href: "/giao-thuong?loai=CAN_MUA", label: "Nhu cầu mua" },
  { href: "/xuc-tien-thuong-mai", label: "Chỉ số xúc tiến thương mại" },
  { href: "/tai-tro", label: "Đồng hành & tài trợ" },
  { href: "/who-am-i", label: "WHO AM I? — trắc nghiệm" },
  { href: "/dang-ky-hoi-vien", label: "Đăng ký hội viên" },
];

/** Biểu tượng Facebook vẽ bằng SVG — không phải tải thêm thư viện icon nào. */
function FacebookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 fill-current"
    >
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

export default function SiteFooter({
  gd,
}: {
  gd: {
    logo: string;
    hotline: string;
    email: string;
    diaChi: string;
    facebook: string;
    facebookHoi: string;
    slogan: string;
  };
}) {
  return (
    <footer className="san-do luoi-ky-thuat relative mt-20 overflow-hidden text-white/75">
      <div className="wrap py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gd.logo}
                alt={`Logo ${SITE.name}`}
                width={52}
                height={52}
                className="h-13 w-13 object-contain"
              />
              <span className="text-lg font-extrabold tracking-tight text-white">
                YBA CHỢ LỚN
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              {SITE.fullName}, trực thuộc {SITE.parent}. Thành lập năm{" "}
              {SITE.founded}.
            </p>
            <p className="mt-3 text-sm font-semibold text-do-300">
              {gd.slogan}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Khám phá
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {COT_KHAM_PHA.map((it) => (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    prefetch={it.prefetch}
                    className="text-white/75 hover:text-white"
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Giao thương
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {COT_GIAO_THUONG.map((it) => (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    className="text-white/75 hover:text-white"
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Liên hệ
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li>{gd.diaChi}</li>
              <li>
                Hotline:{" "}
                <a
                  href={`tel:${gd.hotline.replace(/\./g, "")}`}
                  className="text-white hover:underline"
                >
                  {gd.hotline}
                </a>
              </li>
              <li>
                Email:{" "}
                <a
                  href={`mailto:${gd.email}`}
                  className="text-white hover:underline"
                >
                  {gd.email}
                </a>
              </li>
              <li className="pt-1">
                <Link
                  href="/lien-he"
                  className="text-white underline hover:no-underline"
                >
                  Gửi tin nhắn cho Chi hội →
                </Link>
              </li>
            </ul>

            <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-white">
              Theo dõi
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href={gd.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-white/75 hover:text-white"
                >
                  <FacebookIcon />
                  Fanpage YBA Chợ Lớn
                </a>
              </li>
              <li>
                <a
                  href={gd.facebookHoi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-white/75 hover:text-white"
                >
                  <FacebookIcon />
                  Fanpage YBA HCM (Hội)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/15 pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.fullName}. {SITE.term}.
          </p>
          <p>Khu vực hoạt động: {SITE.areas.join(" · ")}</p>
        </div>
      </div>
    </footer>
  );
}
