import { NextResponse } from "next/server";

/**
 * Mini App YBA Chợ Lớn gọi API này từ một domain khác (hạ tầng Zalo), nên mọi
 * route trong /api/mobile/* PHẢI trả CORS — thiếu là trình duyệt/webview chặn
 * đọc response dù request đã tới nơi (lỗi từng gặp: app hiện trắng, không báo gì).
 */
export function moJson(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

export function moOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
