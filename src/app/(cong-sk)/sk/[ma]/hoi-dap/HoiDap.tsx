"use client";

import { useState } from "react";
import { guiCong } from "../GuiForm";

export default function HoiDap({ ma }: { ma: string }) {
  const [noiDung, setNoiDung] = useState("");
  const [ten, setTen] = useState("");
  const [loi, setLoi] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [daGui, setDaGui] = useState(0);

  async function gui() {
    setLoi("");
    setDangGui(true);
    const r = await guiCong(ma, "hoi-dap", { noiDung, ten });
    setDangGui(false);
    if (!r.ok) return setLoi(r.d.error || "Chưa gửi được");
    setNoiDung("");
    setDaGui((n) => n + 1);
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        gui();
      }}
    >
      <h2 className="text-lg font-bold text-navy-800">Gửi câu hỏi cho diễn giả</h2>
      {daGui > 0 && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          Đã gửi {daGui > 1 ? `${daGui} câu hỏi` : "câu hỏi"} — Ban tổ chức sẽ chọn câu để chiếu lên màn hình.
        </p>
      )}
      <label className="block">
        <span className="lbl">Câu hỏi *</span>
        <textarea className="inp" rows={4} maxLength={500} value={noiDung} onChange={(e) => setNoiDung(e.target.value)} required />
      </label>
      <label className="block">
        <span className="lbl">Tên anh/chị (để trống = ẩn danh)</span>
        <input className="inp" maxLength={80} value={ten} onChange={(e) => setTen(e.target.value)} />
      </label>
      {loi && <p className="text-sm text-do-600">{loi}</p>}
      <button className="btn-primary w-full !py-3" disabled={dangGui || noiDung.trim().length < 5}>
        {dangGui ? "Đang gửi…" : "Gửi câu hỏi"}
      </button>
    </form>
  );
}
