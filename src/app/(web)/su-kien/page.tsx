import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Pagination from "@/components/web/Pagination";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import HienDan from "@/components/web/HienDan";

const MOI_TRANG = 18;

export const metadata: Metadata = {
  title: "Sự kiện & chương trình",
  description: `Coffee Share, Business & Library, Caravan xúc tiến thương mại, Pickleball và các hoạt động cộng đồng của ${SITE.fullName}.`,
};

export default async function SuKien({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const chuoi = (k: string) =>
    typeof sp[k] === "string" ? (sp[k] as string).trim() : "";

  const mang = chuoi("mang");
  const chuongTrinh = chuoi("chuongtrinh");
  const nam = chuoi("nam");
  const trang = Math.max(1, Number(sp.trang ?? 1) || 1);

  const where: Prisma.EventWhereInput = { published: true };
  if (mang) where.activityGroup = mang;
  if (chuongTrinh) where.seriesName = chuongTrinh;
  if (nam) {
    const y = Number(nam);
    where.startAt = { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31, 23, 59, 59) };
  }

  const [
    tong,
    dsSuKien,
    cacMang,
    cacChuongTrinh,
    cacNamRaw,
    sapToi,
    soChuyenTham,
    soGoiTaiTro,
    soDuAnTaiTro,
  ] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        orderBy: { startAt: "desc" },
        skip: (trang - 1) * MOI_TRANG,
        take: MOI_TRANG,
      }),
      prisma.event.groupBy({
        by: ["activityGroup"],
        where: { published: true, activityGroup: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { activityGroup: "desc" } },
      }),
      prisma.event.groupBy({
        by: ["seriesName"],
        where: { published: true, seriesName: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { seriesName: "desc" } },
      }),
      prisma.event.findMany({
        where: { published: true },
        select: { startAt: true },
      }),
      prisma.event.findMany({
        where: { published: true, startAt: { gte: new Date() } },
        orderBy: { startAt: "asc" },
        take: 1,
      }),
      // Chuyến đi thăm đang mở đăng ký — con số thật để mời gọi cho đúng
      prisma.thamDoanhNghiep.count({ where: { status: "DA_DUYET" } }),
      prisma.goiTaiTro.count({ where: { active: true } }),
      prisma.duAnTaiTro.count({ where: { active: true } }),
    ]);

  const cacNam = [...new Set(cacNamRaw.map((e) => e.startAt.getFullYear()))].sort(
    (a, b) => b - a
  );

  const soTrang = Math.max(1, Math.ceil(tong / MOI_TRANG));
  const duongDan = (p: number, ghiDe: Record<string, string> = {}) => {
    const t = new URLSearchParams();
    const gia = { mang, chuongtrinh: chuongTrinh, nam, ...ghiDe };
    for (const [k, v] of Object.entries(gia)) if (v) t.set(k, v);
    if (p > 1) t.set("trang", String(p));
    const s = t.toString();
    return s ? `/su-kien?${s}` : "/su-kien";
  };

  return (
    <>
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-12 text-white">
        <div className="wrap">
          <p className="eyebrow text-do-300">Hoạt động Chi hội</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Sự kiện &amp; chương trình
          </h1>
          <p className="mt-3 max-w-3xl text-white/85">
            Toàn bộ hoạt động {SITE.fullName} đã tổ chức: kết nối hội viên, xúc
            tiến thương mại, đào tạo, thể thao và các chương trình vì cộng đồng.
          </p>
          {sapToi.length > 0 && (
            <Link
              href={`/su-kien/${sapToi[0].slug}`}
              className="mt-6 inline-flex flex-wrap items-center gap-2 rounded-full bg-do-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-do-700"
            >
              Sắp diễn ra: {sapToi[0].title} · {formatDate(sapToi[0].startAt)} →
            </Link>
          )}
        </div>
      </section>

      {/* ── Hai chương trình hội viên tham gia trực tiếp được ────
          Đây là hai lời mời hành động, không phải mục lục — nên để thành hai
          tấm lớn có màu riêng, kèm con số thật đang mở để người xem thấy có
          việc để làm ngay. */}
      <HienDan the="section" className="wrap -mt-8">
        <div className="grid gap-5 md:grid-cols-2">
          {[
            {
              href: "/tham-doanh-nghiep",
              icon: "🏭",
              nhan: "Dành cho hội viên",
              ten: "Đi thăm doanh nghiệp hội viên",
              mo: "Mời Chi hội đến thăm doanh nghiệp mình, hoặc đăng ký đi cùng đoàn tới thăm hội viên khác.",
              nut: "Xem các chuyến đang mở",
              dem:
                soChuyenTham > 0
                  ? `${soChuyenTham} chuyến đang mở đăng ký`
                  : "Đang nhận đề xuất mời đoàn",
              nen: "from-navy-700 to-navy-900",
              vien: "ring-navy-200",
              chuNhan: "text-do-300",
            },
            {
              href: "/tai-tro",
              icon: "🤝",
              nhan: "Dành cho nhà đồng hành",
              ten: "Đồng hành & tài trợ",
              mo: "Các gói tài trợ cho chương trình cộng đồng như Nhịp Cầu Doanh Nhân và hoạt động câu lạc bộ.",
              nut: "Xem gói tài trợ",
              dem:
                soGoiTaiTro > 0
                  ? `${soGoiTaiTro} gói · ${soDuAnTaiTro} chương trình đang kêu gọi`
                  : "Đang cập nhật gói tài trợ",
              nen: "from-do-600 to-do-800",
              vien: "ring-do-200",
              chuNhan: "text-do-100",
            },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`group relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br ${c.nen} p-6 text-white shadow-lg ring-1 ${c.vien} transition hover:-translate-y-0.5 hover:shadow-xl sm:p-7`}
            >
              {/* Hai vòng tròn mờ làm nền cho đỡ phẳng */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/10"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-black/10"
              />

              <span className="relative flex items-center gap-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 text-3xl backdrop-blur-sm">
                  {c.icon}
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-widest ${c.chuNhan}`}
                >
                  {c.nhan}
                </span>
              </span>

              <span className="relative mt-4 block text-xl font-extrabold leading-snug sm:text-2xl">
                {c.ten}
              </span>
              <span className="relative mt-2 block leading-relaxed text-white/85">
                {c.mo}
              </span>

              <span className="relative mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                <span className="inline-flex min-h-11 items-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-navy-800 shadow-sm transition group-hover:bg-white/90">
                  {c.nut}
                  <span className="ml-1.5 transition group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/90">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-emerald-300"
                  />
                  {c.dem}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </HienDan>

      {/* ── Bộ lọc ────────────────────────────────────────────── */}
      <HienDan the="section" className="wrap mt-8 space-y-4">
        <Loc
          nhan="Mảng hoạt động"
          dangChon={mang}
          duongDanTatCa={duongDan(1, { mang: "" })}
          muc={cacMang.map((m) => ({
            nhan: m.activityGroup!,
            so: m._count._all,
            href: duongDan(1, { mang: m.activityGroup! }),
            chon: mang === m.activityGroup,
          }))}
        />
        <Loc
          nhan="Chương trình"
          dangChon={chuongTrinh}
          duongDanTatCa={duongDan(1, { chuongtrinh: "" })}
          muc={cacChuongTrinh.map((c) => ({
            nhan: c.seriesName!,
            so: c._count._all,
            href: duongDan(1, { chuongtrinh: c.seriesName! }),
            chon: chuongTrinh === c.seriesName,
          }))}
        />
        <Loc
          nhan="Năm"
          dangChon={nam}
          duongDanTatCa={duongDan(1, { nam: "" })}
          muc={cacNam.map((n) => ({
            nhan: String(n),
            href: duongDan(1, { nam: String(n) }),
            chon: nam === String(n),
          }))}
        />
        <p className="text-sm text-slate-600">
          <strong className="text-navy-800">{tong}</strong> sự kiện
        </p>
      </HienDan>

      {/* ── Danh sách ─────────────────────────────────────────── */}
      <HienDan the="section" className="wrap mt-6">
        {dsSuKien.length === 0 ? (
          <div className="card p-10 text-center">
            <span className="text-4xl">📅</span>
            <p className="mt-3 font-semibold text-navy-800">
              Không có sự kiện nào phù hợp
            </p>
            <Link href="/su-kien" className="btn-ghost mt-5">
              Xem tất cả sự kiện
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dsSuKien.map((e) => (
              <Link key={e.slug} href={`/su-kien/${e.slug}`} className="tile flex flex-col">
                {e.coverImage ? (
                  // Ảnh sự kiện do Chi hội chụp
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.coverImage}
                    alt={e.title}
                    loading="lazy"
                    className="ratio-3-2 w-full object-cover"
                  />
                ) : (
                  <div className="ratio-3-2 grid w-full place-items-center bg-navy-100 text-4xl">
                    📅
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-do-600">
                    {formatDate(e.startAt)}
                    {e.endAt && ` – ${formatDate(e.endAt)}`}
                  </p>
                  <h2 className="mt-1.5 line-clamp-2 font-semibold leading-snug text-navy-800">
                    {e.title}
                  </h2>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                    {e.seriesName && <span className="chip">{e.seriesName}</span>}
                    {e.activityGroup && (
                      <span className="chip-do">{e.activityGroup}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <Pagination page={trang} pages={soTrang} href={(p) => duongDan(p)} />
      </HienDan>
    </>
  );
}

function Loc({
  nhan,
  dangChon,
  duongDanTatCa,
  muc,
}: {
  nhan: string;
  dangChon: string;
  duongDanTatCa: string;
  muc: { nhan: string; so?: number; href: string; chon: boolean }[];
}) {
  if (muc.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-32 shrink-0 text-xs font-bold uppercase tracking-wide text-slate-500">
        {nhan}
      </span>
      <Link
        href={duongDanTatCa}
        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
          !dangChon
            ? "bg-navy-600 text-white"
            : "bg-navy-50 text-navy-700 hover:bg-navy-100"
        }`}
      >
        Tất cả
      </Link>
      {muc.map((m) => (
        <Link
          key={m.nhan}
          href={m.href}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
            m.chon
              ? "bg-navy-600 text-white"
              : "bg-navy-50 text-navy-700 hover:bg-navy-100"
          }`}
        >
          {m.nhan}
          {m.so ? ` (${m.so})` : ""}
        </Link>
      ))}
    </div>
  );
}
