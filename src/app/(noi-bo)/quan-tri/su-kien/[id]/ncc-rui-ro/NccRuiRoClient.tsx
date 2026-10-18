"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BangDuLieu, { type Dong } from "@/components/trung-tam-sk/BangDuLieu";
import { soVN } from "@/lib/trung-tam-sk/bang";

/** Mức rủi ro = khả năng × tác động (1–9): ≥6 cao, ≥3 trung bình */
const muc = (r: Dong) => (Number(r.khaNang) || 0) * (Number(r.tacDong) || 0);

export default function NccRuiRoClient({ eventId, ncc: nccDau, ruiRo }: { eventId: string; ncc: Dong[]; ruiRo: Dong[] }) {
  const router = useRouter();
  const [ncc, setNcc] = useState(nccDau);
  const [loi, setLoi] = useState("");
  const tong = ncc.reduce((a, n) => a + (Number(n.giaTri) || 0), 0);
  const coc = ncc.reduce((a, n) => a + (Number(n.daCoc) || 0), 0);
  const chuaChot = ncc.filter((n) => n.trangThai === "TIM" || n.trangThai === "BAO_GIA").length;

  async function taoMau(phan: "ncc" | "ruiro") {
    setLoi("");
    const res = await fetch(`/api/quan-tri/su-kien/${eventId}/tao-mau`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phan }),
    });
    if (!res.ok) setLoi((await res.json().catch(() => ({}))).error || "Không tạo được");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {loi && <p className="text-sm text-do-600">{loi}</p>}
      <section className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="font-bold text-navy-800">Nhà cung cấp</h2>
          <span className="text-sm text-slate-500">
            Hợp đồng <b className="text-navy-800">{soVN(tong)}</b> · đã cọc <b className="text-navy-800">{soVN(coc)}</b> · còn phải trả{" "}
            <b className="text-do-700">{soVN(Math.max(0, tong - coc))}</b>
            {chuaChot > 0 && <span className="ml-2 text-amber-700">· {chuaChot} hạng mục chưa chốt</span>}
          </span>
          {!ncc.length && (
            <button onClick={() => taoMau("ncc")} className="text-sm text-navy-600 hover:underline">
              + Tạo danh sách hạng mục mẫu
            </button>
          )}
        </div>
        <BangDuLieu
          bang="ncc"
          chaId={eventId}
          dong={nccDau}
          khiDoi={setNcc}
          sua
          loc={["trangThai"]}
          tenXuat="nha-cung-cap"
          cot={["hangMuc", "ten", "lienHe", "giaTri", "daCoc", "trangThai", "ghiChu"]}
        />
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="font-bold text-navy-800">Rủi ro & phương án dự phòng</h2>
          <span className="text-sm text-slate-500">Mức = khả năng × tác động (1–3 mỗi trục). Đỏ là phải có người xử lý trước ngày D.</span>
          {!ruiRo.length && (
            <button onClick={() => taoMau("ruiro")} className="text-sm text-navy-600 hover:underline">
              + Tạo danh sách rủi ro mẫu
            </button>
          )}
        </div>
        <BangDuLieu
          bang="ruiro"
          chaId={eventId}
          dong={ruiRo}
          sua
          loc={["trangThai"]}
          tenXuat="rui-ro"
          lopDong={(r) => (r.trangThai === "DA_XU_LY" ? "opacity-60" : muc(r) >= 6 ? "bg-do-50/70" : "")}
          cot={[
            "ruiRo",
            "khaNang",
            "tacDong",
            {
              key: "muc",
              label: "Mức",
              rong: 70,
              giaTri: muc,
              render: (r) => (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    muc(r) >= 6 ? "bg-do-100 text-do-700" : muc(r) >= 3 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {muc(r)}
                </span>
              ),
            },
            "phuongAn",
            "nguoiXuLy",
            "trangThai",
          ]}
        />
      </section>
    </div>
  );
}
