"use client";

/**
 * Nút thao tác một phiên Đấu trí: mở, đóng (hỏi lại), mở lại phiên đã đóng,
 * xoá phiên chưa ai chơi (hỏi lại). Bấm lần 1 để hiện nút xác nhận — không
 * dùng `confirm()` vì hộp thoại trình duyệt trên điện thoại dễ bấm nhầm.
 */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  doiPhienDauTri,
  xoaPhienDauTri,
  type KetQuaDauTruong,
} from "./actions-dau-truong";

type Viec = "mo" | "dong" | "moLai" | "xoa";

const NUT = "min-h-11 rounded-lg px-3 text-sm font-medium disabled:opacity-50";

export default function DauTruongNutPhien({
  id,
  trangThai,
  soNguoi,
}: {
  id: string;
  trangThai: string;
  soNguoi: number;
}) {
  const router = useRouter();
  const [hoi, setHoi] = useState<Viec | null>(null);
  const [kq, setKq] = useState<KetQuaDauTruong>({});
  const [dangLam, startTransition] = useTransition();

  const lam = (viec: Viec) => {
    setKq({});
    setHoi(null);
    startTransition(async () => {
      const r =
        viec === "xoa"
          ? await xoaPhienDauTri(id)
          : await doiPhienDauTri(id, viec);
      setKq(r);
      if (r.ok) router.refresh();
    });
  };

  if (hoi) {
    return (
      <div className="flex w-full flex-wrap items-center gap-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-900 ring-1 ring-amber-200 sm:w-auto">
        <span>
          {hoi === "dong"
            ? "Đóng phiên? Ai chưa vào sẽ không vào được nữa."
            : "Xoá hẳn phiên này?"}
        </span>
        <button
          type="button"
          disabled={dangLam}
          onClick={() => lam(hoi)}
          className={`${NUT} bg-do-600 text-white hover:bg-do-700`}
        >
          {hoi === "dong" ? "Đóng phiên" : "Xoá phiên"}
        </button>
        <button
          type="button"
          onClick={() => setHoi(null)}
          className={`${NUT} bg-white ring-1 ring-slate-200`}
        >
          Thôi
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {trangThai === "SAP_MO" && (
        <button
          type="button"
          disabled={dangLam}
          onClick={() => lam("mo")}
          className={`${NUT} bg-navy-600 text-white hover:bg-navy-700`}
        >
          {dangLam ? "…" : "Mở phiên"}
        </button>
      )}
      {trangThai === "DANG_MO" && (
        <button
          type="button"
          disabled={dangLam}
          onClick={() => setHoi("dong")}
          className={`${NUT} bg-do-600 text-white hover:bg-do-700`}
        >
          {dangLam ? "…" : "Đóng phiên"}
        </button>
      )}
      {trangThai === "DA_DONG" && (
        <button
          type="button"
          disabled={dangLam}
          onClick={() => lam("moLai")}
          className={`${NUT} bg-white text-navy-700 ring-1 ring-navy-200 hover:bg-navy-50`}
        >
          {dangLam ? "…" : "Mở lại"}
        </button>
      )}
      {trangThai !== "DANG_MO" && soNguoi === 0 && (
        <button
          type="button"
          disabled={dangLam}
          onClick={() => setHoi("xoa")}
          className={`${NUT} text-do-600 ring-1 ring-do-200 hover:bg-do-50`}
        >
          Xoá
        </button>
      )}
      {kq.error && <p className="w-full text-sm text-do-600">{kq.error}</p>}
      {kq.message && (
        <p className="w-full text-sm text-emerald-700">{kq.message}</p>
      )}
    </div>
  );
}
