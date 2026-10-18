"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { tuCheckin, type KetQuaPhanHoi } from "../moi/actions";

const VANG = "#e3b94a";

type KetQua = { ma: string; ten: string; mo: string };

/**
 * Khách tự check-in: tìm tên mình → bấm nút to "Tôi đã đến ✓".
 * Trang này là đích của mã QR BTC in đặt ở quầy đón khách.
 */
export default function TuCheckin({
  chayThu = false,
  gioGia,
  phienKhoa,
  tenPhienKhoa,
}: {
  chayThu?: boolean;
  /** Chạy thử: giả lập giờ "HH:MM" để thử từng phiên */
  gioGia?: string;
  /** QR riêng từng phiên: ghi THẲNG phiên này thay vì đoán theo giờ */
  phienKhoa?: string;
  tenPhienKhoa?: string;
}) {
  const [q, setQ] = useState("");
  const [kq, setKq] = useState<KetQua[]>([]);
  const [chon, setChon] = useState<KetQua | null>(null);
  const hen = useRef<number>(0);
  const [state, formAction, pending] = useActionState<KetQuaPhanHoi, FormData>(
    tuCheckin,
    {}
  );

  useEffect(() => {
    if (chon || q.trim().length < 2) {
      setKq([]);
      return;
    }
    window.clearTimeout(hen.current);
    hen.current = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/khach-moi-1010/tim?q=${encodeURIComponent(q.trim())}`);
        setKq((await r.json()).kq ?? []);
      } catch {
        setKq([]);
      }
    }, 300);
    return () => window.clearTimeout(hen.current);
  }, [q, chon]);

  // Ngoài thời gian sự kiện: lời hẹn thay vì check-in (Chủ nhiệm chốt 24/09)
  if (state.chuaDienRa) {
    return (
      <div className="rounded-2xl border-2 border-amber-400/60 bg-white/5 p-7 text-center">
        <span className="text-5xl">🗓️</span>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/90">
          {state.chuaDienRa}
        </p>
        <button
          type="button"
          onClick={() => {
            setChon(null);
            setQ("");
          }}
          className="mt-5 text-sm text-white/60 underline underline-offset-2"
        >
          ← Quay lại
        </button>
      </div>
    );
  }

  if (state.ok) {
    return (
      <div className="rounded-2xl border-2 border-amber-400/80 bg-amber-400/10 p-7 text-center">
        <span className="text-5xl">🎉</span>
        <h2 className="mt-3 text-2xl font-extrabold" style={{ color: VANG }}>
          {state.chao ?? `${chon?.ten} đã check-in!`}
        </h2>
        {state.mota && (
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-snug text-white/80">
            {state.mota}
          </p>
        )}
        {state.phuTrach && (
          <p className="mt-1 text-sm text-white/60">
            Người phụ trách đón tiếp: <b className="text-white/85">{state.phuTrach}</b>
          </p>
        )}
        {state.phienGhi && (
          <p className="mx-auto mt-3 w-fit rounded-full bg-emerald-400/15 px-4 py-1.5 text-sm font-bold text-emerald-300">
            ✓ Đã ghi nhận: {state.phienGhi}
          </p>
        )}
        {state.lucNay && (
          <p className="mt-2 text-sm text-white/85">
            Check-in lúc <b className="text-white">{state.lucNay}</b>
            {state.lanTruoc && (
              <span className="block text-xs text-white/60">
                (cập nhật — lần trước lúc {state.lanTruoc})
              </span>
            )}
          </p>
        )}
        {state.lichSu && (
          <div className="mx-auto mt-3 max-w-sm rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-left">
            <p className="text-xs font-bold tracking-wide text-white/60 uppercase">
              Lịch sử check-in ({state.lichSu.length} lần)
            </p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-white/85">
              {state.lichSu.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ol>
          </div>
        )}
        {state.phienText && (
          <p className="mx-auto mt-3 max-w-md rounded-xl border border-amber-300/50 bg-amber-400/10 px-4 py-3 text-base leading-snug font-bold text-white">
            {state.phienText}
          </p>
        )}
        {/* SỐ BÀN DỰ KIẾN — thứ khách cần nhất khi vào tiệc, hiện thật to */}
        {state.ban ? (
          <div className="mx-auto mt-4 max-w-xs rounded-2xl border-2 border-amber-300/70 bg-amber-400/15 px-6 py-4">
            <p className="text-xs font-bold tracking-[.25em] text-amber-200/90 uppercase">
              {state.khuBan ? "Khu bàn của anh/chị" : "Số bàn dự kiến"}
            </p>
            {state.khuBan ? (
              <>
                {/* Khu 4 bàn hai chữ số ("11 · 12 · 13 · 14") ở cỡ 36px vượt khung
                    điện thoại 375px và gãy dòng để lại số 14 lẻ loi — co theo vw */}
                <p
                  className="mt-1 leading-tight font-extrabold whitespace-nowrap"
                  style={{ color: VANG, fontSize: "clamp(1.5rem, 8vw, 2.25rem)" }}
                >
                  {state.khuBan.join(" · ")}
                </p>
                <p className="mt-1 text-sm text-white/80">
                  Mời anh/chị chọn bàn còn chỗ trong khu này
                </p>
              </>
            ) : (
              <p className="mt-1 text-6xl leading-none font-extrabold" style={{ color: VANG }}>
                {state.ban}
              </p>
            )}
            {state.luuY && (
              <p className="mt-3 text-sm leading-snug font-semibold text-white/85">
                {state.luuY}
              </p>
            )}
          </div>
        ) : state.ghiChuBan ? (
          <p className="mx-auto mt-4 max-w-sm rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm leading-snug text-white/85">
            🪑 {state.ghiChuBan}
          </p>
        ) : (
          <p className="mt-4 text-xl font-extrabold" style={{ color: VANG }}>
            Lễ tân sẽ hướng dẫn anh/chị nhận chỗ
          </p>
        )}
        {state.diem && (
          <p className="mt-2 text-sm font-bold text-emerald-300">⭐ {state.diem}</p>
        )}
        <p className="mt-3 text-xs text-white/60">
          ✓ Đã check-in — anh/chị đưa màn hình này cho lễ tân nếu cần hỗ trợ
          thêm.
        </p>
      </div>
    );
  }

  return (
    <div>
      {!chon && (
        <>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            placeholder="Gõ họ tên của anh/chị…"
            autoCorrect="off"
            spellCheck={false}
            className="min-h-14 w-full rounded-full border border-amber-300/50 bg-white/10 px-5 text-center text-lg font-semibold text-white placeholder:font-normal placeholder:text-white/40 focus:border-amber-400 focus:outline-none"
          />
          <div className="mt-3 space-y-2">
            {kq.map((k) => (
              <button
                key={k.ma}
                onClick={() => setChon(k)}
                className="block w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3.5 text-left transition hover:bg-amber-400/10"
              >
                <span className="text-lg font-bold text-white">{k.ten}</span>
                {k.mo && <span className="block text-sm text-white/60">{k.mo}</span>}
              </button>
            ))}
          </div>
        </>
      )}

      {chon && (
        <form action={formAction} className="text-center">
          <input type="hidden" name="ma" value={chon.ma} />
          {chayThu && <input type="hidden" name="thu" value="1" />}
          {chayThu && gioGia && <input type="hidden" name="gio" value={gioGia} />}
          {phienKhoa && <input type="hidden" name="phien" value={phienKhoa} />}
          <p className="text-lg text-white/85">Xin chào</p>
          <p className="text-2xl font-extrabold" style={{ color: VANG }}>
            {chon.ten}
          </p>
          {chon.mo && <p className="mt-1 text-sm text-white/60">{chon.mo}</p>}
          {state.error && (
            <p role="alert" className="mt-3 text-sm text-red-300">
              {state.error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="mt-5 w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-5 text-xl font-extrabold text-[#1b274d] shadow-xl transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-60"
          >
            {pending
              ? "Đang ghi nhận…"
              : tenPhienKhoa
                ? `✓ Tôi đã đến — ${tenPhienKhoa}`
                : "✓ Tôi đã đến"}
          </button>
          <button
            type="button"
            onClick={() => {
              setChon(null);
              setQ("");
            }}
            className="mt-3 text-sm text-white/60 underline underline-offset-2"
          >
            ← Không phải tôi, tìm lại
          </button>
        </form>
      )}
    </div>
  );
}
