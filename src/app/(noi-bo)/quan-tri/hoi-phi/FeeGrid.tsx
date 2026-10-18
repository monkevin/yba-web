"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { toggleFee, toggleExempt } from "./actions";

export type FeeRow = {
  id: string;
  code: string;
  name: string;
  company: string;
  feeExempt: boolean;
  paidYears: number[];
};

export default function FeeGrid({
  rows,
  years,
}: {
  rows: FeeRow[];
  years: number[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyCell, setBusyCell] = useState("");

  function flip(memberId: string, year: number) {
    setBusyCell(`${memberId}-${year}`);
    startTransition(async () => {
      await toggleFee(memberId, year);
      router.refresh();
      setBusyCell("");
    });
  }

  function flipExempt(memberId: string) {
    startTransition(async () => {
      await toggleExempt(memberId);
      router.refresh();
    });
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5 text-left">
                Hội viên
              </th>
              {years.map((y) => (
                <th key={y} className="px-2 py-2.5 text-center">
                  {y}
                </th>
              ))}
              <th className="px-3 py-2.5 text-center">Miễn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const paid = new Set(r.paidYears);
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2 hover:bg-slate-50">
                    <Link
                      href={`/hoi-vien/${r.id}`}
                      className="font-medium text-slate-800 hover:text-navy-600"
                    >
                      {r.name}
                    </Link>
                    <div className="max-w-[220px] truncate text-xs text-slate-400">
                      {r.company}
                    </div>
                  </td>
                  {years.map((y) => {
                    const isPaid = paid.has(y);
                    const cellKey = `${r.id}-${y}`;
                    return (
                      <td key={y} className="px-2 py-2 text-center">
                        <button
                          disabled={pending || r.feeExempt}
                          onClick={() => flip(r.id, y)}
                          title={r.feeExempt ? "Đã miễn hội phí" : isPaid ? "Đã đóng — bấm để bỏ" : "Chưa đóng — bấm để đánh dấu"}
                          className={`h-6 w-6 rounded-md text-xs font-bold transition disabled:opacity-40 ${
                            busyCell === cellKey
                              ? "bg-slate-200 text-slate-400"
                              : r.feeExempt
                                ? "bg-slate-100 text-slate-300"
                                : isPaid
                                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                  : "bg-slate-100 text-slate-300 hover:bg-slate-200"
                          }`}
                        >
                          {isPaid ? "✓" : ""}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={r.feeExempt}
                      disabled={pending}
                      onChange={() => flipExempt(r.id)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-slate-500">
          Không có hội viên nào khớp bộ lọc.
        </p>
      )}
    </div>
  );
}
