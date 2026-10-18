"use client";

import { useEffect, useRef } from "react";

/**
 * Lưới chấm phủ nền, chấm nào gần con trỏ thì sáng lên và to ra.
 *
 * Đây là thứ tạo nên cảm giác "công nghệ" của y-n10.com. Trang đó vẽ
 * bằng WebGL với bộ máy đồ hoạ viết riêng; ở đây chỉ là canvas 2D vài
 * nghìn chấm — nhẹ hơn hàng chục lần mà mắt thường nhìn gần như nhau.
 *
 * Bốn thứ giữ cho nó không làm chậm máy:
 *  - Chỉ vẽ khi khối đang nằm trong màn hình (IntersectionObserver).
 *  - Chỉ vẽ khi tab đang mở (document.hidden).
 *  - Máy cảm ứng thì KHÔNG chạy: không có con trỏ nên hiệu ứng vô
 *    nghĩa, mà pin điện thoại thì tốn thật.
 *  - Người bật "giảm chuyển động" thì vẽ đúng một khung hình tĩnh.
 */
export default function LuoiDiem({
  mau = "230, 32, 57",
  khoangCach = 26,
  className = "",
}: {
  /** Màu chấm dạng "r, g, b" — mặc định đỏ son #e62039 */
  mau?: string;
  /** Khoảng cách giữa hai chấm, tính bằng điểm ảnh CSS */
  khoangCach?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const itChuyenDong = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    // Màn cảm ứng không có con trỏ để mà đuổi theo
    const coTro = window.matchMedia("(hover: hover)").matches;

    let rong = 0;
    let cao = 0;
    // Toạ độ chuột. Để ngoài khung lúc đầu nên chưa rê thì chưa có chấm nào sáng.
    let chuotX = -9999;
    let chuotY = -9999;
    let khung = 0;
    let dangHien = true;

    const doLai = () => {
      const r = canvas.getBoundingClientRect();
      // Giới hạn tỉ lệ điểm ảnh ở 2: màn 3x (điện thoại đời mới) mà vẽ
      // đủ thì số chấm tăng gấp rưỡi mà mắt không nhận ra khác biệt.
      const ty = Math.min(window.devicePixelRatio || 1, 2);
      rong = r.width;
      cao = r.height;
      canvas.width = Math.round(rong * ty);
      canvas.height = Math.round(cao * ty);
      ctx.setTransform(ty, 0, 0, ty, 0, 0);
    };

    const ve = () => {
      ctx.clearRect(0, 0, rong, cao);
      // Bán kính vùng con trỏ "thắp sáng"
      const banKinh = 170;
      for (let x = khoangCach / 2; x < rong; x += khoangCach) {
        for (let y = khoangCach / 2; y < cao; y += khoangCach) {
          const dx = x - chuotX;
          const dy = y - chuotY;
          // So bình phương thay vì lấy căn — cùng kết quả, nhanh hơn
          const binhPhuong = dx * dx + dy * dy;
          let gan = 0;
          if (binhPhuong < banKinh * banKinh) {
            gan = 1 - Math.sqrt(binhPhuong) / banKinh;
            gan = gan * gan; // cong lại cho vùng sáng gọn, không loang
          }
          const mo = 0.1 + gan * 0.85;
          const bk = 0.9 + gan * 2.1;
          ctx.beginPath();
          ctx.arc(x, y, bk, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${mau}, ${mo})`;
          ctx.fill();
        }
      }
    };

    const vong = () => {
      ve();
      khung = requestAnimationFrame(vong);
    };

    const batDau = () => {
      if (khung || itChuyenDong || !coTro) return;
      khung = requestAnimationFrame(vong);
    };
    const dungLai = () => {
      if (!khung) return;
      cancelAnimationFrame(khung);
      khung = 0;
    };

    const theoChuot = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      chuotX = e.clientX - r.left;
      chuotY = e.clientY - r.top;
    };
    const roiKhoi = () => {
      chuotX = -9999;
      chuotY = -9999;
    };

    doLai();
    ve(); // vẽ sẵn một khung tĩnh, chưa rê chuột vẫn thấy lưới

    const doKhung = new ResizeObserver(() => {
      doLai();
      ve();
    });
    doKhung.observe(canvas);

    const theoTam = new IntersectionObserver(
      (muc) => {
        dangHien = muc[0]?.isIntersecting ?? true;
        if (dangHien && !document.hidden) batDau();
        else dungLai();
      },
      { threshold: 0 }
    );
    theoTam.observe(canvas);

    const doiTab = () => {
      if (document.hidden) dungLai();
      else if (dangHien) batDau();
    };

    window.addEventListener("pointermove", theoChuot, { passive: true });
    window.addEventListener("pointerleave", roiKhoi);
    document.addEventListener("visibilitychange", doiTab);
    batDau();

    return () => {
      dungLai();
      doKhung.disconnect();
      theoTam.disconnect();
      window.removeEventListener("pointermove", theoChuot);
      window.removeEventListener("pointerleave", roiKhoi);
      document.removeEventListener("visibilitychange", doiTab);
    };
  }, [mau, khoangCach]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
