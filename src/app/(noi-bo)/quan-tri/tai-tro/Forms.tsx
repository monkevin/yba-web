"use client";

import { useActionState, useState } from "react";
import { luuDuAn, luuGoi, xoaGoi, xuLyDangKy, type KetQua } from "./actions";

/** Đổi VND sang số triệu để hiện trong ô nhập. */
function veTrieu(vnd: number): string {
  return vnd > 0 ? String(Math.round(vnd / 1_000_000)) : "";
}

function Thong({ state }: { state: KetQua }) {
  if (state.error)
    return (
      <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        {state.ok}
      </p>
    );
  return null;
}

function O({
  label,
  goiY,
  children,
}: {
  label: string;
  goiY?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
      {goiY && <span className="mt-1 block text-xs text-slate-500">{goiY}</span>}
    </label>
  );
}

export function FormDuAn({
  duAn,
}: {
  duAn?: {
    id: string;
    ten: string;
    tomTat: string | null;
    moTa: string | null;
    mucTieu: number;
    daGop: number;
    active: boolean;
  };
}) {
  const [mo, datMo] = useState(!duAn);
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    luuDuAn,
    {}
  );

  if (duAn && !mo) {
    return (
      <button type="button" onClick={() => datMo(true)} className="btn-ghost py-1.5">
        Sửa chương trình
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {duAn && <input type="hidden" name="id" value={duAn.id} />}
      <Thong state={state} />

      <O label="Tên chương trình">
        <input
          name="ten"
          className="inp"
          required
          maxLength={150}
          defaultValue={duAn?.ten ?? ""}
        />
      </O>
      <O label="Tóm tắt một câu">
        <input
          name="tomTat"
          className="inp"
          maxLength={300}
          defaultValue={duAn?.tomTat ?? ""}
        />
      </O>
      <O label="Giới thiệu đầy đủ" goiY="Cách một dòng trống để xuống đoạn mới.">
        <textarea
          name="moTa"
          rows={6}
          className="inp"
          defaultValue={duAn?.moTa ?? ""}
        />
      </O>
      <div className="grid gap-3 sm:grid-cols-2">
        <O label="Mục tiêu huy động" goiY="Đơn vị: triệu đồng. Để 0 nếu không đặt mục tiêu.">
          <input
            name="mucTieu"
            type="number"
            min={0}
            className="inp"
            defaultValue={veTrieu(duAn?.mucTieu ?? 0)}
          />
        </O>
        <O label="Đã huy động được" goiY="Đơn vị: triệu đồng.">
          <input
            name="daGop"
            type="number"
            min={0}
            className="inp"
            defaultValue={veTrieu(duAn?.daGop ?? 0)}
          />
        </O>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={duAn?.active ?? true}
          className="h-4 w-4"
        />
        Hiện trên website
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="btn-primary py-1.5">
          {pending ? "…" : duAn ? "Lưu" : "+ Thêm chương trình"}
        </button>
        {duAn && (
          <button
            type="button"
            onClick={() => datMo(false)}
            className="btn-ghost py-1.5"
          >
            Đóng
          </button>
        )}
      </div>
    </form>
  );
}

export function FormGoi({
  duAnId,
  goi,
}: {
  duAnId: string;
  goi?: {
    id: string;
    ten: string;
    soTien: number;
    quyenLoi: string | null;
    noiBat: boolean;
    active: boolean;
    order: number;
  };
}) {
  const [mo, datMo] = useState(false);
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    luuGoi,
    {}
  );

  if (!mo) {
    return (
      <button
        type="button"
        onClick={() => datMo(true)}
        className="btn-ghost py-1.5"
      >
        {goi ? "Sửa" : "+ Thêm gói"}
      </button>
    );
  }

  return (
    <form action={formAction} className="w-full space-y-3 rounded-xl bg-navy-50 p-4">
      {goi ? (
        <input type="hidden" name="id" value={goi.id} />
      ) : (
        <input type="hidden" name="duAnId" value={duAnId} />
      )}
      <Thong state={state} />

      <div className="grid gap-3 sm:grid-cols-3">
        <O label="Tên gói">
          <input
            name="ten"
            className="inp"
            required
            maxLength={60}
            defaultValue={goi?.ten ?? ""}
            placeholder="Kim cương"
          />
        </O>
        <O label="Số tiền (triệu)">
          <input
            name="soTien"
            type="number"
            min={1}
            className="inp"
            required
            defaultValue={veTrieu(goi?.soTien ?? 0)}
          />
        </O>
        <O label="Thứ tự">
          <input
            name="order"
            type="number"
            className="inp"
            defaultValue={goi?.order ?? 0}
          />
        </O>
      </div>

      <O label="Quyền lợi nhà tài trợ" goiY="Mỗi dòng một quyền lợi.">
        <textarea
          name="quyenLoi"
          rows={5}
          className="inp"
          defaultValue={goi?.quyenLoi ?? ""}
        />
      </O>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={goi?.active ?? true}
            className="h-4 w-4"
          />
          Hiện trên website
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="noiBat"
            defaultChecked={goi?.noiBat ?? false}
            className="h-4 w-4"
          />
          Làm nổi bật
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="btn-primary py-1.5">
          {pending ? "…" : "Lưu gói"}
        </button>
        <button
          type="button"
          onClick={() => datMo(false)}
          className="btn-ghost py-1.5"
        >
          Đóng
        </button>
      </div>
    </form>
  );
}

export function NutXoaGoi({ id }: { id: string }) {
  const [, formAction, pending] = useActionState<KetQua, FormData>(xoaGoi, {});

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Xoá gói tài trợ này?")) e.preventDefault();
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

export function FormXuLyDangKy({
  id,
  status,
  ghiChu,
}: {
  id: string;
  status: string;
  ghiChu: string | null;
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    xuLyDangKy,
    {}
  );

  return (
    <form action={formAction} className="flex flex-wrap items-start gap-2">
      <input type="hidden" name="id" value={id} />
      <select name="status" defaultValue={status} className="inp w-auto">
        <option value="MOI">Mới</option>
        <option value="DA_LIEN_HE">Đã liên hệ</option>
        <option value="DA_NHAN">Đã nhận tài trợ</option>
        <option value="HUY">Huỷ</option>
      </select>
      <input
        name="ghiChu"
        className="inp min-w-0 flex-1"
        defaultValue={ghiChu ?? ""}
        maxLength={500}
        placeholder="Ghi chú nội bộ"
      />
      <button type="submit" disabled={pending} className="btn-primary py-1.5">
        {pending ? "…" : "Lưu"}
      </button>
      {state.ok && <span className="text-xs text-emerald-600">{state.ok}</span>}
    </form>
  );
}
