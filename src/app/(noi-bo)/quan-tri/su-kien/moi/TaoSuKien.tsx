"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LOAI_SU_KIEN, QUY_MO, THONG_TIN_QUY_MO, taoDuLieuMau, type QuyMo } from "@/lib/trung-tam-sk/mau";

export default function TaoSuKien({
  suKien,
}: {
  suKien: { id: string; title: string; ngay: string; gio: string; diaDiem: string } | null;
}) {
  const router = useRouter();
  const [loai, setLoai] = useState("coffee");
  const [quyMo, setQuyMo] = useState<QuyMo>("vua");
  const [tieuDe, setTieuDe] = useState(suKien?.title ?? "");
  const [ngay, setNgay] = useState(suKien?.ngay ?? "");
  const [gio, setGio] = useState(suKien?.gio ?? "08:00");
  const [diaDiem, setDiaDiem] = useState(suKien?.diaDiem ?? "");
  const [mucTieu, setMucTieu] = useState("");
  const [dungMau, setDungMau] = useState(true);
  const [ban, setBan] = useState(false);
  const [loi, setLoi] = useState("");

  const mau = useMemo(
    () => taoDuLieuMau(loai, quyMo, ngay ? new Date(`${ngay}T12:00:00+07:00`) : null, gio || "08:00"),
    [loai, quyMo, ngay, gio]
  );

  async function tao() {
    setLoi("");
    if (!suKien && !tieuDe.trim()) return setLoi("Nhập tên sự kiện");
    if (!ngay) return setLoi("Chọn ngày tổ chức");
    setBan(true);
    const res = await fetch("/api/quan-tri/su-kien/tao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: suKien?.id ?? null,
        tieuDe,
        ngay,
        gio,
        diaDiem,
        loai,
        quyMo,
        mucTieuKhach: mucTieu ? Number(mucTieu) : null,
        dungMau,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBan(false);
    if (!res.ok) return setLoi(data.error || "Không tạo được sự kiện");
    router.push(`/quan-tri/su-kien/${data.eventId}`);
    router.refresh();
  }

  const chon = (on: boolean) =>
    `rounded-xl px-3 py-2.5 text-left text-sm ring-1 transition ${
      on ? "bg-navy-50 text-navy-800 ring-2 ring-navy-500" : "bg-white text-slate-700 ring-slate-200 hover:ring-navy-300"
    }`;

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <h2 className="font-bold text-navy-800">1. Loại sự kiện</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {LOAI_SU_KIEN.map((l) => (
            <button key={l.value} type="button" onClick={() => setLoai(l.value)} className={chon(loai === l.value)}>
              {l.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-bold text-navy-800">2. Quy mô</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {QUY_MO.map((q) => (
            <button key={q.value} type="button" onClick={() => setQuyMo(q.value)} className={chon(quyMo === q.value)}>
              <div className="font-semibold">{q.label}</div>
              <div className="mt-0.5 text-xs text-slate-500">{THONG_TIN_QUY_MO[q.value].desc}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-bold text-navy-800">3. Thông tin</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="lbl">Tên sự kiện</span>
            <input
              className="inp disabled:bg-slate-50"
              value={tieuDe}
              disabled={!!suKien}
              onChange={(e) => setTieuDe(e.target.value)}
              placeholder="VD: Coffee Share tháng 11 — Chuyển đổi số cho SME"
            />
          </label>
          <label>
            <span className="lbl">Ngày tổ chức</span>
            <input type="date" className="inp" value={ngay} onChange={(e) => setNgay(e.target.value)} />
          </label>
          <label>
            <span className="lbl">Giờ bắt đầu</span>
            <input type="time" className="inp" value={gio} onChange={(e) => setGio(e.target.value)} />
          </label>
          <label>
            <span className="lbl">Địa điểm</span>
            <input className="inp" value={diaDiem} onChange={(e) => setDiaDiem(e.target.value)} />
          </label>
          <label>
            <span className="lbl">Mục tiêu số khách</span>
            <input
              type="number"
              className="inp"
              value={mucTieu}
              placeholder={String(mau.mucTieuKhach)}
              onChange={(e) => setMucTieu(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="card p-5">
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={dungMau} onChange={(e) => setDungMau(e.target.checked)} className="mt-1 h-4 w-4" />
          <span>
            <span className="font-bold text-navy-800">4. Sinh sẵn quy trình chuẩn</span>
            <span className="block text-sm text-slate-600">
              {mau.phien.length} phiên ({mau.phien.map((p) => p.ten).join(" · ")}) · {mau.cacBan.length} ban trong BTC ·{" "}
              {mau.viec.length} việc theo mốc D-x · {mau.kichBan.length} mục kịch bản · {mau.hauCan.length} hạng mục hậu cần ·{" "}
              {mau.thuChi.length} dòng dự trù chi. Sửa / xoá thoải mái sau khi tạo.
            </span>
          </span>
        </label>
        {dungMau && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium text-navy-700">Xem trước các ban và việc chính</summary>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              <ul className="space-y-1">
                {mau.cacBan.map((b) => (
                  <li key={b.ten}>
                    <b className="text-slate-800">{b.ten}</b>
                    <span className="block text-xs text-slate-500">{b.moTa}</span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-1">
                {mau.viec.slice(0, 14).map((v, i) => (
                  <li key={i} className="text-slate-700">
                    <span className="mr-1 rounded bg-nga-100 px-1.5 text-xs text-navy-700">{v.ghiChu}</span>
                    {v.tieuDe}
                  </li>
                ))}
                {mau.viec.length > 14 && <li className="text-xs text-slate-500">… và {mau.viec.length - 14} việc khác</li>}
              </ul>
            </div>
          </details>
        )}
      </section>

      {loi && <div className="rounded-lg border border-do-200 bg-do-50 px-3 py-2 text-sm text-do-700">{loi}</div>}
      <div className="flex justify-end">
        <button className="btn-primary !px-6" onClick={tao} disabled={ban}>
          {ban ? "Đang tạo…" : suKien ? "Bật quản lý tổ chức" : "Tạo sự kiện"}
        </button>
      </div>
    </div>
  );
}
