"use client";

/**
 * Mảnh giao diện dùng chung cho các trình sửa nội dung game của nhóm giao diện:
 * ô vốn gọn (có nút đổi dấu cho điện thoại), nút "Dùng lại bộ gốc".
 */
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type ReactNode } from "react";
import { MA_VON, VON, type MaVon, type Von } from "@/lib/ngoi-nha/luat";
import { luuCaiDat, veBanGoc, type KetQuaCaiDat } from "./actions";
import { INP, ThongBao } from "./truong";

/** Ô số nhỏ gõ được dấu trừ (vốn âm), trống / "-" thì chưa đổi giá trị. */
function OSoGon({
  nhan,
  giaTri,
  gioiHan,
  mau,
  onDoi,
}: {
  nhan: string;
  giaTri: number;
  gioiHan: readonly [number, number];
  mau?: string;
  onDoi: (n: number) => void;
}) {
  const id = useId();
  const [tho, setTho] = useState(giaTri ? String(giaTri) : "");
  const [truoc, setTruoc] = useState(giaTri);
  if (truoc !== giaTri) {
    setTruoc(giaTri);
    setTho(giaTri ? String(giaTri) : "");
  }
  const kep = (n: number) => Math.min(gioiHan[1], Math.max(gioiHan[0], n));
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="flex items-center gap-1 text-xs font-medium text-slate-600"
      >
        {mau && (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: mau }}
          />
        )}
        {nhan}
      </label>
      <div className="mt-0.5 flex items-center gap-1">
        {/* Bàn phím số của iPhone không có dấu trừ → nút đổi dấu riêng */}
        {gioiHan[0] < 0 && (
          <button
            type="button"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-lg text-sm font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
            disabled={!giaTri}
            aria-label={`Đổi dấu ${nhan}`}
            title="Đổi cộng / trừ"
            onClick={() => {
              const n = kep(-giaTri);
              setTruoc(n);
              setTho(n ? String(n) : "");
              onDoi(n);
            }}
          >
            ±
          </button>
        )}
        <input
          id={id}
          inputMode="numeric"
          className={`${INP} min-w-0 px-1 text-center`}
          placeholder="0"
          value={tho}
          onChange={(e) => {
            const s = e.target.value
              .replace(/[^\d-]/g, "")
              .replace(/(?!^)-/g, "");
            setTho(s);
            if (s === "") {
              setTruoc(0);
              onDoi(0);
              return;
            }
            const n = Number(s);
            if (s !== "-" && Number.isFinite(n)) {
              const k = kep(n);
              setTruoc(k);
              onDoi(k);
              if (k !== n) setTho(String(k));
            }
          }}
          onBlur={() => {
            if (tho === "-") setTho(giaTri ? String(giaTri) : "");
          }}
        />
      </div>
    </div>
  );
}

/** Bốn ô vốn CN / TT / XH / TS; ô 0 thì bỏ khỏi đối tượng. */
export function GiaoDienOVon({
  von,
  gioiHan,
  onDoi,
}: {
  von: Partial<Von>;
  gioiHan: readonly [number, number];
  onDoi: (v: Partial<Von>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {MA_VON.map((k: MaVon) => (
        <OSoGon
          key={k}
          nhan={VON[k].ngan}
          mau={VON[k].mau}
          giaTri={von[k] ?? 0}
          gioiHan={gioiHan}
          onDoi={(n) => {
            // Dựng lại theo đúng thứ tự MA_VON như máy chủ trả về: gõ ô nào
            // trước cũng ra cùng một JSON, khỏi báo "chưa lưu" / "đã chỉnh" oan
            const moi: Partial<Von> = {};
            for (const m of MA_VON) {
              const v = m === k ? n : (von[m] ?? 0);
              if (v) moi[m] = v;
            }
            onDoi(moi);
          }}
        />
      ))}
    </div>
  );
}

/**
 * Nút đưa một mục nội dung về bản gốc trong code. Hỏi xác nhận trước; xong gọi
 * `onXong` với giá trị mới để trình sửa nạp lại.
 *
 * Mã đã lưu trong CSDL (thẻ đã rút, câu đã trả lời) không được biến mất: Ban
 * từng thêm mục riêng thì truyền `giuLai` = bộ gốc + các mục riêng ở trạng thái
 * TẮT — nút lưu bản đó thay vì xoá hẳn khoá cài đặt.
 */
export function GiaoDienNutVeGoc<T>({
  muc,
  ten,
  canhBao,
  giuLai,
  onXong,
}: {
  muc: string;
  ten: string;
  canhBao: string;
  giuLai?: T | null;
  onXong: (giaTri: T) => void;
}) {
  const router = useRouter();
  const [kq, setKq] = useState<KetQuaCaiDat>({});
  const [dang, startTransition] = useTransition();
  return (
    <div className="card space-y-2 p-4 sm:p-5">
      <h2 className="font-semibold text-navy-800">Dùng lại bộ gốc</h2>
      <p className="text-sm text-slate-500">{canhBao}</p>
      <ThongBao kq={kq} />
      <button
        type="button"
        disabled={dang}
        className="btn-ghost min-h-11 text-do-700"
        onClick={() => {
          if (
            !confirm(
              `Đưa ${ten} về bộ gốc?\n\n${canhBao}\n\nViệc này áp dụng ngay, không cần bấm Lưu.`,
            )
          )
            return;
          const fd = new FormData();
          fd.set("muc", muc);
          if (giuLai) fd.set("duLieu", JSON.stringify(giuLai));
          startTransition(async () => {
            const r = giuLai ? await luuCaiDat({}, fd) : await veBanGoc({}, fd);
            setKq(
              r.ok && giuLai
                ? { ...r, message: `Đã đưa ${ten} về bộ gốc`, daChinh: [] }
                : r,
            );
            if (r.ok && r.giaTri) {
              onXong(r.giaTri as T);
              router.refresh();
            }
          });
        }}
      >
        {dang ? "Đang đưa về bộ gốc…" : "Dùng lại bộ gốc"}
      </button>
    </div>
  );
}

/** Mũi tên xoay khi mở một mục `<details>` (đặt trong summary, `details` có lớp `group`). */
export function MuiTenMo() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180"
      aria-hidden="true"
    >
      <path
        d="M5 8l5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Nhan({
  mau,
  children,
}: {
  mau: "xam" | "vang" | "navy" | "xanh";
  children: ReactNode;
}) {
  const lop = {
    xam: "bg-slate-100 text-slate-600",
    vang: "bg-amber-100 text-amber-800",
    navy: "bg-navy-50 text-navy-700",
    xanh: "bg-emerald-100 text-emerald-700",
  }[mau];
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${lop}`}
    >
      {children}
    </span>
  );
}
