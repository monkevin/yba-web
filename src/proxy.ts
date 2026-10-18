import { NextRequest, NextResponse } from "next/server";
import { duongDanTiep } from "@/app/login/duong-dan-tiep";

const SESSION_COOKIE = "yba_session";

/**
 * Web YBA Chợ Lớn CÔNG KHAI theo mặc định. Chỉ những nhánh dưới đây mới bắt
 * đăng nhập — mọi trang giới thiệu, danh bạ doanh nghiệp, chợ nhu cầu mua/bán
 * đều để khách vãng lai xem được (tốt cho SEO và quảng bá Hội).
 */
const PROTECTED = [
  "/tai-khoan",
  "/giao-dich",
  "/hoi-vien",
  "/bao-cao",
  "/mang-luoi",
  "/quan-tri",
  "/ngoi-nha",
  "/uu-dai",
  "/bang-hoat-dong",
];

/**
 * Chỉ xác minh CHỮ KÝ cookie ở lớp proxy (không đọc DB được ở edge).
 * Việc nạp user, kiểm tra active và phân quyền do getCurrentUser() ở server làm.
 */
async function hasValidSignature(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const idx = value.lastIndexOf(".");
  if (idx <= 0) return false;

  const payload = value.slice(0, idx);
  const signature = value.slice(idx + 1);

  const secret = process.env.SESSION_SECRET || "dev-secret-change-me";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signature === expected;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Tên miền con sự kiện: 1010.ybacholon.vn ──────────────────────
  // Khách mở gốc tên miền con thì phục vụ thẳng landing /1010 (địa chỉ
  // trên thanh trình duyệt GIỮ NGUYÊN 1010.ybacholon.vn — rewrite chứ
  // không redirect). Các đường dẫn khác (/_next, ảnh, form action…) đi
  // qua bình thường nên landing đủ tài nguyên để chạy. Muốn thêm tên
  // miền con sự kiện khác thì làm theo đúng mẫu này.
  const host = req.headers.get("host") ?? "";
  if (host.startsWith("1010.") && pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/1010";
    return NextResponse.rewrite(url);
  }

  const isLogin = pathname === "/login";
  const needsAuth = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!needsAuth && !isLogin) return NextResponse.next();

  const valid = await hasValidSignature(req.cookies.get(SESSION_COOKIE)?.value);

  if (!valid && needsAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    // Đăng nhập xong quay lại đúng trang đang muốn vào (giữ cả ?tham-số, vd
    // màn sân khấu Đấu trí `?san-khau=1`). Form lọc lại bằng duongDanTiep().
    url.searchParams.set("tiep", pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  if (isLogin && req.nextUrl.searchParams.get("het") === "1") {
    // Cookie còn chữ ký hợp lệ nhưng tài khoản đã bị khoá / xoá: auth.ts và layout
    // nội bộ đưa về /login?het=1. Phải để yên trang này và xoá cookie — đẩy tiếp
    // về /tai-khoan là vòng lặp chuyển hướng không dứt (proxy không đọc được DB).
    const res = NextResponse.next();
    if (req.cookies.has(SESSION_COOKIE)) {
      res.cookies.set(SESSION_COOKIE, "", {
        path: "/",
        maxAge: 0,
        httpOnly: true,
        sameSite: "lax",
        secure:
          req.nextUrl.protocol === "https:" ||
          req.headers.get("x-forwarded-proto") === "https",
      });
    }
    return res;
  }
  if (valid && isLogin) {
    // Đã đăng nhập mà bấm link "/login?tiep=/doanh-nghiep/…" ở trang công khai →
    // đưa thẳng tới trang đó (lọc qua duongDanTiep như form), không thì /tai-khoan
    const dich = new URL(
      duongDanTiep(req.nextUrl.searchParams.get("tiep")),
      "http://yba.invalid",
    );
    const url = req.nextUrl.clone();
    url.pathname = dich.pathname;
    url.search = dich.search;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
