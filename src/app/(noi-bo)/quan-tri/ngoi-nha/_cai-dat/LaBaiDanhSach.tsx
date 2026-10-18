"use client";

/**
 * Danh sách dài sửa được (danh ngôn ~150 câu, lời nhắn ~40 câu) cho tab Lá bài:
 * tìm không dấu, lọc nhóm / trạng thái, bật tắt từng mục, mở từng mục ra sửa,
 * thêm mục mới. Chỉ hiện 15 mục một lần ("Xem thêm") để điện thoại khỏi dài.
 * Mục đã lưu KHÔNG xoá được (mã đã nằm trong lịch sử lá bài của hội viên) —
 * bỏ đi thì tắt; chỉ mục vừa thêm chưa lưu mới có nút Xoá.
 */
import { useState, type ReactNode } from "react";
import { normalizeSearch } from "@/lib/search";
import { INP } from "./truong";

const MOI_TRANG = 15;

export function LaBaiNhan({
  mau,
  children,
}: {
  mau: "xam" | "vang" | "navy" | "xanh" | "do";
  children: ReactNode;
}) {
  const lop = {
    xam: "bg-slate-100 text-slate-600",
    vang: "bg-amber-100 text-amber-800",
    navy: "bg-navy-50 text-navy-700",
    xanh: "bg-emerald-100 text-emerald-700",
    do: "bg-do-50 text-do-700",
  }[mau];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${lop}`}
    >
      {children}
    </span>
  );
}

/** Công tắc gọn cho một dòng danh sách (vùng bấm 44px). */
export function LaBaiCongTac({
  bat,
  onDoi,
  nhan,
}: {
  bat: boolean;
  onDoi: (b: boolean) => void;
  nhan: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={bat}
      aria-label={nhan}
      onClick={() => onDoi(!bat)}
      className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-lg hover:bg-slate-50"
    >
      <span
        className={`flex h-6 w-11 items-center rounded-full p-0.5 transition ${bat ? "bg-emerald-500" : "bg-slate-300"}`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow transition ${bat ? "translate-x-5" : ""}`}
        />
      </span>
    </button>
  );
}

export default function LaBaiDanhSach<T extends { ma: string; bat: boolean }>({
  ds,
  onDoi,
  maDaLuu,
  tenMuc,
  toiDa,
  taoMoi,
  chuoiTim,
  boLoc,
  tomTat,
  bieuMau,
  thieu,
}: {
  ds: T[];
  onDoi: (ds: T[]) => void;
  /** Mã đã có trong bản đang lưu hoặc bộ gốc */
  maDaLuu: Set<string>;
  /** "danh ngôn", "lời nhắn" */
  tenMuc: string;
  toiDa: number;
  taoMoi: () => T;
  chuoiTim: (x: T) => string;
  boLoc?: {
    nhan: string;
    luaChon: { gia: string; nhan: string }[];
    khop: (x: T, gia: string) => boolean;
  };
  tomTat: (x: T) => ReactNode;
  bieuMau: (x: T, sua: (p: Partial<T>) => void) => ReactNode;
  /** Thiếu gì thì máy chủ sẽ bỏ mục này khi lưu (null = đủ) */
  thieu: (x: T) => string | null;
}) {
  const [q, setQ] = useState("");
  const [nhom, setNhom] = useState("");
  const [trangThai, setTrangThai] = useState<"" | "bat" | "tat">("");
  const [soHien, setSoHien] = useState(MOI_TRANG);
  const [dangMo, setDangMo] = useState<string | null>(null);

  const tu = normalizeSearch(q);
  const daLoc = ds.filter(
    (x) =>
      (!tu || normalizeSearch(chuoiTim(x)).includes(tu)) &&
      (!nhom || !boLoc || boLoc.khop(x, nhom)) &&
      (trangThai === "" || (trangThai === "bat" ? x.bat : !x.bat)),
  );
  const hien = daLoc.slice(0, soHien);
  const soBat = ds.filter((x) => x.bat).length;
  const sua = (ma: string, p: Partial<T>) =>
    onDoi(ds.map((x) => (x.ma === ma ? { ...x, ...p } : x)));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          {ds.length} {tenMuc} · <b className="text-emerald-700">{soBat}</b>{" "}
          đang bật
        </p>
        <button
          type="button"
          disabled={ds.length >= toiDa}
          onClick={() => {
            const moi = taoMoi();
            onDoi([moi, ...ds]);
            setDangMo(moi.ma);
            setQ("");
            setNhom("");
            setTrangThai("");
          }}
          className="btn-ghost min-h-11"
        >
          + Thêm {tenMuc}
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          className={`${INP} min-h-11`}
          value={q}
          placeholder="Tìm theo nội dung, tác giả, mã…"
          aria-label={`Tìm ${tenMuc}`}
          // Ô tìm nằm trong form lưu cài đặt — Enter không được bấm Lưu
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          onChange={(e) => {
            setQ(e.target.value);
            setSoHien(MOI_TRANG);
          }}
        />
        {boLoc && (
          <select
            className={`${INP} min-h-11`}
            value={nhom}
            aria-label={boLoc.nhan}
            onChange={(e) => {
              setNhom(e.target.value);
              setSoHien(MOI_TRANG);
            }}
          >
            <option value="">{boLoc.nhan}: tất cả</option>
            {boLoc.luaChon.map((l) => (
              <option key={l.gia} value={l.gia}>
                {l.nhan}
              </option>
            ))}
          </select>
        )}
        <select
          className={`${INP} min-h-11`}
          value={trangThai}
          aria-label="Trạng thái"
          onChange={(e) => {
            setTrangThai(e.target.value as "" | "bat" | "tat");
            setSoHien(MOI_TRANG);
          }}
        >
          <option value="">Bật và tắt</option>
          <option value="bat">Chỉ đang bật</option>
          <option value="tat">Chỉ đang tắt</option>
        </select>
      </div>

      {daLoc.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
          Không có {tenMuc} nào khớp.
        </p>
      ) : (
        <ul className="space-y-2">
          {hien.map((x) => {
            const mo = dangMo === x.ma;
            const laMoi = !maDaLuu.has(x.ma);
            const thieuGi = thieu(x);
            return (
              <li
                key={x.ma}
                className={`rounded-xl ring-1 ${mo ? "bg-white ring-navy-200" : x.bat ? "bg-white ring-slate-200" : "bg-slate-50 ring-slate-200"}`}
              >
                <div className="flex items-start gap-1 p-1.5">
                  <LaBaiCongTac
                    bat={x.bat}
                    nhan={
                      x.bat ? "Đang bật — bấm để tắt" : "Đang tắt — bấm để bật"
                    }
                    onDoi={(b) => sua(x.ma, { bat: b } as Partial<T>)}
                  />
                  <button
                    type="button"
                    onClick={() => setDangMo(mo ? null : x.ma)}
                    className="flex min-h-11 min-w-0 flex-1 items-start gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-slate-50"
                    aria-expanded={mo}
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm ${x.bat ? "text-navy-900" : "text-slate-400"}`}
                      >
                        {tomTat(x)}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="text-[11px] text-slate-400">
                          {x.ma}
                        </span>
                        {!x.bat && <LaBaiNhan mau="xam">Đang tắt</LaBaiNhan>}
                        {laMoi && (
                          <LaBaiNhan mau="xanh">Mới, chưa lưu</LaBaiNhan>
                        )}
                        {thieuGi && (
                          <LaBaiNhan mau="vang">Thiếu {thieuGi}</LaBaiNhan>
                        )}
                      </span>
                    </span>
                    <span className="shrink-0 pt-0.5 text-xs font-semibold text-navy-600">
                      {mo ? "Thu gọn" : "Sửa"}
                    </span>
                  </button>
                </div>
                {mo && (
                  <div className="space-y-3 border-t border-slate-100 p-3">
                    {thieuGi && (
                      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        Còn thiếu {thieuGi} — {tenMuc} thiếu phần này sẽ bị bỏ
                        khi lưu.
                      </p>
                    )}
                    {bieuMau(x, (p) => sua(x.ma, p))}
                    <div className="flex flex-wrap justify-end gap-2">
                      {laMoi && (
                        <button
                          type="button"
                          className="min-h-11 rounded-lg px-3 text-sm text-do-600 ring-1 ring-slate-200 hover:bg-do-50"
                          onClick={() => {
                            onDoi(ds.filter((y) => y.ma !== x.ma));
                            setDangMo(null);
                          }}
                        >
                          Xoá {tenMuc} mới này
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-ghost min-h-11"
                        onClick={() => setDangMo(null)}
                      >
                        Xong
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {daLoc.length > hien.length && (
        <button
          type="button"
          onClick={() => setSoHien((n) => n + MOI_TRANG)}
          className="min-h-11 w-full rounded-xl text-sm font-semibold text-navy-700 ring-1 ring-slate-200 hover:bg-navy-50"
        >
          Xem thêm {Math.min(MOI_TRANG, daLoc.length - hien.length)} / còn{" "}
          {daLoc.length - hien.length}
        </button>
      )}
    </div>
  );
}
