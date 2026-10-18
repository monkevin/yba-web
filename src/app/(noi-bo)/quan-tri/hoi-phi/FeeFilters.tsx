"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function FeeFilters({
  chapters,
}: {
  chapters: { id: string; name: string }[];
}) {
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

  return (
    <div className="card flex flex-wrap items-end gap-3 p-3">
      <div className="min-w-[200px] flex-1">
        <label className="lbl">Tìm hội viên</label>
        <input
          className="inp"
          defaultValue={sp.get("q") ?? ""}
          placeholder="Tên, doanh nghiệp, mã hội viên"
          onKeyDown={(e) => {
            if (e.key === "Enter") set("q", (e.target as HTMLInputElement).value);
          }}
          onBlur={(e) => {
            if (e.target.value !== (sp.get("q") ?? "")) set("q", e.target.value);
          }}
        />
      </div>
      <div className="w-52">
        <label className="lbl">Chi hội</label>
        <select
          className="inp"
          value={sp.get("nhom") ?? ""}
          onChange={(e) => set("nhom", e.target.value)}
        >
          <option value="">Tất cả chi hội</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="w-44">
        <label className="lbl">Trạng thái</label>
        <select
          className="inp"
          value={sp.get("tt") ?? ""}
          onChange={(e) => set("tt", e.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="no">Còn nợ năm nay</option>
          <option value="mien">Được miễn</option>
        </select>
      </div>
    </div>
  );
}
