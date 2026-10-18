"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BangDuLieu, { type Dong } from "@/components/trung-tam-sk/BangDuLieu";
import { TRANG_THAI_SU_KIEN } from "@/lib/trung-tam-sk/bang";
import { LOAI_SU_KIEN, QUY_MO } from "@/lib/trung-tam-sk/mau";

type DuLieu = {
  title: string;
  ngay: string;
  gio: string;
  location: string;
  summary: string;
  published: boolean;
  loai: string;
  quyMo: string;
  trangThai: string;
  mucTieuKhach: string;
  mucTieuThu: string;
  ghiChu: string;
  baiHocTot: string;
  baiHocCaiThien: string;
};

export default function ThongTinClient({
  eventId,
  slug,
  phien,
  dau,
  cacBan: banDau,
}: {
  eventId: string;
  slug: string;
  phien: Dong[];
  dau: DuLieu;
  cacBan: { ten: string; moTa: string }[];
}) {
  const router = useRouter();
  const [d, setD] = useState(dau);
  const [cacBan, setCacBan] = useState(banDau);
  const [tb, setTb] = useState("");
  const [ban, setBan] = useState(false);

  async function luu() {
    setBan(true);
    setTb("");
    const res = await fetch(`/api/quan-tri/su-kien/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...d, cacBan }),
    });
    const r = await res.json().catch(() => ({}));
    setBan(false);
    setTb(res.ok ? "Đã lưu." : r.error || "Không lưu được");
    if (res.ok) router.refresh();
  }

  async function goKhoiTrungTam() {
    if (
      prompt(
        "Gỡ sự kiện khỏi Trung tâm sẽ XOÁ khách mời, lượt check-in, công việc, kịch bản, hậu cần, thu chi của sự kiện này (Ban tổ chức, nhà tài trợ và nội dung sự kiện được giữ). Gõ GO để xác nhận:"
      ) !== "GO"
    )
      return;
    const res = await fetch(`/api/quan-tri/su-kien/${eventId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xacNhan: "GO" }),
    });
    if (res.ok) {
      router.push("/quan-tri/su-kien");
      router.refresh();
    } else setTb("Không gỡ được");
  }

  const o = (k: keyof DuLieu, nhan: string, p: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => (
    <label>
      <span className="lbl">{nhan}</span>
      <input className="inp" value={String(d[k])} onChange={(e) => setD({ ...d, [k]: e.target.value })} {...p} />
    </label>
  );
  const vung = (k: keyof DuLieu, nhan: string, goiY = "") => (
    <label className="sm:col-span-2">
      <span className="lbl">{nhan}</span>
      <textarea className="inp" rows={3} value={String(d[k])} placeholder={goiY} onChange={(e) => setD({ ...d, [k]: e.target.value })} />
    </label>
  );
  const chon = (k: keyof DuLieu, nhan: string, ds: { value: string; label: string }[]) => (
    <label>
      <span className="lbl">{nhan}</span>
      <select className="inp" value={String(d[k])} onChange={(e) => setD({ ...d, [k]: e.target.value })}>
        {ds.map((x) => (
          <option key={x.value} value={x.value}>
            {x.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="font-bold text-navy-800">Thông tin chung</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">{o("title", "Tên sự kiện")}</div>
          {o("ngay", "Ngày tổ chức", { type: "date" })}
          {o("gio", "Giờ bắt đầu", { type: "time" })}
          {o("location", "Địa điểm")}
          {chon("trangThai", "Trạng thái", TRANG_THAI_SU_KIEN)}
          {chon("loai", "Loại sự kiện", LOAI_SU_KIEN)}
          {chon("quyMo", "Quy mô", QUY_MO)}
          {o("mucTieuKhach", "Mục tiêu số khách", { type: "number" })}
          {o("mucTieuThu", "Mục tiêu thu (VND)", { inputMode: "numeric" })}
          {vung("summary", "Tóm tắt (hiện trên trang công khai khi công bố)")}
          {vung("ghiChu", "Ghi chú nội bộ / việc cần chốt")}
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" checked={d.published} onChange={(e) => setD({ ...d, published: e.target.checked })} className="h-4 w-4" />
            <span className="text-sm text-slate-700">
              Công bố lên website (trang <code>/su-kien/{slug}</code>) — album ảnh, nội dung sửa ở mục “Sự kiện &amp; chương trình”
            </span>
          </label>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-bold text-navy-800">Các ban trong Ban tổ chức</h2>
        <p className="text-sm text-slate-500">Dùng để phân công người, nhóm công việc và chi phí theo ban.</p>
        <ul className="mt-3 space-y-2">
          {cacBan.map((b, i) => (
            <li key={i} className="grid gap-2 sm:grid-cols-[220px_1fr_auto]">
              <input
                className="inp"
                value={b.ten}
                onChange={(e) => setCacBan(cacBan.map((x, j) => (j === i ? { ...x, ten: e.target.value } : x)))}
              />
              <input
                className="inp"
                value={b.moTa}
                placeholder="Nhiệm vụ chính"
                onChange={(e) => setCacBan(cacBan.map((x, j) => (j === i ? { ...x, moTa: e.target.value } : x)))}
              />
              <button className="btn-ghost" onClick={() => setCacBan(cacBan.filter((_, j) => j !== i))}>
                Xoá
              </button>
            </li>
          ))}
        </ul>
        <button className="mt-2 text-sm text-navy-600 hover:underline" onClick={() => setCacBan([...cacBan, { ten: "", moTa: "" }])}>
          + Thêm ban
        </button>
      </section>

      <section className="card p-5">
        <h2 className="font-bold text-navy-800">Bài học kinh nghiệm</h2>
        <p className="text-sm text-slate-500">Ghi sau buổi họp rút kinh nghiệm — tự vào báo cáo tổng kết, kỳ sau đọc lại trước khi làm.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {vung("baiHocTot", "Làm tốt — giữ lại")}
          {vung("baiHocCaiThien", "Cần cải thiện kỳ sau")}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={luu} disabled={ban}>
          {ban ? "Đang lưu…" : "Lưu thông tin"}
        </button>
        {tb && <span className="text-sm text-slate-600">{tb}</span>}
      </div>

      <section>
        <h2 className="mb-2 font-bold text-navy-800">Các phiên</h2>
        <p className="mb-3 text-sm text-slate-500">
          Xác nhận và check-in tính riêng từng phiên (VD Tọa đàm · Lễ · Gala). Xoá phiên sẽ xoá luôn xác nhận / check-in của phiên đó.
        </p>
        <BangDuLieu bang="phien" chaId={eventId} dong={phien} sua khongDan tenXuat="phien" cot={["ten", "batDau", "diaDiem", "sucChua"]} />
      </section>

      <section className="card border border-do-200 p-5">
        <h2 className="font-bold text-do-700">Vùng nguy hiểm</h2>
        <p className="mt-1 text-sm text-slate-600">
          Gỡ sự kiện khỏi Trung tâm: xoá lớp tổ chức, giữ nguyên sự kiện ở mục “Sự kiện &amp; chương trình”, Ban tổ chức và nhà tài trợ.
          Điểm check-in của hội viên được tính lại.
        </p>
        <button className="btn-danger mt-3" onClick={goKhoiTrungTam}>
          Gỡ khỏi Trung tâm sự kiện
        </button>
      </section>
    </div>
  );
}
