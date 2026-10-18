"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { chuan, gioVN } from "@/lib/trung-tam-sk/bang";

type Khach = {
  id: string;
  danhXung: string | null;
  ten: string;
  chucDanh: string | null;
  donVi: string | null;
  phone: string | null;
  nhom: string | null;
  vip: boolean;
  ban: string | null;
  memberId: string | null;
  thamDu: { phienId: string; xacNhan: string; checkinLuc: string | null }[];
};

const banLabel = (b: string | null) => (!b ? "" : /^b[aà]n\b/i.test(b.trim()) ? b.trim() : `Bàn ${b.trim()}`);

export default function CheckinClient({
  eventId,
  phien,
  phienMacDinh,
  khach: dau,
}: {
  eventId: string;
  phien: { id: string; ten: string }[];
  phienMacDinh: string;
  khach: Khach[];
}) {
  const router = useRouter();
  const [phienId, setPhienId] = useState(phienMacDinh);
  const [q, setQ] = useState("");
  const [ds, setDs] = useState(dau);
  const [dauCu, setDauCu] = useState(dau);
  if (dau !== dauCu) {
    setDauCu(dau);
    setDs(dau);
  }
  const [tb, setTb] = useState<{ loai: "ok" | "loi"; text: string } | null>(null);
  const [dangGui, setDangGui] = useState<string | null>(null);
  const [moThem, setMoThem] = useState(false);
  const [moi, setMoi] = useState({ ten: "", donVi: "", phone: "" });

  // Nhiều bàn lễ tân cùng lúc: tự cập nhật 20 giây một lần
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 20_000);
    return () => clearInterval(t);
  }, [router]);

  const td = (k: Khach) => k.thamDu.find((t) => t.phienId === phienId);
  const daDen = ds.filter((k) => td(k)?.checkinLuc).length;
  const xacNhan = ds.filter((k) => td(k)?.xacNhan === "CO").length;

  const kq = useMemo(() => {
    const n = chuan(q);
    if (!n) return [];
    const so = q.replace(/\D/g, "");
    return ds
      .filter(
        (k) =>
          chuan(k.ten).includes(n) ||
          chuan(k.donVi ?? "").includes(n) ||
          (so.length >= 3 && (k.phone ?? "").replace(/\D/g, "").endsWith(so)) ||
          chuan(k.ban ?? "") === n
      )
      .slice(0, 30);
  }, [q, ds]);

  async function bam(k: Khach | null, coMat: boolean) {
    setDangGui(k?.id ?? "moi");
    setTb(null);
    const res = await fetch(`/api/quan-tri/su-kien/${eventId}/check-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(k ? { khachId: k.id, phienId, coMat } : { themKhach: moi, phienId }),
    });
    const d = await res.json().catch(() => ({}));
    setDangGui(null);
    if (!res.ok) return setTb({ loai: "loi", text: d.error || "Không check-in được" });
    if (k) {
      setDs((x) =>
        x.map((y) =>
          y.id !== k.id
            ? y
            : {
                ...y,
                memberId: d.memberId ?? y.memberId,
                thamDu: [
                  ...y.thamDu.filter((t) => t.phienId !== phienId),
                  { phienId, xacNhan: coMat ? "CO" : td(y)?.xacNhan ?? "CHO", checkinLuc: d.luc },
                ],
              }
        )
      );
    } else {
      setMoi({ ten: "", donVi: "", phone: "" });
      setMoThem(false);
      router.refresh();
    }
    const ten = k ? `${k.danhXung ? k.danhXung + " " : ""}${k.ten}` : moi.ten;
    setTb({
      loai: "ok",
      text: coMat
        ? `✓ Đã check-in ${ten}${k?.ban ? ` — ${banLabel(k.ban)}` : ""}${d.diem ? ` · +${d.diem} điểm hoạt động` : ""}`
        : `Đã huỷ check-in ${ten}`,
    });
    if (coMat) setQ("");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex flex-wrap gap-2">
        {phien.map((p) => (
          <button
            key={p.id}
            onClick={() => setPhienId(p.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              p.id === phienId ? "bg-navy-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {p.ten}
          </button>
        ))}
      </div>
      <div className="card mb-3 flex items-center justify-between p-4">
        <div>
          <div className="text-3xl font-bold text-emerald-700 tabular-nums">{daDen}</div>
          <div className="text-xs text-slate-500">đã check-in phiên này</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-navy-800 tabular-nums">
            {xacNhan}/{ds.length}
          </div>
          <div className="text-xs text-slate-500">xác nhận / tổng khách</div>
        </div>
      </div>

      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Gõ tên, công ty hoặc 3 số cuối SĐT…"
        className="inp !py-3 !text-lg"
      />

      {tb && (
        <div
          className={`mt-3 rounded-lg px-4 py-3 text-sm font-medium ${
            tb.loai === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-do-50 text-do-700"
          }`}
        >
          {tb.text}
        </div>
      )}

      <ul className="mt-3 space-y-2">
        {kq.map((k) => {
          const t = td(k);
          return (
            <li key={k.id} className={`card flex items-center gap-3 p-3 ${k.vip ? "ring-2 ring-amber-300" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-navy-800">
                  {k.danhXung ? `${k.danhXung} ` : ""}
                  {k.ten}
                  {k.vip && <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-800">VIP</span>}
                  {k.memberId && <span className="ml-1 rounded bg-navy-100 px-1.5 text-xs text-navy-700">Hội viên</span>}
                </div>
                <div className="truncate text-sm text-slate-600">
                  {[k.chucDanh, k.donVi].filter(Boolean).join(" · ")}
                </div>
                <div className="text-xs text-slate-500">
                  {[k.nhom, banLabel(k.ban), k.phone, t?.xacNhan === "CO" ? "Đã xác nhận" : t?.xacNhan === "KHONG" ? "Báo không dự" : "Chưa xác nhận phiên này"]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              {t?.checkinLuc ? (
                <div className="text-right">
                  <div className="font-semibold text-emerald-700">✓ {gioVN(t.checkinLuc)}</div>
                  <button
                    onClick={() => confirm(`Huỷ check-in ${k.ten}?`) && bam(k, false)}
                    className="text-xs text-slate-400 hover:text-do-600"
                    disabled={dangGui === k.id}
                  >
                    Huỷ
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => bam(k, true)}
                  disabled={dangGui === k.id}
                  className="btn-primary !px-5 !py-3 !text-base"
                >
                  Check-in
                </button>
              )}
            </li>
          );
        })}
        {q && kq.length === 0 && (
          <li className="card p-4 text-center text-sm text-slate-500">
            Không tìm thấy “{q}”.{" "}
            <button className="font-medium text-navy-600 underline" onClick={() => { setMoi({ ten: q, donVi: "", phone: "" }); setMoThem(true); }}>
              Thêm khách vãng lai
            </button>
          </li>
        )}
      </ul>

      {!moThem ? (
        <button className="mt-4 text-sm text-navy-600 hover:underline" onClick={() => setMoThem(true)}>
          + Khách vãng lai (chưa có trong danh sách)
        </button>
      ) : (
        <form
          className="card mt-4 grid gap-3 p-4 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            bam(null, true);
          }}
        >
          <input className="inp" placeholder="Họ và tên *" value={moi.ten} onChange={(e) => setMoi({ ...moi, ten: e.target.value })} />
          <input className="inp" placeholder="Đơn vị" value={moi.donVi} onChange={(e) => setMoi({ ...moi, donVi: e.target.value })} />
          <input className="inp" placeholder="SĐT" value={moi.phone} onChange={(e) => setMoi({ ...moi, phone: e.target.value })} />
          <div className="flex gap-2 sm:col-span-3">
            <button className="btn-primary" disabled={!moi.ten.trim() || dangGui === "moi"}>
              Thêm &amp; check-in
            </button>
            <button type="button" className="btn-ghost" onClick={() => setMoThem(false)}>
              Đóng
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
