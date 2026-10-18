import Link from "next/link";

/**
 * Phân trang cho các trang danh sách công khai. `href(p)` do trang gọi tự dựng
 * để giữ nguyên mọi bộ lọc đang bật.
 */
export default function Pagination({
  page,
  pages,
  href,
}: {
  page: number;
  pages: number;
  href: (p: number) => string;
}) {
  if (pages <= 1) return null;

  // Hiện tối đa 5 số quanh trang hiện tại, luôn có trang đầu và trang cuối
  const quanh = new Set<number>([1, pages, page]);
  for (let d = 1; d <= 2; d++) {
    if (page - d >= 1) quanh.add(page - d);
    if (page + d <= pages) quanh.add(page + d);
  }
  const so = [...quanh].sort((a, b) => a - b);

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-center gap-1.5"
      aria-label="Phân trang"
    >
      {page > 1 && (
        <Link href={href(page - 1)} className="btn-ghost py-2">
          ← Trước
        </Link>
      )}

      {so.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && so[i - 1] !== p - 1 && (
            <span className="px-1 text-slate-400">…</span>
          )}
          {p === page ? (
            <span
              aria-current="page"
              className="grid h-10 w-10 place-items-center rounded-lg bg-navy-600 text-sm font-semibold text-white"
            >
              {p}
            </span>
          ) : (
            <Link
              href={href(p)}
              className="grid h-10 w-10 place-items-center rounded-lg text-sm font-medium text-slate-600 ring-1 ring-navy-100 transition hover:bg-navy-50 hover:text-navy-700"
            >
              {p}
            </Link>
          )}
        </span>
      ))}

      {page < pages && (
        <Link href={href(page + 1)} className="btn-ghost py-2">
          Sau →
        </Link>
      )}
    </nav>
  );
}
