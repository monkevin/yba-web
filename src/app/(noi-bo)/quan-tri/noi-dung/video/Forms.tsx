"use client";

import { useActionState, useState } from "react";
import { luuVideo, xoaVideo, napTuYoutube, type KetQuaVideo } from "./actions";

type Video = {
  id: string;
  youtubeId: string;
  title: string;
  summary: string | null;
  publishedAt: Date | null;
  featured: boolean;
  published: boolean;
};

function Thong({ state }: { state: KetQuaVideo }) {
  if (state.error)
    return (
      <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        {state.ok}
      </p>
    );
  return null;
}

/** Ô thêm video mới bằng cách dán đường dẫn YouTube. */
export function FormThemVideo() {
  const [state, formAction, pending] = useActionState<KetQuaVideo, FormData>(
    luuVideo,
    {}
  );

  return (
    <form action={formAction} className="card space-y-4 p-5">
      <h2 className="font-bold text-navy-800">Thêm video từ YouTube</h2>
      <Thong state={state} />

      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          Đường dẫn video YouTube
        </span>
        <input
          name="link"
          className="inp mt-1"
          required
          placeholder="https://www.youtube.com/watch?v=..."
        />
        <span className="mt-1 block text-xs text-slate-500">
          Mở video trên YouTube, bấm Chia sẻ hoặc copy đường dẫn trên thanh địa
          chỉ rồi dán vào đây.
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Tiêu đề</span>
        <input name="title" className="inp mt-1" required maxLength={200} />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          Mô tả ngắn (không bắt buộc)
        </span>
        <input name="summary" className="inp mt-1" maxLength={300} />
      </label>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked className="h-4 w-4" />
          Hiện trên website
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" className="h-4 w-4" />
          Ghim lên đầu
        </label>
      </div>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Đang lưu…" : "+ Thêm video"}
      </button>
    </form>
  );
}

/** Nút lấy tự động 15 video mới nhất từ kênh. */
export function NutNapYoutube() {
  const [state, datState] = useState<KetQuaVideo>({});
  const [dangChay, datDangChay] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={dangChay}
        onClick={async () => {
          datDangChay(true);
          datState(await napTuYoutube());
          datDangChay(false);
        }}
        className="btn-ghost"
      >
        {dangChay ? "Đang lấy…" : "⟳ Lấy video mới từ kênh"}
      </button>
      <Thong state={state} />
    </div>
  );
}

/** Sửa nhanh một video đã có trong danh sách. */
export function FormSuaVideo({ v }: { v: Video }) {
  const [mo, datMo] = useState(false);
  const [state, formAction, pending] = useActionState<KetQuaVideo, FormData>(
    luuVideo,
    {}
  );

  if (!mo) {
    return (
      <button type="button" onClick={() => datMo(true)} className="btn-ghost py-1.5">
        Sửa
      </button>
    );
  }

  return (
    <form action={formAction} className="w-full space-y-3 border-t border-navy-100 pt-3">
      <input type="hidden" name="id" value={v.id} />
      <input type="hidden" name="link" value={v.youtubeId} />
      <Thong state={state} />

      <input
        name="title"
        className="inp"
        defaultValue={v.title}
        required
        maxLength={200}
      />
      <input
        name="summary"
        className="inp"
        defaultValue={v.summary ?? ""}
        placeholder="Mô tả ngắn"
        maxLength={300}
      />
      <input
        type="date"
        name="publishedAt"
        className="inp"
        defaultValue={
          v.publishedAt ? v.publishedAt.toISOString().slice(0, 10) : ""
        }
      />
      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="published"
            defaultChecked={v.published}
            className="h-4 w-4"
          />
          Hiện trên website
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={v.featured}
            className="h-4 w-4"
          />
          Ghim lên đầu
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="btn-primary py-1.5">
          {pending ? "Đang lưu…" : "Lưu"}
        </button>
        <button
          type="button"
          onClick={() => datMo(false)}
          className="btn-ghost py-1.5"
        >
          Đóng
        </button>
      </div>
    </form>
  );
}

/** Xoá video khỏi website (video trên YouTube vẫn còn). */
export function NutXoaVideo({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<KetQuaVideo, FormData>(
    xoaVideo,
    {}
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Gỡ video này khỏi website? Video trên YouTube vẫn còn.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="btn-ghost py-1.5 text-do-600"
      >
        {pending ? "…" : "Gỡ"}
      </button>
      {state.error && (
        <span className="ml-2 text-xs text-do-600">{state.error}</span>
      )}
    </form>
  );
}
