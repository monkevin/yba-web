import { formatShortVnd } from "@/lib/format";

/** Biểu đồ cột đơn giản bằng SVG — không cần thư viện, chạy được ở server component. */
export default function BarChart({
  data,
}: {
  data: { label: string; total: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-slate-500">
        Chưa có dữ liệu trong kỳ.
      </p>
    );
  }

  const max = Math.max(...data.map((d) => d.total), 1);
  const barW = 100 / data.length;

  return (
    <div className="p-4">
      <svg viewBox="0 0 100 44" className="w-full" preserveAspectRatio="none">
        {data.map((d, i) => {
          const h = (d.total / max) * 34;
          return (
            <rect
              key={d.label + i}
              x={i * barW + barW * 0.2}
              y={36 - h}
              width={barW * 0.6}
              height={Math.max(h, 0.4)}
              rx={0.6}
              className="fill-navy-500"
            />
          );
        })}
      </svg>
      <div
        className="grid gap-1 text-center"
        style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0,1fr))` }}
      >
        {data.map((d, i) => (
          <div key={d.label + i} className="min-w-0">
            <div className="truncate text-[11px] font-medium text-slate-700">
              {formatShortVnd(d.total)}
            </div>
            <div className="text-[11px] text-slate-400">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
