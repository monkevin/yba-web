import Link from "next/link";
import { resolvePeriod } from "@/lib/period";
import {
  monthlySeries,
  overview,
  topBuyers,
  topReferrers,
  topSellers,
  type Ranking,
} from "@/lib/stats";
import { formatShortVnd, formatVnd } from "@/lib/format";
import { PageHeader, StatCard, EmptyState } from "@/components/ui";
import BarChart from "@/components/BarChart";
import PeriodPicker from "@/components/PeriodPicker";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  // Báo cáo tổng hợp mở cho mọi hội viên xem — đây là số liệu thi đua của hội.
  const period = resolvePeriod(
    typeof sp.ky === "string" ? sp.ky : "nam-nay",
    typeof sp.tu === "string" ? sp.tu : undefined,
    typeof sp.den === "string" ? sp.den : undefined
  );

  const [stats, series, sellers, buyers, referrers] = await Promise.all([
    overview(period),
    monthlySeries(period),
    topSellers(period, 20),
    topBuyers(period, 20),
    topReferrers(period, 20),
  ]);

  const exportHref = `/api/bao-cao/xuat?ky=${period.key}${
    typeof sp.tu === "string" ? `&tu=${sp.tu}` : ""
  }${typeof sp.den === "string" ? `&den=${sp.den}` : ""}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo giao thương"
        subtitle={`${period.label} · chỉ tính giao dịch đã được duyệt`}
        action={
          <div className="flex gap-2">
            <Link href="/vinh-danh" className="btn-ghost">
              Bảng vinh danh
            </Link>
            <a href={exportHref} className="btn-primary">
              Xuất Excel (CSV)
            </a>
          </div>
        }
      />

      <PeriodPicker />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng giá trị giao thương"
          value={formatShortVnd(stats.total)}
          hint={formatVnd(stats.total)}
          tone="navy"
        />
        <StatCard label="Số giao dịch" value={String(stats.count)} />
        <StatCard
          label="Hội viên tham gia"
          value={`${stats.activeMembers}/${stats.memberCount}`}
          hint={`tỉ lệ ${
            stats.memberCount
              ? Math.round((stats.activeMembers / stats.memberCount) * 100)
              : 0
          }%`}
          tone="emerald"
        />
        <StatCard
          label="Cặp giao thương"
          value={String(stats.pairs)}
          hint="số cặp hội viên đã mua bán với nhau"
          tone="amber"
        />
      </div>

      <section className="card">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-800">
            Doanh số theo tháng
          </h2>
        </div>
        <BarChart data={series} />
      </section>

      <RankTable
        title="Bảng xếp hạng bán ra"
        rows={sellers}
        valueLabel="Doanh số bán"
      />
      <RankTable
        title="Bảng xếp hạng mua vào"
        rows={buyers}
        valueLabel="Giá trị mua"
      />
      <RankTable
        title="Bảng xếp hạng giới thiệu"
        rows={referrers}
        valueLabel="Giá trị đã kết nối"
        hidePartners
      />
    </div>
  );
}

function RankTable({
  title,
  rows,
  valueLabel,
  hidePartners,
}: {
  title: string;
  rows: Ranking[];
  valueLabel: string;
  hidePartners?: boolean;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold text-slate-800">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <EmptyState text="Chưa có dữ liệu trong kỳ." />
      ) : (
        <>
        {/* ── Điện thoại: xếp hạng dạng danh sách ──────────────── */}
        <ol className="divide-y divide-slate-100 sm:hidden">
          {rows.map((r, i) => (
            <li key={r.memberId} className="flex items-center gap-3 px-4 py-3">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  i < 3 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <Link
                  href={`/hoi-vien/${r.memberId}`}
                  className="line-clamp-2 text-sm font-medium leading-snug text-slate-800"
                >
                  {r.company}
                </Link>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {r.count} đơn
                  {!hidePartners && ` · ${r.partners} đối tác`}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-navy-700">
                {formatShortVnd(r.total)}
              </span>
            </li>
          ))}
        </ol>

        {/* ── Máy tính: bảng đầy đủ ────────────────────────────── */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-12 px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Hội viên</th>
                <th className="px-3 py-2.5 text-right">{valueLabel}</th>
                <th className="px-3 py-2.5 text-right">Số đơn</th>
                {!hidePartners && (
                  <th className="px-3 py-2.5 text-right">Đối tác</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => (
                <tr key={r.memberId} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                        i < 3
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/hoi-vien/${r.memberId}`}
                      className="font-medium text-slate-800 hover:text-navy-600"
                    >
                      {r.company}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {r.code} · {r.name}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-800">
                    {formatVnd(r.total)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-600">
                    {r.count}
                  </td>
                  {!hidePartners && (
                    <td className="px-3 py-2.5 text-right text-slate-600">
                      {r.partners}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </section>
  );
}
