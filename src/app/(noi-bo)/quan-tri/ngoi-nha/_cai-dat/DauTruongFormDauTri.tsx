"use client";

/**
 * Form tạo phiên Đấu trí sự kiện. Dùng onSubmit + transition (không
 * `<form action>`) để lỗi không xoá mất chữ đang nhập; giây mặc định theo luật.
 */
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { taoPhienDauTri, type KetQuaDauTruong } from "./actions-dau-truong";
import { INP, ThongBao } from "./truong";

export default function DauTruongFormDauTri({
  nhom,
  giayMacDinh,
  gioiHanGiay,
}: {
  nhom: { ten: string; bo: { ma: string; ten: string; moTa: string }[] }[];
  giayMacDinh: number;
  gioiHanGiay: readonly [number, number];
}) {
  const router = useRouter();
  const id = useId();
  const [ten, setTen] = useState("");
  const [moTa, setMoTa] = useState("");
  const [boCau, setBoCau] = useState(nhom[0]?.bo[0]?.ma ?? "");
  const [giay, setGiay] = useState(String(giayMacDinh));
  const [kq, setKq] = useState<KetQuaDauTruong>({});
  const [dangTao, startTransition] = useTransition();
  const moTaBo = nhom.flatMap((n) => n.bo).find((b) => b.ma === boCau)?.moTa;

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setKq({});
        startTransition(async () => {
          const r = await taoPhienDauTri({
            ten,
            moTa,
            boCau,
            giay: Number(giay) || 0,
          });
          setKq(r);
          if (r.ok) {
            setTen("");
            setMoTa("");
            router.refresh();
          }
        });
      }}
    >
      <label className="block sm:col-span-2" htmlFor={`${id}-ten`}>
        <span className="lbl">Tên phiên</span>
        <input
          id={`${id}-ten`}
          className={INP}
          value={ten}
          maxLength={120}
          onChange={(e) => setTen(e.target.value)}
          placeholder="Đấu trí – Họp mặt hội viên Quý IV/2026"
          required
        />
      </label>
      <label className="block sm:col-span-2" htmlFor={`${id}-bo`}>
        <span className="lbl">Bộ câu hỏi</span>
        <select
          id={`${id}-bo`}
          className={INP}
          value={boCau}
          onChange={(e) => setBoCau(e.target.value)}
        >
          {nhom.map((n) => (
            <optgroup key={n.ten} label={n.ten}>
              {n.bo.map((b) => (
                <option key={b.ma} value={b.ma}>
                  {b.ten}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {moTaBo && (
          <span className="mt-0.5 block text-xs text-slate-500">{moTaBo}</span>
        )}
      </label>
      <label className="block" htmlFor={`${id}-giay`}>
        <span className="lbl">Giây mỗi câu</span>
        <input
          id={`${id}-giay`}
          inputMode="numeric"
          className={INP}
          value={giay}
          onChange={(e) => setGiay(e.target.value.replace(/\D/g, ""))}
        />
        <span className="mt-0.5 block text-xs text-slate-500">
          Từ {gioiHanGiay[0]} đến {gioiHanGiay[1]} · mặc định {giayMacDinh}
        </span>
      </label>
      <label className="block" htmlFor={`${id}-mota`}>
        <span className="lbl">Mô tả ngắn (hiện trên màn hình)</span>
        <input
          id={`${id}-mota`}
          className={INP}
          value={moTa}
          maxLength={500}
          onChange={(e) => setMoTa(e.target.value)}
          placeholder="10 con số kinh tế Việt Nam 2026"
        />
      </label>
      <div className="space-y-2 sm:col-span-2">
        <ThongBao kq={kq} />
        <button
          type="submit"
          disabled={dangTao || !ten.trim() || !boCau}
          className="btn-primary min-h-11"
        >
          {dangTao ? "Đang tạo…" : "Tạo phiên"}
        </button>
      </div>
    </form>
  );
}
