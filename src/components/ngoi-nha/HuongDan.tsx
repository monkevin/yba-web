"use client";

import { useState } from "react";
import { aDaXemHuongDan } from "@/app/(ngoi-nha)/ngoi-nha/actions";
import type { BuocHuongDan } from "@/lib/ngoi-nha/cai-dat/noi-dung-sua";
import BieuTuong from "./BieuTuong";
import { am } from "./am-thanh";

/** Biểu tượng cố định theo thứ tự bước — Ban Điều hành chỉ sửa chữ. */
const ICON = ["nha", "khien", "tay"] as const;

/**
 * Hướng dẫn 30 giây cho lần đầu vào game. Nội dung Ban Điều hành soạn ở quản
 * trị (`nn.huongDan`), trang chủ đọc rồi truyền xuống.
 */
export default function HuongDan({ buoc: dsBuoc }: { buoc: BuocHuongDan[] }) {
  const [mo, setMo] = useState(true);
  const [buoc, setBuoc] = useState(0);
  if (!mo || dsBuoc.length === 0) return null;
  const b = dsBuoc[Math.min(buoc, dsBuoc.length - 1)];
  const cuoi = buoc >= dsBuoc.length - 1;
  const dong = () => {
    setMo(false);
    void aDaXemHuongDan();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/75 sm:items-center sm:p-4">
      <div
        className="nn-truot-len max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white p-6 text-center text-navy-900 sm:rounded-3xl"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        role="dialog"
        aria-label="Hướng dẫn chơi"
      >
        <div key={buoc} className="nn-hien">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-son-600 text-white">
            <BieuTuong ten={ICON[buoc % ICON.length]} className="h-8 w-8" />
          </span>
          <h2 className="mt-4 text-2xl leading-tight">{b.tieuDe}</h2>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-slate-600">
            {b.noiDung}
          </p>
        </div>
        <div className="mt-5 flex justify-center gap-1.5">
          {dsBuoc.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === buoc ? "w-6 bg-son-600" : "w-1.5 bg-slate-200"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            am.bam();
            if (!cuoi) setBuoc(buoc + 1);
            else dong();
          }}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-son-600 text-base font-bold text-white hover:bg-son-700"
        >
          {cuoi ? "Vào nhà thôi" : "Tiếp"}{" "}
          <BieuTuong ten="mui-ten" className="h-4 w-4" />
        </button>
        {!cuoi && (
          <button
            type="button"
            onClick={dong}
            className="mt-2 min-h-11 px-4 text-sm text-slate-500"
          >
            Bỏ qua
          </button>
        )}
      </div>
    </div>
  );
}
