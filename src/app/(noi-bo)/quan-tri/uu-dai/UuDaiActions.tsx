"use client";

import { useActionState } from "react";
import { doiNhaTaiTro, duyetUuDai, ghimUuDai, goUuDai, type KetQua } from "./actions";

function Nut({
  action,
  id,
  ten,
  className = "btn-ghost",
  truong = "id",
}: {
  action: (p: KetQua, fd: FormData) => Promise<KetQua>;
  id: string;
  ten: string;
  className?: string;
  truong?: string;
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(action, {});
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name={truong} value={id} />
      <button disabled={pending} className={`${className} py-1.5`}>
        {pending ? "..." : ten}
      </button>
      {state.error && <span className="ml-2 text-xs text-do-600">{state.error}</span>}
    </form>
  );
}

export const NutDuyet = ({ id }: { id: string }) => (
  <Nut action={duyetUuDai} id={id} ten="Duyệt" className="btn-primary" />
);

export const NutGo = ({ id }: { id: string }) => (
  <Nut action={goUuDai} id={id} ten="Gỡ" className="btn-ghost text-do-600" />
);

export const NutGhim = ({ id, dangGhim }: { id: string; dangGhim: boolean }) => (
  <Nut action={ghimUuDai} id={id} ten={dangGhim ? "Bỏ ưu tiên" : "Đưa lên đầu"} />
);

export const NutNhaTaiTro = ({ memberId, dangBat }: { memberId: string; dangBat: boolean }) => (
  <Nut
    action={doiNhaTaiTro}
    id={memberId}
    truong="memberId"
    ten={dangBat ? "Bỏ nhà tài trợ chiến lược" : "Đánh dấu nhà tài trợ chiến lược"}
  />
);
