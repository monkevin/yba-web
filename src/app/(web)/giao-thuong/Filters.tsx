"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export type LuaChon = { value: string; label: string; count?: number };

/** Thanh lọc của chợ nhu cầu mua – bán. */
export default function Filters({
  nganhNghe,
  khuVuc,
  tong,
}: {
  nganhNghe: LuaChon[];
  khuVuc: LuaChon[];
  tong: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [dangChay, batDau] = useTransition();
  const [tuKhoa, setTuKhoa] = useState(sp.get("q") ?? "");

  const loai = sp.get("loai") ?? "";

  function dat(khoa: string, giaTri: string) {
    const tiep = new URLSearchParams(sp.toString());
    if (giaTri) tiep.set(khoa, giaTri);
    else tiep.delete(khoa);
    tiep.delete("trang");
    batDau(() => router.push(`${pathname}?${tiep.toString()}`));
  }

  const TAB: LuaChon[] = [
    { value: "", label: "Tất cả tin" },
    { value: "CAN_BAN", label: "Cần bán · chào hàng" },
    { value: "CAN_MUA", label: "Cần mua · tìm nguồn" },
  ];

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-navy-100 shadow-sm">
      {/* Hai loại tin — thứ người dùng chọn đầu tiên nên để to, rõ */}
      <div className="flex flex-wrap gap-2">
        {TAB.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => dat("loai", t.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              loai === t.value
                ? "bg-navy-600 text-white"
                : "bg-navy-50 text-navy-700 hover:bg-navy-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]">
        <div>
          <label htmlFor="tim" className="lbl">
            Tìm nhu cầu
          </label>
          <div className="flex gap-2">
            <input
              id="tim"
              className="inp"
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") dat("q", tuKhoa.trim());
              }}
              placeholder="Ví dụ: vải suit, bao bì giấy, vận chuyển container…"
            />
            <button
              type="button"
              onClick={() => dat("q", tuKhoa.trim())}
              className="btn-primary shrink-0"
            >
              Tìm
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="nganh" className="lbl">
            Ngành nghề
          </label>
          <select
            id="nganh"
            className="inp"
            value={sp.get("nganh") ?? ""}
            onChange={(e) => dat("nganh", e.target.value)}
          >
            <option value="">Tất cả ngành nghề</option>
            {nganhNghe.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
                {o.count ? ` (${o.count})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="khuvuc" className="lbl">
            Khu vực
          </label>
          <select
            id="khuvuc"
            className="inp"
            value={sp.get("khuvuc") ?? ""}
            onChange={(e) => dat("khuvuc", e.target.value)}
          >
            <option value="">Toàn khu vực</option>
            {khuVuc.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
                {o.count ? ` (${o.count})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-slate-600">
          {dangChay ? (
            "Đang lọc…"
          ) : (
            <>
              Có <strong className="text-navy-800">{tong}</strong> tin đang hiển thị
            </>
          )}
        </p>
        {(sp.get("q") || sp.get("nganh") || sp.get("khuvuc") || loai) && (
          <button
            type="button"
            onClick={() => {
              setTuKhoa("");
              batDau(() => router.push(pathname));
            }}
            className="font-medium text-do-600 hover:underline"
          >
            Xoá bộ lọc
          </button>
        )}
      </div>
    </div>
  );
}
