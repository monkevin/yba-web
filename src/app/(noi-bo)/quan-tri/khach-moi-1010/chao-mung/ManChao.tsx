"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * MÀN CHÀO MỪNG — khung chiếu lên TV ở sảnh. Khách mới nhất hiện thật to
 * giữa màn; các khách đến trước đó chạy hàng nhỏ bên dưới; quân số ba
 * phiên ở chân màn. Tự gọi router.refresh() mỗi 5 giây để lấy lượt
 * check-in mới (trang cha force-dynamic).
 */

export type LuotDen = {
  /** mã khách + phiên — đổi là khối giữa chạy lại hiệu ứng */
  khoa: string;
  ten: string;
  moTa: string;
  phien: string;
  gio: string;
  luc: number;
};

const LAM_MOI_MS = 5000;

export default function ManChao({
  luot,
  dem,
}: {
  luot: LuotDen[];
  dem: { td: number; le: number; gala: number };
}) {
  const router = useRouter();
  const khung = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => router.refresh(), LAM_MOI_MS);
    return () => clearInterval(t);
  }, [router]);

  function toanManHinh() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void khung.current?.requestFullscreen();
  }

  const moi = luot[0];
  const truoc = luot.slice(1, 7);

  return (
    <div>
      <style>{`
        @keyframes cm-bung { 0% { transform: translateY(14px) scale(.92); opacity: 0 } 100% { transform: none; opacity: 1 } }
        @keyframes cm-tho { 0%,100% { opacity: .45 } 50% { opacity: .95 } }
        .cm-bung { animation: cm-bung .7s ease-out }
        .cm-tho { animation: cm-tho 2.4s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .cm-bung, .cm-tho { animation: none } }
        .cm-khung:fullscreen { border-radius: 0; display: flex; flex-direction: column; justify-content: center }
        /* Playfair của dự án — KHÔNG dùng font-serif Tailwind (Georgia thiếu
           glyph tiếng Việt ghép, chữ "Tuấn" bị tách dấu) */
        .chu-playfair { font-family: var(--font-tieu-de), Georgia, "Times New Roman", serif; font-weight: 700 }
      `}</style>

      <div
        ref={khung}
        className="cm-khung relative overflow-hidden rounded-2xl bg-[#0b1230] px-4 py-12 text-center text-white sm:px-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 50% -20%, rgba(212,175,55,.26), transparent 55%), radial-gradient(ellipse at 50% 120%, rgba(46,64,130,.5), transparent 60%)",
        }}
      >
        <button
          type="button"
          onClick={toanManHinh}
          className="absolute top-3 right-3 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/20"
        >
          ⛶ Toàn màn hình
        </button>

        <p className="text-xs font-semibold tracking-[.35em] text-amber-200/80 uppercase sm:text-sm">
          Lễ chuyển giao &amp; ra mắt Ban Điều hành nhiệm kỳ I
        </p>
        <p className="mt-1 text-xs tracking-[.2em] text-white/55 uppercase">
          YBA Chợ Lớn · 10.10.2026 · Capella Gallery Hall
        </p>

        {/* Khách mới nhất */}
        <div className="mx-auto mt-8 flex min-h-56 max-w-4xl flex-col items-center justify-center sm:min-h-64">
          {moi ? (
            <div key={moi.khoa} className="cm-bung">
              <p className="chu-playfair text-2xl text-amber-200/90 sm:text-3xl">
                Chào mừng
              </p>
              <p className="chu-playfair mt-3 text-4xl leading-[1.25] font-extrabold text-amber-300 drop-shadow-[0_0_28px_rgba(212,175,55,.4)] sm:text-7xl">
                {moi.ten}
              </p>
              {moi.moTa && (
                <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-2xl">
                  {moi.moTa}
                </p>
              )}
              <p className="mt-4 inline-block rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-1.5 text-sm font-semibold text-amber-200 sm:text-base">
                {moi.phien} · {moi.gio}
              </p>
            </div>
          ) : (
            <div className="cm-tho">
              <p className="chu-playfair text-3xl leading-[1.3] font-extrabold text-amber-300 sm:text-6xl">
                Kính chào Quý khách
              </p>
              <p className="mt-4 text-base text-white/70 sm:text-xl">
                Dấn thân – Đổi mới – Đột phá – Vươn tầm
              </p>
            </div>
          )}
        </div>

        {/* Các khách vừa đến trước đó */}
        {truoc.length > 0 && (
          <div className="mx-auto mt-8 max-w-5xl border-t border-white/10 pt-5">
            <p className="text-xs font-semibold tracking-[.25em] text-white/45 uppercase">
              Vừa đến
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {truoc.map((l) => (
                <p key={l.khoa} className="text-sm text-white/75 sm:text-lg">
                  <span className="font-semibold text-white/90">{l.ten}</span>
                  <span className="ml-2 text-xs text-white/45 sm:text-sm">{l.gio}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Quân số ba phiên */}
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-white/60 sm:gap-10 sm:text-base">
          <span>
            Tọa đàm <b className="text-amber-200">{dem.td}</b>
          </span>
          <span>
            Lễ chuyển giao <b className="text-amber-200">{dem.le}</b>
          </span>
          <span>
            Gala <b className="text-amber-200">{dem.gala}</b>
          </span>
        </div>
      </div>
    </div>
  );
}
