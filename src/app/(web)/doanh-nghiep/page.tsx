import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import MemberCard from "@/components/web/MemberCard";
import Pagination from "@/components/web/Pagination";
import { prisma } from "@/lib/prisma";
import { PUBLIC_MEMBER } from "@/lib/public";
import { THU_TU_HOI_VIEN } from "@/lib/xep-hang";
import { normalizeSearch } from "@/lib/search";
import { SITE } from "@/lib/site";
import Filters, { type LuaChon } from "./Filters";
import HienDan from "@/components/web/HienDan";

const MOI_TRANG = 24;

export const metadata: Metadata = {
  title: "Danh bạ doanh nghiệp hội viên",
  description: `Tra cứu doanh nghiệp hội viên ${SITE.fullName} theo ngành nghề, khu vực và sản phẩm dịch vụ.`,
};

export default async function DanhBaDoanhNghiep({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const chuoi = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");

  const q = chuoi("q");
  const nganh = chuoi("nganh");
  const khuvuc = chuoi("khuvuc");
  const hang = chuoi("hang");
  const trang = Math.max(1, Number(sp.trang ?? 1) || 1);

  const where: Prisma.MemberWhereInput = { ...PUBLIC_MEMBER };
  if (q) where.searchText = { contains: normalizeSearch(q) };
  if (nganh) where.category = { slug: nganh };
  if (khuvuc) where.district = khuvuc;
  if (hang) where.memberType = hang;

  const [tong, members, cats, districts, types] = await Promise.all([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      // Thứ tự ưu tiên chuẩn của Chi hội — xem `src/lib/xep-hang.ts`
      orderBy: [{ featured: "desc" }, ...THU_TU_HOI_VIEN],
      skip: (trang - 1) * MOI_TRANG,
      take: MOI_TRANG,
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
    }),
    // Danh sách lựa chọn cho bộ lọc — chỉ đếm trên hồ sơ đang hiện công khai
    prisma.category.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: {
        slug: true,
        name: true,
        icon: true,
        _count: { select: { members: { where: PUBLIC_MEMBER } } },
      },
    }),
    prisma.member.groupBy({
      by: ["district"],
      where: { ...PUBLIC_MEMBER, district: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { district: "desc" } },
    }),
    prisma.member.groupBy({
      by: ["memberType"],
      where: { ...PUBLIC_MEMBER, memberType: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { memberType: "desc" } },
    }),
  ]);

  const nganhNghe: LuaChon[] = cats
    .filter((c) => c._count.members > 0)
    .map((c) => ({
      value: c.slug,
      label: `${c.icon ?? ""} ${c.name}`.trim(),
      count: c._count.members,
    }));

  const khuVuc: LuaChon[] = districts
    .filter((d) => d.district)
    .map((d) => ({ value: d.district!, label: d.district!, count: d._count._all }));

  const hangHoiVien: LuaChon[] = types
    .filter((t) => t.memberType)
    .map((t) => ({ value: t.memberType!, label: t.memberType!, count: t._count._all }));

  const soTrang = Math.max(1, Math.ceil(tong / MOI_TRANG));
  const duongDan = (p: number) => {
    const t = new URLSearchParams();
    if (q) t.set("q", q);
    if (nganh) t.set("nganh", nganh);
    if (khuvuc) t.set("khuvuc", khuvuc);
    if (hang) t.set("hang", hang);
    if (p > 1) t.set("trang", String(p));
    const s = t.toString();
    return s ? `/doanh-nghiep?${s}` : "/doanh-nghiep";
  };

  const tenNganh = cats.find((c) => c.slug === nganh)?.name;

  return (
    <>
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-12 text-white">
        <div className="wrap">
          <p className="eyebrow text-do-300">Danh bạ hội viên</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Doanh nghiệp hội viên
          </h1>
          <p className="mt-3 max-w-3xl text-white/85">
            Tra cứu năng lực, sản phẩm và dịch vụ của các doanh nghiệp trong{" "}
            {SITE.fullName}. Ưu tiên tìm nguồn hàng và đối tác ngay trong Hội
            trước khi tìm ra bên ngoài.
          </p>
        </div>
      </section>

      <HienDan the="section" className="wrap -mt-6">
        <Filters
          nganhNghe={nganhNghe}
          khuVuc={khuVuc}
          hangHoiVien={hangHoiVien}
          tong={tong}
        />
      </HienDan>

      <HienDan the="section" className="wrap mt-8">
        {tenNganh && (
          <h2 className="mb-4 text-lg font-bold text-navy-800">
            Ngành: {tenNganh}
          </h2>
        )}

        {members.length === 0 ? (
          <div className="card p-10 text-center">
            <span className="text-4xl">🔍</span>
            <p className="mt-3 font-semibold text-navy-800">
              Không tìm thấy doanh nghiệp nào phù hợp
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Thử bớt bộ lọc, hoặc tìm bằng từ khoá ngắn hơn.
            </p>
            <Link href="/doanh-nghiep" className="btn-ghost mt-5">
              Xem toàn bộ danh bạ
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => (
              <MemberCard key={m.slug} m={m} />
            ))}
          </div>
        )}

        <Pagination page={trang} pages={soTrang} href={duongDan} />
      </HienDan>

      <HienDan the="section" className="wrap mt-16">
        <div className="rounded-3xl bg-navy-50 px-6 py-10 text-center sm:px-12">
          <h2 className="text-xl font-bold text-navy-800">
            Doanh nghiệp của anh chị chưa có ở đây?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
            Hội viên đăng nhập để tự cập nhật hồ sơ doanh nghiệp: logo, giới
            thiệu, sản phẩm dịch vụ và thông tin liên hệ.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/tai-khoan/ho-so" className="btn-primary">
              Cập nhật hồ sơ của tôi
            </Link>
            <Link href="/dang-ky-hoi-vien" className="btn-ghost">
              Đăng ký hội viên mới
            </Link>
          </div>
        </div>
      </HienDan>
    </>
  );
}
