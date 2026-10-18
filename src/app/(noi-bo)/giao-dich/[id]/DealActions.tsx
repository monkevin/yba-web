"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { approveDeal, cancelDeal, confirmDeal, rejectDeal } from "../actions";

export default function DealActions({
  dealId,
  canConfirm,
  canReview,
  canCancel,
}: {
  dealId: string;
  canConfirm: boolean;
  canReview: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  function run(fn: () => Promise<{ error?: string }>) {
    setError("");
    startTransition(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  if (!canConfirm && !canReview && !canCancel) return null;

  return (
    <div className="card p-4">
      <h2 className="mb-3 font-semibold text-slate-800">Thao tác</h2>

      {error && (
        <p className="mb-3 rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {canConfirm && (
          <button
            disabled={pending}
            onClick={() => run(() => confirmDeal(dealId))}
            className="btn-primary"
          >
            ✓ Xác nhận đơn này đúng
          </button>
        )}
        {canReview && (
          <>
            <button
              disabled={pending}
              onClick={() => run(() => approveDeal(dealId))}
              className="btn-primary"
            >
              ✓ Duyệt ghi nhận
            </button>
            <button
              disabled={pending}
              onClick={() => setRejecting((v) => !v)}
              className="btn-ghost"
            >
              Từ chối
            </button>
          </>
        )}
        {canCancel && (
          <button
            disabled={pending}
            onClick={() => {
              if (confirm("Huỷ giao dịch này?")) run(() => cancelDeal(dealId));
            }}
            className="btn-ghost"
          >
            Huỷ đơn
          </button>
        )}
      </div>

      {rejecting && (
        <div className="mt-3 space-y-2">
          <label className="lbl">Lý do từ chối</label>
          <textarea
            rows={2}
            className="inp"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: giá trị đơn chưa khớp với chứng từ"
          />
          <button
            disabled={pending}
            onClick={() => run(() => rejectDeal(dealId, reason))}
            className="btn-danger"
          >
            Xác nhận từ chối
          </button>
        </div>
      )}
    </div>
  );
}
