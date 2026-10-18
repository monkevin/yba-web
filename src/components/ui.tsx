import Link from "next/link";
import { STATUS_CLASS, STATUS_LABEL, type DealStatus } from "@/lib/deal";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";

export function StatCard({
  label,
  value,
  hint,
  tone = "slate",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "slate" | "navy" | "emerald" | "amber";
}) {
  const tones = {
    slate: "text-slate-800",
    navy: "text-navy-700",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
  } as const;

  return (
    <div className="card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = status as DealStatus;
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
        STATUS_CLASS[s] ?? "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      {STATUS_LABEL[s] ?? status}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-4 py-10 text-center text-sm text-slate-500">{text}</div>
  );
}

export function MemberLink({
  member,
}: {
  member: { id: string; name: string; company: string };
}) {
  return (
    <Link
      href={`/hoi-vien/${member.id}`}
      className="font-medium text-slate-800 hover:text-navy-600"
    >
      {tenDoanhNghiep(member.company)}
      <span className="block text-xs font-normal text-slate-500">
        {member.name}
      </span>
    </Link>
  );
}
