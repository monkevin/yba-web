"use client";

import { useState } from "react";
import type { DuLieuMuc } from "@/lib/ngoi-nha/cai-dat";
import { taoMaMuc } from "@/lib/ngoi-nha/cai-dat/chuan";
import type {
  NoiDungTheCoHoi,
  TheCoHoiSua,
} from "@/lib/ngoi-nha/cai-dat/noi-dung-sua";
import { MA_VON, type Von } from "@/lib/ngoi-nha/luat";
import KhungCaiDat from "./KhungCaiDat";
import {
  GiaoDienNutVeGoc,
  GiaoDienOVon,
  MuiTenMo,
  Nhan,
} from "./GiaoDienChung";
import { OBat, OChu } from "./truong";

/** Khớp giới hạn trong `chuanTheCoHoi` (máy chủ cắt bớt nếu vượt). */
const TOI_DA_THE = 60;
const GIOI_HAN_VON = [-10, 10] as const;

const tongVon = (v: Partial<Von>) =>
  MA_VON.reduce((s, k) => s + (v[k] ?? 0), 0);

/** Phần còn thiếu khiến máy chủ bỏ thẻ khi lưu. */
function phanThieu(t: TheCoHoiSua): string[] {
  const ds: string[] = [];
  if (!t.ten.trim()) ds.push("tên thẻ");
  if (!t.tinhHuong.trim()) ds.push("tình huống");
  if (t.lua.length < 2 || t.lua.some((l) => !l.chon.trim()))
    ds.push("nội dung lựa chọn");
  return ds;
}

/** Trình sửa Thẻ Cơ hội: bật / tắt, sửa chữ và vốn, thêm thẻ mới. */
export default function GiaoDienSuaTheCoHoi({
  du,
  soLanRut,
  dangBat,
}: {
  du: DuLieuMuc<NoiDungTheCoHoi>;
  soLanRut: Record<string, number>;
  /** Công tắc "Thẻ Cơ hội sau khi qua trạm" ở tab Bật / tắt tính năng */
  dangBat: boolean;
}) {
  // Đổi `lan` để nạp lại khung sau khi đưa về bộ gốc
  const [lan, setLan] = useState(0);
  const [banDau, setBanDau] = useState(du.giaTri);
  const [moThem, setMoThem] = useState<string[]>([]);
  const daLuu = new Set(du.giaTri.ds.map((t) => t.ma));
  const goc = new Set(du.macDinh.ds.map((t) => t.ma));
  // Thẻ Ban tự thêm đã lưu có thể đã được rút (mã nằm trong CSDL) → về bộ gốc
  // thì giữ lại ở trạng thái TẮT chứ không xoá khỏi danh sách
  const theRieng = du.giaTri.ds.filter((t) => !goc.has(t.ma));
  const banGoc: NoiDungTheCoHoi = theRieng.length
    ? {
        ds: [...du.macDinh.ds, ...theRieng.map((t) => ({ ...t, bat: false }))],
      }
    : du.macDinh;

  return (
    <div className="max-w-3xl space-y-4">
      {!dangBat && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Thẻ Cơ hội đang <b>tắt</b> ở tab Bật / tắt tính năng — sửa ở đây vẫn
          lưu, nhưng qua trạm hội viên chưa rút thẻ cho tới khi bật lại.
        </div>
      )}

      <KhungCaiDat
        key={lan}
        muc="theCoHoi"
        nhom={["ds"]}
        giaTri={banDau}
        macDinh={banGoc}
        tieuDe="Thẻ Cơ hội"
        moTa="Qua một trạm, hội viên rút một thẻ tình huống và chọn 1 trong 2 cách xử lý. Thẻ chỉ cộng / trừ vốn, không cộng điểm."
      >
        {(v, sua) => {
          const suaThe = (i: number, f: (t: TheCoHoiSua) => TheCoHoiSua) =>
            sua((x) => ({
              ...x,
              ds: x.ds.map((t, j) => (j === i ? f(t) : t)),
            }));
          const suaLua = (
            i: number,
            li: number,
            phan: Partial<TheCoHoiSua["lua"][number]>,
          ) =>
            suaThe(i, (t) => ({
              ...t,
              lua: t.lua.map((l, j) => (j === li ? { ...l, ...phan } : l)),
            }));
          const soBat = v.ds.filter((t) => t.bat).length;
          return (
            <div className="space-y-3">
              <div className="rounded-xl bg-navy-50 px-4 py-3 text-sm text-navy-800">
                <b>Lựa chọn 1 là lựa chọn khôn ngoan</b> — game tự xáo thứ tự
                khi hiện cho hội viên. Thẻ đã có người rút thì chỉ nên tắt hoặc
                sửa câu chữ, đừng đổi hẳn tình huống.
              </div>
              <p className="text-sm text-slate-500">
                {v.ds.length} thẻ · {soBat} đang bật
              </p>
              {soBat === 0 && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Mọi thẻ đang tắt — qua trạm sẽ không có thẻ nào để rút. Muốn
                  tắt hẳn tính năng thì dùng tab Bật / tắt tính năng.
                </p>
              )}

              <ul className="space-y-2">
                {v.ds.map((t, i) => {
                  const thieu = phanThieu(t);
                  const laMoi = !daLuu.has(t.ma) && !goc.has(t.ma);
                  const rut = soLanRut[t.ma] ?? 0;
                  const khonNgoanItHon =
                    t.lua.length === 2 &&
                    tongVon(t.lua[0].von) <= tongVon(t.lua[1].von);
                  return (
                    <li key={t.ma}>
                      <details
                        className="group rounded-xl bg-white ring-1 ring-slate-200"
                        open={moThem.includes(t.ma) || undefined}
                      >
                        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block truncate text-sm font-semibold ${t.bat ? "text-navy-800" : "text-slate-400 line-through"}`}
                            >
                              {t.ten.trim() || "(chưa đặt tên)"}
                            </span>
                            <span className="mt-0.5 flex flex-wrap items-center gap-1">
                              <span className="text-[11px] text-slate-400">
                                {t.ma}
                              </span>
                              {!t.bat && <Nhan mau="xam">Đang tắt</Nhan>}
                              {laMoi && <Nhan mau="xanh">Thẻ mới</Nhan>}
                              {thieu.length > 0 && (
                                <Nhan mau="vang">Thiếu nội dung</Nhan>
                              )}
                              {rut > 0 && (
                                <Nhan mau="navy">Đã rút {rut} lần</Nhan>
                              )}
                            </span>
                          </span>
                          <MuiTenMo />
                        </summary>

                        <div className="space-y-3 border-t border-slate-100 p-3">
                          <OBat
                            nhan="Dùng thẻ này"
                            moTa="Tắt thì thẻ không được rút nữa; ai đã rút vẫn xem lại được."
                            giaTri={t.bat}
                            onDoi={(b) => suaThe(i, (x) => ({ ...x, bat: b }))}
                          />
                          <OChu
                            nhan="Tên thẻ"
                            giaTri={t.ten}
                            dai={80}
                            onDoi={(s) => suaThe(i, (x) => ({ ...x, ten: s }))}
                          />
                          <OChu
                            nhan="Tình huống"
                            giaTri={t.tinhHuong}
                            dai={400}
                            nhieuDong={3}
                            onDoi={(s) =>
                              suaThe(i, (x) => ({ ...x, tinhHuong: s }))
                            }
                          />
                          {t.lua.slice(0, 2).map((l, li) => (
                            <div
                              key={li}
                              className={`space-y-2 rounded-xl p-3 ring-1 ${li === 0 ? "bg-emerald-50/60 ring-emerald-200" : "bg-slate-50 ring-slate-200"}`}
                            >
                              <div
                                className={`text-xs font-bold uppercase tracking-wide ${li === 0 ? "text-emerald-700" : "text-slate-500"}`}
                              >
                                {li === 0
                                  ? "Lựa chọn 1 — khôn ngoan"
                                  : "Lựa chọn 2"}
                              </div>
                              <OChu
                                nhan="Cách xử lý"
                                giaTri={l.chon}
                                dai={200}
                                nhieuDong={2}
                                onDoi={(s) => suaLua(i, li, { chon: s })}
                              />
                              <div>
                                <span className="lbl">
                                  Vốn cộng / trừ khi chọn (từ -10 đến 10)
                                </span>
                                <GiaoDienOVon
                                  von={l.von}
                                  gioiHan={GIOI_HAN_VON}
                                  onDoi={(von) => suaLua(i, li, { von })}
                                />
                              </div>
                              <OChu
                                nhan="Giải thích hiện sau khi chọn"
                                giaTri={l.giai}
                                dai={300}
                                nhieuDong={2}
                                onDoi={(s) => suaLua(i, li, { giai: s })}
                              />
                            </div>
                          ))}
                          {khonNgoanItHon && (
                            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                              Lựa chọn 1 đang cộng ít vốn hơn (hoặc bằng) lựa
                              chọn 2 — kiểm tra lại lựa chọn khôn ngoan đã đứng
                              đầu chưa.
                            </p>
                          )}
                          {thieu.length > 0 && (
                            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                              Còn thiếu {thieu.join(", ")} — thẻ này sẽ bị bỏ
                              khi lưu.
                            </p>
                          )}
                          {laMoi && (
                            <button
                              type="button"
                              className="min-h-11 rounded-lg px-3 text-sm text-do-600 ring-1 ring-slate-200 hover:bg-do-50"
                              onClick={() =>
                                sua((x) => ({
                                  ...x,
                                  ds: x.ds.filter((_, j) => j !== i),
                                }))
                              }
                            >
                              Xoá thẻ mới này
                            </button>
                          )}
                        </div>
                      </details>
                    </li>
                  );
                })}
              </ul>

              <button
                type="button"
                className="btn-ghost min-h-11 w-full sm:w-auto"
                disabled={v.ds.length >= TOI_DA_THE}
                onClick={() => {
                  const ma = taoMaMuc("CH");
                  setMoThem((ds) => [...ds, ma]);
                  sua((x) => ({
                    ...x,
                    ds: [
                      ...x.ds,
                      // Thứ tự trường giữ y như máy chủ trả về (`ma` cuối cùng)
                      // để lưu xong không bị báo "đã chỉnh" oan
                      {
                        bat: true,
                        ten: "",
                        tinhHuong: "",
                        lua: [
                          { chon: "", von: {}, giai: "" },
                          { chon: "", von: {}, giai: "" },
                        ],
                        ma,
                      },
                    ],
                  }));
                }}
              >
                + Thêm thẻ
                {v.ds.length >= TOI_DA_THE ? ` (tối đa ${TOI_DA_THE})` : ""}
              </button>
            </div>
          );
        }}
      </KhungCaiDat>

      <GiaoDienNutVeGoc<NoiDungTheCoHoi>
        muc="theCoHoi"
        ten="Thẻ Cơ hội"
        canhBao={
          theRieng.length
            ? `Bỏ mọi chỉnh sửa, game dùng lại bộ thẻ gốc soạn sẵn. ${theRieng.length} thẻ tự thêm được giữ lại ở trạng thái tắt (không rút nữa, người đã rút vẫn xem được).`
            : "Bỏ mọi chỉnh sửa, game dùng lại bộ thẻ gốc soạn sẵn."
        }
        giuLai={theRieng.length ? banGoc : null}
        onXong={(g) => {
          setBanDau(g);
          setMoThem([]);
          setLan((n) => n + 1);
        }}
      />
    </div>
  );
}
