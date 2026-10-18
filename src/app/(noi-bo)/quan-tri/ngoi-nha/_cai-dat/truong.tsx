"use client";

/**
 * Ô nhập dùng chung cho các khung cài đặt game. Ô nào cũng có điều khiển
 * (controlled), chữ 16px trên điện thoại (iPhone không tự phóng to), vùng bấm
 * ≥ 44px.
 */
import { useId, useState, type ReactNode } from "react";

export const INP = "inp text-base sm:text-sm";

/** Ô số: gõ tự do (kể cả xoá trống), máy chủ chặn giới hạn khi lưu. */
export function OSo({
  nhan,
  giaTri,
  macDinh,
  gioiHan,
  onDoi,
  donVi,
  goiY,
}: {
  nhan: string;
  giaTri: number;
  macDinh?: number;
  gioiHan: readonly [number, number];
  onDoi: (v: number) => void;
  donVi?: string;
  goiY?: ReactNode;
}) {
  const id = useId();
  const [tho, setTho] = useState(String(giaTri));
  // Giá trị từ ngoài đổi (lưu xong, về mặc định) → hiện lại đúng số đó
  const [truoc, setTruoc] = useState(giaTri);
  if (truoc !== giaTri) {
    setTruoc(giaTri);
    setTho(String(giaTri));
  }
  const khacMacDinh = macDinh !== undefined && giaTri !== macDinh;
  return (
    <label htmlFor={id} className="block">
      <span className="lbl flex items-center gap-1.5">
        {nhan}
        {khacMacDinh && (
          <span
            className="rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-800"
            title={`Mặc định ${macDinh}`}
          >
            đã đổi
          </span>
        )}
      </span>
      <div className="flex items-center gap-2">
        <input
          id={id}
          inputMode="numeric"
          className={`${INP} min-h-11`}
          value={tho}
          onChange={(e) => {
            // Chỉ giữ MỘT dấu trừ ở đầu: "1-2" thành "12". Trước đây dấu trừ
            // lọt vào giữa làm Number() ra NaN, ô kẹt chữ rác còn giá trị thật
            // vẫn là số cũ — người vận hành tưởng đã đổi mà nhãn "Chưa lưu"
            // không hiện.
            const s = e.target.value
              .replace(/[^\d-]/g, "")
              .replace(/(?!^)-/g, "");
            setTho(s);
            const n = Number(s);
            if (s !== "" && s !== "-" && Number.isFinite(n)) {
              setTruoc(n);
              onDoi(n);
            }
          }}
          onBlur={() => {
            // Rời ô mà chưa thành số thì hiện lại đúng số đang lưu
            if (!Number.isFinite(Number(tho)) || tho === "" || tho === "-")
              setTho(String(giaTri));
          }}
        />
        {donVi && (
          <span className="shrink-0 text-sm text-slate-500">{donVi}</span>
        )}
      </div>
      <span className="mt-0.5 block text-xs text-slate-500">
        Từ {gioiHan[0].toLocaleString("vi-VN")} đến{" "}
        {gioiHan[1].toLocaleString("vi-VN")}
        {macDinh !== undefined &&
          ` · mặc định ${macDinh.toLocaleString("vi-VN")}`}
        {goiY ? <> · {goiY}</> : null}
      </span>
    </label>
  );
}

/** Công tắc bật / tắt kèm dòng mô tả hậu quả. */
export function OBat({
  nhan,
  moTa,
  giaTri,
  onDoi,
  nguyHiem,
}: {
  nhan: string;
  moTa?: ReactNode;
  giaTri: boolean;
  onDoi: (v: boolean) => void;
  /** Công tắc "bật là chặn" (vd tạm dừng game) — tô đỏ khi bật */
  nguyHiem?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={giaTri}
      onClick={() => onDoi(!giaTri)}
      className={`flex min-h-11 w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition ${
        giaTri && nguyHiem
          ? "bg-do-50 ring-do-200"
          : giaTri
            ? "bg-white ring-navy-100 hover:bg-navy-50"
            : "bg-slate-50 ring-slate-200 hover:bg-slate-100"
      }`}
    >
      <span
        className={`mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${
          giaTri ? (nguyHiem ? "bg-do-600" : "bg-emerald-500") : "bg-slate-300"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow transition ${
            giaTri ? "translate-x-5" : ""
          }`}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-navy-800">
          {nhan}{" "}
          <span
            className={`text-xs font-medium ${giaTri ? (nguyHiem ? "text-do-700" : "text-emerald-700") : "text-slate-500"}`}
          >
            · {giaTri ? "Đang bật" : "Đang tắt"}
          </span>
        </span>
        {moTa && (
          <span className="mt-0.5 block text-xs text-slate-500">{moTa}</span>
        )}
      </span>
    </button>
  );
}

/** Ô chữ một dòng hoặc nhiều dòng, có đếm ký tự. */
export function OChu({
  nhan,
  giaTri,
  onDoi,
  dai,
  nhieuDong,
  goiY,
  placeholder,
}: {
  nhan: string;
  giaTri: string;
  onDoi: (v: string) => void;
  dai: number;
  nhieuDong?: boolean | number;
  goiY?: ReactNode;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      <span className="lbl flex items-baseline justify-between gap-2">
        <span>{nhan}</span>
        <span
          className={`text-[11px] font-normal ${giaTri.length > dai ? "text-do-600" : "text-slate-400"}`}
        >
          {giaTri.length}/{dai}
        </span>
      </span>
      {nhieuDong ? (
        <textarea
          id={id}
          className={INP}
          rows={typeof nhieuDong === "number" ? nhieuDong : 3}
          value={giaTri}
          placeholder={placeholder}
          onChange={(e) => onDoi(e.target.value)}
        />
      ) : (
        <input
          id={id}
          className={`${INP} min-h-11`}
          value={giaTri}
          placeholder={placeholder}
          onChange={(e) => onDoi(e.target.value)}
        />
      )}
      {goiY && (
        <span className="mt-0.5 block text-xs text-slate-500">{goiY}</span>
      )}
    </label>
  );
}

/** Ô ngày "yyyy-mm-dd" (trống = không giới hạn). */
export function ONgay({
  nhan,
  giaTri,
  onDoi,
}: {
  nhan: string;
  giaTri: string | null;
  onDoi: (v: string | null) => void;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      <span className="lbl">{nhan}</span>
      <input
        id={id}
        type="date"
        className={`${INP} min-h-11`}
        value={giaTri ?? ""}
        onChange={(e) => onDoi(e.target.value || null)}
      />
    </label>
  );
}

/** Đổi chỗ hai phần tử (trả mảng mới). */
export function doiCho<T>(ds: T[], i: number, j: number): T[] {
  if (j < 0 || j >= ds.length) return ds;
  const kq = [...ds];
  [kq[i], kq[j]] = [kq[j], kq[i]];
  return kq;
}

/** Nút lên / xuống / xoá cho dòng trong danh sách sửa. */
export function NutDong({
  i,
  tong,
  onDoi,
  onXoa,
  chuXoa = "Xoá",
}: {
  i: number;
  tong: number;
  onDoi: (j: number) => void;
  onXoa?: () => void;
  chuXoa?: string;
}) {
  // 44px (min-h-11) là cỡ tối thiểu bấm trúng bằng ngón tay — xem AGENTS.md
  const nut =
    "grid min-h-11 min-w-11 place-items-center rounded-lg text-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40";
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        className={nut}
        disabled={i === 0}
        onClick={() => onDoi(i - 1)}
        aria-label="Lên"
      >
        ↑
      </button>
      <button
        type="button"
        className={nut}
        disabled={i === tong - 1}
        onClick={() => onDoi(i + 1)}
        aria-label="Xuống"
      >
        ↓
      </button>
      {onXoa && (
        <button
          type="button"
          className={`${nut} px-3 text-do-600`}
          onClick={onXoa}
        >
          {chuXoa}
        </button>
      )}
    </div>
  );
}

export function ThongBao({
  kq,
}: {
  kq: { error?: string; message?: string; daChinh?: string[] };
}) {
  if (kq.error)
    return (
      <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
        {kq.error}
      </p>
    );
  if (kq.message)
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        {kq.message}
        {kq.daChinh?.length
          ? " · Máy chủ đã chỉnh một số ô về trong giới hạn cho phép, xem lại số hiện trên form."
          : ""}
      </p>
    );
  return null;
}
