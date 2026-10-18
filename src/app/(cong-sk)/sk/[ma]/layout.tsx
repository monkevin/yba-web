import type { Metadata } from "next";
import Link from "next/link";
import { gioVN, ngayVN } from "@/lib/trung-tam-sk/bang";
import { napCongTrang } from "./nap";

/**
 * Khung cổng QR cho khách — gọn cho điện thoại, không menu web, không cho
 * máy tìm kiếm lập chỉ mục (đường dẫn chỉ phát qua QR của Ban tổ chức).
 */

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ ma: string }> }): Promise<Metadata> {
  const { ma } = await params;
  const c = await napCongTrang(ma);
  return { title: { absolute: `${c.event.title} · YBA Chợ Lớn` }, robots: { index: false, follow: false } };
}

export default async function KhungCong({ children, params }: { children: React.ReactNode; params: Promise<{ ma: string }> }) {
  const { ma } = await params;
  const c = await napCongTrang(ma);
  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-900 via-navy-800 to-navy-900 px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <Link href={`/sk/${c.ma}`} className="inline-flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-yba-cholon.png" alt="" className="h-9 w-9 rounded-full bg-white p-0.5" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-200">YBA Chợ Lớn</span>
        </Link>
        <h1 className="mt-4 text-2xl font-bold leading-tight text-white">{c.event.title}</h1>
        <p className="mt-1 text-sm text-navy-200">
          {gioVN(c.event.startAt)} · {ngayVN(c.event.startAt)}
          {c.event.location ? ` · ${c.event.location}` : ""}
        </p>
        <main className="mt-5 rounded-2xl bg-white p-5 text-slate-800 shadow-xl">{children}</main>
        <p className="mt-6 text-center text-xs text-navy-300">
          Thông tin anh/chị gửi chỉ dùng cho Ban tổ chức sự kiện.
        </p>
      </div>
    </div>
  );
}
