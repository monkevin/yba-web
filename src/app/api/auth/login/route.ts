import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createSessionValue,
  tuyChonCookiePhien,
} from "@/lib/auth";
import { LOI_DANG_NHAP, xacThucDangNhap } from "@/lib/dang-nhap";
import {
  bamIp,
  chuanDinhDanh,
  ghiThanhCong,
  ghiThatBai,
  kiemTraGioiHan,
  layIp,
  moTaThoiGianCho,
} from "@/lib/gioi-han-dang-nhap";

/**
 * Đăng nhập web bằng TÊN ĐĂNG NHẬP hoặc SỐ ĐIỆN THOẠI đã đăng ký + mật khẩu.
 * Mã hội viên (HVxxxx) KHÔNG phải định danh đăng nhập — xem src/lib/dang-nhap.ts.
 *
 * Mọi kiểu thất bại (không có tài khoản, SĐT trùng, sai mật khẩu, bị khoá) trả
 * cùng một thông báo và cùng thời gian xử lý, để không dò được tài khoản nào có
 * thật. Thử sai nhiều lần thì phải chờ (src/lib/gioi-han-dang-nhap.ts).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    username?: unknown;
    password?: unknown;
  };
  const dinhDanh =
    typeof body.username === "string" ? body.username.trim() : "";
  // Mật khẩu KHÔNG trim — khoảng trắng là một phần mật khẩu
  const matKhau = typeof body.password === "string" ? body.password : "";

  if (!dinhDanh || !matKhau) {
    return NextResponse.json(
      { error: "Vui lòng nhập tên đăng nhập (hoặc số điện thoại) và mật khẩu" },
      { status: 400 },
    );
  }
  if (dinhDanh.length > 100 || matKhau.length > 200) {
    return NextResponse.json({ error: LOI_DANG_NHAP }, { status: 401 });
  }

  const khoa = chuanDinhDanh(dinhDanh);
  const may = bamIp(layIp(req.headers));

  const gioiHan = kiemTraGioiHan(khoa, may);
  if (!gioiHan.choPhep) {
    return NextResponse.json(
      {
        error: `Anh/chị đã nhập sai nhiều lần. Vui lòng thử lại sau ${moTaThoiGianCho(gioiHan.conLaiGiay)}.`,
        choGiay: gioiHan.conLaiGiay,
      },
      { status: 429, headers: { "Retry-After": String(gioiHan.conLaiGiay) } },
    );
  }

  const tk = await xacThucDangNhap(dinhDanh, matKhau);
  if (!tk) {
    const cho = ghiThatBai(khoa, may);
    if (cho > 0) {
      return NextResponse.json(
        {
          error: `${LOI_DANG_NHAP}. Anh/chị đã nhập sai nhiều lần, vui lòng thử lại sau ${moTaThoiGianCho(cho)}.`,
          choGiay: cho,
        },
        { status: 429, headers: { "Retry-After": String(cho) } },
      );
    }
    return NextResponse.json({ error: LOI_DANG_NHAP }, { status: 401 });
  }
  ghiThanhCong(khoa, may);

  // Cờ Secure chỉ khi người dùng thật sự vào bằng https (trực tiếp hoặc qua
  // Nginx đặt X-Forwarded-Proto). Bản production chạy trên laptop, điện thoại
  // vào bằng http://<IP LAN>:3002 mà gắn Secure thì trình duyệt bỏ cookie →
  // đăng nhập xong vẫn bị đẩy về /login mãi (lỗi từng gặp 15/09/2026).
  const url = new URL(req.url);
  const laHttps =
    url.protocol === "https:" ||
    req.headers.get("x-forwarded-proto") === "https";
  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    SESSION_COOKIE,
    createSessionValue(tk.id),
    tuyChonCookiePhien(laHttps),
  );
  return res;
}
