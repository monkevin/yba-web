import { requireQuyen } from "@/lib/auth";
import { QUYEN } from "@/lib/quyen";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui";
import { normalizeSearch } from "@/lib/search";
import FeeGrid, { type FeeRow } from "./FeeGrid";
import FeeFilters from "./FeeFilters";

const PAGE_SIZE = 60;
const CURRENT_YEAR = 2026;
const YEARS = [2021, 2022, 2023, 2024, 2025, 2026];

export default async function FeePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireQuyen(QUYEN.HOI_PHI_QUAN_LY);

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const chapterId = typeof sp.nhom === "string" ? sp.nhom : "";
  const trangThai = typeof sp.tt === "string" ? sp.tt : ""; // "no" = còn nợ năm nay
  const page = Math.max(1, Number(sp.trang ?? 1) || 1);

  const where: Prisma.MemberWhereInput = { active: true };
  if (chapterId) where.chapterId = chapterId;
  if (q) where.searchText = { contains: normalizeSearch(q) };
  if (trangThai === "no") {
    where.feeExempt = false;
    where.feePayments = { none: { year: CURRENT_YEAR } };
  }
  if (trangThai === "mien") where.feeExempt = true;

  const [total, members, chapters, paidThisYear, exemptCount] = await Promise.all([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        feePayments: {
          where: { year: { in: YEARS } },
          select: { year: true },
        },
      },
    }),
    prisma.chapter.findMany({ orderBy: { name: "asc" } }),
    prisma.member.count({
      where: { active: true, feePayments: { some: { year: CURRENT_YEAR } } },
    }),
    prisma.member.count({ where: { active: true, feeExempt: true } }),
  ]);

  const totalActive = await prisma.member.count({ where: { active: true } });
  const owing = totalActive - paidThisYear - exemptCount;

  const rows: FeeRow[] = members.map((m) => ({
    id: m.id,
    code: m.code,
    name: m.name,
    company: m.company,
    feeExempt: m.feeExempt,
    paidYears: m.feePayments.map((f) => f.year),
  }));

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Hội phí"
        subtitle={`Theo dõi đóng hội phí theo năm · năm hiện tại ${CURRENT_YEAR}`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={`Đã đóng ${CURRENT_YEAR}`}
          value={`${paidThisYear}/${totalActive}`}
          tone="emerald"
        />
        <StatCard label="Còn nợ năm nay" value={String(Math.max(owing, 0))} tone="amber" />
        <StatCard label="Được miễn hội phí" value={String(exemptCount)} />
      </div>

      <FeeFilters chapters={chapters} />
      <FeeGrid rows={rows} years={YEARS} />

      <p className="text-xs text-slate-500">
        Bấm vào ô để đánh dấu đã đóng / bỏ đánh dấu cho từng năm. Ô ✓ xanh là đã
        đóng. Tick cột &quot;Miễn&quot; nếu hội viên được miễn hội phí.
      </p>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`?${new URLSearchParams({ ...(q ? { q } : {}), ...(chapterId ? { nhom: chapterId } : {}), ...(trangThai ? { tt: trangThai } : {}), trang: String(page - 1) })}`}
              className="btn-ghost py-1.5"
            >
              ← Trước
            </a>
          )}
          <span className="text-sm text-slate-500">
            Trang {page}/{pages} · {total} hội viên
          </span>
          {page < pages && (
            <a
              href={`?${new URLSearchParams({ ...(q ? { q } : {}), ...(chapterId ? { nhom: chapterId } : {}), ...(trangThai ? { tt: trangThai } : {}), trang: String(page + 1) })}`}
              className="btn-ghost py-1.5"
            >
              Sau →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
