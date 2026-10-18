"use client";

import { useActionState } from "react";
import { dangKyThamDu, type KetQua } from "./actions";

/** Biểu mẫu đăng ký tham dự sự kiện, mở cho cả khách ngoài Hội. */
export default function DangKyThamDu({
  eventId,
  conCho,
}: {
  eventId: string;
  conCho: number | null;
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    dangKyThamDu,
    {}
  );

  if (state.ok) {
    return (
      <div className="rounded-xl bg-emerald-50 p-5 text-center ring-1 ring-emerald-200">
        <span className="text-3xl">✅</span>
        <p className="mt-2 font-semibold text-emerald-800">Đã nhận đăng ký</p>
        <p className="mt-1 text-sm leading-relaxed text-emerald-700">
          {state.message}
        </p>
      </div>
    );
  }

  if (conCho !== null && conCho <= 0) {
    return (
      <p className="rounded-xl bg-slate-100 p-5 text-center text-sm text-slate-600">
        Sự kiện đã đủ số lượng đăng ký. Liên hệ Ban Sự kiện nếu anh/chị vẫn muốn
        tham dự.
      </p>
    );
  }

  return (
    <form action={formAction} className="card space-y-3 p-5">
      <h2 className="font-bold text-navy-800">Đăng ký tham dự</h2>
      {conCho !== null && (
        <p className="text-sm text-slate-500">Còn {conCho} chỗ.</p>
      )}
      <input type="hidden" name="eventId" value={eventId} />

      <label className="block">
        <span className="lbl">Họ và tên *</span>
        <input name="name" className="inp" required />
      </label>
      <label className="block">
        <span className="lbl">Số điện thoại *</span>
        <input name="phone" className="inp" required inputMode="tel" />
      </label>
      <label className="block">
        <span className="lbl">Doanh nghiệp</span>
        <input name="company" className="inp" />
      </label>
      <label className="block">
        <span className="lbl">Email</span>
        <input name="email" type="email" className="inp" />
      </label>
      <label className="block">
        <span className="lbl">Ghi chú</span>
        <textarea name="note" rows={2} className="inp" />
      </label>

      <button disabled={pending} className="btn-cta w-full">
        {pending ? "Đang gửi..." : "Gửi đăng ký"}
      </button>
      {state.error && <p className="text-sm text-do-600">{state.error}</p>}
      <p className="text-xs leading-relaxed text-slate-500">
        Ban Sự kiện sẽ liên hệ xác nhận. Thông tin chỉ dùng cho sự kiện này.
      </p>
    </form>
  );
}
