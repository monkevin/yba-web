"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function MemberFilters({
  chapters,
  memberTypes,
}: {
  chapters: { id: string; name: string }[];
  memberTypes: string[];
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
    <div className="card mb-4 flex flex-wrap items-end gap-3 p-3">
      <div className="min-w-[220px] flex-1">
        <label className="lbl">Tìm hội viên</label>
        <input
          className="inp"
          defaultValue={sp.get("q") ?? ""}
          placeholder="Tên doanh nghiệp, ngành, sản phẩm đang bán / đang cần mua..."
          onKeyDown={(e) => {
            if (e.key === "Enter") set("q", (e.target as HTMLInputElement).value);
          }}
          onBlur={(e) => {
            if (e.target.value !== (sp.get("q") ?? "")) set("q", e.target.value);
          }}
        />
      </div>
      <div className="w-52">
        <label className="lbl">Nhóm / chi hội</label>
        <select
          className="inp"
          value={sp.get("nhom") ?? ""}
          onChange={(e) => set("nhom", e.target.value)}
        >
          <option value="">Tất cả nhóm</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {memberTypes.length > 0 && (
        <div className="w-44">
          <label className="lbl">Loại hội viên</label>
          <select
            className="inp"
            value={sp.get("loai") ?? ""}
            onChange={(e) => set("loai", e.target.value)}
          >
            <option value="">Tất cả loại</option>
            {memberTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
