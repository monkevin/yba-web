import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LEADER_GROUPS, SITE } from "@/lib/site";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";

async function napNhanSu(slug: string) {
  return prisma.leader.findFirst({ where: { slug, active: true } });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await napNhanSu(slug);
  if (!p) return { title: "Không tìm thấy" };
  return {
    title: `${p.name} — ${p.title}`,
    description: `${p.name}, ${p.title} ${SITE.fullName}${p.company ? `, ${tenDoanhNghiep(p.company)}` : ""}.`,
    openGraph: { images: p.photo ? [p.photo] : undefined },
  };
}

export default async function ChiTietNhanSu({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await napNhanSu(slug);
  if (!p) notFound();

  const tenBan =
    LEADER_GROUPS.find((g) => g.key === p.group)?.label ?? "Ban chuyên môn";

  // Người cùng ban để đọc xong xem tiếp
  const cungBan = await prisma.leader.findMany({
    where: { active: true, group: p.group, id: { not: p.id } },
    orderBy: { order: "asc" },
    take: 4,
  });

  const ten = p.company ? tenDoanhNghiep(p.company) : null;

  return (
    <>
      <section className="bg-navy-900 py-10 text-white">
        <div className="wrap">
          <nav className="text-sm text-white/60">
            <Link href="/ban-chap-hanh" className="hover:text-white">
              Ban Chủ nhiệm
            </Link>
            <span className="mx-1.5">›</span>
            <span>{tenBan}</span>
          </nav>
        </div>
      </section>

      <div className="wrap py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
          <div className="overflow-hidden rounded-2xl bg-navy-100 shadow-sm ring-1 ring-navy-100">
            {p.photo ? (
              // Ảnh chân dung do Ban Truyền thông cung cấp
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.photo}
                alt={p.name}
                className="aspect-[3/4] w-full object-cover object-top"
              />
            ) : (
              <div className="grid aspect-[3/4] w-full place-items-center text-6xl font-bold text-navy-300">
                {p.name.trim().split(/\s+/).slice(-1)[0].charAt(0)}
              </div>
            )}
          </div>

          <div>
            <span className="chip-do">{tenBan}</span>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-navy-800 sm:text-4xl">
              {p.name}
            </h1>
            <p className="mt-2 text-lg font-semibold text-do-600">{p.title}</p>

            {(p.position || ten) && (
              <p className="mt-3 leading-relaxed text-slate-700">
                {[p.position, ten].filter(Boolean).join(" · ")}
              </p>
            )}
            {p.term && (
              <p className="mt-1 text-sm text-slate-500">Nhiệm kỳ {p.term}</p>
            )}

            {p.bio && (
              <div className="mt-6 space-y-3 leading-relaxed text-slate-700">
                {p.bio.split(/\n{2,}/).map((d, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {d}
                  </p>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {p.nhanHen && (
                <Link href={`/dat-lich?nguoi=${p.slug}`} className="btn-primary">
                  Đặt lịch gặp {p.name.split(/\s+/).slice(-1)[0]}
                </Link>
              )}
              {p.memberSlug && (
                <Link href={`/doanh-nghiep/${p.memberSlug}`} className="btn-ghost">
                  Xem hồ sơ doanh nghiệp →
                </Link>
              )}
            </div>

            {!p.bio && (
              <p className="mt-8 rounded-xl bg-navy-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
                Phần giới thiệu chi tiết đang được Ban Truyền thông cập nhật.
              </p>
            )}
          </div>
        </div>

        {cungBan.length > 0 && (
          <section className="mt-16">
            <h2 className="text-lg font-bold text-navy-800">
              Cùng {tenBan}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cungBan.map((k) => (
                <Link
                  key={k.id}
                  href={`/ban-chap-hanh/${k.slug}`}
                  className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-navy-100 transition hover:shadow-lg"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-navy-100">
                    {k.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={k.photo}
                        alt={k.name}
                        loading="lazy"
                        className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-4xl font-bold text-navy-300">
                        {k.name.trim().split(/\s+/).slice(-1)[0].charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-bold leading-snug text-navy-800">
                      {k.name}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-do-600">
                      {k.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12">
          <Link href="/ban-chap-hanh" className="btn-ghost">
            ← Về trang Ban Chủ nhiệm
          </Link>
        </div>
      </div>
    </>
  );
}
