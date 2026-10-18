"use client";

import BangDuLieu, { type Dong } from "@/components/trung-tam-sk/BangDuLieu";
import type { LuaChon } from "@/lib/trung-tam-sk/bang";

export default function KichBanClient({ eventId, ds, phien }: { eventId: string; ds: Dong[]; phien: LuaChon[] }) {
  return (
    <div>
      <BangDuLieu
        bang="kichban"
        chaId={eventId}
        dong={ds}
        sua
        luaChon={{ phienId: phien }}
        nhomTheo="phienId"
        loc={["phuTrach", "noiBo"]}
        tenXuat="kich-ban"
        lopDong={(r) => (r.noiBo ? "bg-slate-50 text-slate-500" : String(r.noiDung).startsWith("★") ? "bg-amber-50/60" : "")}
        cot={["gio", "thoiLuong", "noiDung", "phuTrach", "kyThuat", "noiBo", "phienId", "ghiChu"]}
      />
      <p className="mt-3 text-xs text-slate-500">
        ★ = khoảnh khắc chính. Dòng &ldquo;Nội bộ BTC&rdquo; (setup, soundcheck…) không in ra kịch bản cho MC ở tab Báo cáo.
      </p>
    </div>
  );
}
