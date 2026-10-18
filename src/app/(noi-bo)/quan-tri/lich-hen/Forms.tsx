"use client";

import { useActionState } from "react";
import { xuLyHen, xoaHen, TRANG_THAI_HEN, type KetQua } from "./actions";

export function FormXuLy({
  id,
  hienTai,
  ghiChu,
}: {
  id: string;
  hienTai: string;
  ghiChu: string | null;
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    xuLyHen,
    {}
  );

  return (
    <form action={formAction} className="flex flex-wrap items-start gap-2">
      <input type="hidden" name="id" value={id} />
      <select name="status" defaultValue={hienTai} className="inp w-auto">
        {TRANG_THAI_HEN.map((t) => (
          <option key={t.ma} value={t.ma}>
            {t.ten}
          </option>
        ))}
      </select>
      <input
        name="ghiChu"
        className="inp min-w-0 flex-1"
        defaultValue={ghiChu ?? ""}
        maxLength={500}
        placeholder="Ghi chú nội bộ: đã hẹn 14h thứ 5…"
      />
      <button type="submit" disabled={pending} className="btn-primary py-1.5">
        {pending ? "…" : "Lưu"}
      </button>
      {state.ok && <span className="text-xs text-emerald-600">{state.ok}</span>}
      {state.error && (
        <span className="text-xs text-do-600">{state.error}</span>
      )}
    </form>
  );
}

export function NutXoaHen({ id }: { id: string }) {
  const [, formAction, pending] = useActionState<KetQua, FormData>(xoaHen, {});

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Xoá đề nghị gặp này?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 px-2 text-sm text-do-600 hover:underline"
      >
        {pending ? "…" : "Xoá"}
      </button>
    </form>
  );
}
