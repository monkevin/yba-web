import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireQuyen } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { QUYEN } from "@/lib/quyen";
import { FormThemVideo, FormSuaVideo, NutXoaVideo, NutNapYoutube } from "./Forms";

export default async function QuanTriVideo() {
  await requireQuyen(QUYEN.NOI_DUNG_VIET);

  const videos = await prisma.video.findMany({
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { order: "asc" }],
  });
  const dangHien = videos.filter((v) => v.published).length;

  return (
    <div>
      <PageHeader
        title="Video Chi hội"
        subtitle={`${videos.length} video · ${dangHien} đang hiện trên website`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/video" className="btn-ghost">
              Xem trang công khai
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-start">
        <div>
          <div className="mb-4">
            <NutNapYoutube />
          </div>

          {videos.length === 0 ? (
            <div className="card p-12 text-center">
              <span className="text-4xl">🎬</span>
              <h2 className="mt-3 font-bold text-navy-800">Chưa có video nào</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                Bấm &ldquo;Lấy video mới từ kênh&rdquo; để nạp tự động, hoặc dán
                đường dẫn YouTube ở ô bên cạnh.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {videos.map((v) => (
                <li key={v.id} className="card flex flex-wrap items-start gap-4 p-4">
                  {/* Ảnh đại diện do YouTube phát hành */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`}
                    alt=""
                    className="h-16 w-28 shrink-0 rounded-lg bg-navy-50 object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                          v.published
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-slate-100 text-slate-600 ring-slate-200"
                        }`}
                      >
                        {v.published ? "Đang hiện" : "Đang ẩn"}
                      </span>
                      {v.featured && <span className="chip-do">Ghim đầu</span>}
                    </div>

                    <a
                      href={`https://www.youtube.com/watch?v=${v.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 block font-semibold leading-snug text-navy-800 hover:text-do-600"
                    >
                      {v.title}
                    </a>
                    <p className="mt-1 text-xs text-slate-500">
                      {v.publishedAt ? formatDate(v.publishedAt) : "Chưa rõ ngày"}{" "}
                      · {v.youtubeId}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <FormSuaVideo
                      v={{
                        id: v.id,
                        youtubeId: v.youtubeId,
                        title: v.title,
                        summary: v.summary,
                        publishedAt: v.publishedAt,
                        featured: v.featured,
                        published: v.published,
                      }}
                    />
                    <NutXoaVideo id={v.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <FormThemVideo />
      </div>
    </div>
  );
}
