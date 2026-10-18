"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BangDuLieu, { type Dong } from "@/components/trung-tam-sk/BangDuLieu";
import HopThoai from "@/components/trung-tam-sk/HopThoai";
import {
  LOAI_VIEC,
  LOP_TONG,
  TRANG_THAI_VIEC,
  UU_TIEN,
  ngayNhap,
  ngayVN,
  tabCuaBan,
  tongLuaChon,
} from "@/lib/trung-tam-sk/bang";

const MOT_NGAY = 86_400_000;
const CHUA_PHAN = "";

type Che = "VIEC" | "CHECKLIST" | "";

async function goi(url: string, method: string, body?: unknown): Promise<{ ok: boolean; d: Dong & { error?: string; count?: number } }> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { ok: res.ok, d: await res.json().catch(() => ({})) };
}

export default function CongViecClient({
  eventId,
  ds: dau,
  cacBan,
  ngaySk,
  banChon,
  nguoiTheoBan,
}: {
  eventId: string;
  ds: Dong[];
  cacBan: string[];
  ngaySk: string;
  banChon: string;
  nguoiTheoBan: Record<string, string[]>;
}) {
  const router = useRouter();
  const [ds, setDs] = useState(dau);
  const [dauCu, setDauCu] = useState(dau);
  if (dau !== dauCu) {
    setDauCu(dau);
    setDs(dau);
  }
  const [xem, setXem] = useState<"ban" | "bang">("ban");
  const [che, setChe] = useState<Che>("");
  const [anXong, setAnXong] = useState(false);
  const [chiBan, setChiBan] = useState(banChon);
  const [dangSua, setDangSua] = useState<Dong | null>(null);
  const [loi, setLoi] = useState("");
  const [tb, setTb] = useState("");

  const now = new Date().getTime();
  const ngay = new Date(ngaySk).getTime();
  const nhanD = (h: string | Date | null) => {
    if (!h) return "";
    const d = Math.round((new Date(h).getTime() - ngay) / MOT_NGAY);
    return d === 0 ? "D" : d < 0 ? `D${d}` : `D+${d}`;
  };
  const tre = (r: Dong) => r.trangThai !== "XONG" && !!r.hanChot && new Date(r.hanChot).getTime() < now;

  const coTen = new Set(cacBan);
  const cot = [
    ...cacBan,
    ...[...new Set(ds.map((d) => d.ban as string | null).filter((b): b is string => !!b && !coTen.has(b)))],
    ...(ds.some((d) => !d.ban) ? [CHUA_PHAN] : []),
  ].filter((b) => !chiBan || b === chiBan);
  const hien = (r: Dong) => (!che || r.loai === che) && (!anXong || r.trangThai !== "XONG");

  const xong = ds.filter((d) => d.trangThai === "XONG").length;
  const soTre = ds.filter(tre).length;

  const sua = (id: string, data: Record<string, unknown>) => {
    setDs((x) => x.map((d) => (d.id === id ? { ...d, ...data } : d)));
    goi(`/api/quan-tri/su-kien/bang/viec/${id}`, "PATCH", data).then((r) => {
      if (r.ok) setDs((x) => x.map((d) => (d.id === id ? r.d : d)));
      else {
        setLoi(r.d.error || "Không lưu được");
        router.refresh();
      }
    });
  };

  async function them(ban: string, tieuDe: string, han: string) {
    const r = await goi("/api/quan-tri/su-kien/bang/viec", "POST", {
      eventId,
      ban: ban || null,
      tieuDe,
      hanChot: han || null,
      loai: che || "VIEC",
    });
    if (!r.ok) {
      setLoi(r.d.error || "Không thêm được");
      return false;
    }
    setDs((x) => [...x, r.d]);
    return true;
  }

  async function napMau(ban: string) {
    setLoi("");
    setTb("");
    const r = await goi(`/api/quan-tri/su-kien/${eventId}/tao-mau`, "POST", { phan: "viec", ban });
    if (!r.ok) return setLoi(r.d.error || "Không nạp được");
    setTb(r.d.count ? `Đã thêm ${r.d.count} việc mẫu cho "${ban}".` : `"${ban}" không còn việc mẫu nào chưa có.`);
    router.refresh();
  }

  async function xoa(r: Dong) {
    if (!confirm(`Xoá việc "${r.tieuDe}"?`)) return;
    const k = await goi(`/api/quan-tri/su-kien/bang/viec/${r.id}`, "DELETE");
    if (!k.ok) return setLoi(k.d.error || "Không xoá được");
    setDs((x) => x.filter((d) => d.id !== r.id));
    setDangSua(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-2 text-sm text-slate-600">
          Xong <b className="text-navy-800">{xong}</b>/{ds.length}
          {soTre > 0 && <b className="ml-2 text-do-600">· {soTre} việc trễ hạn</b>}
        </div>
        <select value={che} onChange={(e) => setChe(e.target.value as Che)} className="inp !w-auto !py-1.5" aria-label="Loại việc">
          <option value="">Mọi việc</option>
          <option value="VIEC">Việc chuẩn bị</option>
          <option value="CHECKLIST">Checklist ngày D</option>
        </select>
        {xem === "ban" && (
          <select value={chiBan} onChange={(e) => setChiBan(e.target.value)} className="inp !w-auto !py-1.5" aria-label="Ban">
            <option value="">Tất cả ban</option>
            {[...new Set([...cacBan, ...ds.map((d) => d.ban as string).filter(Boolean)])].map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-1 text-sm text-slate-600">
          <input type="checkbox" checked={anXong} onChange={(e) => setAnXong(e.target.checked)} /> Ẩn việc xong
        </label>
        <div className="ml-auto flex rounded-lg bg-slate-100 p-0.5 text-sm">
          {(
            [
              ["ban", "Checklist theo ban"],
              ["bang", "Bảng / Excel"],
            ] as const
          ).map(([k, n]) => (
            <button
              key={k}
              onClick={() => setXem(k)}
              className={`rounded-md px-3 py-1 ${xem === k ? "bg-white font-medium text-navy-800 shadow-sm" : "text-slate-500"}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      {loi && <p className="text-sm text-do-600">{loi}</p>}
      {tb && <p className="text-sm text-navy-700">{tb}</p>}

      {xem === "ban" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cot.map((ban) => (
            <CotBan
              key={ban || "_"}
              eventId={eventId}
              ban={ban}
              viec={ds
                .filter((d) => (d.ban ?? "") === ban)
                .sort(
                  (a, b) =>
                    (a.hanChot ? new Date(a.hanChot).getTime() : Infinity) -
                      (b.hanChot ? new Date(b.hanChot).getTime() : Infinity) || (a.order ?? 0) - (b.order ?? 0)
                )}
              hien={hien}
              tre={tre}
              nhanD={nhanD}
              nguoi={nguoiTheoBan[ban] ?? []}
              sua={sua}
              them={them}
              napMau={napMau}
              moSua={setDangSua}
            />
          ))}
          {!cot.length && <p className="text-sm text-slate-500">Chưa có ban nào — thêm ở tab Ban tổ chức.</p>}
        </div>
      ) : (
        <BangDuLieu
          bang="viec"
          chaId={eventId}
          dong={ds}
          khiDoi={setDs}
          sua
          luaChon={{ ban: cacBan.map((b) => ({ value: b, label: b })) }}
          loc={["ban", "trangThai", "uuTien"]}
          tenXuat="cong-viec"
          macDinhMoi={che ? { loai: che } : {}}
          locThem={hien}
          lopDong={(r) => (r.trangThai === "XONG" ? "opacity-60" : tre(r) ? "bg-do-50/70" : "")}
          cot={[
            { key: "moc", label: "Mốc", rong: 60, giaTri: (r) => nhanD(r.hanChot), render: (r) => <span className="text-xs text-slate-500">{nhanD(r.hanChot)}</span> },
            "hanChot",
            "tieuDe",
            "ban",
            "nguoiLam",
            "uuTien",
            "trangThai",
            "loai",
            "ghiChu",
          ]}
        />
      )}

      <HopThoai mo={!!dangSua} dong={() => setDangSua(null)} tieuDe="Sửa công việc">
        {dangSua && (
          <SuaViec
            key={dangSua.id}
            r={dangSua}
            cacBan={cacBan}
            nguoi={nguoiTheoBan[dangSua.ban ?? ""] ?? []}
            luu={(data) => {
              sua(dangSua.id, data);
              setDangSua(null);
            }}
            xoa={() => xoa(dangSua)}
          />
        )}
      </HopThoai>
    </div>
  );
}

function CotBan({
  eventId,
  ban,
  viec,
  hien,
  tre,
  nhanD,
  nguoi,
  sua,
  them,
  napMau,
  moSua,
}: {
  eventId: string;
  ban: string;
  viec: Dong[];
  hien: (r: Dong) => boolean;
  tre: (r: Dong) => boolean;
  nhanD: (h: string | Date | null) => string;
  nguoi: string[];
  sua: (id: string, data: Record<string, unknown>) => void;
  them: (ban: string, tieuDe: string, han: string) => Promise<boolean>;
  napMau: (ban: string) => void;
  moSua: (r: Dong) => void;
}) {
  const [tieuDe, setTieuDe] = useState("");
  const [han, setHan] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const tab = ban ? tabCuaBan(ban) : null;
  const xong = viec.filter((v) => v.trangThai === "XONG").length;
  const pt = viec.length ? Math.round((xong / viec.length) * 100) : 0;
  const soTre = viec.filter(tre).length;
  const ds = viec.filter(hien);

  async function gui() {
    const t = tieuDe.trim();
    if (!t) return;
    setDangGui(true);
    if (await them(ban, t, han)) {
      setTieuDe("");
      setHan("");
    }
    setDangGui(false);
  }

  return (
    <div className={`card flex flex-col p-4 ${ban ? "" : "border-dashed"}`}>
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 font-bold text-navy-800">{ban || "Chưa phân ban"}</h3>
        {tab && (
          <Link href={`/quan-tri/su-kien/${eventId}/${tab.duong}`} className="shrink-0 text-xs text-navy-600 hover:underline">
            {tab.nhan} →
          </Link>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full ${pt === 100 ? "bg-emerald-500" : "bg-navy-500"}`} style={{ width: `${pt}%` }} />
        </div>
        <span>
          {xong}/{viec.length}
        </span>
        {soTre > 0 && <b className="text-do-600">{soTre} trễ</b>}
      </div>

      <ul className="mt-3 flex-1 space-y-1">
        {ds.map((r) => {
          const done = r.trangThai === "XONG";
          return (
            <li key={r.id} className={`flex items-start gap-2 rounded-md px-1.5 py-1 ${tre(r) ? "bg-do-50" : "hover:bg-slate-50"}`}>
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"
                checked={done}
                onChange={() => sua(r.id, { trangThai: done ? "CHUA" : "XONG" })}
                aria-label={`Đánh dấu xong: ${r.tieuDe}`}
              />
              <button onClick={() => moSua(r)} className="min-w-0 flex-1 text-left">
                <div className={`text-sm ${done ? "text-slate-400 line-through" : "text-slate-800"}`}>{r.tieuDe}</div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                  {r.hanChot && (
                    <span className={tre(r) ? "font-semibold text-do-600" : ""}>
                      {nhanD(r.hanChot)} · {ngayVN(r.hanChot).slice(0, 5)}
                    </span>
                  )}
                  {r.nguoiLam && <span>· {r.nguoiLam}</span>}
                  {r.uuTien === "P0" && !done && <span className={`rounded px-1 ${LOP_TONG.red}`}>Gấp</span>}
                  {r.loai === "CHECKLIST" && <span className={`rounded px-1 ${LOP_TONG.violet}`}>Ngày D</span>}
                  {(r.trangThai === "DANG" || r.trangThai === "VUONG") && (
                    <span className={`rounded px-1 ${LOP_TONG[tongLuaChon(TRANG_THAI_VIEC, r.trangThai)]}`}>
                      {r.trangThai === "DANG" ? "Đang làm" : "Vướng"}
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
        {!ds.length && <li className="px-1.5 py-1 text-sm text-slate-400">{viec.length ? "Đã ẩn việc xong." : "Chưa có việc."}</li>}
      </ul>

      <form
        className="mt-3 flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          gui();
        }}
      >
        <input
          className="inp min-w-0 flex-1 !py-1 text-sm"
          value={tieuDe}
          onChange={(e) => setTieuDe(e.target.value)}
          placeholder="+ Thêm việc…"
          aria-label={`Thêm việc cho ${ban || "chưa phân ban"}`}
        />
        <input type="date" className="inp !w-[8.5rem] !py-1 text-sm" value={han} onChange={(e) => setHan(e.target.value)} aria-label="Hạn chót" />
        <button className="btn-primary !px-2.5 !py-1 text-sm" disabled={dangGui || !tieuDe.trim()}>
          Thêm
        </button>
      </form>
      {ban && (
        <button onClick={() => napMau(ban)} className="mt-2 self-start text-xs text-slate-500 hover:text-navy-700 hover:underline">
          Nạp checklist mẫu của ban
        </button>
      )}
      {nguoi.length > 0 && (
        <p className="mt-1 truncate text-[11px] text-slate-400" title={nguoi.join(", ")}>
          Người trong ban: {nguoi.join(", ")}
        </p>
      )}
    </div>
  );
}

function SuaViec({
  r,
  cacBan,
  nguoi,
  luu,
  xoa,
}: {
  r: Dong;
  cacBan: string[];
  nguoi: string[];
  luu: (data: Record<string, unknown>) => void;
  xoa: () => void;
}) {
  const [d, setD] = useState({
    tieuDe: r.tieuDe ?? "",
    ban: r.ban ?? "",
    nguoiLam: r.nguoiLam ?? "",
    hanChot: ngayNhap(r.hanChot),
    uuTien: r.uuTien ?? "P1",
    trangThai: r.trangThai ?? "CHUA",
    loai: r.loai ?? "VIEC",
    ghiChu: r.ghiChu ?? "",
  });
  const o = (k: keyof typeof d) => (e: { target: { value: string } }) => setD({ ...d, [k]: e.target.value });
  const chon = (k: "uuTien" | "trangThai" | "loai", ds: { value: string; label: string }[]) => (
    <select className="inp" value={d[k]} onChange={o(k)}>
      {ds.map((x) => (
        <option key={x.value} value={x.value}>
          {x.label}
        </option>
      ))}
    </select>
  );
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!d.tieuDe.trim()) return;
        luu({ ...d, ban: d.ban || null, hanChot: d.hanChot || null });
      }}
    >
      <label className="block">
        <span className="lbl">Công việc</span>
        <textarea className="inp" rows={2} value={d.tieuDe} onChange={o("tieuDe")} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="lbl">Ban</span>
          <select className="inp" value={d.ban} onChange={o("ban")}>
            <option value="">(chưa phân ban)</option>
            {[...new Set([...cacBan, d.ban].filter(Boolean))].map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="lbl">Người làm</span>
          <input className="inp" value={d.nguoiLam} onChange={o("nguoiLam")} list="nguoi-trong-ban" />
          <datalist id="nguoi-trong-ban">
            {nguoi.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </label>
        <label>
          <span className="lbl">Hạn chót</span>
          <input type="date" className="inp" value={d.hanChot} onChange={o("hanChot")} />
        </label>
        <label>
          <span className="lbl">Ưu tiên</span>
          {chon("uuTien", UU_TIEN)}
        </label>
        <label>
          <span className="lbl">Trạng thái</span>
          {chon("trangThai", TRANG_THAI_VIEC)}
        </label>
        <label>
          <span className="lbl">Loại</span>
          {chon("loai", LOAI_VIEC)}
        </label>
      </div>
      <label className="block">
        <span className="lbl">Ghi chú</span>
        <textarea className="inp" rows={2} value={d.ghiChu} onChange={o("ghiChu")} />
      </label>
      <div className="flex items-center gap-2">
        <button className="btn-primary">Lưu</button>
        <button type="button" onClick={xoa} className="ml-auto text-sm text-do-600 hover:underline">
          Xoá việc
        </button>
      </div>
    </form>
  );
}
