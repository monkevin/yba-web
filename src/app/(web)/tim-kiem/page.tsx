import Link from "next/link";
import type { Metadata } from "next";
import { timKiemToanWeb } from "@/lib/tim-kiem";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tìm kiếm",
  description: `Tìm doanh nghiệp hội viên, nhu cầu mua bán, sự kiện, tin tức và hoạt động của ${SITE.fullName}.`,
  // Trang kết quả không nên vào chỉ mục Google
  robots: { index: false },
};

/** Vài gợi ý để người mới vào biết có thể tìm được những gì. */
const GOI_Y = [
  "bao bì",
  "in ấn",
  "nhà hàng",
  "xây dựng",
  "cần mua",
  "pickleball",
  "Coffee Share",
  "Nhịp Cầu Doanh Nhân",
];

export default async function TimKiem({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const { soKetQua, nhom } = await timKiemToanWeb(q);

  return (
    <>
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-10 text-white">
        <div className="wrap">
          <p className="eyebrow text-do-300">Tìm trên toàn trang</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            Tìm kiếm
          </h1>

          <form action="/tim-kiem" className="mt-5 max-w-2xl">
            <div className="flex gap-2">
              <input
                name="q"
                defaultValue={q}
                autoFocus
                placeholder="Tên doanh nghiệp, ngành nghề, sản phẩm, sự kiện…"
                // Phải khai nền trắng: Tailwind đặt nền ô nhập là trong suốt,
                // để mặc định thì chữ navy nằm trên nền navy của khối này và
                // người gõ không thấy mình đang gõ gì.
                className="min-h-12 w-full rounded-xl border-0 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-do-400"
                aria-label="Từ khoá tìm kiếm"
              />
              <button className="min-h-12 shrink-0 rounded-xl bg-do-600 px-6 font-semibold transition hover:bg-do-700">
                Tìm
              </button>
            </div>
            <p className="mt-2.5 text-sm text-white/70">
              Gõ có dấu hay không dấu đều được. Tìm cùng lúc trong doanh nghiệp
              hội viên, chợ nhu cầu, sự kiện, lịch hoạt động, tin tức, video và
              Ban Chủ nhiệm.
            </p>
          </form>
        </div>
      </section>

      <div className="wrap py-10">
        {!q ? (
          <div>
            <p className="text-slate-600">Thử tìm một trong các từ khoá sau:</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {GOI_Y.map((g) => (
                <Link
                  key={g}
                  href={`/tim-kiem?q=${encodeURIComponent(g)}`}
                  className="chip hover:bg-navy-100"
                >
                  {g}
                </Link>
              ))}
            </div>
          </div>
        ) : soKetQua === 0 ? (
          <div className="card px-4 py-14 text-center">
            <p className="text-lg font-semibold text-navy-800">
              Không tìm thấy kết quả nào cho “{q}”
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
              Thử từ khoá ngắn hơn, hoặc dùng tên ngành nghề thay vì tên đầy đủ
              của doanh nghiệp. Cũng có thể hỏi trợ lý AI của Chi hội.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href="/hoi-ai" className="btn-primary">
                Hỏi trợ lý AI →
              </Link>
              <Link href="/doanh-nghiep" className="btn-ghost">
                Xem danh bạ doanh nghiệp
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500">
              Tìm thấy <strong className="text-navy-800">{soKetQua}</strong> kết
              quả cho “{q}”
            </p>

            <div className="mt-6 space-y-8">
              {nhom.map((n) => (
                <section key={n.ten}>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-100 pb-2">
                    <h2 className="text-lg font-bold text-navy-800">
                      <span aria-hidden="true">{n.icon}</span> {n.ten}
                      <span className="ml-2 text-sm font-medium text-slate-400">
                        {n.muc.length}
                      </span>
                    </h2>
                    {n.tatCa && (
                      <Link
                        href={n.tatCa}
                        className="text-sm font-semibold text-do-600 hover:underline"
                      >
                        Xem tất cả →
                      </Link>
                    )}
                  </div>

                  <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                    {n.muc.map((m) => (
                      <li key={m.href + m.tieuDe}>
                        <Link href={m.href} className="tile flex h-full gap-3 p-4">
                          <span
                            aria-hidden="true"
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-navy-50 text-lg"
                          >
                            {m.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold leading-snug text-navy-800">
                              {m.tieuDe}
                            </span>
                            {m.phu && (
                              <span className="mt-0.5 block truncate text-xs text-slate-500">
                                {m.phu}
                              </span>
                            )}
                            {m.moTa && (
                              <span className="mt-1.5 line-clamp-2 block text-sm leading-relaxed text-slate-600">
                                {m.moTa}
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <div className="card mt-10 flex flex-wrap items-center justify-between gap-4 p-5">
              <p className="text-sm leading-relaxed text-slate-600">
                Chưa thấy thứ cần tìm? Trợ lý AI của Chi hội có thể trả lời bằng
                câu hỏi thường ngày.
              </p>
              <Link href={`/hoi-ai?q=${encodeURIComponent(q)}`} className="btn-primary">
                Hỏi trợ lý AI →
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
