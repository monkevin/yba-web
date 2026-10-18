import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireUserPage, isAdmin, isBackOffice } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolvePeriod } from "@/lib/period";
import { PageHeader } from "@/components/ui";
import { normalizeSearch } from "@/lib/search";
import DealTable, { type DealRow } from "./DealTable";
import Filters from "./Filters";

const PAGE_SIZE = 30;

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const user = await requireUserPage();

  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const tt = typeof sp.tt === "string" ? sp.tt : "";
  const ky = typeof sp.ky === "string" ? sp.ky : "tat-ca";
  const tu = typeof sp.tu === "string" ? sp.tu : undefined;
  const den = typeof sp.den === "string" ? sp.den : undefined;
  const page = Math.max(1, Number(sp.trang ?? 1) || 1);

  const period = resolvePeriod(ky, tu, den);

  const where: Prisma.DealWhereInput = {
    dealDate: { gte: period.from, lte: period.to },
  };
  if (tt) where.status = tt;
  if (q) {
    const nq = normalizeSearch(q);
    where.OR = [
      { code: { contains: q } },
      { seller: { searchText: { contains: nq } } },
      { buyer: { searchText: { contains: nq } } },
    ];
  }
  // Hội viên chỉ thấy đơn của chính mình
  if (!isBackOffice(user)) {
    where.AND = [
      {
        OR: [
          { sellerId: user.memberId ?? "__none__" },
          { buyerId: user.memberId ?? "__none__" },
        ],
      },
    ];
  }

  const [total, deals] = await Promise.all([
    prisma.deal.count({ where }),
    prisma.deal.findMany({
      where,
      orderBy: [{ dealDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        seller: { select: { company: true } },
        buyer: { select: { company: true } },
        referrer: { select: { company: true } },
      },
    }),
  ]);

  const rows: DealRow[] = deals.map((d) => ({
    id: d.id,
    code: d.code,
    dealDate: d.dealDate.toISOString(),
    amount: d.amount,
    status: d.status,
    sellerCompany: d.seller.company,
    buyerCompany: d.buyer.company,
    referrerCompany: d.referrer?.company ?? null,
  }));

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (tt) next.set("tt", tt);
    if (ky) next.set("ky", ky);
    if (tu) next.set("tu", tu);
    if (den) next.set("den", den);
    next.set("trang", String(p));
    return `/giao-dich?${next.toString()}`;
  };

  return (
    <div>
      <PageHeader
        title="Giao dịch giao thương"
        subtitle={`${total} giao dịch · ${period.label}`}
        action={
          <Link href="/giao-dich/moi" className="btn-primary">
            + Khai giao dịch
          </Link>
        }
      />

      <Filters />
      <DealTable rows={rows} canApprove={isAdmin(user)} />

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
