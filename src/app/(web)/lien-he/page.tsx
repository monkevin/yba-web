import Link from "next/link";
import { docGiaoDien } from "@/lib/giao-dien";
import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import FormLienHe from "./Form";

/* Mô tả meta đọc cấu hình động — đổi hotline ở /quan-tri/giao-dien là
   mô tả trên Google đổi theo, không lệch với nội dung trang */
export async function generateMetadata(): Promise<Metadata> {
  const gd = await docGiaoDien();
  return {
    title: "Liên hệ",
    description: `Liên hệ ${SITE.fullName} — hotline ${gd.hotline}, email ${gd.email}.`,
  };
}

export default async function LienHe() {
  const gd = await docGiaoDien();
  return (
    <>
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-12 text-white">
        <div className="wrap">
          <p className="eyebrow text-do-300">Kết nối</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Liên hệ Chi hội
          </h1>
          <p className="mt-3 max-w-2xl text-white/85">
            Ban Chủ nhiệm {SITE.fullName} luôn sẵn sàng trao đổi về hợp tác, tài
            trợ, xúc tiến thương mại và gia nhập Hội.
          </p>
        </div>
      </section>

      <section className="wrap mt-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="font-bold text-navy-800">Thông tin liên hệ</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-slate-500">Hotline</dt>
                  <dd className="mt-0.5">
                    <a
                      href={`tel:${gd.hotline.replace(/\./g, "")}`}
                      className="text-lg font-bold text-navy-700 hover:underline"
                    >
                      {gd.hotline}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd className="mt-0.5 break-all">
                    <a
                      href={`mailto:${gd.email}`}
                      className="font-semibold text-navy-700 hover:underline"
                    >
                      {gd.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Địa chỉ</dt>
                  <dd className="mt-0.5 leading-relaxed text-slate-700">
                    {gd.diaChi}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Khu vực hoạt động</dt>
                  <dd className="mt-0.5 leading-relaxed text-slate-700">
                    {SITE.areas.join(" · ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Fanpage</dt>
                  <dd className="mt-1 flex flex-col gap-1.5">
                    <a
                      href={gd.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-navy-700 hover:underline"
                    >
                      facebook.com/ybacholon — Chi hội Chợ Lớn
                    </a>
                    <a
                      href={gd.facebookHoi}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-navy-700 hover:underline"
                    >
                      facebook.com/YBAHCMC — Hội Doanh nhân trẻ TP.HCM
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="card p-6">
              <h2 className="font-bold text-navy-800">Anh chị đang cần gì?</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  { href: "/dang-ky-hoi-vien", label: "Gia nhập Chi hội → Đăng ký hội viên" },
                  { href: "/giao-thuong", label: "Tìm đối tác mua bán → Chợ nhu cầu" },
                  { href: "/doanh-nghiep", label: "Tìm doanh nghiệp hội viên → Danh bạ" },
                  { href: "/ban-chap-hanh", label: "Gặp Ban Chủ nhiệm → Nhân sự Chi hội" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-navy-600 hover:text-do-600 hover:underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <FormLienHe />
        </div>
      </section>
    </>
  );
}
