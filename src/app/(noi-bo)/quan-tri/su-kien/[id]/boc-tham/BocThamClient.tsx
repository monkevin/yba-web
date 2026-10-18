"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BangDuLieu, { type Dong } from "@/components/trung-tam-sk/BangDuLieu";

type Trung = { id: string; trangThai: string; danhXung: string | null; ten: string; donVi: string | null; ban: string | null };
type Giai = { id: string; ten: string; phanQua: string | null; nhaTaiTro: string | null; soLuong: number; order: number; trung: Trung[] };
type NguoiTrung = { trungId: string; danhXung: string | null; ten: string; donVi: string | null; ban: string | null };

const tenDu = (k: { danhXung: string | null; ten: string }) => [k.danhXung, k.ten].filter(Boolean).join(" ");
const conSuat = (g: Giai) => g.soLuong - g.trung.filter((t) => t.trangThai === "TRUNG").length;

async function goi(eventId: string, method: string, body: unknown) {
  const res = await fetch(`/api/quan-tri/su-kien/${eventId}/boc-tham`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, d: await res.json().catch(() => ({})) };
}

export default function BocThamClient({
  eventId,
  tieuDe,
  giai,
  tenUngVien,
}: {
  eventId: string;
  tieuDe: string;
  giai: Giai[];
  tenUngVien: string[];
}) {
  const router = useRouter();
  const [loi, setLoi] = useState("");
  const [chieu, setChieu] = useState<string | null>(null);
  const [suaGiai, setSuaGiai] = useState(false);

  async function taoMau() {
    const res = await fetch(`/api/quan-tri/su-kien/${eventId}/tao-mau`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phan: "giai" }),
    });
    if (!res.ok) setLoi("Không tạo được giải mẫu");
    router.refresh();
  }

  async function doi(trungId: string, trangThai: "VANG" | "TRUNG") {
    const r = await goi(eventId, "PATCH", { trungId, trangThai });
    if (!r.ok) setLoi(r.d.error || "Không lưu được");
    router.refresh();
  }

  async function huy(t: Trung) {
    if (!confirm(`Huỷ lượt trúng của ${tenDu(t)}? Người này sẽ vào lại vòng quay.`)) return;
    const r = await goi(eventId, "DELETE", { trungId: t.id });
    if (!r.ok) setLoi(r.d.error || "Không huỷ được");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-slate-600">
          <b className="text-navy-800">{tenUngVien.length}</b> khách đã check-in, chưa trúng giải — chỉ những người này vào vòng
          quay.
        </p>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setSuaGiai((x) => !x)} className="btn-ghost">
            {suaGiai ? "Đóng danh sách giải" : "Sửa danh sách giải"}
          </button>
          {giai.length > 0 && (
            <button onClick={() => setChieu(giai.find((g) => conSuat(g) > 0)?.id ?? giai[0].id)} className="btn-danger">
              ▶ Màn hình trình chiếu
            </button>
          )}
        </div>
      </div>
      {loi && <p className="text-sm text-do-600">{loi}</p>}

      {(suaGiai || !giai.length) && (
        <div className="space-y-2">
          {!giai.length && (
            <div className="card flex flex-wrap items-center gap-3 p-4">
              <p className="text-sm text-slate-600">Chưa có giải nào.</p>
              <button onClick={taoMau} className="btn-primary !py-1.5">
                Tạo giải mẫu
              </button>
              <span className="text-xs text-slate-500">hoặc thêm từng giải ở bảng dưới.</span>
            </div>
          )}
          <BangDuLieu
            bang="giai"
            chaId={eventId}
            dong={giai as unknown as Dong[]}
            sua
            tenXuat="giai-boc-tham"
            cot={["ten", "phanQua", "nhaTaiTro", "soLuong"]}
            khiDoi={() => {}}
          />
          {suaGiai && (
            <button onClick={() => router.refresh()} className="text-sm text-navy-600 hover:underline">
              Cập nhật danh sách giải ở trên ↻
            </button>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {giai.map((g) => {
          const con = conSuat(g);
          return (
            <div key={g.id} className="card flex flex-col p-4">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-navy-800">{g.ten}</h3>
                  {g.phanQua && <p className="text-sm text-slate-600">{g.phanQua}</p>}
                  {g.nhaTaiTro && <p className="text-xs text-slate-500">Tài trợ: {g.nhaTaiTro}</p>}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${con ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                  {g.soLuong - con}/{g.soLuong}
                </span>
              </div>
              <ol className="mt-3 flex-1 space-y-1 text-sm">
                {g.trung.map((t) => (
                  <li key={t.id} className={`flex items-center gap-2 ${t.trangThai === "VANG" ? "text-slate-400 line-through" : ""}`}>
                    <span className="min-w-0 flex-1 truncate">
                      {tenDu(t)}
                      {t.donVi ? <span className="text-slate-500"> · {t.donVi}</span> : null}
                    </span>
                    {t.trangThai === "TRUNG" ? (
                      <button onClick={() => doi(t.id, "VANG")} className="text-xs text-amber-700 hover:underline">
                        Vắng
                      </button>
                    ) : (
                      <button onClick={() => doi(t.id, "TRUNG")} className="text-xs text-navy-600 hover:underline">
                        Có mặt lại
                      </button>
                    )}
                    <button onClick={() => huy(t)} className="text-xs text-slate-400 hover:text-do-600" aria-label="Huỷ lượt">
                      ×
                    </button>
                  </li>
                ))}
              </ol>
              <button onClick={() => setChieu(g.id)} disabled={!con} className="btn-primary mt-3 self-start !py-1.5">
                {con ? "Quay giải này" : "Đã đủ người"}
              </button>
            </div>
          );
        })}
      </div>

      {chieu && (
        <ManChieu
          eventId={eventId}
          tieuDe={tieuDe}
          giai={giai}
          giaiId={chieu}
          chonGiai={setChieu}
          tenUngVien={tenUngVien}
          dong={() => {
            setChieu(null);
            router.refresh();
          }}
          khiQuay={() => router.refresh()}
        />
      )}
    </div>
  );
}

function ManChieu({
  eventId,
  tieuDe,
  giai,
  giaiId,
  chonGiai,
  tenUngVien,
  dong,
  khiQuay,
}: {
  eventId: string;
  tieuDe: string;
  giai: Giai[];
  giaiId: string;
  chonGiai: (id: string) => void;
  tenUngVien: string[];
  dong: () => void;
  khiQuay: () => void;
}) {
  const g = giai.find((x) => x.id === giaiId) ?? giai[0];
  const [chay, setChay] = useState("");
  const [dangQuay, setDangQuay] = useState(false);
  const [nguoi, setNguoi] = useState<NguoiTrung | null>(null);
  const [loi, setLoi] = useState("");
  const hen = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && dong();
    window.addEventListener("keydown", k);
    return () => {
      window.removeEventListener("keydown", k);
      if (hen.current) clearInterval(hen.current);
    };
  }, [dong]);

  async function quay() {
    setLoi("");
    setNguoi(null);
    setDangQuay(true);
    const ds = tenUngVien.length ? tenUngVien : ["…"];
    hen.current = setInterval(() => setChay(ds[Math.floor(Math.random() * ds.length)]), 70);
    const [r] = await Promise.all([goi(eventId, "POST", { giaiId: g.id }), new Promise((x) => setTimeout(x, 2600))]);
    if (hen.current) clearInterval(hen.current);
    setDangQuay(false);
    setChay("");
    if (!r.ok) return setLoi(r.d.error || "Không quay được");
    setNguoi(r.d as NguoiTrung);
    khiQuay();
  }

  async function vang() {
    if (!nguoi) return;
    await goi(eventId, "PATCH", { trungId: nguoi.trungId, trangThai: "VANG" });
    quay();
  }

  const con = conSuat(g);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-navy-950 via-navy-900 to-do-900 p-6 text-white">
      <div className="flex items-center gap-3">
        <span className="text-sm uppercase tracking-[0.2em] text-navy-200">{tieuDe}</span>
        <select
          value={g.id}
          onChange={(e) => {
            setNguoi(null);
            chonGiai(e.target.value);
          }}
          className="ml-auto rounded bg-white/10 px-2 py-1 text-sm"
          aria-label="Chọn giải"
        >
          {giai.map((x) => (
            <option key={x.id} value={x.id} className="text-slate-800">
              {x.ten}
            </option>
          ))}
        </select>
        <button
          onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}
          className="rounded bg-white/10 px-2 py-1 text-sm"
        >
          Toàn màn hình
        </button>
        <button onClick={dong} className="rounded bg-white/10 px-3 py-1 text-xl leading-none" aria-label="Đóng">
          ×
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="text-2xl uppercase tracking-[0.3em] text-amber-300">{g.ten}</div>
        {g.phanQua && <div className="mt-2 text-xl text-navy-100">{g.phanQua}</div>}
        {g.nhaTaiTro && <div className="mt-1 text-base text-navy-200">Nhà tài trợ: {g.nhaTaiTro}</div>}
        <div className="mt-10 flex min-h-48 flex-col items-center justify-center">
          {dangQuay ? (
            <div className="text-5xl font-bold text-white/80 sm:text-7xl">{chay}</div>
          ) : nguoi ? (
            <>
              <div className="text-sm uppercase tracking-[0.3em] text-amber-200">Xin chúc mừng</div>
              <div className="mt-3 text-5xl font-bold sm:text-7xl">{tenDu(nguoi)}</div>
              {nguoi.donVi && <div className="mt-3 text-2xl text-navy-100">{nguoi.donVi}</div>}
              {nguoi.ban && <div className="mt-2 text-lg text-navy-200">Bàn {nguoi.ban}</div>}
            </>
          ) : (
            <div className="text-xl text-navy-200">{con ? `Còn ${con} suất` : "Giải này đã đủ người"}</div>
          )}
          {loi && <div className="mt-4 rounded bg-do-700/60 px-4 py-2 text-lg">{loi}</div>}
        </div>
        <div className="mt-10 flex gap-3">
          <button
            onClick={quay}
            disabled={dangQuay || con <= 0}
            className="rounded-full bg-amber-400 px-10 py-4 text-xl font-bold text-navy-950 shadow-lg disabled:opacity-40"
          >
            {nguoi ? "Quay tiếp" : "QUAY"}
          </button>
          {nguoi && !dangQuay && (
            <button onClick={vang} className="rounded-full bg-white/15 px-6 py-4 text-lg">
              Vắng mặt — quay lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
