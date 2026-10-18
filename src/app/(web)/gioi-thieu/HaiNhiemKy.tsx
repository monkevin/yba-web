"use client";

import { useState, type ReactNode } from "react";

/**
 * Nút chuyển giữa hai bộ máy trên trang Giới thiệu (Chủ nhiệm yêu cầu
 * 24/09/2026): Ban Chủ nhiệm NK XII (đương nhiệm, bộ ảnh vest NÂU) và Ban
 * Điều hành NK I 2026–2029 (ra mắt tại Lễ chuyển giao 10.10, bộ ảnh vest
 * NAVY). Nội dung hai tab do server dựng sẵn, đây chỉ bật tắt hiển thị.
 */
export default function HaiNhiemKy({
  nk12,
  nk1,
}: {
  nk12: ReactNode;
  nk1: ReactNode;
}) {
  const [tab, setTab] = useState<"NK12" | "NK1">("NK12");
  const lop = (chon: boolean) =>
    `rounded-full px-5 py-2.5 text-sm font-bold transition ${
      chon
        ? "bg-white text-navy-800 shadow"
        : "bg-white/10 text-white/80 hover:bg-white/20"
    }`;
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setTab("NK12")} className={lop(tab === "NK12")}>
          Nhiệm kỳ XII (2023 – 2026)
        </button>
        <button type="button" onClick={() => setTab("NK1")} className={lop(tab === "NK1")}>
          ✦ Ban Điều hành NK I (2026 – 2029)
        </button>
      </div>
      <div className={tab === "NK12" ? "" : "hidden"}>{nk12}</div>
      <div className={tab === "NK1" ? "" : "hidden"}>{nk1}</div>
    </div>
  );
}
