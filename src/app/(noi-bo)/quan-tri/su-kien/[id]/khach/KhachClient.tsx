"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BangDuLieu, { type Cot, type Dong } from "@/components/trung-tam-sk/BangDuLieu";
import GanHoiVien from "@/components/trung-tam-sk/GanHoiVien";
import { LOP_TONG, XAC_NHAN, gioVN, nhanLuaChon, tongLuaChon } from "@/lib/trung-tam-sk/bang";

type ThamDu = { phienId: string; xacNhan: string; checkinLuc: Date | string | null };
const VONG: Record<string, string> = { CHO: "CO", CO: "KHONG", KHONG: "CHO" };

const bangXn = (ds: { id: string; thamDu: ThamDu[] }[]) =>
  Object.fromEntries(ds.flatMap((k) => k.thamDu.map((t) => [`${k.id}:${t.phienId}`, t.xacNhan])));

export default function KhachClient({
  eventId,
  khach,
  phien,
  maHoiVien,
}: {
  eventId: string;
  khach: (Dong & { thamDu: ThamDu[] })[];
  phien: { id: string; ten: string }[];
  maHoiVien: Record<string, string>;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tb, setTb] = useState("");
  const [ban, setBan] = useState(false);
  const [locPhien, setLocPhien] = useState("");
  const [ds, setDs] = useState<Dong[]>(khach);
  // Xác nhận theo phiên: "khachId:phienId" → CHO | CO | KHONG
  const [xn, setXn] = useState<Record<string, string>>(() => bangXn(khach));
  const [ma, setMa] = useState(maHoiVien);
  // Dữ liệu mới từ máy chủ (sau nhập Excel / ghép hội viên) thay bản cục bộ
  const [khachCu, setKhachCu] = useState(khach);
  if (khach !== khachCu) {
    setKhachCu(khach);
    setDs(khach);
    setXn(bangXn(khach));
    setMa(maHoiVien);
  }
  const checkin = useMemo(
    () =>
      Object.fromEntries(
        khach.flatMap((k) => k.thamDu.filter((t) => t.checkinLuc).map((t) => [`${k.id}:${t.phienId}`, t.checkinLuc]))
      ),
    [khach]
  );

  async function datXn(khachId: string, phienId: string) {
    const k = `${khachId}:${phienId}`;
    const cu = xn[k] ?? "CHO";
    const moi = VONG[cu];
    setXn((x) => ({ ...x, [k]: moi }));
    const res = await fetch(`/api/quan-tri/su-kien/${eventId}/xac-nhan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ khachId, phienId, xacNhan: moi }),
    });
    if (!res.ok) setXn((x) => ({ ...x, [k]: cu }));
  }

  async function nhapFile(f: File | undefined) {
    if (!f) return;
    setBan(true);
    setTb("Đang đọc file…");
    const fd = new FormData();
    fd.set("file", f);
    const res = await fetch(`/api/quan-tri/su-kien/${eventId}/nhap-khach`, { method: "POST", body: fd });
    const d = await res.json().catch(() => ({}));
    setBan(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!res.ok) return setTb(d.error || "Không nhập được");
    setTb(
      `Đã thêm ${d.them} khách · bổ sung ${d.capNhat} khách trùng SĐT · bỏ qua ${d.boQua} dòng trùng tên · tự ghép ${d.ghepHoiVien} hội viên` +
        (d.loi?.length ? ` · lỗi: ${d.loi.join("; ")}` : "")
    );
    router.refresh();
  }

  async function ghep() {
    setBan(true);
    const res = await fetch(`/api/quan-tri/su-kien/${eventId}/ghep-hoi-vien`, { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setBan(false);
    setTb(res.ok ? `Đã ghép thêm ${d.ghep} khách với hồ sơ hội viên · còn ${d.conLai} khách chưa ghép (khách ngoài Hội hoặc chưa đủ thông tin)` : d.error);
    if (res.ok) router.refresh();
  }

  const soXn = (pid: string) => ds.filter((k) => xn[`${k.id}:${pid}`] === "CO").length;

  const cot: (string | Cot)[] = [
    "danhXung",
    "ten",
    "chucDanh",
    "donVi",
    "phone",
    "nhom",
    {
      key: "memberId",
      label: "Hội viên",
      rong: 90,
      giaTri: (r) => (r.memberId ? ma[r.memberId] ?? "HV" : ""),
      render: (r) => (
        <GanHoiVien
          bang="khach"
          id={r.id}
          nhan={r.memberId ? ma[r.memberId] ?? "Hội viên" : null}
          khiXong={(m) => {
            setDs((x) => x.map((d) => (d.id === r.id ? { ...d, memberId: m } : d)));
            if (m && !ma[m]) setMa((x) => ({ ...x, [m]: "Hội viên" }));
            router.refresh();
          }}
        />
      ),
    },
    ...phien.map<Cot>((p) => ({
      key: `xn:${p.id}`,
      label: p.ten,
      rong: 110,
      giaTri: (r) => nhanLuaChon(XAC_NHAN, xn[`${r.id}:${p.id}`] ?? "CHO"),
      render: (r) => {
        const v = xn[`${r.id}:${p.id}`] ?? "CHO";
        const ci = checkin[`${r.id}:${p.id}`];
        return (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => datXn(r.id, p.id)}
              className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${LOP_TONG[tongLuaChon(XAC_NHAN, v)]}`}
              title="Bấm để đổi: Chờ → Tham dự → Không dự"
            >
              {nhanLuaChon(XAC_NHAN, v)}
            </button>
            {ci && (
              <span className="text-xs font-semibold text-emerald-700" title="Đã check-in">
                ✓{gioVN(ci)}
              </span>
            )}
          </div>
        );
      },
    })),
    "nguoiMoi",
    "moi",
    "vip",
    "ban",
    "email",
    "ghiChu",
  ];

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-3">
          <div className="text-xs text-slate-500">Tổng khách</div>
          <div className="text-xl font-bold text-navy-800">{ds.length}</div>
        </div>
        {phien.slice(0, 3).map((p) => (
          <div key={p.id} className="card p-3">
            <div className="truncate text-xs text-slate-500">Xác nhận · {p.ten}</div>
            <div className="text-xl font-bold text-emerald-700">{soXn(p.id)}</div>
          </div>
        ))}
      </div>
      {tb && <div className="mb-3 rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-800">{tb}</div>}
      <BangDuLieu
        bang="khach"
        chaId={eventId}
        dong={ds}
        cot={cot}
        sua
        luaChon={{ __phien: phien.map((p) => ({ value: p.id, label: p.ten })) }}
        loc={["nhom", "nguoiMoi", "moi"]}
        tenXuat="khach-moi"
        khiDoi={setDs}
        locThem={
          locPhien
            ? (r) => {
                const [pid, v] = locPhien.split("|");
                return (xn[`${r.id}:${pid}`] ?? "CHO") === v;
              }
            : undefined
        }
        lopDong={(r) => (r.vip ? "bg-amber-50/60" : "")}
        congCu={
          <>
            <select value={locPhien} onChange={(e) => setLocPhien(e.target.value)} className="inp !w-auto !py-1.5">
              <option value="">Xác nhận: tất cả</option>
              {phien.flatMap((p) =>
                XAC_NHAN.map((o) => (
                  <option key={`${p.id}|${o.value}`} value={`${p.id}|${o.value}`}>
                    {p.ten}: {o.label}
                  </option>
                ))
              )}
            </select>
            <button className="btn-ghost !px-3 !py-1.5" onClick={ghep} disabled={ban}>
              🔗 Ghép hội viên
            </button>
            <label className="btn-ghost !px-3 !py-1.5 cursor-pointer">
              ⬆ Nhập Excel
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                disabled={ban}
                onChange={(e) => nhapFile(e.target.files?.[0])}
              />
            </label>
          </>
        }
      />
      <p className="mt-3 text-xs text-slate-500">
        Nhập Excel: file cần dòng tiêu đề có cột “Họ và tên”; các cột SĐT, Đơn vị, Chức danh, Nhóm… và cột trùng tên phiên
        (ghi “x” / “có” / “không”) được ghép tự động. Khách trùng SĐT chỉ được bổ sung ô còn trống — không đè thông tin đã sửa.
      </p>
    </div>
  );
}
