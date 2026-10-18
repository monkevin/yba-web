"use client";

import { useEffect, useRef } from "react";

/**
 * Ghi toạ độ con trỏ vào biến CSS --x / --y cho MỌI phần tử `.the-sang`
 * nằm bên trong, để vệt sáng trong `globals.css` bám theo chuột.
 *
 * Đặt một cái ở ngoài cùng của lưới thẻ là đủ cho cả lưới — không cần
 * mỗi thẻ một bộ nghe sự kiện. Với 8–12 thẻ thì chênh lệch này là
 * thấy được.
 *
 * Không chạy trên màn cảm ứng (không có con trỏ) và khi người dùng bật
 * "giảm chuyển động". Lúc đó `.the-sang` không có --x/--y nên vệt sáng
 * nằm giữa thẻ — vẫn đẹp, không vỡ gì.
 */
export default function TheSang({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const goc = ref.current;
    if (!goc) return;
    if (
      !window.matchMedia("(hover: hover)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let chotLai = 0;
    const theo = (e: PointerEvent) => {
      // Gộp về một lần mỗi khung hình: pointermove bắn ra rất dày, ghi
      // biến CSS mỗi lần sẽ bắt trình duyệt tính lại bố cục liên tục.
      if (chotLai) return;
      chotLai = requestAnimationFrame(() => {
        chotLai = 0;
        const the = (e.target as Element | null)?.closest?.(".the-sang");
        if (!the || !goc.contains(the)) return;
        const r = the.getBoundingClientRect();
        (the as HTMLElement).style.setProperty(
          "--x",
          `${e.clientX - r.left}px`
        );
        (the as HTMLElement).style.setProperty("--y", `${e.clientY - r.top}px`);
      });
    };

    goc.addEventListener("pointermove", theo, { passive: true });
    return () => {
      goc.removeEventListener("pointermove", theo);
      if (chotLai) cancelAnimationFrame(chotLai);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
