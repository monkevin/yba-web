"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { approveMany } from "./actions";
import { StatusBadge } from "@/components/ui";
import { formatDate, formatVnd } from "@/lib/format";
import { DEAL_STATUS } from "@/lib/deal";

export type DealRow = {
  id: string;
  code: string;
  dealDate: string;
  amount: number;
  status: string;
  sellerCompany: string;
  buyerCompany: string;
  referrerCompany: string | null;
};

export default function DealTable({
  rows,
  canApprove,
}: {
  rows: DealRow[];
  canApprove: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const approvable = rows.filter((r) => r.status === DEAL_STATUS.CHO_DUYET);
  const allChecked =
    approvable.length > 0 && selected.length === approvable.length;

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function submitApprove() {
    setError("");
    startTransition(async () => {
      const res = await approveMany(selected);
      if (res.error) setError(res.error);
      else {
        setSelected([]);
        router.refresh();
      }
    });
  }

  return (
    <div className="card overflow-hidden">
      {canApprove && selected.length > 0 && (
        <div className="flex items-center gap-3 border-b border-slate-200 bg-navy-50 px-4 py-2.5">
          <span className="text-sm text-navy-800">
            Đã chọn {selected.length} giao dịch
          </span>
          <button
            onClick={submitApprove}
            disabled={pending}
            className="btn-primary ml-auto py-1.5"
          >
            {pending ? "Đang duyệt..." : "Duyệt tất cả"}
          </button>
          <button onClick={() => setSelected([])} className="btn-ghost py-1.5">
            Bỏ chọn
          </button>
        </div>
      )}
      {error && (
        <p className="border-b border-do-200 bg-do-50 px-4 py-2 text-sm text-do-700">
          {error}
        </p>
      )}

      {/* ── Điện thoại: dạng thẻ, không bắt kéo ngang ──────────── */}
      <ul className="divide-y divide-slate-100 sm:hidden">
        {rows.map((r) => (
          <li key={r.id} className="p-4">
            <div className="flex items-start gap-3">
              {canApprove && r.status === DEAL_STATUS.CHO_DUYET && (
                <input
                  type="checkbox"
                  checked={selected.includes(r.id)}
                  onChange={() => toggle(r.id)}
                  className="mt-1 h-4 w-4 shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/giao-dich/${r.id}`}
                    className="font-mono text-xs font-medium text-navy-600 hover:underline"
                  >
                    {r.code}
                  </Link>
                  <StatusBadge status={r.status} />
                </div>

                <p className="mt-2 text-sm leading-relaxed text-slate-800">
                  <span className="text-slate-500">Bán:</span> {r.sellerCompany}
                  <br />
                  <span className="text-slate-500">Mua:</span> {r.buyerCompany}
                </p>
                {r.referrerCompany && (
                  <p className="mt-1 text-sm text-slate-500">
                    Giới thiệu: {r.referrerCompany}
                  </p>
                )}

                <p className="mt-2 flex flex-wrap items-baseline gap-2">
                  <span className="text-base font-bold text-navy-700">
                    {formatVnd(r.amount)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDate(r.dealDate)}
                  </span>
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* ── Máy tính: bảng đầy đủ ──────────────────────────────── */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {canApprove && (
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked ? approvable.map((r) => r.id) : []
                      )
                    }
                    disabled={approvable.length === 0}
                  />
                </th>
              )}
              <th className="px-3 py-2.5">Mã / Ngày</th>
              <th className="px-3 py-2.5">Bên bán</th>
              <th className="px-3 py-2.5">Bên mua</th>
              <th className="px-3 py-2.5">Giới thiệu</th>
              <th className="px-3 py-2.5 text-right">Giá trị</th>
              <th className="px-3 py-2.5">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                {canApprove && (
                  <td className="px-3 py-2.5">
                    {r.status === DEAL_STATUS.CHO_DUYET && (
                      <input
                        type="checkbox"
                        checked={selected.includes(r.id)}
                        onChange={() => toggle(r.id)}
                      />
                    )}
                  </td>
                )}
                <td className="px-3 py-2.5">
                  <Link
                    href={`/giao-dich/${r.id}`}
                    className="font-mono text-xs font-medium text-navy-600 hover:underline"
                  >
                    {r.code}
                  </Link>
                  <div className="text-xs text-slate-400">
                    {formatDate(r.dealDate)}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-slate-800">{r.sellerCompany}</td>
                <td className="px-3 py-2.5 text-slate-800">{r.buyerCompany}</td>
                <td className="px-3 py-2.5 text-slate-500">
                  {r.referrerCompany ?? "—"}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold text-slate-800">
                  {formatVnd(r.amount)}
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-slate-500">
          Không có giao dịch nào khớp bộ lọc.
        </p>
      )}
    </div>
  );
}
