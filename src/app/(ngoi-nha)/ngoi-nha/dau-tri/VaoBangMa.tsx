"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import BieuTuong from "@/components/ngoi-nha/BieuTuong";
import { aTimDauTri } from "../actions";

/** Nhập mã tham gia hiện trên màn hình sân khấu để vào đúng phiên. */
export default function VaoBangMa() {
  const router = useRouter();
  const [ma, setMa] = useState("");
  const [loi, setLoi] = useState("");
  const [ban, setBan] = useState(false);
  return (
    <form
      className="rounded-3xl bg-white p-4 text-navy-900"
      onSubmit={async (e) => {
        e.preventDefault();
        setBan(true);
        setLoi("");
        const r = await aTimDauTri(ma);
        setBan(false);
        if (!r.ok) return setLoi(r.loi);
        if (!r.data)
          return setLoi(
            "Không có phiên nào với mã này. Kiểm tra lại mã trên màn hình sân khấu.",
          );
        if (r.data.trangThai !== "DANG_MO")
          return setLoi(`Phiên “${r.data.ten}” chưa mở hoặc đã kết thúc.`);
        router.push(`/ngoi-nha/dau-tri/${r.data.id}`);
      }}
    >
      <label className="lbl" htmlFor="ma-dau-tri">
        Nhập mã tham gia trên màn hình
      </label>
      <div className="flex gap-2">
        <input
          id="ma-dau-tri"
          value={ma}
          onChange={(e) => setMa(e.target.value.toUpperCase())}
          className="inp uppercase tracking-[0.3em]"
          placeholder="VD: CL2026"
          maxLength={8}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={ban || !ma.trim()}
          className="flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-son-600 px-4 text-sm font-bold text-white disabled:opacity-50"
        >
          <BieuTuong ten="tia" dac className="h-4 w-4" /> Vào
        </button>
      </div>
      {loi && <p className="mt-2 text-sm text-do-700">{loi}</p>}
    </form>
  );
}
