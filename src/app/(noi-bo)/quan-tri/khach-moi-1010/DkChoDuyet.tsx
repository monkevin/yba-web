"use client";

import { useActionState } from "react";
import {
  duyetVaTaoThuMoi,
  xoaDangKyLanding,
  type KetQuaNTT,
} from "../su-kien-1010/actions";

const TEN_PHIEN: Record<string, string> = {
  TOA_DAM: "Tọa đàm",
  CHUYEN_GIAO: "Lễ",
  GALA: "Gala",
};

export type DkLanding = {
  id: string;
  name: string;
  phone: string;
  company: string | null;
  chucVu: string | null;
  soNguoi: number;
  phien: string | null;
  ghiChu: string | null;
};

function NutDuyet({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<KetQuaNTT, FormData>(
    duyetVaTaoThuMoi,
    {}
  );
  return (
    <form action={formAction} className="inline-block">
      <input type="hidden" name="id" value={id} />
      <button
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
        title="Duyệt và tạo thư mời riêng — suất mời đúng các phiên khách đã đăng ký"
      >
        {pending ? "…" : "✓ Duyệt → tạo thư mời"}
      </button>
      {state.ok && (
        <span className="mt-1 block max-w-sm text-xs leading-snug text-emerald-700">
          {state.ok}
        </span>
      )}
      {state.error && (
        <span className="mt-1 block text-xs text-do-600">{state.error}</span>
      )}
    </form>
  );
}

function NutXoaDk({ id, ten }: { id: string; ten: string }) {
  const [state, formAction, pending] = useActionState<KetQuaNTT, FormData>(
    xoaDangKyLanding,
    {}
  );
  return (
    <form
      action={formAction}
      className="inline-block"
      onSubmit={(e) => {
        if (!confirm(`Xoá đăng ký của "${ten}"?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        disabled={pending}
        className="px-2 text-xs text-slate-400 hover:text-do-600"
      >
        {pending ? "…" : "Xoá"}
      </button>
      {state.error && <span className="text-xs text-do-600">{state.error}</span>}
    </form>
  );
}

/**
 * ĐĂNG KÝ TỪ LANDING CHỜ DUYỆT — đặt ngay trong trang Khách mời 10/10
 * (Chủ tịch chốt 25/09: "danh sách chờ duyệt phải nằm bên này mới hợp
 * lý"): BTC duyệt là khách vào thẳng danh sách mời với suất mời đúng
 * phiên đã đăng ký.
 */
export default function DkChoDuyet({ ds }: { ds: DkLanding[] }) {
  if (ds.length === 0) return null;
  return (
    <div className="card mb-5 border-l-4 border-l-do-500 p-5">
      <h2 className="font-bold text-navy-800">
        🔔 Đăng ký từ landing chờ duyệt{" "}
        <span className="rounded-full bg-do-500 px-2 py-0.5 text-xs font-bold text-white">
          {ds.length}
        </span>
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Duyệt là khách được tạo thư mời riêng với suất mời đúng các phiên đã
        đăng ký (phiên chưa đăng ký sẽ bị khoá trên thiệp) — sau đó bấm
        “Chép link” ở danh sách dưới để gửi khách xác nhận.
      </p>
      <ul className="mt-3 divide-y divide-navy-50">
        {ds.map((d) => (
          <li
            key={d.id}
            className="flex flex-wrap items-center justify-between gap-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="font-semibold text-navy-800">
                {d.name}
                {d.soNguoi > 1 && (
                  <span className="ml-1 text-xs font-normal text-slate-500">
                    ({d.soNguoi} người)
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-500">
                {[d.phone, d.chucVu, d.company].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-amber-700">
                Đăng ký:{" "}
                {(d.phien ?? "")
                  .split(",")
                  .filter(Boolean)
                  .map((p) => TEN_PHIEN[p] ?? p)
                  .join(" · ") || "chưa chọn phiên"}
                {d.phien?.includes("GALA") &&
                  ` — phí Gala ${(d.soNguoi * 1_100_000).toLocaleString("vi-VN")}đ`}
              </p>
              {d.ghiChu && (
                <p className="mt-0.5 text-xs text-slate-500">💬 {d.ghiChu}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <NutDuyet id={d.id} />
              <NutXoaDk id={d.id} ten={d.name} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
