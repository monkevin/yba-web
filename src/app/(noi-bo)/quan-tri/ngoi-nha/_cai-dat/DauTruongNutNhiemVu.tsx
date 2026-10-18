"use client";

/**
 * Nút Ban xác nhận / từ chối một yêu cầu Nhiệm vụ Huynh đệ (kể cả xử lý hộ
 * yêu cầu hội viên liên quan để quá lâu). Từ chối bắt buộc có lý do — hội viên
 * sẽ thấy. Ô lý do là state có điều khiển, lỗi không làm mất chữ đã gõ.
 */
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { xuLyNhiemVuBan, type KetQuaDauTruong } from "./actions-dau-truong";
import { INP } from "./truong";

export default function DauTruongNutNhiemVu({
  id,
  hoHoiVien = false,
}: {
  id: string;
  /** Xử lý hộ hội viên liên quan (đổi chữ trên nút cho rõ) */
  hoHoiVien?: boolean;
}) {
  const router = useRouter();
  const oLyDo = useId();
  const [tuChoi, setTuChoi] = useState(false);
  const [lyDo, setLyDo] = useState("");
  const [kq, setKq] = useState<KetQuaDauTruong>({});
  const [dangLam, startTransition] = useTransition();

  const gui = (dongY: boolean) => {
    setKq({});
    startTransition(async () => {
      const r = await xuLyNhiemVuBan(id, dongY, dongY ? "" : lyDo);
      setKq(r);
      if (r.ok) router.refresh();
    });
  };

  if (kq.ok)
    return <p className="text-sm font-medium text-emerald-700">{kq.message}</p>;

  return (
    <div className="space-y-2">
      {tuChoi ? (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            gui(false);
          }}
        >
          <label htmlFor={oLyDo} className="block">
            <span className="lbl">Lý do (hội viên sẽ thấy)</span>
            <input
              id={oLyDo}
              className={INP}
              value={lyDo}
              maxLength={500}
              onChange={(e) => setLyDo(e.target.value)}
              placeholder={
                hoHoiVien
                  ? "Ban đã hỏi hội viên liên quan, chưa đúng việc"
                  : "Chưa đủ minh chứng, bổ sung ảnh giúp Ban"
              }
              autoFocus
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={dangLam || !lyDo.trim()}
              className="btn-danger min-h-11"
            >
              {dangLam ? "Đang gửi…" : hoHoiVien ? "Từ chối hộ" : "Từ chối"}
            </button>
            <button
              type="button"
              onClick={() => setTuChoi(false)}
              className="btn-ghost min-h-11"
            >
              Thôi
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={dangLam}
            onClick={() => gui(true)}
            className="btn-primary min-h-11"
          >
            {dangLam
              ? "Đang xử lý…"
              : hoHoiVien
                ? "Ban xác nhận hộ"
                : "Xác nhận"}
          </button>
          <button
            type="button"
            onClick={() => {
              setKq({});
              setTuChoi(true);
            }}
            className="btn-ghost min-h-11 text-do-600"
          >
            {hoHoiVien ? "Từ chối hộ" : "Từ chối"}
          </button>
        </div>
      )}
      {kq.error && <p className="text-sm text-do-600">{kq.error}</p>}
    </div>
  );
}
