"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { doiMatKhau, type KetQuaDoiMatKhau } from "./actions";

/**
 * Form đổi mật khẩu. Gửi qua onSubmit + startTransition (không dùng
 * `<form action>`): React 19 tự xoá trắng form sau mỗi lần gửi, máy chủ báo lỗi
 * là người dùng phải gõ lại cả ba ô.
 */
export default function FormDoiMatKhau({
  tenDangNhap,
}: {
  tenDangNhap: string;
}) {
  const [matKhauCu, setMatKhauCu] = useState("");
  const [matKhauMoi, setMatKhauMoi] = useState("");
  const [nhapLai, setNhapLai] = useState("");
  const [hien, setHien] = useState(false);
  const [kq, setKq] = useState<KetQuaDoiMatKhau>({});
  const [dangGui, startTransition] = useTransition();

  const khongKhop = nhapLai.length > 0 && nhapLai !== matKhauMoi;

  function gui(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setKq({});
    startTransition(async () => {
      const r = await doiMatKhau({ matKhauCu, matKhauMoi, nhapLai });
      setKq(r);
      if (r.ok) {
        setMatKhauCu("");
        setMatKhauMoi("");
        setNhapLai("");
      }
    });
  }

  const loaiO = hien ? "text" : "password";

  return (
    <form onSubmit={gui} className="card space-y-4 p-5">
      {/* Ô ẩn giúp trình quản lý mật khẩu của điện thoại lưu đúng tài khoản */}
      <input
        type="text"
        name="username"
        autoComplete="username"
        value={tenDangNhap}
        readOnly
        hidden
      />

      <div>
        <label htmlFor="mk-cu" className="lbl">
          Mật khẩu hiện tại
        </label>
        <input
          id="mk-cu"
          type={loaiO}
          value={matKhauCu}
          onChange={(e) => setMatKhauCu(e.target.value)}
          autoComplete="current-password"
          required
          className="inp min-h-11 text-base sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="mk-moi" className="lbl">
          Mật khẩu mới
        </label>
        <input
          id="mk-moi"
          type={loaiO}
          value={matKhauMoi}
          onChange={(e) => setMatKhauMoi(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          className="inp min-h-11 text-base sm:text-sm"
        />
        <p className="mt-1 text-xs text-slate-500">
          Ít nhất 8 ký tự. Không dùng 123456, tên đăng nhập hay số điện thoại
          của mình.
        </p>
      </div>

      <div>
        <label htmlFor="mk-lai" className="lbl">
          Nhập lại mật khẩu mới
        </label>
        <input
          id="mk-lai"
          type={loaiO}
          value={nhapLai}
          onChange={(e) => setNhapLai(e.target.value)}
          autoComplete="new-password"
          required
          className="inp min-h-11 text-base sm:text-sm"
        />
        {khongKhop && (
          <p className="mt-1 text-xs text-do-600">
            Chưa khớp với mật khẩu mới.
          </p>
        )}
      </div>

      <label className="flex min-h-11 items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={hien}
          onChange={(e) => setHien(e.target.checked)}
          className="h-5 w-5"
        />
        Hiện mật khẩu đang gõ
      </label>

      {kq.error && (
        <p
          role="alert"
          className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700"
        >
          {kq.error}
        </p>
      )}
      {kq.ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {kq.message}{" "}
          <Link href="/tai-khoan" className="font-semibold underline">
            Về trang tổng quan
          </Link>
        </p>
      )}

      <button
        type="submit"
        disabled={dangGui || khongKhop}
        className="btn-primary min-h-11 w-full sm:w-auto"
      >
        {dangGui ? "Đang lưu..." : "Đổi mật khẩu"}
      </button>
    </form>
  );
}
