import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import LogoDoanhNghiep from "@/components/web/LogoDoanhNghiep";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { NHAN_THAM, thamCongKhai, dangMoDangKy, conCho } from "@/lib/tham-dn";
import { FormDangKyTham } from "../Forms";

export const dynamic = "force-dynamic";

async function napChuyen(slug: string) {
  return prisma.thamDoanhNghiep.findFirst({
    where: { slug, ...thamCongKhai() },
    include: {
      member: {
        select: {
          slug: true,
          company: true,
          logo: true,
          district: true,
          intro: true,
          name: true,
          position: true,
        },
      },
      _count: { select: { dangKy: { where: { status: { not: "HUY" } } } } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await napChuyen(slug);
  if (!t) return { title: "Không tìm thấy chuyến thăm" };
  return {
    title: t.tieuDe,
    description: t.gioiThieu ?? `Chuyến thăm ${tenDoanhNghiep(t.member.company)}.`,
  };
}

export default async function ChiTietTham({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [t, user] = await Promise.all([napChuyen(slug), getCurrentUser()]);
  if (!t) notFound();

  const n = NHAN_THAM[t.status] ?? NHAN_THAM.DE_XUAT;
  const con = conCho(t.soLuongToiDa, t._count.dangKy);
  const ngay = t.ngayToChuc ?? t.ngayMongMuon;
  const moDangKy = dangMoDangKy(t.status);

  const hoiVien = user?.memberId
    ? await prisma.member.findUnique({
        where: { id: user.memberId },
        select: { name: true, phone: true, company: true },
      })
    : null;

  return (
    <div className="wrap py-10">
      <nav className="text-sm text-slate-500">
        <Link href="/tham-doanh-nghiep" className="hover:text-navy-700">
          Đi thăm doanh nghiệp
        </Link>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <article>
          <span
            className={`inline-block rounded-full px-3 py-1 text-sm font-medium ring-1 ${n.lop}`}
          >
            {n.ten}
          </span>

          <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-navy-800 sm:text-3xl">
            {t.tieuDe}
          </h1>

          <Link
            href={`/doanh-nghiep/${t.member.slug}`}
            className="mt-5 flex items-start gap-4 rounded-2xl bg-navy-50 p-4 transition hover:bg-navy-100"
          >
            <LogoDoanhNghiep
              company={t.member.company}
              logo={t.member.logo}
              size="md"
            />
            <span className="min-w-0">
              <span className="block font-bold leading-snug text-navy-800">
                {tenDoanhNghiep(t.member.company)}
              </span>
              <span className="mt-0.5 block text-sm text-slate-600">
                {t.member.name}
                {t.member.position ? ` · ${t.member.position}` : ""}
              </span>
              <span className="mt-1 block text-xs font-semibold text-do-600">
                Xem hồ sơ doanh nghiệp →
              </span>
            </span>
          </Link>

          <dl className="mt-6 grid gap-px overflow-hidden rounded-2xl bg-navy-100 sm:grid-cols-3">
            {[
              ["Thời gian", ngay ? formatDate(ngay) : "Chi hội đang sắp xếp"],
              ["Địa điểm", t.diaChi ?? t.member.district ?? "—"],
              [
                "Đã đăng ký",
                `${t._count.dangKy} người${con !== null ? ` · còn ${con} chỗ` : ""}`,
              ],
            ].map(([k, v]) => (
              <div key={k} className="bg-white px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  {k}
                </dt>
                <dd className="mt-0.5 font-semibold text-navy-800">{v}</dd>
              </div>
            ))}
          </dl>

          {t.gioiThieu && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-navy-800">
                Về doanh nghiệp
              </h2>
              <div className="mt-3 space-y-3 leading-relaxed text-slate-700">
                {t.gioiThieu.split(/\n{2,}/).map((d, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {d}
                  </p>
                ))}
              </div>
            </section>
          )}

          {t.noiDungTham && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-navy-800">
                Đoàn sẽ được chia sẻ những gì
              </h2>
              <div className="mt-3 space-y-3 leading-relaxed text-slate-700">
                {t.noiDungTham.split(/\n{2,}/).map((d, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {d}
                  </p>
                ))}
              </div>
            </section>
          )}

          {t.ghiChuBCN && (
            <p className="mt-8 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
              <strong>Ghi chú từ Ban Chủ nhiệm:</strong> {t.ghiChuBCN}
            </p>
          )}
        </article>

        <aside className="lg:sticky lg:top-24">
          <div className="card p-5">
            <h2 className="font-bold text-navy-800">
              {moDangKy ? "Đăng ký đi cùng đoàn" : "Trạng thái chuyến đi"}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {n.moTa}
            </p>

            {moDangKy ? (
              <div className="mt-4">
                <FormDangKyTham
                  thamId={t.id}
                  conCho={con}
                  banDau={
                    hoiVien
                      ? {
                          name: hoiVien.name,
                          phone: hoiVien.phone ?? "",
                          company: tenDoanhNghiep(hoiVien.company),
                        }
                      : null
                  }
                />
              </div>
            ) : (
              <Link href="/tham-doanh-nghiep" className="btn-ghost mt-4 w-full">
                Xem các chuyến đang mở →
              </Link>
            )}
          </div>
        </aside>
      </div>

      <div className="mt-12">
        <Link href="/tham-doanh-nghiep" className="btn-ghost">
          ← Về danh sách chuyến thăm
        </Link>
      </div>
    </div>
  );
}
