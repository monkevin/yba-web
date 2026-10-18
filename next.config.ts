import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Đóng gói kèm luôn phần Node cần thiết vào `.next/standalone`, để ảnh
   * Docker không phải chép cả `node_modules` (nặng hơn 1 GB). Chạy trên máy
   * chủ bằng `node server.js` thay vì `next start`.
   */
  output: "standalone",
};

export default nextConfig;
