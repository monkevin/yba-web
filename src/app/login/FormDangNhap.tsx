"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { duongDanTiep } from "./duong-dan-tiep";

/**
 * Form đăng nhập — phần chạy trên máy người xem.
 *
 * Tách khỏi page.tsx để trang có thể là server component (khai được tiêu đề
 * tab riêng và đọc cấu hình giao diện). Logo + hotline nhận từ server nên
 * Ban Chủ nhiệm đổi ở /quan-tri/giao-dien là nơi này đổi theo.
 */
export default function FormDangNhap({
  logo,
  hotline,
  hetPhien = false,
}: {
  logo: string;
  hotline: string;
  /** Bị đưa về vì phiên cũ không còn dùng được (tài khoản khoá / xoá) */
  hetPhien?: boolean;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Máy chủ bắt chờ sau nhiều lần sai: đếm ngược để nút bấm tự mở lại
  const [choDen, setChoDen] = useState(0);
  const [bayGio, setBayGio] = useState(0);

  useEffect(() => {
    if (!choDen) return;
    const t = setInterval(() => {
      const n = Date.now();
      setBayGio(n);
      if (n >= choDen) {
        setChoDen(0);
        setError("");
      }
    }, 1000);
    return () => clearInterval(t);
  }, [choDen]);

  const conCho = choDen ? Math.max(0, Math.ceil((choDen - bayGio) / 1000)) : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (conCho > 0) return;
    setLoading(true);
    setError("");
    let res: Response;
    try {
      res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      setError("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
      setLoading(false);
      return;
    }
    if (res.ok) {
      // proxy.ts gắn ?tiep=<đường-dẫn> khi chặn một trang cần đăng nhập.
      // Chỉ nhận đường dẫn nội bộ để tránh bị chuyển hướng ra ngoài.
      const tiep = new URLSearchParams(window.location.search).get("tiep");
      router.replace(duongDanTiep(tiep));
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Đăng nhập thất bại");
      if (res.status === 429 && Number(data.choGiay) > 0) {
        const n = Date.now();
        setBayGio(n);
        setChoDen(n + Number(data.choGiay) * 1000);
      }
      setLoading(false);
    }
  }

  return (
    <div className="san-do luoi-ky-thuat relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <form
        onSubmit={submit}
        className="relative w-full max-w-sm space-y-5 rounded-2xl bg-white p-6 shadow-xl sm:p-8"
      >
        <div className="text-center">
          {/* Logo đọc từ cấu hình giao diện */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="YBA Chợ Lớn" className="mx-auto h-16 w-16" />
          <h1 className="mt-4 text-xl font-bold text-navy-800">
            Khu hội viên YBA Chợ Lớn
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Đăng nhập bằng tài khoản hội viên
          </p>
        </div>

        {hetPhien && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Phiên đăng nhập cũ không còn dùng được (tài khoản có thể đã bị khoá
            hoặc thay đổi). Vui lòng đăng nhập lại.
          </p>
        )}

        <div>
          <label htmlFor="dn-ten" className="lbl">
            Tên đăng nhập hoặc số điện thoại
          </label>
          <input
            id="dn-ten"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="inp min-h-11 text-base sm:text-sm"
            placeholder="Tên đăng nhập hoặc số điện thoại"
          />
          {/* Từ 21/09/2026 (Chủ nhiệm chốt): tên đăng nhập LÀ mã hội viên
              viết thường — hv + 4 số, được đồng bộ bằng scripts/
              dong-bo-tai-khoan.ts mỗi khi đánh lại mã. Đừng nêu tên đăng
              nhập của người cụ thể làm ví dụ. */}
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Tên đăng nhập là mã hội viên viết thường (hv + 4 số). Quên mã thì
            dùng số điện thoại đã đăng ký với Chi hội.
          </p>
        </div>

        <div>
          <label htmlFor="dn-mk" className="lbl">
            Mật khẩu
          </label>
          <input
            id="dn-mk"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="inp min-h-11 text-base sm:text-sm"
            placeholder="Nhập mật khẩu"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-do-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || conCho > 0}
          className="btn-primary min-h-11 w-full"
        >
          {loading
            ? "Đang đăng nhập..."
            : conCho > 0
              ? `Thử lại sau ${conCho} giây`
              : "Đăng nhập"}
        </button>

        <p className="text-center text-sm">
          <Link
            href="/huong-dan-dang-nhap"
            className="inline-flex min-h-11 items-center font-medium text-navy-600 hover:underline"
          >
            Hướng dẫn đăng nhập
          </Link>
        </p>

        <p className="text-center text-sm text-slate-500">
          Chưa có tài khoản?{" "}
          <Link
            href="/dang-ky-hoi-vien"
            className="font-medium text-navy-600 hover:underline"
          >
            Đăng ký hội viên
          </Link>
        </p>
        {/* Lối thoát khi quên — web chưa có tự cấp lại mật khẩu, người giữ
            quản trị đổi hộ ở /quan-tri/tai-khoan rồi nhắn riêng */}
        <p className="text-center text-xs text-slate-500">
          Quên mật khẩu? Gọi{" "}
          <a
            href={`tel:${hotline.replace(/[^\d+]/g, "")}`}
            className="font-semibold text-navy-600 hover:underline"
          >
            {hotline}
          </a>{" "}
          để Văn phòng Chi hội cấp lại.
        </p>
        <p className="text-center text-xs text-slate-400">
          <Link href="/" className="hover:underline">
            ← Về trang chủ ybacholon.vn
          </Link>
        </p>
      </form>
    </div>
  );
}
