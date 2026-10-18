"use client";

import { useActionState, useState } from "react";
import { dangKyTaiTro, type KetQuaTaiTro } from "./actions";

export type GoiChon = {
  id: string;
  ten: string;
  soTien: number;
  duAn: string | null;
};

/** Số tiền dạng "100 triệu" cho dễ đọc. */
function trieu(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(".0", "")} tỷ`;
  return `${Math.round(n / 1_000_000)} triệu`;
}

export default function FormTaiTro({
  goi,
  chonSan,
  banDau,
}: {
  goi: GoiChon[];
  chonSan?: string;
  banDau?: { name: string; phone: string; company: string; email: string } | null;
}) {
  const [state, formAction, pending] = useActionState<KetQuaTaiTro, FormData>(
    dangKyTaiTro,
    {}
  );
  const [chon, datChon] = useState(chonSan ?? "");

  if (state.ok) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-6 text-center">
        <span className="text-4xl">🤝</span>
        <h3 className="mt-3 font-bold text-emerald-800">
          Đã ghi nhận đăng ký
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-emerald-800">
          {state.ok}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded-lg bg-do-50 px-4 py-3 text-sm text-do-700">
          {state.error}
        </p>
      )}

      <O label="Gói tài trợ">
        <select
          name="goiId"
          className="inp"
          value={chon}
          onChange={(e) => datChon(e.target.value)}
        >
          <option value="">Tôi muốn tự đề xuất mức đóng góp</option>
          {goi.map((g) => (
            <option key={g.id} value={g.id}>
              {g.duAn ? `${g.duAn} — ` : ""}
              {g.ten} · {trieu(g.soTien)}
            </option>
          ))}
        </select>
      </O>

      {!chon && (
        <O label="Mức đóng góp dự kiến" goiY="Đơn vị: triệu đồng.">
          <input
            name="soTien"
            type="number"
            min={1}
            className="inp"
            placeholder="Ví dụ: 20"
          />
        </O>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <O label="Doanh nghiệp">
          <input
            name="company"
            className="inp"
            maxLength={120}
            defaultValue={banDau?.company ?? ""}
          />
        </O>
        <O label="Email">
          <input
            name="email"
            type="email"
            className="inp"
            maxLength={120}
            defaultValue={banDau?.email ?? ""}
          />
        </O>
      </div>

      <O label="Lời nhắn cho Ban Chủ nhiệm">
        <textarea name="loiNhan" rows={3} className="inp" maxLength={800} />
      </O>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Đang gửi…" : "Đăng ký đồng hành"}
      </button>

      <p className="text-xs leading-relaxed text-slate-500">
        Website không thu tiền trực tuyến. Sau khi nhận đăng ký, Ban Tài trợ sẽ
        liên hệ để thống nhất nội dung và làm thủ tục chính thức.
      </p>
    </form>
  );
}

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
