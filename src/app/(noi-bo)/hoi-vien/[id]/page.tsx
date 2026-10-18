import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserPage, isBackOffice } from "@/lib/auth";
import { DEAL_STATUS } from "@/lib/deal";
import { formatDate, formatShortVnd, formatVnd } from "@/lib/format";
import { StatCard, StatusBadge, EmptyState } from "@/components/ui";
import { memberTypeClass } from "@/lib/member";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUserPage();

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      chapter: { select: { name: true } },
      feePayments: { orderBy: { year: "desc" }, select: { year: true, note: true } },
    },
  });
  if (!member) notFound();

  const paidYears = member.feePayments.map((f) => f.year).sort((a, b) => b - a);
  const currentYear = 2026;
  const paidThisYear = paidYears.includes(currentYear);

  const approved = { status: DEAL_STATUS.DA_DUYET };

  const [sold, bought, referred, deals] = await Promise.all([
    prisma.deal.aggregate({
      where: { ...approved, sellerId: id },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.deal.aggregate({
      where: { ...approved, buyerId: id },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.deal.aggregate({
      where: { ...approved, referrerId: id },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.deal.findMany({
      where: {
        ...approved,
        OR: [{ sellerId: id }, { buyerId: id }],
      },
      orderBy: { dealDate: "desc" },
      take: 50,
      include: {
        seller: { select: { id: true, company: true } },
        buyer: { select: { id: true, company: true } },
      },
    }),
  ]);

  // Đối tác đã giao thương, gộp theo doanh nghiệp
  const partners = new Map<
    string,
    { id: string; company: string; total: number; count: number }
  >();
  for (const d of deals) {
    const other = d.sellerId === id ? d.buyer : d.seller;
    const cur = partners.get(other.id) ?? {
      id: other.id,
      company: other.company,
      total: 0,
      count: 0,
    };
    cur.total += d.amount;
    cur.count += 1;
    partners.set(other.id, cur);
  }
  const partnerList = [...partners.values()].sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-5">
      <Link href="/hoi-vien" className="text-sm text-slate-500 hover:underline">
        ← Danh sách hội viên
      </Link>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xs text-slate-400">{member.code}</div>
            <h1 className="text-xl font-bold text-slate-800">{member.company}</h1>
            <p className="text-sm text-slate-600">
              {member.salutation ? `${member.salutation} ` : ""}
              {member.name}
              {member.position ? ` — ${member.position}` : ""}
              {member.industry ? ` · ${member.industry}` : ""}
              {member.chapter ? ` · ${member.chapter.name}` : ""}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {member.memberType && (
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${memberTypeClass(member.memberType)}`}
                >
                  {member.memberType}
                </span>
              )}
              {member.hoiRole && (
                <span className="inline-block rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-medium text-navy-700 ring-1 ring-navy-100">
                  {member.hoiRole}
                </span>
              )}
            </div>
          </div>
          {isBackOffice(user) && (
            <Link href={`/quan-tri/hoi-vien/${member.id}`} className="btn-ghost">
              Sửa hồ sơ
            </Link>
          )}
        </div>

        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Điện thoại" value={member.phone} />
          <Info label="Email" value={member.email} />
          <Info label="Website" value={member.website} />
          <Info label="Quận / phường" value={member.district} />
          <Info label="Địa chỉ" value={member.address} />
          <Info
            label="Ngày sinh"
            value={member.birthday ? formatDate(member.birthday) : null}
          />
          <Info label="Số nhân viên" value={member.headcount} />
          <Info label="Ngày gia nhập" value={formatDate(member.joinedAt)} />
        </div>

        {(member.offering || member.needing) && (
          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
            <div className="rounded-lg bg-emerald-50 p-3">
              <div className="text-xs font-semibold uppercase text-emerald-700">
                Đang cung cấp
              </div>
              <p className="mt-1 text-sm text-slate-700">
                {member.offering || "—"}
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <div className="text-xs font-semibold uppercase text-amber-700">
                Đang tìm mua
              </div>
              <p className="mt-1 text-sm text-slate-700">
                {member.needing || "—"}
              </p>
            </div>
          </div>
        )}

        {isBackOffice(user) && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase text-slate-500">
                Tình trạng hội phí
              </div>
              {member.feeExempt ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  Được miễn hội phí
                </span>
              ) : paidThisYear ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                  Đã đóng {currentYear}
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  Chưa đóng {currentYear}
                </span>
              )}
            </div>
            {!member.feeExempt && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {paidYears.length === 0 ? (
                  <span className="text-sm text-slate-400">
                    Chưa có dữ liệu đóng hội phí.
                  </span>
                ) : (
                  paidYears.map((y) => (
                    <span
                      key={y}
                      className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                    >
                      {y}
                    </span>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Đã bán cho hội viên"
          value={formatShortVnd(sold._sum.amount ?? 0)}
          hint={`${sold._count._all} giao dịch`}
          tone="navy"
        />
        <StatCard
          label="Đã mua của hội viên"
          value={formatShortVnd(bought._sum.amount ?? 0)}
          hint={`${bought._count._all} giao dịch`}
          tone="emerald"
        />
        <StatCard
          label="Giá trị đã giới thiệu"
          value={formatShortVnd(referred._sum.amount ?? 0)}
          hint={`${referred._count._all} lượt kết nối`}
          tone="amber"
        />
      </div>

      <section className="card">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-800">
            Đối tác giao thương ({partnerList.length})
          </h2>
        </div>
        {partnerList.length === 0 ? (
          <EmptyState text="Chưa có giao dịch nào được ghi nhận." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {partnerList.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <Link
                  href={`/hoi-vien/${p.id}`}
                  className="truncate text-sm text-slate-800 hover:text-navy-600"
                >
                  {p.company}
                </Link>
                <span className="ml-auto text-sm font-semibold text-slate-800">
                  {formatShortVnd(p.total)}
                </span>
                <span className="w-14 text-right text-xs text-slate-400">
                  {p.count} đơn
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-800">Lịch sử giao dịch</h2>
        </div>
        {deals.length === 0 ? (
          <EmptyState text="Chưa có giao dịch nào." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {deals.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/giao-dich/${d.id}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-slate-50"
                >
                  <span className="text-xs text-slate-400">
                    {formatDate(d.dealDate)}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      d.sellerId === id
                        ? "bg-navy-50 text-navy-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {d.sellerId === id ? "Bán" : "Mua"}
                  </span>
                  <span className="text-sm text-slate-800">
                    {d.sellerId === id ? d.buyer.company : d.seller.company}
                  </span>
                  <span className="ml-auto font-semibold text-slate-800">
                    {formatVnd(d.amount)}
                  </span>
                  <StatusBadge status={d.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="text-slate-800">{value || "—"}</div>
    </div>
  );
}
