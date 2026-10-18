import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatDate } from "@/lib/format";
import { laHtml, locHtmlBaiViet } from "@/lib/html-an-toan";
import { prisma } from "@/lib/prisma";

const LOAI_LABEL: Record<string, string> = {
  TIN_TUC: "Tin tức",
  BAN_TIN: "Bản tin hội viên",
  THONG_BAO: "Thông báo",
};

async function napBai(slug: string) {
  return prisma.post.findFirst({
    where: { slug, published: true },
    include: { author: { select: { name: true } } },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await napBai(slug);
  if (!p) return { title: "Không tìm thấy bài viết" };
  return {
    title: p.title,
    description: p.excerpt ?? p.content.slice(0, 160),
    openGraph: { images: p.coverImage ? [p.coverImage] : undefined },
  };
}

export default async function ChiTietBai({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await napBai(slug);
  if (!p) notFound();

  prisma.post
    .update({ where: { id: p.id }, data: { views: { increment: 1 } } })
    .catch(() => {});

  const [khac, suKien] = await Promise.all([
    prisma.post.findMany({
      // Ưu tiên bài cùng chuyên mục, hết mới lấy bài mới nhất
      where: {
        published: true,
        id: { not: p.id },
        ...(p.chuyenMuc ? { chuyenMuc: p.chuyenMuc } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    p.suKienSlug
      ? prisma.event.findFirst({
          where: { slug: p.suKienSlug, published: true },
          select: { slug: true, title: true, startAt: true, location: true },
        })
      : Promise.resolve(null),
  ]);

  return (
    <div className="wrap py-10">
      <nav className="text-sm text-slate-500">
        <Link href="/tin-tuc" className="hover:text-navy-700">
          Tin tức
        </Link>
        <span className="mx-1.5">›</span>
        <span>{LOAI_LABEL[p.type] ?? "Tin tức"}</span>
      </nav>

      <article className="mx-auto mt-6 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip">{LOAI_LABEL[p.type] ?? "Tin tức"}</span>
          {p.chuyenMuc && (
            <Link href={`/tin-tuc?muc=${encodeURIComponent(p.chuyenMuc)}`} className="chip-do">
              {p.chuyenMuc}
            </Link>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-navy-800 sm:text-4xl">
          {p.title}
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          {p.publishedAt ? formatDate(p.publishedAt) : formatDate(p.createdAt)}
          {p.author?.name ? ` · ${p.author.name}` : ""} · {p.views} lượt xem
        </p>

        {/* Tin lấy lại từ Hội cấp trên phải nói rõ ngay đầu bài, để người đọc
            không hiểu nhầm đây là chương trình do Chi hội Chợ Lớn tổ chức */}
        {p.nguon && (
          <p className="mt-4 rounded-xl bg-navy-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
            <strong className="font-semibold text-navy-800">Nguồn:</strong>{" "}
            {p.nguon}. Chi hội Chợ Lớn đăng lại để hội viên tiện theo dõi.
          </p>
        )}

        {p.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.coverImage}
            alt={p.title}
            className="ratio-16-9 mt-6 w-full rounded-2xl object-cover"
          />
        )}

        {p.excerpt && (
          <p className="mt-6 border-l-4 border-do-500 pl-4 text-lg font-medium leading-relaxed text-navy-700">
            {p.excerpt}
          </p>
        )}

        {laHtml(p.content) ? (
          // Bài nhập từ web cũ có sẵn thẻ HTML — lọc qua danh sách trắng hẹp
          // trong `locHtmlBaiViet` rồi mới cho hiện
          <div
            className="bai-viet mt-6 text-base leading-relaxed text-slate-700"
            dangerouslySetInnerHTML={{ __html: locHtmlBaiViet(p.content) }}
          />
        ) : (
          <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-700">
            {p.content.split(/\n{2,}/).map((doan, i) => (
              <p key={i} className="whitespace-pre-line">
                {doan}
              </p>
            ))}
          </div>
        )}

        {suKien && (
          <Link
            href={`/su-kien/${suKien.slug}`}
            className="tile mt-8 flex flex-wrap items-center justify-between gap-4 p-5"
          >
            <span>
              <span className="block text-xs font-bold uppercase tracking-wide text-do-600">
                Sự kiện liên quan
              </span>
              <span className="mt-1 block font-semibold text-navy-800">
                {suKien.title}
              </span>
              <span className="mt-0.5 block text-sm text-slate-500">
                {formatDate(suKien.startAt)}
                {suKien.location ? ` · ${suKien.location}` : ""}
              </span>
            </span>
            <span className="btn-ghost shrink-0">Xem hình ảnh sự kiện →</span>
          </Link>
        )}
      </article>

      {khac.length > 0 && (
        <section className="mx-auto mt-16 max-w-5xl">
          <h2 className="text-lg font-bold text-navy-800">Bài viết khác</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {khac.map((k) => (
              <Link key={k.slug} href={`/tin-tuc/${k.slug}`} className="tile p-5">
                {k.publishedAt && (
                  <p className="text-xs text-slate-500">
                    {formatDate(k.publishedAt)}
                  </p>
                )}
                <p className="mt-1 line-clamp-3 font-medium leading-snug text-navy-800">
                  {k.title}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-12">
        <Link href="/tin-tuc" className="btn-ghost">
          ← Về trang tin tức
        </Link>
      </div>
    </div>
  );
}
