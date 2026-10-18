"use client";

import { useActionState, useState } from "react";
import { MUC_DICH_DAU_GIA } from "./muc-dich";
import {
  anHotDeal,
  dangHotDeal,
  dangUuDaiDN,
  quanTamHotDeal,
  quanTamUuDai,
  taoDauGia,
  traGia,
  type KetQuaUD,
} from "./actions";

function ThongBao({ state }: { state: KetQuaUD }) {
  if (state.error)
    return <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">{state.error}</p>;
  if (state.ok)
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.ok}</p>
    );
  return null;
}

const lopNhan = "lbl";

/** Form hội viên tự đăng ưu đãi doanh nghiệp. */
export function FormUuDaiDN() {
  const [state, formAction, pending] = useActionState<KetQuaUD, FormData>(dangUuDaiDN, {});
  return (
    <form action={formAction} className="card space-y-3 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={lopNhan}>Sản phẩm / dịch vụ ưu đãi *</span>
          <input name="title" required className="inp" placeholder="vd: May đo vest cao cấp" />
        </label>
        <label className="block">
          <span className={lopNhan}>Giá trị ưu đãi *</span>
          <input name="mucUuDai" required className="inp" placeholder="vd: Giảm 20% cho hội viên" />
        </label>
        <label className="block">
          <span className={lopNhan}>Đối tượng áp dụng</span>
          <input name="dieuKien" className="inp" placeholder="vd: Hội viên YBA Chợ Lớn + người thân" />
        </label>
        <label className="block">
          <span className={lopNhan}>Áp dụng từ</span>
          <input name="startAt" type="date" className="inp" />
        </label>
        <label className="block">
          <span className={lopNhan}>Đến hết ngày</span>
          <input name="expiresAt" type="date" className="inp" />
        </label>
        <label className="block sm:col-span-2">
          <span className={lopNhan}>Mô tả thêm</span>
          <textarea name="summary" rows={2} className="inp" placeholder="Cách nhận ưu đãi, liên hệ…" />
        </label>
      </div>
      <ThongBao state={state} />
      <button disabled={pending} className="btn-primary">
        {pending ? "Đang đăng…" : "Đăng ưu đãi"}
      </button>
    </form>
  );
}

/** Form đăng Hot Deal cá nhân. */
export function FormHotDealCaNhan() {
  const [state, formAction, pending] = useActionState<KetQuaUD, FormData>(dangHotDeal, {});
  return (
    <form action={formAction} className="card space-y-3 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={lopNhan}>Món đồ *</span>
          <input name="tieuDe" required className="inp" placeholder="vd: Đồng hồ Longines còn tốt, ít dùng" />
        </label>
        <label className="block">
          <span className={lopNhan}>Giá mua ban đầu (VNĐ)</span>
          <input name="giaGoc" inputMode="numeric" className="inp" placeholder="20.000.000" />
        </label>
        <label className="block">
          <span className={lopNhan}>Giá ưu tiên hội viên (VNĐ) *</span>
          <input name="giaHV" required inputMode="numeric" className="inp" placeholder="2.000.000" />
        </label>
        <label className="block">
          <span className={lopNhan}>Liên hệ chốt (SĐT/Zalo) *</span>
          <input name="lienHe" required className="inp" placeholder="09xx xxx xxx" />
        </label>
        <label className="block">
          <span className={lopNhan}>Hạn đăng đến</span>
          <input name="denNgay" type="date" className="inp" />
        </label>
        <label className="block sm:col-span-2">
          <span className={lopNhan}>Mô tả tình trạng</span>
          <textarea name="moTa" rows={2} className="inp" placeholder="Còn 95%, đủ hộp sổ…" />
        </label>
      </div>
      <p className="text-xs text-slate-500">
        Anh/chị toàn quyền quyết định bán hay không — web chỉ niêm yết và báo
        ai đang quan tâm.
      </p>
      <ThongBao state={state} />
      <button disabled={pending} className="btn-primary">
        {pending ? "Đang đăng…" : "Đăng Hot Deal"}
      </button>
    </form>
  );
}

/**
 * Form BTC mở phiên đấu giá — chọn mục đích (thiện nguyện / gây quỹ Chi
 * hội / cá nhân trích %), gắn sự kiện, và bật công khai lên /dau-gia.
 */
export function FormDauGia({
  suKien = [],
}: {
  suKien?: { slug: string; tieuDe: string }[];
}) {
  const [state, formAction, pending] = useActionState<KetQuaUD, FormData>(taoDauGia, {});
  const [mucDich, setMucDich] = useState("THIEN_NGUYEN");
  return (
    <form action={formAction} className="card space-y-3 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={lopNhan}>Vật phẩm đấu giá *</span>
          <input name="tieuDe" required className="inp" placeholder="vd: 10 bộ vest Mon Amie may đo" />
        </label>
        <label className="block">
          <span className={lopNhan}>Mục đích phiên *</span>
          <select
            name="mucDich"
            className="inp"
            value={mucDich}
            onChange={(e) => setMucDich(e.target.value)}
          >
            {Object.entries(MUC_DICH_DAU_GIA).map(([ma, ten]) => (
              <option key={ma} value={ma}>
                {ten}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={lopNhan}>
            {mucDich === "CA_NHAN"
              ? "Người hưởng / ghi chú"
              : mucDich === "QUY_CHI_HOI"
                ? "Ghi chú (không bắt buộc)"
                : "Dự án / nội dung thiện nguyện *"}
          </span>
          <input
            name="mucDichGhiChu"
            className="inp"
            required={mucDich === "THIEN_NGUYEN"}
            placeholder={
              mucDich === "CA_NHAN"
                ? "vd: Đồng hồ của anh X"
                : "vd: Nhịp Cầu Doanh Nhân — nước sạch A Dơi"
            }
          />
        </label>
        {mucDich === "CA_NHAN" && (
          <label className="block">
            <span className={lopNhan}>% trích lại cho Chi hội *</span>
            <input
              name="trichPhanTram"
              type="number"
              min={0}
              max={100}
              required
              className="inp"
              placeholder="vd: 30"
            />
          </label>
        )}
        <label className="block">
          <span className={lopNhan}>Gắn với sự kiện</span>
          <select name="suKienSlug" className="inp" defaultValue="">
            <option value="">(Không gắn sự kiện)</option>
            {suKien.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.tieuDe}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={lopNhan}>Giá khởi điểm (VNĐ) *</span>
          <input name="giaKhoiDiem" required inputMode="numeric" className="inp" placeholder="5.000.000" />
        </label>
        <label className="block">
          <span className={lopNhan}>Bước giá tối thiểu (VNĐ) *</span>
          <input name="buocGia" required inputMode="numeric" className="inp" placeholder="500.000" />
        </label>
        <label className="block">
          <span className={lopNhan}>Kết thúc lúc *</span>
          <input name="denNgay" type="datetime-local" required className="inp" />
        </label>
        <label className="block">
          <span className={lopNhan}>Liên hệ BTC</span>
          <input name="lienHe" className="inp" placeholder="Anh Doãn San — 0909 311 458" />
        </label>
        <label className="block sm:col-span-2">
          <span className={lopNhan}>Mô tả</span>
          <textarea name="moTa" rows={2} className="inp" placeholder="Toàn bộ số tiền về quỹ Nhịp Cầu Doanh Nhân…" />
        </label>
      </div>
      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-navy-50 px-4 py-3">
        <input type="checkbox" name="congKhai" value="1" defaultChecked className="mt-0.5 h-4 w-4" />
        <span className="text-sm leading-relaxed text-slate-700">
          <b className="text-navy-800">Công khai trên website (/dau-gia)</b> —
          ai cũng xem được diễn biến để lan toả; trả giá vẫn là đặc quyền hội
          viên đăng nhập.
        </span>
      </label>
      <ThongBao state={state} />
      <button disabled={pending} className="btn-primary">
        {pending ? "Đang mở…" : "Mở phiên đấu giá"}
      </button>
    </form>
  );
}

/** Nút "Tôi quan tâm" — dùng cho cả ưu đãi DN (loai="dn") và Hot Deal. */
export function NutQuanTam({
  id,
  loai,
  daQuanTam,
  soQuanTam,
}: {
  id: string;
  loai: "dn" | "deal";
  daQuanTam: boolean;
  soQuanTam: number;
}) {
  const [state, formAction, pending] = useActionState<KetQuaUD, FormData>(
    loai === "dn" ? quanTamUuDai : quanTamHotDeal,
    {}
  );
  return (
    <form action={formAction} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="id" value={id} />
      <button
        disabled={pending}
        className={`rounded-full px-4 py-2 text-sm font-bold transition ${
          daQuanTam
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-do-600 text-white hover:bg-do-700"
        }`}
      >
        {pending ? "…" : daQuanTam ? "✓ Đang quan tâm" : "🤝 Tôi quan tâm"}
        {soQuanTam > 0 ? ` (${soQuanTam})` : ""}
      </button>
      {state.error && <span className="text-xs text-do-600">{state.error}</span>}
    </form>
  );
}

/** Ô trả giá trong phiên đấu giá. */
export function FormTraGia({ id, toiThieu }: { id: string; toiThieu: number }) {
  const [state, formAction, pending] = useActionState<KetQuaUD, FormData>(traGia, {});
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex gap-2">
        <input
          name="soTien"
          inputMode="numeric"
          required
          className="inp flex-1"
          placeholder={`Tối thiểu ${toiThieu.toLocaleString("vi-VN")}đ`}
        />
        <button disabled={pending} className="btn-primary shrink-0">
          {pending ? "…" : "Trả giá"}
        </button>
      </div>
      <ThongBao state={state} />
    </form>
  );
}

/** Ẩn / hiện deal của mình (hoặc của Ban kiểm soát). */
export function NutAnDeal({ id, dangAn }: { id: string; dangAn: boolean }) {
  const [state, formAction, pending] = useActionState<KetQuaUD, FormData>(anHotDeal, {});
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="text-xs text-slate-400 underline hover:text-do-600">
        {pending ? "…" : dangAn ? "Hiện lại" : "Ẩn tin"}
      </button>
      {state.error && <span className="ml-1 text-xs text-do-600">{state.error}</span>}
    </form>
  );
}
