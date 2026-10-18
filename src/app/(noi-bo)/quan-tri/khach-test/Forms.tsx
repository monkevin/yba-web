"use client";

import { useActionState, useState } from "react";
import { doiTrangThai, luuGhiChu, xoaKhach, type KetQua } from "./actions";

export function NutDaLienHe({ id, daXuLy }: { id: string; daXuLy: boolean }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    doiTrangThai,
    {}
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className={`min-h-11 rounded-lg px-3 py-1.5 text-sm font-medium ring-1 transition ${
          daXuLy
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100"
            : "bg-white text-slate-600 ring-navy-100 hover:bg-navy-50"
        }`}
      >
        {pending ? "…" : daXuLy ? "✓ Đã liên hệ" : "Đánh dấu đã liên hệ"}
      </button>
      {state.error && (
        <span className="ml-2 text-xs text-do-600">{state.error}</span>
      )}
    </form>
  );
}

export function OGhiChu({ id, banDau }: { id: string; banDau: string | null }) {
  const [mo, datMo] = useState(false);
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    luuGhiChu,
    {}
  );

  if (!mo) {
    return (
      <button
        type="button"
        onClick={() => datMo(true)}
        className="text-sm text-navy-600 hover:text-do-600"
      >
        {banDau ? `📝 ${banDau}` : "+ Thêm ghi chú"}
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-start gap-2">
      <input type="hidden" name="id" value={id} />
      <input
        name="ghiChu"
        className="inp min-w-0 flex-1"
        defaultValue={banDau ?? ""}
        maxLength={500}
        placeholder="Ví dụ: đã gọi, hẹn gặp tuần sau"
      />
      <button type="submit" disabled={pending} className="btn-primary py-1.5">
        {pending ? "…" : "Lưu"}
      </button>
      <button
        type="button"
        onClick={() => datMo(false)}
        className="btn-ghost py-1.5"
      >
        Đóng
      </button>
      {state.ok && <span className="text-xs text-emerald-600">{state.ok}</span>}
    </form>
  );
}

export function NutXoaKhach({ id }: { id: string }) {
  const [, formAction, pending] = useActionState<KetQua, FormData>(xoaKhach, {});

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Xoá dữ liệu của khách này? Không khôi phục được.")) {
          e.preventDefault();
        }
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
