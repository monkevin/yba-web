"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PERIOD_OPTIONS } from "@/lib/period";

/** Chọn kỳ báo cáo — dùng chung cho trang báo cáo, mạng lưới, vinh danh. */
export default function PeriodPicker() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const ky = sp.get("ky") ?? "nam-nay";

  function set(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="card flex flex-wrap items-end gap-3 p-3">
      <div className="w-44">
        <label className="lbl">Kỳ báo cáo</label>
        <select
          className="inp"
          value={ky}
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
