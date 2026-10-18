"use client";

import { useEffect, useRef } from "react";

/**
 * Vạch mảnh chạy ngang đỉnh trang, dài dần theo mức đã cuộn.
 *
 * Cho người đọc biết bài còn dài bao nhiêu — trang chủ và trang bài
 * viết của Chi hội đều dài, đây là thứ nhỏ mà hữu ích thật, không chỉ
 * để đẹp.
 *
 * Ưu tiên `animation-timeline: scroll()` — trình duyệt tự chạy, không
 * tốn một dòng JavaScript nào. Trình duyệt cũ chưa có thì mới dùng tới
 * sự kiện cuộn, và cũng chỉ ghi lại đúng một lần mỗi khung hình.
 */
export default function ThanhCuon() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Trình duyệt đã làm được bằng CSS thì để CSS lo (xem class dưới)
    if (CSS.supports?.("animation-timeline", "scroll()")) return;

    let cho = 0;
    const tinh = () => {
      cho = 0;
      const doc = document.documentElement;
      const toiDa = doc.scrollHeight - doc.clientHeight;
      const ty = toiDa > 0 ? doc.scrollTop / toiDa : 0;
      el.style.transform = `scaleX(${ty})`;
    };
    const khiCuon = () => {
      if (cho) return;
      cho = requestAnimationFrame(tinh);
    };

    tinh();
    window.addEventListener("scroll", khiCuon, { passive: true });
    window.addEventListener("resize", khiCuon, { passive: true });
    return () => {
      window.removeEventListener("scroll", khiCuon);
      window.removeEventListener("resize", khiCuon);
      if (cho) cancelAnimationFrame(cho);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5"
    >
      <div
        ref={ref}
        className="thanh-cuon h-full origin-left bg-gradient-to-r from-son-600 via-son-500 to-vang-500"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
