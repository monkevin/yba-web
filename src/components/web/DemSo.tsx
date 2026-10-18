"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Con số chạy từ 0 lên giá trị thật khi người xem cuộn tới.
 *
 * QUAN TRỌNG — con số cuối cùng phải là con số THẬT lấy từ CSDL, hiệu
 * ứng chỉ là cách nó xuất hiện. Nhận sẵn chuỗi đã định dạng (`chu`) để
 * hiển thị lúc đứng yên, nên "41,2 tỷ" hay "1.234" vẫn ra đúng dấu
 * chấm phẩy tiếng Việt chứ không bị JavaScript định dạng lại kiểu Mỹ.
 *
 * Máy tắt JavaScript hoặc người bật "giảm chuyển động": hiện thẳng số
 * thật, không đếm. Con số không bao giờ được phép mất.
 */
export default function DemSo({
  den,
  chu,
  giay = 1.4,
  className = "",
}: {
  /** Giá trị thật, dùng để chạy số */
  den: number;
  /** Chuỗi hiển thị cuối cùng (đã định dạng sẵn). Không có thì dùng `den`. */
  chu?: string;
  giay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [hienTai, setHienTai] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window) ||
      den <= 0
    ) {
      return; // để nguyên số thật
    }

    let khung = 0;
    const theo = new IntersectionObserver(
      (muc) => {
        if (!muc.some((m) => m.isIntersecting)) return;
        theo.disconnect();
        const batDau = performance.now();
        const chay = (nay: number) => {
          const t = Math.min(1, (nay - batDau) / (giay * 1000));
          // Chậm dần về cuối — số dừng lại êm chứ không khựng
          const dam = 1 - Math.pow(1 - t, 3);
          setHienTai(Math.round(den * dam));
          if (t < 1) khung = requestAnimationFrame(chay);
          else setHienTai(null); // trả về chuỗi thật đã định dạng
        };
        khung = requestAnimationFrame(chay);
      },
      { threshold: 0.4 }
    );
    theo.observe(el);
    return () => {
      theo.disconnect();
      if (khung) cancelAnimationFrame(khung);
    };
  }, [den, giay]);

  return (
    <span ref={ref} className={className}>
      {hienTai === null
        ? (chu ?? String(den))
        : hienTai.toLocaleString("vi-VN")}
    </span>
  );
}
