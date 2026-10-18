"use client";

import Link from "next/link";
import { useActionState } from "react";
import AnhTaiLen from "@/components/AnhTaiLen";
import NhieuAnh from "@/components/NhieuAnh";
import { toDateInput } from "@/lib/format";
import {
  danhDauDaXuLy,
  doiTrangThaiHoSo,
  duyetVaKetNap,
  luuBaiViet,
  luuSuKien,
  xoaBaiViet,
  xoaSuKien,
  type KetQua,
} from "./actions";

// ── Tin tức ────────────────────────────────────────────

export type BaiValues = {
  id?: string;
  slug?: string;
  title?: string;
  type?: string;
  excerpt?: string | null;
  content?: string | null;
  coverImage?: string | null;
  featured?: boolean;
  published?: boolean;
};

export function FormBaiViet({ bai }: { bai?: BaiValues }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    luuBaiViet,
    {}
  );

  return (
    <form action={formAction} className="space-y-5">
      {bai?.id && <input type="hidden" name="id" value={bai.id} />}

      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 text-sm font-bold uppercase tracking-wide text-navy-700">
          Nội dung bài viết
        </legend>

        <label className="block">
          <span className="lbl">Tiêu đề *</span>
          <input
            name="title"
            className="inp"
            required
            minLength={8}
            defaultValue={bai?.title ?? ""}
          />
        </label>

        <label className="block">
          <span className="lbl">Loại bài</span>
          <select name="type" className="inp" defaultValue={bai?.type ?? "TIN_TUC"}>
            <option value="TIN_TUC">Tin tức</option>
            <option value="BAN_TIN">Bản tin hội viên</option>
            <option value="THONG_BAO">Thông báo</option>
          </select>
        </label>

        <label className="block">
          <span className="lbl">Tóm tắt</span>
          <textarea
            name="excerpt"
            rows={2}
            className="inp"
            defaultValue={bai?.excerpt ?? ""}
            placeholder="Câu dẫn hiện ở danh sách tin và khi chia sẻ lên Facebook"
          />
        </label>

        <label className="block">
          <span className="lbl">Nội dung *</span>
          <textarea
            name="content"
            rows={14}
            className="inp"
            required
            minLength={30}
            defaultValue={bai?.content ?? ""}
            placeholder="Cách một dòng trống để xuống đoạn mới."
          />
        </label>

        <AnhTaiLen
          name="coverImage"
          label="Ảnh bìa"
          giaTriBanDau={bai?.coverImage}
          tyLe="ngang"
        />
      </fieldset>

      <fieldset className="card space-y-3 p-5">
        <legend className="px-1 text-sm font-bold uppercase tracking-wide text-navy-700">
          Hiển thị
        </legend>
        <O ten="published" macDinh={bai?.published ?? false} nhan="Công bố lên website">
          Bỏ chọn để lưu nháp, chỉ Ban Chủ nhiệm xem được.
        </O>
        <O ten="featured" macDinh={bai?.featured ?? false} nhan="Đặt làm tin nổi bật">
          Tin nổi bật hiện to ở đầu trang /tin-tuc.
        </O>
      </fieldset>

      <Luu
        pending={pending}
        state={state}
        quayVe="/quan-tri/noi-dung/tin-tuc"
        xemHref={bai?.slug ? `/tin-tuc/${bai.slug}` : undefined}
        nhan={bai?.id ? "Lưu bài viết" : "Đăng bài"}
      />
    </form>
  );
}

export function NutXoaBai({ id }: { id: string }) {
  return <NutXoa action={xoaBaiViet} id={id} hoi="Xoá hẳn bài viết này?" />;
}

// ── Sự kiện ────────────────────────────────────────────

export type SuKienValues = {
  id?: string;
  slug?: string;
  title?: string;
  summary?: string | null;
  content?: string | null;
  location?: string | null;
  seriesName?: string | null;
  activityGroup?: string | null;
  coverImage?: string | null;
  gallery?: string | null;
  startAt?: Date;
  endAt?: Date | null;
  allowSignup?: boolean;
  capacity?: number | null;
  published?: boolean;
};

export function FormSuKien({
  suKien,
  cacChuongTrinh,
  cacMang,
}: {
  suKien?: SuKienValues;
  cacChuongTrinh: string[];
  cacMang: string[];
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    luuSuKien,
    {}
  );

  return (
    <form action={formAction} className="space-y-5">
      {suKien?.id && <input type="hidden" name="id" value={suKien.id} />}

      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 text-sm font-bold uppercase tracking-wide text-navy-700">
          Thông tin sự kiện
        </legend>

        <label className="block">
          <span className="lbl">Tên sự kiện *</span>
          <input
            name="title"
            className="inp"
            required
            defaultValue={suKien?.title ?? ""}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="lbl">Ngày diễn ra *</span>
            <input
              type="date"
              name="startAt"
              className="inp"
              required
              defaultValue={suKien?.startAt ? toDateInput(suKien.startAt) : ""}
            />
          </label>
          <label className="block">
            <span className="lbl">Ngày kết thúc</span>
            <input
              type="date"
              name="endAt"
              className="inp"
              defaultValue={suKien?.endAt ? toDateInput(suKien.endAt) : ""}
            />
            <span className="mt-1 block text-xs text-slate-500">
              Chỉ điền với sự kiện kéo dài nhiều ngày.
            </span>
          </label>
        </div>

        <label className="block">
          <span className="lbl">Địa điểm</span>
          <input
            name="location"
            className="inp"
            defaultValue={suKien?.location ?? ""}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="lbl">Chương trình định kỳ</span>
            <input
              name="seriesName"
              className="inp"
              list="chuong-trinh"
              defaultValue={suKien?.seriesName ?? ""}
              placeholder="Ví dụ: Coffee Share"
            />
            <datalist id="chuong-trinh">
              {cacChuongTrinh.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="block">
            <span className="lbl">Mảng hoạt động</span>
            <input
              name="activityGroup"
              className="inp"
              list="mang-hoat-dong"
              defaultValue={suKien?.activityGroup ?? ""}
            />
            <datalist id="mang-hoat-dong">
              {cacMang.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </label>
        </div>

        <label className="block">
          <span className="lbl">Tóm tắt</span>
          <input
            name="summary"
            className="inp"
            defaultValue={suKien?.summary ?? ""}
          />
        </label>

        <label className="block">
          <span className="lbl">Nội dung chi tiết</span>
          <textarea
            name="content"
            rows={8}
            className="inp"
            defaultValue={suKien?.content ?? ""}
            placeholder="Chương trình, khách mời, kết quả đạt được…"
          />
        </label>
      </fieldset>

      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 text-sm font-bold uppercase tracking-wide text-navy-700">
          Hình ảnh
        </legend>
        <AnhTaiLen
          name="coverImage"
          label="Ảnh bìa"
          giaTriBanDau={suKien?.coverImage}
          tyLe="ngang"
        />
        <NhieuAnh
          name="gallery"
          label="Album ảnh sự kiện"
          giaTriBanDau={suKien?.gallery}
          toiDa={40}
        />
      </fieldset>

      <fieldset className="card space-y-3 p-5">
        <legend className="px-1 text-sm font-bold uppercase tracking-wide text-navy-700">
          Đăng ký &amp; hiển thị
        </legend>
        <O
          ten="published"
          macDinh={suKien?.published ?? true}
          nhan="Hiện trên website"
        />
        <O
          ten="allowSignup"
          macDinh={suKien?.allowSignup ?? false}
          nhan="Cho đăng ký tham dự trên web"
        >
          Chỉ có tác dụng với sự kiện chưa diễn ra.
        </O>
        <label className="block max-w-xs">
          <span className="lbl">Giới hạn số người</span>
          <input
            name="capacity"
            type="number"
            min={0}
            className="inp"
            defaultValue={suKien?.capacity ?? ""}
            placeholder="Để trống nếu không giới hạn"
          />
        </label>
      </fieldset>

      <Luu
        pending={pending}
        state={state}
        quayVe="/quan-tri/noi-dung/su-kien"
        xemHref={suKien?.slug ? `/su-kien/${suKien.slug}` : undefined}
        nhan={suKien?.id ? "Lưu sự kiện" : "Tạo sự kiện"}
      />
    </form>
  );
}

export function NutXoaSuKien({ id }: { id: string }) {
  return (
    <NutXoa
      action={xoaSuKien}
      id={id}
      hoi="Xoá hẳn sự kiện này? Ảnh trong thư mục public vẫn còn."
    />
  );
}

// ── Hồ sơ đăng ký & tin nhắn ───────────────────────────

export function DoiTrangThai({
  id,
  hienTai,
}: {
  id: string;
  hienTai: string;
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    doiTrangThaiHoSo,
    {}
  );

  const CHON = [
    ["MOI", "Mới"],
    ["DANG_XU_LY", "Đang xử lý"],
    ["DA_DUYET", "Đã duyệt"],
    ["TU_CHOI", "Từ chối"],
  ] as const;

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select
        name="trangThai"
        defaultValue={hienTai}
        className="inp w-auto py-1.5 text-sm"
      >
        {CHON.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <input
        name="ghiChu"
        className="inp w-auto flex-1 py-1.5 text-sm"
        placeholder="Ghi chú xử lý"
      />
      <button disabled={pending} className="btn-ghost py-1.5">
        {pending ? "..." : "Lưu"}
      </button>
      {state.error && <span className="text-xs text-do-600">{state.error}</span>}
    </form>
  );
}

/**
 * Duyệt hồ sơ đăng ký và kết nạp luôn: tạo hồ sơ hội viên + tài khoản đăng nhập.
 * Mật khẩu ban đầu hiện MỘT LẦN trong khung xanh — phải chép lại ngay.
 */
export function NutKetNap({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    duyetVaKetNap,
    {}
  );

  if (state.ok) {
    return (
      <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-300">
        <p className="font-bold">✓ Kết nạp thành công</p>
        <p className="mt-1 leading-relaxed">{state.message}</p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={(e) => {
        if (
          !confirm(
            "Kết nạp doanh nghiệp này thành hội viên chính thức?\n\nHệ thống sẽ tạo hồ sơ hội viên + tài khoản đăng nhập, và hiện mật khẩu MỘT LẦN để gửi cho họ."
          )
        )
          e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="btn-primary py-1.5">
        {pending ? "Đang kết nạp..." : "✓ Kết nạp thành hội viên"}
      </button>
      {state.error && (
        <p className="mt-2 rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function NutDaXuLy({ id, daXuLy }: { id: string; daXuLy: boolean }) {
  const [, formAction, pending] = useActionState<KetQua, FormData>(
    danhDauDaXuLy,
    {}
  );
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        disabled={pending}
        className={
          daXuLy ? "btn-ghost py-1.5" : "btn-primary py-1.5"
        }
      >
        {pending ? "..." : daXuLy ? "Đánh dấu chưa xử lý" : "Đánh dấu đã xử lý"}
      </button>
    </form>
  );
}

// ── Mảnh dùng chung ────────────────────────────────────

function O({
  ten,
  macDinh,
  nhan,
  children,
}: {
  ten: string;
  macDinh: boolean;
  nhan: string;
  children?: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-3">
      <input
        type="checkbox"
        name={ten}
        defaultChecked={macDinh}
        className="mt-0.5 h-4 w-4"
      />
      <span className="text-sm">
        <strong className="text-navy-800">{nhan}</strong>
        {children && (
          <span className="mt-0.5 block text-slate-600">{children}</span>
        )}
      </span>
    </label>
  );
}

function Luu({
  pending,
  state,
  quayVe,
  xemHref,
  nhan,
}: {
  pending: boolean;
  state: KetQua;
  quayVe: string;
  xemHref?: string;
  nhan: string;
}) {
  return (
    <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-navy-100 bg-white/95 py-3 backdrop-blur">
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Đang lưu..." : nhan}
      </button>
      <Link href={quayVe} className="btn-ghost">
        Quay lại
      </Link>
      {xemHref && (
        <a
          href={xemHref}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-navy-600 hover:underline"
        >
          Xem trên web ↗
        </a>
      )}
      {state.error && <p className="text-sm font-medium text-do-600">{state.error}</p>}
      {state.ok && (
        <p className="text-sm font-medium text-emerald-700">{state.message}</p>
      )}
    </div>
  );
}

function NutXoa({
  action,
  id,
  hoi,
}: {
  action: (p: KetQua, fd: FormData) => Promise<KetQua>;
  id: string;
  hoi: string;
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    action,
    {}
  );
  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={(e) => {
        if (!confirm(hoi)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="btn-ghost py-1.5 text-do-600">
        {pending ? "..." : "Xoá"}
      </button>
      {state.error && <span className="ml-2 text-xs text-do-600">{state.error}</span>}
    </form>
  );
}
