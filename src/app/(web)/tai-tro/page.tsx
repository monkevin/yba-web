import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { formatShortVnd } from "@/lib/format";
import { docGiaoDien } from "@/lib/giao-dien";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import FormTaiTro from "./FormTaiTro";
import NhaTaiTro from "./NhaTaiTro";
import HienDan from "@/components/web/HienDan";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Đồng hành & tài trợ",
  description: `Các gói tài trợ cho chương trình cộng đồng và hoạt động câu lạc bộ của ${SITE.fullName}.`,
};

/** Số tiền dạng "100 triệu" cho nhà tài trợ dễ đọc. */
function trieu(n: number): string {
  if (n >= 1_000_000_000)
    return `${(n / 1_000_000_000).toFixed(1).replace(".0", "")} tỷ`;
  return `${Math.round(n / 1_000_000)} triệu`;
}

export default async function TaiTro({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const gd = await docGiaoDien();
  const sp = await searchParams;
  const chonSan = typeof sp.goi === "string" ? sp.goi : undefined;

  const [duAn, user] = await Promise.all([
    prisma.duAnTaiTro.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      include: {
        goi: {
          where: { active: true },
          orderBy: { order: "asc" },
        },
      },
    }),
    getCurrentUser(),
  ]);

  const hoiVien = user?.memberId
    ? await prisma.member.findUnique({
        where: { id: user.memberId },
        select: { name: true, phone: true, company: true, email: true },
      })
    : null;

  const tatCaGoi = duAn.flatMap((d) =>
    d.goi.map((g) => ({
      id: g.id,
      ten: g.ten,
      soTien: g.soTien,
      duAn: d.ten,
    }))
  );

  return (
    <>
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-16 text-white">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-do-600/25 blur-2xl"
        />
        <div className="wrap relative">
          <p className="eyebrow text-do-300">Đồng hành cùng Chi hội</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Cùng chúng tôi xây những điều để lại
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-white/85">
            Mỗi chương trình của Chi hội đều có địa chỉ cụ thể, có ngày hoàn
            thành và có người thụ hưởng thật. Nhà tài trợ được mời đồng hành từ
            đầu tới cuối, và toàn bộ đóng góp được công khai minh bạch.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#dang-ky" className="btn-cta">
              Đăng ký đồng hành
            </Link>
            <Link href="/lien-he" className="btn-cta-ghost">
              Trao đổi với Ban Chủ nhiệm
            </Link>
          </div>
        </div>
      </section>

      <div className="wrap py-12">
        {duAn.length === 0 ? (
          <div className="card px-4 py-14 text-center text-sm text-slate-500">
            Hiện chưa có chương trình nào đang kêu gọi tài trợ.
          </div>
        ) : (
          duAn.map((d) => (
            <HienDan the="section" key={d.id} className="mb-16">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-start">
                <div>
                  <span className="eyebrow">Chương trình</span>
                  <h2 className="section-title">{d.ten}</h2>
                  {d.tomTat && (
                    <p className="mt-3 text-base font-medium leading-relaxed text-navy-700">
                      {d.tomTat}
                    </p>
                  )}
                  {d.moTa && (
                    <div className="mt-4 space-y-3 leading-relaxed text-slate-700">
                      {d.moTa.split(/\n{2,}/).map((p, i) => (
                        <p key={i} className="whitespace-pre-line">
                          {p}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {(d.mucTieu > 0 || d.daGop > 0) && (
                  <div className="card p-5">
                    <h3 className="font-bold text-navy-800">Tiến độ huy động</h3>
                    <p className="mt-3 text-2xl font-extrabold text-do-700">
                      {formatShortVnd(d.daGop)} ₫
                    </p>
                    {d.mucTieu > 0 && (
                      <>
                        <p className="mt-1 text-sm text-slate-500">
                          trên mục tiêu {formatShortVnd(d.mucTieu)} ₫
                        </p>
                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-navy-100">
                          <div
                            className="h-full rounded-full bg-do-500"
                            style={{
                              width: `${Math.min(100, Math.round((d.daGop / d.mucTieu) * 100))}%`,
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {d.goi.length > 0 && (
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {d.goi.map((g) => (
                    <div
                      key={g.id}
                      className={`flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 transition hover:shadow-md ${
                        g.noiBat ? "ring-2 ring-do-400" : "ring-navy-100"
                      }`}
                    >
                      <div
                        className={`px-5 py-5 ${
                          g.noiBat ? "bg-do-600 text-white" : "bg-navy-800 text-white"
                        }`}
                      >
                        {g.noiBat && (
                          <span className="text-xs font-bold uppercase tracking-wide">
                            Được chọn nhiều nhất
                          </span>
                        )}
                        <p className="mt-0.5 text-lg font-bold">{g.ten}</p>
                        <p className="mt-1 text-2xl font-extrabold">
                          {trieu(g.soTien)}
                        </p>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        {g.quyenLoi && (
                          <ul className="space-y-2 text-sm">
                            {g.quyenLoi
                              .split(/\r?\n/)
                              .map((q) => q.trim())
                              .filter(Boolean)
                              .map((q, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="mt-0.5 shrink-0 text-emerald-600">
                                    ✓
                                  </span>
                                  <span className="leading-relaxed text-slate-700">
                                    {q}
                                  </span>
                                </li>
                              ))}
                          </ul>
                        )}
                        <Link
                          href={`#dang-ky`}
                          className={`mt-auto pt-5 text-sm font-semibold ${
                            g.noiBat ? "text-do-600" : "text-navy-600"
                          }`}
                        >
                          Chọn gói này →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </HienDan>
          ))
        )}

        {/* Vinh danh những doanh nghiệp đã đồng hành */}
        <NhaTaiTro />

        {/* Đăng ký */}
        <HienDan the="section" id="dang-ky" className="mt-16 scroll-mt-24">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start">
            <div>
              <span className="eyebrow">Đăng ký</span>
              <h2 className="section-title">Trở thành nhà tài trợ</h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                Anh/chị chọn một gói có sẵn hoặc tự đề xuất mức đóng góp phù hợp
                với doanh nghiệp mình. Ban Tài trợ sẽ liên hệ trong 1–2 ngày làm
                việc để trao đổi chi tiết và làm thủ tục chính thức.
              </p>

              <div className="mt-6 rounded-2xl bg-navy-50 p-5">
                <h3 className="font-bold text-navy-800">Cam kết minh bạch</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {[
                    "Mỗi chương trình có báo cáo thu chi gửi riêng cho nhà tài trợ.",
                    "Nhà tài trợ được mời tham dự trực tiếp các mốc quan trọng.",
                    "Website không thu tiền trực tuyến — mọi giao dịch qua tài khoản Chi hội.",
                  ].map((t, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-0.5 shrink-0 text-do-500">✓</span>
                      <span className="leading-relaxed text-slate-700">{t}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-navy-100 pt-3 text-sm text-slate-600">
                  Cần trao đổi trước? Gọi{" "}
                  <a
                    href={`tel:${gd.hotline.replace(/\./g, "")}`}
                    className="font-semibold text-navy-700 hover:underline"
                  >
                    {gd.hotline}
                  </a>
                </p>
              </div>
            </div>

            <div className="card p-6">
              <FormTaiTro
                goi={tatCaGoi}
                chonSan={chonSan}
                banDau={
                  hoiVien
                    ? {
                        name: hoiVien.name,
                        phone: hoiVien.phone ?? "",
                        company: tenDoanhNghiep(hoiVien.company),
                        email: hoiVien.email ?? "",
                      }
                    : null
                }
              />
            </div>
          </div>
        </HienDan>
      </div>
    </>
  );
}
