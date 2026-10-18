import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import ListingCard from "@/components/web/ListingCard";
import Pagination from "@/components/web/Pagination";
import { LOAI_TIN } from "@/lib/listing";
import { prisma } from "@/lib/prisma";
import { publicListing } from "@/lib/public";
import { THU_TU_TIN_DANG } from "@/lib/xep-hang";
import { normalizeSearch } from "@/lib/search";
import { SITE } from "@/lib/site";
import Filters, { type LuaChon } from "./Filters";
import HienDan from "@/components/web/HienDan";

const MOI_TRANG = 18;

export const metadata: Metadata = {
  title: "Chợ nhu cầu mua – bán",
  description: `Nhu cầu cần mua, cần bán do doanh nghiệp hội viên ${SITE.fullName} chủ động đăng. Tìm đối tác, nguồn hàng và khách hàng ngay trong Hội.`,
};

export default async function ChoNhuCau({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const chuoi = (k: string) =>
    typeof sp[k] === "string" ? (sp[k] as string).trim() : "";

  const q = chuoi("q");
  const loai = chuoi("loai");
  const nganh = chuoi("nganh");
  const khuvuc = chuoi("khuvuc");
  const trang = Math.max(1, Number(sp.trang ?? 1) || 1);

  const where: Prisma.ListingWhereInput = { ...publicListing() };
  if (q) where.searchText = { contains: normalizeSearch(q) };
  if (loai === LOAI_TIN.CAN_MUA || loai === LOAI_TIN.CAN_BAN) where.type = loai;
  if (nganh) where.category = { slug: nganh };
  if (khuvuc) where.member = { ...(where.member as object), district: khuvuc };

  const chon = {
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
  } as const;

  const [tong, tin, soCanBan, soCanMua, cats, districts] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      // Tin của Ban Chủ nhiệm và hội viên đã đóng phí nổi lên trước
      orderBy: THU_TU_TIN_DANG,
      skip: (trang - 1) * MOI_TRANG,
      take: MOI_TRANG,
      select: chon,
    }),
    prisma.listing.count({ where: { ...publicListing(), type: LOAI_TIN.CAN_BAN } }),
    prisma.listing.count({ where: { ...publicListing(), type: LOAI_TIN.CAN_MUA } }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: {
        slug: true,
        name: true,
        icon: true,
        _count: { select: { listings: { where: publicListing() } } },
      },
    }),
    prisma.member.groupBy({
      by: ["district"],
      where: {
        district: { not: null },
        listings: { some: publicListing() },
      },
      _count: { _all: true },
      orderBy: { _count: { district: "desc" } },
    }),
  ]);

  const nganhNghe: LuaChon[] = cats
    .filter((c) => c._count.listings > 0)
    .map((c) => ({
      value: c.slug,
      label: `${c.icon ?? ""} ${c.name}`.trim(),
      count: c._count.listings,
    }));

  const khuVuc: LuaChon[] = districts
    .filter((d) => d.district)
    .map((d) => ({ value: d.district!, label: d.district! }));

  const soTrang = Math.max(1, Math.ceil(tong / MOI_TRANG));
  const duongDan = (p: number) => {
    const t = new URLSearchParams();
    if (q) t.set("q", q);
    if (loai) t.set("loai", loai);
    if (nganh) t.set("nganh", nganh);
    if (khuvuc) t.set("khuvuc", khuvuc);
    if (p > 1) t.set("trang", String(p));
    const s = t.toString();
    return s ? `/giao-thuong?${s}` : "/giao-thuong";
  };

  return (
    <>
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-12 text-white">
        <div className="wrap">
          <p className="eyebrow text-do-300">Cơ hội giao thương</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Chợ nhu cầu mua – bán
          </h1>
          <p className="mt-3 max-w-3xl text-white/85">
            Doanh nghiệp hội viên chủ động đăng nhu cầu cần mua và cần bán. Tìm
            nguồn hàng, tìm khách hàng và tìm đối tác ngay trong Chi hội trước khi
            tìm ra bên ngoài.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div>
              <Link href="/tai-khoan/tin-dang/moi" className="btn-cta">
                + Đăng nhu cầu của tôi
              </Link>
              {/* Báo trước cho khách vãng lai: bấm nút sẽ gặp màn đăng nhập.
                  Không có dòng này, người lạ tưởng web lỗi khi bị chuyển trang */}
              <p className="mt-1.5 text-xs text-white/60">
                Dành cho hội viên · Chưa là hội viên?{" "}
                <Link href="/dang-ky-hoi-vien" className="underline hover:text-white">
                  Đăng ký gia nhập
                </Link>
              </p>
            </div>
            <span className="inline-flex items-center gap-4 rounded-full bg-white/10 px-5 py-3 text-sm ring-1 ring-white/20">
              <span>
                <strong className="text-white">{soCanBan}</strong> tin cần bán
              </span>
              <span className="text-white/30">|</span>
              <span>
                <strong className="text-white">{soCanMua}</strong> tin cần mua
              </span>
            </span>
          </div>
        </div>
      </section>

      <HienDan the="section" className="wrap -mt-6">
        <Filters nganhNghe={nganhNghe} khuVuc={khuVuc} tong={tong} />
      </HienDan>

      <HienDan the="section" className="wrap mt-8">
        {tin.length === 0 ? (
          <div className="card p-10 text-center">
            <span className="text-4xl">🛒</span>
            <p className="mt-3 font-semibold text-navy-800">
              Chưa có tin nào phù hợp
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Thử bớt bộ lọc, hoặc chính anh/chị đăng nhu cầu đầu tiên.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href="/giao-thuong" className="btn-ghost">
                Xem toàn bộ chợ
              </Link>
              <Link href="/tai-khoan/tin-dang/moi" className="btn-primary">
                Đăng nhu cầu
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tin.map((l) => (
              <ListingCard key={l.slug} l={l} />
            ))}
          </div>
        )}

        <Pagination page={trang} pages={soTrang} href={duongDan} />
      </HienDan>

      <HienDan the="section" className="wrap mt-16">
        <div className="rounded-3xl bg-navy-50 px-6 py-10 text-center sm:px-12">
          <h2 className="text-xl font-bold text-navy-800">
            Doanh nghiệp anh chị đang cần mua hay muốn chào bán gì?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
            Đăng một tin lên chợ, cả {SITE.fullName} và khách ghé thăm
            ybacholon.vn đều nhìn thấy. Đăng tin miễn phí, hiển thị 90 ngày.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/tai-khoan/tin-dang/moi" className="btn-primary">
              Đăng nhu cầu
            </Link>
            <Link href="/doanh-nghiep" className="btn-ghost">
              Xem danh bạ doanh nghiệp
            </Link>
          </div>
        </div>
      </HienDan>
    </>
  );
}
