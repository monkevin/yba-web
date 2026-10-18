"use client";

import { useRef, useState } from "react";

/**
 * Ô chọn ảnh: tải tệp lên `/api/tai-len` rồi giữ đường dẫn trong một input ẩn để
 * gửi kèm form. Không dùng `next/image` vì ảnh là do người dùng tải lên, kích
 * thước không biết trước.
 */
export default function AnhTaiLen({
  name,
  label,
  giaTriBanDau,
  goiY,
  tyLe = "vuong",
}: {
  name: string;
  label: string;
  giaTriBanDau?: string | null;
  goiY?: string;
  tyLe?: "vuong" | "bia" | "ngang";
}) {
  const [url, setUrl] = useState(giaTriBanDau ?? "");
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState("");
  const chonTep = useRef<HTMLInputElement>(null);

  const khung =
    tyLe === "bia"
      ? "aspect-[3/1] w-full"
      : tyLe === "ngang"
        ? "aspect-[3/2] w-full max-w-xs"
        : "h-28 w-28";

  async function tai(tep: File | undefined) {
    if (!tep) return;
    setLoi("");
    setDangTai(true);
    try {
      const fd = new FormData();
      fd.append("file", tep);
      const res = await fetch("/api/tai-len", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Tải ảnh thất bại");
      setUrl(data.url);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Tải ảnh thất bại");
    } finally {
      setDangTai(false);
      if (chonTep.current) chonTep.current.value = "";
    }
  }

  return (
    <div>
      <span className="lbl">{label}</span>
      <input type="hidden" name={name} value={url} />

      <div className="flex flex-wrap items-start gap-3">
        <div
          className={`${khung} grid shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200`}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt=""
              className={
                tyLe === "vuong"
                  ? "h-full w-full object-contain p-1"
                  : "h-full w-full object-cover"
              }
            />
          ) : (
            <span className="text-2xl text-slate-300">🖼️</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={chonTep}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => tai(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={dangTai}
            onClick={() => chonTep.current?.click()}
            className="btn-ghost"
          >
            {dangTai ? "Đang tải..." : url ? "Đổi ảnh" : "Chọn ảnh"}
          </button>
          {url && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="text-sm text-do-600 hover:underline"
            >
              Bỏ ảnh
            </button>
          )}
          {goiY && <p className="max-w-xs text-xs text-slate-500">{goiY}</p>}
          {loi && <p className="text-sm text-do-600">{loi}</p>}
        </div>
      </div>
    </div>
  );
}
