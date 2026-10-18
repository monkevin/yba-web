"use client";

import { useActionState } from "react";
import { TRANG_THAI_TIN } from "@/lib/listing";
import { doiTrangThaiTin, giaHanTin, xoaTin, type KetQua } from "./actions";

function NutForm({
  action,
  id,
  children,
  them,
  className = "btn-ghost py-1.5",
  xacNhan,
}: {
  action: (p: KetQua, fd: FormData) => Promise<KetQua>;
  id: string;
  children: React.ReactNode;
  them?: Record<string, string>;
  className?: string;
  xacNhan?: string;
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(action, {});

  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={(e) => {
        if (xacNhan && !confirm(xacNhan)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {them &&
        Object.entries(them).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <button disabled={pending} className={className}>
        {pending ? "..." : children}
      </button>
      {state.error && <span className="ml-2 text-xs text-do-600">{state.error}</span>}
    </form>
  );
}

export function NutAn({ id }: { id: string }) {
  return (
    <NutForm
      action={doiTrangThaiTin}
      id={id}
      them={{ trangThai: TRANG_THAI_TIN.AN }}
    >
      Ẩn tin
    </NutForm>
  );
}

export function NutHien({ id }: { id: string }) {
  return (
    <NutForm
      action={doiTrangThaiTin}
      id={id}
      them={{ trangThai: TRANG_THAI_TIN.DANG_HIEN }}
      className="btn-primary py-1.5"
    >
      Hiện lại
    </NutForm>
  );
}

export function NutGiaHan({ id }: { id: string }) {
  return (
    <NutForm action={giaHanTin} id={id}>
      Gia hạn 90 ngày
    </NutForm>
  );
}

export function NutXoaTin({ id }: { id: string }) {
  return (
    <NutForm
      action={xoaTin}
      id={id}
      className="btn-ghost py-1.5 text-do-600"
      xacNhan="Xoá hẳn tin này? Không khôi phục lại được."
    >
      Xoá
    </NutForm>
  );
}
