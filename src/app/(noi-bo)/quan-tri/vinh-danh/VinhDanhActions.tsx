"use client";

import { useActionState, useState } from "react";
import MemberPicker from "@/components/MemberPicker";
import { toDateInput } from "@/lib/format";
import { HANG_MUC } from "@/lib/vinh-danh";
import {
  deXuatTuSoLieu,
  doiCongBo,
  taoKy,
  themVinhDanh,
  xoaKy,
  xoaVinhDanh,
  type KetQua,
} from "./actions";

/** Form tạo kỳ vinh danh mới. */
export function FormTaoKy() {
  const [mo, setMo] = useState(false);
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    async (p, fd) => {
      const kq = await taoKy(p, fd);
      if (kq.ok) setMo(false);
      return kq;
    },
    {}
  );

  const namNay = new Date().getFullYear();

  if (!mo) {
    return (
      <button onClick={() => setMo(true)} className="btn-primary">
        + Tạo kỳ vinh danh
      </button>
    );
  }

  return (
    <form action={formAction} className="card w-full space-y-4 p-5">
      <h3 className="font-bold text-navy-800">Kỳ vinh danh mới</h3>

      <label className="block">
        <span className="lbl">Tên kỳ *</span>
        <input
          name="name"
          className="inp"
          required
          autoFocus
          placeholder={`Ví dụ: Quý III/${namNay} hoặc Năm ${namNay}`}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="lbl">Từ ngày *</span>
          <input
            type="date"
            name="from"
            className="inp"
            required
            defaultValue={toDateInput(new Date(namNay, 0, 1))}
          />
        </label>
        <label className="block">
          <span className="lbl">Đến ngày *</span>
          <input
            type="date"
            name="to"
            className="inp"
            required
            defaultValue={toDateInput(new Date())}
          />
        </label>
      </div>

      <label className="block">
        <span className="lbl">Ghi chú</span>
        <input
          name="note"
          className="inp"
          placeholder="Ví dụ: Công bố tại Họp mặt hội viên quý III"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="btn-primary">
          {pending ? "Đang tạo..." : "Tạo kỳ"}
        </button>
        <button type="button" onClick={() => setMo(false)} className="btn-ghost">
          Huỷ
        </button>
        {state.error && <p className="text-sm text-do-600">{state.error}</p>}
      </div>
    </form>
  );
}

export function NutDeXuat({ periodId }: { periodId: string }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    deXuatTuSoLieu,
    {}
  );
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="periodId" value={periodId} />
      <button disabled={pending} className="btn-ghost py-1.5">
        {pending ? "Đang tính..." : "Đề xuất từ số liệu"}
      </button>
      {state.error && <p className="mt-1 text-xs text-do-600">{state.error}</p>}
      {state.ok && <p className="mt-1 text-xs text-emerald-700">{state.message}</p>}
    </form>
  );
}

export function NutCongBo({
  id,
  dangCongBo,
}: {
  id: string;
  dangCongBo: boolean;
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    doiCongBo,
    {}
  );
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        disabled={pending}
        className={dangCongBo ? "btn-ghost py-1.5" : "btn-primary py-1.5"}
      >
        {pending ? "..." : dangCongBo ? "Thu hồi" : "Công bố"}
      </button>
      {state.error && <p className="mt-1 text-xs text-do-600">{state.error}</p>}
    </form>
  );
}

export function NutXoaKy({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(xoaKy, {});
  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={(e) => {
        if (!confirm("Xoá hẳn kỳ này và toàn bộ danh sách vinh danh trong đó?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="btn-ghost py-1.5 text-do-600">
        {pending ? "..." : "Xoá kỳ"}
      </button>
      {state.error && <span className="ml-2 text-xs text-do-600">{state.error}</span>}
    </form>
  );
}

export function NutXoaMuc({ id }: { id: string }) {
  const [, formAction, pending] = useActionState<KetQua, FormData>(
    xoaVinhDanh,
    {}
  );
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        disabled={pending}
        title="Bỏ khỏi bảng vinh danh"
        className="rounded px-2 py-1 text-xs text-do-600 hover:bg-do-50"
      >
        {pending ? "..." : "Bỏ"}
      </button>
    </form>
  );
}

/** Thêm tay một lượt vinh danh ngoài ba hạng mục tự động. */
export function FormThem({ periodId }: { periodId: string }) {
  const [mo, setMo] = useState(false);
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    async (p, fd) => {
      const kq = await themVinhDanh(p, fd);
      if (kq.ok) setMo(false);
      return kq;
    },
    {}
  );

  if (!mo) {
    return (
      <button onClick={() => setMo(true)} className="btn-ghost py-1.5">
        + Thêm hạng mục
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-3 space-y-3 rounded-xl bg-navy-50 p-4">
      <input type="hidden" name="periodId" value={periodId} />

      <MemberPicker name="memberId" label="Hội viên được vinh danh" required />

      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <label className="block">
          <span className="lbl">Hạng mục *</span>
          <input
            name="category"
            className="inp"
            required
            list="hang-muc-goi-y"
            placeholder="Ví dụ: Hội viên tích cực nhất"
          />
          <datalist id="hang-muc-goi-y">
            {Object.values(HANG_MUC).map((h) => (
              <option key={h} value={h} />
            ))}
            <option value="Đóng góp cộng đồng nổi bật" />
            <option value="Hội viên mới tiêu biểu" />
            <option value="Doanh nghiệp truyền cảm hứng" />
          </datalist>
        </label>
        <label className="block">
          <span className="lbl">Thứ hạng</span>
          <input
            name="rank"
            type="number"
            min={0}
            max={10}
            className="inp"
            defaultValue={0}
            placeholder="0 = không xếp hạng"
          />
        </label>
      </div>

      <label className="block">
        <span className="lbl">Số liệu kèm theo</span>
        <input
          name="metric"
          className="inp"
          placeholder="Ví dụ: 1,25 tỷ ₫ · 8 giao dịch"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="btn-primary py-1.5">
          {pending ? "Đang thêm..." : "Thêm"}
        </button>
        <button type="button" onClick={() => setMo(false)} className="btn-ghost py-1.5">
          Huỷ
        </button>
        {state.error && <p className="text-sm text-do-600">{state.error}</p>}
      </div>
    </form>
  );
}
