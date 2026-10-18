"use client";

import { useRef, useState } from "react";

/**
 * Chọn nhiều ảnh cho một tin đăng. Lưu thành chuỗi JSON mảng đường dẫn trong một
 * input ẩn để gửi kèm form (khớp với cột `Listing.images`).
 */
export default function NhieuAnh({
  name,
  label,
  giaTriBanDau,
  toiDa = 6,
}: {
  name: string;
  label: string;
  giaTriBanDau?: string | null;
  toiDa?: number;
}) {
  const [anh, setAnh] = useState<string[]>(() => {
    if (!giaTriBanDau) return [];
    try {
      const a = JSON.parse(giaTriBanDau);
      return Array.isArray(a) ? a.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  });
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState("");
  const chonTep = useRef<HTMLInputElement>(null);

  async function tai(ds: FileList | null) {
    if (!ds?.length) return;
    setLoi("");
    setDangTai(true);
    const them: string[] = [];
    try {
      for (const tep of Array.from(ds).slice(0, toiDa - anh.length)) {
        const fd = new FormData();
        fd.append("file", tep);
        const res = await fetch("/api/tai-len", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Tải ảnh thất bại");
        them.push(data.url);
      }
      setAnh((cu) => [...cu, ...them]);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Tải ảnh thất bại");
    } finally {
      setDangTai(false);
      if (chonTep.current) chonTep.current.value = "";
    }
  }

  function doiCho(i: number, huong: -1 | 1) {
    setAnh((cu) => {
      const j = i + huong;
      if (j < 0 || j >= cu.length) return cu;
      const moi = [...cu];
      [moi[i], moi[j]] = [moi[j], moi[i]];
      return moi;
    });
  }

  return (
    <div>
      <span className="lbl">{label}</span>
      <input type="hidden" name={name} value={anh.length ? JSON.stringify(anh) : ""} />

      {anh.length > 0 && (
        <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {anh.map((a, i) => (
            <li
              key={a}
              className="group relative overflow-hidden rounded-xl ring-1 ring-slate-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a} alt="" className="ratio-3-2 w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-navy-700/90 px-2 py-0.5 text-[11px] font-semibold text-white">
                  Ảnh bìa
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/50 p-1.5 opacity-0 transition group-hover:opacity-100">
                <span className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => doiCho(i, -1)}
                    disabled={i === 0}
                    className="rounded bg-white/90 px-1.5 text-sm disabled:opacity-40"
                    title="Chuyển lên trước"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => doiCho(i, 1)}
                    disabled={i === anh.length - 1}
                    className="rounded bg-white/90 px-1.5 text-sm disabled:opacity-40"
                    title="Chuyển ra sau"
                  >
                    →
                  </button>
                </span>
                <button
                  type="button"
                  onClick={() => setAnh((cu) => cu.filter((x) => x !== a))}
                  className="rounded bg-white/90 px-1.5 text-sm text-do-600"
                  title="Xoá ảnh"
                >
                  Xoá
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={chonTep}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => tai(e.target.files)}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={dangTai || anh.length >= toiDa}
          onClick={() => chonTep.current?.click()}
          className="btn-ghost"
        >
          {dangTai ? "Đang tải..." : `+ Thêm ảnh (${anh.length}/${toiDa})`}
        </button>
        <p className="text-xs text-slate-500">
          Ảnh đầu tiên dùng làm ảnh bìa của tin. Kéo thứ tự bằng nút ← →.
        </p>
      </div>
      {loi && <p className="mt-2 text-sm text-do-600">{loi}</p>}
    </div>
  );
}
