"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CAC_NGUON,
  TEN_NGUON,
  thuocNguon,
  type DongTrung,
  type NguonQuay,
  type UngVienQuay,
} from "@/lib/boc-tham-1010";
import { huyTrung, quayBocTham, type KetQuaQuay } from "./actions";

/**
 * MÁY QUAY BỐC THĂM — màn hình chiếu lên sân khấu Gala 10/10. Hiệu ứng
 * chạy tên lấy từ danh sách ứng viên truyền xuống (chỉ để trình diễn);
 * NGƯỜI TRÚNG THẬT do máy chủ chọn trong action `quayBocTham`. Nút
 * "Toàn màn hình" đưa riêng khung sân khấu lên máy chiếu.
 */

const CHO_HIEU_UNG_MS = 2600;

export default function MayQuay({
  ung,
  daTrung,
}: {
  ung: UngVienQuay[];
  daTrung: DongTrung[];
}) {
  const router = useRouter();
  const khung = useRef<HTMLDivElement>(null);
  const dangChay = useRef<ReturnType<typeof setInterval> | null>(null);

  const [giai, setGiai] = useState("");
  const [nguon, setNguon] = useState<NguonQuay>("GALA");
  const [caBTC, setCaBTC] = useState(false);
  const [hienDieuKhien, setHienDieuKhien] = useState(true);
  const [dangQuay, setDangQuay] = useState(false);
  const [tenChay, setTenChay] = useState<string | null>(null);
  const [ketQua, setKetQua] = useState<KetQuaQuay | null>(null);

  useEffect(() => {
    return () => {
      if (dangChay.current) clearInterval(dangChay.current);
    };
  }, []);

  const pool = ung.filter((u) => thuocNguon(u, nguon, caBTC));
  const demNguon = (n: NguonQuay) =>
    ung.filter((u) => thuocNguon(u, n, caBTC)).length;

  async function quay(thu: boolean) {
    if (dangQuay) return;
    setDangQuay(true);
    setKetQua(null);

    // Hiệu ứng chạy tên trong lúc chờ máy chủ chọn người trúng thật
    if (pool.length > 0) {
      dangChay.current = setInterval(() => {
        setTenChay(pool[Math.floor(Math.random() * pool.length)].ten);
      }, 75);
    }
    const [kq] = await Promise.all([
      quayBocTham(giai, nguon, caBTC, thu),
      new Promise((r) => setTimeout(r, pool.length > 0 ? CHO_HIEU_UNG_MS : 300)),
    ]);
    if (dangChay.current) {
      clearInterval(dangChay.current);
      dangChay.current = null;
    }
    setTenChay(null);
    setKetQua(kq);
    setDangQuay(false);
    if (kq.kieu === "TRUNG" && !kq.thu) router.refresh();
  }

  function toanManHinh() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void khung.current?.requestFullscreen();
  }

  return (
    <div>
      {/* Hiệu ứng riêng của máy quay — tự tắt khi bật "giảm chuyển động" */}
      <style>{`
        @keyframes bt-bung { 0% { transform: scale(.55); opacity: 0 } 60% { transform: scale(1.06) } 100% { transform: scale(1); opacity: 1 } }
        @keyframes bt-tho { 0%,100% { opacity: .35 } 50% { opacity: .9 } }
        .bt-bung { animation: bt-bung .55s ease-out }
        .bt-tho { animation: bt-tho 2.2s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .bt-bung, .bt-tho { animation: none } }
        .bt-khung:fullscreen { border-radius: 0; display: flex; flex-direction: column; justify-content: center }
      `}</style>

      {/* ───────────── SÂN KHẤU (phần đưa lên máy chiếu) ───────────── */}
      <div
        ref={khung}
        className="bt-khung relative overflow-hidden rounded-2xl bg-[#0b1230] px-4 py-10 text-center text-white sm:px-8"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 50% -20%, rgba(212,175,55,.28), transparent 55%), radial-gradient(ellipse at 50% 120%, rgba(46,64,130,.55), transparent 60%)",
        }}
      >
        <button
          type="button"
          onClick={() => setHienDieuKhien((h) => !h)}
          title={hienDieuKhien ? "Ẩn hàng điều khiển (khi chiếu)" : "Hiện điều khiển"}
          className="absolute top-3 left-3 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/20"
        >
          {hienDieuKhien ? "Ẩn điều khiển" : "⚙"}
        </button>
        <button
          type="button"
          onClick={toanManHinh}
          className="absolute top-3 right-3 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/20"
        >
          ⛶ Toàn màn hình
        </button>

        <p className="text-xs font-semibold tracking-[.35em] text-amber-200/80 uppercase">
          Lễ chuyển giao 10.10.2026 · YBA Chợ Lớn
        </p>
        <h2 className="mt-2 text-3xl font-extrabold text-amber-300 sm:text-5xl">
          🎁 Bốc thăm may mắn
        </h2>
        <p className="mt-1 min-h-6 text-sm text-white/70 sm:text-base">
          {(ketQua?.kieu === "TRUNG" ? ketQua.giai : giai.trim()) ||
            "Quà may mắn"}{" "}
          · {TEN_NGUON[nguon]}
          {caBTC ? " (tính cả ê-kíp BTC)" : ""}
        </p>

        {/* Khung tên */}
        <div className="mx-auto mt-6 flex min-h-36 max-w-3xl items-center justify-center rounded-2xl border border-amber-300/30 bg-white/5 px-4 py-6 sm:min-h-44">
          {dangQuay && tenChay ? (
            <p className="text-3xl font-extrabold text-white/90 sm:text-6xl">
              {tenChay}
            </p>
          ) : ketQua?.kieu === "TRUNG" ? (
            <div className="bt-bung">
              <p className="text-3xl font-extrabold text-amber-300 drop-shadow-[0_0_24px_rgba(212,175,55,.45)] sm:text-6xl">
                🎉 {ketQua.ten}
              </p>
              {ketQua.moTa && (
                <p className="mt-2 text-base text-white/80 sm:text-xl">{ketQua.moTa}</p>
              )}
              {ketQua.thu && (
                <p className="mt-2 inline-block rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-200">
                  QUAY THỬ — chưa ghi kết quả
                </p>
              )}
            </div>
          ) : ketQua ? (
            <p className="max-w-xl text-base text-amber-100/90 sm:text-lg">
              {ketQua.thongBao}
            </p>
          ) : (
            <p className="bt-tho text-xl font-semibold text-white/50 sm:text-3xl">
              {pool.length > 0
                ? `${pool.length} khách đã check-in đang chờ quay…`
                : "Chưa có ai trong nguồn quay — khách check-in là có tên"}
            </p>
          )}
        </div>

        {/* Hàng điều khiển của người dẫn chương trình */}
        {hienDieuKhien && (
          <div className="mx-auto mt-6 max-w-3xl space-y-3 text-left">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-white/60">
                  Tên giải (hiện khi xướng tên)
                </span>
                <input
                  value={giai}
                  onChange={(e) => setGiai(e.target.value)}
                  placeholder="vd: Giải nhất — 1 bộ vest Mon Amie"
                  className="min-h-12 w-full rounded-xl border border-white/20 bg-white/95 px-3 text-base text-navy-900"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-white/60">
                  Nguồn quay (vé = lượt check-in)
                </span>
                <select
                  value={nguon}
                  onChange={(e) => setNguon(e.target.value as NguonQuay)}
                  className="min-h-12 w-full rounded-xl border border-white/20 bg-white/95 px-3 text-base text-navy-900"
                >
                  {CAC_NGUON.map((n) => (
                    <option key={n} value={n}>
                      {TEN_NGUON[n]} · {demNguon(n)} người
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={caBTC}
                onChange={(e) => setCaBTC(e.target.checked)}
                className="h-5 w-5"
              />
              Cho ê-kíp BTC (PG, lễ tân, photo…) tham gia quay cùng
            </label>
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <button
                type="button"
                disabled={dangQuay}
                onClick={() => quay(true)}
                className="min-h-12 rounded-xl border border-white/25 px-5 font-semibold text-white/85 hover:bg-white/10 disabled:opacity-50"
              >
                Quay thử (không ghi)
              </button>
              <button
                type="button"
                disabled={dangQuay}
                onClick={() => quay(false)}
                className="min-h-12 rounded-xl bg-amber-400 px-8 text-lg font-extrabold text-navy-900 shadow-[0_0_30px_rgba(212,175,55,.35)] hover:bg-amber-300 disabled:opacity-50"
              >
                {dangQuay ? "Đang quay…" : "🎲 QUAY SỐ"}
              </button>
            </div>
            <p className="text-center text-xs text-white/45">
              Mỗi khách trúng tối đa một giải — người đã trúng tự loại khỏi các
              lượt sau. Máy chủ chọn ngẫu nhiên, hiệu ứng chạy tên chỉ là trình diễn.
            </p>
          </div>
        )}
      </div>

      {/* ───────────── Danh sách đã trúng giải ───────────── */}
      <h2 className="mt-8 mb-2 font-bold text-navy-800">
        Đã trúng giải ({daTrung.length})
      </h2>
      <div className="card divide-y divide-navy-50">
        {daTrung.map((d) => (
          <DongDaTrung key={d.id} d={d} />
        ))}
        {daTrung.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Chưa có ai trúng — kết quả mỗi lượt quay sẽ hiện ở đây.
          </p>
        )}
      </div>
    </div>
  );
}

function DongDaTrung({ d }: { d: DongTrung }) {
  const router = useRouter();
  const [dangHuy, setDangHuy] = useState(false);
  const [loi, setLoi] = useState("");
  async function huy() {
    if (!confirm(`Huỷ kết quả "${d.giai}" của ${d.ten}? Người này sẽ được quay tiếp.`))
      return;
    setDangHuy(true);
    const r = await huyTrung(d.id);
    setDangHuy(false);
    if (r.error) setLoi(r.error);
    else router.refresh();
  }
  return (
    <div className="flex items-center gap-3 px-4 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-navy-800">
          {d.ten}
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
            🏆 {d.giai}
          </span>
        </p>
        {d.moTa && <p className="mt-0.5 truncate text-xs text-slate-500">{d.moTa}</p>}
        {loi && <p className="mt-0.5 text-xs text-do-600">{loi}</p>}
      </div>
      <span className="shrink-0 text-xs text-slate-400">{d.gio}</span>
      <button
        type="button"
        onClick={huy}
        disabled={dangHuy}
        className="shrink-0 rounded-lg border border-navy-100 px-3 py-1.5 text-xs text-slate-500 hover:border-do-300 hover:text-do-600 disabled:opacity-50"
      >
        {dangHuy ? "Đang huỷ…" : "Huỷ"}
      </button>
    </div>
  );
}
