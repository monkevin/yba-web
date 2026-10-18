"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import HopThoai from "@/components/trung-tam-sk/HopThoai";
import {
  BANG,
  LOP_TONG,
  chuan,
  epKieu,
  ngayGioNhap,
  ngayNhap,
  ngayVN,
  gioVN,
  nhanLuaChon,
  soVN,
  tongLuaChon,
  type LuaChon,
  type Truong,
} from "@/lib/trung-tam-sk/bang";

/**
 * Bảng sửa trực tiếp kiểu Google Sheet cho Trung tâm sự kiện: bấm ô để sửa,
 * tìm không dấu, lọc, nhóm, chọn nhiều dòng để đổi trạng thái / xoá, dán từ
 * Excel, xuất CSV. Cột & kiểu lấy từ `BANG` (src/lib/trung-tam-sk/bang.ts).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Dong = { id: string; [k: string]: any };

export type Cot = {
  key: string;
  label?: string;
  rong?: number;
  /** Hiển thị tuỳ biến (cột tính toán) — cột có render mà không có trường thì chỉ đọc */
  render?: (d: Dong) => React.ReactNode;
  /** Giá trị dùng để tìm / sắp xếp / xuất CSV của cột tính toán */
  giaTri?: (d: Dong) => string | number;
  suaDuoc?: boolean;
  lop?: string;
};

type Props = {
  bang: string;
  /** eventId — hoặc taiTroId với bảng quyền lợi */
  chaId: string;
  dong: Dong[];
  cot: (string | Cot)[];
  sua: boolean;
  /** Lựa chọn động, VD danh sách phiên; khoá "__phien" để dán cột xác nhận theo phiên */
  luaChon?: Record<string, LuaChon[]>;
  loc?: string[];
  nhomTheo?: string;
  macDinhMoi?: Record<string, unknown>;
  tenXuat?: string;
  congCu?: React.ReactNode;
  lopDong?: (d: Dong) => string;
  chanBang?: (ds: Dong[]) => React.ReactNode;
  trong?: string;
  khongDan?: boolean;
  khongThem?: boolean;
  locThem?: (d: Dong) => boolean;
  /** Báo cho trang cha khi danh sách đổi (để cập nhật số liệu) */
  khiDoi?: (ds: Dong[]) => void;
};

const nut = "btn-ghost !px-3 !py-1.5";
const nutChinh = "btn-primary !px-3 !py-1.5";

function hienThi(t: Truong | undefined, v: any, ds?: LuaChon[]): string {
  if (!t) return v ?? "";
  switch (t.kieu) {
    case "so":
    case "tien":
      return v ? soVN(v) : "";
    case "ngay":
      return v ? ngayVN(v) : "";
    case "ngayGio":
      return v ? `${gioVN(v)} ${ngayVN(v)}` : "";
    case "co":
      return v ? "✓" : "";
    case "chon":
      return nhanLuaChon(ds ?? t.luaChon, v);
    default:
      return v ?? "";
  }
}

export default function BangDuLieu({
  bang,
  chaId,
  dong: banDau,
  cot,
  sua,
  luaChon = {},
  loc = [],
  nhomTheo,
  macDinhMoi = {},
  tenXuat,
  congCu,
  lopDong,
  chanBang,
  trong = "Chưa có dữ liệu.",
  khongDan,
  khongThem,
  locThem,
  khiDoi,
}: Props) {
  const ch = BANG[bang];
  const [ds, setDs] = useState<Dong[]>(banDau);
  const [q, setQ] = useState("");
  const [boLoc, setBoLoc] = useState<Record<string, string>>({});
  const [sapXep, setSapXep] = useState<{ key: string; chieu: 1 | -1 } | null>(null);
  const [dangSua, setDangSua] = useState<{ id: string; key: string } | null>(null);
  const [chon, setChon] = useState<Set<string>>(new Set());
  const [ban, setBan] = useState(false);
  const [loi, setLoi] = useState("");
  const [moDan, setMoDan] = useState(false);
  const [chiTiet, setChiTiet] = useState<Dong | null>(null);

  // Dữ liệu mới từ máy chủ (router.refresh) thay bản cục bộ
  const [banDauCu, setBanDauCu] = useState(banDau);
  if (banDau !== banDauCu) {
    setBanDauCu(banDau);
    setDs(banDau);
  }
  const khiDoiRef = useRef(khiDoi);
  useEffect(() => {
    khiDoiRef.current = khiDoi;
  });
  useEffect(() => {
    khiDoiRef.current?.(ds);
  }, [ds]);

  const cacCot: Cot[] = useMemo(
    () =>
      cot.map((c) => {
        const x = typeof c === "string" ? { key: c } : c;
        const t = ch.truong[x.key];
        return {
          ...x,
          label: x.label ?? t?.label ?? x.key,
          rong: x.rong ?? t?.rong ?? 120,
          suaDuoc: x.suaDuoc ?? (!!t && !x.render),
        };
      }),
    [cot, ch]
  );

  const lcCua = (key: string) => luaChon[key] ?? ch.truong[key]?.luaChon;
  const url = `/api/quan-tri/su-kien/bang/${bang}`;
  const khoaCha = ch.cha === "taiTro" ? "taiTroId" : "eventId";

  async function goi(u: string, method: string, body?: unknown) {
    setLoi("");
    const res = await fetch(u, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoi(data.error || "Có lỗi xảy ra");
      return null;
    }
    return data;
  }

  async function luu(d: Dong, key: string, v: unknown) {
    const cu = d[key];
    const t = ch.truong[key];
    const moi = t ? epKieu(t, v) : v;
    if (moi === undefined) {
      setLoi(`Giá trị "${String(v)}" không hợp lệ`);
      return;
    }
    const giong =
      t?.kieu === "ngay"
        ? ngayNhap(cu) === ngayNhap(moi as Date)
        : t?.kieu === "ngayGio"
          ? ngayGioNhap(cu) === ngayGioNhap(moi as Date)
          : (cu ?? "") === (moi ?? "");
    if (giong) return;
    setDs((x) => x.map((r) => (r.id === d.id ? { ...r, [key]: moi } : r)));
    const res = await goi(`${url}/${d.id}`, "PATCH", { [key]: v });
    setDs((x) => x.map((r) => (r.id === d.id ? (res ? { ...r, ...res } : { ...r, [key]: cu }) : r)));
  }

  async function themDong() {
    setBan(true);
    const macDinh: Record<string, unknown> = { ...macDinhMoi };
    for (const [k, v] of Object.entries(boLoc)) if (v && v !== "__trong") macDinh[k] = v;
    const res = await goi(url, "POST", { [khoaCha]: chaId, [ch.tieuDe]: "Dòng mới", ...macDinh });
    setBan(false);
    if (res) {
      setDs((x) => [...x, res]);
      setQ("");
      setDangSua({ id: res.id, key: ch.tieuDe });
    }
  }

  async function xoaChon() {
    if (!chon.size) return;
    if (!confirm(`Xoá ${chon.size} dòng đã chọn? Không thể hoàn tác.`)) return;
    setBan(true);
    const res = await goi(url, "DELETE", { ids: [...chon] });
    setBan(false);
    if (res) {
      setDs((x) => x.filter((r) => !chon.has(r.id)));
      setChon(new Set());
    }
  }

  async function datHangLoat(key: string, v: string) {
    if (!chon.size) return;
    setBan(true);
    const res = await goi(url, "PATCH", { ids: [...chon], data: { [key]: v } });
    setBan(false);
    if (res) {
      const t = ch.truong[key];
      const moi = t ? epKieu(t, v) : v;
      setDs((x) => x.map((r) => (chon.has(r.id) ? { ...r, [key]: moi } : r)));
    }
  }

  // ───────────────────────── lọc + sắp xếp
  const daLoc = useMemo(() => {
    const nq = chuan(q);
    let out = ds.filter((r) => {
      if (locThem && !locThem(r)) return false;
      for (const [k, v] of Object.entries(boLoc)) {
        if (!v) continue;
        const rv = r[k];
        if (v === "__trong" ? rv !== null && rv !== undefined && rv !== "" : String(rv ?? "") !== v) return false;
      }
      if (!nq) return true;
      return cacCot.some((c) => {
        const v = c.giaTri ? c.giaTri(r) : r[c.key];
        return v !== null && v !== undefined && chuan(String(v)).includes(nq);
      });
    });
    if (sapXep) {
      const c = cacCot.find((x) => x.key === sapXep.key);
      const lay = (r: Dong) => (c?.giaTri ? c.giaTri(r) : r[sapXep.key]);
      out = [...out].sort((a, b) => {
        const x = lay(a),
          y = lay(b);
        if (x === y) return 0;
        if (x === null || x === undefined || x === "") return 1;
        if (y === null || y === undefined || y === "") return -1;
        return (
          (typeof x === "number" && typeof y === "number"
            ? x - y
            : String(x).localeCompare(String(y), "vi", { numeric: true })) * sapXep.chieu
        );
      });
    }
    return out;
  }, [ds, q, boLoc, sapXep, cacCot, locThem]);

  const nhom = useMemo(() => {
    if (!nhomTheo) return [{ key: "", ds: daLoc }];
    const m = new Map<string, Dong[]>();
    for (const r of daLoc) {
      const k = String(r[nhomTheo] ?? "");
      m.set(k, [...(m.get(k) ?? []), r]);
    }
    return [...m.entries()].map(([key, x]) => ({ key, ds: x }));
  }, [daLoc, nhomTheo]);

  const lcLoc = (key: string): LuaChon[] => {
    const o = lcCua(key);
    if (o && o.length) return o;
    const vals = [...new Set(ds.map((r) => r[key]).filter((v) => v !== null && v !== undefined && v !== ""))];
    return vals
      .map(String)
      .sort((a, b) => a.localeCompare(b, "vi"))
      .map((v) => ({ value: v, label: v.length > 40 ? v.slice(0, 40) + "…" : v }));
  };

  function xuatCsv() {
    const dau = cacCot.map((c) => c.label ?? c.key);
    const dongs = daLoc.map((r) =>
      cacCot.map((c) => {
        const v = c.giaTri ? c.giaTri(r) : hienThi(ch.truong[c.key], r[c.key], lcCua(c.key));
        const s = String(v ?? "");
        return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      })
    );
    const csv = "﻿" + [dau, ...dongs].map((l) => l.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `${tenXuat || bang}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const chonHet = daLoc.length > 0 && daLoc.every((r) => chon.has(r.id));
  const cotPhanLoai = Object.entries(ch.truong).filter(([, t]) => t.kieu === "chon" || t.kieu === "co");

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm nhanh (không cần gõ dấu)…"
          className="inp !w-full !py-1.5 sm:!w-64"
        />
        {loc.map((k) => (
          <select
            key={k}
            value={boLoc[k] ?? ""}
            onChange={(e) => setBoLoc((f) => ({ ...f, [k]: e.target.value }))}
            className="inp !w-auto max-w-[200px] !py-1.5"
          >
            <option value="">{(ch.truong[k]?.label ?? k) + ": tất cả"}</option>
            {lcLoc(k).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
            <option value="__trong">(trống)</option>
          </select>
        ))}
        <span className="text-sm text-slate-500">
          {daLoc.length}/{ds.length} dòng
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          {congCu}
          <button className={nut} onClick={xuatCsv}>
            ⬇ CSV
          </button>
          {sua && !khongDan && (
            <button className={nut} onClick={() => setMoDan(true)}>
              📋 Dán từ Excel
            </button>
          )}
          {sua && !khongThem && (
            <button className={nutChinh} onClick={themDong} disabled={ban}>
              + Thêm dòng
            </button>
          )}
        </div>
      </div>

      {sua && chon.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-navy-800 px-3 py-2 text-sm text-white">
          <span>Đã chọn {chon.size}</span>
          {cotPhanLoai.map(([k, t]) => (
            <select
              key={k}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) datHangLoat(k, e.target.value);
                e.target.value = "";
              }}
              className="rounded bg-navy-700 px-2 py-1 text-white"
            >
              <option value="">Đặt {t.label.toLowerCase()}…</option>
              {t.kieu === "co" ? (
                <>
                  <option value="true">Có</option>
                  <option value="false">Không</option>
                </>
              ) : (
                (lcCua(k) ?? []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))
              )}
            </select>
          ))}
          <button onClick={xoaChon} className="ml-auto rounded bg-do-600 px-3 py-1 hover:bg-do-500">
            Xoá
          </button>
          <button onClick={() => setChon(new Set())} className="rounded px-2 py-1 hover:bg-navy-700">
            Bỏ chọn
          </button>
        </div>
      )}

      {loi && (
        <div className="mb-3 rounded-lg border border-do-200 bg-do-50 px-3 py-2 text-sm text-do-700">{loi}</div>
      )}

      <div className="card max-h-[calc(100vh-220px)] overflow-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-navy-50">
            <tr>
              {sua && (
                <th className="w-8 border-b border-navy-100 px-2">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả"
                    checked={chonHet}
                    onChange={() => setChon(chonHet ? new Set() : new Set(daLoc.map((r) => r.id)))}
                  />
                </th>
              )}
              {cacCot.map((c) => (
                <th
                  key={c.key}
                  style={{ minWidth: c.rong, maxWidth: Math.max(c.rong ?? 120, 360) }}
                  onClick={() =>
                    setSapXep((s) =>
                      s?.key === c.key ? (s.chieu === 1 ? { key: c.key, chieu: -1 } : null) : { key: c.key, chieu: 1 }
                    )
                  }
                  className="cursor-pointer select-none whitespace-nowrap border-b border-navy-100 px-2 py-2 text-left text-xs font-semibold text-navy-700 hover:bg-navy-100"
                >
                  {c.label}
                  {sapXep?.key === c.key ? (sapXep.chieu === 1 ? " ▲" : " ▼") : ""}
                </th>
              ))}
              <th className="w-8 border-b border-navy-100" />
            </tr>
          </thead>
          <tbody>
            {daLoc.length === 0 && (
              <tr>
                <td colSpan={cacCot.length + 2} className="py-10 text-center text-slate-400">
                  {trong}
                </td>
              </tr>
            )}
            {nhom.map((g) => (
              <Fragment key={g.key || "_"}>
                {nhomTheo && (
                  <tr className="bg-nga-50">
                    <td
                      colSpan={cacCot.length + 2}
                      className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy-700"
                    >
                      {hienThi(ch.truong[nhomTheo], g.key, lcCua(nhomTheo)) || "(chưa phân nhóm)"} · {g.ds.length}
                    </td>
                  </tr>
                )}
                {g.ds.map((r) => (
                  <tr key={r.id} className={`border-b border-slate-100 align-top hover:bg-navy-50/50 ${lopDong?.(r) ?? ""}`}>
                    {sua && (
                      <td className="px-2 py-1.5">
                        <input
                          type="checkbox"
                          aria-label="Chọn dòng"
                          checked={chon.has(r.id)}
                          onChange={() =>
                            setChon((s) => {
                              const n = new Set(s);
                              if (n.has(r.id)) n.delete(r.id);
                              else n.add(r.id);
                              return n;
                            })
                          }
                        />
                      </td>
                    )}
                    {cacCot.map((c) => (
                      <O
                        key={c.key}
                        cot={c}
                        dong={r}
                        t={ch.truong[c.key]}
                        lc={lcCua(c.key)}
                        suaDuoc={sua && !!c.suaDuoc}
                        dangSua={dangSua?.id === r.id && dangSua.key === c.key}
                        batSua={() => setDangSua({ id: r.id, key: c.key })}
                        xong={(v) => {
                          setDangSua(null);
                          if (v !== undefined) luu(r, c.key, v);
                        }}
                      />
                    ))}
                    <td className="px-1 py-1.5">
                      <button
                        onClick={() => setChiTiet(r)}
                        className="px-1 text-slate-400 hover:text-slate-700"
                        title="Xem đầy đủ"
                        aria-label="Xem đầy đủ"
                      >
                        ⋯
                      </button>
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
          {chanBang && <tfoot className="sticky bottom-0 bg-navy-50 font-semibold">{chanBang(daLoc)}</tfoot>}
        </table>
      </div>

      <HopDan
        mo={moDan}
        dong={() => setMoDan(false)}
        bang={bang}
        chaId={chaId}
        luaChon={luaChon}
        xong={(n) => {
          setMoDan(false);
          if (n) location.reload();
        }}
      />

      <HopThoai mo={!!chiTiet} dong={() => setChiTiet(null)} tieuDe="Chi tiết dòng" rong>
        {chiTiet && (
          <ChiTiet
            dong={ds.find((r) => r.id === chiTiet.id) ?? chiTiet}
            truong={ch.truong}
            luaChon={luaChon}
            sua={sua}
            luu={(k, v) => luu(ds.find((r) => r.id === chiTiet.id) ?? chiTiet, k, v)}
          />
        )}
      </HopThoai>
    </div>
  );
}

// ───────────────────────────────── ô

function O({
  cot,
  dong,
  t,
  lc,
  suaDuoc,
  dangSua,
  batSua,
  xong,
}: {
  cot: Cot;
  dong: Dong;
  t?: Truong;
  lc?: LuaChon[];
  suaDuoc: boolean;
  dangSua: boolean;
  batSua: () => void;
  xong: (v?: unknown) => void;
}) {
  const v = dong[cot.key];
  const goc = `px-2 py-1.5 ${cot.lop ?? ""}`;
  const style = { minWidth: cot.rong, maxWidth: Math.max(cot.rong ?? 120, 360) };

  if (cot.render) return <td className={goc} style={style}>{cot.render(dong)}</td>;
  if (!t) return <td className={goc} style={style}>{String(v ?? "")}</td>;

  if (t.kieu === "co") {
    return (
      <td className={`${goc} text-center`} style={style}>
        <input
          type="checkbox"
          checked={!!v}
          disabled={!suaDuoc}
          onChange={() => xong(!v)}
          className="h-4 w-4 accent-navy-600"
          aria-label={t.label}
        />
      </td>
    );
  }

  if (dangSua && suaDuoc) {
    return (
      <td className="bg-navy-50 p-0.5" style={style}>
        <ONhap t={t} lc={lc} giaTri={v} xong={xong} />
      </td>
    );
  }

  let nd: React.ReactNode = hienThi(t, v, lc);
  if (t.kieu === "chon" && v) {
    nd = (
      <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${LOP_TONG[tongLuaChon(lc, v)]}`}>
        {nhanLuaChon(lc, v)}
      </span>
    );
  } else if (typeof nd === "string" && /^https?:\/\//.test(nd)) {
    nd = (
      <a href={nd} target="_blank" rel="noreferrer" className="text-navy-600 underline" onClick={(e) => e.stopPropagation()}>
        Mở link
      </a>
    );
  }

  return (
    <td
      className={`${goc} ${suaDuoc ? "cursor-text" : ""} ${t.kieu === "so" || t.kieu === "tien" ? "text-right tabular-nums" : ""}`}
      style={style}
      onClick={suaDuoc ? batSua : undefined}
    >
      <div className="line-clamp-3 whitespace-pre-line break-words text-slate-700">
        {nd || (suaDuoc ? <span className="text-slate-300">—</span> : "")}
      </div>
    </td>
  );
}

function ONhap({ t, lc, giaTri, xong }: { t: Truong; lc?: LuaChon[]; giaTri: unknown; xong: (v?: unknown) => void }) {
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement>(null);
  useEffect(() => {
    ref.current?.focus();
    if (ref.current && t.kieu !== "chon" && "select" in ref.current) ref.current.select?.();
  }, [t.kieu]);
  const lop = "w-full rounded border border-navy-400 bg-white px-2 py-1 text-sm text-slate-800 outline-none";
  const phim = (e: React.KeyboardEvent<HTMLElement>, lay: () => unknown) => {
    if (e.key === "Escape") xong(undefined);
    if (e.key === "Enter" && (t.kieu !== "doan" || !e.shiftKey)) {
      e.preventDefault();
      xong(lay());
    }
  };

  if (t.kieu === "chon") {
    return (
      <select
        ref={ref}
        defaultValue={String(giaTri ?? "")}
        onChange={(e) => xong(e.target.value)}
        onBlur={() => xong(undefined)}
        className={lop}
      >
        <option value="">—</option>
        {(lc ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (t.kieu === "doan") {
    return (
      <textarea
        ref={ref}
        defaultValue={String(giaTri ?? "")}
        rows={Math.min(8, Math.max(3, String(giaTri ?? "").split("\n").length + 1))}
        onBlur={(e) => xong(e.target.value)}
        onKeyDown={(e) => phim(e, () => (e.target as HTMLTextAreaElement).value)}
        className={lop}
      />
    );
  }
  const type =
    t.kieu === "ngay" ? "date" : t.kieu === "ngayGio" ? "datetime-local" : t.kieu === "so" ? "number" : "text";
  const dau =
    t.kieu === "ngay"
      ? ngayNhap(giaTri as string)
      : t.kieu === "ngayGio"
        ? ngayGioNhap(giaTri as string)
        : String(giaTri ?? "");
  return (
    <input
      ref={ref}
      type={type}
      defaultValue={dau}
      onBlur={(e) => xong(e.target.value)}
      onKeyDown={(e) => phim(e, () => (e.target as HTMLInputElement).value)}
      className={lop}
    />
  );
}

// ─────────────────────────────── chi tiết dòng

function ChiTiet({
  dong,
  truong,
  luaChon,
  sua,
  luu,
}: {
  dong: Dong;
  truong: Record<string, Truong>;
  luaChon: Record<string, LuaChon[]>;
  sua: boolean;
  luu: (k: string, v: unknown) => void;
}) {
  return (
    <div className="grid gap-3">
      {Object.entries(truong).map(([k, t]) => {
        const lc = luaChon[k] ?? t.luaChon;
        const v = dong[k];
        return (
          <label key={k} className="grid gap-1">
            <span className="text-xs font-medium text-slate-500">{t.label}</span>
            {t.kieu === "co" ? (
              <input type="checkbox" disabled={!sua} checked={!!v} onChange={() => luu(k, !v)} className="h-4 w-4" />
            ) : t.kieu === "chon" ? (
              <select disabled={!sua} defaultValue={String(v ?? "")} onChange={(e) => luu(k, e.target.value)} className="inp">
                <option value="">—</option>
                {(lc ?? []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : t.kieu === "doan" ? (
              <textarea disabled={!sua} defaultValue={String(v ?? "")} rows={4} onBlur={(e) => luu(k, e.target.value)} className="inp" />
            ) : (
              <input
                disabled={!sua}
                type={t.kieu === "ngay" ? "date" : t.kieu === "ngayGio" ? "datetime-local" : t.kieu === "so" ? "number" : "text"}
                defaultValue={
                  t.kieu === "ngay" ? ngayNhap(v) : t.kieu === "ngayGio" ? ngayGioNhap(v) : String(v ?? "")
                }
                onBlur={(e) => luu(k, e.target.value)}
                className="inp"
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

// ─────────────────────────────── dán từ Excel

function HopDan({
  mo,
  dong,
  bang,
  chaId,
  luaChon,
  xong,
}: {
  mo: boolean;
  dong: () => void;
  bang: string;
  chaId: string;
  luaChon: Record<string, LuaChon[]>;
  xong: (n: number) => void;
}) {
  const ch = BANG[bang];
  const [text, setText] = useState("");
  const [ban, setBan] = useState(false);
  const [tb, setTb] = useState("");
  const bang2 = useMemo(() => tachTsv(text), [text]);
  const phien = useMemo(() => luaChon.__phien ?? [], [luaChon]);

  // Ghép tiêu đề cột với trường: theo nhãn, tên trường hoặc tên gọi khác
  const ghep = useMemo(() => {
    if (!bang2.length) return [] as (string | null)[];
    return bang2[0].map((h) => {
      const n = chuan(h);
      if (!n) return null;
      const p = phien.find((o) => chuan(o.label) === n);
      if (p) return `phien:${p.value}`;
      for (const [k, t] of Object.entries(ch.truong)) {
        if (chuan(t.label) === n || chuan(k) === n || t.tenKhac?.some((a) => chuan(a) === n)) return k;
      }
      for (const [k, t] of Object.entries(ch.truong)) {
        if (n.includes(chuan(t.label)) || t.tenKhac?.some((a) => n.includes(chuan(a)))) return k;
      }
      return null;
    });
  }, [bang2, ch, phien]);

  async function gui() {
    const rows = bang2
      .slice(1)
      .map((o) => {
        const r: Record<string, unknown> = {};
        const xn: Record<string, string> = {};
        ghep.forEach((k, i) => {
          if (!k || !o[i]) return;
          if (k.startsWith("phien:")) {
            const n = chuan(o[i]);
            xn[k.slice(6)] = /khong|vang/.test(n) ? "KHONG" : /(^x$|^co$|tham du|xac nhan|ok)/.test(n) ? "CO" : "CHO";
          } else r[k] = o[i];
        });
        if (Object.keys(xn).length) r.xacNhan = xn;
        return r;
      })
      .filter((r) => r[ch.tieuDe]);
    if (!rows.length) {
      setTb(`Không có dòng nào có cột "${ch.truong[ch.tieuDe].label}".`);
      return;
    }
    setBan(true);
    const khoa = ch.cha === "taiTro" ? "taiTroId" : "eventId";
    const res = await fetch(`/api/quan-tri/su-kien/bang/${bang}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [khoa]: chaId, rows }),
    });
    const data = await res.json().catch(() => ({}));
    setBan(false);
    if (!res.ok) setTb(data.error || "Lỗi khi nhập");
    else {
      setText("");
      xong(data.count);
    }
  }

  return (
    <HopThoai mo={mo} dong={dong} tieuDe={`Dán dữ liệu vào: ${ch.ten}`} rong>
      <p className="mb-2 text-sm text-slate-600">
        Bôi đen vùng dữ liệu trên Google Sheet / Excel <b>kèm dòng tiêu đề</b>, bấm Ctrl+C rồi dán vào đây. Cột
        được ghép tự động theo tên tiêu đề.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder={Object.values(ch.truong)
          .map((t) => t.label)
          .join("\t")}
        className="inp font-mono !text-xs"
      />
      {bang2.length > 0 && (
        <div className="mt-3 text-sm">
          <div className="mb-1 font-medium text-slate-700">{bang2.length - 1} dòng · ghép cột:</div>
          <div className="flex flex-wrap gap-1">
            {bang2[0].map((h, i) => (
              <span
                key={i}
                className={`rounded px-2 py-0.5 text-xs ${
                  ghep[i] ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400 line-through"
                }`}
              >
                {h || "(trống)"}
                {ghep[i]
                  ? ` → ${
                      ghep[i]!.startsWith("phien:")
                        ? "Xác nhận " + (phien.find((p) => `phien:${p.value}` === ghep[i])?.label ?? "")
                        : ch.truong[ghep[i]!].label
                    }`
                  : ""}
              </span>
            ))}
          </div>
        </div>
      )}
      {tb && <div className="mt-2 text-sm text-do-600">{tb}</div>}
      <div className="mt-4 flex justify-end gap-2">
        <button className={nut} onClick={dong}>
          Huỷ
        </button>
        <button className={nutChinh} disabled={ban || bang2.length < 2} onClick={gui}>
          {ban ? "Đang nhập…" : `Nhập ${Math.max(0, bang2.length - 1)} dòng`}
        </button>
      </div>
    </HopThoai>
  );
}

/** Tách dữ liệu dán từ bảng tính (TSV, hỗ trợ ô có xuống dòng trong ngoặc kép). */
function tachTsv(text: string): string[][] {
  const out: string[][] = [];
  let dong: string[] = [];
  let o = "";
  let trongNgoac = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (trongNgoac) {
      if (c === '"' && text[i + 1] === '"') {
        o += '"';
        i++;
      } else if (c === '"') trongNgoac = false;
      else o += c;
    } else if (c === '"' && o === "") trongNgoac = true;
    else if (c === "\t") {
      dong.push(o.trim());
      o = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      dong.push(o.trim());
      if (dong.some(Boolean)) out.push(dong);
      dong = [];
      o = "";
    } else o += c;
  }
  dong.push(o.trim());
  if (dong.some(Boolean)) out.push(dong);
  return out;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
