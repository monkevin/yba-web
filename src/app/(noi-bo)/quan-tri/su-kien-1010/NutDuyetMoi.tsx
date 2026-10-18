"use client";

import { useActionState } from "react";
import { duyetVaTaoThuMoi, type KetQuaNTT } from "./actions";

/**
 * Nút "Duyệt → tạo thư mời" trên từng dòng đăng ký tham dự tự do: duyệt
 * đăng ký + tạo thư mời riêng với suất mời đúng các phiên đã đăng ký.
 */
export default function NutDuyetMoi({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<KetQuaNTT, FormData>(
    duyetVaTaoThuMoi,
    {}
  );
  return (
    <form action={formAction} className="inline-block">
      <input type="hidden" name="id" value={id} />
      <button
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-emerald-700"
        title="Duyệt đăng ký và tạo thư mời riêng — suất mời đúng các phiên khách đã đăng ký"
      >
        {pending ? "…" : "✓ Duyệt → tạo thư mời"}
      </button>
      {state.ok && (
        <span className="mt-1 block max-w-xs text-xs leading-snug text-emerald-700">
          {state.ok}
        </span>
      )}
      {state.error && (
        <span className="mt-1 block text-xs text-do-600">{state.error}</span>
      )}
    </form>
  );
}
