"use client";

import { useActionState } from "react";
import { guiLienHe, type KetQua } from "../bieu-mau-actions";

export default function FormLienHe() {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    guiLienHe,
    {}
  );

  if (state.ok) {
    return (
      <div className="card p-10 text-center">
        <span className="text-5xl">✅</span>
        <h2 className="mt-4 text-lg font-bold text-navy-800">
          Đã gửi tin nhắn
        </h2>
        <p className="mx-auto mt-2 max-w-sm leading-relaxed text-slate-600">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="card space-y-4 p-6">
      <input
        type="text"
        name="website_khac"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <label className="block">
        <span className="lbl">Họ và tên *</span>
        <input name="name" className="inp" required autoComplete="name" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="lbl">Số điện thoại</span>
          <input name="phone" className="inp" inputMode="tel" autoComplete="tel" />
        </label>
        <label className="block">
          <span className="lbl">Email</span>
          <input name="email" type="email" className="inp" autoComplete="email" />
        </label>
      </div>
      <p className="-mt-2 text-xs text-slate-500">
        Để lại ít nhất một cách liên hệ để Chi hội phản hồi được.
      </p>

      <label className="block">
        <span className="lbl">Chủ đề</span>
        <input
          name="subject"
          className="inp"
          list="chu-de-goi-y"
          placeholder="Ví dụ: Hợp tác tổ chức sự kiện"
        />
        <datalist id="chu-de-goi-y">
          <option value="Đăng ký hội viên" />
          <option value="Hợp tác tổ chức sự kiện" />
          <option value="Tài trợ chương trình" />
          <option value="Xúc tiến thương mại" />
          <option value="Báo chí – truyền thông" />
        </datalist>
      </label>

      <label className="block">
        <span className="lbl">Nội dung *</span>
        <textarea name="message" rows={6} className="inp" required minLength={10} />
      </label>

      {state.error && (
        <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
          {state.error}
        </p>
      )}

      <button disabled={pending} className="btn-cta w-full">
        {pending ? "Đang gửi..." : "Gửi tin nhắn"}
      </button>
    </form>
  );
}
