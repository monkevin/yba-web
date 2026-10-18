"use client";

import { useActionState, useState } from "react";
import { xuLyChuyen, xuLyDangKy, xoaChuyen, type KetQua } from "./actions";

const TRANG_THAI = [
  { ma: "DE_XUAT", ten: "Chờ duyệt" },
  { ma: "DA_DUYET", ten: "Mở đăng ký" },
  { ma: "DA_DONG", ten: "Đóng đăng ký" },
  { ma: "DA_TO_CHUC", ten: "Đã tổ chức" },
  { ma: "TU_CHOI", ten: "Chưa sắp xếp được" },
];

export function FormXuLyChuyen({
  id,
  status,
  ngayToChuc,
  soLuongToiDa,
  ghiChuBCN,
}: {
  id: string;
  status: string;
  ngayToChuc: Date | null;
  soLuongToiDa: number | null;
  ghiChuBCN: string | null;
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    xuLyChuyen,
    {}
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs text-slate-500">Trạng thái</span>
          <select name="status" defaultValue={status} className="inp mt-1">
            {TRANG_THAI.map((t) => (
              <option key={t.ma} value={t.ma}>
                {t.ten}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Ngày tổ chức</span>
          <input
            type="date"
            name="ngayToChuc"
            className="inp mt-1"
            defaultValue={
              ngayToChuc ? ngayToChuc.toISOString().slice(0, 10) : ""
            }
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Số chỗ tối đa</span>
          <input
            type="number"
            name="soLuongToiDa"
            className="inp mt-1"
            min={1}
            max={500}
            defaultValue={soLuongToiDa ?? ""}
          />
        </label>
      </div>
      <input
        name="ghiChuBCN"
        className="inp"
        defaultValue={ghiChuBCN ?? ""}
        maxLength={800}
        placeholder="Ghi chú hiện công khai cho hội viên (điểm tập trung, lưu ý…)"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className="btn-primary py-1.5">
          {pending ? "…" : "Lưu"}
        </button>
        {state.ok && (
          <span className="text-xs text-emerald-600">{state.ok}</span>
        )}
        {state.error && (
          <span className="text-xs text-do-600">{state.error}</span>
        )}
      </div>
    </form>
  );
}

export function NutDangKy({ id, status }: { id: string; status: string }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    xuLyDangKy,
    {}
  );

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        className="inp w-auto py-1 text-xs"
      >
        <option value="CHO_XAC_NHAN">Chờ xác nhận</option>
        <option value="DA_XAC_NHAN">Đã xác nhận</option>
        <option value="HUY">Huỷ</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 px-2 text-xs font-medium text-navy-600 hover:underline"
      >
        {pending ? "…" : "Lưu"}
      </button>
      {state.error && (
        <span className="text-xs text-do-600">{state.error}</span>
      )}
    </form>
  );
}

export function NutXoaChuyen({ id }: { id: string }) {
  const [, formAction, pending] = useActionState<KetQua, FormData>(
    xoaChuyen,
    {}
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Xoá chuyến thăm này cùng toàn bộ đăng ký?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 px-2 text-sm text-do-600 hover:underline"
      >
        {pending ? "…" : "Xoá chuyến"}
      </button>
    </form>
  );
}

/** Danh sách người đăng ký, gấp lại cho gọn. */
export function DanhSachDangKy({
  ds,
}: {
  ds: {
    id: string;
    name: string;
    phone: string;
    company: string | null;
    soNguoi: number;
    ghiChu: string | null;
    status: string;
  }[];
}) {
  const [mo, datMo] = useState(false);

  if (ds.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có ai đăng ký.</p>;
  }

  const tongNguoi = ds
    .filter((d) => d.status !== "HUY")
    .reduce((s, d) => s + d.soNguoi, 0);

  return (
    <div>
      <button
        type="button"
        onClick={() => datMo(!mo)}
        className="text-sm font-medium text-navy-600 hover:text-do-600"
      >
        {mo ? "▾" : "▸"} {ds.length} lượt đăng ký · {tongNguoi} người
      </button>

      {mo && (
        <ul className="mt-3 space-y-2">
          {ds.map((d) => (
            <li
              key={d.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                d.status === "HUY" ? "bg-slate-100 text-slate-400" : "bg-navy-50"
              }`}
            >
              <span className="min-w-0">
                <strong className="text-navy-800">{d.name}</strong>
                {d.soNguoi > 1 && ` (${d.soNguoi} người)`}
                {" · "}
                <a href={`tel:${d.phone}`} className="hover:underline">
                  {d.phone}
                </a>
                {d.company && (
                  <span className="block text-xs text-slate-500">
                    {d.company}
                    {d.ghiChu ? ` — ${d.ghiChu}` : ""}
                  </span>
                )}
              </span>
              <NutDangKy id={d.id} status={d.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
