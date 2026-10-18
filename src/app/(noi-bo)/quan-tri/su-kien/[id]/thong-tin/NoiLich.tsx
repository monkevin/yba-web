"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Lich = { id: string; tieuDe: string; slug: string | null; published: boolean; ngay: string; daDuyet: number; choDuyet: number };

export default function NoiLich({ eventId, lich, goiY }: { eventId: string; lich: Lich | null; goiY: { id: string; tieuDe: string; ngay: string }[] }) {
  const router = useRouter();
  const [tb, setTb] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [chon, setChon] = useState(goiY[0]?.id ?? "");

  async function lam(hanhDong: string, them: Record<string, unknown> = {}) {
    setTb("");
    setDangGui(true);
    const res = await fetch(`/api/quan-tri/su-kien/${eventId}/lich`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hanhDong, ...them }),
    });
    const d = await res.json().catch(() => ({}));
    setDangGui(false);
    if (!res.ok) return setTb(d.error || "Không thực hiện được");
    if (hanhDong === "nhap")
      setTb(
        `Đã thêm ${d.soKhach} khách` +
          (d.soTrung ? ` (${d.soTrung} người trùng SĐT đã có sẵn)` : "") +
          (d.soTaiTro ? ` · ${d.soTaiTro} nhà tài trợ "Đang vận động"` : "") +
          (d.boQuaTaiTro ? ` · ${d.boQuaTaiTro} đăng ký tài trợ cần người có quyền Tài chính nhập` : "") +
          "."
      );
    router.refresh();
  }

  return (
    <section className="card p-5">
      <h2 className="font-bold text-navy-800">Lịch hoạt động</h2>
      {lich ? (
        <div className="mt-2 space-y-3 text-sm">
          <p className="text-slate-600">
            Đã gắn: <b className="text-navy-800">{lich.tieuDe}</b> ({lich.ngay}) ·{" "}
            {lich.published ? <span className="text-emerald-700">đang hiện trên web</span> : <span className="text-amber-700">đang ẩn</span>} ·{" "}
            {lich.daDuyet} đăng ký đã duyệt{lich.choDuyet ? `, ${lich.choDuyet} chờ duyệt` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => lam("nhap")} disabled={dangGui || !lich.daDuyet} className="btn-primary !py-1.5">
              Nhập {lich.daDuyet} đăng ký đã duyệt vào Khách mời
            </button>
            <Link href="/quan-tri/lich-hoat-dong" className="btn-ghost !py-1.5">
              Duyệt / sửa ở Lịch hoạt động
            </Link>
            {lich.slug && lich.published && (
              <a href={`/lich-hoat-dong/${lich.slug}`} target="_blank" rel="noopener" className="btn-ghost !py-1.5">
                Trang công khai ↗
              </a>
            )}
            <button onClick={() => confirm("Bỏ gắn mục lịch? (mục lịch và đăng ký giữ nguyên)") && lam("go")} className="ml-auto text-sm text-slate-500 hover:underline">
              Bỏ gắn
            </button>
          </div>
          <p className="text-xs text-slate-500">Trùng SĐT với khách đã có thì bỏ qua — bấm lại bao nhiêu lần cũng không nhân đôi.</p>
        </div>
      ) : (
        <div className="mt-2 space-y-3 text-sm">
          <p className="text-slate-500">Đưa sự kiện lên Lịch hoạt động để hội viên đăng ký tham gia / tài trợ trên web, rồi nhập đăng ký đã duyệt vào danh sách khách.</p>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => lam("tao")} disabled={dangGui} className="btn-primary !py-1.5">
              + Đưa lên Lịch hoạt động
            </button>
            {goiY.length > 0 && (
              <>
                <span className="text-slate-400">hoặc gắn mục có sẵn</span>
                <select className="inp !w-auto !py-1.5" value={chon} onChange={(e) => setChon(e.target.value)} aria-label="Mục lịch có sẵn">
                  {goiY.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.ngay} · {g.tieuDe}
                    </option>
                  ))}
                </select>
                <button onClick={() => lam("gan", { lichId: chon })} disabled={dangGui || !chon} className="btn-ghost !py-1.5">
                  Gắn
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {tb && <p className="mt-2 text-sm text-navy-700">{tb}</p>}
    </section>
  );
}
