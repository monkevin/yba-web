"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { guiQuanTam, type KetQua } from "./actions";

/**
 * Nút "Tôi quan tâm". Khách vãng lai được mời đăng nhập; hội viên gửi kèm được
 * một lời nhắn ngắn.
 */
export default function QuanTam({
  listingId,
  slug,
  daDangNhap,
  laTinCuaMinh,
  daQuanTam,
}: {
  listingId: string;
  slug: string;
  daDangNhap: boolean;
  laTinCuaMinh: boolean;
  daQuanTam: boolean;
}) {
  const [mo, setMo] = useState(false);
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    guiQuanTam,
    {}
  );

  if (laTinCuaMinh) {
    return (
      <div className="rounded-xl bg-navy-50 p-4 text-center text-sm text-slate-600">
        Đây là tin của doanh nghiệp anh/chị.
        <Link
          href="/tai-khoan/tin-dang"
          className="mt-3 block font-semibold text-navy-700 hover:underline"
        >
          Quản lý tin đăng & xem ai quan tâm →
        </Link>
      </div>
    );
  }

  if (!daDangNhap) {
    return (
      <div className="rounded-xl bg-navy-50 p-4 text-center">
        <p className="text-sm leading-relaxed text-slate-600">
          Đăng nhập bằng tài khoản hội viên để xem liên hệ và gửi quan tâm tới
          doanh nghiệp đăng tin.
        </p>
        <Link href={`/login?tiep=/giao-thuong/${slug}`} className="btn-primary mt-4 w-full">
          Đăng nhập để liên hệ
        </Link>
      </div>
    );
  }

  if (state.ok) {
    return (
      <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
        {state.message}
      </p>
    );
  }

  if (daQuanTam) {
    return (
      <p className="rounded-xl bg-emerald-50 p-4 text-center text-sm text-emerald-800 ring-1 ring-emerald-200">
        Anh/chị đã gửi quan tâm tin này. Doanh nghiệp đăng tin sẽ liên hệ lại.
      </p>
    );
  }

  if (!mo) {
    return (
      <button onClick={() => setMo(true)} className="btn-cta w-full">
        Tôi quan tâm
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="listingId" value={listingId} />
      <label className="block">
        <span className="lbl">Lời nhắn (không bắt buộc)</span>
        <textarea
          name="message"
          rows={3}
          className="inp"
          autoFocus
          placeholder="Ví dụ: Bên em cần 2 tấn/tháng, xin báo giá giúp."
        />
      </label>
      <div className="flex gap-2">
        <button disabled={pending} className="btn-cta flex-1">
          {pending ? "Đang gửi..." : "Gửi quan tâm"}
        </button>
        <button type="button" onClick={() => setMo(false)} className="btn-ghost">
          Huỷ
        </button>
      </div>
      {state.error && <p className="text-sm text-do-600">{state.error}</p>}
    </form>
  );
}
