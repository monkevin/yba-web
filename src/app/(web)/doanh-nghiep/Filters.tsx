"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export type LuaChon = { value: string; label: string; count?: number };

/**
 * Thanh lọc của danh bạ doanh nghiệp. Mọi lựa chọn đẩy vào query string để
 * trang có thể chia sẻ được bằng đường dẫn và vẫn render ở server (tốt cho SEO).
 */
export default function Filters({
  nganhNghe,
  khuVuc,
  hangHoiVien,
  tong,
}: {
  nganhNghe: LuaChon[];
  khuVuc: LuaChon[];
  hangHoiVien: LuaChon[];
  tong: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [dangChay, batDau] = useTransition();
  const [tuKhoa, setTuKhoa] = useState(sp.get("q") ?? "");

  function dat(khoa: string, giaTri: string) {
    const tiep = new URLSearchParams(sp.toString());
    if (giaTri) tiep.set(khoa, giaTri);
    else tiep.delete(khoa);
    tiep.delete("trang"); // đổi bộ lọc thì về trang 1
    batDau(() => router.push(`${pathname}?${tiep.toString()}`));
  }

  const dangLoc =
    !!sp.get("q") || !!sp.get("nganh") || !!sp.get("khuvuc") || !!sp.get("hang");

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-navy-100 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <div>
          <label htmlFor="tim" className="lbl">
            Tìm doanh nghiệp
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
              placeholder="Tên công ty, sản phẩm, dịch vụ, ngành nghề…"
            />
            <button
              type="button"
              onClick={() => dat("q", tuKhoa.trim())}
              className="btn-primary shrink-0"
            >
              Tìm
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Gõ không dấu cũng tìm được, ví dụ “bao bi” ra “bao bì”.
          </p>
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

        <div>
          <label htmlFor="hang" className="lbl">
            Hạng hội viên
          </label>
          <select
            id="hang"
            className="inp"
            value={sp.get("hang") ?? ""}
            onChange={(e) => dat("hang", e.target.value)}
          >
            <option value="">Tất cả hạng</option>
            {hangHoiVien.map((o) => (
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
              Tìm thấy <strong className="text-navy-800">{tong}</strong> doanh nghiệp
            </>
          )}
        </p>
        {dangLoc && (
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
