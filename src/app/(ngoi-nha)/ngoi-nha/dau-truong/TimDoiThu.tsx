"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BieuTuong from "@/components/ngoi-nha/BieuTuong";
import { am } from "@/components/ngoi-nha/am-thanh";
import { chuCaiTen, soDep } from "@/lib/ngoi-nha/luat";
import type { DoiThu } from "@/lib/ngoi-nha/dau-truong";
import { aTaoTranDau, aTimDoiThu } from "../actions";

/**
 * Chọn bộ câu + tìm đối thủ + nút thách đấu. Luôn hỏi máy chủ, mỗi lần 20 người
 * gần đúng nhất; ô tìm trống thì gợi ý người đang dẫn đầu mùa. Tìm được cả tài
 * khoản không gắn hội viên (Thư ký, văn phòng…) nếu họ đã vào game.
 * `doiThuChon`: người được bấm "Thách" từ bảng xếp hạng — hiện sẵn ở đầu.
 */
export default function TimDoiThu({
  boCau,
  doiThuChon,
}: {
  boCau: { ma: string; ten: string }[];
  doiThuChon: DoiThu | null;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [ds, setDs] = useState<DoiThu[]>([]);
  const [dangTim, setDangTim] = useState(true);
  const [dangThach, setDangThach] = useState("");
  const [loi, setLoi] = useState("");
  const [bo, setBo] = useState(boCau[0]?.ma ?? "");

  useEffect(() => {
    let huy = false;
    const t = setTimeout(async () => {
      setDangTim(true);
      try {
        const r = await aTimDoiThu(q);
        if (huy) return;
        setDs(r.ok ? r.data : []);
        setLoi(r.ok ? "" : r.loi);
      } catch {
        if (!huy) setLoi("Mạng chập chờn, chưa tìm được — thử gõ lại nhé");
      } finally {
        if (!huy) setDangTim(false);
      }
    }, 250);
    return () => {
      huy = true;
      clearTimeout(t);
    };
  }, [q]);

  async function thach(userId: string) {
    am.bam();
    setDangThach(userId);
    setLoi("");
    try {
      const r = await aTaoTranDau(userId, bo);
      if (!r.ok) {
        setLoi(r.loi);
        setDangThach("");
        return;
      }
      router.push(`/ngoi-nha/dau-truong/${r.data}`);
    } catch {
      setLoi("Mạng chập chờn, chưa mở được trận — bấm lại nhé");
      setDangThach("");
    }
  }

  const dong = (d: DoiThu, noiBat = false) => (
    <div
      key={d.userId}
      className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 ${noiBat ? "bg-son-50 ring-2 ring-son-400" : "bg-nga-50"}`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-navy-600 text-sm font-bold text-white">
        {d.anh ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.anh} alt="" className="h-full w-full object-cover" />
        ) : (
          chuCaiTen(d.ten)
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{d.ten}</span>
        <span className="block truncate text-xs text-slate-500">
          {[
            d.congTy,
            d.diem > 0 ? `${soDep(d.diem)} điểm` : null,
            d.tranThang > 0 ? `${d.tranThang} trận thắng` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
      <button
        type="button"
        disabled={dangThach !== ""}
        onClick={() => thach(d.userId)}
        className="flex min-h-10 shrink-0 items-center gap-1 rounded-full bg-son-600 px-3 text-xs font-bold text-white hover:bg-son-700 disabled:opacity-50"
      >
        <BieuTuong ten="tia" dac className="h-3.5 w-3.5" />{" "}
        {dangThach === d.userId ? "Đang mở…" : "Thách đấu"}
      </button>
    </div>
  );

  return (
    <div
      id="thach"
      className="space-y-3 rounded-3xl bg-white p-3 text-navy-900"
    >
      <label className="block">
        <span className="lbl">Bộ câu hỏi</span>
        <select
          value={bo}
          onChange={(e) => setBo(e.target.value)}
          className="inp text-base"
        >
          {boCau.map((b) => (
            <option key={b.ma} value={b.ma}>
              {b.ten}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-slate-500">
          Máy ưu tiên bộ hai người chưa gặp. Tên bộ hiện trong trang trận đấu.
        </span>
      </label>

      {doiThuChon && (
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-son-700">
            Đối thủ bạn vừa chọn
          </div>
          {dong(doiThuChon, true)}
        </div>
      )}

      <div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm tên người chơi hoặc doanh nghiệp…"
          className="inp text-base"
          autoComplete="off"
        />
        {loi && (
          <p
            className="mt-2 rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700"
            role="alert"
          >
            {loi}
          </p>
        )}
        {!q && ds.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            Gợi ý: người có điểm cao mùa này
          </p>
        )}
        <div className="mt-2 max-h-80 space-y-1.5 overflow-y-auto pr-1">
          {dangTim && ds.length === 0 && (
            <p className="py-3 text-center text-sm text-slate-400">Đang tìm…</p>
          )}
          {!dangTim && ds.length === 0 && (
            <p className="py-3 text-center text-sm text-slate-400">
              Không tìm thấy người chơi phù hợp.
            </p>
          )}
          {ds
            .filter((d) => d.userId !== doiThuChon?.userId)
            .map((d) => dong(d))}
        </div>
      </div>
    </div>
  );
}
