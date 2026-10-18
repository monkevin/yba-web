"use client";

import { useActionState, useState } from "react";
import { doiNoiBat, duyetHoSo, traHoSo, type KetQua } from "./actions";

export function NutDuyet({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    duyetHoSo,
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

export function NutTra({ id }: { id: string }) {
  const [mo, setMo] = useState(false);
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    async (prev, fd) => {
      const kq = await traHoSo(prev, fd);
      if (kq.ok) setMo(false);
      return kq;
    },
    {}
  );

  if (!mo) {
    return (
      <button onClick={() => setMo(true)} className="btn-ghost py-1.5 text-do-600">
        Trả lại
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
        placeholder="Lý do trả lại — ví dụ: ảnh bìa bị mờ, thiếu giới thiệu"
      />
      <div className="flex items-center gap-2">
        <button disabled={pending} className="btn-danger py-1.5">
          {pending ? "..." : "Trả hồ sơ"}
        </button>
        <button type="button" onClick={() => setMo(false)} className="btn-ghost py-1.5">
          Huỷ
        </button>
        {state.error && <span className="text-xs text-do-600">{state.error}</span>}
      </div>
    </form>
  );
}

export function NutNoiBat({ id, dangBat }: { id: string; dangBat: boolean }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    doiNoiBat,
    {}
  );
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        disabled={pending}
        title="Doanh nghiệp tiêu biểu hiện ở trang chủ"
        className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
          dangBat
            ? "bg-vang-500 text-white hover:bg-vang-600"
            : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        {pending ? "..." : dangBat ? "★ Trang chủ" : "☆ Trang chủ"}
      </button>
      {state.error && <span className="ml-2 text-xs text-do-600">{state.error}</span>}
    </form>
  );
}
