"use client";

import { useActionState, useState } from "react";
import {
  dangKyHoatDong,
  type KetQuaDangKy,
} from "../../(web)/lich-hoat-dong/actions";

const VANG_DAM = "#b45309";

const PHIEN = [
  { ma: "TOA_DAM", ten: "Tọa đàm", gio: "14:30 – 16:30", phi: 0 },
  { ma: "CHUYEN_GIAO", ten: "Lễ chuyển giao", gio: "16:30 – 17:30", phi: 0 },
  { ma: "GALA", ten: "Gala Dinner", gio: "18:00 – 21:30", phi: 1_100_000 },
];

/** Phí Gala cho khách ĐĂNG KÝ NGOÀI danh sách mời — Chủ nhiệm chốt 23/09.
 *  Khách MỜI (có thiệp) miễn phí toàn bộ, không liên quan form này. */
const PHI_GALA = 1_100_000;

/**
 * Form ② ĐĂNG KÝ THAM DỰ của landing 10/10 — dành cho người CHƯA có thư
 * mời: chọn phiên (Gala có phí 1.100.000đ/người cho khách ngoài danh sách),
 * BTC xét và liên hệ. Nộp vào action đăng ký lịch hoạt động, đăng ký chảy
 * về /quan-tri/lich-hoat-dong + trung tâm sự kiện.
 */
export default function FormThamDu({ lichId }: { lichId: string }) {
  const [state, formAction, pending] = useActionState<KetQuaDangKy, FormData>(
    dangKyHoatDong,
    {}
  );
  const [chonGala, setChonGala] = useState(true);
  const [soNguoi, setSoNguoi] = useState(1);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-amber-300/60 bg-white/95 p-8 text-center shadow-xl">
        <span className="text-4xl">🎉</span>
        <h3 className="mt-3 text-lg font-bold text-[#1b274d]">
          Đã ghi nhận đăng ký của anh/chị
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
          {state.ok} Ban Tổ chức sẽ liên hệ xác nhận qua số điện thoại anh/chị
          vừa để lại{chonGala ? " và hướng dẫn đóng phí tham dự Gala" : ""}.
        </p>
      </div>
    );
  }

  const lopO =
    "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base text-[#1b274d] placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 sm:text-sm";
  const lopNhan = "mb-1 block text-sm font-semibold text-[#1b274d]";
  const tamTinh = chonGala ? PHI_GALA * Math.max(1, soNguoi) : 0;

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-amber-300/60 bg-white/95 p-6 shadow-xl sm:p-8"
    >
      <input type="hidden" name="lichId" value={lichId} />
      <input type="hidden" name="loai" value="THAM_GIA" />

      {/* Chọn phiên tham dự */}
      <p className={lopNhan}>
        Anh/chị đăng ký tham dự phiên nào? <span className="text-red-600">*</span>
      </p>
      <div className="space-y-2">
        {PHIEN.map((p) => (
          <label
            key={p.ma}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition hover:bg-amber-50 has-[:checked]:border-amber-400 has-[:checked]:bg-amber-50"
          >
            <input
              type="checkbox"
              name="phien"
              value={p.ma}
              defaultChecked
              onChange={(e) => {
                if (p.ma === "GALA") setChonGala(e.currentTarget.checked);
              }}
              className="h-4 w-4 accent-amber-600"
            />
            <span className="text-sm font-semibold text-[#1b274d]">{p.ten}</span>
            <span className="ml-auto text-xs font-medium text-slate-500">{p.gio}</span>
            <span
              className="w-24 text-right text-xs font-bold"
              style={{ color: p.phi ? VANG_DAM : "#059669" }}
            >
              {p.phi ? p.phi.toLocaleString("vi-VN") + "đ/người" : "Miễn phí"}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        Phí Gala Dinner {PHI_GALA.toLocaleString("vi-VN")}đ/người áp dụng cho
        khách đăng ký ngoài danh sách mời của Ban Tổ chức; Tọa đàm và Lễ
        chuyển giao miễn phí.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="td-ten" className={lopNhan}>
            Họ và tên <span className="text-red-600">*</span>
          </label>
          <input
            id="td-ten"
            name="name"
            required
            autoComplete="name"
            className={lopO}
            placeholder="Nguyễn Văn A"
          />
        </div>
        <div>
          <label htmlFor="td-sdt" className={lopNhan}>
            Số điện thoại <span className="text-red-600">*</span>
          </label>
          <input
            id="td-sdt"
            name="phone"
            required
            inputMode="tel"
            autoComplete="tel"
            className={lopO}
            placeholder="09xx xxx xxx"
          />
        </div>
        <div>
          <label htmlFor="td-dv" className={lopNhan}>
            Doanh nghiệp / đơn vị
          </label>
          <input
            id="td-dv"
            name="company"
            autoComplete="organization"
            className={lopO}
            placeholder="Tên công ty hoặc tổ chức"
          />
        </div>
        <div>
          <label htmlFor="td-cv" className={lopNhan}>
            Chức danh
          </label>
          <input
            id="td-cv"
            name="chucVu"
            autoComplete="organization-title"
            className={lopO}
            placeholder="CEO, Giám đốc…"
          />
        </div>
        <div>
          <label htmlFor="td-email" className={lopNhan}>
            Email
          </label>
          <input
            id="td-email"
            name="email"
            type="email"
            autoComplete="email"
            className={lopO}
            placeholder="ten@congty.vn"
          />
        </div>
        <div>
          <label htmlFor="td-so" className={lopNhan}>
            Số người tham dự
          </label>
          <input
            id="td-so"
            name="soNguoi"
            type="number"
            min={1}
            max={50}
            value={soNguoi}
            onChange={(e) => setSoNguoi(Number(e.currentTarget.value) || 1)}
            className={lopO}
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="td-ghichu" className={lopNhan}>
          Ghi chú cho Ban Tổ chức
        </label>
        <textarea
          id="td-ghichu"
          name="ghiChu"
          rows={2}
          className={lopO}
          placeholder="Ví dụ: đi cùng phu nhân, cần chỗ đậu ô tô…"
        />
      </div>

      {chonGala && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-[#1b274d]">
          Tạm tính phí Gala: <b>{soNguoi} người × {PHI_GALA.toLocaleString("vi-VN")}đ = {tamTinh.toLocaleString("vi-VN")}đ</b>
          <span className="block text-xs text-slate-600">
            Ban Tổ chức sẽ hướng dẫn thanh toán khi gọi xác nhận — chưa cần
            chuyển khoản ngay.
          </span>
        </div>
      )}

      {state.error && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-base font-bold text-[#1b274d] shadow-lg transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-60"
      >
        {pending ? "Đang gửi đăng ký…" : "Đăng ký tham dự"}
      </button>
      <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">
        Thông tin chỉ dùng cho việc đón tiếp của Ban Tổ chức, không hiện công
        khai trên website.
      </p>
    </form>
  );
}
