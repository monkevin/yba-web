"use client";

import { useState } from "react";
import type { DuLieuMuc } from "@/lib/ngoi-nha/cai-dat";
import { taoMaMuc } from "@/lib/ngoi-nha/cai-dat/chuan";
import type {
  CauChiaSeSua,
  NoiDungChiaSe,
} from "@/lib/ngoi-nha/cai-dat/noi-dung-sua";
import KhungCaiDat from "./KhungCaiDat";
import { GiaoDienNutVeGoc, MuiTenMo, Nhan } from "./GiaoDienChung";
import { doiCho, NutDong, OBat, OChu } from "./truong";

/** Khớp giới hạn trong `chuanChiaSe` (máy chủ cắt bớt nếu vượt). */
const TOI_DA_CAU = 60;
const LUA_CHON_TOI_THIEU = 2;
const LUA_CHON_TOI_DA = 6;

function phanThieu(c: CauChiaSeSua): string[] {
  const ds: string[] = [];
  if (!c.hoi.trim()) ds.push("câu hỏi");
  const coChu = new Set(c.luaChon.map((l) => l.trim()).filter(Boolean));
  if (coChu.size < LUA_CHON_TOI_THIEU) ds.push("ít nhất 2 lựa chọn khác nhau");
  return ds;
}

/** Trình sửa câu "chia sẻ về mình": bật / tắt, sửa chữ, thêm câu, 2–6 lựa chọn. */
export default function GiaoDienSuaChiaSe({
  du,
  soTraLoi,
  cauThuongBat,
  chiaSeBat,
}: {
  du: DuLieuMuc<NoiDungChiaSe>;
  /** maCau → chữ lựa chọn → số người đã chọn */
  soTraLoi: Record<string, Record<string, number>>;
  /** Công tắc chính câu thưởng cuối lượt (`nn.thongSo.cauThuong`) */
  cauThuongBat: boolean;
  /** Công tắc con "Câu thưởng chia sẻ về mình" ở tab Bật / tắt tính năng */
  chiaSeBat: boolean;
}) {
  const [lan, setLan] = useState(0);
  const [banDau, setBanDau] = useState(du.giaTri);
  const [moThem, setMoThem] = useState<string[]>([]);
  const daLuuTheoMa = new Map(du.giaTri.ds.map((c) => [c.ma, c]));
  const goc = new Set(du.macDinh.ds.map((c) => c.ma));
  // Câu Ban tự thêm đã lưu có thể đã có người trả lời (mã nằm trong NnChiaSe) →
  // về bộ gốc thì giữ lại ở trạng thái TẮT để tổng hợp vẫn hiện đúng câu hỏi
  const cauRieng = du.giaTri.ds.filter((c) => !goc.has(c.ma));
  const banGoc: NoiDungChiaSe = cauRieng.length
    ? {
        ds: [...du.macDinh.ds, ...cauRieng.map((c) => ({ ...c, bat: false }))],
      }
    : du.macDinh;

  return (
    <div className="max-w-3xl space-y-4">
      {!(cauThuongBat && chiaSeBat) && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Hội viên chưa được hỏi câu chia sẻ:{" "}
          {!cauThuongBat
            ? "công tắc chính “Câu thưởng cuối lượt” đang tắt"
            : "công tắc “Câu thưởng chia sẻ về mình” đang tắt"}{" "}
          ở tab Bật / tắt tính năng — sửa ở đây vẫn lưu, nhưng phải bật lại thì
          câu mới hiện.
        </div>
      )}

      <KhungCaiDat
        key={lan}
        muc="chiaSe"
        nhom={["ds"]}
        giaTri={banDau}
        macDinh={banGoc}
        tieuDe="Câu chia sẻ về mình"
        moTa="Câu thưởng cuối lượt không có đúng sai — hội viên chọn điều đúng với mình, Ban Điều hành xem tổng hợp ở tab Thống kê."
      >
        {(v, sua) => {
          const suaCau = (i: number, f: (c: CauChiaSeSua) => CauChiaSeSua) =>
            sua((x) => ({
              ...x,
              ds: x.ds.map((c, j) => (j === i ? f(c) : c)),
            }));
          const soBat = v.ds.filter((c) => c.bat).length;
          return (
            <div className="space-y-3">
              <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Kết quả được gom theo <b>đúng chữ</b> của từng lựa chọn. Sửa chữ
                một lựa chọn đã có người chọn thì kết quả cũ tách thành nhóm
                riêng, không cộng vào lựa chọn mới. Câu hỏi về thành viên Ban
                Chủ nhiệm do máy tự tạo nên không nằm ở đây.
              </div>
              <p className="text-sm text-slate-500">
                {v.ds.length} câu · {soBat} đang bật
              </p>

              <ul className="space-y-2">
                {v.ds.map((c, i) => {
                  const thieu = phanThieu(c);
                  const daLuu = daLuuTheoMa.get(c.ma);
                  const laMoi = !daLuu && !goc.has(c.ma);
                  const dem = soTraLoi[c.ma] ?? {};
                  const tongNguoi = Object.values(dem).reduce(
                    (s, n) => s + n,
                    0,
                  );
                  const hienTai = new Set(c.luaChon.map((l) => l.trim()));
                  const luaDaLuu = new Set(daLuu?.luaChon ?? []);
                  // Chữ đang lưu, đã có người chọn, mà bản đang sửa bỏ đi / đổi chữ
                  const roiNhom = Object.entries(dem).filter(
                    ([chu, n]) =>
                      n > 0 && luaDaLuu.has(chu) && !hienTai.has(chu),
                  );
                  const trung =
                    c.luaChon.map((l) => l.trim()).filter(Boolean).length >
                    new Set(c.luaChon.map((l) => l.trim()).filter(Boolean))
                      .size;
                  return (
                    <li key={c.ma}>
                      <details
                        className="group rounded-xl bg-white ring-1 ring-slate-200"
                        open={moThem.includes(c.ma) || undefined}
                      >
                        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
                          <span className="min-w-0 flex-1">
                            <span
                              className={`line-clamp-2 text-sm font-semibold ${c.bat ? "text-navy-800" : "text-slate-400 line-through"}`}
                            >
                              {c.hoi.trim() || "(chưa có câu hỏi)"}
                            </span>
                            <span className="mt-0.5 flex flex-wrap items-center gap-1">
                              <span className="text-[11px] text-slate-400">
                                {c.ma} · {c.luaChon.length} lựa chọn
                              </span>
                              {!c.bat && <Nhan mau="xam">Đang tắt</Nhan>}
                              {laMoi && <Nhan mau="xanh">Câu mới</Nhan>}
                              {thieu.length > 0 && (
                                <Nhan mau="vang">Thiếu nội dung</Nhan>
                              )}
                              {tongNguoi > 0 && (
                                <Nhan mau="navy">
                                  {tongNguoi} người đã trả lời
                                </Nhan>
                              )}
                            </span>
                          </span>
                          <MuiTenMo />
                        </summary>

                        <div className="space-y-3 border-t border-slate-100 p-3">
                          <OBat
                            nhan="Dùng câu này"
                            moTa="Tắt thì câu không được hỏi nữa; kết quả cũ vẫn giữ."
                            giaTri={c.bat}
                            onDoi={(b) => suaCau(i, (x) => ({ ...x, bat: b }))}
                          />
                          <OChu
                            nhan="Câu hỏi"
                            giaTri={c.hoi}
                            dai={200}
                            nhieuDong={2}
                            onDoi={(s) => suaCau(i, (x) => ({ ...x, hoi: s }))}
                          />

                          <div className="space-y-2">
                            <span className="lbl">
                              Lựa chọn (từ {LUA_CHON_TOI_THIEU} đến{" "}
                              {LUA_CHON_TOI_DA})
                            </span>
                            {c.luaChon.map((l, j) => {
                              const soNguoi = dem[l.trim()] ?? 0;
                              return (
                                <div
                                  key={j}
                                  className="space-y-1.5 rounded-lg bg-slate-50 p-2"
                                >
                                  <OChu
                                    nhan={`Lựa chọn ${j + 1}${soNguoi ? ` · ${soNguoi} người đã chọn` : ""}`}
                                    giaTri={l}
                                    dai={80}
                                    onDoi={(s) =>
                                      suaCau(i, (x) => ({
                                        ...x,
                                        luaChon: x.luaChon.map((y, k) =>
                                          k === j ? s : y,
                                        ),
                                      }))
                                    }
                                  />
                                  <div className="flex justify-end">
                                    <NutDong
                                      i={j}
                                      tong={c.luaChon.length}
                                      onDoi={(k) =>
                                        suaCau(i, (x) => ({
                                          ...x,
                                          luaChon: doiCho(x.luaChon, j, k),
                                        }))
                                      }
                                      onXoa={
                                        c.luaChon.length > LUA_CHON_TOI_THIEU
                                          ? () =>
                                              suaCau(i, (x) => ({
                                                ...x,
                                                luaChon: x.luaChon.filter(
                                                  (_, k) => k !== j,
                                                ),
                                              }))
                                          : undefined
                                      }
                                    />
                                  </div>
                                </div>
                              );
                            })}
                            {c.luaChon.length < LUA_CHON_TOI_DA && (
                              <button
                                type="button"
                                className="min-h-11 rounded-lg px-3 text-sm text-navy-700 ring-1 ring-slate-200 hover:bg-navy-50"
                                onClick={() =>
                                  suaCau(i, (x) => ({
                                    ...x,
                                    luaChon: [...x.luaChon, ""],
                                  }))
                                }
                              >
                                + Thêm lựa chọn
                              </button>
                            )}
                          </div>

                          {roiNhom.length > 0 && (
                            <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                              <b>Kết quả cũ sẽ tách riêng:</b>
                              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                                {roiNhom.map(([chu, n]) => (
                                  <li key={chu}>
                                    “{chu}” đã có {n} người chọn nhưng không còn
                                    trong câu này.
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {trung && (
                            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                              Có lựa chọn trùng chữ — khi lưu máy chủ chỉ giữ
                              một.
                            </p>
                          )}
                          {thieu.length > 0 && (
                            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                              Còn thiếu {thieu.join(", ")} — câu này sẽ bị bỏ
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
                              Xoá câu mới này
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
                disabled={v.ds.length >= TOI_DA_CAU}
                onClick={() => {
                  const ma = taoMaMuc("CS");
                  setMoThem((ds) => [...ds, ma]);
                  sua((x) => ({
                    ...x,
                    // Thứ tự trường giữ y như máy chủ trả về (`ma` cuối cùng)
                    // để lưu xong không bị báo "đã chỉnh" oan
                    ds: [
                      ...x.ds,
                      { bat: true, hoi: "", luaChon: ["", ""], ma },
                    ],
                  }));
                }}
              >
                + Thêm câu
                {v.ds.length >= TOI_DA_CAU ? ` (tối đa ${TOI_DA_CAU})` : ""}
              </button>
            </div>
          );
        }}
      </KhungCaiDat>

      <GiaoDienNutVeGoc<NoiDungChiaSe>
        muc="chiaSe"
        ten="câu chia sẻ"
        canhBao={
          cauRieng.length
            ? `Bỏ mọi chỉnh sửa, game dùng lại bộ câu chia sẻ gốc. ${cauRieng.length} câu tự thêm được giữ lại ở trạng thái tắt (không hỏi nữa, kết quả đã có vẫn xem được).`
            : "Bỏ mọi chỉnh sửa, game dùng lại bộ câu chia sẻ gốc. Kết quả đã có vẫn giữ nguyên."
        }
        giuLai={cauRieng.length ? banGoc : null}
        onXong={(g) => {
          setBanDau(g);
          setMoThem([]);
          setLan((n) => n + 1);
        }}
      />
    </div>
  );
}
