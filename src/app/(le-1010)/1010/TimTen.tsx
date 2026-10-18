"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const VANG = "#e3b94a";

type KetQua = { ma: string; ten: string; mo: string };

/**
 * Ô tìm thiệp mời theo TÊN: khách gõ họ tên → hiện đúng tên mình → bấm vào
 * là mở thiệp riêng (/1010/moi/<mã>). Ai cầm thiệp in có mã CL-XXXXX thì gõ
 * thẳng mã vào đây cũng mở được.
 */
export default function TimTen() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [kq, setKq] = useState<KetQua[]>([]);
  const [dangTim, setDangTim] = useState(false);
  const [daTim, setDaTim] = useState(false);
  const hen = useRef<number>(0);

  // Gõ mã thiệp (CL-XXXXX) thì khỏi tìm — mở thẳng
  const laMa = /^CL-?[A-Z0-9]{5}$/i.test(q.trim().replace(/\s+/g, ""));

  useEffect(() => {
    if (laMa || q.trim().length < 2) {
      setKq([]);
      setDaTim(false);
      return;
    }
    setDangTim(true);
    window.clearTimeout(hen.current);
    hen.current = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/khach-moi-1010/tim?q=${encodeURIComponent(q.trim())}`);
        const d = await r.json();
        setKq(d.kq ?? []);
      } catch {
        setKq([]);
      }
      setDangTim(false);
      setDaTim(true);
    }, 350);
    return () => window.clearTimeout(hen.current);
  }, [q, laMa]);

  function moBangMa() {
    let m = q.trim().toUpperCase().replace(/\s+/g, "");
    if (!m.startsWith("CL-")) m = `CL-${m.replace(/^CL/, "")}`;
    router.push(`/1010/moi/${m}`);
  }

  return (
    <div className="mx-auto max-w-md">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Gõ họ tên của anh/chị…"
        autoCorrect="off"
        spellCheck={false}
        className="min-h-12 w-full rounded-full border border-amber-300/50 bg-white/10 px-5 text-center text-base font-semibold text-white placeholder:font-normal placeholder:text-white/40 focus:border-amber-400 focus:outline-none"
      />

      {laMa && (
        <button
          onClick={moBangMa}
          className="mt-3 w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 font-bold text-[#1b274d] transition hover:from-amber-400 hover:to-amber-500"
        >
          Mở thư mời với mã {q.trim().toUpperCase()}
        </button>
      )}

      {!laMa && (dangTim || kq.length > 0 || daTim) && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/20 bg-[#10182e]/95 backdrop-blur">
          {dangTim && (
            <p className="px-4 py-3 text-center text-sm text-white/50">Đang tìm…</p>
          )}
          {!dangTim &&
            kq.map((k) => (
              <button
                key={k.ma}
                onClick={() => router.push(`/1010/moi/${k.ma}`)}
                className="block w-full border-b border-white/10 px-4 py-3 text-left transition last:border-0 hover:bg-amber-400/10"
              >
                <span className="font-bold text-white">{k.ten}</span>
                {k.mo && <span className="block text-xs text-white/60">{k.mo}</span>}
                <span className="mt-0.5 block text-xs font-semibold" style={{ color: VANG }}>
                  Mở thiệp mời của tôi →
                </span>
              </button>
            ))}
          {!dangTim && daTim && kq.length === 0 && (
            <p className="px-4 py-3 text-center text-sm leading-relaxed text-white/60">
              Chưa thấy tên này trong danh sách mời — thử gõ tên không dấu,
              hoặc liên hệ Ban Tổ chức bên dưới.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
