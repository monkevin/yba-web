"use client";

/**
 * Khung sửa một NHÓM trong một mục cài đặt game: giữ bản đang sửa trong state,
 * lưu bằng transition (không dùng `<form action>` — React 19 tự reset form),
 * lưu xong hiện lại đúng bản máy chủ đã làm sạch.
 *
 * Cách dùng (trong một client component):
 *   <KhungCaiDat muc="luat" nhom={["tram"]} giaTri={luat} macDinh={LUAT_MAC_DINH}
 *     tieuDe="Hành trình 22 trạm">
 *     {(v, sua) => <OSo giaTri={v.tram.dung} onDoi={(n) => sua((x) => ({...x, tram: {...x.tram, dung: n}}))} … />}
 *   </KhungCaiDat>
 * Chỉ các trường cấp 1 trong `nhom` được gửi lên (máy chủ gộp với bản đang lưu).
 */
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { luuCaiDat, type KetQuaCaiDat } from "./actions";
import { ThongBao } from "./truong";

export default function KhungCaiDat<T extends object>({
  muc,
  nhom,
  giaTri,
  macDinh,
  tieuDe,
  moTa,
  canhBao,
  chuLuu = "Lưu",
  children,
}: {
  muc: string;
  /** Các trường cấp 1 của mục mà khung này sửa */
  nhom: (keyof T & string)[];
  giaTri: T;
  macDinh: T;
  tieuDe: ReactNode;
  moTa?: ReactNode;
  /** Cảnh báo hiện cạnh nút lưu (vd đang giữa mùa giải) */
  canhBao?: ReactNode;
  chuLuu?: string;
  children: (v: T, sua: (f: (v: T) => T) => void) => ReactNode;
}) {
  const router = useRouter();
  const [v, setV] = useState<T>(giaTri);
  const [daLuu, setDaLuu] = useState<T>(giaTri);
  const [kq, setKq] = useState<KetQuaCaiDat>({});
  const [dangLuu, startTransition] = useTransition();

  const phan = (x: T) =>
    Object.fromEntries(nhom.map((k) => [k, (x as Record<string, unknown>)[k]]));
  const doi = JSON.stringify(phan(v)) !== JSON.stringify(phan(daLuu));

  useEffect(() => {
    if (!doi) return;
    const chan = (e: BeforeUnloadEvent) => {
      // Safari (kể cả trên iPhone) chỉ hỏi khi có `returnValue`; Chrome /
      // Firefox đời mới chỉ cần preventDefault — đặt cả hai cho chắc.
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", chan);
    return () => window.removeEventListener("beforeunload", chan);
  }, [doi]);

  const sua = (f: (x: T) => T) => {
    setKq({});
    setV((x) => f(x));
  };

  return (
    <form
      className="card space-y-4 p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("muc", muc);
        fd.set("duLieu", JSON.stringify(phan(v)));
        startTransition(async () => {
          const r = await luuCaiDat({}, fd);
          setKq(r);
          if (r.ok && r.giaTri) {
            const moi = r.giaTri as T;
            // Chỉ thay nhóm của khung này, giữ chỗ đang gõ dở ở nhóm khác
            setV((x) => ({ ...x, ...phan(moi) }));
            setDaLuu((x) => ({ ...x, ...phan(moi) }));
            router.refresh();
          }
        });
      }}
    >
      <div>
        <h2 className="flex flex-wrap items-center gap-2 font-semibold text-navy-800">
          {tieuDe}
          {doi && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Chưa lưu
            </span>
          )}
        </h2>
        {moTa && <div className="mt-1 text-sm text-slate-500">{moTa}</div>}
      </div>

      {children(v, sua)}

      <div className="sticky bottom-0 -mx-4 space-y-2 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5">
        {canhBao && doi && <p className="text-xs text-amber-800">{canhBao}</p>}
        <ThongBao kq={kq} />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={dangLuu || !doi}
            className="btn-primary min-h-11"
          >
            {dangLuu ? "Đang lưu…" : chuLuu}
          </button>
          <button
            type="button"
            className="btn-ghost min-h-11"
            disabled={dangLuu}
            onClick={() => {
              if (
                confirm("Đưa phần này về mặc định? Bấm Lưu sau đó mới áp dụng.")
              )
                sua((x) => ({ ...x, ...phan(macDinh) }));
            }}
          >
            Về mặc định
          </button>
          {doi && (
            <button
              type="button"
              className="min-h-11 px-2 text-sm text-slate-500 underline"
              onClick={() => sua((x) => ({ ...x, ...phan(daLuu) }))}
            >
              Bỏ thay đổi
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
