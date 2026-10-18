"use client";

/**
 * Nút thao tác nhanh trên một người chơi: ẩn / hiện khỏi bảng xếp hạng, cho
 * xem lại hướng dẫn, đóng lượt bỏ dở quá 6 giờ. Gọi server action trong
 * transition rồi làm mới trang để số liệu, nhãn đổi theo.
 */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  anHienXepHang,
  dongLuotBoDo,
  xemLaiHuongDan,
  type KetQuaNguoiChoi,
} from "./actions-nguoi-choi";
import { ThongBao } from "./truong";

function useThaoTac() {
  const router = useRouter();
  const [kq, setKq] = useState<KetQuaNguoiChoi>({});
  const [dang, startTransition] = useTransition();
  const chay = (fn: () => Promise<KetQuaNguoiChoi>) =>
    startTransition(async () => {
      setKq({});
      const r = await fn();
      setKq(r);
      if (r.ok) router.refresh();
    });
  return { kq, dang, chay };
}

/** Nút ẩn / hiện khỏi bảng xếp hạng — dùng ở cả danh sách lẫn trang chi tiết. */
export function NutAnXepHangNguoiChoi({
  userId,
  dangAn,
  hienThongBao,
}: {
  userId: string;
  dangAn: boolean;
  /** Trang chi tiết hiện cả câu báo thành công; danh sách chỉ hiện lỗi */
  hienThongBao?: boolean;
}) {
  const { kq, dang, chay } = useThaoTac();
  return (
    <div className="space-y-1.5">
      <button
        type="button"
        disabled={dang}
        onClick={() => chay(() => anHienXepHang(userId, !dangAn))}
        className="btn-ghost min-h-11"
      >
        {dang ? "Đang lưu…" : dangAn ? "Hiện lại trên BXH" : "Ẩn khỏi BXH"}
      </button>
      {hienThongBao ? (
        <ThongBao kq={kq} />
      ) : (
        kq.error && <p className="text-xs text-do-700">{kq.error}</p>
      )}
    </div>
  );
}

export function NutXemLaiHuongDan({
  userId,
  daXem,
}: {
  userId: string;
  daXem: boolean;
}) {
  const { kq, dang, chay } = useThaoTac();
  return (
    <div className="space-y-1.5">
      <button
        type="button"
        disabled={dang || !daXem}
        onClick={() => chay(() => xemLaiHuongDan(userId))}
        className="btn-ghost min-h-11"
      >
        {dang ? "Đang lưu…" : "Cho xem lại hướng dẫn"}
      </button>
      {!daXem && !kq.message && (
        <p className="text-xs text-slate-500">
          Người này chưa xem (hoặc đã được bật lại) — lần vào game tới sẽ hiện
          hướng dẫn.
        </p>
      )}
      <ThongBao kq={kq} />
    </div>
  );
}

/** Đóng các lượt bỏ dở quá 6 giờ — bấm hai lần để chắc chắn. */
export function NutDongLuotBoDo({
  userId,
  soLuot,
}: {
  userId: string;
  soLuot: number;
}) {
  const { kq, dang, chay } = useThaoTac();
  const [hoi, setHoi] = useState(false);
  if (!soLuot && !kq.message) return null;
  return (
    <div className="space-y-1.5">
      {soLuot > 0 &&
        (hoi ? (
          <div className="space-y-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
            <p>
              Chốt {soLuot} lượt theo số câu đã trả lời (câu chưa làm tính là
              sai). Người chơi không làm tiếp được các lượt này.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={dang}
                onClick={() => {
                  setHoi(false);
                  chay(() => dongLuotBoDo(userId));
                }}
                className="btn-danger min-h-11"
              >
                Đóng {soLuot} lượt
              </button>
              <button
                type="button"
                disabled={dang}
                onClick={() => setHoi(false)}
                className="btn-ghost min-h-11"
              >
                Thôi
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={dang}
            onClick={() => setHoi(true)}
            className="btn-ghost min-h-11"
          >
            {dang ? "Đang đóng…" : `Đóng ${soLuot} lượt bỏ dở quá 6 giờ`}
          </button>
        ))}
      <ThongBao kq={kq} />
    </div>
  );
}
