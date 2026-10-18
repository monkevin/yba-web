"use client";

import { useActionState, useState } from "react";
import {
  dangKyHoatDong,
  type KetQuaDangKy,
} from "../../(web)/lich-hoat-dong/actions";

const VANG = "#e3b94a";

/** Các gói theo đúng biểu mẫu BTC — Chính & Kim cương đã đủ nhà tài trợ. */
const GOI = [
  { ten: "Tài trợ Vàng", trieu: 30, gia: "30.000.000đ" },
  { ten: "Tài trợ Bạc", trieu: 20, gia: "20.000.000đ" },
  { ten: "Tài trợ Đồng", trieu: 10, gia: "10.000.000đ" },
  { ten: "Tài trợ Đồng hành", trieu: 5, gia: "5.000.000đ" },
];
const GOI_KHAC = [
  { ten: "Quà tặng / sản phẩm / voucher", trieu: 0 },
  { ten: "Dịch vụ / hiện vật khác", trieu: 0 },
  { ten: "Muốn BTC liên hệ trao đổi thêm", trieu: 0 },
];

/**
 * Đăng ký tài trợ NGAY TRÊN LANDING (Chủ nhiệm chốt 22/09: "click vào gói
 * được luôn"): bấm gói → form ngắn mở ngay dưới, gói đã chọn sẵn → gửi.
 * Nộp vào đúng action đăng ký lịch hoạt động (loai TAI_TRO) nên đăng ký
 * chảy về /quan-tri/lich-hoat-dong cùng chỗ BTC duyệt tham dự.
 */
export default function DangKyTaiTro({ lichId }: { lichId: string }) {
  const [state, formAction, pending] = useActionState<KetQuaDangKy, FormData>(
    dangKyHoatDong,
    {}
  );
  const [goi, setGoi] = useState<{ ten: string; trieu: number } | null>(null);

  if (state.ok) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-300/60 bg-white/10 p-8 text-center backdrop-blur">
        <span className="text-4xl">🤝</span>
        <h3 className="mt-3 text-lg font-bold" style={{ color: VANG }}>
          Đã nhận đăng ký {goi?.ten ?? "tài trợ"}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/85">
          {state.ok}
        </p>
      </div>
    );
  }

  const lopO =
    "w-full rounded-lg border border-white/30 bg-white/10 px-3.5 py-2.5 text-base text-white placeholder:text-white/40 focus:border-amber-400 focus:outline-none sm:text-sm";

  return (
    <div>
      {/* Bấm gói là chọn */}
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        {GOI.map((g) => (
          <button
            key={g.ten}
            type="button"
            onClick={() => setGoi({ ten: g.ten, trieu: g.trieu })}
            className={`the-sang rounded-2xl border p-4 text-center transition ${
              goi?.ten === g.ten
                ? "border-amber-400 bg-amber-400/20 ring-2 ring-amber-400/60"
                : "border-amber-300/40 bg-white/5 hover:bg-white/10"
            }`}
          >
            <p className="text-sm font-bold text-white">{g.ten}</p>
            <p className="mt-1 text-lg font-extrabold" style={{ color: VANG }}>
              {g.gia}
            </p>
            <p className="mt-1 text-xs font-semibold" style={{ color: VANG }}>
              {goi?.ten === g.ten ? "✓ Đang chọn" : "Chọn gói này"}
            </p>
          </button>
        ))}
      </div>
      <div className="mx-auto mt-3 flex max-w-3xl flex-wrap justify-center gap-2">
        {GOI_KHAC.map((g) => (
          <button
            key={g.ten}
            type="button"
            onClick={() => setGoi({ ten: g.ten, trieu: 0 })}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              goi?.ten === g.ten
                ? "border-amber-400 bg-amber-400/20 text-white"
                : "border-white/30 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            {goi?.ten === g.ten ? "✓ " : ""}
            {g.ten}
          </button>
        ))}
      </div>

      {/* Bấm gói xong form hiện ngay dưới, gói điền sẵn */}
      {goi && (
        <form
          action={formAction}
          className="mx-auto mt-6 max-w-xl rounded-2xl border border-amber-300/50 bg-white/10 p-6 backdrop-blur"
        >
          <input type="hidden" name="lichId" value={lichId} />
          <input type="hidden" name="loai" value="TAI_TRO" />
          <input type="hidden" name="mucTaiTro" value={goi.ten} />
          {/* action đọc soTien theo TRIỆU đồng */}
          <input type="hidden" name="soTien" value={goi.trieu || ""} />

          <p className="text-center text-sm font-bold" style={{ color: VANG }}>
            Đăng ký: {goi.ten}
            {goi.trieu ? ` · ${goi.trieu} triệu đồng` : ""}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input name="name" required placeholder="Họ và tên *" autoComplete="name" className={lopO} />
            <input name="phone" required inputMode="tel" placeholder="Số điện thoại *" autoComplete="tel" className={lopO} />
            <input name="company" placeholder="Doanh nghiệp / thương hiệu" autoComplete="organization" className={`${lopO} sm:col-span-2`} />
            <input name="email" type="email" placeholder="Email" autoComplete="email" className={`${lopO} sm:col-span-2`} />
            <input
              name={goi.trieu ? "ghiChu" : "hienVat"}
              placeholder={
                goi.trieu
                  ? "Lời nhắn cho Ban Tổ chức (không bắt buộc)"
                  : "Mô tả quà / sản phẩm / dịch vụ dự kiến"
              }
              className={`${lopO} sm:col-span-2`}
            />
          </div>

          {state.error && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-300">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-4 w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-base font-bold text-[#1b274d] shadow-lg transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-60"
          >
            {pending ? "Đang gửi…" : `Gửi đăng ký ${goi.ten}`}
          </button>
          <p className="mt-2 text-center text-xs text-white/55">
            Ban Tổ chức sẽ gọi xác nhận và gửi hợp đồng/quyền lợi chi tiết.
          </p>
        </form>
      )}
    </div>
  );
}
