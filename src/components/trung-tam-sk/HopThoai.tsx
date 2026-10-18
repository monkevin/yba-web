"use client";

import { useEffect } from "react";

/** Hộp thoại nổi dùng trong Trung tâm sự kiện (Esc / bấm nền để đóng). */
export default function HopThoai({
  mo,
  dong,
  tieuDe,
  rong,
  children,
}: {
  mo: boolean;
  dong: () => void;
  tieuDe: string;
  rong?: boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!mo) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && dong();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [mo, dong]);
  if (!mo) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/40 p-4 sm:p-10"
      onMouseDown={(e) => e.target === e.currentTarget && dong()}
    >
      <div className={`card w-full ${rong ? "max-w-3xl" : "max-w-lg"} p-5`} role="dialog" aria-modal="true" aria-label={tieuDe}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-navy-800">{tieuDe}</h2>
          <button onClick={dong} className="rounded px-2 text-xl leading-none text-slate-400 hover:text-slate-700" aria-label="Đóng">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
