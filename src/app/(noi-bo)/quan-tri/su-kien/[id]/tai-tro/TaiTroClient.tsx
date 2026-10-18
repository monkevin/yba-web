"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BangDuLieu, { type Dong } from "@/components/trung-tam-sk/BangDuLieu";
import GanHoiVien from "@/components/trung-tam-sk/GanHoiVien";
import HopThoai from "@/components/trung-tam-sk/HopThoai";
import { TT_TAI_TRO_CHUA_CHOT } from "@/lib/tai-tro";
import { QUYEN_LOI_THEO_HANG, soVN } from "@/lib/trung-tam-sk/bang";

const CHUA_CHOT = TT_TAI_TRO_CHUA_CHOT;

export default function TaiTroClient({ eventId, ds: dau }: { eventId: string; ds: Dong[] }) {
  const router = useRouter();
  const [ds, setDs] = useState(dau);
  const [dauCu, setDauCu] = useState(dau);
  if (dau !== dauCu) {
    setDauCu(dau);
    setDs(dau);
  }
  const [moQl, setMoQl] = useState<Dong | null>(null);
  const [ql, setQl] = useState<Record<string, { xong: number; tong: number }>>({});

  const chot = ds.filter((t) => !CHUA_CHOT.includes(t.trangThai));
  const sum = (k: string) => chot.reduce((a, t) => a + (Number(t[k]) || 0), 0);
  const tienQl = (t: Dong) =>
    ql[t.id] ?? {
      xong: (t.quyenLoi ?? []).filter((x: Dong) => x.xong).length,
      tong: (t.quyenLoi ?? []).length,
    };

  async function apMau(t: Dong) {
    const mau = QUYEN_LOI_THEO_HANG[t.mucTaiTro] ?? [];
    if (!mau.length) return;
    await fetch("/api/quan-tri/su-kien/bang/quyenloi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taiTroId: t.id, rows: mau.map((noiDung) => ({ noiDung })) }),
    });
    setMoQl(null);
    router.refresh();
  }

  const the = (nhan: string, giaTri: string, phu?: string) => (
    <div className="card p-3">
      <div className="text-xs text-slate-500">{nhan}</div>
      <div className="text-lg font-bold text-navy-800 tabular-nums">{giaTri}</div>
      {phu && <div className="text-xs text-slate-500">{phu}</div>}
    </div>
  );

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {the("Nhà tài trợ đã chốt", String(chot.length), `${ds.length - chot.length} đang vận động / huỷ`)}
        {the("Tiền mặt cam kết", soVN(sum("hienKim")), "VND")}
        {the("Đã thu", soVN(sum("daThu")), `Còn phải thu ${soVN(Math.max(0, sum("hienKim") - sum("daThu")))}`)}
        {the("Tổng giá trị (gồm hiện vật)", soVN(sum("giaTri")), "VND")}
      </div>

      <BangDuLieu
        bang="taitro"
        chaId={eventId}
        dong={ds}
        khiDoi={setDs}
        sua
        loc={["mucTaiTro", "trangThai", "nguoiVanDong"]}
        tenXuat="nha-tai-tro"
        lopDong={(r) =>
          CHUA_CHOT.includes(r.trangThai) ? "opacity-60" : (Number(r.daThu) || 0) < (Number(r.hienKim) || 0) ? "bg-amber-50/70" : ""
        }
        cot={[
          "nhaTaiTro",
          {
            key: "ma",
            label: "Hội viên",
            rong: 90,
            giaTri: (r) => r.ma ?? "",
            render: (r) => (
              <GanHoiVien bang="taitro" id={r.id} nhan={r.memberId ? r.ma ?? "Hội viên" : null} khiXong={() => router.refresh()} />
            ),
          },
          "mucTaiTro",
          "trangThai",
          "hienKim",
          "daThu",
          "ngayThu",
          "hienVat",
          "giaTri",
          {
            key: "ql",
            label: "Quyền lợi",
            rong: 100,
            giaTri: (r) => `${tienQl(r).xong}/${tienQl(r).tong}`,
            render: (r) => {
              const p = tienQl(r);
              return (
                <button
                  onClick={() => setMoQl(r)}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.tong && p.xong === p.tong ? "bg-emerald-100 text-emerald-800" : "bg-navy-100 text-navy-800"
                  }`}
                >
                  {p.tong ? `${p.xong}/${p.tong} đã làm` : "+ quyền lợi"}
                </button>
              );
            },
          },
          "nguoiVanDong",
          "lienHe",
          "ghiChu",
        ]}
        chanBang={(rows) => {
          const c = rows.filter((t) => !CHUA_CHOT.includes(t.trangThai));
          const s = (k: string) => soVN(c.reduce((a, t) => a + (Number(t[k]) || 0), 0));
          return (
            <tr>
              <td colSpan={5} className="px-2 py-2 text-right text-xs text-slate-500">
                Tổng (đã chốt)
              </td>
              <td className="px-2 py-2 text-right tabular-nums">{s("hienKim")}</td>
              <td className="px-2 py-2 text-right tabular-nums">{s("daThu")}</td>
              <td colSpan={2} />
              <td className="px-2 py-2 text-right tabular-nums">{s("giaTri")}</td>
              <td colSpan={5} />
            </tr>
          );
        }}
      />
      <p className="mt-3 text-xs text-slate-500">
        Nhà tài trợ trạng thái <b>Đang vận động</b> hoặc <b>Huỷ</b> không hiện ở trang vinh danh /tai-tro và không được tính
        điểm đóng góp. Gắn hồ sơ hội viên để doanh nghiệp được cộng điểm tài trợ. Thêm nhà tài trợ có chọn hạng sẽ tự sinh danh
        sách quyền lợi theo hạng.
      </p>

      <HopThoai mo={!!moQl} dong={() => setMoQl(null)} tieuDe={`Quyền lợi · ${moQl?.nhaTaiTro ?? ""}`} rong>
        {moQl && (
          <>
            {(moQl.quyenLoi ?? []).length === 0 && QUYEN_LOI_THEO_HANG[moQl.mucTaiTro] && (
              <button className="btn-ghost mb-3" onClick={() => apMau(moQl)}>
                Tạo danh sách theo hạng {moQl.mucTaiTro}
              </button>
            )}
            <BangDuLieu
              bang="quyenloi"
              chaId={moQl.id}
              dong={moQl.quyenLoi ?? []}
              sua
              khongDan
              tenXuat="quyen-loi"
              khiDoi={(x) => setQl((q) => ({ ...q, [moQl.id]: { xong: x.filter((d) => d.xong).length, tong: x.length } }))}
              cot={["noiDung", "xong", "ghiChu"]}
            />
          </>
        )}
      </HopThoai>
    </div>
  );
}
