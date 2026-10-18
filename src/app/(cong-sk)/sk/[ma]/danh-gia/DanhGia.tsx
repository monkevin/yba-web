"use client";

import { useState } from "react";
import { guiCong } from "../GuiForm";

const SAO = ["Rất không hài lòng", "Chưa hài lòng", "Bình thường", "Hài lòng", "Rất hài lòng"];

export default function DanhGia({ ma }: { ma: string }) {
  const [haiLong, setHaiLong] = useState(0);
  const [nps, setNps] = useState<number | null>(null);
  const [thichNhat, setThichNhat] = useState("");
  const [gopY, setGopY] = useState("");
  const [ten, setTen] = useState("");
  const [loi, setLoi] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [xong, setXong] = useState(false);

  async function gui() {
    setLoi("");
    setDangGui(true);
    const r = await guiCong(ma, "danh-gia", { haiLong, nps, thichNhat, gopY, ten });
    setDangGui(false);
    if (!r.ok) return setLoi(r.d.error || "Chưa gửi được");
    setXong(true);
  }

  if (xong)
    return (
      <div className="space-y-2 text-center">
        <div className="text-4xl">🙏</div>
        <h2 className="text-lg font-bold text-navy-800">Cảm ơn anh/chị đã góp ý</h2>
        <p className="text-sm text-slate-600">Ban tổ chức sẽ đọc từng ý kiến để kỳ sau làm tốt hơn.</p>
      </div>
    );

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        gui();
      }}
    >
      <h2 className="text-lg font-bold text-navy-800">Đánh giá sự kiện</h2>
      <div>
        <span className="lbl">Anh/chị hài lòng với sự kiện ở mức nào? *</span>
        <div className="flex gap-1" role="radiogroup" aria-label="Mức hài lòng">
          {SAO.map((s, i) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={haiLong === i + 1}
              aria-label={s}
              title={s}
              onClick={() => setHaiLong(i + 1)}
              className={`text-4xl leading-none transition ${i < haiLong ? "text-amber-400" : "text-slate-200"}`}
            >
              ★
            </button>
          ))}
        </div>
        {haiLong > 0 && <p className="text-xs text-slate-500">{SAO[haiLong - 1]}</p>}
      </div>
      <div>
        <span className="lbl">Anh/chị có giới thiệu sự kiện này cho bạn bè, đối tác không? (0 = không, 10 = chắc chắn)</span>
        <div className="grid grid-cols-11 gap-1">
          {Array.from({ length: 11 }, (_, n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNps(n)}
              aria-pressed={nps === n}
              className={`rounded py-2 text-sm font-medium ${
                nps === n ? "bg-navy-700 text-white" : n <= 6 ? "bg-do-50 text-do-700" : n <= 8 ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="lbl">Anh/chị thích nhất điều gì?</span>
        <textarea className="inp" rows={2} maxLength={1000} value={thichNhat} onChange={(e) => setThichNhat(e.target.value)} />
      </label>
      <label className="block">
        <span className="lbl">Điều Ban tổ chức nên làm tốt hơn</span>
        <textarea className="inp" rows={2} maxLength={1000} value={gopY} onChange={(e) => setGopY(e.target.value)} />
      </label>
      <label className="block">
        <span className="lbl">Tên anh/chị (tuỳ chọn)</span>
        <input className="inp" maxLength={80} value={ten} onChange={(e) => setTen(e.target.value)} />
      </label>
      {loi && <p className="text-sm text-do-600">{loi}</p>}
      <button className="btn-primary w-full !py-3" disabled={dangGui || !haiLong}>
        {dangGui ? "Đang gửi…" : "Gửi đánh giá"}
      </button>
    </form>
  );
}
