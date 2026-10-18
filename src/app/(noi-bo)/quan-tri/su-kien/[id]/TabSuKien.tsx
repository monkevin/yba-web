"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TabSuKien({ tab, goc }: { tab: { href: string; ten: string }[]; goc: string }) {
  const p = usePathname();
  return (
    <nav className="mb-5 flex gap-1 overflow-x-auto border-b border-navy-100 print:hidden" aria-label="Mục của sự kiện">
      {tab.map((t) => {
        const on = t.href === goc ? p === goc : p.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
              on ? "border-do-600 text-navy-800" : "border-transparent text-slate-500 hover:text-navy-700"
            }`}
          >
            {t.ten}
          </Link>
        );
      })}
    </nav>
  );
}
