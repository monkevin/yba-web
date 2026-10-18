"use client";

import { useState } from "react";
import { guiCong } from "../GuiForm";

export default function DangKy({ ma, phien }: { ma: string; phien: { id: string; ten: string }[] }) {
  const [chon, setChon] = useState<string[]>(phien.map((p) => p.id));
  const [loi, setLoi] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [xong, setXong] = useState<string[] | null>(null);

  async function gui(fd: FormData) {
    setLoi("");
    setDangGui(true);
    const r = await guiCong(ma, "dang-ky", { ...Object.fromEntries(fd), phienIds: chon });
    setDangGui(false);
    if (!r.ok) return setLoi(r.d.error || "Chưa gửi được");
    setXong((r.d.phien as string[]) ?? []);
  }

  if (xong)
    return (
      <div className="space-y-2 text-center">
        <div className="text-4xl">✅</div>
        <h2 className="text-lg font-bold text-navy-800">Đã ghi nhận đăng ký</h2>
        {xong.length > 0 && <p className="text-sm text-slate-600">Phiên: {xong.join(", ")}</p>}
        <p className="text-sm text-slate-600">Ban tổ chức sẽ liên hệ xác nhận. Hẹn gặp anh/chị tại sự kiện!</p>
      </div>
    );

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        gui(new FormData(e.currentTarget));
      }}
    >
      <h2 className="text-lg font-bold text-navy-800">Đăng ký tham dự</h2>
      <label className="block">
        <span className="lbl">Họ và tên *</span>
        <input name="ten" className="inp" required autoComplete="name" />
      </label>
      <label className="block">
        <span className="lbl">Số điện thoại *</span>
        <input name="phone" className="inp" required inputMode="tel" autoComplete="tel" />
      </label>
      <label className="block">
        <span className="lbl">Doanh nghiệp / đơn vị</span>
        <input name="donVi" className="inp" autoComplete="organization" />
      </label>
      <label className="block">
        <span className="lbl">Chức danh</span>
        <input name="chucDanh" className="inp" autoComplete="organization-title" />
      </label>
      <label className="block">
        <span className="lbl">Email</span>
        <input name="email" type="email" className="inp" autoComplete="email" />
      </label>
      {phien.length > 1 && (
        <fieldset>
          <legend className="lbl">Phiên tham dự</legend>
          {phien.map((p) => (
            <label key={p.id} className="flex items-center gap-2 py-1 text-sm">
              <input
                type="checkbox"
                checked={chon.includes(p.id)}
                onChange={(e) => setChon(e.target.checked ? [...chon, p.id] : chon.filter((x) => x !== p.id))}
              />
              {p.ten}
            </label>
          ))}
        </fieldset>
      )}
      <label className="block">
        <span className="lbl">Ghi chú</span>
        <input name="ghiChu" className="inp" placeholder="Đi cùng người khác, ăn chay…" />
      </label>
      {loi && <p className="text-sm text-do-600">{loi}</p>}
      <button className="btn-primary w-full !py-3" disabled={dangGui || (phien.length > 1 && !chon.length)}>
        {dangGui ? "Đang gửi…" : "Đăng ký"}
      </button>
    </form>
  );
}
