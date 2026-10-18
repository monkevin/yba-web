import { prisma } from "@/lib/prisma";
import { DEAL_STATUS, SCOPE_ORDER } from "@/lib/deal";
import type { Period } from "@/lib/period";

/** Điều kiện lọc chung: chỉ tính đơn ĐÃ DUYỆT trong kỳ. */
export function approvedIn(period: Period) {
  return {
    status: DEAL_STATUS.DA_DUYET,
    dealDate: { gte: period.from, lte: period.to },
  };
}

export type Ranking = {
  memberId: string;
  code: string;
  /** Đường dẫn hồ sơ công khai /doanh-nghiep/<slug> */
  slug: string;
  name: string;
  company: string;
  total: number;
  count: number;
  partners: number;
};

async function rank(
  field: "sellerId" | "buyerId" | "referrerId",
  period: Period,
  take: number
): Promise<Ranking[]> {
  const grouped = await prisma.deal.groupBy({
    by: [field],
    where: { ...approvedIn(period), ...(field === "referrerId" ? { referrerId: { not: null } } : {}) },
    _sum: { amount: true },
    _count: { _all: true },
    orderBy: { _sum: { amount: "desc" } },
    take,
  });

  const ids = grouped.map((g) => g[field]).filter((v): v is string => !!v);
  if (!ids.length) return [];

  const members = await prisma.member.findMany({
    where: { id: { in: ids } },
    select: { id: true, code: true, slug: true, name: true, company: true },
  });
  const byId = new Map(members.map((m) => [m.id, m]));

  // Đếm số đối tác khác nhau của từng hội viên trong kỳ
  const partnerField = field === "sellerId" ? "buyerId" : "sellerId";
  const rows =
    field === "referrerId"
      ? []
      : await prisma.deal.findMany({
          where: { ...approvedIn(period), [field]: { in: ids } },
          select: { [field]: true, [partnerField]: true } as never,
        });
  const partnerSets = new Map<string, Set<string>>();
  for (const r of rows as unknown as Record<string, string>[]) {
    const key = r[field];
    if (!partnerSets.has(key)) partnerSets.set(key, new Set());
    partnerSets.get(key)!.add(r[partnerField]);
  }

  return grouped
    .map((g) => {
      const id = g[field] as string | null;
      const m = id ? byId.get(id) : undefined;
      if (!id || !m) return null;
      return {
        memberId: id,
        code: m.code,
        slug: m.slug,
        name: m.name,
        company: m.company,
        total: g._sum.amount ?? 0,
        count: g._count._all,
        partners: partnerSets.get(id)?.size ?? 0,
      };
    })
    .filter((r): r is Ranking => r !== null);
}

export function topSellers(period: Period, take = 10) {
  return rank("sellerId", period, take);
}

export function topBuyers(period: Period, take = 10) {
  return rank("buyerId", period, take);
}

export function topReferrers(period: Period, take = 10) {
  return rank("referrerId", period, take);
}

/** Tổng hợp toàn sàn trong kỳ. */
export async function overview(period: Period) {
  const [agg, deals, pendingPartner, pendingAdmin, memberCount] =
    await Promise.all([
      prisma.deal.aggregate({
        where: approvedIn(period),
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.deal.findMany({
        where: approvedIn(period),
        select: { sellerId: true, buyerId: true },
      }),
      prisma.deal.count({ where: { status: DEAL_STATUS.CHO_DOI_TAC } }),
      prisma.deal.count({ where: { status: DEAL_STATUS.CHO_DUYET } }),
      prisma.member.count({ where: { active: true } }),
    ]);

  const active = new Set<string>();
  const pairs = new Set<string>();
  for (const d of deals) {
    active.add(d.sellerId);
    active.add(d.buyerId);
    pairs.add([d.sellerId, d.buyerId].sort().join("|"));
  }

  return {
    total: agg._sum.amount ?? 0,
    count: agg._count._all,
    activeMembers: active.size,
    memberCount,
    pairs: pairs.size,
    pendingPartner,
    pendingAdmin,
  };
}

/** Doanh số đã duyệt theo từng tháng trong kỳ — dùng vẽ biểu đồ cột. */
export async function monthlySeries(period: Period) {
  const deals = await prisma.deal.findMany({
    where: approvedIn(period),
    select: { dealDate: true, amount: true },
  });

  const buckets = new Map<string, number>();
  for (const d of deals) {
    const key = `${d.dealDate.getFullYear()}-${String(
      d.dealDate.getMonth() + 1
    ).padStart(2, "0")}`;
    buckets.set(key, (buckets.get(key) ?? 0) + d.amount);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => ({ key, label: `T${Number(key.slice(5))}`, total }));
}

export type ScopeRow = {
  scope: string;
  total: number;
  count: number;
  /** Tỉ lệ phần trăm trên tổng giá trị của kỳ */
  share: number;
};

/**
 * Tách giá trị giao thương theo PHẠM VI: nội Chi hội / liên chi hội / liên hội /
 * ngoài Hội. Đây là con số Chi hội dùng để báo cáo lên Hội và để thi đua.
 */
export async function byScope(period: Period): Promise<ScopeRow[]> {
  const grouped = await prisma.deal.groupBy({
    by: ["partnerScope"],
    where: approvedIn(period),
    _sum: { amount: true },
    _count: { _all: true },
  });

  const map = new Map(grouped.map((g) => [g.partnerScope, g]));
  const tong = grouped.reduce((s, g) => s + (g._sum.amount ?? 0), 0);

  // Luôn trả đủ 4 dòng theo thứ tự cố định, kể cả phạm vi chưa có số liệu —
  // để bảng và biểu đồ không nhảy cột giữa các kỳ.
  return SCOPE_ORDER.map((scope) => {
    const g = map.get(scope);
    const total = g?._sum.amount ?? 0;
    return {
      scope,
      total,
      count: g?._count._all ?? 0,
      share: tong ? (total / tong) * 100 : 0,
    };
  });
}

/** Danh sách hội / chi hội bạn đã giao thương, kèm giá trị — cho phần liên hội. */
export async function byExternalOrg(period: Period, take = 10) {
  const grouped = await prisma.deal.groupBy({
    by: ["externalOrg"],
    where: { ...approvedIn(period), externalOrg: { not: null } },
    _sum: { amount: true },
    _count: { _all: true },
    orderBy: { _sum: { amount: "desc" } },
    take,
  });

  return grouped
    .filter((g) => g.externalOrg)
    .map((g) => ({
      org: g.externalOrg!,
      total: g._sum.amount ?? 0,
      count: g._count._all,
    }));
}

/** Doanh số đã duyệt theo từng quý trong kỳ. */
export async function quarterlySeries(period: Period) {
  const deals = await prisma.deal.findMany({
    where: approvedIn(period),
    select: { dealDate: true, amount: true },
  });

  const buckets = new Map<string, number>();
  for (const d of deals) {
    const q = Math.floor(d.dealDate.getMonth() / 3) + 1;
    const key = `${d.dealDate.getFullYear()}-Q${q}`;
    buckets.set(key, (buckets.get(key) ?? 0) + d.amount);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => ({ key, label: key.slice(2).replace("-", " "), total }));
}

/** Doanh số đã duyệt theo từng năm. */
export async function yearlySeries(period: Period) {
  const deals = await prisma.deal.findMany({
    where: approvedIn(period),
    select: { dealDate: true, amount: true },
  });

  const buckets = new Map<number, number>();
  for (const d of deals) {
    const y = d.dealDate.getFullYear();
    buckets.set(y, (buckets.get(y) ?? 0) + d.amount);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([key, total]) => ({ key: String(key), label: String(key), total }));
}

/** Cặp giao thương (dùng cho sơ đồ mạng lưới). */
export async function networkPairs(period: Period, limit = 120) {
  const deals = await prisma.deal.findMany({
    where: approvedIn(period),
    select: { sellerId: true, buyerId: true, amount: true },
  });

  const map = new Map<
    string,
    { a: string; b: string; total: number; count: number }
  >();
  for (const d of deals) {
    const [a, b] = [d.sellerId, d.buyerId].sort();
    const key = `${a}|${b}`;
    const cur = map.get(key) ?? { a, b, total: 0, count: 0 };
    cur.total += d.amount;
    cur.count += 1;
    map.set(key, cur);
  }

  const edges = [...map.values()]
    .sort((x, y) => y.total - x.total)
    .slice(0, limit);

  const ids = [...new Set(edges.flatMap((e) => [e.a, e.b]))];
  const members = await prisma.member.findMany({
    where: { id: { in: ids } },
    select: { id: true, code: true, company: true },
  });

  return { edges, members };
}
