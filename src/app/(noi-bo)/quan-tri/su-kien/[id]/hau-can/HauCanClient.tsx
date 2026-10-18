"use client";

import BangDuLieu, { type Dong } from "@/components/trung-tam-sk/BangDuLieu";

export default function HauCanClient({ eventId, ds }: { eventId: string; ds: Dong[] }) {
  const now = new Date().getTime();
  return (
    <BangDuLieu
      bang="haucan"
      chaId={eventId}
      dong={ds}
      sua
      nhomTheo="nhom"
      loc={["nhom", "phuTrach", "trangThai"]}
      tenXuat="hau-can"
      lopDong={(r) =>
        r.trangThai === "XONG" ? "opacity-60" : r.hanChot && new Date(r.hanChot).getTime() < now ? "bg-do-50/70" : ""
      }
      cot={["ten", "soLuong", "donVi", "phuTrach", "hanChot", "trangThai", "nhom", "ghiChu"]}
    />
  );
}
