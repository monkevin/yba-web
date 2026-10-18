import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ListingCard from "@/components/web/ListingCard";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { LOAI_TIN, LOAI_TIN_LABEL, conLaiNgay } from "@/lib/listing";
import { prisma } from "@/lib/prisma";
import { publicListing } from "@/lib/public";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import QuanTam from "./QuanTam";

async function napTin(slug: string) {
  return prisma.listing.findFirst({
    where: { slug, ...publicListing() },
    include: {
      category: { select: { name: true, slug: true, icon: true } },
      member: {
        select: {
          id: true,
          slug: true,
          company: true,
          name: true,
          position: true,
          logo: true,
          intro: true,
          phone: true,
          email: true,
          district: true,
          website: true,
        },
      },
      _count: { select: { contacts: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const l = await napTin(slug);
  if (!l) return { title: "Không tìm thấy tin" };
  return {
    title: `${LOAI_TIN_LABEL[l.type]}: ${l.title}`,
    description: l.summary ?? l.description.slice(0, 160),
  };
}

export default async function ChiTietTin({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [l, user] = await Promise.all([napTin(slug), getCurrentUser()]);
  if (!l) notFound();

  // Đếm lượt xem — không chặn hiển thị nếu ghi lỗi
  prisma.listing
    .update({ where: { id: l.id }, data: { views: { increment: 1 } } })
    .catch(() => {});

  const canMua = l.type === LOAI_TIN.CAN_MUA;
  const anh: string[] = (() => {
    if (!l.images) return [];
    try {
      const a = JSON.parse(l.images);
      return Array.isArray(a) ? a.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  })();

  const conLai = conLaiNgay(l.expiresAt);
  const laTinCuaMinh = !!user?.memberId && user.memberId === l.member.id;

  const daQuanTam = user?.memberId
    ? !!(await prisma.listingContact.findFirst({
        where: { listingId: l.id, memberId: user.memberId },
        select: { id: true },
      }))
    : false;

  const tinKhac = await prisma.listing.findMany({
    where: {
      ...publicListing(),
      id: { not: l.id },
      ...(l.categoryId ? { categoryId: l.categoryId } : { type: l.type }),
    },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      slug: true,
      type: true,
      title: true,
      summary: true,
      priceText: true,
      location: true,
      images: true,
      createdAt: true,
      category: { select: { name: true, icon: true } },
      member: { select: { slug: true, company: true, logo: true } },
    },
  });

  return (
    <div className="wrap py-10">
      <nav className="text-sm text-slate-500">
        <Link href="/giao-thuong" className="hover:text-navy-700">
          Chợ nhu cầu
        </Link>
        <span className="mx-1.5">›</span>
        <Link
          href={`/giao-thuong?loai=${l.type}`}
          className="hover:text-navy-700"
        >
          {LOAI_TIN_LABEL[l.type]}
        </Link>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        {/* ── Nội dung tin ───────────────────────────────────────── */}
        <article>
          {/* Nhãn loại tin đi liền tên doanh nghiệp — đọc một dòng là biết ai
              đang cần mua / chào bán, không phải kéo xuống tìm */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold uppercase tracking-wide text-white ${
                canMua ? "bg-navy-600" : "bg-do-600"
              }`}
            >
              {LOAI_TIN_LABEL[l.type]}
            </span>
            <Link
              href={`/doanh-nghiep/${l.member.slug}`}
              className="text-lg font-bold text-navy-800 hover:text-do-600"
            >
              {tenDoanhNghiep(l.member.company)}
            </Link>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {l.category && (
              <Link href={`/giao-thuong?nganh=${l.category.slug}`} className="chip">
                {l.category.icon ? `${l.category.icon} ` : ""}
                {l.category.name}
              </Link>
            )}
            {l.pinned && <span className="chip-do">📌 Tin nổi bật</span>}
          </div>

          <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-navy-800 sm:text-3xl">
            {l.title}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Đăng ngày {formatDate(l.createdAt)} · {l.views} lượt xem
            {l._count.contacts > 0 && ` · ${l._count.contacts} người quan tâm`}
          </p>

          {anh.length > 0 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {anh.map((a, i) => (
                // Ảnh do hội viên tải lên
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={a}
                  src={a}
                  alt={`${l.title} — ảnh ${i + 1}`}
                  className={`w-full rounded-xl object-cover ring-1 ring-navy-100 ${
                    i === 0 && anh.length > 1 ? "sm:col-span-2 ratio-16-9" : "ratio-3-2"
                  }`}
                />
              ))}
            </div>
          )}

          <dl className="mt-6 grid gap-px overflow-hidden rounded-2xl bg-navy-100 sm:grid-cols-3">
            {[
              ["Giá", l.priceText ?? "Thoả thuận"],
              ["Số lượng", l.quantity ?? "—"],
              ["Khu vực", l.location ?? l.member.district ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="bg-white px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-slate-500">{k}</dt>
                <dd className="mt-0.5 font-semibold text-navy-800">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 space-y-4 leading-relaxed text-slate-700">
            {l.description.split(/\n{2,}/).map((doan, i) => (
              <p key={i} className="whitespace-pre-line">
                {doan}
              </p>
            ))}
          </div>

          {conLai !== null && conLai <= 14 && conLai >= 0 && (
            <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Tin này còn hiển thị {conLai} ngày nữa.
            </p>
          )}
        </article>

        {/* ── Doanh nghiệp đăng tin ──────────────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Doanh nghiệp đăng tin
            </p>

            <Link
              href={`/doanh-nghiep/${l.member.slug}`}
              className="mt-3 flex items-start gap-3"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-navy-50 ring-1 ring-navy-100">
                {l.member.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.member.logo}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <span className="text-lg font-bold text-navy-300">
                    {tenDoanhNghiep(l.member.company).charAt(0)}
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold leading-snug text-navy-800">
                  {tenDoanhNghiep(l.member.company)}
                </span>
                <span className="mt-0.5 block text-sm text-slate-500">
                  {l.member.name}
                  {l.member.position ? ` · ${l.member.position}` : ""}
                </span>
              </span>
            </Link>

            {user ? (
              <dl className="mt-4 space-y-2.5 border-t border-navy-100 pt-4 text-sm">
                {l.member.phone && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Điện thoại</dt>
                    <dd>
                      <a
                        href={`tel:${l.member.phone}`}
                        className="font-semibold text-navy-700 hover:underline"
                      >
                        {l.member.phone}
                      </a>
                    </dd>
                  </div>
                )}
                {l.member.email && (
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-slate-500">Email</dt>
                    <dd className="break-all">
                      <a
                        href={`mailto:${l.member.email}`}
                        className="font-semibold text-navy-700 hover:underline"
                      >
                        {l.member.email}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            ) : null}

            <div className="mt-5">
              <QuanTam
                listingId={l.id}
                slug={l.slug}
                daDangNhap={!!user}
                laTinCuaMinh={laTinCuaMinh}
                daQuanTam={daQuanTam}
              />
            </div>

            <Link
              href={`/doanh-nghiep/${l.member.slug}`}
              className="btn-ghost mt-3 w-full"
            >
              Xem hồ sơ doanh nghiệp
            </Link>
          </div>

          <div className="card p-5 text-sm leading-relaxed text-slate-600">
            <p className="font-semibold text-navy-800">Lưu ý khi giao dịch</p>
            <p className="mt-2">
              Chi hội cung cấp nơi kết nối, không đứng ra bảo lãnh giao dịch. Anh
              chị vui lòng tự kiểm tra thông tin và ký hợp đồng rõ ràng với đối
              tác.
            </p>
          </div>
        </aside>
      </div>

      {tinKhac.length > 0 && (
        <section className="mt-16">
          <h2 className="text-lg font-bold text-navy-800">Tin liên quan</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {tinKhac.map((t) => (
              <ListingCard key={t.slug} l={t} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-12">
        <Link href="/giao-thuong" className="btn-ghost">
          ← Về chợ nhu cầu
        </Link>
      </div>
    </div>
  );
}
