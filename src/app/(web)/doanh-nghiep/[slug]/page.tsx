import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AnhBiaHoSo from "@/components/web/AnhBiaHoSo";
import FanpageHoiVien, { chuanFanpage } from "@/components/web/FanpageHoiVien";
import TheSanPham from "@/components/web/TheSanPham";
import ListingCard from "@/components/web/ListingCard";
import LogoDoanhNghiep from "@/components/web/LogoDoanhNghiep";
import MemberCard from "@/components/web/MemberCard";
import ThuVienAnh from "@/components/web/ThuVienAnh";
import { getCurrentUser } from "@/lib/auth";
import { DEAL_STATUS } from "@/lib/deal";
import { formatShortVnd } from "@/lib/format";
import { docGiaoDien } from "@/lib/giao-dien";
import { prisma } from "@/lib/prisma";
import { PUBLIC_MEMBER, publicListing } from "@/lib/public";
import { SITE } from "@/lib/site";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";

/** Tách một ô nhập nhiều dòng thành mảng, bỏ dòng trống. */
function dong(s: string | null | undefined): string[] {
  return (s ?? "")
    .split(/\r?\n/)
    .map((d) => d.trim())
    .filter(Boolean);
}

/**
 * Hiện một ô nhập tự do thành danh sách gạch đầu dòng. Dữ liệu nhập từ Google
 * Sheet thường là một đoạn dài ngăn bằng dấu chấm phẩy hoặc xuống dòng — tách ra
 * đọc dễ hơn hẳn; nếu chỉ có một ý thì giữ nguyên dạng đoạn văn.
 */
function DanhSachY({ chuoi, mau }: { chuoi: string; mau: "do" | "navy" }) {
  const y = chuoi
    .split(/\r?\n|;/)
    .map((d) => d.trim().replace(/^[-•▸*]\s*/, ""))
    .filter((d) => d.length > 1);

  if (y.length < 2) {
    return <p className="mt-3 leading-relaxed text-slate-700">{chuoi}</p>;
  }

  return (
    <ul className="mt-3 space-y-2 text-slate-700">
      {y.map((d, i) => (
        <li key={i} className="flex gap-2.5">
          <span className={mau === "do" ? "text-do-500" : "text-navy-500"}>▸</span>
          <span className="leading-relaxed">{d}</span>
        </li>
      ))}
    </ul>
  );
}

/** Nạp hồ sơ công khai theo slug. Dùng chung cho metadata và trang. */
async function napHoSo(slug: string) {
  return prisma.member.findFirst({
    where: { slug, ...PUBLIC_MEMBER },
    include: {
      category: { select: { name: true, slug: true, icon: true } },
      chapter: { select: { name: true } },
      products: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
      listings: {
        where: publicListing(),
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          slug: true,
          type: true,
          title: true,
          summary: true,
          priceText: true,
          location: true,
          images: true,
          createdAt: true,
          category: { select: { name: true, icon: true } },
          member: { select: { slug: true, company: true, logo: true } },
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = await napHoSo(slug);
  if (!m) return { title: "Không tìm thấy doanh nghiệp" };

  const ten = tenDoanhNghiep(m.company);
  return {
    title: ten,
    description:
      m.intro ??
      `${ten} — doanh nghiệp hội viên ${SITE.fullName}${m.category ? `, ngành ${m.category.name}` : ""}.`,
    openGraph: { title: ten, images: m.coverImage ? [m.coverImage] : undefined },
  };
}

export default async function HoSoDoanhNghiep({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [m, user, gd] = await Promise.all([
    napHoSo(slug),
    getCurrentUser(),
    docGiaoDien(),
  ]);
  if (!m) notFound();

  const ten = tenDoanhNghiep(m.company);
  const anhBoSung: string[] = (() => {
    if (!m.gallery) return [];
    try {
      const a = JSON.parse(m.gallery);
      return Array.isArray(a) ? a.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  })();

  // Bài báo viết về doanh nghiệp — chuỗi JSON trong cột pressLinks
  const baoChi: { title: string; url: string; source?: string }[] = (() => {
    if (!m.pressLinks) return [];
    try {
      const a = JSON.parse(m.pressLinks);
      return Array.isArray(a)
        ? a.filter((x) => x && typeof x.title === "string" && typeof x.url === "string")
        : [];
    } catch {
      return [];
    }
  })();

  // Thành tích giao thương — chỉ tính đơn ĐÃ DUYỆT, xem `src/lib/stats.ts`
  const [ban, mua, gioiThieu, cungNganh] = await Promise.all([
    prisma.deal.aggregate({
      where: { status: DEAL_STATUS.DA_DUYET, sellerId: m.id },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.deal.aggregate({
      where: { status: DEAL_STATUS.DA_DUYET, buyerId: m.id },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.deal.count({
      where: { status: DEAL_STATUS.DA_DUYET, referrerId: m.id },
    }),
    m.categoryId
      ? prisma.member.findMany({
          where: { ...PUBLIC_MEMBER, categoryId: m.categoryId, id: { not: m.id } },
          take: 3,
          orderBy: [{ featured: "desc" }, { company: "asc" }],
          select: {
            slug: true,
            name: true,
            company: true,
            position: true,
            industry: true,
            district: true,
            logo: true,
            intro: true,
            category: { select: { name: true, icon: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const tongGiaoThuong = (ban._sum.amount ?? 0) + (mua._sum.amount ?? 0);
  const soDon = ban._count._all + mua._count._all;

  const gon = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
  const lapVoiMoDau =
    !!m.intro &&
    !!m.description &&
    gon(m.description).startsWith(gon(m.intro).slice(0, 60));

  const nangLuc = dong(m.capabilities);
  const dichVu = dong(m.services);
  // Fanpage doanh nghiệp: chỉ nhúng khi đúng là một trang Facebook
  const fanpage = chuanFanpage(m.facebook);
  // Lịch sử ghi mỗi dòng một mốc, dạng "2005 | Thành lập công ty"
  const lichSu = dong(m.history).map((d) => {
    const [moc, ...con] = d.split("|");
    return con.length
      ? { moc: moc.trim(), noiDung: con.join("|").trim() }
      : { moc: "", noiDung: d };
  });

  return (
    <>
      <AnhBiaHoSo
        company={m.company}
        coverImage={m.coverImage}
        biaChung={gd.biaHoSo}
        icon={m.category?.icon}
      />

      <div className="wrap">
        {/* ── Đầu trang: logo + tên ──────────────────────────────
            CHỈ logo được kéo lên đè lên ảnh bìa. Trước đây cả khối chữ cùng bị
            kéo lên nên tên doanh nghiệp lọt vào vùng ảnh bìa và biến mất. */}
        <LogoDoanhNghiep
          company={m.company}
          logo={m.logo}
          size="lg"
          className="-mt-12 shadow-lg ring-4 ring-white sm:-mt-16"
        />

        <div className="mt-4">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-navy-800 sm:text-3xl">
            {ten}
          </h1>
          <p className="mt-1.5 text-slate-600">
            {m.salutation ? `${m.salutation} ` : ""}
            <strong className="text-navy-700">{m.name}</strong>
            {m.position ? ` · ${m.position}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {m.category && (
              <Link href={`/doanh-nghiep?nganh=${m.category.slug}`} className="chip">
                {m.category.icon ? `${m.category.icon} ` : ""}
                {m.category.name}
              </Link>
            )}
            {m.district && (
              <Link
                href={`/doanh-nghiep?khuvuc=${encodeURIComponent(m.district)}`}
                className="chip"
              >
                📍 {m.district}
              </Link>
            )}
            {m.memberType && <span className="chip-do">{m.memberType}</span>}
            {m.hoiRole && <span className="chip-do">{m.hoiRole}</span>}
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          {/* ── Cột trái ───────────────────────────────────────── */}
          <div className="space-y-10">
            {(m.intro || m.description) && (
              <section>
                <h2 className="text-lg font-bold text-navy-800">
                  Giới thiệu doanh nghiệp
                </h2>
                {/* Câu giới thiệu ngắn thường chính là đoạn mở đầu của phần
                    giới thiệu dài — in cả hai thì đọc như bị lặp */}
                {m.intro && !lapVoiMoDau && (
                  <p className="mt-3 text-base font-medium leading-relaxed text-navy-700">
                    {m.intro}
                  </p>
                )}
                {m.description && (
                  <div className="mt-3 space-y-3 leading-relaxed text-slate-700">
                    {m.description
                      .split(/\n{2,}/)
                      .map((doan, i) => <p key={i}>{doan}</p>)}
                  </div>
                )}
              </section>
            )}

            {lichSu.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-navy-800">
                  Lịch sử hình thành &amp; phát triển
                </h2>
                <ol className="mt-4 space-y-0">
                  {lichSu.map((l, i) => (
                    <li key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-do-500 ring-4 ring-do-100" />
                        {i < lichSu.length - 1 && (
                          <span className="w-px flex-1 bg-navy-100" />
                        )}
                      </div>
                      <div className={i < lichSu.length - 1 ? "pb-6" : ""}>
                        {l.moc && (
                          <p className="font-bold text-navy-800">{l.moc}</p>
                        )}
                        <p className="mt-0.5 leading-relaxed text-slate-700">
                          {l.noiDung}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Hồ sơ nhập từ Google Sheet có intro sinh ra từ chính offering —
                đừng lặp lại y hệt hai lần trên trang. */}
            {m.offering && m.offering.trim() !== (m.intro ?? "").trim() && (
              <section>
                <h2 className="text-lg font-bold text-navy-800">
                  Sản phẩm cung cấp
                </h2>
                <DanhSachY chuoi={m.offering} mau="do" />
              </section>
            )}

            {dichVu.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-navy-800">
                  Dịch vụ cung cấp
                </h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {dichVu.map((d, i) => (
                    <li
                      key={i}
                      className="flex gap-2.5 rounded-xl bg-navy-50 px-4 py-3 leading-relaxed text-slate-700"
                    >
                      <span className="text-navy-500">▸</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {m.products.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-navy-800">
                  Sản phẩm tiêu biểu
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {m.products.map((p) => (
                    <TheSanPham
                      key={p.id}
                      sp={{
                        id: p.id,
                        name: p.name,
                        summary: p.summary,
                        priceText: p.priceText,
                        image: p.image,
                      }}
                      icon={m.category?.icon}
                      soDienThoai={user ? m.phone : null}
                      slugHoiVien={m.slug}
                    />
                  ))}
                </div>
              </section>
            )}

            {nangLuc.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-navy-800">
                  Năng lực &amp; chứng nhận
                </h2>
                <ul className="mt-3 space-y-2 text-slate-700">
                  {nangLuc.map((n, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-0.5 text-do-500">✓</span>
                      <span className="leading-relaxed">{n}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {m.needing && (
              <section className="rounded-2xl bg-navy-50 p-5">
                <h2 className="text-lg font-bold text-navy-800">
                  Doanh nghiệp đang tìm
                </h2>
                <p className="mt-2 leading-relaxed text-slate-700">{m.needing}</p>
              </section>
            )}

            {anhBoSung.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-navy-800">
                  Hình ảnh doanh nghiệp
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Bấm vào ảnh để xem lớn.
                </p>
                <div className="mt-4">
                  <ThuVienAnh anh={anhBoSung} tieuDe={ten} />
                </div>
              </section>
            )}

            {fanpage && (
              <section>
                <h2 className="text-lg font-bold text-navy-800">
                  Fanpage doanh nghiệp
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Hoạt động mới nhất do {ten} tự đăng trên Facebook.
                </p>
                <div className="mt-4">
                  <FanpageHoiVien href={fanpage} tenDoanhNghiep={ten} />
                </div>
              </section>
            )}

            {baoChi.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-navy-800">
                  Báo chí viết về doanh nghiệp
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {baoChi.map((b) => (
                    <li key={b.url}>
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="tile flex items-center gap-3 p-4"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-do-50 text-lg">
                          📰
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 font-medium leading-snug text-navy-800">
                            {b.title}
                          </span>
                          {b.source && (
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {b.source} ↗
                            </span>
                          )}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {m.listings.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-navy-800">
                  Nhu cầu đang đăng trên chợ giao thương
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {m.listings.map((l) => (
                    <ListingCard key={l.slug} l={l} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Cột phải ───────────────────────────────────────── */}
          <aside className="space-y-4 lg:sticky lg:top-24">
            {/* Người đại diện — YBA là hội doanh nhân nên con người đứng trước
                doanh nghiệp; trước đây tên chỉ nằm một dòng nhỏ dưới tiêu đề */}
            <div className="card overflow-hidden">
              <div className="bg-navy-800 px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-do-300">
                  Người đại diện tại {SITE.name}
                </p>
              </div>
              <div className="flex items-start gap-4 p-5">
                {m.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.avatar}
                    alt={m.name}
                    className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-navy-100"
                  />
                ) : (
                  <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-navy-100 text-2xl font-bold text-navy-500">
                    {m.name.trim().split(/\s+/).pop()?.charAt(0) ?? "?"}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-snug text-navy-800">
                    {m.salutation ? `${m.salutation} ` : ""}
                    {m.name}
                  </p>
                  {m.position && (
                    <p className="mt-0.5 text-sm text-slate-600">
                      {m.position}
                      {m.company ? ` · ${ten}` : ""}
                    </p>
                  )}
                  {m.hoiRole && (
                    <p className="mt-2 inline-block rounded-full bg-do-50 px-2.5 py-1 text-sm font-semibold text-do-700">
                      {m.hoiRole}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-slate-500">
                    {m.memberType ?? "Hội viên"} · Gia nhập{" "}
                    {m.joinedAt.getFullYear()}
                  </p>
                </div>
              </div>
            </div>

            {/* Liên hệ — khách vãng lai không được xem trực tiếp */}
            <div className="card p-5">
              <h2 className="font-bold text-navy-800">Thông tin liên hệ</h2>

              {user ? (
                <dl className="mt-4 space-y-3 text-sm">
                  {m.phone && (
                    <div>
                      <dt className="text-slate-500">Điện thoại</dt>
                      <dd className="mt-0.5">
                        <a
                          href={`tel:${m.phone}`}
                          className="font-semibold text-navy-700 hover:underline"
                        >
                          {m.phone}
                        </a>
                      </dd>
                    </div>
                  )}
                  {m.email && (
                    <div>
                      <dt className="text-slate-500">Email</dt>
                      <dd className="mt-0.5 break-all">
                        <a
                          href={`mailto:${m.email}`}
                          className="font-semibold text-navy-700 hover:underline"
                        >
                          {m.email}
                        </a>
                      </dd>
                    </div>
                  )}
                  {m.address && (
                    <div>
                      <dt className="text-slate-500">Địa chỉ</dt>
                      <dd className="mt-0.5 leading-relaxed text-slate-700">
                        {m.address}
                      </dd>
                    </div>
                  )}
                </dl>
              ) : (
                <div className="mt-4 rounded-xl bg-navy-50 p-4 text-center">
                  <p className="text-sm leading-relaxed text-slate-600">
                    Số điện thoại và email của hội viên chỉ hiển thị với người đã
                    đăng nhập, để tránh bị thu thập dữ liệu.
                  </p>
                  <Link
                    href={`/login?tiep=/doanh-nghiep/${m.slug}`}
                    className="btn-primary mt-4 w-full"
                  >
                    Đăng nhập để xem liên hệ
                  </Link>
                </div>
              )}

              {m.website && (
                <a
                  href={m.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="btn-ghost mt-4 w-full"
                >
                  Xem website →
                </a>
              )}

              {(m.facebook || m.zalo || m.linkedin || m.youtube) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.facebook && (
                    <a href={m.facebook} target="_blank" rel="noopener noreferrer nofollow" className="chip">
                      Facebook
                    </a>
                  )}
                  {m.zalo && (
                    <a href={m.zalo} target="_blank" rel="noopener noreferrer nofollow" className="chip">
                      Zalo
                    </a>
                  )}
                  {m.linkedin && (
                    <a href={m.linkedin} target="_blank" rel="noopener noreferrer nofollow" className="chip">
                      LinkedIn
                    </a>
                  )}
                  {m.youtube && (
                    <a href={m.youtube} target="_blank" rel="noopener noreferrer nofollow" className="chip">
                      YouTube
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Thông tin doanh nghiệp */}
            <div className="card p-5">
              <h2 className="font-bold text-navy-800">Thông tin chung</h2>
              <dl className="mt-4 space-y-2.5 text-sm">
                {[
                  ["Mã hội viên", m.code],
                  ["Năm gia nhập Hội", String(m.joinedAt.getFullYear())],
                  ["Năm thành lập", m.foundedYear ? String(m.foundedYear) : null],
                  ["Quy mô nhân sự", m.headcount ? `${m.headcount} người` : null],
                  ["Mã số thuế", m.taxCode],
                  ["Nhóm sinh hoạt", m.chapter?.name ?? null],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k as string} className="flex justify-between gap-3">
                      <dt className="shrink-0 text-slate-500">{k}</dt>
                      <dd className="text-right font-medium text-navy-700">{v}</dd>
                    </div>
                  ))}
              </dl>
            </div>

            {/* Thành tích giao thương — chỉ hiện khi có số liệu thật */}
            {soDon > 0 && (
              <div className="card p-5">
                <h2 className="font-bold text-navy-800">Giao thương trong Hội</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Tổng giá trị</dt>
                    <dd className="font-bold text-do-700">
                      {formatShortVnd(tongGiaoThuong)} ₫
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Đã bán cho hội viên</dt>
                    <dd className="font-medium text-navy-700">
                      {formatShortVnd(ban._sum.amount ?? 0)} ₫ · {ban._count._all} đơn
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Đã mua của hội viên</dt>
                    <dd className="font-medium text-navy-700">
                      {formatShortVnd(mua._sum.amount ?? 0)} ₫ · {mua._count._all} đơn
                    </dd>
                  </div>
                  {gioiThieu > 0 && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Đứng ra kết nối</dt>
                      <dd className="font-medium text-navy-700">{gioiThieu} đơn</dd>
                    </div>
                  )}
                </dl>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  Chỉ tính các giao dịch đã được Ban Chủ nhiệm duyệt.
                </p>
              </div>
            )}

            {m.videoUrl && (
              <div className="card overflow-hidden">
                <a
                  href={m.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="block p-5 text-center"
                >
                  <span className="text-3xl">▶️</span>
                  <p className="mt-2 font-semibold text-navy-800">
                    Video giới thiệu doanh nghiệp
                  </p>
                </a>
              </div>
            )}
          </aside>
        </div>

        {cungNganh.length > 0 && (
          <section className="mt-16">
            <h2 className="text-lg font-bold text-navy-800">
              Doanh nghiệp cùng ngành trong Chi hội
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {cungNganh.map((c) => (
                <MemberCard key={c.slug} m={c} />
              ))}
            </div>
          </section>
        )}

        <div className="mt-12">
          <Link href="/doanh-nghiep" className="btn-ghost">
            ← Về danh bạ doanh nghiệp
          </Link>
        </div>
      </div>
    </>
  );
}
