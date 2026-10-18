"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { DuLieuMuc } from "@/lib/ngoi-nha/cai-dat";
import type { NoiDungHuongDan } from "@/lib/ngoi-nha/cai-dat/noi-dung-sua";
import { choXemLaiHuongDan } from "./actions-giao-dien";
import KhungCaiDat from "./KhungCaiDat";
import { OChu, ThongBao } from "./truong";

/** Biểu tượng mỗi bước cố định trong game (HuongDan.tsx) — ghi ra để Ban hình dung. */
const HINH_BUOC = ["ngôi nhà", "tấm khiên", "bàn tay"];

type KetQua = Awaited<ReturnType<typeof choXemLaiHuongDan>>;

/** Trình sửa 3 bước hướng dẫn người mới + nút cho mọi người xem lại. */
export default function GiaoDienSuaHuongDan({
  du,
  dangBat,
  soDaXem,
}: {
  du: DuLieuMuc<NoiDungHuongDan>;
  /** Công tắc "Hướng dẫn cho người mới" ở tab Bật / tắt tính năng */
  dangBat: boolean;
  /** Số người chơi đã xem hoặc bỏ qua hướng dẫn */
  soDaXem: number;
}) {
  const router = useRouter();
  const [kq, setKq] = useState<KetQua>({});
  const [dang, startTransition] = useTransition();

  return (
    <div className="max-w-3xl space-y-4">
      {!dangBat && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Hướng dẫn người mới đang <b>tắt</b> ở tab Bật / tắt tính năng — sửa ở
          đây vẫn lưu, nhưng người chơi chưa thấy cho tới khi bật lại.
        </div>
      )}

      <KhungCaiDat
        muc="huongDan"
        nhom={["buoc"]}
        giaTri={du.giaTri}
        macDinh={du.macDinh}
        tieuDe="Hướng dẫn người mới (3 bước)"
        moTa="Hiện một lần khi hội viên vào game lần đầu, trước mọi thứ khác. Viết ngắn — đọc trên điện thoại."
      >
        {(v, sua) => (
          <ol className="space-y-3">
            {v.buoc.map((b, i) => (
              <li
                key={i}
                className="space-y-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs">
                  <b className="text-navy-700">Bước {i + 1}</b>
                  <span className="text-slate-500">
                    Biểu tượng: {HINH_BUOC[i] ?? "cố định"}
                  </span>
                </div>
                <OChu
                  nhan="Tiêu đề"
                  giaTri={b.tieuDe}
                  dai={80}
                  onDoi={(s) =>
                    sua((x) => ({
                      ...x,
                      buoc: x.buoc.map((y, j) =>
                        j === i ? { ...y, tieuDe: s } : y,
                      ),
                    }))
                  }
                />
                <OChu
                  nhan="Nội dung"
                  giaTri={b.noiDung}
                  dai={600}
                  nhieuDong={5}
                  goiY="Để trống thì dùng nội dung mặc định. Xuống dòng được giữ nguyên."
                  onDoi={(s) =>
                    sua((x) => ({
                      ...x,
                      buoc: x.buoc.map((y, j) =>
                        j === i ? { ...y, noiDung: s } : y,
                      ),
                    }))
                  }
                />
              </li>
            ))}
          </ol>
        )}
      </KhungCaiDat>

      <div className="card space-y-2 p-4 sm:p-5">
        <h2 className="font-semibold text-navy-800">
          Cho mọi người xem lại hướng dẫn
        </h2>
        <p className="text-sm text-slate-500">
          Hiện có <b>{soDaXem}</b> người chơi đã xem hoặc bỏ qua hướng dẫn. Bấm
          nút này (thường sau khi soạn lại nội dung) để họ thấy lại ở lần vào
          game kế tiếp.
        </p>
        <ThongBao kq={kq} />
        <button
          type="button"
          disabled={dang}
          className="btn-ghost min-h-11"
          onClick={() => {
            if (
              !confirm(
                `Cho ${soDaXem} người chơi xem lại hướng dẫn ở lần vào game kế tiếp?`,
              )
            )
              return;
            startTransition(async () => {
              const r = await choXemLaiHuongDan();
              setKq(r);
              if (r.ok) router.refresh();
            });
          }}
        >
          {dang ? "Đang bật lại…" : "Cho mọi người xem lại hướng dẫn"}
        </button>
      </div>
    </div>
  );
}
