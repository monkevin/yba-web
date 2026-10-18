import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserPage, isBackOffice } from "@/lib/auth";
import { DEAL_STATUS } from "@/lib/deal";
import { formatShortVnd } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { memberTypeClass } from "@/lib/member";
import { normalizeSearch } from "@/lib/search";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import MemberFilters from "./MemberFilters";

const PAGE_SIZE = 40;

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const user = await requireUserPage();

  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const chapterId = typeof sp.nhom === "string" ? sp.nhom : "";
  const loai = typeof sp.loai === "string" ? sp.loai : "";
  const page = Math.max(1, Number(sp.trang ?? 1) || 1);

  const where: Prisma.MemberWhereInput = { active: true };
  if (chapterId) where.chapterId = chapterId;
  if (loai) where.memberType = loai;
  if (q) where.searchText = { contains: normalizeSearch(q) };

  const [total, members, chapters] = await Promise.all([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      orderBy: { company: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { chapter: { select: { name: true } } },
    }),
    prisma.chapter.findMany({ orderBy: { name: "asc" } }),
  ]);

  const memberTypes = (
    await prisma.member.findMany({
      where: { active: true, memberType: { not: null } },
      distinct: ["memberType"],
      select: { memberType: true },
    })
  )
    .map((m) => m.memberType!)
    .sort();

  // Doanh số đã duyệt (toàn thời gian) của đúng các hội viên đang hiển thị
  const ids = members.map((m) => m.id);
  const [sold, bought] = await Promise.all([
    prisma.deal.groupBy({
      by: ["sellerId"],
      where: { status: DEAL_STATUS.DA_DUYET, sellerId: { in: ids } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.deal.groupBy({
      by: ["buyerId"],
      where: { status: DEAL_STATUS.DA_DUYET, buyerId: { in: ids } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);
  const soldBy = new Map(sold.map((s) => [s.sellerId, s]));
  const boughtBy = new Map(bought.map((b) => [b.buyerId, b]));

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (chapterId) next.set("nhom", chapterId);
    if (loai) next.set("loai", loai);
    next.set("trang", String(p));
    return `/hoi-vien?${next.toString()}`;
  };

  return (
    <div>
      <PageHeader
        title="Hội viên"
        subtitle={`${total} hội viên đang hoạt động`}
        action={
          isBackOffice(user) ? (
            <Link href="/quan-tri/hoi-vien" className="btn-ghost">
              Quản lý hội viên
            </Link>
          ) : undefined
        }
      />

      <MemberFilters chapters={chapters} memberTypes={memberTypes} />

      {/* ── Điện thoại: dạng thẻ, không bắt kéo ngang ──────────── */}
      <ul className="space-y-3 sm:hidden">
        {members.map((m) => {
          const ban = soldBy.get(m.id);
          const mua = boughtBy.get(m.id);
          return (
            <li key={m.id} className="card p-4">
              <Link
                href={`/hoi-vien/${m.id}`}
                className="font-semibold leading-snug text-navy-800"
              >
                {tenDoanhNghiep(m.company)}
              </Link>
              <p className="mt-0.5 text-sm text-slate-500">
                {m.name} · <span className="font-mono text-xs">{m.code}</span>
              </p>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.memberType && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${memberTypeClass(m.memberType)}`}
                  >
                    {m.memberType}
                  </span>
                )}
                {m.industry && <span className="chip">{m.industry}</span>}
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-slate-100 text-sm">
                <div className="bg-white px-3 py-2">
                  <dt className="text-xs text-slate-500">Đã bán</dt>
                  <dd className="font-semibold text-slate-800">
                    {formatShortVnd(ban?._sum.amount ?? 0)}
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      · {ban?._count._all ?? 0} đơn
                    </span>
                  </dd>
                </div>
                <div className="bg-white px-3 py-2">
                  <dt className="text-xs text-slate-500">Đã mua</dt>
                  <dd className="font-semibold text-slate-800">
                    {formatShortVnd(mua?._sum.amount ?? 0)}
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      · {mua?._count._all ?? 0} đơn
                    </span>
                  </dd>
                </div>
              </dl>
            </li>
          );
        })}
        {members.length === 0 && (
          <li className="card px-4 py-10 text-center text-sm text-slate-500">
            Không tìm thấy hội viên nào.
          </li>
        )}
      </ul>

      {/* ── Máy tính: bảng đầy đủ ──────────────────────────────── */}
      <div className="card hidden overflow-hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Mã</th>
                <th className="px-3 py-2.5">Doanh nghiệp</th>
                <th className="px-3 py-2.5">Loại</th>
                <th className="px-3 py-2.5">Ngành</th>
                <th className="px-3 py-2.5">Nhóm</th>
                <th className="px-3 py-2.5 text-right">Đã bán</th>
                <th className="px-3 py-2.5 text-right">Đã mua</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-500">
                    {m.code}
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/hoi-vien/${m.id}`}
                      className="font-medium text-slate-800 hover:text-navy-600"
                    >
                      {tenDoanhNghiep(m.company)}
                    </Link>
                    <div className="text-xs text-slate-500">{m.name}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    {m.memberType ? (
                      <span
                        className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${memberTypeClass(m.memberType)}`}
                      >
                        {m.memberType}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {m.industry ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {m.chapter?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="font-semibold text-slate-800">
                      {formatShortVnd(soldBy.get(m.id)?._sum.amount ?? 0)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {soldBy.get(m.id)?._count._all ?? 0} đơn
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="font-semibold text-slate-800">
                      {formatShortVnd(boughtBy.get(m.id)?._sum.amount ?? 0)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {boughtBy.get(m.id)?._count._all ?? 0} đơn
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {members.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            Không tìm thấy hội viên nào.
          </p>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={qs(page - 1)} className="btn-ghost py-1.5">
              ← Trước
            </Link>
          )}
          <span className="text-sm text-slate-500">
            Trang {page}/{pages}
          </span>
          {page < pages && (
            <Link href={qs(page + 1)} className="btn-ghost py-1.5">
              Sau →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
