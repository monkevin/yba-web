"use client";

/**
 * Danh sách trận Đấu trường chưa xong: lọc theo số ngày treo (mặc định cũ hơn
 * 3 ngày), nút "Huỷ trận" hai bước. Dữ liệu tải sẵn ở máy chủ, lọc tại chỗ.
 */
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import type { TranTreo } from "@/lib/ngoi-nha/dau-truong";
import { ngayGioDep } from "@/lib/ngoi-nha/thoi-gian";
import { huyTranDauBan, type KetQuaDauTruong } from "./actions-dau-truong";
import { INP } from "./truong";

const MOC_NGAY = [
  { so: 1, ten: "Cũ hơn 1 ngày" },
  { so: 3, ten: "Cũ hơn 3 ngày" },
  { so: 7, ten: "Cũ hơn 7 ngày" },
  { so: 14, ten: "Cũ hơn 14 ngày" },
  { so: 0, ten: "Tất cả trận chưa xong" },
];

export default function DauTruongDsTran({
  ds,
  tong,
  bayGio,
}: {
  ds: TranTreo[];
  tong: number;
  /** Mốc thời gian máy chủ (ms) — tính "cũ hơn N ngày" ổn định giữa hai lần render */
  bayGio: number;
}) {
  const id = useId();
  const [soNgay, setSoNgay] = useState(3);
  const loc = ds.filter(
    (t) => !soNgay || bayGio - new Date(t.taoLuc).getTime() > soNgay * 86400e3,
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block w-full sm:w-64" htmlFor={id}>
          <span className="lbl">Lọc trận treo</span>
          <select
            id={id}
            className={INP}
            value={soNgay}
            onChange={(e) => setSoNgay(Number(e.target.value))}
          >
            {MOC_NGAY.map((m) => (
              <option key={m.so} value={m.so}>
                {m.ten}
              </option>
            ))}
          </select>
        </label>
        <p className="pb-2 text-sm text-slate-500">
          {loc.length} / {tong} trận chưa xong
          {tong > ds.length ? ` (đang xem ${ds.length} trận cũ nhất)` : ""}
        </p>
      </div>

      {loc.length === 0 ? (
        <div className="card px-4 py-8 text-center text-sm text-slate-500">
          Không có trận nào treo lâu như vậy.
        </div>
      ) : (
        <ul className="card divide-y divide-slate-100">
          {loc.map((t) => (
            <DongTran key={t.id} t={t} bayGio={bayGio} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DongTran({ t, bayGio }: { t: TranTreo; bayGio: number }) {
  const router = useRouter();
  const [hoi, setHoi] = useState(false);
  const [kq, setKq] = useState<KetQuaDauTruong>({});
  const [dangHuy, startTransition] = useTransition();
  const soNgay = Math.floor((bayGio - new Date(t.taoLuc).getTime()) / 86400e3);
  const choAi =
    t.trangThai === "CHO_THACH"
      ? `Chờ ${t.thach.ten} chơi lượt mở màn`
      : `Chờ ${t.doiThu.ten} nhận lời${t.thachDung !== null ? ` · người thách đúng ${t.thachDung}/${t.soCau}` : ""}`;

  if (kq.ok)
    return (
      <li className="px-4 py-3 text-sm text-emerald-700">
        Đã huỷ trận {t.thach.ten} – {t.doiThu.ten}.
      </li>
    );

  return (
    <li className="space-y-2 px-4 py-3">
      <div className="min-w-0">
        <div className="font-semibold text-navy-800">
          {t.thach.ten}{" "}
          <span className="font-normal text-slate-400">thách</span>{" "}
          {t.doiThu.ten}
        </div>
        <div className="text-sm text-slate-600">{choAi}</div>
        <div className="text-xs text-slate-400">
          {t.tenBo} · tạo {ngayGioDep(new Date(t.taoLuc))}
          {soNgay > 0 ? ` · treo ${soNgay} ngày` : ""}
        </div>
      </div>
      {hoi ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-900 ring-1 ring-amber-200">
          <span>
            Huỷ trận này? Không ai bị trừ điểm, hai người thách lại được.
          </span>
          <button
            type="button"
            disabled={dangHuy}
            onClick={() =>
              startTransition(async () => {
                const r = await huyTranDauBan(t.id);
                setKq(r);
                setHoi(false);
                if (r.ok) router.refresh();
              })
            }
            className="min-h-11 rounded-lg bg-do-600 px-3 font-medium text-white hover:bg-do-700 disabled:opacity-50"
          >
            {dangHuy ? "Đang huỷ…" : "Huỷ trận"}
          </button>
          <button
            type="button"
            onClick={() => setHoi(false)}
            className="min-h-11 rounded-lg bg-white px-3 ring-1 ring-slate-200"
          >
            Thôi
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setKq({});
            setHoi(true);
          }}
          className="min-h-11 rounded-lg px-3 text-sm font-medium text-do-600 ring-1 ring-do-200 hover:bg-do-50"
        >
          Huỷ trận
        </button>
      )}
      {kq.error && <p className="text-sm text-do-600">{kq.error}</p>}
    </li>
  );
}
