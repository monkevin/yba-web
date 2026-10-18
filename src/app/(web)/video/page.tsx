import Link from "next/link";
import type { Metadata } from "next";
import VideoNhung from "@/components/web/VideoNhung";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import HienDan from "@/components/web/HienDan";

export const metadata: Metadata = {
  title: "Thư viện video",
  description: `Video hoạt động, sự kiện và chương trình của ${SITE.fullName}.`,
};

const KENH = "https://www.youtube.com/@yba-chihoicholon1808";

export default async function ThuVienVideo() {
  const videos = await prisma.video.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { order: "asc" }],
  });

  const [dau, ...conLai] = videos;

  return (
    <>
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-12 text-white">
        <div className="wrap">
          <p className="eyebrow text-do-300">Thư viện</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Video Chi hội
          </h1>
          <p className="mt-3 max-w-3xl text-white/85">
            Khoảnh khắc từ các chương trình, sự kiện và hoạt động cộng đồng của{" "}
            {SITE.fullName}.
          </p>
        </div>
      </section>

      <div className="wrap py-10">
        {videos.length === 0 ? (
          <div className="card px-4 py-14 text-center text-sm text-slate-500">
            Chưa có video nào.{" "}
            <a
              href={KENH}
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy-600 underline"
            >
              Xem kênh YouTube của Chi hội
            </a>
          </div>
        ) : (
          <>
            {/* Video mới nhất chiếm nửa trang — vào là xem được ngay */}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
              <div>
                <VideoNhung youtubeId={dau.youtubeId} title={dau.title} lon />
                <h2 className="mt-4 text-xl font-bold leading-snug text-navy-800">
                  {dau.title}
                </h2>
                {dau.summary && (
                  <p className="mt-2 leading-relaxed text-slate-600">
                    {dau.summary}
                  </p>
                )}
                {dau.publishedAt && (
                  <p className="mt-2 text-sm text-slate-500">
                    Đăng ngày {formatDate(dau.publishedAt)}
                  </p>
                )}
              </div>

              <div className="card p-5">
                <h2 className="font-bold text-navy-800">
                  Kênh YouTube YBA Chợ Lớn
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Toàn bộ video của Chi hội được đăng trên kênh chính thức. Anh
                  chị đăng ký kênh để nhận video mới nhất.
                </p>
                <a
                  href={KENH}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary mt-4 w-full"
                >
                  Mở kênh YouTube →
                </a>
                <p className="mt-4 border-t border-navy-100 pt-4 text-sm text-slate-500">
                  {videos.length} video đang hiển thị trên website.
                </p>
              </div>
            </div>

            {conLai.length > 0 && (
              <HienDan the="section" className="mt-14">
                <h2 className="text-lg font-bold text-navy-800">
                  Các video khác
                </h2>
                <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {conLai.map((v) => (
                    <div key={v.id}>
                      <VideoNhung youtubeId={v.youtubeId} title={v.title} />
                      <h3 className="mt-3 line-clamp-2 font-semibold leading-snug text-navy-800">
                        {v.title}
                      </h3>
                      {v.publishedAt && (
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(v.publishedAt)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </HienDan>
            )}
          </>
        )}

        <div className="mt-12">
          <Link href="/su-kien" className="btn-ghost">
            Xem hình ảnh sự kiện →
          </Link>
        </div>
      </div>
    </>
  );
}
