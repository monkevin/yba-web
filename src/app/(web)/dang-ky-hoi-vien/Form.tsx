"use client";

import Link from "next/link";
import { useActionState } from "react";
import { guiDangKyHoiVien, type KetQua } from "../bieu-mau-actions";

export default function FormDangKy({
  nganhNghe,
}: {
  nganhNghe: { name: string }[];
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    guiDangKyHoiVien,
    {}
  );

  if (state.ok) {
    return (
      <div className="card p-10 text-center">
        <span className="text-5xl">🎉</span>
        <h2 className="mt-4 text-xl font-bold text-navy-800">
          Đã nhận hồ sơ của anh/chị
        </h2>
        <p className="mx-auto mt-2 max-w-md leading-relaxed text-slate-600">
          {state.message}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link href="/doanh-nghiep" className="btn-primary">
            Xem danh bạ doanh nghiệp
          </Link>
          <Link href="/su-kien" className="btn-ghost">
            Xem sự kiện Chi hội
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="card space-y-4 p-6">
      {/* Bẫy chống máy gửi tự động — người dùng không nhìn thấy ô này */}
      <input
        type="text"
        name="website_khac"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="lbl">Họ và tên *</span>
          <input name="name" className="inp" required autoComplete="name" />
        </label>
        <label className="block">
          <span className="lbl">Số điện thoại *</span>
          <input
            name="phone"
            className="inp"
            required
            inputMode="tel"
            autoComplete="tel"
          />
        </label>
        <label className="block">
          <span className="lbl">Email</span>
          <input name="email" type="email" className="inp" autoComplete="email" />
        </label>
        <label className="block">
          <span className="lbl">Chức vụ</span>
          <input
            name="position"
            className="inp"
            placeholder="Ví dụ: Giám đốc"
          />
        </label>
      </div>

      <label className="block">
        <span className="lbl">Tên doanh nghiệp *</span>
        <input name="company" className="inp" required />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="lbl">Ngành nghề</span>
          <input name="industry" className="inp" list="nganh-nghe-goi-y" />
          <datalist id="nganh-nghe-goi-y">
            {nganhNghe.map((c) => (
              <option key={c.name} value={c.name} />
            ))}
          </datalist>
        </label>
        <label className="block">
          <span className="lbl">Website</span>
          <input name="website" className="inp" placeholder="tencongty.vn" />
        </label>
      </div>

      <label className="block">
        <span className="lbl">Địa chỉ doanh nghiệp</span>
        <input name="address" className="inp" />
      </label>

      <label className="block">
        <span className="lbl">Người trong Hội giới thiệu</span>
        <input
          name="referrer"
          className="inp"
          placeholder="Nếu có anh/chị hội viên giới thiệu, ghi tên tại đây"
        />
      </label>

      <label className="block">
        <span className="lbl">Anh/chị mong muốn gì khi tham gia Chi hội?</span>
        <textarea name="note" rows={4} className="inp" />
      </label>

      {state.error && (
        <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
          {state.error}
        </p>
      )}

      <button disabled={pending} className="btn-cta w-full">
        {pending ? "Đang gửi..." : "Gửi hồ sơ đăng ký"}
      </button>
      <p className="text-center text-xs leading-relaxed text-slate-500">
        Thông tin chỉ dùng để Ban Hội viên liên hệ, không công khai trên website.
      </p>
    </form>
  );
}
