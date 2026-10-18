"use client";

import { useActionState } from "react";
import { luuNhaTaiTro, type KetQuaNTT } from "./actions";

/**
 * Ô soạn danh sách nhà tài trợ cho khung tri ân trên landing /1010.
 * Dán chữ thường, mỗi gói một dòng "1/ Tên gói (mức)", mỗi đơn vị một dòng
 * "+ Tên đơn vị" — bấm Lưu là landing đổi ngay, không cần build lại.
 */
export default function ONhaTaiTro({ van }: { van: string }) {
  const [state, formAction, pending] = useActionState<KetQuaNTT, FormData>(
    luuNhaTaiTro,
    {}
  );
  return (
    <form action={formAction} className="space-y-3">
      <p className="text-xs leading-relaxed text-slate-500">
        Cập nhật xong ở sheet “Theo dõi tài trợ” thì chép danh sách chốt vào
        đây (KHÔNG chép số tiền thoả thuận hay ghi chú nội bộ). Định dạng:
        dòng <b className="font-mono">1/ Tên gói</b> mở một gói, mỗi đơn vị
        một dòng bắt đầu bằng <b className="font-mono">+</b>.
      </p>
      <textarea
        name="van"
        rows={16}
        defaultValue={van}
        className="inp w-full font-mono text-xs leading-relaxed"
        spellCheck={false}
      />
      <div className="flex items-center gap-3">
        <button disabled={pending} className="btn-primary">
          {pending ? "Đang lưu…" : "Lưu — landing đổi ngay"}
        </button>
        {state.ok && <span className="text-sm text-emerald-700">{state.ok}</span>}
        {state.error && <span className="text-sm text-do-600">{state.error}</span>}
      </div>
    </form>
  );
}
