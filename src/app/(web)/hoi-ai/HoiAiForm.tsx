"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DAI_TOI_DA } from "@/lib/hoi-ai";

type Nguon = { nhan: string; duongDan: string };
type Luot = {
  cauHoi: string;
  traLoi?: string;
  nguon?: Nguon[];
  loi?: string;
  id?: string;
};

/**
 * Đổi markdown tối giản mà trợ lý hay dùng thành HTML: đậm, liên kết, gạch đầu
 * dòng. Cố ý KHÔNG dùng thư viện markdown đầy đủ — chỉ nhận đúng mấy dạng này
 * thì không có đường chèn thẻ lạ vào trang.
 */
function DongTraLoi({ text }: { text: string }) {
  const khoi = text.split(/\n{2,}/);
  return (
    <div className="space-y-3 leading-relaxed text-slate-700">
      {khoi.map((k, i) => {
        const dong = k.split("\n");
        const laDanhSach = dong.every((d) => /^\s*[-*•]\s+/.test(d));
        if (laDanhSach) {
          return (
            <ul key={i} className="space-y-1.5">
              {dong.map((d, j) => (
                <li key={j} className="flex gap-2">
                  <span className="mt-0.5 shrink-0 text-do-500">▸</span>
                  <span>{ganChu(d.replace(/^\s*[-*•]\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{ganChu(k.replace(/\n/g, " "))}</p>;
      })}
    </div>
  );
}

/** Nhận `**đậm**` và `[chữ](/duong-dan)` — bỏ qua mọi thứ khác. */
function ganChu(s: string): React.ReactNode[] {
  const ra: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\((\/[^)\s]*)\)|\*\*([^*]+)\*\*/g;
  let cuoi = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(s))) {
    if (m.index > cuoi) ra.push(s.slice(cuoi, m.index));
    if (m[1] && m[2]) {
      ra.push(
        <Link
          key={k++}
          href={m[2]}
          className="font-medium text-navy-700 underline decoration-navy-300 underline-offset-2 hover:text-do-600"
        >
          {m[1]}
        </Link>
      );
    } else if (m[3]) {
      ra.push(
        <strong key={k++} className="font-semibold text-navy-800">
          {m[3]}
        </strong>
      );
    }
    cuoi = m.index + m[0].length;
  }
  if (cuoi < s.length) ra.push(s.slice(cuoi));
  return ra;
}

const GOI_Y = [
  "Chi hội Chợ Lớn có bao nhiêu hội viên, hoạt động ở những quận nào?",
  "Có hội viên nào làm bao bì hoặc in ấn không?",
  "Muốn gia nhập Chi hội thì làm thế nào?",
  "Sắp tới Chi hội có hoạt động gì?",
  "Các gói tài trợ của Chi hội gồm những mức nào?",
  "Ai là Chủ nhiệm Chi hội nhiệm kỳ này?",
];

export default function HoiAiForm({ hoiSan = "" }: { hoiSan?: string }) {
  const [cauHoi, setCauHoi] = useState(hoiSan);
  const [dangHoi, setDangHoi] = useState(false);
  const [lich, setLich] = useState<Luot[]>([]);
  const cuoiRef = useRef<HTMLDivElement>(null);
  const daHoiSan = useRef(false);

  async function hoi(noiDung: string) {
    const q = noiDung.trim();
    if (!q || dangHoi) return;
    setCauHoi("");
    setDangHoi(true);
    setLich((l) => [...l, { cauHoi: q }]);

    try {
      const r = await fetch("/api/hoi-ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cauHoi: q }),
      });
      const d = await r.json();
      setLich((l) =>
        l.map((x, i) =>
          i === l.length - 1
            ? { ...x, traLoi: d.traLoi, nguon: d.nguon, loi: d.loi, id: d.id }
            : x
        )
      );
    } catch {
      setLich((l) =>
        l.map((x, i) =>
          i === l.length - 1
            ? { ...x, loi: "Không gửi được câu hỏi. Anh/chị kiểm tra kết nối mạng giúp." }
            : x
        )
      );
    } finally {
      setDangHoi(false);
    }
  }

  // Câu hỏi mang sang từ trang tìm kiếm thì hỏi luôn, khỏi bắt bấm lại
  useEffect(() => {
    if (hoiSan && !daHoiSan.current) {
      daHoiSan.current = true;
      void hoi(hoiSan);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoiSan]);

  useEffect(() => {
    cuoiRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lich, dangHoi]);

  return (
    <div>
      {lich.length === 0 && (
        <div className="card p-5">
          <p className="font-semibold text-navy-800">Thử hỏi những câu này:</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {GOI_Y.map((g) => (
              <button
                key={g}
                onClick={() => hoi(g)}
                className="tile min-h-11 px-4 py-3 text-left text-sm leading-relaxed text-slate-700"
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-5">
        {lich.map((l, i) => (
          <div key={i} className="space-y-3">
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-navy-600 px-4 py-2.5 leading-relaxed text-white">
                {l.cauHoi}
              </p>
            </div>

            {l.traLoi && (
              <div className="card p-5">
                <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-do-600">
                  <span aria-hidden="true">✨</span> Trợ lý Chi hội
                </p>
                <DongTraLoi text={l.traLoi} />

                {l.nguon && l.nguon.length > 0 && (
                  <div className="mt-4 border-t border-navy-100 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Trang liên quan
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {l.nguon.map((n) => (
                        <Link key={n.duongDan + n.nhan} href={n.duongDan} className="chip hover:bg-navy-100">
                          {n.nhan}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {l.loi && (
              <div className="rounded-xl border-l-4 border-l-amber-400 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
                {l.loi}
              </div>
            )}

            {!l.traLoi && !l.loi && (
              <div className="card flex items-center gap-3 p-5 text-slate-500">
                <span className="inline-flex gap-1" aria-hidden="true">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-navy-300 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-navy-300 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-navy-300 [animation-delay:300ms]" />
                </span>
                Đang tra dữ liệu của Chi hội…
              </div>
            )}
          </div>
        ))}
        <div ref={cuoiRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void hoi(cauHoi);
        }}
        className="sticky bottom-0 mt-6 border-t border-navy-100 bg-white/95 py-4 backdrop-blur"
      >
        <div className="flex gap-2">
          <input
            value={cauHoi}
            onChange={(e) => setCauHoi(e.target.value.slice(0, DAI_TOI_DA))}
            placeholder="Hỏi về Chi hội, hội viên, ngành nghề, sự kiện…"
            aria-label="Câu hỏi"
            className="inp min-h-12 flex-1"
            disabled={dangHoi}
          />
          <button
            disabled={dangHoi || cauHoi.trim().length < 3}
            className="btn-primary min-h-12 shrink-0 px-6 disabled:opacity-40"
          >
            {dangHoi ? "Đang hỏi…" : "Hỏi"}
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Trợ lý chỉ trả lời dựa trên dữ liệu đang có trên website Chi hội. Thông
          tin quan trọng, anh/chị vui lòng xác nhận lại với văn phòng Chi hội.
        </p>
      </form>
    </div>
  );
}
