import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { resolvePeriod } from "@/lib/period";
import { networkPairs, approvedIn } from "@/lib/stats";
import { formatShortVnd } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/ui";
import PeriodPicker from "@/components/PeriodPicker";

export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const period = resolvePeriod(
    typeof sp.ky === "string" ? sp.ky : "nam-nay",
    typeof sp.tu === "string" ? sp.tu : undefined,
    typeof sp.den === "string" ? sp.den : undefined
  );

  const { edges, members } = await networkPairs(period, 150);

  // Hội viên chưa phát sinh giao dịch nào trong kỳ — nhóm cần được kết nối
  const [activeIds, isolated] = await Promise.all([
    prisma.deal
      .findMany({
        where: approvedIn(period),
        select: { sellerId: true, buyerId: true },
      })
      .then((ds) => new Set(ds.flatMap((d) => [d.sellerId, d.buyerId]))),
    prisma.member.findMany({
      where: { active: true },
      select: { id: true, code: true, company: true },
      orderBy: { company: "asc" },
    }),
  ]);
  const lonely = isolated.filter((m) => !activeIds.has(m.id));

  // Bố cục vòng tròn: mỗi hội viên một điểm trên đường tròn
  const nodes = members.map((m, i) => {
    const angle = (i / members.length) * Math.PI * 2 - Math.PI / 2;
    return {
      ...m,
      x: 250 + Math.cos(angle) * 200,
      y: 250 + Math.sin(angle) * 200,
      angle,
    };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const maxTotal = Math.max(...edges.map((e) => e.total), 1);
  const degree = new Map<string, number>();
  for (const e of edges) {
    degree.set(e.a, (degree.get(e.a) ?? 0) + 1);
    degree.set(e.b, (degree.get(e.b) ?? 0) + 1);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mạng lưới giao thương"
        subtitle={`${edges.length} cặp hội viên đã mua bán với nhau · ${period.label}`}
      />

      <PeriodPicker />

      <section className="card p-4">
        {edges.length === 0 ? (
          <EmptyState text="Chưa có giao dịch được duyệt trong kỳ này." />
        ) : (
          <div className="overflow-x-auto">
            <svg viewBox="0 0 500 500" className="mx-auto w-full max-w-2xl">
              {edges.map((e, i) => {
                const a = byId.get(e.a);
                const b = byId.get(e.b);
                if (!a || !b) return null;
                return (
                  <line
                    key={i}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="rgb(99 102 241)"
                    strokeOpacity={0.15 + (e.total / maxTotal) * 0.5}
                    strokeWidth={0.5 + (e.total / maxTotal) * 3}
                  />
                );
              })}
              {nodes.map((n) => {
                const d = degree.get(n.id) ?? 1;
                const r = 3 + Math.min(d, 12) * 0.6;
                const flip = Math.cos(n.angle) < 0;
                return (
                  <g key={n.id}>
                    <circle cx={n.x} cy={n.y} r={r} className="fill-navy-600" />
                    <text
                      x={n.x + Math.cos(n.angle) * (r + 4)}
                      y={n.y + Math.sin(n.angle) * (r + 4)}
                      fontSize="6"
                      className="fill-slate-600"
                      textAnchor={flip ? "end" : "start"}
                      dominantBaseline="middle"
                    >
                      {n.company.length > 22
                        ? n.company.slice(0, 22) + "…"
                        : n.company}
                    </text>
                  </g>
                );
              })}
            </svg>
            <p className="mt-2 text-center text-xs text-slate-500">
              Đường càng đậm = giá trị giao thương giữa hai hội viên càng lớn.
              Chấm càng to = càng nhiều đối tác khác nhau.
            </p>
          </div>
        )}
      </section>

      <section className="card">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-800">Cặp giao thương mạnh nhất</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {edges.slice(0, 15).map((e, i) => {
            const a = byId.get(e.a);
            const b = byId.get(e.b);
            return (
              <li key={i} className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
                <span className="text-slate-800">{a?.company}</span>
                <span className="text-slate-400">↔</span>
                <span className="text-slate-800">{b?.company}</span>
                <span className="ml-auto font-semibold text-slate-800">
                  {formatShortVnd(e.total)}
                </span>
                <span className="w-14 text-right text-xs text-slate-400">
                  {e.count} đơn
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-800">
            Hội viên chưa giao thương trong kỳ ({lonely.length})
          </h2>
          <p className="text-xs text-slate-500">
            Danh sách để ban điều hành chủ động kết nối.
          </p>
        </div>
        {lonely.length === 0 ? (
          <EmptyState text="Tất cả hội viên đều đã có giao dịch. Tuyệt vời!" />
        ) : (
          <div className="flex flex-wrap gap-2 p-4">
            {lonely.slice(0, 100).map((m) => (
              <Link
                key={m.id}
                href={`/hoi-vien/${m.id}`}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-navy-50 hover:text-navy-700"
              >
                {m.company}
              </Link>
            ))}
            {lonely.length > 100 && (
              <span className="px-2 py-1 text-xs text-slate-400">
                và {lonely.length - 100} hội viên khác…
              </span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
