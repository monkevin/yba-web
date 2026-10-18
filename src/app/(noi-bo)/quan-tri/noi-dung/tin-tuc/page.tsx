import { requireQuyen } from "@/lib/auth";
import { QUYEN } from "@/lib/quyen";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { NutXoaBai } from "../Forms";

const LOAI_LABEL: Record<string, string> = {
  TIN_TUC: "Tin tức",
  BAN_TIN: "Bản tin",
  THONG_BAO: "Thông báo",
};

export default async function QuanTriTinTuc() {
  await requireQuyen(QUYEN.NOI_DUNG_VIET);

  const bai = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  const daCongBo = bai.filter((b) => b.published).length;

  return (
    <div>
      <PageHeader
        title="Tin tức & bản tin"
        subtitle={`${bai.length} bài · ${daCongBo} đã công bố`}
        action={
          <div className="flex gap-2">
            <Link href="/tin-tuc" className="btn-ghost">
              Xem trang công khai
            </Link>
            <Link href="/quan-tri/noi-dung/tin-tuc/moi" className="btn-primary">
              + Viết bài mới
            </Link>
          </div>
        }
      />

      {bai.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="text-4xl">📰</span>
          <h2 className="mt-3 font-bold text-navy-800">Chưa có bài viết nào</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
            Viết bài đầu tiên để trang tin tức của Chi hội có nội dung.
          </p>
          <Link href="/quan-tri/noi-dung/tin-tuc/moi" className="btn-primary mt-6">
            Viết bài mới
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {bai.map((b) => (
            <li key={b.id} className="card flex flex-wrap items-start gap-4 p-4">
              <div className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-navy-50">
                {b.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.coverImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl opacity-50">📰</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                      b.published
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-slate-100 text-slate-600 ring-slate-200"
                    }`}
                  >
                    {b.published ? "Đã công bố" : "Bản nháp"}
                  </span>
                  <span className="chip">{LOAI_LABEL[b.type] ?? b.type}</span>
                  {b.featured && <span className="chip-do">Tin nổi bật</span>}
                </div>

                <Link
                  href={`/quan-tri/noi-dung/tin-tuc/${b.id}`}
                  className="mt-1.5 block font-semibold leading-snug text-navy-800 hover:text-do-600"
                >
                  {b.title}
                </Link>

                <p className="mt-1 text-xs text-slate-500">
                  {b.publishedAt
                    ? `Công bố ${formatDate(b.publishedAt)}`
                    : `Tạo ${formatDate(b.createdAt)}`}
                  {b.author?.name ? ` · ${b.author.name}` : ""} · {b.views} lượt xem
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/quan-tri/noi-dung/tin-tuc/${b.id}`}
                  className="btn-ghost py-1.5"
                >
                  Sửa
                </Link>
                <NutXoaBai id={b.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
