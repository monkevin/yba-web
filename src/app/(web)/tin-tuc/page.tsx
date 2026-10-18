import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import FanpageNhung from "@/components/web/FanpageNhung";
import Pagination from "@/components/web/Pagination";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import HienDan from "@/components/web/HienDan";

const MOI_TRANG = 12;

const LOAI: { key: string; label: string; value: string }[] = [
  { key: "", label: "Tất cả", value: "" },
  { key: "tin-tuc", label: "Tin tức", value: "TIN_TUC" },
  { key: "ban-tin", label: "Bản tin hội viên", value: "BAN_TIN" },
  { key: "thong-bao", label: "Thông báo", value: "THONG_BAO" },
];

export const metadata: Metadata = {
  title: "Tin tức & bản tin",
  description: `Tin hoạt động, bản tin hội viên và thông báo từ Ban Chủ nhiệm ${SITE.fullName}.`,
};

export default async function TinTuc({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const loaiKey = typeof sp.loai === "string" ? sp.loai : "";
  const loai = LOAI.find((l) => l.key === loaiKey) ?? LOAI[0];
  const trang = Math.max(1, Number(sp.trang ?? 1) || 1);

  const chuyenMuc = typeof sp.muc === "string" ? sp.muc.trim() : "";

  const where: Prisma.PostWhereInput = { published: true };
  if (loai.value) where.type = loai.value;
  if (chuyenMuc) where.chuyenMuc = chuyenMuc;

  // Chuyên mục lấy thẳng từ dữ liệu, không khai cứng — thêm bài chuyên mục mới
  // là bộ lọc tự có thêm mục, không phải sửa mã nguồn
  const cacMuc = await prisma.post.groupBy({
    by: ["chuyenMuc"],
    where: { published: true, chuyenMuc: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { chuyenMuc: "desc" } },
  });

  const [tong, bai, noiBat] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (trang - 1) * MOI_TRANG,
      take: MOI_TRANG,
    }),
    trang === 1 && !loai.value && !chuyenMuc
      ? prisma.post.findFirst({
          where: { published: true, featured: true },
          orderBy: { publishedAt: "desc" },
        })
      : Promise.resolve(null),
  ]);

  const soTrang = Math.max(1, Math.ceil(tong / MOI_TRANG));
  const duongDan = (p: number) => {
    const t = new URLSearchParams();
    if (loai.key) t.set("loai", loai.key);
    if (chuyenMuc) t.set("muc", chuyenMuc);
    if (p > 1) t.set("trang", String(p));
    const s = t.toString();
    return s ? `/tin-tuc?${s}` : "/tin-tuc";
  };
  const duongDanMuc = (m: string) => {
    const t = new URLSearchParams();
    if (loai.key) t.set("loai", loai.key);
    if (m) t.set("muc", m);
    const s = t.toString();
    return s ? `/tin-tuc?${s}` : "/tin-tuc";
  };

  return (
    <>
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-12 text-white">
        <div className="wrap">
          <p className="eyebrow text-do-300">Bản tin</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Tin tức &amp; thông báo
          </h1>
          <p className="mt-3 max-w-3xl text-white/85">
            Tin hoạt động của Chi hội, bản tin hội viên và các thông báo chính
            thức từ Ban Chủ nhiệm.
          </p>
        </div>
      </section>

      <HienDan the="section" className="wrap mt-8">
        <div className="flex flex-wrap gap-2">
          {LOAI.map((l) => (
            <Link
              key={l.key}
              href={l.key ? `/tin-tuc?loai=${l.key}` : "/tin-tuc"}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                l.key === loai.key
                  ? "bg-navy-600 text-white"
                  : "bg-navy-50 text-navy-700 hover:bg-navy-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {cacMuc.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Chuyên mục:</span>
            <Link
              href={duongDanMuc("")}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                !chuyenMuc
                  ? "bg-do-600 font-semibold text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tất cả
            </Link>
            {cacMuc.map((m) => (
              <Link
                key={m.chuyenMuc}
                href={duongDanMuc(m.chuyenMuc!)}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  chuyenMuc === m.chuyenMuc
                    ? "bg-do-600 font-semibold text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {m.chuyenMuc}{" "}
                <span className="opacity-60">{m._count._all}</span>
              </Link>
            ))}
          </div>
        )}
      </HienDan>

      {bai.length === 0 ? (
        <HienDan the="section" className="wrap py-10">
          {/* Fanpage nhúng trực tiếp — bài đăng Facebook mới nhất hiện ngay
              tại đây, nên trang tin tức không bao giờ trống */}
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <div className="card overflow-hidden">
              <div className="border-b border-navy-100 px-5 py-4">
                <h2 className="font-bold text-navy-800">
                  Tin từ fanpage YBA Chợ Lớn
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Cập nhật trực tiếp từ trang Facebook chính thức của Chi hội.
                </p>
              </div>
              <FanpageNhung />
              <div className="border-t border-navy-100 px-5 py-3">
                <a
                  href={SITE.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-navy-600 hover:text-do-600"
                >
                  Mở fanpage YBA Chợ Lớn →
                </a>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="border-b border-navy-100 px-5 py-4">
                <h2 className="font-bold text-navy-800">
                  Tin từ Hội Doanh nhân trẻ TP.HCM
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Hoạt động của Hội — tổ chức cấp trên của Chi hội.
                </p>
              </div>
              <FanpageNhung
                href={SITE.social.facebookHoi}
                tieuDe="Fanpage Hội Doanh nhân trẻ TP.HCM"
              />
              <div className="border-t border-navy-100 px-5 py-3">
                <a
                  href={SITE.social.facebookHoi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-navy-600 hover:text-do-600"
                >
                  Mở fanpage YBA TP.HCM →
                </a>
              </div>
            </div>
          </div>

          <div className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <h2 className="font-bold text-navy-800">
                📰 Bài viết trên website đang được chuẩn bị
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Ban Truyền thông sẽ đăng tin hoạt động của Chi hội tại đây.
                Trong lúc chờ, anh chị xem hình ảnh các sự kiện đã tổ chức.
              </p>
            </div>
            <Link href="/su-kien" className="btn-primary shrink-0">
              Xem sự kiện Chi hội
            </Link>
          </div>
        </HienDan>
      ) : (
        <HienDan the="section" className="wrap mt-8">
          {noiBat && (
            <Link
              href={`/tin-tuc/${noiBat.slug}`}
              className="tile mb-6 grid gap-0 sm:grid-cols-2"
            >
              {noiBat.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={noiBat.coverImage}
                  alt={noiBat.title}
                  className="h-full min-h-56 w-full object-cover"
                />
              ) : (
                <div className="grid min-h-56 w-full place-items-center bg-navy-100 text-5xl">
                  📰
                </div>
              )}
              <div className="flex flex-col justify-center p-6 sm:p-8">
                <span className="chip-do w-fit">Tin nổi bật</span>
                <h2 className="mt-3 text-xl font-bold leading-snug text-navy-800 sm:text-2xl">
                  {noiBat.title}
                </h2>
                {noiBat.excerpt && (
                  <p className="mt-2 line-clamp-3 leading-relaxed text-slate-600">
                    {noiBat.excerpt}
                  </p>
                )}
                {noiBat.publishedAt && (
                  <p className="mt-3 text-sm text-slate-500">
                    {formatDate(noiBat.publishedAt)}
                  </p>
                )}
              </div>
            </Link>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bai.map((p) => (
              <Link key={p.slug} href={`/tin-tuc/${p.slug}`} className="tile flex flex-col">
                {p.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.coverImage}
                    alt={p.title}
                    loading="lazy"
                    className="ratio-3-2 w-full object-cover"
                  />
                ) : (
                  <div className="ratio-3-2 grid w-full place-items-center bg-navy-100 text-4xl">
                    📰
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    {p.chuyenMuc && (
                      <span className="font-semibold text-do-600">
                        {p.chuyenMuc}
                      </span>
                    )}
                    {p.publishedAt && <span>{formatDate(p.publishedAt)}</span>}
                  </div>
                  <h2 className="mt-1 line-clamp-2 font-semibold leading-snug text-navy-800">
                    {p.title}
                  </h2>
                  {p.excerpt && (
                    <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {p.excerpt}
                    </p>
                  )}
                  {/* Ghi nguồn ngay trên thẻ để không ai nhầm tin của Hội cấp
                      trên thành hoạt động do Chi hội tổ chức */}
                  {p.nguon && (
                    <p className="mt-auto pt-3 text-xs text-slate-400">
                      Nguồn: {p.nguon}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <Pagination page={trang} pages={soTrang} href={duongDan} />
        </HienDan>
      )}
    </>
  );
}
