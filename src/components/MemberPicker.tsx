"use client";

import { useEffect, useRef, useState } from "react";

export type PickedMember = {
  id: string;
  code: string;
  name: string;
  company: string;
  industry?: string | null;
};

/**
 * Ô chọn hội viên có tìm kiếm (chịu được 1000+ hội viên vì luôn hỏi server,
 * mỗi lần chỉ lấy 20 kết quả gần đúng nhất).
 */
export default function MemberPicker({
  name,
  label,
  required,
  initial,
  excludeIds = [],
  placeholder = "Gõ tên công ty hoặc mã hội viên...",
}: {
  name: string;
  label: string;
  required?: boolean;
  initial?: PickedMember | null;
  excludeIds?: string[];
  placeholder?: string;
}) {
  const [picked, setPicked] = useState<PickedMember | null>(initial ?? null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedMember[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/hoi-vien?q=${encodeURIComponent(query)}`);
      const data = await res.json().catch(() => ({ members: [] }));
      setResults(data.members ?? []);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [query, open]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const visible = results.filter((m) => !excludeIds.includes(m.id));

  return (
    <div ref={boxRef} className="relative">
      <label className="lbl">
        {label} {required && <span className="text-do-500">*</span>}
      </label>
      <input type="hidden" name={name} value={picked?.id ?? ""} />

      {picked ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-slate-800">
              {picked.company}
            </div>
            <div className="truncate text-xs text-slate-500">
              {picked.code} · {picked.name}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setPicked(null);
              setQuery("");
              setOpen(true);
            }}
            className="shrink-0 rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
          >
            Đổi
          </button>
        </div>
      ) : (
        <input
          className="inp"
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          autoComplete="off"
        />
      )}

      {open && !picked && (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {loading && (
            <div className="px-3 py-2 text-sm text-slate-400">Đang tìm...</div>
          )}
          {!loading && visible.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-400">
              Không tìm thấy hội viên phù hợp.
            </div>
          )}
          {visible.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setPicked(m);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left hover:bg-navy-50"
            >
              <div className="text-sm font-medium text-slate-800">
                {m.company}
              </div>
              <div className="text-xs text-slate-500">
                {m.code} · {m.name}
                {m.industry ? ` · ${m.industry}` : ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
