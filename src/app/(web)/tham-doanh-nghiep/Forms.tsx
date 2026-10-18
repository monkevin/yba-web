"use client";

import { useActionState, useState } from "react";
import { moiDenTham, dangKyTham, type KetQuaTham } from "./actions";

function O({
  label,
  batBuoc,
  goiY,
  children,
}: {
  label: string;
  batBuoc?: boolean;
  goiY?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {batBuoc && <span className="ml-0.5 text-do-600">*</span>}
      </span>
      <div className="mt-1">{children}</div>
      {goiY && <span className="mt-1 block text-xs text-slate-500">{goiY}</span>}
    </label>
  );
}

function Xong({ noiDung }: { noiDung: string }) {
  return (
    <div className="rounded-2xl bg-emerald-50 p-6 text-center">
      <span className="text-4xl">✅</span>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-emerald-800">
        {noiDung}
      </p>
    </div>
  );
}

/** Hội viên mời Chi hội tới thăm doanh nghiệp mình. */
export function FormMoiDenTham({
  banDau,
}: {
  banDau: { company: string; diaChi: string } | null;
}) {
  const [mo, datMo] = useState(false);
  const [state, formAction, pending] = useActionState<KetQuaTham, FormData>(
    moiDenTham,
    {}
  );

  if (state.ok) return <Xong noiDung={state.ok} />;

  if (!mo) {
    return (
      <button type="button" onClick={() => datMo(true)} className="btn-primary">
        Mời Chi hội đến thăm doanh nghiệp tôi
      </button>
    );
  }

  const mai = new Date();
  mai.setDate(mai.getDate() + 7);

  return (
    <form action={formAction} className="card space-y-4 p-5">
      <h3 className="font-bold text-navy-800">
        Mời Chi hội đến thăm {banDau?.company ?? "doanh nghiệp của anh/chị"}
      </h3>

      {state.error && (
        <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
          {state.error}
        </p>
      )}

      <O
        label="Tiêu đề chuyến thăm"
        batBuoc
        goiY="Ví dụ: Tham quan nhà máy sản xuất bao bì Minh Chất"
      >
        <input name="tieuDe" className="inp" required maxLength={150} />
      </O>

      <O label="Giới thiệu ngắn về doanh nghiệp">
        <textarea name="gioiThieu" rows={3} className="inp" maxLength={1000} />
      </O>

      <O
        label="Anh/chị muốn chia sẻ gì với đoàn"
        goiY="Ví dụ: quy trình sản xuất, cách quản trị kho, kinh nghiệm xuất khẩu."
      >
        <textarea name="noiDungTham" rows={3} className="inp" maxLength={1000} />
      </O>

      <O label="Địa chỉ đón đoàn">
        <input
          name="diaChi"
          className="inp"
          maxLength={200}
          defaultValue={banDau?.diaChi ?? ""}
        />
      </O>

      <div className="grid gap-4 sm:grid-cols-2">
        <O label="Ngày mong muốn">
          <input
            type="date"
            name="ngayMongMuon"
            className="inp"
            min={mai.toISOString().slice(0, 10)}
          />
        </O>
        <O label="Đón được tối đa bao nhiêu người">
          <input
            type="number"
            name="soLuongToiDa"
            className="inp"
            min={1}
            max={500}
            placeholder="Để trống nếu không giới hạn"
          />
        </O>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Đang gửi…" : "Gửi lời mời"}
        </button>
        <button type="button" onClick={() => datMo(false)} className="btn-ghost">
          Huỷ
        </button>
      </div>
    </form>
  );
}

/** Hội viên đăng ký đi cùng đoàn. */
export function FormDangKyTham({
  thamId,
  banDau,
  conCho,
}: {
  thamId: string;
  banDau: { name: string; phone: string; company: string } | null;
  conCho: number | null;
}) {
  const [state, formAction, pending] = useActionState<KetQuaTham, FormData>(
    dangKyTham,
    {}
  );

  if (state.ok) return <Xong noiDung={state.ok} />;

  if (conCho === 0) {
    return (
      <div className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm text-slate-600">
        Chuyến này đã đủ người đăng ký.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="thamId" value={thamId} />

      {state.error && (
        <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
          {state.error}
        </p>
      )}

      <O label="Họ và tên" batBuoc>
        <input
          name="name"
          className="inp"
          required
          maxLength={60}
          defaultValue={banDau?.name ?? ""}
        />
      </O>
      <O label="Số điện thoại" batBuoc>
        <input
          name="phone"
          type="tel"
          className="inp"
          required
          maxLength={20}
          defaultValue={banDau?.phone ?? ""}
        />
      </O>
      <O label="Doanh nghiệp">
        <input
          name="company"
          className="inp"
          maxLength={120}
          defaultValue={banDau?.company ?? ""}
        />
      </O>
      <div className="grid gap-3 sm:grid-cols-2">
        <O label="Số người đi">
          <input
            type="number"
            name="soNguoi"
            className="inp"
            min={1}
            max={20}
            defaultValue={1}
          />
        </O>
        <O label="Ghi chú">
          <input name="ghiChu" className="inp" maxLength={200} />
        </O>
      </div>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Đang gửi…" : "Đăng ký tham gia"}
      </button>
      {conCho !== null && (
        <p className="text-center text-xs text-slate-500">Còn {conCho} chỗ</p>
      )}
    </form>
  );
}
