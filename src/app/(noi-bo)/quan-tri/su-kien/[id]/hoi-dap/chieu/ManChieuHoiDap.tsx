"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MaQr from "@/components/MaQr";

export default function ManChieuHoiDap({
  tieuDe,
  cauHoi,
  linkGui,
}: {
  tieuDe: string;
  cauHoi: { id: string; noiDung: string; ten: string | null } | null;
  linkGui: string | null;
}) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(t);
  }, [router]);
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-10 text-white">
      <div className="flex items-center justify-between">
        <span className="text-sm uppercase tracking-[0.25em] text-navy-200">{tieuDe} · Hỏi đáp</span>
        <button
          onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}
          className="rounded bg-white/10 px-3 py-1 text-sm print:hidden"
        >
          Toàn màn hình
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center gap-12">
        <div className="max-w-4xl">
          {cauHoi ? (
            <>
              <p className="text-4xl font-semibold leading-snug sm:text-5xl">&ldquo;{cauHoi.noiDung}&rdquo;</p>
              <p className="mt-6 text-2xl text-amber-200">— {cauHoi.ten || "Khán giả"}</p>
            </>
          ) : (
            <p className="text-3xl text-navy-200">Mời anh/chị gửi câu hỏi cho diễn giả</p>
          )}
        </div>
        {linkGui && (
          <div className="shrink-0 text-center">
            <MaQr noiDung={linkGui} rong={220} nhan="Mã QR gửi câu hỏi" className="rounded-lg" />
            <p className="mt-2 text-sm text-navy-200">Quét để gửi câu hỏi</p>
          </div>
        )}
      </div>
    </div>
  );
}
