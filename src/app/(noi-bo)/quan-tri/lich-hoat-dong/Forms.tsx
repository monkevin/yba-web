"use client";

import { useActionState, useState } from "react";
import {
  luuMuc,
  xoaMuc,
  duyetDangKy,
  themNguoi,
  xoaDangKy,
  type KetQua,
} from "./actions";

export type MucSua = {
  id: string;
  tieuDe: string;
  moTa: string | null;
  noiDung: string | null;
  yNghia: string | null;
  banToChuc: string | null;
  lienHe: string | null;
  tuNgay: Date;
  denNgay: Date | null;
  diaDiem: string | null;
  gioText: string | null;
  nguon: string;
  lienKet: string | null;
  noiBat: boolean;
  published: boolean;
  order: number;
  choDangKy: boolean;
  soLuongToiDa: number | null;
  hanDangKy: Date | null;
  hienDanhSach: boolean;
};

const ngayInput = (d: Date | null) =>
  d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : "";

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
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
      {goiY && <span className="mt-1 block text-xs text-slate-500">{goiY}</span>}
    </label>
  );
}

export function FormMuc({ muc }: { muc?: MucSua }) {
  const [mo, datMo] = useState(!muc);
  const [state, formAction, pending] = useActionState<KetQua, FormData>(luuMuc, {});

  if (muc && !mo) {
    return (
      <button type="button" onClick={() => datMo(true)} className="btn-ghost py-1.5">
        Sửa
      </button>
    );
  }

  return (
    <form action={formAction} className="w-full space-y-3">
      {muc && <input type="hidden" name="id" value={muc.id} />}

      {state.error && (
        <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.ok}
        </p>
      )}

      <O label="Tên hoạt động">
        <input
          name="tieuDe"
          className="inp"
          required
          maxLength={200}
          defaultValue={muc?.tieuDe ?? ""}
        />
      </O>

      <O label="Mô tả ngắn">
        <input
          name="moTa"
          className="inp"
          maxLength={400}
          defaultValue={muc?.moTa ?? ""}
        />
      </O>

      <div className="grid gap-3 sm:grid-cols-3">
        <O label="Ngày diễn ra">
          <input
            type="date"
            name="tuNgay"
            className="inp"
            required
            defaultValue={ngayInput(muc?.tuNgay ?? null)}
          />
        </O>
        <O label="Đến ngày" goiY="Bỏ trống nếu chỉ một ngày.">
          <input
            type="date"
            name="denNgay"
            className="inp"
            defaultValue={ngayInput(muc?.denNgay ?? null)}
          />
        </O>
        <O label="Giờ" goiY="Ví dụ: 18h00 – 21h00">
          <input
            name="gioText"
            className="inp"
            maxLength={40}
            defaultValue={muc?.gioText ?? ""}
          />
        </O>
      </div>

      <O label="Địa điểm">
        <input
          name="diaDiem"
          className="inp"
          maxLength={200}
          defaultValue={muc?.diaDiem ?? ""}
        />
      </O>

      {/* Nội dung hiện ở trang chi tiết của hoạt động */}
      <O
        label="Nội dung chi tiết chương trình"
        goiY="Cách một dòng trống để xuống đoạn mới. Hiện ở trang chi tiết."
      >
        <textarea
          name="noiDung"
          rows={6}
          className="inp"
          defaultValue={muc?.noiDung ?? ""}
        />
      </O>

      <O label="Ý nghĩa chương trình">
        <textarea
          name="yNghia"
          rows={3}
          className="inp"
          defaultValue={muc?.yNghia ?? ""}
        />
      </O>

      <div className="grid gap-3 sm:grid-cols-2">
        <O label="Ban tổ chức">
          <input
            name="banToChuc"
            className="inp"
            maxLength={200}
            defaultValue={muc?.banToChuc ?? ""}
          />
        </O>
        <O label="Liên hệ đăng ký" goiY="Tên và số điện thoại người phụ trách.">
          <input
            name="lienHe"
            className="inp"
            maxLength={200}
            defaultValue={muc?.lienHe ?? ""}
          />
        </O>
      </div>

      {/* Đăng ký tham gia / tài trợ */}
      <div className="rounded-xl bg-navy-50 p-4">
        <p className="mb-3 text-sm font-bold text-navy-800">
          Đăng ký trên website
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <O label="Số người tối đa" goiY="Bỏ trống nếu không giới hạn.">
            <input
              type="number"
              name="soLuongToiDa"
              className="inp"
              min={1}
              defaultValue={muc?.soLuongToiDa ?? ""}
            />
          </O>
          <O label="Hạn đăng ký">
            <input
              type="date"
              name="hanDangKy"
              className="inp"
              defaultValue={ngayInput(muc?.hanDangKy ?? null)}
            />
          </O>
        </div>
        <div className="mt-3 flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="choDangKy"
              defaultChecked={muc?.choDangKy ?? true}
              className="h-4 w-4"
            />
            Mở đăng ký tham gia / tài trợ
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="hienDanhSach"
              defaultChecked={muc?.hienDanhSach ?? true}
              className="h-4 w-4"
            />
            Hiện danh sách đã duyệt
          </label>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <O label="Chương trình của">
          <select name="nguon" className="inp" defaultValue={muc?.nguon ?? "CHI_HOI"}>
            <option value="CHI_HOI">Chi hội Chợ Lớn</option>
            <option value="HOI">Hội DNT TP.HCM</option>
            <option value="DOI_TAC">Đối tác</option>
          </select>
        </O>
        <O label="Liên kết" goiY="Trang chi tiết hoặc link đăng ký.">
          <input
            name="lienKet"
            className="inp"
            maxLength={300}
            defaultValue={muc?.lienKet ?? ""}
          />
        </O>
        <O label="Thứ tự">
          <input
            type="number"
            name="order"
            className="inp"
            defaultValue={muc?.order ?? 0}
          />
        </O>
      </div>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="published"
            defaultChecked={muc?.published ?? true}
            className="h-4 w-4"
          />
          Hiện trên website
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="noiBat"
            defaultChecked={muc?.noiBat ?? false}
            className="h-4 w-4"
          />
          Làm nổi bật (in đỏ)
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="btn-primary py-1.5">
          {pending ? "…" : muc ? "Lưu" : "+ Thêm hoạt động"}
        </button>
        {muc && (
          <button type="button" onClick={() => datMo(false)} className="btn-ghost py-1.5">
            Đóng
          </button>
        )}
      </div>
    </form>
  );
}

export function NutXoaMuc({ id }: { id: string }) {
  const [, formAction, pending] = useActionState<KetQua, FormData>(xoaMuc, {});

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Xoá hoạt động này khỏi lịch?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 px-2 text-sm text-do-600 hover:underline"
      >
        {pending ? "…" : "Xoá"}
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════
// Đăng ký tham gia / tài trợ
// ═══════════════════════════════════════════════════════════════

export type DangKy = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  chucVu: string | null;
  loai: string;
  soNguoi: number;
  mucTaiTro: string | null;
  soTien: number;
  hienVat: string | null;
  ghiChu: string | null;
  status: string;
  doBTCThem: boolean;
  maHoiVien: string | null;
};

const NHAN_TT: Record<string, { ten: string; lop: string }> = {
  CHO_DUYET: { ten: "Chờ duyệt", lop: "bg-amber-50 text-amber-700 ring-amber-200" },
  DA_DUYET: {
    ten: "Đã duyệt",
    lop: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  TU_CHOI: { ten: "Từ chối", lop: "bg-slate-100 text-slate-500 ring-slate-200" },
};

function NutTrangThai({ id, status }: { id: string; status: string }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    duyetDangKy,
    {}
  );

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input type="hidden" name="id" value={id} />
      {/* key=status: ô chọn uncontrolled không tự nhảy theo defaultValue
          mới sau khi Lưu — badge đổi "Đã duyệt" mà ô vẫn "Chờ duyệt"
          (Chủ tịch báo 25/09); remount theo status là khớp lại */}
      <select
        key={status}
        name="status"
        defaultValue={status}
        className="inp w-auto py-1 text-xs"
      >
        <option value="CHO_DUYET">Chờ duyệt</option>
        <option value="DA_DUYET">Duyệt — hiện lên web</option>
        <option value="TU_CHOI">Từ chối</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 px-2 text-xs font-medium text-navy-600 hover:underline"
      >
        {pending ? "…" : "Lưu"}
      </button>
      {state.error && <span className="text-xs text-do-600">{state.error}</span>}
    </form>
  );
}

function NutXoaDangKy({ id }: { id: string }) {
  const [, formAction, pending] = useActionState<KetQua, FormData>(
    xoaDangKy,
    {}
  );
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Xoá đăng ký này?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 px-2 text-xs text-do-600 hover:underline"
      >
        {pending ? "…" : "Xoá"}
      </button>
    </form>
  );
}

const trieu = (n: number) =>
  n >= 1_000_000 ? `${Math.round(n / 1_000_000)} triệu` : n.toLocaleString("vi");

/** Danh sách đăng ký của một hoạt động, gấp lại cho gọn. */
export function DanhSachDangKy({
  lichId,
  ds,
}: {
  lichId: string;
  ds: DangKy[];
}) {
  const [mo, datMo] = useState(false);

  const thamGia = ds.filter((d) => d.loai === "THAM_GIA");
  const taiTro = ds.filter((d) => d.loai === "TAI_TRO");
  const choDuyet = ds.filter((d) => d.status === "CHO_DUYET").length;
  const tongNguoi = thamGia
    .filter((d) => d.status !== "TU_CHOI")
    .reduce((s, d) => s + d.soNguoi, 0);
  const tongTien = taiTro
    .filter((d) => d.status !== "TU_CHOI")
    .reduce((s, d) => s + d.soTien, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => datMo(!mo)}
          className="flex flex-wrap items-center gap-2 text-sm font-medium text-navy-600 hover:text-do-600"
        >
          <span>{mo ? "▾" : "▸"}</span>
          <span>
            {ds.length} đăng ký · {tongNguoi} người tham gia
            {tongTien > 0 && ` · tài trợ ${trieu(tongTien)} ₫`}
          </span>
          {choDuyet > 0 && (
            <span className="rounded-full bg-do-500 px-2 py-0.5 text-[11px] font-bold text-white">
              {choDuyet} chờ duyệt
            </span>
          )}
        </button>

        {/* Nút thêm người luôn hiện để Ban Tổ chức thấy ngay, không phải mở
            danh sách ra mới tìm được */}
        <FormThemNguoi lichId={lichId} />
      </div>

      {mo && (
        <div className="mt-3 space-y-4">
          {ds.length > 0 && (
            <ul className="space-y-2">
              {ds.map((d) => {
                const n = NHAN_TT[d.status] ?? NHAN_TT.CHO_DUYET;
                return (
                  <li
                    key={d.id}
                    className={`rounded-lg px-3 py-2.5 text-sm ${
                      d.status === "TU_CHOI" ? "bg-slate-100 opacity-60" : "bg-navy-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${n.lop}`}
                          >
                            {n.ten}
                          </span>
                          <span className="chip">
                            {d.loai === "TAI_TRO" ? "🤝 Tài trợ" : "🙋 Tham gia"}
                          </span>
                          {d.doBTCThem && (
                            <span className="text-[11px] text-slate-500">
                              BTC thêm
                            </span>
                          )}
                          {d.maHoiVien && (
                            <span className="text-[11px] text-slate-500">
                              {d.maHoiVien}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 font-semibold text-navy-800">
                          {d.name}
                          {d.loai === "THAM_GIA" && d.soNguoi > 1 && (
                            <span className="ml-1 text-xs font-normal text-slate-500">
                              ({d.soNguoi} người)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-600">
                          <a href={`tel:${d.phone}`} className="hover:underline">
                            {d.phone}
                          </a>
                          {d.company && ` · ${d.company}`}
                          {d.chucVu && ` · ${d.chucVu}`}
                        </p>
                        {d.loai === "TAI_TRO" && (
                          <p className="mt-0.5 text-xs font-semibold text-do-700">
                            {[
                              d.mucTaiTro,
                              d.soTien > 0 ? `${trieu(d.soTien)} ₫` : null,
                              d.hienVat,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Chưa nêu mức"}
                          </p>
                        )}
                        {d.ghiChu && (
                          <p className="mt-1 text-xs italic text-slate-500">
                            “{d.ghiChu}”
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-1">
                        <NutTrangThai id={d.id} status={d.status} />
                        <NutXoaDangKy id={d.id} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Ban Tổ chức tự thêm người tham gia / nhà tài trợ (đăng ký qua Zalo, gọi điện…). */
export function FormThemNguoi({ lichId }: { lichId: string }) {
  const [mo, datMo] = useState(false);
  const [loai, datLoai] = useState<"THAM_GIA" | "TAI_TRO">("THAM_GIA");
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    themNguoi,
    {}
  );

  if (!mo) {
    return (
      <button
        type="button"
        onClick={() => datMo(true)}
        className="btn-ghost py-1.5 text-sm"
      >
        + Ban Tổ chức thêm người
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-xl bg-white p-4 ring-1 ring-navy-100">
      <input type="hidden" name="lichId" value={lichId} />
      <input type="hidden" name="loai" value={loai} />

      <p className="text-sm font-bold text-navy-800">
        Thêm người vào danh sách
      </p>
      <p className="text-xs leading-relaxed text-slate-500">
        Dùng khi người ta đăng ký qua Zalo, gọi điện hay tại chỗ. Thêm tay là
        duyệt luôn, hiện ngay trên trang chi tiết.
      </p>

      {state.error && (
        <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.ok}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 rounded-lg bg-navy-50 p-1">
        {(
          [
            ["THAM_GIA", "🙋 Tham gia"],
            ["TAI_TRO", "🤝 Tài trợ"],
          ] as const
        ).map(([k, nhan]) => (
          <button
            key={k}
            type="button"
            onClick={() => datLoai(k)}
            className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              loai === k ? "bg-navy-700 text-white" : "text-slate-600 hover:bg-white"
            }`}
          >
            {nhan}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <O label="Mã hội viên" goiY="Nhập để gắn với hồ sơ, ví dụ HV0001.">
          <input name="maHoiVien" className="inp" maxLength={10} placeholder="HV0001" />
        </O>
        <O label="Họ và tên">
          <input name="name" className="inp" required maxLength={60} />
        </O>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <O label="Số điện thoại">
          <input name="phone" className="inp" maxLength={20} />
        </O>
        <O label="Doanh nghiệp">
          <input name="company" className="inp" maxLength={150} />
        </O>
      </div>

      {loai === "THAM_GIA" ? (
        <O label="Số người">
          <input type="number" name="soNguoi" className="inp" min={1} defaultValue={1} />
        </O>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <O label="Mức tài trợ">
            <select name="mucTaiTro" className="inp" defaultValue="">
              <option value="">—</option>
              {["Kim cương", "Vàng", "Bạc", "Đồng", "Đồng hành"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </O>
          <O label="Hiện kim (triệu)">
            <input type="number" name="soTien" className="inp" min={0} />
          </O>
          <O label="Hiện vật">
            <input name="hienVat" className="inp" maxLength={200} />
          </O>
        </div>
      )}

      <O label="Ghi chú">
        <input name="ghiChu" className="inp" maxLength={300} />
      </O>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="btn-primary py-1.5">
          {pending ? "…" : "Thêm vào danh sách"}
        </button>
        <button type="button" onClick={() => datMo(false)} className="btn-ghost py-1.5">
          Đóng
        </button>
      </div>
    </form>
  );
}
