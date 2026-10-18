"use client";

import { useMemo } from "react";

/** Pháo giấy rơi khi vượt trạm — thuần CSS, tự tắt khi bật "giảm chuyển động". */
export default function PhaoGiay({ so = 60 }: { so?: number }) {
  const manh = useMemo(() => {
    const mau = ["#e62039", "#e3b94a", "#ffffff", "#42559b", "#10b981", "#f79aa1"];
    return Array.from({ length: so }, (_, i) => ({
      left: `${(i * 97) % 100}%`,
      bg: mau[i % mau.length],
      x: `${((i * 53) % 120) - 60}px`,
      r: `${360 + ((i * 131) % 720)}deg`,
      t: `${2 + ((i * 17) % 20) / 10}s`,
      d: `${((i * 7) % 12) / 10}s`,
    }));
  }, [so]);
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {manh.map((m, i) => (
        <span
          key={i}
          className="nn-giay"
          style={
            {
              left: m.left,
              background: m.bg,
              "--x": m.x,
              "--r": m.r,
              "--t": m.t,
              "--d": m.d,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
