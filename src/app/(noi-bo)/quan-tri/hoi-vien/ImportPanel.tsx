"use client";

import { useActionState, useState } from "react";
import { importMembers, type ActionResult } from "../actions";

export default function ImportPanel() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    importMembers,
    {}
  );

  return (
    <div className="card mb-4 p-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium text-navy-600 hover:underline"
      >
        {open ? "Đóng" : "Nhập hàng loạt từ Excel"}
      </button>

      {open && (
        <form action={formAction} className="mt-3 space-y-3">
          <p className="text-sm text-slate-600">
            Copy các cột từ Excel rồi dán vào ô dưới. Thứ tự cột:{" "}
            <strong>Tên doanh nghiệp · Người đại diện · Ngành · Điện thoại · Email</strong>.
            Mỗi hội viên một dòng. Dòng trùng tên doanh nghiệp sẽ được bỏ qua.
          </p>
          <textarea
            name="data"
            rows={8}
            className="inp font-mono text-xs"
            placeholder={"Công ty TNHH ABC\tNguyễn Văn A\tDệt may\t0901234567\ta@abc.vn"}
          />
          {state.error && (
            <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
              {state.error}
            </p>
          )}
          {state.message && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {state.message}
            </p>
          )}
          <button disabled={pending} className="btn-primary">
            {pending ? "Đang nhập..." : "Nhập danh sách"}
          </button>
        </form>
      )}
    </div>
  );
}
