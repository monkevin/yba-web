"use client";

/**
 * Ẩn / hiện câu và cả bộ trong kho bộ câu thách đấu (`nn.boCauAn`). Chủ đề và
 * bộ hiện dạng thu gọn; câu (kèm đáp án — chỉ ở trang quản trị) tải khi mở một
 * bộ, nên trang không phải dựng cả nghìn câu. Bấm ẩn / hiện rồi "Lưu".
 */
import { useState, useTransition } from "react";
import type { DuLieuMuc } from "@/lib/ngoi-nha/cai-dat";
import type { BoCauAn } from "@/lib/ngoi-nha/cai-dat/noi-dung-sua";
import { xemCauTrongBo, type CauTrongBo } from "./actions-dau-truong";
import KhungCaiDat from "./KhungCaiDat";

export type ChuDeTomTat = {
  ma: string;
  ten: string;
  bo: { ma: string; ten: string; moTa: string; so: number[] }[];
};
export type CauTimThay = CauTrongBo & { maBo: string; tenBo: string };

/** Phải khớp `maCauBo` ở lib/ngoi-nha/bo-cau.ts (file đó chỉ dùng ở máy chủ). */
const maCau = (maBo: string, so: number) => `dt:${maBo}:${so}`;
/** Khớp SO_CAU_TOI_THIEU_BO ở bo-cau.ts */
const TOI_THIEU = 5;

type Sua = (f: (v: BoCauAn) => BoCauAn) => void;

const batTat = (ds: string[], ma: string) =>
  ds.includes(ma) ? ds.filter((x) => x !== ma) : [...ds, ma];

export default function DauTruongKhoBoCau({
  muc,
  chuDe,
  tim,
}: {
  muc: DuLieuMuc<BoCauAn>;
  chuDe: ChuDeTomTat[];
  tim: {
    q: string;
    boKhop: string[];
    cauKhop: CauTimThay[];
    conNua: number;
  } | null;
}) {
  // Câu đã tải của từng bộ — giữ lại khi đóng / mở để khỏi tải lại
  const [daTai, setDaTai] = useState<Record<string, CauTrongBo[]>>({});
  const boTheoMa = new Map(
    chuDe.flatMap((cd) => cd.bo.map((b) => [b.ma, { ...b, tenChuDe: cd.ten }])),
  );

  return (
    <KhungCaiDat
      muc="boCauAn"
      nhom={["bo", "cau"]}
      giaTri={muc.giaTri}
      macDinh={muc.macDinh}
      tieuDe="Kho bộ câu thách đấu"
      chuLuu="Lưu câu / bộ ẩn"
      moTa="Bấm Ẩn / Hiện ở từng câu hoặc cả bộ, xong bấm Lưu. “Về mặc định” = hiện lại toàn bộ kho."
    >
      {(v, sua) => {
        const boAn = new Set(v.bo);
        const cauAn = new Set(v.cau);
        const soHien = (b: ChuDeTomTat["bo"][number]) =>
          b.so.filter((s) => !cauAn.has(maCau(b.ma, s))).length;
        const dungDuoc = (b: ChuDeTomTat["bo"][number]) =>
          !boAn.has(b.ma) && soHien(b) >= TOI_THIEU;
        const tatCa = chuDe.flatMap((cd) => cd.bo);
        const soDung = tatCa.filter(dungDuoc).length;

        const dongBo = (b: ChuDeTomTat["bo"][number], tenChuDe?: string) => (
          <DongBo
            key={b.ma}
            bo={b}
            tenChuDe={tenChuDe}
            an={boAn.has(b.ma)}
            soHien={soHien(b)}
            cauAn={cauAn}
            sua={sua}
            cau={daTai[b.ma]}
            luuCau={(ds) => setDaTai((x) => ({ ...x, [b.ma]: ds }))}
          />
        );

        return (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              <b>{soDung}</b>/{tatCa.length} bộ đang dùng được
              {v.bo.length ? ` · ${v.bo.length} bộ bị ẩn` : ""}
              {v.cau.length ? ` · ${v.cau.length} câu bị ẩn` : ""}
              {soDung === 0
                ? " — kho trống, trận thách đấu sẽ rút từ 22 trạm."
                : "."}
            </p>

            {tim ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Tìm “{tim.q}”: {tim.boKhop.length} bộ,{" "}
                  {tim.cauKhop.length + tim.conNua} câu
                  {tim.conNua
                    ? ` (hiện ${tim.cauKhop.length} câu đầu — gõ cụ thể hơn để thu hẹp)`
                    : ""}
                  .
                </p>
                {tim.boKhop.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-navy-800">
                      Bộ câu khớp
                    </h3>
                    {tim.boKhop.map((ma) => {
                      const b = boTheoMa.get(ma);
                      return b ? dongBo(b, b.tenChuDe) : null;
                    })}
                  </div>
                )}
                {tim.cauKhop.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-navy-800">
                      Câu khớp
                    </h3>
                    <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
                      {tim.cauKhop.map((c) => (
                        <DongCau
                          key={maCau(c.maBo, c.so)}
                          c={c}
                          tenBo={c.tenBo}
                          an={cauAn.has(maCau(c.maBo, c.so))}
                          boAn={boAn.has(c.maBo)}
                          onDoi={() =>
                            sua((x) => ({
                              ...x,
                              cau: batTat(x.cau, maCau(c.maBo, c.so)),
                            }))
                          }
                        />
                      ))}
                    </ul>
                  </div>
                )}
                {tim.boKhop.length === 0 && tim.cauKhop.length === 0 && (
                  <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Không có bộ hay câu nào khớp.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {chuDe.map((cd) => {
                  const dung = cd.bo.filter(dungDuoc).length;
                  return (
                    <details
                      key={cd.ma}
                      className="rounded-xl bg-white ring-1 ring-slate-200"
                    >
                      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 px-3 py-2.5">
                        <span className="font-semibold text-navy-800">
                          {cd.ten}
                        </span>
                        <span
                          className={`shrink-0 text-xs ${dung < cd.bo.length ? "font-semibold text-amber-700" : "text-slate-500"}`}
                        >
                          {dung}/{cd.bo.length} bộ dùng được
                        </span>
                      </summary>
                      <div className="space-y-2 border-t border-slate-100 p-2 sm:p-3">
                        {cd.bo.map((b) => dongBo(b))}
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </div>
        );
      }}
    </KhungCaiDat>
  );
}

function DongBo({
  bo,
  tenChuDe,
  an,
  soHien,
  cauAn,
  sua,
  cau,
  luuCau,
}: {
  bo: ChuDeTomTat["bo"][number];
  /** Hiện tên chủ đề phía trên (ở kết quả tìm) */
  tenChuDe?: string;
  an: boolean;
  soHien: number;
  cauAn: Set<string>;
  sua: Sua;
  cau: CauTrongBo[] | undefined;
  luuCau: (ds: CauTrongBo[]) => void;
}) {
  const [mo, setMo] = useState(false);
  const [loi, setLoi] = useState("");
  const [dangTai, startTransition] = useTransition();
  const thieu = !an && soHien < TOI_THIEU;

  const moCau = () => {
    const moi = !mo;
    setMo(moi);
    if (moi && !cau) {
      setLoi("");
      startTransition(async () => {
        const r = await xemCauTrongBo(bo.ma);
        if (r.cau) luuCau(r.cau);
        else setLoi(r.error ?? "Chưa tải được câu hỏi — thử lại");
      });
    }
  };

  return (
    <div
      className={`rounded-lg p-2.5 ring-1 ${an || thieu ? "bg-slate-50 ring-slate-200" : "bg-white ring-navy-100"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          {tenChuDe && <div className="text-xs text-slate-400">{tenChuDe}</div>}
          <div
            className={`font-medium ${an ? "text-slate-500 line-through" : "text-navy-800"}`}
          >
            {bo.ten}
          </div>
          <div className="text-xs text-slate-500">
            {an ? (
              <span className="font-semibold text-slate-600">
                Đang ẩn cả bộ
              </span>
            ) : thieu ? (
              <span className="font-semibold text-amber-700">
                Chỉ còn {soHien} câu hiện — bộ không được dùng
              </span>
            ) : (
              <>
                Hiện {soHien}/{bo.so.length} câu
              </>
            )}
            {!an && soHien < bo.so.length && !thieu
              ? ` · ${bo.so.length - soHien} câu ẩn`
              : ""}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={moCau}
            className="min-h-11 rounded-lg px-3 text-sm text-navy-700 ring-1 ring-navy-100 hover:bg-navy-50"
          >
            {mo ? "Thu gọn" : "Xem câu"}
          </button>
          <button
            type="button"
            onClick={() => sua((x) => ({ ...x, bo: batTat(x.bo, bo.ma) }))}
            className={`min-h-11 rounded-lg px-3 text-sm font-medium ring-1 ${
              an
                ? "text-emerald-700 ring-emerald-200 hover:bg-emerald-50"
                : "text-do-600 ring-do-200 hover:bg-do-50"
            }`}
          >
            {an ? "Hiện lại bộ" : "Ẩn cả bộ"}
          </button>
        </div>
      </div>
      {mo && (
        <div className="mt-2">
          {dangTai && !cau && (
            <p className="py-3 text-center text-sm text-slate-400">
              Đang tải câu…
            </p>
          )}
          {loi && <p className="text-sm text-do-600">{loi}</p>}
          {cau && (
            <ul className="divide-y divide-slate-100 rounded-lg bg-white ring-1 ring-slate-200">
              {cau.map((c) => (
                <DongCau
                  key={c.so}
                  c={c}
                  an={cauAn.has(maCau(bo.ma, c.so))}
                  boAn={an}
                  onDoi={() =>
                    sua((x) => ({
                      ...x,
                      cau: batTat(x.cau, maCau(bo.ma, c.so)),
                    }))
                  }
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function DongCau({
  c,
  tenBo,
  an,
  boAn,
  onDoi,
}: {
  c: CauTrongBo;
  tenBo?: string;
  an: boolean;
  boAn: boolean;
  onDoi: () => void;
}) {
  return (
    <li
      className={`space-y-1.5 px-3 py-2.5 text-sm ${an ? "bg-slate-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {tenBo && <div className="text-xs text-slate-400">{tenBo}</div>}
          <div
            className={
              an ? "text-slate-500 line-through" : "font-medium text-navy-900"
            }
          >
            <span className="mr-1 text-xs text-slate-400">Câu {c.so}.</span>
            {c.hoi}
          </div>
        </div>
        <button
          type="button"
          onClick={onDoi}
          className={`min-h-11 shrink-0 rounded-lg px-3 text-xs font-medium ring-1 ${
            an
              ? "text-emerald-700 ring-emerald-200 hover:bg-emerald-50"
              : "text-do-600 ring-do-200 hover:bg-do-50"
          }`}
        >
          {an ? "Hiện câu" : "Ẩn câu"}
        </button>
      </div>
      <ol className="grid gap-1 sm:grid-cols-2">
        {c.phuongAn.map((p, i) => (
          <li
            key={i}
            className={`rounded-md px-2 py-1 text-xs ${
              i === c.dung
                ? "bg-emerald-50 font-semibold text-emerald-800 ring-1 ring-emerald-200"
                : "bg-slate-50 text-slate-600"
            }`}
          >
            {"ABCD"[i]}. {p}
          </li>
        ))}
      </ol>
      {c.giai && <p className="text-xs italic text-slate-500">{c.giai}</p>}
      {boAn && !an && (
        <p className="text-xs text-slate-400">
          Cả bộ đang ẩn nên câu này cũng không ra.
        </p>
      )}
    </li>
  );
}
