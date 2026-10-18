"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import NhieuAnh from "@/components/NhieuAnh";
import { LOAI_TIN } from "@/lib/listing";
import { luuTin, type KetQua } from "./actions";

export type TinValues = {
  id?: string;
  type?: string;
  title?: string;
  summary?: string | null;
  description?: string | null;
  categoryId?: string | null;
  images?: string | null;
  priceText?: string | null;
  quantity?: string | null;
  location?: string | null;
  slug?: string;
};

export default function TinForm({
  tin,
  nganhNghe,
  khuVucMacDinh,
}: {
  tin?: TinValues;
  nganhNghe: { id: string; name: string; icon: string | null }[];
  khuVucMacDinh?: string | null;
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    luuTin,
    {}
  );
  const [loai, setLoai] = useState(tin?.type ?? LOAI_TIN.CAN_BAN);

  const canMua = loai === LOAI_TIN.CAN_MUA;

  return (
    <form action={formAction} className="space-y-5">
      {tin?.id && <input type="hidden" name="id" value={tin.id} />}

      {/* ── Loại tin ──────────────────────────────────────────── */}
      <fieldset className="card p-5">
        <legend className="px-1 text-sm font-bold uppercase tracking-wide text-navy-700">
          Anh/chị muốn đăng gì?
        </legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {[
            {
              value: LOAI_TIN.CAN_BAN,
              icon: "📢",
              title: "Cần bán · chào hàng",
              desc: "Giới thiệu sản phẩm, dịch vụ doanh nghiệp đang cung cấp để tìm khách hàng.",
            },
            {
              value: LOAI_TIN.CAN_MUA,
              icon: "🔎",
              title: "Cần mua · tìm nguồn",
              desc: "Nêu thứ doanh nghiệp đang cần mua để hội viên khác chào hàng lại.",
            },
          ].map((o) => (
            <label
              key={o.value}
              className={`cursor-pointer rounded-xl p-4 ring-1 transition ${
                loai === o.value
                  ? "bg-navy-50 ring-navy-400"
                  : "bg-white ring-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="type"
                value={o.value}
                checked={loai === o.value}
                onChange={() => setLoai(o.value)}
                className="sr-only"
              />
              <span className="text-2xl">{o.icon}</span>
              <span className="mt-1.5 block font-bold text-navy-800">{o.title}</span>
              <span className="mt-1 block text-sm leading-relaxed text-slate-600">
                {o.desc}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* ── Nội dung tin ──────────────────────────────────────── */}
      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 text-sm font-bold uppercase tracking-wide text-navy-700">
          Nội dung tin
        </legend>

        <label className="block">
          <span className="lbl">Tiêu đề *</span>
          <input
            name="title"
            className="inp"
            required
            minLength={10}
            maxLength={150}
            defaultValue={tin?.title ?? ""}
            placeholder={
              canMua
                ? "Ví dụ: Cần tìm nhà cung cấp vải suit nhập khẩu ổn định"
                : "Ví dụ: Nhận gia công may đồng phục doanh nghiệp số lượng lớn"
            }
          />
          <span className="mt-1 block text-xs text-slate-500">
            Viết như một câu rao — người đọc lướt qua là hiểu ngay.
          </span>
        </label>

        <label className="block">
          <span className="lbl">Mô tả chi tiết *</span>
          <textarea
            name="description"
            rows={8}
            className="inp"
            required
            minLength={30}
            defaultValue={tin?.description ?? ""}
            placeholder={
              canMua
                ? "Quy cách, số lượng, thời gian cần hàng, tiêu chuẩn chất lượng, điều kiện thanh toán…"
                : "Sản phẩm/dịch vụ cụ thể, năng lực cung ứng, thời gian giao, chính sách cho hội viên…"
            }
          />
        </label>

        <label className="block">
          <span className="lbl">Ngành nghề</span>
          <select
            name="categoryId"
            className="inp"
            defaultValue={tin?.categoryId ?? ""}
          >
            <option value="">— Chọn ngành nghề —</option>
            {nganhNghe.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-slate-500">
            Chọn đúng ngành để tin xuất hiện khi người khác lọc theo ngành đó.
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="lbl">Giá</span>
            <input
              name="priceText"
              className="inp"
              defaultValue={tin?.priceText ?? ""}
              placeholder="Thoả thuận"
            />
          </label>
          <label className="block">
            <span className="lbl">Số lượng</span>
            <input
              name="quantity"
              className="inp"
              defaultValue={tin?.quantity ?? ""}
              placeholder="Ví dụ: 2 container/tháng"
            />
          </label>
          <label className="block">
            <span className="lbl">Khu vực</span>
            <input
              name="location"
              className="inp"
              defaultValue={tin?.location ?? khuVucMacDinh ?? ""}
              placeholder="Ví dụ: Phường Bình Tây, TP.HCM"
            />
          </label>
        </div>

        <NhieuAnh name="images" label="Ảnh minh hoạ" giaTriBanDau={tin?.images} />
      </fieldset>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-navy-100 bg-white/95 py-3 backdrop-blur">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Đang lưu..." : tin?.id ? "Lưu tin" : "Đăng tin"}
        </button>
        <Link href="/tai-khoan/tin-dang" className="btn-ghost">
          Huỷ
        </Link>
        {tin?.slug && (
          <a
            href={`/giao-thuong/${tin.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-navy-600 hover:underline"
          >
            Xem tin trên chợ ↗
          </a>
        )}
        {state.error && <p className="text-sm font-medium text-do-600">{state.error}</p>}
        {state.ok && (
          <p className="text-sm font-medium text-emerald-700">{state.message}</p>
        )}
      </div>
    </form>
  );
}
