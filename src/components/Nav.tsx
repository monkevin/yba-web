"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type NavItem = { href: string; label: string; badge?: number };

export default function Nav({
  items,
  userName,
  roleLabel,
}: {
  items: NavItem[];
  userName: string;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="bg-white ring-1 ring-navy-100 border-t-2 border-do-600 sticky top-0 z-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/tai-khoan" className="flex items-center gap-2">
              {/* Logo Chi hội — ảnh tĩnh trong /public */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-yba-cholon.png"
                alt="YBA Chợ Lớn"
                className="h-8 w-8"
              />
              <span className="font-semibold text-slate-800 hidden sm:block">
                Khu hội viên
              </span>
            </Link>
            <Link
              href="/"
              className="hidden rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 sm:block"
              title="Về trang công khai ybacholon.vn"
            >
              ← Website
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive(it.href)
                    ? "bg-navy-50 text-navy-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {it.label}
                {!!it.badge && (
                  <span className="ml-1.5 rounded-full bg-do-500 px-1.5 py-0.5 text-[11px] font-bold text-white align-middle">
                    {it.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right leading-tight">
              <div className="text-sm font-medium text-slate-800">{userName}</div>
              <div className="text-[11px] text-slate-500">{roleLabel}</div>
            </div>
            <form action="/api/auth/logout" method="post">
              <button className="rounded-lg px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
                Thoát
              </button>
            </form>
            <button
              onClick={() => setOpen((v) => !v)}
              className="grid h-11 w-11 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Menu"
              aria-expanded={open}
            >
              ☰
            </button>
          </div>
        </div>

        {open && (
          <nav className="md:hidden pb-3 grid gap-1">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                // min-h-11 = 44px — cỡ tối thiểu để bấm trúng bằng ngón tay
                className={`flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive(it.href)
                    ? "bg-navy-50 text-navy-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {it.label}
                {!!it.badge && (
                  <span className="ml-1.5 rounded-full bg-do-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                    {it.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
