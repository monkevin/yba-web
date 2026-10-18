"use client";

import { useState } from "react";
import BangDuLieu, { type Dong } from "@/components/trung-tam-sk/BangDuLieu";
import { soVN } from "@/lib/trung-tam-sk/bang";

export default function ThuChiClient({
  eventId,
  ds: dau,
  cacBan,
  taiTroDaThu,
  taiTroCamKet,
  mucTieuThu,
}: {
  eventId: string;
  ds: Dong[];
  cacBan: string[];
  taiTroDaThu: number;
  taiTroCamKet: number;
  mucTieuThu: number;
}) {
  const [ds, setDs] = useState(dau);
  const [dauCu, setDauCu] = useState(dau);
  if (dau !== dauCu) {
    setDauCu(dau);
    setDs(dau);
  }
  const tong = (loai: string, k: "duTru" | "thucTe", chiDaTra = false) =>
    ds
      .filter((r) => r.loai === loai && (!chiDaTra || r.trangThai === "DA_TT"))
      .reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const thuKhac = tong("THU", "thucTe");
  const thucChi = tong("CHI", "thucTe");
  const ketDu = taiTroDaThu + thuKhac - thucChi;
  const no = ds.filter((r) => r.loai === "CHI" && r.trangThai !== "DA_TT").reduce((a, r) => a + (Number(r.thucTe) || 0), 0);

  const the = (nhan: string, v: number, phu?: string, mau = "text-navy-800") => (
    <div className="card p-3">
      <div className="text-xs text-slate-500">{nhan}</div>
      <div className={`text-lg font-bold tabular-nums ${mau}`}>{soVN(v)}</div>
      {phu && <div className="text-xs text-slate-500">{phu}</div>}
    </div>
  );

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {the("Mục tiêu thu", mucTieuThu, "sửa ở tab Thông tin")}
        {the("Tài trợ đã thu", taiTroDaThu, `cam kết ${soVN(taiTroCamKet)}`)}
        {the("Thu khác (vé, quỹ…)", thuKhac, `dự trù ${soVN(tong("THU", "duTru"))}`)}
        {the("Dự trù chi", tong("CHI", "duTru"))}
        {the("Thực chi", thucChi, no ? `còn nợ ${soVN(no)}` : "đã thanh toán hết")}
        {the(ketDu >= 0 ? "Kết dư" : "Thâm hụt", Math.abs(ketDu), "thu thực − chi thực", ketDu >= 0 ? "text-emerald-700" : "text-do-600")}
      </div>
      <BangDuLieu
        bang="thuchi"
        chaId={eventId}
        dong={ds}
        khiDoi={setDs}
        sua
        nhomTheo="loai"
        loc={["loai", "ban", "trangThai"]}
        luaChon={{ ban: cacBan.map((b) => ({ value: b, label: b })) }}
        tenXuat="thu-chi"
        lopDong={(r) => (r.loai === "CHI" && r.trangThai === "CHUA_TT" ? "bg-amber-50/70" : "")}
        cot={["hangMuc", "ban", "duTru", "thucTe", "trangThai", "phuTrach", "ngay", "loai", "ghiChu"]}
        chanBang={(rows) => {
          const s = (l: string, k: string) => soVN(rows.filter((r) => r.loai === l).reduce((a, r) => a + (Number(r[k]) || 0), 0));
          return (
            <tr>
              <td colSpan={3} className="px-2 py-2 text-right text-xs text-slate-500">
                Chi: dự trù / thực tế · Thu: dự trù / thực tế
              </td>
              <td className="px-2 py-2 text-right tabular-nums">
                {s("CHI", "duTru")}
                <div className="text-xs text-emerald-700">{s("THU", "duTru")}</div>
              </td>
              <td className="px-2 py-2 text-right tabular-nums">
                {s("CHI", "thucTe")}
                <div className="text-xs text-emerald-700">{s("THU", "thucTe")}</div>
              </td>
              <td colSpan={6} />
            </tr>
          );
        }}
      />
      <p className="mt-3 text-xs text-slate-500">
        Tiền tài trợ theo dõi ở tab Tài trợ (cột “Đã thu”) — không nhập lại ở đây để khỏi cộng hai lần. Ghi “Ban” cho mỗi khoản chi
        để báo cáo được chi phí theo ban.
      </p>
    </div>
  );
}
