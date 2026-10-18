"use client";

import { useActionState, useState } from "react";
import AnhTaiLen from "@/components/AnhTaiLen";
import { BO_MAU, type CauHinhGiaoDien } from "@/lib/giao-dien";
import { luuGiaoDien, type KetQua } from "./actions";

export default function GiaoDienForm({ gd }: { gd: CauHinhGiaoDien }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    luuGiaoDien,
    {}
  );
  const [mau, setMau] = useState(gd.mau);
  const boDangChon = BO_MAU.find((b) => b.ma === mau) ?? BO_MAU[0];

  return (
    <form action={formAction} className="space-y-5">
      {/* ── Banner trang chủ ──────────────────────────────────── */}
      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 text-sm font-bold uppercase tracking-wide text-navy-700">
          Banner trang chủ
        </legend>

        <AnhTaiLen
          name="banner"
          label="Ảnh nền banner"
          giaTriBanDau={gd.banner}
          tyLe="bia"
          goiY="Ảnh ngang, tối thiểu 2000×860. Nên chọn ảnh sự kiện đông người, có phông YBA. Ảnh sẽ được phủ lớp tối để chữ đọc rõ."
        />

        <label className="block">
          <span className="lbl">Tiêu đề lớn *</span>
          <input
            name="bannerTieuDe"
            className="inp"
            required
            defaultValue={gd.bannerTieuDe}
          />
        </label>

        <label className="block">
          <span className="lbl">Câu slogan (chữ đỏ dưới tiêu đề)</span>
          <input name="slogan" className="inp" defaultValue={gd.slogan} />
        </label>

        <label className="block">
          <span className="lbl">Đoạn mô tả</span>
          <textarea
            name="bannerMoTa"
            rows={3}
            className="inp"
            defaultValue={gd.bannerMoTa}
          />
        </label>
      </fieldset>

      {/* ── Màu chủ đạo ───────────────────────────────────────── */}
      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 text-sm font-bold uppercase tracking-wide text-navy-700">
          Màu chủ đạo
        </legend>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BO_MAU.map((b) => (
            <label
              key={b.ma}
              className={`cursor-pointer rounded-xl p-4 ring-1 transition ${
                mau === b.ma ? "bg-navy-50 ring-navy-400" : "bg-white ring-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="mau"
                value={b.ma}
                checked={mau === b.ma}
                onChange={() => setMau(b.ma)}
                className="sr-only"
              />
              <span className="flex items-center gap-2">
                <span
                  className="h-7 w-7 rounded-lg ring-1 ring-black/10"
                  style={{ background: b.chinh }}
                />
                <span
                  className="h-7 w-7 rounded-lg ring-1 ring-black/10"
                  style={{ background: b.nhan }}
                />
                <span className="font-bold text-navy-800">{b.ten}</span>
              </span>
              <span className="mt-2 block text-sm leading-relaxed text-slate-600">
                {b.mo}
              </span>
            </label>
          ))}
        </div>

        {/* Xem trước ngay tại chỗ, không phải mở trang khác */}
        <div className="rounded-xl p-5" style={{ background: boDangChon.chinh }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#fff", opacity: 0.7 }}>
            Xem trước
          </p>
          <p className="mt-1 text-xl font-extrabold text-white">
            Chi hội Doanh nhân trẻ Chợ Lớn
          </p>
          <p className="mt-1 font-semibold" style={{ color: boDangChon.nhan, filter: "brightness(1.7)" }}>
            {gd.slogan}
          </p>
          <span
            className="mt-3 inline-block rounded-full px-5 py-2 text-sm font-semibold text-white"
            style={{ background: boDangChon.nhan }}
          >
            Nút hành động
          </span>
        </div>
      </fieldset>

      {/* ── Nhận diện & liên hệ ───────────────────────────────── */}
      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 text-sm font-bold uppercase tracking-wide text-navy-700">
          Nhận diện &amp; thông tin liên hệ
        </legend>

        <AnhTaiLen
          name="logo"
          label="Logo Chi hội"
          giaTriBanDau={gd.logo}
          goiY="PNG nền trong suốt, vuông. Hiện ở đầu trang, chân trang và trang đăng nhập."
        />

        <AnhTaiLen
          name="kv"
          label="KV — huy hiệu tròn của Chi hội"
          giaTriBanDau={gd.kv}
          goiY="Hình tròn nền trong suốt (PNG), cạnh tối thiểu 800px. Hiện ở đầu trang chủ, có quầng sáng và vệt loé quanh viền. Bỏ trống thì khối này không hiện."
        />

        <AnhTaiLen
          name="biaHoSo"
          label="Ảnh bìa chung cho hồ sơ doanh nghiệp"
          giaTriBanDau={gd.biaHoSo}
          tyLe="bia"
          goiY="Dùng cho hội viên chưa tự tải ảnh bìa riêng. Bỏ trống thì mỗi hồ sơ tự dựng một dải nhận diện theo tên doanh nghiệp."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="lbl">Hotline</span>
            <input name="hotline" className="inp" defaultValue={gd.hotline} />
          </label>
          <label className="block">
            <span className="lbl">Email</span>
            <input name="email" className="inp" defaultValue={gd.email} />
          </label>
        </div>

        <label className="block">
          <span className="lbl">Địa chỉ</span>
          <input name="diaChi" className="inp" defaultValue={gd.diaChi} />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="lbl">Fanpage Chi hội</span>
            <input name="facebook" className="inp" defaultValue={gd.facebook} />
          </label>
          <label className="block">
            <span className="lbl">Fanpage Hội (YBA HCM)</span>
            <input name="facebookHoi" className="inp" defaultValue={gd.facebookHoi} />
          </label>
        </div>
      </fieldset>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-navy-100 bg-white/95 py-3 backdrop-blur">
        <button disabled={pending} className="btn-primary">
          {pending ? "Đang lưu..." : "Lưu giao diện"}
        </button>
        <a href="/" target="_blank" rel="noreferrer" className="btn-ghost">
          Xem trang chủ ↗
        </a>
        {state.error && <p className="text-sm font-medium text-do-600">{state.error}</p>}
        {state.ok && (
          <p className="text-sm font-medium text-emerald-700">{state.message}</p>
        )}
      </div>
    </form>
  );
}
