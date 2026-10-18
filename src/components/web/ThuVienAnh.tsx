"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Lưới ảnh có thể bấm vào xem lớn toàn màn hình, chuyển ảnh bằng nút hoặc phím
 * mũi tên. Dùng chung cho album sự kiện và thư viện ảnh hồ sơ doanh nghiệp.
 */
export default function ThuVienAnh({
  anh,
  tieuDe,
  cot = 3,
}: {
  anh: string[];
  tieuDe: string;
  /** Số cột trên màn hình lớn */
  cot?: 2 | 3 | 4;
}) {
  const [mo, datMo] = useState<number | null>(null);

  const dong = useCallback(() => datMo(null), []);
  const truoc = useCallback(
    () => datMo((i) => (i === null ? null : (i - 1 + anh.length) % anh.length)),
    [anh.length]
  );
  const sau = useCallback(
    () => datMo((i) => (i === null ? null : (i + 1) % anh.length)),
    [anh.length]
  );

  useEffect(() => {
    if (mo === null) return;
    const phim = (e: KeyboardEvent) => {
      if (e.key === "Escape") dong();
      if (e.key === "ArrowLeft") truoc();
      if (e.key === "ArrowRight") sau();
    };
    window.addEventListener("keydown", phim);
    // Khoá cuộn nền khi đang xem ảnh lớn
    const cuOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", phim);
      document.body.style.overflow = cuOverflow;
    };
  }, [mo, dong, truoc, sau]);

  if (!anh.length) return null;

  const luoi = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[cot];

  return (
    <>
      <div className={`grid grid-cols-2 gap-3 ${luoi}`}>
        {anh.map((a, i) => (
          <button
            key={`${a}-${i}`}
            type="button"
            onClick={() => datMo(i)}
            className="group relative overflow-hidden rounded-xl ring-1 ring-navy-100 transition hover:ring-2 hover:ring-do-400"
            aria-label={`Xem ảnh ${i + 1} của ${anh.length}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={a}
              alt={`${tieuDe} — ảnh ${i + 1}`}
              loading="lazy"
              className="ratio-3-2 w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <span className="pointer-events-none absolute inset-0 grid place-items-center bg-navy-900/0 text-2xl opacity-0 transition group-hover:bg-navy-900/25 group-hover:opacity-100">
              🔍
            </span>
          </button>
        ))}
      </div>

      {mo !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/95 p-4"
          onClick={dong}
          role="dialog"
          aria-modal="true"
          aria-label={`Ảnh ${mo + 1} của ${anh.length}`}
        >
          <button
            type="button"
            onClick={dong}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25"
            aria-label="Đóng"
          >
            ✕
          </button>

          {anh.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  truoc();
                }}
                className="absolute left-2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25 sm:left-6"
                aria-label="Ảnh trước"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sau();
                }}
                className="absolute right-2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25 sm:right-6"
                aria-label="Ảnh sau"
              >
                ›
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={anh[mo]}
            alt={`${tieuDe} — ảnh ${mo + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />

          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white">
            {mo + 1} / {anh.length}
          </p>
        </div>
      )}
    </>
  );
}
