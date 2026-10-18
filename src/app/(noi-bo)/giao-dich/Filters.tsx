"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { STATUS_LABEL } from "@/lib/deal";
import { PERIOD_OPTIONS } from "@/lib/period";

/** Thanh lọc dùng chung: giữ nguyên các tham số khác khi đổi một tiêu chí. */
export default function Filters({ showStatus = true }: { showStatus?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function set(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("trang");
    router.push(`${pathname}?${next.toString()}`);
  }

  const ky = sp.get("ky") ?? "";

  return (
    <div className="card mb-4 flex flex-wrap items-end gap-3 p-3">
      <div className="min-w-[200px] flex-1">
        <label className="lbl">Tìm kiếm</label>
        <input
          className="inp"
          defaultValue={sp.get("q") ?? ""}
          placeholder="Mã giao dịch, tên công ty..."
          onKeyDown={(e) => {
            if (e.key === "Enter") set("q", (e.target as HTMLInputElement).value);
          }}
          onBlur={(e) => {
            if (e.target.value !== (sp.get("q") ?? "")) set("q", e.target.value);
          }}
        />
      </div>

      {showStatus && (
        <div className="w-48">
          <label className="lbl">Trạng thái</label>
          <select
            className="inp"
            value={sp.get("tt") ?? ""}
            onChange={(e) => set("tt", e.target.value)}
          >
            <option value="">Tất cả</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="w-40">
        <label className="lbl">Kỳ</label>
        <select
          className="inp"
          value={ky || "tat-ca"}
          onChange={(e) => set("ky", e.target.value)}
        >
          {PERIOD_OPTIONS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {ky === "tuy-chon" && (
        <>
          <div className="w-40">
            <label className="lbl">Từ ngày</label>
            <input
              type="date"
              className="inp"
              defaultValue={sp.get("tu") ?? ""}
              onChange={(e) => set("tu", e.target.value)}
            />
          </div>
          <div className="w-40">
            <label className="lbl">Đến ngày</label>
            <input
              type="date"
              className="inp"
              defaultValue={sp.get("den") ?? ""}
              onChange={(e) => set("den", e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
}
