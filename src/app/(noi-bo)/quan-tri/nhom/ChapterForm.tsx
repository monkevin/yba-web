"use client";

import { useActionState } from "react";
import { saveChapter, type ActionResult } from "../actions";

export default function ChapterForm() {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    saveChapter,
    {}
  );

  return (
    <form action={formAction} className="card space-y-3 p-4">
      <h2 className="font-semibold text-slate-800">Thêm nhóm mới</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="lbl">Mã nhóm</label>
          <input name="code" className="inp" placeholder="Ví dụ: N01" />
        </div>
        <div>
          <label className="lbl">Tên nhóm</label>
          <input name="name" className="inp" placeholder="Ví dụ: Nhóm Sản xuất" />
        </div>
      </div>
      <div>
        <label className="lbl">Ghi chú</label>
        <input name="note" className="inp" />
      </div>

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
        {pending ? "Đang lưu..." : "Tạo nhóm"}
      </button>
    </form>
  );
}
