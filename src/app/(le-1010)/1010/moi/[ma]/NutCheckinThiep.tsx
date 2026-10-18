"use client";

import { useActionState } from "react";
import { tuCheckin, type KetQuaPhanHoi } from "../actions";

const VANG = "#e3b94a";

/**
 * Nút "Tôi đã đến" NGAY TRÊN THIỆP RIÊNG — chỉ hiện trong ngày sự kiện
 * (trang server quyết định). Khách mở thiệp của mình là check-in được
 * luôn, không phải quét QR rồi gõ tên như luồng chung /1010/checkin.
 * Máy tự ghi lần Chiều (trước 17:00) hay Gala (từ 17:00) — xem tuCheckin.
 */
export default function NutCheckinThiep({
  ma,
  daChieu,
  daLe = null,
  daGala,
  chayThu = false,
}: {
  ma: string;
  /** Giờ đã check-in từng phiên (đã định dạng sẵn) hoặc null */
  daChieu: string | null;
  daLe?: string | null;
  daGala: string | null;
  /** ?thu=1 — BTC chạy thử trước ngày sự kiện */
  chayThu?: boolean;
}) {
  const [state, formAction, pending] = useActionState<KetQuaPhanHoi, FormData>(
    tuCheckin,
    {}
  );

  return (
    <div className="mb-5 rounded-2xl border-2 border-amber-400/80 bg-amber-400/10 p-5 text-center">
      <p className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: VANG }}>
        Hôm nay 10.10 — Check-in tại đây
      </p>
      {(daChieu || daLe || daGala) && (
        <p className="mt-2 text-sm font-bold text-emerald-300">
          ✓ Đã check-in{daChieu ? ` Tọa đàm ${daChieu}` : ""}
          {daLe ? ` · Lễ ${daLe}` : ""}
          {daGala ? ` · Gala ${daGala}` : ""}
        </p>
      )}
      {state.chuaDienRa ? (
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/90">
          🗓️ {state.chuaDienRa}
        </p>
      ) : state.ok ? (
        <div className="mt-3">
          <p className="text-lg font-extrabold" style={{ color: VANG }}>
            🎉 {state.chao}
          </p>
          {state.lucNay && (
            <p className="mt-1 text-sm text-white/80">
              Check-in lúc <b className="text-white">{state.lucNay}</b>
            </p>
          )}
          {state.phienText && (
            <p className="mx-auto mt-2 max-w-md text-base leading-snug font-bold text-white">
              {state.phienText}
            </p>
          )}
          {state.ghiChuBan ? (
            <p className="mx-auto mt-2 max-w-md text-sm leading-snug text-white/85">
              🪑 {state.ghiChuBan}
            </p>
          ) : (
            <p className="mt-2 text-xl font-extrabold text-white">
              {state.khuBan
                ? `Khu bàn: ${state.khuBan.join(" · ")}`
                : state.ban
                  ? `Số bàn dự kiến: ${state.ban}`
                  : "Lễ tân sẽ hướng dẫn anh/chị nhận chỗ"}
            </p>
          )}
          {state.luuY && (
            <p className="mx-auto mt-2 max-w-md text-sm leading-snug text-white/85">
              {state.luuY}
            </p>
          )}
          {state.diem && (
            <p className="mt-2 text-sm font-bold text-emerald-300">⭐ {state.diem}</p>
          )}
        </div>
      ) : (
        <form action={formAction} className="mt-3">
          <input type="hidden" name="ma" value={ma} />
          <input type="hidden" name="nguon" value="thiep" />
          {chayThu && <input type="hidden" name="thu" value="1" />}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-lg font-extrabold text-[#1b274d] shadow-xl transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-60"
          >
            {pending ? "Đang ghi nhận…" : "✓ Tôi đã đến — Check-in"}
          </button>
          {state.error && (
            <p role="alert" className="mt-2 text-sm text-red-300">
              {state.error}
            </p>
          )}
          <p className="mt-2 text-xs text-white/60">
            Bấm xong đưa màn hình này cho lễ tân là vào — số bàn hiện ngay bên
            dưới nút.
          </p>
        </form>
      )}
    </div>
  );
}
