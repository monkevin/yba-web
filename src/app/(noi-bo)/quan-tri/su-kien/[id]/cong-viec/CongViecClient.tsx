"use client";

import { useState } from "react";
import BangDuLieu, { type Dong } from "@/components/trung-tam-sk/BangDuLieu";

const MOT_NGAY = 86_400_000;

export default function CongViecClient({
  eventId,
  ds,
  cacBan,
  ngaySk,
}: {
  eventId: string;
  ds: Dong[];
  cacBan: string[];
  ngaySk: string;
}) {
  const [che, setChe] = useState<"VIEC" | "CHECKLIST" | "">("");
  const [anXong, setAnXong] = useState(false);
  const now = new Date().getTime();
  const ngay = new Date(ngaySk).getTime();
  const nhanD = (h: string | Date | null) => {
    if (!h) return "";
    const d = Math.round((new Date(h).getTime() - ngay) / MOT_NGAY);
    return d === 0 ? "D" : d < 0 ? `D${d}` : `D+${d}`;
  };
  return (
    <BangDuLieu
      bang="viec"
      chaId={eventId}
      dong={ds}
      sua
      luaChon={{ ban: cacBan.map((b) => ({ value: b, label: b })) }}
      loc={["ban", "trangThai", "uuTien"]}
      tenXuat="cong-viec"
      macDinhMoi={che ? { loai: che } : {}}
      locThem={(r) => (!che || r.loai === che) && (!anXong || r.trangThai !== "XONG")}
      lopDong={(r) =>
        r.trangThai === "XONG"
          ? "opacity-60"
          : r.hanChot && new Date(r.hanChot).getTime() < now
            ? "bg-do-50/70"
            : ""
      }
      congCu={
        <>
          <select value={che} onChange={(e) => setChe(e.target.value as typeof che)} className="inp !w-auto !py-1.5">
            <option value="">Mọi việc</option>
            <option value="VIEC">Việc chuẩn bị</option>
            <option value="CHECKLIST">Checklist ngày D</option>
          </select>
          <label className="flex items-center gap-1 text-sm text-slate-600">
            <input type="checkbox" checked={anXong} onChange={(e) => setAnXong(e.target.checked)} /> Ẩn việc xong
          </label>
        </>
      }
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
  );
}
