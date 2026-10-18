"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cho một khối nội dung mờ dần rồi trượt nhẹ lên khi người xem cuộn tới.
 *
 * Không dùng thư viện ngoài (AOS, GSAP…) mà dùng `IntersectionObserver` — thứ
 * trình duyệt nào cũng có sẵn. Đổi lại web không phải tải thêm gói nào, và
 * không có lời gọi ra máy chủ bên thứ ba.
 *
 * Ba điều quan trọng:
 *  - Hiện MỘT LẦN rồi thôi (`once`), không lặp lại khi cuộn ngược lên — cuộn
 *    lên xuống mà nội dung cứ nhấp nháy thì rất khó chịu.
 *  - Ai bật "giảm chuyển động" trong hệ điều hành thì hiện thẳng, không hiệu
 *    ứng. Người say chuyển động (vestibular) cần điều này.
 *  - Máy không hỗ trợ hoặc JavaScript hỏng thì nội dung vẫn hiện đầy đủ —
 *    hiệu ứng chỉ là lớp trang trí, không được phép giấu mất nội dung.
 */
export default function HienDan({
  children,
  cho = 0,
  huong = "len",
  the: The = "div",
  id,
  className = "",
}: {
  children: React.ReactNode;
  /** Chờ bao nhiêu mili giây rồi mới hiện — dùng để các thẻ hiện lần lượt */
  cho?: number;
  /** Trượt từ đâu tới: dưới lên, trái sang, phải sang, hoặc chỉ mờ dần */
  huong?: "len" | "trai" | "phai" | "mo";
  /** Thẻ HTML sẽ dựng ra. Để `section` thì không sinh thêm thẻ bọc thừa. */
  the?: "div" | "section" | "li" | "article";
  className?: string;
  /** Neo để nhảy tới từ đường dẫn dạng /tai-tro#nhip-cau */
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [hien, setHien] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Người dùng chọn giảm chuyển động → bỏ qua hiệu ứng.
    // Khung nhìn cao 0 (trang nằm trong iframe bị ẩn, cửa sổ thu nhỏ hết cỡ,
    // vài công cụ xem trước) → IntersectionObserver không bao giờ báo gì, để
    // nguyên là mất trắng nội dung. Trường hợp đó hiện thẳng.
    const itChuyenDong = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (
      itChuyenDong.matches ||
      !("IntersectionObserver" in window) ||
      window.innerHeight === 0
    ) {
      setHien(true);
      return;
    }

    // Khối đã nằm trong màn hình ngay lúc tải (phần đầu trang) thì hiện luôn,
    // khỏi phải chờ cuộn
    const theo = new IntersectionObserver(
      (muc) => {
        for (const m of muc) {
          if (m.isIntersecting) {
            setHien(true);
            theo.disconnect();
          }
        }
      },
      // rootMargin âm ở đáy: chờ khối vào sâu 60px mới chạy, giống cách
      // mắt người thật sự "nhìn thấy" nó
      { threshold: 0.05, rootMargin: "0px 0px -60px 0px" }
    );
    theo.observe(el);

    // Lưới an toàn cho trường hợp trang được dựng lúc tab ĐANG ẨN.
    //
    // Lúc tab ẩn, trình duyệt không giao kết quả IntersectionObserver. Người
    // mở link ở tab nền thì không sao — bấm sang tab là trình duyệt giao lại
    // ngay, hiệu ứng chạy bình thường. Nhưng có những nơi trang bị dựng mà
    // KHÔNG BAO GIỜ được hiện ra: cửa sổ xem trước, công cụ chụp màn hình,
    // in ra PDF, trình đọc rút gọn. Ở đó nội dung sẽ nằm im ở độ mờ 0 — mất
    // trắng.
    //
    // Nên: chỉ hẹn giờ khi tab đang ẩn, và tới giờ vẫn còn ẩn thì mới hiện
    // thẳng. Tab hiện bình thường thì không hẹn gì cả, hiệu ứng nguyên vẹn.
    let cuu = 0;
    if (document.hidden) {
      cuu = window.setTimeout(() => {
        if (document.hidden) {
          setHien(true);
          theo.disconnect();
        }
      }, 2000);
    }

    return () => {
      if (cuu) window.clearTimeout(cuu);
      theo.disconnect();
    };
  }, []);

  const batDau = {
    len: "translate-y-6",
    trai: "-translate-x-6",
    phai: "translate-x-6",
    mo: "",
  }[huong];

  return (
    <The
      ref={ref as React.Ref<never>}
      id={id}
      style={hien && cho ? { transitionDelay: `${cho}ms` } : undefined}
      // Lớp `hien-dan` để bản dựng sẵn từ máy chủ có cái mà bấu víu: máy tắt
      // JavaScript thì thẻ <noscript> trong layout ép hiện lại (xem globals).
      className={`hien-dan motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out ${
        hien ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${batDau}`
      } ${className}`}
    >
      {children}
    </The>
  );
}
