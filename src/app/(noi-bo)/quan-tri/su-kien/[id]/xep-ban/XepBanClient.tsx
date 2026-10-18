"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { chuan } from "@/lib/trung-tam-sk/bang";

type Khach = {
  id: string;
  danhXung: string | null;
  ten: string;
  donVi: string | null;
  nhom: string | null;
  vip: boolean;
  ban: string | null;
  coDu: boolean;
  khongDu: boolean;
  coMat: boolean;
};

const soSanhBan = (a: string, b: string) => a.localeCompare(b, "vi", { numeric: true });
const tenDu = (k: Khach) => [k.danhXung, k.ten].filter(Boolean).join(" ");

export default function XepBanClient({ khach: dau }: { khach: Khach[] }) {
  const router = useRouter();
  const [ds, setDs] = useState(dau);
  const [dauCu, setDauCu] = useState(dau);
  if (dau !== dauCu) {
    setDauCu(dau);
    setDs(dau);
  }
  const [cho, setCho] = useState(10);
  const [banThem, setBanThem] = useState<string[]>([]);
  const [chon, setChon] = useState<Set<string>>(new Set());
  const [toi, setToi] = useState("");
  const [q, setQ] = useState("");
  const [anKhongDu, setAnKhongDu] = useState(true);
  const [chiCoDu, setChiCoDu] = useState(false);
  const [loi, setLoi] = useState("");
  const [keo, setKeo] = useState<string | null>(null);

  const cacBan = [...new Set([...ds.map((k) => k.ban).filter((b): b is string => !!b), ...banThem])].sort(soSanhBan);
  const chuaXep = ds.filter(
    (k) =>
      !k.ban &&
      (!anKhongDu || !k.khongDu) &&
      (!chiCoDu || k.coDu) &&
      (!q || chuan(`${k.ten} ${k.donVi ?? ""} ${k.nhom ?? ""}`).includes(chuan(q)))
  );

  async function xep(ids: string[], ban: string | null) {
    if (!ids.length) return;
    setLoi("");
    const cu = ds;
    setDs((x) => x.map((k) => (ids.includes(k.id) ? { ...k, ban } : k)));
    setChon(new Set());
    const res = await fetch("/api/quan-tri/su-kien/bang/khach", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, data: { ban } }),
    });
    if (!res.ok) {
      setDs(cu);
      setLoi((await res.json().catch(() => ({}))).error || "Không lưu được");
    }
    router.refresh();
  }

  function themBan() {
    const ten = toi.trim() || String((cacBan.map(Number).filter(Number.isFinite).sort((a, b) => b - a)[0] ?? 0) + 1);
    if (!cacBan.includes(ten)) setBanThem((x) => [...x, ten]);
    if (chon.size) xep([...chon], ten);
    setToi("");
  }

  const tha = (ban: string | null) => ({
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain");
      if (id) xep([id], ban);
      setKeo(null);
    },
  });
  const keoDuoc = (k: Khach) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", k.id);
      setKeo(k.id);
    },
    onDragEnd: () => setKeo(null),
  });

  const daXep = ds.filter((k) => k.ban).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 print:hidden">
        <span>
          <b className="text-navy-800">{daXep}</b>/{ds.length} khách đã xếp · <b className="text-navy-800">{cacBan.length}</b> bàn
        </span>
        <label className="flex items-center gap-1">
          Ghế mỗi bàn
          <input type="number" min={1} className="inp !w-16 !py-1" value={cho} onChange={(e) => setCho(Math.max(1, Number(e.target.value) || 10))} />
        </label>
        <button onClick={() => window.print()} className="btn-ghost ml-auto !py-1.5">
          🖨 In sơ đồ bàn
        </button>
      </div>
      {loi && <p className="text-sm text-do-600">{loi}</p>}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="card flex max-h-[75vh] flex-col p-3 print:hidden" {...tha(null)}>
          <h3 className="text-sm font-bold text-navy-800">Chưa xếp bàn ({chuaXep.length})</h3>
          <input className="inp mt-2 !py-1.5" placeholder="Tìm tên, đơn vị, nhóm…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-slate-600">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={anKhongDu} onChange={(e) => setAnKhongDu(e.target.checked)} /> Ẩn khách không dự
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={chiCoDu} onChange={(e) => setChiCoDu(e.target.checked)} /> Chỉ khách đã xác nhận
            </label>
          </div>
          <div className="mt-2 flex gap-1.5">
            <input
              className="inp !py-1.5 text-sm"
              placeholder="Bàn số…"
              value={toi}
              onChange={(e) => setToi(e.target.value)}
              list="ds-ban"
              aria-label="Xếp vào bàn"
            />
            <datalist id="ds-ban">
              {cacBan.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
            <button
              className="btn-primary !px-2.5 !py-1.5 text-sm"
              disabled={!chon.size}
              onClick={themBan}
            >
              Xếp {chon.size || ""}
            </button>
          </div>
          <ul className="mt-2 flex-1 space-y-0.5 overflow-y-auto">
            {chuaXep.map((k) => (
              <li
                key={k.id}
                {...keoDuoc(k)}
                className={`flex cursor-grab items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-slate-50 ${keo === k.id ? "opacity-40" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={chon.has(k.id)}
                  onChange={(e) => {
                    const s = new Set(chon);
                    if (e.target.checked) s.add(k.id);
                    else s.delete(k.id);
                    setChon(s);
                  }}
                  aria-label={`Chọn ${k.ten}`}
                />
                <span className="min-w-0 flex-1 truncate">
                  {k.vip && <span className="text-amber-500">★ </span>}
                  {tenDu(k)}
                  {k.donVi && <span className="text-xs text-slate-500"> · {k.donVi}</span>}
                </span>
                {k.khongDu && <span className="text-[10px] text-do-600">không dự</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-3">
          {cacBan.map((b) => {
            const o = ds.filter((k) => k.ban === b);
            const day = o.length > cho;
            return (
              <div key={b} className="card p-3 print:break-inside-avoid" {...tha(b)}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-navy-800">Bàn {b}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${day ? "bg-do-100 text-do-700" : o.length === cho ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                    {o.length}/{cho}
                  </span>
                </div>
                <ul className="mt-2 space-y-0.5">
                  {o.map((k) => (
                    <li key={k.id} {...keoDuoc(k)} className={`flex cursor-grab items-center gap-1.5 text-sm ${keo === k.id ? "opacity-40" : ""}`}>
                      <span className="min-w-0 flex-1 truncate">
                        {k.vip && <span className="text-amber-500">★ </span>}
                        {tenDu(k)}
                        {k.donVi && <span className="text-xs text-slate-500"> · {k.donVi}</span>}
                      </span>
                      {k.coMat && <span className="text-[10px] text-emerald-700 print:hidden">có mặt</span>}
                      <button onClick={() => xep([k.id], null)} className="px-1 text-slate-300 hover:text-do-600 print:hidden" aria-label={`Bỏ ${k.ten} khỏi bàn`}>
                        ×
                      </button>
                    </li>
                  ))}
                  {!o.length && <li className="text-xs text-slate-400">Kéo khách vào đây</li>}
                </ul>
              </div>
            );
          })}
          <button onClick={themBan} className="card flex min-h-24 items-center justify-center border-dashed text-sm font-medium text-navy-600 hover:bg-navy-50/50 print:hidden">
            + Thêm bàn{chon.size ? ` và xếp ${chon.size} khách` : ""}
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 print:hidden">
        Kéo thả khách giữa các bàn, hoặc tick nhiều khách rồi bấm Xếp. Số bàn hiện ở màn check-in và trang tự check-in của khách.
      </p>
    </div>
  );
}
