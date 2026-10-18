"use client";

import { useState } from "react";
import { guiCong } from "../GuiForm";

type KetQua = { ten: string; ban: string | null; phien: string; daCo: boolean; diem: number };

export default function TuCheckin({ ma, phien, macDinh }: { ma: string; phien: { id: string; ten: string }[]; macDinh: string }) {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [phienId, setPhienId] = useState(macDinh);
  const [hoiThem, setHoiThem] = useState(false);
  const [ten, setTen] = useState("");
  const [donVi, setDonVi] = useState("");
  const [loi, setLoi] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [kq, setKq] = useState<KetQua | null>(null);

  async function gui() {
    setLoi("");
    setDangGui(true);
    const r = await guiCong(ma, "check-in", { phone, pin, phienId, ...(hoiThem ? { ten, donVi } : {}) });
    setDangGui(false);
    if (!r.ok) return setLoi(r.d.error || "Chưa check-in được");
    if (r.d.canThongTin) {
      setHoiThem(true);
      return setLoi("Chưa thấy số này trong danh sách khách — anh/chị cho Ban tổ chức xin họ tên nhé.");
    }
    setKq(r.d as unknown as KetQua);
  }

  if (kq)
    return (
      <div className="space-y-2 text-center">
        <div className="text-5xl">🎉</div>
        <p className="text-sm text-slate-500">{kq.daCo ? "Anh/chị đã check-in trước đó" : "Check-in thành công"}</p>
        <h2 className="text-xl font-bold text-navy-800">Chào mừng {kq.ten}</h2>
        <p className="text-sm text-slate-600">{kq.phien}</p>
        {kq.ban && (
          <div className="mx-auto mt-3 w-fit rounded-2xl bg-do-600 px-8 py-4 text-white">
            <div className="text-xs uppercase tracking-wider opacity-80">Bàn của anh/chị</div>
            <div className="text-4xl font-bold">{kq.ban}</div>
          </div>
        )}
        {kq.diem > 0 && <p className="text-sm text-emerald-700">+{kq.diem} điểm hoạt động hội viên</p>}
      </div>
    );

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        gui();
      }}
    >
      <h2 className="text-lg font-bold text-navy-800">Check-in</h2>
      <label className="block">
        <span className="lbl">Số điện thoại đã đăng ký</span>
        <input className="inp text-lg" value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" autoComplete="tel" />
      </label>
      <label className="block">
        <span className="lbl">Mã PIN (in tại bàn đón khách)</span>
        <input
          className="inp text-center text-2xl tracking-[0.5em]"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required
          inputMode="numeric"
          autoComplete="one-time-code"
        />
      </label>
      {phien.length > 1 && (
        <label className="block">
          <span className="lbl">Phiên</span>
          <select className="inp" value={phienId} onChange={(e) => setPhienId(e.target.value)}>
            {phien.map((p) => (
              <option key={p.id} value={p.id}>
                {p.ten}
              </option>
            ))}
          </select>
        </label>
      )}
      {hoiThem && (
        <div className="space-y-3 rounded-lg bg-amber-50 p-3">
          <label className="block">
            <span className="lbl">Họ và tên *</span>
            <input className="inp" value={ten} onChange={(e) => setTen(e.target.value)} required autoComplete="name" />
          </label>
          <label className="block">
            <span className="lbl">Doanh nghiệp / đơn vị</span>
            <input className="inp" value={donVi} onChange={(e) => setDonVi(e.target.value)} autoComplete="organization" />
          </label>
        </div>
      )}
      {loi && <p className="text-sm text-do-600">{loi}</p>}
      <button className="btn-danger w-full !py-3 text-base" disabled={dangGui}>
        {dangGui ? "Đang check-in…" : "Check-in"}
      </button>
    </form>
  );
}
