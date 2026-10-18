"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { gioVN } from "@/lib/trung-tam-sk/bang";

type CauHoi = { id: string; noiDung: string; ten: string | null; trangThai: string; createdAt: Date | string };

const COT: { k: string; ten: string; lop: string }[] = [
  { k: "MOI", ten: "Mới gửi", lop: "border-amber-300" },
  { k: "CHIEU", ten: "Đang chiếu", lop: "border-do-400" },
  { k: "DA_TRA_LOI", ten: "Đã trả lời", lop: "border-emerald-300" },
  { k: "AN", ten: "Ẩn", lop: "border-slate-200" },
];

export default function HoiDapClient({ eventId, ds: dau, moHoiDap }: { eventId: string; ds: CauHoi[]; moHoiDap: boolean }) {
  const router = useRouter();
  const [ds, setDs] = useState(dau);
  const [dauCu, setDauCu] = useState(dau);
  if (dau !== dauCu) {
    setDauCu(dau);
    setDs(dau);
  }
  const [loi, setLoi] = useState("");

  // Câu hỏi mới từ khách tự hiện, không cần tải lại trang
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(t);
  }, [router]);

  async function doi(id: string, trangThai: string) {
    setLoi("");
    setDs((x) =>
      x.map((c) =>
        c.id === id ? { ...c, trangThai } : trangThai === "CHIEU" && c.trangThai === "CHIEU" ? { ...c, trangThai: "DA_TRA_LOI" } : c
      )
    );
    const res = await fetch(`/api/quan-tri/su-kien/bang/cauhoi/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trangThai }),
    });
    if (!res.ok) setLoi((await res.json().catch(() => ({}))).error || "Không lưu được");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-slate-600">
          {ds.length} câu hỏi · tự cập nhật mỗi vài giây.
          {!moHoiDap && (
            <>
              {" "}
              <Link href={`/quan-tri/su-kien/${eventId}/cong-qr`} className="text-do-600 hover:underline">
                Cổng hỏi đáp đang đóng — mở ở tab Cổng QR
              </Link>
            </>
          )}
        </p>
        <Link href={`/quan-tri/su-kien/${eventId}/hoi-dap/chieu`} target="_blank" className="btn-danger ml-auto">
          ▶ Mở màn hình chiếu
        </Link>
      </div>
      {loi && <p className="text-sm text-do-600">{loi}</p>}
      <div className="grid gap-4 lg:grid-cols-4">
        {COT.map((c) => {
          const cot = ds.filter((x) => x.trangThai === c.k);
          return (
            <div key={c.k} className={`card border-t-4 p-3 ${c.lop}`}>
              <h3 className="mb-2 text-sm font-bold text-navy-800">
                {c.ten} <span className="font-normal text-slate-400">({cot.length})</span>
              </h3>
              <ul className="space-y-2">
                {cot.map((q) => (
                  <li key={q.id} className="rounded-lg bg-slate-50 p-2.5">
                    <p className="whitespace-pre-line text-sm text-slate-800">{q.noiDung}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {q.ten || "Ẩn danh"} · {gioVN(q.createdAt)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
                      {q.trangThai !== "CHIEU" && (
                        <button onClick={() => doi(q.id, "CHIEU")} className="font-medium text-do-600 hover:underline">
                          Chiếu
                        </button>
                      )}
                      {q.trangThai !== "DA_TRA_LOI" && (
                        <button onClick={() => doi(q.id, "DA_TRA_LOI")} className="text-emerald-700 hover:underline">
                          Đã trả lời
                        </button>
                      )}
                      {q.trangThai !== "AN" && (
                        <button onClick={() => doi(q.id, "AN")} className="text-slate-500 hover:underline">
                          Ẩn
                        </button>
                      )}
                      {q.trangThai !== "MOI" && (
                        <button onClick={() => doi(q.id, "MOI")} className="text-slate-500 hover:underline">
                          Về mới
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
