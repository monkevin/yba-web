import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook bắt buộc khi phát hành Mini App (khai ở bước "Thiết lập chung" lúc
 * submit xét duyệt): Zalo gọi vào đây khi người dùng RÚT LẠI quyền đã cấp
 * (số điện thoại) hoặc yêu cầu xoá dữ liệu cá nhân.
 *
 * Dữ liệu cá nhân duy nhất app giữ TỪ ZALO là bảng PhienMiniApp (SĐT + mã
 * người dùng Zalo của phiên đăng nhập, xem src/lib/mobile-auth.ts) — nhận
 * sự kiện là xoá các phiên khớp. Hồ sơ hội viên trong danh bạ là dữ liệu
 * Chi hội tự quản từ trước, không lấy từ Zalo nên không thuộc phạm vi này.
 *
 * Zalo chỉ yêu cầu webhook chạy HTTPS và trả HTTP 200; payload không có đặc
 * tả công khai ổn định nên đọc "rộng": nhặt mọi trường tên giống user_id ở
 * mọi tầng của JSON rồi xoá phiên khớp. Không tìm thấy id nào vẫn phải trả
 * 200 — trả lỗi là Zalo coi như webhook hỏng và chặn submit.
 */

function nhatUserId(x: unknown, sau = 0): string[] {
  if (!x || typeof x !== "object" || sau > 4) return [];
  const ket: string[] = [];
  for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
    if (typeof v === "string" && /user_?id/i.test(k) && v.length >= 4) {
      ket.push(v);
    } else if (typeof v === "object") {
      ket.push(...nhatUserId(v, sau + 1));
    }
  }
  return ket;
}

export async function POST(req: Request) {
  let than: unknown = null;
  try {
    than = await req.json();
  } catch {
    /* thân rỗng / không phải JSON vẫn phải trả 200 */
  }

  const ids = [...new Set(nhatUserId(than))];
  let daXoa = 0;
  if (ids.length) {
    const r = await prisma.phienMiniApp.deleteMany({
      where: { zaloUserId: { in: ids } },
    });
    daXoa = r.count;
  }
  console.log(
    `[zalo-webhook] nhận sự kiện: ${ids.length} user id, đã xoá ${daXoa} phiên`
  );
  return NextResponse.json({ success: true });
}

// Bộ kiểm tra của Zalo có thể ping GET trước khi cho lưu URL.
export async function GET() {
  return NextResponse.json({ success: true });
}
