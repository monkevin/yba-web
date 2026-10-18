"use client";

import { useActionState } from "react";
import AnhTaiLen from "@/components/AnhTaiLen";
import NhieuAnh from "@/components/NhieuAnh";
import { luuHoSo, type KetQua } from "./actions";

export type HoSoValues = {
  id: string;
  slug: string;
  code: string;
  company: string;
  name: string;
  categoryId: string | null;
  intro: string | null;
  description: string | null;
  offering: string | null;
  services: string | null;
  history: string | null;
  needing: string | null;
  capabilities: string | null;
  logo: string | null;
  coverImage: string | null;
  gallery: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  facebook: string | null;
  zalo: string | null;
  linkedin: string | null;
  youtube: string | null;
  videoUrl: string | null;
  taxCode: string | null;
  headcount: string | null;
  foundedYear: number | null;
  publicVisible: boolean;
};

export default function HoSoForm({
  hoSo,
  nganhNghe,
}: {
  hoSo: HoSoValues;
  nganhNghe: { id: string; name: string; icon: string | null }[];
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    luuHoSo,
    {}
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="memberId" value={hoSo.id} />

      {/* ── Ảnh nhận diện ─────────────────────────────────────── */}
      <fieldset className="card space-y-5 p-5">
        <legend className="px-1 text-sm font-bold uppercase tracking-wide text-navy-700">
          Hình ảnh nhận diện
        </legend>
        <AnhTaiLen
          name="logo"
          label="Logo doanh nghiệp"
          giaTriBanDau={hoSo.logo}
          goiY="Nền trong suốt (PNG) là đẹp nhất. Tối đa 5 MB."
        />
        <AnhTaiLen
          name="coverImage"
          label="Ảnh bìa hồ sơ"
          giaTriBanDau={hoSo.coverImage}
          tyLe="bia"
          goiY="Ảnh ngang, tỉ lệ khoảng 3:1 — ví dụ ảnh nhà xưởng, cửa hàng, đội ngũ."
        />
        <NhieuAnh
          name="gallery"
          label="Hình ảnh doanh nghiệp"
          giaTriBanDau={hoSo.gallery}
          toiDa={20}
        />
      </fieldset>

      {/* ── Giới thiệu ────────────────────────────────────────── */}
      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 text-sm font-bold uppercase tracking-wide text-navy-700">
          Giới thiệu doanh nghiệp
        </legend>

        <O
          label="Một câu giới thiệu ngắn"
          goiY="Câu này hiện trên thẻ ở danh bạ — viết ngắn, rõ doanh nghiệp làm gì."
        >
          <input
            name="intro"
            className="inp"
            maxLength={200}
            defaultValue={hoSo.intro ?? ""}
            placeholder="Ví dụ: Chuyên may vest nam cao cấp, phục vụ doanh nhân từ 2010."
          />
        </O>

        <O label="Giới thiệu đầy đủ" goiY="Cách một dòng trống để xuống đoạn mới.">
          <textarea
            name="description"
            rows={7}
            className="inp"
            defaultValue={hoSo.description ?? ""}
            placeholder="Lịch sử hình thành, thế mạnh, khách hàng tiêu biểu…"
          />
        </O>

        <O label="Ngành nghề">
          <select
            name="categoryId"
            className="inp"
            defaultValue={hoSo.categoryId ?? ""}
          >
            <option value="">— Chọn ngành nghề —</option>
            {nganhNghe.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </option>
            ))}
          </select>
        </O>

        <O
          label="Lịch sử hình thành & phát triển"
          goiY='Mỗi dòng một mốc, ghi theo dạng "2005 | Thành lập công ty tại Quận 6".'
        >
          <textarea
            name="history"
            rows={5}
            className="inp"
            defaultValue={hoSo.history ?? ""}
            placeholder={"2005 | Thành lập công ty\n2015 | Mở nhà máy thứ hai\n2024 | Đạt chứng nhận ISO"}
          />
        </O>

        <div className="grid gap-4 sm:grid-cols-2">
          <O
            label="Sản phẩm cung cấp"
            goiY="Mỗi dòng một sản phẩm — hồ sơ sẽ hiện thành danh sách."
          >
            <textarea
              name="offering"
              rows={5}
              className="inp"
              defaultValue={hoSo.offering ?? ""}
            />
          </O>
          <O
            label="Dịch vụ cung cấp"
            goiY="Mỗi dòng một dịch vụ — ví dụ: Tư vấn thiết kế, Bảo hành tận nơi."
          >
            <textarea
              name="services"
              rows={5}
              className="inp"
              defaultValue={hoSo.services ?? ""}
            />
          </O>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <O
            label="Đang tìm mua / tìm đối tác"
            goiY="Hội viên khác đọc mục này để biết có thể bán gì cho anh/chị."
          >
            <textarea
              name="needing"
              rows={5}
              className="inp"
              defaultValue={hoSo.needing ?? ""}
            />
          </O>
          <O
            label="Năng lực & chứng nhận"
            goiY="Mỗi dòng một ý — ví dụ: Chứng nhận ISO 9001:2015."
          >
            <textarea
              name="capabilities"
              rows={5}
              className="inp"
              defaultValue={hoSo.capabilities ?? ""}
            />
          </O>
        </div>
      </fieldset>

      {/* ── Liên hệ ───────────────────────────────────────────── */}
      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 text-sm font-bold uppercase tracking-wide text-navy-700">
          Thông tin liên hệ
        </legend>
        <p className="rounded-lg bg-navy-50 px-3 py-2 text-sm text-slate-600">
          Số điện thoại và email chỉ hiện với người đã đăng nhập, khách vãng lai
          không xem được.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <O label="Điện thoại">
            <input name="phone" className="inp" defaultValue={hoSo.phone ?? ""} />
          </O>
          <O label="Email">
            <input
              name="email"
              type="email"
              className="inp"
              defaultValue={hoSo.email ?? ""}
            />
          </O>
          <O label="Website">
            <input
              name="website"
              className="inp"
              defaultValue={hoSo.website ?? ""}
              placeholder="monamie.vn"
            />
          </O>
          <O label="Địa chỉ">
            <input name="address" className="inp" defaultValue={hoSo.address ?? ""} />
          </O>
          <O
            label="Fanpage Facebook"
            goiY="Dán địa chỉ fanpage doanh nghiệp, ví dụ facebook.com/tencongty. Bài đăng mới nhất sẽ tự hiện ở cuối hồ sơ công khai."
          >
            <input
              name="facebook"
              className="inp"
              defaultValue={hoSo.facebook ?? ""}
              placeholder="facebook.com/tencongty"
            />
          </O>
          <O label="Zalo">
            <input name="zalo" className="inp" defaultValue={hoSo.zalo ?? ""} />
          </O>
          <O label="LinkedIn">
            <input name="linkedin" className="inp" defaultValue={hoSo.linkedin ?? ""} />
          </O>
          <O label="YouTube">
            <input name="youtube" className="inp" defaultValue={hoSo.youtube ?? ""} />
          </O>
          <O label="Video giới thiệu" goiY="Dán đường dẫn YouTube hoặc Facebook.">
            <input name="videoUrl" className="inp" defaultValue={hoSo.videoUrl ?? ""} />
          </O>
        </div>
      </fieldset>

      {/* ── Thông tin chung ───────────────────────────────────── */}
      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 text-sm font-bold uppercase tracking-wide text-navy-700">
          Thông tin chung
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <O label="Năm thành lập">
            <input
              name="foundedYear"
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              className="inp"
              defaultValue={hoSo.foundedYear ?? ""}
            />
          </O>
          <O label="Số nhân viên">
            <input
              name="headcount"
              className="inp"
              defaultValue={hoSo.headcount ?? ""}
              placeholder="Ví dụ: 50 hoặc 10-20"
            />
          </O>
          <O label="Mã số thuế">
            <input name="taxCode" className="inp" defaultValue={hoSo.taxCode ?? ""} />
          </O>
        </div>

        <label className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-3">
          <input
            type="checkbox"
            name="publicVisible"
            defaultChecked={hoSo.publicVisible}
            className="mt-0.5 h-4 w-4"
          />
          <span className="text-sm">
            <strong className="text-navy-800">
              Cho hiển thị hồ sơ trên danh bạ công khai
            </strong>
            <span className="mt-0.5 block text-slate-600">
              Bỏ chọn nếu anh/chị chưa muốn doanh nghiệp xuất hiện trên
              ybacholon.vn.
            </span>
          </span>
        </label>
      </fieldset>

      {/* ── Nút lưu ───────────────────────────────────────────── */}
      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-navy-100 bg-white/95 py-3 backdrop-blur">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Đang lưu..." : "Lưu hồ sơ"}
        </button>
        <a
          href={`/doanh-nghiep/${hoSo.slug}`}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost"
        >
          Xem hồ sơ công khai ↗
        </a>
        {state.error && <p className="text-sm font-medium text-do-600">{state.error}</p>}
        {state.ok && (
          <p className="text-sm font-medium text-emerald-700">{state.message}</p>
        )}
      </div>
    </form>
  );
}

/** Một ô nhập kèm nhãn và ghi chú hướng dẫn. */
function O({
  label,
  goiY,
  children,
}: {
  label: string;
  goiY?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="lbl">{label}</span>
      {children}
      {goiY && <span className="mt-1 block text-xs text-slate-500">{goiY}</span>}
    </label>
  );
}
