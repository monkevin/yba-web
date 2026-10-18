"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NhomTab = { ten: string; tab: { href: string; ten: string }[] };

/**
 * Hai tầng: nhóm theo vòng đời sự kiện (Chuẩn bị → Khách mời → Tài chính →
 * Tại sự kiện → Sau sự kiện), tầng dưới là các mục của nhóm đang mở.
 */
export default function TabSuKien({ nhom, goc }: { nhom: NhomTab[]; goc: string }) {
  const p = usePathname();
  const dung = (href: string) => (href === goc ? p === goc : p === href || p.startsWith(`${href}/`));
  const dangMo = nhom.find((n) => n.tab.some((t) => dung(t.href))) ?? nhom[0];
  return (
    <nav className="mb-5 print:hidden" aria-label="Mục của sự kiện">
      <div className="flex gap-1 overflow-x-auto border-b border-navy-100">
        {nhom.map((n) => {
          const on = n === dangMo;
          return (
            <Link
              key={n.ten}
              href={n.tab[0].href}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
                on ? "border-do-600 text-navy-800" : "border-transparent text-slate-500 hover:text-navy-700"
              }`}
            >
              {n.ten}
            </Link>
          );
        })}
      </div>
      {dangMo && dangMo.tab.length > 1 && (
        <div className="mt-2 flex gap-1 overflow-x-auto">
          {dangMo.tab.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-sm transition ${
                dung(t.href) ? "bg-navy-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.ten}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
