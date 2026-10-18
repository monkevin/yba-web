"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MemberPicker from "@/components/MemberPicker";
import BangDuLieu, { type Dong } from "@/components/trung-tam-sk/BangDuLieu";
import GanHoiVien from "@/components/trung-tam-sk/GanHoiVien";
import { LOP_TONG, VAI_TRO_BTC, tabCuaBan, tongLuaChon } from "@/lib/trung-tam-sk/bang";

type Ban = { ten: string; moTa: string; ngoaiDs?: boolean };
type TienDo = Record<string, { xong: number; tong: number; tre: number }>;

const THU_TU_VAI_TRO: Record<string, number> = Object.fromEntries(VAI_TRO_BTC.map((v, i) => [v.value, i]));

async function goi(url: string, method: string, body?: unknown): Promise<{ ok: boolean; d: Dong & { error?: string } }> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { ok: res.ok, d: await res.json().catch(() => ({})) };
}

export default function BtcClient({
  eventId,
  cacBan,
  ds: dau,
  tienDo,
}: {
  eventId: string;
  cacBan: { ten: string; moTa: string }[];
  ds: Dong[];
  tienDo: TienDo;
}) {
  const router = useRouter();
  const [ds, setDs] = useState(dau);
  const [dauCu, setDauCu] = useState(dau);
  if (dau !== dauCu) {
    setDauCu(dau);
    setDs(dau);
  }
  const [xem, setXem] = useState<"the" | "bang">("the");
  const [loi, setLoi] = useState("");

  // Ban gõ tay ở bảng / nhập Excel mà chưa có trong danh sách vẫn hiện thành thẻ
  const coTen = new Set(cacBan.map((b) => b.ten));
  const the: Ban[] = [
    ...cacBan,
    ...[...new Set(ds.map((d) => d.ban as string | null).filter((b): b is string => !!b && !coTen.has(b)))].map(
      (ten) => ({ ten, moTa: "", ngoaiDs: true })
    ),
  ];
  const chuaXep = ds.filter((d) => !d.ban);
  const thieuTruong = the.filter((b) => !ds.some((d) => d.ban === b.ten && d.vaiTro === "TRUONG_BAN"));

  async function doiBan(cu: string, moi: string, moTa?: string) {
    setLoi("");
    const r = await goi(`/api/quan-tri/su-kien/${eventId}`, "PATCH", { doiTenBan: { cu, moi, moTa } });
    if (!r.ok) {
      setLoi(r.d.error || "Không lưu được");
      return false;
    }
    router.refresh();
    return true;
  }

  const sua = (id: string, data: Record<string, unknown>) => {
    setDs((x) => x.map((d) => (d.id === id ? { ...d, ...data } : d)));
    goi(`/api/quan-tri/su-kien/bang/btc/${id}`, "PATCH", data).then((r) => {
      if (!r.ok) {
        setLoi(r.d.error || "Không lưu được");
        router.refresh();
      }
    });
  };

  const bo = async (d: Dong) => {
    if (!confirm(`Bỏ ${d.hoTen} khỏi ${d.ban || "Ban tổ chức"}?`)) return;
    const r = await goi(`/api/quan-tri/su-kien/bang/btc/${d.id}`, "DELETE");
    if (!r.ok) return setLoi(r.d.error || "Không xoá được");
    setDs((x) => x.filter((y) => y.id !== d.id));
  };

  const banLc = the.map((b) => ({ value: b.ten, label: b.ten }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-slate-600">
          <b className="text-navy-800">{the.length}</b> ban · <b className="text-navy-800">{ds.length}</b> người ·{" "}
          <b className="text-navy-800">{ds.filter((d) => d.memberId).length}</b> gắn hồ sơ hội viên
          {thieuTruong.length > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
              {thieuTruong.length} ban chưa có trưởng ban
            </span>
          )}
        </div>
        <div className="ml-auto flex rounded-lg bg-slate-100 p-0.5 text-sm">
          {(
            [
              ["the", "Thẻ ban"],
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

      {xem === "the" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {the.map((b) => (
            <TheBan
              key={b.ten}
              eventId={eventId}
              ban={b}
              nguoi={ds.filter((d) => d.ban === b.ten)}
              tienDo={tienDo[b.ten]}
              doiBan={doiBan}
              sua={sua}
              bo={bo}
              khiThem={() => router.refresh()}
            />
          ))}
          {chuaXep.length > 0 && (
            <div className="card border-dashed p-4">
              <h3 className="font-bold text-slate-700">Chưa xếp ban</h3>
              <p className="text-xs text-slate-500">Người nhập từ file cũ hoặc chưa phân ban.</p>
              <ul className="mt-3 divide-y divide-slate-100">
                {chuaXep.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{d.hoTen}</span>
                    <select
                      className="inp !w-auto !py-1 text-xs"
                      value=""
                      onChange={(e) => e.target.value && sua(d.id, { ban: e.target.value })}
                      aria-label={`Xếp ${d.hoTen} vào ban`}
                    >
                      <option value="">Xếp vào ban…</option>
                      {the.map((x) => (
                        <option key={x.ten}>{x.ten}</option>
                      ))}
                    </select>
                    <button onClick={() => bo(d)} className="px-1 text-slate-400 hover:text-do-600" aria-label="Bỏ">
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ThemBan daCo={the.map((b) => b.ten)} doiBan={doiBan} />
        </div>
      ) : (
        <BangDuLieu
          bang="btc"
          chaId={eventId}
          dong={ds}
          khiDoi={setDs}
          sua
          nhomTheo="ban"
          loc={["vaiTro"]}
          luaChon={{ ban: banLc }}
          tenXuat="ban-to-chuc"
          khongThem
          cot={[
            "hoTen",
            {
              key: "ma",
              label: "Hội viên",
              rong: 90,
              giaTri: (r) => r.ma ?? "",
              render: (r) => (
                <GanHoiVien bang="btc" id={r.id} nhan={r.memberId ? r.ma ?? "Hội viên" : null} khiXong={() => router.refresh()} />
              ),
            },
            { key: "ban", rong: 170 },
            "vaiTro",
            "nhiemVu",
            "soDienThoai",
            "caTruc",
            "ghiChu",
          ]}
        />
      )}
      <p className="text-xs text-slate-500">
        Người gắn hồ sơ hội viên được tính điểm cống hiến &ldquo;Tham gia Ban tổ chức&rdquo; (một lần mỗi sự kiện, dù ở
        nhiều ban) và quét được thẻ hội viên ở Zalo Mini App. Đổi tên ban thì người, công việc, thu chi, hậu cần của ban đi
        theo tên mới.
      </p>
    </div>
  );
}

function TheBan({
  eventId,
  ban,
  nguoi,
  tienDo,
  doiBan,
  sua,
  bo,
  khiThem,
}: {
  eventId: string;
  ban: Ban;
  nguoi: Dong[];
  tienDo?: { xong: number; tong: number; tre: number };
  doiBan: (cu: string, moi: string, moTa?: string) => Promise<boolean>;
  sua: (id: string, data: Record<string, unknown>) => void;
  bo: (d: Dong) => void;
  khiThem: () => void;
}) {
  const [suaBan, setSuaBan] = useState(false);
  const [them, setThem] = useState(false);
  const [ten, setTen] = useState(ban.ten);
  const [moTa, setMoTa] = useState(ban.moTa);
  const [loi, setLoi] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [khoa, setKhoa] = useState(0);
  const tab = tabCuaBan(ban.ten);
  const coTruong = nguoi.some((d) => d.vaiTro === "TRUONG_BAN");
  const xep = [...nguoi].sort(
    (a, b) => (THU_TU_VAI_TRO[a.vaiTro] ?? 9) - (THU_TU_VAI_TRO[b.vaiTro] ?? 9) || (a.order ?? 0) - (b.order ?? 0)
  );

  async function luuBan() {
    if (!ten.trim()) return setLoi("Tên ban không được trống");
    if (await doiBan(ban.ten, ten.trim(), moTa)) setSuaBan(false);
  }

  async function xoaBan() {
    const soViec = tienDo?.tong ?? 0;
    const cauHoi =
      nguoi.length || soViec
        ? `Xoá "${ban.ten}"? ${nguoi.length} người và ${soViec} công việc của ban sẽ chuyển sang "Chưa xếp ban" (không mất dữ liệu).`
        : `Xoá "${ban.ten}"?`;
    if (confirm(cauHoi)) await doiBan(ban.ten, "");
  }

  async function themNguoi(fd: FormData) {
    setLoi("");
    const memberId = String(fd.get("memberId") ?? "");
    const hoTen = String(fd.get("hoTen") ?? "").trim();
    if (!memberId && !hoTen) return setLoi("Chọn hội viên hoặc gõ họ tên");
    setDangGui(true);
    const res = await fetch("/api/quan-tri/su-kien/bang/btc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        ban: ban.ten,
        vaiTro: String(fd.get("vaiTro") ?? "THANH_VIEN"),
        nhiemVu: String(fd.get("nhiemVu") ?? ""),
        soDienThoai: String(fd.get("soDienThoai") ?? ""),
        // Chọn hội viên thì tên lấy từ hồ sơ; ô họ tên chỉ dùng cho người ngoài Hội
        ...(memberId ? { memberId } : { hoTen }),
      }),
    });
    const d = await res.json().catch(() => ({}));
    setDangGui(false);
    if (!res.ok) return setLoi(d.error || "Không thêm được");
    setKhoa((k) => k + 1);
    khiThem();
  }

  return (
    <div className={`card flex flex-col p-4 ${ban.ngoaiDs ? "border-dashed" : ""}`}>
      {suaBan ? (
        <div className="space-y-2">
          <input className="inp font-semibold" value={ten} onChange={(e) => setTen(e.target.value)} aria-label="Tên ban" />
          <input
            className="inp text-sm"
            value={moTa}
            onChange={(e) => setMoTa(e.target.value)}
            placeholder="Nhiệm vụ chính của ban"
            aria-label="Nhiệm vụ chính"
          />
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary !py-1 text-sm" onClick={luuBan}>
              Lưu
            </button>
            <button
              className="btn-ghost !py-1 text-sm"
              onClick={() => {
                setSuaBan(false);
                setTen(ban.ten);
                setMoTa(ban.moTa);
              }}
            >
              Huỷ
            </button>
            <button className="ml-auto text-sm text-do-600 hover:underline" onClick={xoaBan}>
              Xoá ban
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-navy-800">{ban.ten}</h3>
            {ban.moTa && <p className="text-xs text-slate-500">{ban.moTa}</p>}
            {ban.ngoaiDs && <p className="text-xs text-amber-700">Chưa có trong danh sách ban — bấm Sửa để lưu.</p>}
          </div>
          <button onClick={() => setSuaBan(true)} className="text-xs text-slate-400 hover:text-navy-700">
            Sửa
          </button>
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <Link
          href={`/quan-tri/su-kien/${eventId}/cong-viec?ban=${encodeURIComponent(ban.ten)}`}
          className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 hover:bg-slate-200"
        >
          ☑ Việc {tienDo ? `${tienDo.xong}/${tienDo.tong}` : "0"}
          {tienDo?.tre ? <b className="text-do-600"> · {tienDo.tre} trễ</b> : null}
        </Link>
        {tab && (
          <Link
            href={`/quan-tri/su-kien/${eventId}/${tab.duong}`}
            className="rounded-full bg-navy-50 px-2.5 py-1 text-navy-700 hover:bg-navy-100"
          >
            {tab.nhan} →
          </Link>
        )}
        {!coTruong && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">Chưa có trưởng ban</span>}
      </div>

      <ul className="mt-3 flex-1 divide-y divide-slate-100">
        {xep.map((d) => (
          <li key={d.id} className="flex items-start gap-2 py-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-medium text-slate-800">{d.hoTen}</span>
                {d.memberId ? (
                  <span className="rounded bg-emerald-50 px-1.5 text-[11px] text-emerald-700">{d.ma ?? "Hội viên"}</span>
                ) : (
                  <span className="rounded bg-slate-100 px-1.5 text-[11px] text-slate-500">ngoài Hội</span>
                )}
              </div>
              {d.nhiemVu && <div className="truncate text-xs text-slate-500">{d.nhiemVu}</div>}
            </div>
            <select
              className={`rounded-full border-0 px-2 py-0.5 text-xs ${LOP_TONG[tongLuaChon(VAI_TRO_BTC, d.vaiTro)]}`}
              value={d.vaiTro}
              onChange={(e) => sua(d.id, { vaiTro: e.target.value })}
              aria-label={`Vai trò của ${d.hoTen}`}
            >
              {VAI_TRO_BTC.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
            <button onClick={() => bo(d)} className="px-1 text-slate-400 hover:text-do-600" aria-label={`Bỏ ${d.hoTen}`}>
              ×
            </button>
          </li>
        ))}
        {!nguoi.length && <li className="py-2 text-sm text-slate-400">Chưa có người.</li>}
      </ul>

      {them ? (
        <form
          // Có trưởng ban rồi thì vai trò mặc định của người tiếp theo về Thành viên
          key={`${khoa}-${coTruong}`}
          className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            themNguoi(new FormData(e.currentTarget));
          }}
        >
          <MemberPicker name="memberId" label="Chọn hội viên" />
          <label className="block">
            <span className="lbl">hoặc điền tay (người ngoài Hội)</span>
            <input name="hoTen" className="inp" placeholder="Họ và tên" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select name="vaiTro" className="inp" defaultValue={coTruong ? "THANH_VIEN" : "TRUONG_BAN"} aria-label="Vai trò">
              {VAI_TRO_BTC.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
            <input name="soDienThoai" className="inp" placeholder="SĐT liên hệ (tuỳ chọn)" aria-label="SĐT liên hệ" />
          </div>
          <input name="nhiemVu" className="inp" placeholder="Nhiệm vụ (tuỳ chọn)" aria-label="Nhiệm vụ" />
          <div className="flex items-center gap-2">
            <button className="btn-primary !py-1 text-sm" disabled={dangGui}>
              Thêm
            </button>
            <button type="button" className="btn-ghost !py-1 text-sm" onClick={() => setThem(false)}>
              Đóng
            </button>
            {loi && <span className="text-xs text-do-600">{loi}</span>}
          </div>
        </form>
      ) : (
        <button onClick={() => setThem(true)} className="mt-3 self-start text-sm font-medium text-navy-600 hover:underline">
          + Thêm người
        </button>
      )}
      {!them && loi && <p className="mt-1 text-xs text-do-600">{loi}</p>}
    </div>
  );
}

function ThemBan({ daCo, doiBan }: { daCo: string[]; doiBan: (cu: string, moi: string, moTa?: string) => Promise<boolean> }) {
  const [mo, setMo] = useState(false);
  const [ten, setTen] = useState("");
  const [moTa, setMoTa] = useState("");
  const [loi, setLoi] = useState("");

  async function luu() {
    const t = ten.trim();
    if (!t) return setLoi("Nhập tên ban");
    if (daCo.includes(t)) return setLoi("Đã có ban này");
    // Ban chưa có trong danh sách: "đổi tên" chính nó = thêm vào danh sách
    if (await doiBan(t, t, moTa)) {
      setTen("");
      setMoTa("");
      setMo(false);
      setLoi("");
    }
  }

  return mo ? (
    <div className="card space-y-2 p-4">
      <input className="inp font-semibold" value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Tên ban, VD Ban Lễ tân" aria-label="Tên ban mới" />
      <input className="inp text-sm" value={moTa} onChange={(e) => setMoTa(e.target.value)} placeholder="Nhiệm vụ chính" aria-label="Nhiệm vụ chính" />
      <div className="flex items-center gap-2">
        <button className="btn-primary !py-1 text-sm" onClick={luu}>
          Thêm ban
        </button>
        <button className="btn-ghost !py-1 text-sm" onClick={() => setMo(false)}>
          Huỷ
        </button>
        {loi && <span className="text-xs text-do-600">{loi}</span>}
      </div>
    </div>
  ) : (
    <button
      onClick={() => setMo(true)}
      className="card flex min-h-32 items-center justify-center border-dashed p-4 text-sm font-medium text-navy-600 hover:bg-navy-50/50"
    >
      + Thêm ban
    </button>
  );
}
