import type { Metadata } from "next";
import { docGiaoDien } from "@/lib/giao-dien";
import FormDangNhap from "./FormDangNhap";

export const metadata: Metadata = {
  title: "Đăng nhập",
  robots: { index: false, follow: false },
};

/**
 * Trang đăng nhập khu hội viên. Phần form nằm ở FormDangNhap (client);
 * trang này là server component để khai được tiêu đề tab riêng và đọc
 * logo + hotline từ cấu hình giao diện.
 *
 * `?het=1`: auth.ts / layout nội bộ đưa về đây khi cookie còn chữ ký hợp lệ mà
 * tài khoản đã bị khoá / xoá — proxy.ts xoá cookie và để yên trang này (không
 * đẩy về /tai-khoan nữa, tránh vòng lặp chuyển hướng).
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ het?: string }>;
}) {
  const [gd, sp] = await Promise.all([docGiaoDien(), searchParams]);
  return (
    <FormDangNhap
      logo={gd.logo}
      hotline={gd.hotline}
      hetPhien={sp.het === "1"}
    />
  );
}
