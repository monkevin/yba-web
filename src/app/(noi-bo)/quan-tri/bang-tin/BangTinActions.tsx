"use client";

import { useActionState } from "react";
import { duyetBangTin, ghimBangTin, goBangTin, type KetQua } from "./actions";

export function NutDuyet({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(duyetBangTin, {});
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

export function NutGo({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(goBangTin, {});
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="btn-ghost py-1.5 text-do-600">
        {pending ? "..." : "Gỡ tin"}
      </button>
      {state.error && <span className="ml-2 text-xs text-do-600">{state.error}</span>}
    </form>
  );
}

export function NutGhim({ id, dangGhim }: { id: string; dangGhim: boolean }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(ghimBangTin, {});
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="btn-ghost py-1.5">
        {pending ? "..." : dangGhim ? "Bỏ ghim" : "Ghim"}
      </button>
      {state.error && <span className="ml-2 text-xs text-do-600">{state.error}</span>}
    </form>
  );
}
