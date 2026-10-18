import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { docGiaoDien } from "@/lib/giao-dien";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import FormDatLich from "./FormDatLich";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Đặt lịch gặp Ban Chủ nhiệm",
  description: `Hội viên và doanh nhân quan tâm có thể đề nghị một buổi gặp trực tiếp với Ban Chủ nhiệm ${SITE.fullName}.`,
};

export default async function DatLich({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const gd = await docGiaoDien();
  const sp = await searchParams;
  const chonSan = typeof sp.nguoi === "string" ? sp.nguoi : undefined;

  const [ds, user] = await Promise.all([
    prisma.leader.findMany({
      where: { active: true, nhanHen: true, slug: { not: null } },
      orderBy: [{ order: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        title: true,
        photo: true,
        group: true,
      },
    }),
    getCurrentUser(),
  ]);

  // Hội viên đã đăng nhập thì điền sẵn thông tin cho đỡ phải gõ lại
  const hoiVien = user?.memberId
    ? await prisma.member.findUnique({
        where: { id: user.memberId },
        select: { name: true, phone: true, company: true, email: true },
      })
    : null;

  const bcn = ds.filter((n) => n.group === "BAN_CHU_NHIEM");

  return (
    <>
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-14 text-white">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-do-600/25 blur-2xl"
        />
        <div className="wrap relative">
          <p className="eyebrow text-do-300">Gặp gỡ &amp; kết nối</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Đặt lịch gặp Ban Chủ nhiệm
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-white/85">
            Ban Chủ nhiệm luôn sẵn lòng dành thời gian cho hội viên và doanh nhân
            quan tâm tới Chi hội — để nghe khó khăn, gợi mở cơ hội hợp tác, hoặc
            đơn giản là làm quen.
          </p>
        </div>
      </section>

      <div className="wrap py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start">
          <div>
            <h2 className="text-xl font-bold text-navy-800">
              Anh/chị có thể gặp ai
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Bấm vào từng người để xem giới thiệu, hoặc để Ban Chủ nhiệm sắp
              xếp người phù hợp nhất với nội dung của anh/chị.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {bcn.map((n) => (
                <Link
                  key={n.id}
                  href={`/ban-chap-hanh/${n.slug}`}
                  className="tile flex items-center gap-4 p-4"
                >
                  {n.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={n.photo}
                      alt={n.name}
                      loading="lazy"
                      className="h-16 w-16 shrink-0 rounded-full object-cover object-top ring-1 ring-navy-100"
                    />
                  ) : (
                    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-navy-100 text-xl font-bold text-navy-400">
                      {n.name.trim().split(/\s+/).slice(-1)[0].charAt(0)}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block font-semibold leading-snug text-navy-800">
                      {n.name}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-do-600">
                      {n.title}
                    </span>
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-navy-50 p-5">
              <h3 className="font-bold text-navy-800">Sau khi gửi đề nghị</h3>
              <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-slate-700">
                {[
                  "Ban Chủ nhiệm nhận đề nghị và xem nội dung anh/chị trao đổi.",
                  "Chi hội gọi lại để thống nhất thời gian và địa điểm cụ thể.",
                  "Buổi gặp diễn ra trực tiếp tại văn phòng Chi hội hoặc trực tuyến.",
                ].map((b, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-do-600 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 border-t border-navy-100 pt-3 text-sm text-slate-600">
                Cần gấp? Gọi hotline{" "}
                <a
                  href={`tel:${gd.hotline.replace(/\./g, "")}`}
                  className="font-semibold text-navy-700 hover:underline"
                >
                  {gd.hotline}
                </a>
              </p>
            </div>
          </div>

          <div className="card p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold text-navy-800">Gửi đề nghị gặp</h2>
            <p className="mb-5 mt-1 text-sm text-slate-600">
              Điền thông tin, Chi hội sẽ liên hệ lại trong 1–2 ngày làm việc.
            </p>
            <FormDatLich
              danhSach={ds.map((n) => ({
                slug: n.slug!,
                name: n.name,
                title: n.title,
              }))}
              chonSan={chonSan}
              banDau={
                hoiVien
                  ? {
                      name: hoiVien.name,
                      phone: hoiVien.phone ?? "",
                      company: hoiVien.company,
                      email: hoiVien.email ?? "",
                    }
                  : null
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
