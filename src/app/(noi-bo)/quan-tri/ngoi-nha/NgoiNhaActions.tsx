"use client";

import { useActionState, useState, useTransition } from "react";
import type { DongPhanThuong } from "@/lib/ngoi-nha/mua";
import {
  LOAI_MOC,
  taoMaMoc,
  type LoaiMoc,
  type MocQua,
} from "@/lib/ngoi-nha/moc-qua";
import {
  doiAnXepHang,
  dongMua,
  ghiTraoQua,
  luuCoCauQua,
  luuMua,
  moMua,
  type KetQua,
} from "./actions";

function ThongBao({ state }: { state: KetQua }) {
  if (state.error)
    return <p className="mt-2 text-sm text-do-600">{state.error}</p>;
  if (state.message)
    return <p className="mt-2 text-sm text-emerald-700">{state.message}</p>;
  return null;
}

/** Form tạo / sửa mùa giải. Ngày nhập theo giờ Việt Nam. */
export function FormMua({
  mua,
}: {
  mua?: {
    id: string;
    ten: string;
    batDau: string;
    ketThuc: string;
    ghiChu: string | null;
  };
}) {
  const [state, action, pending] = useActionState<KetQua, FormData>(luuMua, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {mua && <input type="hidden" name="id" value={mua.id} />}
      <div className="sm:col-span-2">
        <label className="lbl">Tên mùa giải</label>
        <input
          name="ten"
          className="inp"
          required
          defaultValue={mua?.ten ?? ""}
          placeholder="Mùa 1 – Thắp lửa Chợ Lớn"
        />
      </div>
      <div>
        <label className="lbl">Bắt đầu</label>
        <input
          type="date"
          name="batDau"
          className="inp"
          required
          defaultValue={mua?.batDau ?? ""}
        />
      </div>
      <div>
        <label className="lbl">Kết thúc</label>
        <input
          type="date"
          name="ketThuc"
          className="inp"
          required
          defaultValue={mua?.ketThuc ?? ""}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="lbl">Ghi chú nội bộ</label>
        <input
          name="ghiChu"
          className="inp"
          defaultValue={mua?.ghiChu ?? ""}
          placeholder="Phát động tại buổi sinh hoạt ngày…"
        />
      </div>
      <div className="sm:col-span-2">
        <button disabled={pending} className="btn-primary">
          {pending ? "Đang lưu..." : mua ? "Lưu thay đổi" : "Tạo mùa giải"}
        </button>
        <ThongBao state={state} />
      </div>
    </form>
  );
}

export function NutMoMua({ id }: { id: string }) {
  const [state, action, pending] = useActionState<KetQua, FormData>(moMua, {});
  // Mở mùa là mọi người về 0 điểm — bấm hai lần cho chắc
  const [chac, setChac] = useState(false);
  return (
    <form
      action={action}
      className="inline-block"
      onSubmit={(e) => !chac && (e.preventDefault(), setChac(true))}
    >
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="btn-primary">
        {pending
          ? "..."
          : chac
            ? "Bấm lần nữa: mở mùa, mọi người về 0 điểm"
            : "Mở mùa"}
      </button>
      <ThongBao state={state} />
    </form>
  );
}

export function NutDongMua({ id }: { id: string }) {
  const [state, action, pending] = useActionState<KetQua, FormData>(
    dongMua,
    {},
  );
  const [chac, setChac] = useState(false);
  return (
    <form
      action={action}
      className="inline-block"
      onSubmit={(e) => !chac && (e.preventDefault(), setChac(true))}
    >
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className={chac ? "btn-danger" : "btn-ghost"}>
        {pending ? "..." : chac ? "Bấm lần nữa để đóng mùa" : "Đóng mùa"}
      </button>
      <ThongBao state={state} />
    </form>
  );
}

/** Đếm phần quà của các dòng ghi số (dòng "Mỗi người đạt" không tính). */
const demQua = (ds: { soLuong: string }[]) =>
  ds.reduce(
    (t, d) =>
      t + (/^\d+$/.test(d.soLuong.trim()) ? parseInt(d.soLuong, 10) : 0),
    0,
  );
const demGiaTri = (ds: { soLuong: string; giaTri?: number }[]) =>
  ds.reduce(
    (t, d) =>
      t +
      (d.giaTri
        ? d.giaTri *
          (/^\d+$/.test(d.soLuong.trim()) ? parseInt(d.soLuong, 10) : 1)
        : 0),
    0,
  );
const tien = (n: number) => n.toLocaleString("vi-VN");

function doiCho<T>(ds: T[], i: number, huong: -1 | 1): T[] {
  const j = i + huong;
  if (j < 0 || j >= ds.length) return ds;
  const kq = [...ds];
  [kq[i], kq[j]] = [kq[j], kq[i]];
  return kq;
}

function NutDong({
  i,
  tong,
  len,
  xuong,
  xoa,
}: {
  i: number;
  tong: number;
  len: () => void;
  xuong: () => void;
  xoa: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={len}
        disabled={i === 0}
        className="btn-ghost px-2 py-1 text-xs"
        aria-label="Chuyển lên"
      >
        ↑
      </button>
      <button
        type="button"
        onClick={xuong}
        disabled={i === tong - 1}
        className="btn-ghost px-2 py-1 text-xs"
        aria-label="Chuyển xuống"
      >
        ↓
      </button>
      <button
        type="button"
        onClick={xoa}
        className="btn-ghost px-2 py-1 text-xs text-do-600"
      >
        Xoá
      </button>
    </div>
  );
}

/**
 * Soạn cơ cấu quà: mốc quà (ai đạt cũng có) + giải xếp hạng. Áp cho một mùa
 * (`muaId`) hoặc cơ cấu mẫu dùng khi chơi thử và làm khuôn cho mùa tạo sau.
 */
export function SuaCoCauQua({
  muaId,
  apDung,
  giai,
  moc,
  giaiMacDinh,
  mocMacDinh,
}: {
  muaId: string | null;
  apDung: string;
  giai: DongPhanThuong[];
  moc: MocQua[];
  giaiMacDinh: DongPhanThuong[];
  mocMacDinh: MocQua[];
}) {
  // Lưu bằng transition thay vì <form action>: React 19 tự reset form sau action,
  // làm ô chọn loại mốc hiện lệch với dữ liệu thật
  const [state, setState] = useState<KetQua>({});
  const [pending, startTransition] = useTransition();
  const [dsGiai, setDsGiai] = useState<DongPhanThuong[]>(giai);
  const [dsMoc, setDsMoc] = useState<MocQua[]>(moc);
  const soQua = demQua(dsGiai);
  const giaTri = demGiaTri(dsGiai) + demGiaTri(dsMoc);

  const suaGiai = (i: number, k: keyof DongPhanThuong, v: string) =>
    setDsGiai((ds) =>
      ds.map((d, x) =>
        x === i
          ? {
              ...d,
              [k]:
                k === "giaTri"
                  ? Number(v.replace(/[^\d]/g, "")) || undefined
                  : v,
            }
          : d,
      ),
    );
  const suaMoc = (i: number, k: keyof MocQua, v: string) =>
    setDsMoc((ds) =>
      ds.map((d, x) =>
        x === i
          ? {
              ...d,
              [k]:
                k === "giaTri"
                  ? Number(v.replace(/[^\d]/g, "")) || undefined
                  : k === "nguong"
                    ? Number(v.replace(/[^\d]/g, "")) || 0
                    : v,
            }
          : d,
      ),
    );

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("muaId", muaId ?? "");
        fd.set("giai", JSON.stringify(dsGiai));
        fd.set("moc", JSON.stringify(dsMoc));
        startTransition(async () => {
          const kq = await luuCoCauQua({}, fd);
          setState(kq);
          // Hiện lại đúng bản máy chủ đã làm sạch (dòng trống bị bỏ, ngưỡng bị chặn…)
          if (kq.giai) setDsGiai(kq.giai);
          if (kq.moc) setDsMoc(kq.moc);
        });
      }}
    >
      <p className="rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-700">
        Đang soạn cho: <b>{apDung}</b>. Cột “Nhà đồng hành” chỉ điền khi doanh
        nghiệp đã nhận lời — tên hiện công khai trong game.
      </p>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold text-navy-800">
            Mốc quà — ai đạt cũng nhận ({dsMoc.length})
          </h3>
          <button
            type="button"
            className="btn-ghost py-1.5 text-sm"
            onClick={() =>
              setDsMoc((ds) => [
                ...ds,
                {
                  ma: taoMaMoc(),
                  ten: "",
                  loai: "SO_TRAM",
                  nguong: 10,
                  qua: "",
                  soLuong: "Mỗi người đạt",
                },
              ])
            }
          >
            + Thêm mốc
          </button>
        </div>
        <div className="mt-2 space-y-3">
          {dsMoc.length === 0 && (
            <p className="text-sm text-slate-500">Chưa có mốc quà nào.</p>
          )}
          {dsMoc.map((m, i) => (
            <div
              key={i}
              className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"
            >
              <div className="grid gap-2 sm:grid-cols-6">
                <label className="sm:col-span-2">
                  <span className="lbl">Tên mốc</span>
                  <input
                    className="inp"
                    value={m.ten}
                    onChange={(e) => suaMoc(i, "ten", e.target.value)}
                    placeholder="Áo thun YBA Chợ Lớn"
                  />
                </label>
                <label className="sm:col-span-3">
                  <span className="lbl">Điều kiện</span>
                  <select
                    className="inp"
                    value={m.loai}
                    onChange={(e) =>
                      suaMoc(i, "loai", e.target.value as LoaiMoc)
                    }
                  >
                    {(Object.keys(LOAI_MOC) as LoaiMoc[]).map((k) => (
                      <option key={k} value={k}>
                        {LOAI_MOC[k].ten}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="lbl">Ngưỡng ({LOAI_MOC[m.loai].donVi})</span>
                  <input
                    className="inp"
                    inputMode="numeric"
                    value={m.nguong || ""}
                    onChange={(e) => suaMoc(i, "nguong", e.target.value)}
                  />
                </label>
                <p className="-mt-1 text-xs text-slate-500 sm:col-span-6">
                  {LOAI_MOC[m.loai].goiY}
                </p>
                <label className="sm:col-span-2">
                  <span className="lbl">Quà</span>
                  <input
                    className="inp"
                    value={m.qua}
                    onChange={(e) => suaMoc(i, "qua", e.target.value)}
                    placeholder="01 áo thun YBA Chợ Lớn"
                  />
                </label>
                <label>
                  <span className="lbl">Số lượng</span>
                  <input
                    className="inp"
                    value={m.soLuong}
                    onChange={(e) => suaMoc(i, "soLuong", e.target.value)}
                  />
                </label>
                <label>
                  <span className="lbl">Giá trị (đ)</span>
                  <input
                    className="inp"
                    inputMode="numeric"
                    value={m.giaTri ?? ""}
                    onChange={(e) => suaMoc(i, "giaTri", e.target.value)}
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="lbl">Nhà đồng hành</span>
                  <input
                    className="inp"
                    value={m.nhaDongHanh ?? ""}
                    onChange={(e) => suaMoc(i, "nhaDongHanh", e.target.value)}
                  />
                </label>
              </div>
              <div className="mt-2 flex justify-end">
                <NutDong
                  i={i}
                  tong={dsMoc.length}
                  len={() => setDsMoc((ds) => doiCho(ds, i, -1))}
                  xuong={() => setDsMoc((ds) => doiCho(ds, i, 1))}
                  xoa={() => setDsMoc((ds) => ds.filter((_, x) => x !== i))}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold text-navy-800">
            Giải xếp hạng ({dsGiai.length} hạng mục)
          </h3>
          <button
            type="button"
            className="btn-ghost py-1.5 text-sm"
            onClick={() =>
              setDsGiai((ds) => [
                ...ds,
                { hangMuc: "", dieuKien: "", qua: "", soLuong: "01" },
              ])
            }
          >
            + Thêm giải
          </button>
        </div>
        <div className="mt-2 space-y-3">
          {dsGiai.map((g, i) => (
            <div
              key={i}
              className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"
            >
              <div className="grid gap-2 sm:grid-cols-6">
                <label className="sm:col-span-2">
                  <span className="lbl">Hạng mục</span>
                  <input
                    className="inp"
                    value={g.hangMuc}
                    onChange={(e) => suaGiai(i, "hangMuc", e.target.value)}
                    placeholder="Giải Nhất mùa"
                  />
                </label>
                <label className="sm:col-span-3">
                  <span className="lbl">Điều kiện</span>
                  <input
                    className="inp"
                    value={g.dieuKien}
                    onChange={(e) => suaGiai(i, "dieuKien", e.target.value)}
                    placeholder="Điểm Vươn tầm cao nhất"
                  />
                </label>
                <label>
                  <span className="lbl">Số lượng</span>
                  <input
                    className="inp"
                    value={g.soLuong}
                    onChange={(e) => suaGiai(i, "soLuong", e.target.value)}
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="lbl">Quà</span>
                  <input
                    className="inp"
                    value={g.qua}
                    onChange={(e) => suaGiai(i, "qua", e.target.value)}
                  />
                </label>
                <label>
                  <span className="lbl">Giá trị (đ)</span>
                  <input
                    className="inp"
                    inputMode="numeric"
                    value={g.giaTri ?? ""}
                    onChange={(e) => suaGiai(i, "giaTri", e.target.value)}
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="lbl">Nhà đồng hành</span>
                  <input
                    className="inp"
                    value={g.nhaDongHanh ?? ""}
                    onChange={(e) => suaGiai(i, "nhaDongHanh", e.target.value)}
                  />
                </label>
                <div className="flex items-end justify-end">
                  <NutDong
                    i={i}
                    tong={dsGiai.length}
                    len={() => setDsGiai((ds) => doiCho(ds, i, -1))}
                    xuong={() => setDsGiai((ds) => doiCho(ds, i, 1))}
                    xoa={() => setDsGiai((ds) => ds.filter((_, x) => x !== i))}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <span className="text-sm text-slate-700">
          <b className={soQua === 20 ? "text-emerald-700" : "text-amber-700"}>
            {soQua}
          </b>{" "}
          phần quà xếp hạng
          {soQua !== 20 && (
            <span className="text-amber-700"> (Ban Điều hành chốt 20)</span>
          )}{" "}
          · trị giá <b>{tien(giaTri)}đ</b>
        </span>
        <button disabled={pending} className="btn-primary">
          {pending ? "Đang lưu..." : "Lưu cơ cấu quà"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            if (confirm("Đưa về cơ cấu mặc định? Thay đổi chưa lưu sẽ mất.")) {
              setDsGiai(giaiMacDinh);
              setDsMoc(mocMacDinh);
            }
          }}
        >
          Về mặc định
        </button>
        <ThongBao state={state} />
      </div>
    </form>
  );
}

export function NutTraoQua({
  userId,
  muaId,
  loai,
  daTrao,
  ghiChu,
  chu = "Ghi đã trao",
  chuXong = "Đã trao",
}: {
  userId: string;
  muaId: string;
  loai: string;
  daTrao: boolean;
  /** Ghi kèm bản ghi trao quà (vd "Hạng 2 · có quà") */
  ghiChu?: string;
  chu?: string;
  chuXong?: string;
}) {
  const [state, action, pending] = useActionState<KetQua, FormData>(
    ghiTraoQua,
    {},
  );
  if (daTrao || state.ok)
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        {chuXong}
      </span>
    );
  return (
    <form action={action} className="inline-flex items-center gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="muaId" value={muaId} />
      <input type="hidden" name="loai" value={loai} />
      {ghiChu && <input type="hidden" name="ghiChu" value={ghiChu} />}
      <button disabled={pending} className="btn-ghost py-1 text-xs">
        {pending ? "..." : chu}
      </button>
      {state.error && (
        <span className="text-xs text-do-600">{state.error}</span>
      )}
    </form>
  );
}

export function NutAnXepHang({
  userId,
  dangAn,
}: {
  userId: string;
  dangAn: boolean;
}) {
  const [state, action, pending] = useActionState<KetQua, FormData>(
    doiAnXepHang,
    {},
  );
  return (
    <form action={action} className="inline-block">
      <input type="hidden" name="userId" value={userId} />
      <button disabled={pending} className="btn-ghost py-1 text-xs">
        {pending ? "..." : dangAn ? "Hiện lại trên BXH" : "Ẩn khỏi BXH"}
      </button>
      {state.error && (
        <span className="ml-1 text-xs text-do-600">{state.error}</span>
      )}
    </form>
  );
}
