"use client";

import { useActionState, useState } from "react";
import AnhTaiLen from "@/components/AnhTaiLen";
import { luuSanPham, xoaSanPham, type KetQua } from "./actions";

export type SanPhamItem = {
  id: string;
  name: string;
  summary: string | null;
  priceText: string | null;
  image: string | null;
  order: number;
};

/** Khối quản lý sản phẩm / dịch vụ tiêu biểu hiện trên hồ sơ công khai. */
export default function SanPham({
  memberId,
  danhSach,
}: {
  memberId: string;
  danhSach: SanPhamItem[];
}) {
  const [dangSua, setDangSua] = useState<string | null>(null);
  const [themMoi, setThemMoi] = useState(false);

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-navy-800">Sản phẩm / dịch vụ tiêu biểu</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Tối đa 12 mục, hiện thành lưới ảnh trên hồ sơ công khai.
          </p>
        </div>
        {!themMoi && danhSach.length < 12 && (
          <button onClick={() => setThemMoi(true)} className="btn-primary">
            + Thêm sản phẩm
          </button>
        )}
      </div>

      {themMoi && (
        <div className="mt-4">
          <Form
            memberId={memberId}
            xong={() => setThemMoi(false)}
            thuTuMacDinh={danhSach.length}
          />
        </div>
      )}

      {danhSach.length === 0 && !themMoi ? (
        <p className="mt-6 rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Chưa có sản phẩm nào. Thêm vài sản phẩm tiêu biểu để hội viên khác biết
          doanh nghiệp cung cấp gì.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {danhSach.map((sp) =>
            dangSua === sp.id ? (
              <li key={sp.id}>
                <Form
                  memberId={memberId}
                  sanPham={sp}
                  xong={() => setDangSua(null)}
                  thuTuMacDinh={sp.order}
                />
              </li>
            ) : (
              <li
                key={sp.id}
                className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 p-3"
              >
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
                  {sp.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sp.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl text-slate-300">📦</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-navy-800">{sp.name}</p>
                  {sp.summary && (
                    <p className="mt-0.5 line-clamp-1 text-sm text-slate-600">
                      {sp.summary}
                    </p>
                  )}
                  {sp.priceText && (
                    <p className="mt-0.5 text-sm font-semibold text-do-700">
                      {sp.priceText}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => setDangSua(sp.id)} className="btn-ghost py-1.5">
                    Sửa
                  </button>
                  <NutXoa memberId={memberId} id={sp.id} />
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </section>
  );
}

function Form({
  memberId,
  sanPham,
  xong,
  thuTuMacDinh,
}: {
  memberId: string;
  sanPham?: SanPhamItem;
  xong: () => void;
  thuTuMacDinh: number;
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    async (prev, fd) => {
      const kq = await luuSanPham(prev, fd);
      if (kq.ok) xong();
      return kq;
    },
    {}
  );

  return (
    <form action={formAction} className="rounded-xl bg-navy-50 p-4">
      <input type="hidden" name="memberId" value={memberId} />
      {sanPham && <input type="hidden" name="id" value={sanPham.id} />}
      <input type="hidden" name="order" value={thuTuMacDinh} />

      <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
        <AnhTaiLen
          name="image"
          label="Ảnh sản phẩm"
          giaTriBanDau={sanPham?.image}
          tyLe="ngang"
        />
        <div className="space-y-3">
          <label className="block">
            <span className="lbl">Tên sản phẩm / dịch vụ *</span>
            <input
              name="name"
              className="inp"
              required
              defaultValue={sanPham?.name ?? ""}
            />
          </label>
          <label className="block">
            <span className="lbl">Mô tả ngắn</span>
            <textarea
              name="summary"
              rows={2}
              className="inp"
              defaultValue={sanPham?.summary ?? ""}
            />
          </label>
          <label className="block">
            <span className="lbl">Giá tham khảo</span>
            <input
              name="priceText"
              className="inp"
              defaultValue={sanPham?.priceText ?? ""}
              placeholder="Ví dụ: Từ 3.500.000 ₫ hoặc Liên hệ"
            />
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Đang lưu..." : "Lưu"}
        </button>
        <button type="button" onClick={xong} className="btn-ghost">
          Huỷ
        </button>
        {state.error && <p className="text-sm text-do-600">{state.error}</p>}
      </div>
    </form>
  );
}

function NutXoa({ memberId, id }: { memberId: string; id: string }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    xoaSanPham,
    {}
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Xoá sản phẩm này khỏi hồ sơ?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="btn-ghost py-1.5 text-do-600">
        {pending ? "..." : "Xoá"}
      </button>
      {state.error && <span className="text-xs text-do-600">{state.error}</span>}
    </form>
  );
}
