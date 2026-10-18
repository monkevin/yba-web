"use client";

import { useActionState, useState } from "react";
import AnhTaiLen from "@/components/AnhTaiLen";
import { LEADER_GROUPS } from "@/lib/site";
import {
  luuNhanSu,
  luuTrang,
  traVeMacDinh,
  xoaNhanSu,
  type KetQua,
} from "./actions";

// ── Trang tĩnh ─────────────────────────────────────────

export type TrangValues = {
  slug: string;
  ten: string;
  duongDan: string;
  mo: string;
  title: string;
  content: string;
  metaDesc: string | null;
  coverImage: string | null;
  daSua: boolean;
};

export function FormTrang({ t }: { t: TrangValues }) {
  const [mo, setMo] = useState(false);
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    luuTrang,
    {}
  );

  if (!mo) {
    return (
      <div className="card flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-navy-800">
            {t.ten}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                t.daSua
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-slate-100 text-slate-600 ring-slate-200"
              }`}
            >
              {t.daSua ? "Đã tuỳ chỉnh" : "Đang dùng nội dung mặc định"}
            </span>
          </p>
          <p className="mt-1 text-sm text-slate-600">{t.mo}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href={t.duongDan}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost py-1.5"
          >
            Xem trang ↗
          </a>
          <button onClick={() => setMo(true)} className="btn-primary py-1.5">
            {t.daSua ? "Sửa" : "Soạn nội dung"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="card space-y-4 p-5 ring-2 ring-navy-300">
      <input type="hidden" name="slug" value={t.slug} />
      <h3 className="font-bold text-navy-800">{t.ten}</h3>

      <label className="block">
        <span className="lbl">Tiêu đề *</span>
        <input name="title" className="inp" required defaultValue={t.title} />
      </label>

      <label className="block">
        <span className="lbl">Mô tả ngắn (cho Google và khi chia sẻ link)</span>
        <input name="metaDesc" className="inp" defaultValue={t.metaDesc ?? ""} />
      </label>

      <label className="block">
        <span className="lbl">Nội dung *</span>
        <textarea
          name="content"
          rows={14}
          className="inp"
          required
          defaultValue={t.content}
          placeholder="Cách một dòng trống để xuống đoạn mới."
        />
      </label>

      <AnhTaiLen
        name="coverImage"
        label="Ảnh minh hoạ"
        giaTriBanDau={t.coverImage}
        tyLe="ngang"
      />

      {state.error && (
        <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">{state.error}</p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="btn-primary">
          {pending ? "Đang lưu..." : "Lưu nội dung"}
        </button>
        <button type="button" onClick={() => setMo(false)} className="btn-ghost">
          Đóng
        </button>
        {t.daSua && <NutTraVe slug={t.slug} />}
      </div>
    </form>
  );
}

function NutTraVe({ slug }: { slug: string }) {
  const [, formAction, pending] = useActionState<KetQua, FormData>(
    traVeMacDinh,
    {}
  );
  return (
    <span
      onClick={(e) => {
        if (!confirm("Xoá nội dung tuỳ chỉnh, quay lại nội dung mặc định?")) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <button
        formAction={formAction}
        name="slug"
        value={slug}
        disabled={pending}
        className="btn-ghost text-do-600"
      >
        {pending ? "..." : "Trả về mặc định"}
      </button>
    </span>
  );
}

// ── Nhân sự các ban ────────────────────────────────────

export type NhanSu = {
  id: string;
  name: string;
  title: string;
  position: string | null;
  company: string | null;
  photo: string | null;
  group: string;
  term: string | null;
  memberSlug: string | null;
  order: number;
  active: boolean;
};

export function QuanLyNhanSu({ danhSach }: { danhSach: NhanSu[] }) {
  const [themMoi, setThemMoi] = useState(false);
  const [dangSua, setDangSua] = useState<string | null>(null);

  const theoBan = LEADER_GROUPS.map((g) => ({
    ...g,
    ds: danhSach.filter((n) => n.group === g.key),
  })).filter((g) => g.ds.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {danhSach.length} nhân sự trong {theoBan.length} ban
        </p>
        {!themMoi && (
          <button onClick={() => setThemMoi(true)} className="btn-primary py-1.5">
            + Thêm nhân sự
          </button>
        )}
      </div>

      {themMoi && <FormNhanSu xong={() => setThemMoi(false)} />}

      {theoBan.map((g) => (
        <section key={g.key} className="card overflow-hidden">
          <h3 className="border-b border-navy-100 px-5 py-3 font-bold text-navy-800">
            {g.label}{" "}
            <span className="font-normal text-slate-500">({g.ds.length})</span>
          </h3>
          <ul className="divide-y divide-navy-100">
            {g.ds.map((n) =>
              dangSua === n.id ? (
                <li key={n.id} className="p-4">
                  <FormNhanSu nhanSu={n} xong={() => setDangSua(null)} />
                </li>
              ) : (
                <li key={n.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-navy-50">
                    {n.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={n.photo}
                        alt=""
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <span className="text-sm font-bold text-navy-300">
                        {n.name.trim().split(/\s+/).slice(-1)[0].charAt(0)}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-navy-800">
                      {n.name}
                      {!n.active && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          Đang ẩn
                        </span>
                      )}
                    </span>
                    <span className="block text-sm text-slate-600">{n.title}</span>
                  </span>
                  <span className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setDangSua(n.id)}
                      className="btn-ghost py-1.5"
                    >
                      Sửa
                    </button>
                    <NutXoaNhanSu id={n.id} />
                  </span>
                </li>
              )
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}

function FormNhanSu({
  nhanSu: n,
  xong,
}: {
  nhanSu?: NhanSu;
  xong: () => void;
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    async (p, fd) => {
      const kq = await luuNhanSu(p, fd);
      if (kq.ok) xong();
      return kq;
    },
    {}
  );

  return (
    <form action={formAction} className="card space-y-4 p-5 ring-2 ring-navy-300">
      {n && <input type="hidden" name="id" value={n.id} />}

      <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
        <AnhTaiLen
          name="photo"
          label="Ảnh chân dung"
          giaTriBanDau={n?.photo}
          tyLe="ngang"
        />
        <div className="space-y-3">
          <label className="block">
            <span className="lbl">Họ và tên *</span>
            <input name="name" className="inp" required defaultValue={n?.name ?? ""} />
          </label>
          <label className="block">
            <span className="lbl">Chức danh trong Chi hội *</span>
            <input
              name="title"
              className="inp"
              required
              defaultValue={n?.title ?? ""}
              placeholder="Ví dụ: Phó Chủ nhiệm · Trưởng Ban Hội viên"
            />
          </label>
          <label className="block">
            <span className="lbl">Ban *</span>
            <select name="group" className="inp" defaultValue={n?.group ?? ""}>
              <option value="">— Chọn ban —</option>
              {LEADER_GROUPS.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="lbl">Chức vụ tại doanh nghiệp</span>
          <input name="position" className="inp" defaultValue={n?.position ?? ""} />
        </label>
        <label className="block">
          <span className="lbl">Tên doanh nghiệp</span>
          <input name="company" className="inp" defaultValue={n?.company ?? ""} />
        </label>
        <label className="block">
          <span className="lbl">Nhiệm kỳ</span>
          <input
            name="term"
            className="inp"
            defaultValue={n?.term ?? "XII (2023 - 2026)"}
          />
        </label>
        <label className="block">
          <span className="lbl">Thứ tự hiển thị</span>
          <input
            name="order"
            type="number"
            className="inp"
            defaultValue={n?.order ?? 0}
          />
        </label>
      </div>

      <label className="block">
        <span className="lbl">Mã hồ sơ doanh nghiệp (nếu là hội viên)</span>
        <input
          name="memberSlug"
          className="inp"
          defaultValue={n?.memberSlug ?? ""}
          placeholder="Ví dụ: cong-ty-tnhh-dv-tktt-hoang-vy — để bấm vào thẻ mở được hồ sơ"
        />
      </label>

      <label className="flex items-center gap-2.5 rounded-lg bg-slate-50 p-3">
        <input
          type="checkbox"
          name="active"
          defaultChecked={n?.active ?? true}
          className="h-4 w-4"
        />
        <span className="text-sm font-medium text-navy-800">
          Hiện trên trang Ban Chủ nhiệm
        </span>
      </label>

      {state.error && (
        <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">{state.error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="btn-primary">
          {pending ? "Đang lưu..." : n ? "Lưu" : "Thêm nhân sự"}
        </button>
        <button type="button" onClick={xong} className="btn-ghost">
          Huỷ
        </button>
      </div>
    </form>
  );
}

function NutXoaNhanSu({ id }: { id: string }) {
  const [, formAction, pending] = useActionState<KetQua, FormData>(xoaNhanSu, {});
  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={(e) => {
        if (!confirm("Xoá nhân sự này khỏi trang Ban Chủ nhiệm?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="btn-ghost py-1.5 text-do-600">
        {pending ? "..." : "Xoá"}
      </button>
    </form>
  );
}
