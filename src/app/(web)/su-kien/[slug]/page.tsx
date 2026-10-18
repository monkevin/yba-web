import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ThuVienAnh from "@/components/web/ThuVienAnh";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import DangKyThamDu from "./DangKyThamDu";

async function napSuKien(slug: string) {
  return prisma.event.findFirst({
    where: { slug, published: true },
    include: { _count: { select: { registrations: true } } },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = await napSuKien(slug);
  if (!e) return { title: "Không tìm thấy sự kiện" };
  return {
    title: e.title,
    description:
      e.summary ??
      `${e.title} — hoạt động của ${SITE.fullName} ngày ${formatDate(e.startAt)}.`,
    openGraph: { images: e.coverImage ? [e.coverImage] : undefined },
  };
}

export default async function ChiTietSuKien({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e = await napSuKien(slug);
  if (!e) notFound();

  const anh: string[] = (() => {
    if (!e.gallery) return [];
    try {
      const a = JSON.parse(e.gallery);
      return Array.isArray(a) ? a.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  })();

  const sapDienRa = e.startAt.getTime() > Date.now();
  const conCho = e.capacity ? e.capacity - e._count.registrations : null;

  const [lienQuan, baiViet] = await Promise.all([
    prisma.event.findMany({
      where: {
        published: true,
        id: { not: e.id },
        ...(e.seriesName
          ? { seriesName: e.seriesName }
          : e.activityGroup
            ? { activityGroup: e.activityGroup }
            : {}),
      },
      orderBy: { startAt: "desc" },
      take: 3,
    }),
    // Bài viết đã gắn với sự kiện này — nối hai chiều với /tin-tuc
    prisma.post.findMany({
      where: { published: true, suKienSlug: e.slug },
      orderBy: { publishedAt: "desc" },
      select: { slug: true, title: true, excerpt: true, nguon: true },
      take: 3,
    }),
  ]);

  return (
    <>
      {/* Ảnh bìa lớn */}
      {e.coverImage ? (
        <div className="relative h-56 bg-navy-800 sm:h-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={e.coverImage}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-navy-800 to-navy-600" />
      )}

      <div className="wrap py-10">
        <nav className="text-sm text-slate-500">
          <Link href="/su-kien" className="hover:text-navy-700">
            Sự kiện
          </Link>
          {e.seriesName && (
            <>
              <span className="mx-1.5">›</span>
              <Link
                href={`/su-kien?chuongtrinh=${encodeURIComponent(e.seriesName)}`}
                className="hover:text-navy-700"
              >
                {e.seriesName}
              </Link>
            </>
          )}
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          <article>
            <div className="flex flex-wrap items-center gap-1.5">
              {sapDienRa && <span className="chip-do">Sắp diễn ra</span>}
              {e.seriesName && <span className="chip">{e.seriesName}</span>}
              {e.activityGroup && <span className="chip">{e.activityGroup}</span>}
            </div>

            <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-navy-800 sm:text-4xl">
              {e.title}
            </h1>

            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Thời gian</dt>
                <dd className="mt-0.5 font-semibold text-navy-800">
                  {formatDate(e.startAt)}
                  {e.endAt && ` – ${formatDate(e.endAt)}`}
                </dd>
              </div>
              {e.location && (
                <div>
                  <dt className="text-slate-500">Địa điểm</dt>
                  <dd className="mt-0.5 font-semibold text-navy-800">
                    {e.location}
                  </dd>
                </div>
              )}
            </dl>

            {e.content ? (
              <div className="mt-8 space-y-4 leading-relaxed text-slate-700">
                {e.content.split(/\n{2,}/).map((doan, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {doan}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-8 leading-relaxed text-slate-600">
                {e.summary
                  ? `${e.summary}. `
                  : ""}
                Hình ảnh hoạt động của {SITE.fullName} bên dưới.
              </p>
            )}

          </article>

          <aside className="space-y-4 lg:sticky lg:top-24">
            {e.allowSignup && sapDienRa ? (
              <DangKyThamDu eventId={e.id} conCho={conCho} />
            ) : (
              <div className="card p-5">
                <h2 className="font-bold text-navy-800">Tham gia cùng Chi hội</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {sapDienRa
                    ? "Sự kiện này không đăng ký qua web — liên hệ Ban Sự kiện để tham dự."
                    : "Sự kiện đã diễn ra. Trở thành hội viên để không bỏ lỡ các chương trình sắp tới."}
                </p>
                <Link href="/dang-ky-hoi-vien" className="btn-primary mt-4 w-full">
                  Đăng ký hội viên
                </Link>
                <Link href="/lien-he" className="btn-ghost mt-2 w-full">
                  Liên hệ Chi hội
                </Link>
              </div>
            )}
          </aside>
        </div>

        {/* Album chiếm trọn chiều ngang trang — ảnh sự kiện là thứ hội viên
            muốn xem nhất, nhét trong cột hẹp thì nhỏ xíu */}
        {anh.length > 0 && (
          <section className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-xl font-bold text-navy-800">
                Hình ảnh sự kiện
              </h2>
              <p className="text-sm text-slate-500">
                {anh.length} ảnh · bấm vào ảnh để xem toàn màn hình
              </p>
            </div>
            <div className="mt-5">
              <ThuVienAnh anh={anh} tieuDe={e.title} cot={3} />
            </div>
          </section>
        )}

        {baiViet.length > 0 && (
          <section className="mt-14">
            <h2 className="text-lg font-bold text-navy-800">
              Bài viết về sự kiện này
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {baiViet.map((b) => (
                <Link
                  key={b.slug}
                  href={`/tin-tuc/${b.slug}`}
                  className="tile flex gap-3 p-4"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-do-50 text-lg"
                  >
                    📰
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold leading-snug text-navy-800">
                      {b.title}
                    </span>
                    {b.excerpt && (
                      <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-slate-600">
                        {b.excerpt}
                      </span>
                    )}
                    {b.nguon && (
                      <span className="mt-1 block text-xs text-slate-400">
                        Nguồn: {b.nguon}
                      </span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {lienQuan.length > 0 && (
          <section className="mt-16">
            <h2 className="text-lg font-bold text-navy-800">
              {e.seriesName
                ? `Các kỳ khác của ${e.seriesName}`
                : "Hoạt động cùng mảng"}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {lienQuan.map((k) => (
                <Link key={k.slug} href={`/su-kien/${k.slug}`} className="tile">
                  {k.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={k.coverImage}
                      alt={k.title}
                      loading="lazy"
                      className="ratio-3-2 w-full object-cover"
                    />
                  ) : (
                    <div className="ratio-3-2 grid w-full place-items-center bg-navy-100 text-3xl">
                      📅
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-xs font-semibold text-do-600">
                      {formatDate(k.startAt)}
                    </p>
                    <p className="mt-1 line-clamp-2 font-medium leading-snug text-navy-800">
                      {k.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12">
          <Link href="/su-kien" className="btn-ghost">
            ← Về danh sách sự kiện
          </Link>
        </div>
      </div>
    </>
  );
}
