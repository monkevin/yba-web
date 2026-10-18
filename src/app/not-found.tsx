import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { docGiaoDien } from "@/lib/giao-dien";
import { SITE } from "@/lib/site";

/** Trang 404 chung — vẫn giữ nhận diện Chi hội và chỉ đường đi tiếp. */
export default async function KhongTimThay() {
  const [gd, user] = await Promise.all([docGiaoDien(), getCurrentUser()]);

  const LOI_RA = [
    { href: "/", label: "Trang chủ" },
    { href: "/doanh-nghiep", label: "Danh bạ doanh nghiệp" },
    { href: "/giao-thuong", label: "Chợ nhu cầu mua – bán" },
    { href: "/su-kien", label: "Sự kiện Chi hội" },
    { href: "/lien-he", label: "Liên hệ" },
  ];

  return (
    <>
      {/* not-found nằm ngoài layout (web) nên phải tự gắn thanh menu —
          thiếu nó, người vào từ link hỏng trên Zalo/Facebook mất điều hướng */}
      <SiteHeader userName={user?.name ?? null} logo={gd.logo} />
      <main className="flex-1">
        <section className="san-do luoi-ky-thuat relative overflow-hidden py-20 text-white">
          <div className="wrap text-center">
            <p className="text-6xl font-extrabold text-do-400">404</p>
            <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">
              Không tìm thấy trang này
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-white/85">
              Đường dẫn có thể đã đổi, hoặc nội dung đã được gỡ khỏi
              ybacholon.vn.
            </p>
          </div>
        </section>

        <section className="wrap py-14">
          <p className="text-center text-sm font-bold uppercase tracking-wide text-slate-500">
            Anh chị đang tìm gì?
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {LOI_RA.map((l) => (
              <Link key={l.href} href={l.href} className="btn-ghost">
                {l.label}
              </Link>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">
            Cần hỗ trợ, gọi hotline{" "}
            <a
              href={`tel:${gd.hotline.replace(/\./g, "")}`}
              className="font-semibold text-navy-700 hover:underline"
            >
              {gd.hotline}
            </a>
          </p>
        </section>
      </main>
      <SiteFooter gd={gd} />
    </>
  );
}
