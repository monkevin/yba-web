"use client";

import { useActionState, useState } from "react";
import { dangKyHoatDong, type KetQuaDangKy } from "./actions";

export type HoiVienSan = {
  name: string;
  phone: string;
  email: string;
  company: string;
  chucVu: string;
} | null;

const MUC_TAI_TRO = ["Kim cương", "Vàng", "Bạc", "Đồng", "Đồng hành"];

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

/**
 * Đăng ký tham gia hoặc tài trợ một hoạt động.
 * Hội viên đã đăng nhập thì mọi ô đã điền sẵn, chỉ cần bấm gửi.
 */
export default function FormDangKy({
  lichId,
  hoiVien,
  conCho,
  hetHan,
}: {
  lichId: string;
  hoiVien: HoiVienSan;
  /** null = không giới hạn số lượng */
  conCho: number | null;
  hetHan: boolean;
}) {
  const [state, formAction, pending] = useActionState<KetQuaDangKy, FormData>(
    dangKyHoatDong,
    {}
  );
  const [loai, datLoai] = useState<"THAM_GIA" | "TAI_TRO">("THAM_GIA");

  if (state.ok) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-6 text-center">
        <span className="text-4xl">✅</span>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-emerald-800">
          {state.ok}
        </p>
      </div>
    );
  }

  if (hetHan) {
    return (
      <div className="rounded-xl bg-slate-100 px-4 py-4 text-center text-sm text-slate-600">
        Đã hết hạn đăng ký cho hoạt động này. Anh/chị liên hệ Ban Tổ chức nếu vẫn
        muốn tham gia.
      </div>
    );
  }

  if (conCho === 0 && loai === "THAM_GIA") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl bg-slate-100 px-4 py-4 text-center text-sm text-slate-600">
          Hoạt động đã đủ số lượng đăng ký tham gia.
        </div>
        <button
          type="button"
          onClick={() => datLoai("TAI_TRO")}
          className="btn-ghost w-full"
        >
          Tôi vẫn muốn đăng ký tài trợ →
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="lichId" value={lichId} />
      <input type="hidden" name="loai" value={loai} />

      {/* Chọn tham gia hay tài trợ */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-navy-50 p-1">
        {(
          [
            ["THAM_GIA", "🙋 Tham gia"],
            ["TAI_TRO", "🤝 Tài trợ"],
          ] as const
        ).map(([k, nhan]) => (
          <button
            key={k}
            type="button"
            onClick={() => datLoai(k)}
            className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              loai === k
                ? "bg-navy-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-white"
            }`}
          >
            {nhan}
          </button>
        ))}
      </div>

      {state.error && (
        <p className="rounded-lg bg-do-50 px-4 py-3 text-sm text-do-700">
          {state.error}
        </p>
      )}

      {hoiVien && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-800">
          Thông tin của anh/chị đã được điền sẵn từ hồ sơ hội viên — sửa lại nếu
          cần rồi bấm gửi.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <O label="Họ và tên" batBuoc>
          <input
            name="name"
            className="inp"
            required
            maxLength={60}
            defaultValue={hoiVien?.name ?? ""}
          />
        </O>
        <O label="Số điện thoại" batBuoc>
          <input
            name="phone"
            type="tel"
            className="inp"
            required
            maxLength={20}
            defaultValue={hoiVien?.phone ?? ""}
          />
        </O>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <O label="Doanh nghiệp">
          <input
            name="company"
            className="inp"
            maxLength={150}
            defaultValue={hoiVien?.company ?? ""}
          />
        </O>
        <O label="Chức vụ">
          <input
            name="chucVu"
            className="inp"
            maxLength={80}
            defaultValue={hoiVien?.chucVu ?? ""}
          />
        </O>
      </div>

      <O label="Email">
        <input
          name="email"
          type="email"
          className="inp"
          maxLength={120}
          defaultValue={hoiVien?.email ?? ""}
        />
      </O>

      {loai === "THAM_GIA" ? (
        <O
          label="Số người tham dự"
          goiY={conCho !== null ? `Còn ${conCho} chỗ.` : undefined}
        >
          <input
            type="number"
            name="soNguoi"
            className="inp"
            min={1}
            max={conCho ?? 50}
            defaultValue={1}
          />
        </O>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <O label="Mức tài trợ">
              <select name="mucTaiTro" className="inp" defaultValue="">
                <option value="">Ban Tổ chức tư vấn giúp</option>
                {MUC_TAI_TRO.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </O>
            <O label="Hiện kim dự kiến" goiY="Đơn vị: triệu đồng.">
              <input
                type="number"
                name="soTien"
                className="inp"
                min={0}
                placeholder="Ví dụ: 20"
              />
            </O>
          </div>
          <O label="Tài trợ hiện vật" goiY="Ví dụ: 300 phần quà, gói quay chụp, địa điểm…">
            <input name="hienVat" className="inp" maxLength={300} />
          </O>
        </>
      )}

      <O label="Lời nhắn cho Ban Tổ chức">
        <textarea name="ghiChu" rows={3} className="inp" maxLength={600} />
      </O>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending
          ? "Đang gửi…"
          : loai === "TAI_TRO"
            ? "Gửi đăng ký tài trợ"
            : "Đăng ký tham gia"}
      </button>

      <p className="text-xs leading-relaxed text-slate-500">
        Ban Tổ chức sẽ xác nhận rồi mới hiện tên anh/chị trong danh sách trên
        website.
      </p>
    </form>
  );
}
