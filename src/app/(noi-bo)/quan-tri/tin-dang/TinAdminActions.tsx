"use client";

import { useActionState, useState } from "react";
import { doiCheDoDuyet, doiGhim, duyetTin, goTin, type KetQua } from "./actions";

export function NutDuyetTin({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    duyetTin,
    {}
  );
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="btn-primary py-1.5">
        {pending ? "..." : "Duyệt"}
      </button>
      {state.error && <span className="ml-2 text-xs text-do-600">{state.error}</span>}
    </form>
  );
}

export function NutGoTin({ id }: { id: string }) {
  const [mo, setMo] = useState(false);
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    async (prev, fd) => {
      const kq = await goTin(prev, fd);
      if (kq.ok) setMo(false);
      return kq;
    },
    {}
  );

  if (!mo) {
    return (
      <button onClick={() => setMo(true)} className="btn-ghost py-1.5 text-do-600">
        Gỡ tin
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 w-full space-y-2">
      <input type="hidden" name="id" value={id} />
      <input
        name="lyDo"
        className="inp"
        autoFocus
        placeholder="Lý do gỡ — ví dụ: nội dung không liên quan giao thương"
      />
      <div className="flex items-center gap-2">
        <button disabled={pending} className="btn-danger py-1.5">
          {pending ? "..." : "Gỡ tin"}
        </button>
        <button type="button" onClick={() => setMo(false)} className="btn-ghost py-1.5">
          Huỷ
        </button>
        {state.error && <span className="text-xs text-do-600">{state.error}</span>}
      </div>
    </form>
  );
}

export function NutGhim({ id, dangGhim }: { id: string; dangGhim: boolean }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    doiGhim,
    {}
  );
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        disabled={pending}
        title="Ghim tin lên đầu chợ nhu cầu"
        className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
          dangGhim
            ? "bg-vang-500 text-white hover:bg-vang-600"
            : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        {pending ? "..." : dangGhim ? "📌 Đã ghim" : "📌 Ghim"}
      </button>
      {state.error && <span className="ml-2 text-xs text-do-600">{state.error}</span>}
    </form>
  );
}

export function CheDoDuyet({ dangBat }: { dangBat: boolean }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    doiCheDoDuyet,
    {}
  );

  return (
    <div className="card mb-4 flex flex-wrap items-center justify-between gap-4 p-4">
      <div>
        <p className="font-semibold text-navy-800">
          {dangBat
            ? "Tin mới phải được duyệt mới hiển thị"
            : "Hội viên đăng tin là hiển thị ngay"}
        </p>
        <p className="mt-0.5 text-sm text-slate-600">
          {dangBat
            ? "An toàn hơn nhưng hội viên phải chờ. Hợp khi chợ có nhiều tin không phù hợp."
            : "Chợ chạy nhanh, hội viên thấy kết quả ngay. Ban Chủ nhiệm gỡ tin sau nếu cần."}
        </p>
      </div>
      <form action={formAction}>
        <input type="hidden" name="bat" value={dangBat ? "0" : "1"} />
        <button disabled={pending} className="btn-ghost">
          {pending
            ? "..."
            : dangBat
              ? "Chuyển sang đăng là hiện ngay"
              : "Chuyển sang bắt buộc duyệt"}
        </button>
        {state.error && <p className="mt-1 text-xs text-do-600">{state.error}</p>}
      </form>
    </div>
  );
}
