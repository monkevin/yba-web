"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Tự tải lại số liệu trang (server component force-dynamic) mỗi `giay` giây. */
export default function TuLamMoi({ giay = 15 }: { giay?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), giay * 1000);
    return () => clearInterval(t);
  }, [router, giay]);
  return (
    <span className="text-xs text-slate-400">↻ tự cập nhật mỗi {giay} giây</span>
  );
}
