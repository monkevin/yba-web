"use client";

import type { ReactNode } from "react";
import type { DuLieuMuc } from "@/lib/ngoi-nha/cai-dat";
import { GIOI_HAN_LUAT, type LuatChoi } from "@/lib/ngoi-nha/cai-dat/luat-choi";
import { HUY_HIEU, LOAI_CAU, soDep, type LoaiCau } from "@/lib/ngoi-nha/luat";
import { GIOI_HAN_THONG_SO, type ThongSoGame } from "@/lib/ngoi-nha/moc-qua";
import KhungCaiDat from "./KhungCaiDat";
import { OBat, OChu, OSo } from "./truong";

type Tram = LuatChoi["tram"];
type KhoaSoTram = Exclude<keyof Tram, "giay">;
type Sua = (f: (v: LuatChoi) => LuatChoi) => void;

/** Trạm luôn 10 câu (cấu trúc 22 trạm × 10 câu giữ trong code). */
const SO_CAU_TRAM = 10;

/**
 * Điểm tối đa một lượt 10 câu: câu nào cũng đúng ngay lập tức (đủ điểm tốc độ),
 * chuỗi từ câu 3 được thưởng mức 3, từ câu 5 được mức 5; trạm Thử thách nhân hệ
 * số. Chưa tính câu thưởng cuối lượt.
 */
function diemToiDaTram(t: Tram, thuThach: boolean): number {
  let tong = 0;
  for (let i = 1; i <= SO_CAU_TRAM; i++) {
    const chuoi = i >= 5 ? t.chuoiTu5 : i >= 3 ? t.chuoiTu3 : 0;
    tong += t.dung + t.tocDoToiDa + chuoi;
  }
  return tong * (thuThach ? t.heSoThuThach : 1);
}

const LUOI = "grid gap-3 sm:grid-cols-2";

function Nhom({ ten, children }: { ten: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
        {ten}
      </legend>
      {children}
    </fieldset>
  );
}

/** Luật điểm hành trình 22 trạm, thử thách ngày, câu thưởng, vốn, danh hiệu, huy hiệu. */
export default function SuaLuatChoi({
  luat,
  thongSo,
  giuaMua,
}: {
  luat: DuLieuMuc<LuatChoi>;
  thongSo: DuLieuMuc<ThongSoGame>;
  /** Mùa chính thức đang diễn ra → cảnh báo đổi luật giữa mùa */
  giuaMua: boolean;
}) {
  const md = luat.macDinh;
  const g = GIOI_HAN_LUAT;
  const canhBao = giuaMua
    ? "Mùa giải đang diễn ra: người đã chơi trước khi lưu và người chơi sau sẽ khác luật. Chỉ lưu khi thật cần và báo cho hội viên."
    : undefined;

  const oTram = (
    v: LuatChoi,
    sua: Sua,
    k: KhoaSoTram,
    nhan: string,
    them?: { donVi?: string; goiY?: ReactNode },
  ) => (
    <OSo
      nhan={nhan}
      giaTri={v.tram[k]}
      macDinh={md.tram[k]}
      gioiHan={g.tram[k]}
      donVi={them?.donVi}
      goiY={them?.goiY}
      onDoi={(n) => sua((x) => ({ ...x, tram: { ...x.tram, [k]: n } }))}
    />
  );

  return (
    <div className="max-w-3xl space-y-4">
      {/* ── Hành trình 22 trạm ── */}
      <KhungCaiDat
        muc="luat"
        nhom={["tram"]}
        giaTri={luat.giaTri}
        macDinh={md}
        tieuDe="Hành trình 22 trạm"
        moTa="Điểm mỗi câu, sao, vốn khi qua trạm và thời gian trả lời. Lượt đang chơi dở vẫn giữ số giây lúc bắt đầu."
        canhBao={canhBao}
      >
        {(v, sua) => {
          const t = v.tram;
          const saoLech =
            t.saoMot > t.saoHai ||
            t.saoMotThuThach > t.saoHai ||
            t.saoHai > t.saoBa;
          return (
            <div className="space-y-5">
              <div className="rounded-xl bg-navy-50 px-4 py-3 text-sm text-navy-800">
                Điểm tối đa một trạm thường:{" "}
                <b className="text-base">{soDep(diemToiDaTram(t, false))}</b> ·
                trạm Thử thách:{" "}
                <b className="text-base">{soDep(diemToiDaTram(t, true))}</b>
                <span className="mt-0.5 block text-xs text-navy-600">
                  10 câu đúng, trả lời ngay lập tức, giữ chuỗi từ đầu; chưa tính
                  câu thưởng cuối lượt.
                </span>
              </div>

              <Nhom ten="Điểm mỗi câu">
                <div className={LUOI}>
                  {oTram(v, sua, "dung", "Điểm câu đúng", { donVi: "điểm" })}
                  {oTram(v, sua, "tocDoToiDa", "Điểm tốc độ tối đa", {
                    donVi: "điểm",
                    goiY: "trả lời càng nhanh càng gần mức này",
                  })}
                  {oTram(v, sua, "chuoiTu3", "Thưởng chuỗi từ câu đúng thứ 3", {
                    donVi: "điểm/câu",
                  })}
                  {oTram(v, sua, "chuoiTu5", "Thưởng chuỗi từ câu đúng thứ 5", {
                    donVi: "điểm/câu",
                  })}
                  {oTram(v, sua, "motPhan", "Điểm đúng một phần", {
                    donVi: "điểm/ý",
                    goiY: "câu sắp xếp / ghép cặp đúng một phần",
                  })}
                  {oTram(v, sua, "heSoThuThach", "Hệ số trạm Thử thách", {
                    donVi: "lần",
                  })}
                </div>
              </Nhom>

              <Nhom ten="Sao & vượt trạm (số câu đúng trên 10)">
                <div className={LUOI}>
                  {oTram(v, sua, "saoMot", "1 sao — trạm thường", {
                    donVi: "câu",
                    goiY: "có 1 sao là vượt trạm",
                  })}
                  {oTram(v, sua, "saoMotThuThach", "1 sao — trạm Thử thách", {
                    donVi: "câu",
                  })}
                  {oTram(v, sua, "saoHai", "2 sao", { donVi: "câu" })}
                  {oTram(v, sua, "saoBa", "3 sao", { donVi: "câu" })}
                </div>
                {saoLech && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Ngưỡng sao phải tăng dần (1 sao ≤ 2 sao ≤ 3 sao). Khi lưu,
                    máy chủ tự hạ ngưỡng thấp hơn cho khớp.
                  </p>
                )}
              </Nhom>

              <Nhom ten="Vốn khi qua trạm">
                <div className={LUOI}>
                  {oTram(v, sua, "vonChinh", "Vốn chính của chặng", {
                    donVi: "vốn",
                    goiY: "cộng khi vượt trạm",
                  })}
                  {oTram(v, sua, "vonCanBang", "Mỗi vốn ở chặng Vươn tầm", {
                    donVi: "vốn",
                    goiY: "chặng cân bằng cộng đều cả 4 vốn",
                  })}
                </div>
              </Nhom>

              <Nhom ten="Thời gian">
                <div className={LUOI}>
                  {oTram(v, sua, "giayThem", "Trợ giúp thêm giờ", {
                    donVi: "giây",
                  })}
                  {(Object.keys(LOAI_CAU) as LoaiCau[]).map((k) => (
                    <OSo
                      key={k}
                      nhan={`Câu ${LOAI_CAU[k].ten.toLowerCase()}`}
                      giaTri={t.giay[k]}
                      macDinh={md.tram.giay[k]}
                      gioiHan={g.tram.giay}
                      donVi="giây"
                      onDoi={(n) =>
                        sua((x) => ({
                          ...x,
                          tram: {
                            ...x.tram,
                            giay: { ...x.tram.giay, [k]: n },
                          },
                        }))
                      }
                    />
                  ))}
                </div>
              </Nhom>
            </div>
          );
        }}
      </KhungCaiDat>

      {/* ── Lượt tính điểm (nn.thongSo) ── */}
      <KhungCaiDat
        muc="thongSo"
        nhom={["luotTinhDiemToiDa"]}
        giaTri={thongSo.giaTri}
        macDinh={thongSo.macDinh}
        tieuDe="Số lượt tính điểm mỗi trạm"
        moTa="Mỗi trạm, mỗi mùa chỉ vài lượt đầu được cộng điểm và vốn; chơi thêm là luyện tập (vẫn lên sao, mở trạm)."
        canhBao={canhBao}
      >
        {(v, sua) => (
          <OSo
            nhan="Lượt tính điểm tối đa"
            giaTri={v.luotTinhDiemToiDa}
            macDinh={thongSo.macDinh.luotTinhDiemToiDa}
            gioiHan={GIOI_HAN_THONG_SO.luotTinhDiemToiDa}
            donVi="lượt / trạm"
            onDoi={(n) => sua((x) => ({ ...x, luotTinhDiemToiDa: n }))}
          />
        )}
      </KhungCaiDat>

      {/* ── Thử thách hằng ngày ── */}
      <KhungCaiDat
        muc="luat"
        nhom={["thuThachNgay"]}
        giaTri={luat.giaTri}
        macDinh={md}
        tieuDe="Thử thách hằng ngày"
        moTa="Mỗi ngày một lượt câu hỏi ngẫu nhiên từ các trạm đã mở. Ngày mới bắt đầu lúc 6:00 sáng."
        canhBao={canhBao}
      >
        {(v, sua) => {
          const d = v.thuThachNgay;
          const doi = (k: keyof LuatChoi["thuThachNgay"], n: number) =>
            sua((x) => ({ ...x, thuThachNgay: { ...x.thuThachNgay, [k]: n } }));
          const ngayCham =
            d.thuongMoiNgay > 0
              ? Math.ceil(
                  Math.max(d.thuongToiDa, d.thuongMoiNgay) / d.thuongMoiNgay,
                )
              : 0;
          return (
            <div className="space-y-3">
              <div className={LUOI}>
                <OSo
                  nhan="Số câu mỗi ngày"
                  giaTri={d.soCau}
                  macDinh={md.thuThachNgay.soCau}
                  gioiHan={g.thuThachNgay.soCau}
                  donVi="câu"
                  onDoi={(n) => doi("soCau", n)}
                />
                <OSo
                  nhan="Thưởng mỗi ngày trong chuỗi"
                  giaTri={d.thuongMoiNgay}
                  macDinh={md.thuThachNgay.thuongMoiNgay}
                  gioiHan={g.thuThachNgay.thuongMoiNgay}
                  donVi="điểm/ngày"
                  onDoi={(n) => doi("thuongMoiNgay", n)}
                />
                <OSo
                  nhan="Thưởng chuỗi tối đa"
                  giaTri={d.thuongToiDa}
                  macDinh={md.thuThachNgay.thuongToiDa}
                  gioiHan={g.thuThachNgay.thuongToiDa}
                  donVi="điểm"
                  goiY="không thấp hơn thưởng mỗi ngày"
                  onDoi={(n) => doi("thuongToiDa", n)}
                />
                <OSo
                  nhan="Số ngày liên tiếp để có huy hiệu Chuyên cần"
                  giaTri={d.ngayChuyenCan}
                  macDinh={md.thuThachNgay.ngayChuyenCan}
                  gioiHan={g.thuThachNgay.ngayChuyenCan}
                  donVi="ngày"
                  onDoi={(n) => doi("ngayChuyenCan", n)}
                />
              </div>
              <p className="rounded-xl bg-navy-50 px-4 py-2.5 text-sm text-navy-800">
                {d.thuongMoiNgay > 0 ? (
                  <>
                    Ngày thứ 3 liên tiếp được thưởng thêm{" "}
                    <b>{soDep(Math.min(d.thuongToiDa, d.thuongMoiNgay * 3))}</b>{" "}
                    điểm; chạm trần{" "}
                    <b>{soDep(Math.max(d.thuongToiDa, d.thuongMoiNgay))}</b>{" "}
                    điểm từ ngày thứ {ngayCham}.
                  </>
                ) : (
                  "Không có thưởng chuỗi ngày."
                )}
              </p>
            </div>
          );
        }}
      </KhungCaiDat>

      {/* ── Câu thưởng ── */}
      <KhungCaiDat
        muc="luat"
        nhom={["cauThuong"]}
        giaTri={luat.giaTri}
        macDinh={md}
        tieuDe="Câu thưởng cuối lượt"
        moTa="Bật / tắt câu thưởng ở tab Bật / tắt tính năng. Câu thưởng không tính vào sao và chuỗi."
        canhBao={canhBao}
      >
        {(v, sua) => {
          const c = v.cauThuong;
          const doi = (k: keyof LuatChoi["cauThuong"], n: number) =>
            sua((x) => ({ ...x, cauThuong: { ...x.cauThuong, [k]: n } }));
          return (
            <div className={LUOI}>
              <OSo
                nhan="Điểm câu về hội viên (trả lời đúng)"
                giaTri={c.diemHoiVien}
                macDinh={md.cauThuong.diemHoiVien}
                gioiHan={g.cauThuong.diemHoiVien}
                donVi="điểm"
                onDoi={(n) => doi("diemHoiVien", n)}
              />
              <OSo
                nhan="Giây câu về hội viên"
                giaTri={c.giayHoiVien}
                macDinh={md.cauThuong.giayHoiVien}
                gioiHan={g.cauThuong.giayHoiVien}
                donVi="giây"
                onDoi={(n) => doi("giayHoiVien", n)}
              />
              <OSo
                nhan="Điểm câu chia sẻ về mình"
                giaTri={c.diemChiaSe}
                macDinh={md.cauThuong.diemChiaSe}
                gioiHan={g.cauThuong.diemChiaSe}
                donVi="điểm"
                goiY="không có đúng sai, trả lời là được"
                onDoi={(n) => doi("diemChiaSe", n)}
              />
              <OSo
                nhan="Giây câu chia sẻ"
                giaTri={c.giayChiaSe}
                macDinh={md.cauThuong.giayChiaSe}
                gioiHan={g.cauThuong.giayChiaSe}
                donVi="giây"
                onDoi={(n) => doi("giayChiaSe", n)}
              />
            </div>
          );
        }}
      </KhungCaiDat>

      {/* ── Vốn, danh hiệu, ngọn lửa ── */}
      <KhungCaiDat
        muc="luat"
        nhom={["von", "danhHieu", "ngonLua"]}
        giaTri={luat.giaTri}
        macDinh={md}
        tieuDe="Vốn – danh hiệu – ngọn lửa"
        moTa="Danh hiệu chỉ để hiển thị và chúc mừng lên hạng, không cộng điểm."
        canhBao={canhBao}
      >
        {(v, sua) => {
          const tangDan = v.danhHieu.every(
            (d, i) => i === 0 || d.tuDiem > v.danhHieu[i - 1].tuDiem,
          );
          const doiBac = (
            i: number,
            phan: Partial<LuatChoi["danhHieu"][number]>,
          ) =>
            sua((x) => ({
              ...x,
              danhHieu: x.danhHieu.map((d, j) =>
                j === i ? { ...d, ...phan } : d,
              ),
            }));
          const doiLua = (phan: Partial<LuatChoi["ngonLua"]>) =>
            sua((x) => ({ ...x, ngonLua: { ...x.ngonLua, ...phan } }));
          return (
            <div className="space-y-5">
              <Nhom ten="Doanh nhân cân bằng">
                <OSo
                  nhan="Ngưỡng mỗi loại vốn"
                  giaTri={v.von.nguongCanBang}
                  macDinh={md.von.nguongCanBang}
                  gioiHan={g.nguongCanBang}
                  donVi="vốn"
                  goiY="đủ cả 4 vốn là nhận huy hiệu Doanh nhân cân bằng"
                  onDoi={(n) =>
                    sua((x) => ({ ...x, von: { ...x.von, nguongCanBang: n } }))
                  }
                />
              </Nhom>

              <Nhom ten="5 bậc danh hiệu theo Điểm Vươn tầm">
                <ol className="space-y-3">
                  {v.danhHieu.map((d, i) => (
                    <li
                      key={i}
                      className="space-y-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"
                    >
                      <div className="text-xs font-bold text-navy-700">
                        Bậc {i + 1}
                      </div>
                      <div className={LUOI}>
                        <OChu
                          nhan="Tên danh hiệu"
                          giaTri={d.ten}
                          dai={40}
                          onDoi={(s) => doiBac(i, { ten: s })}
                        />
                        {i === 0 ? (
                          <div>
                            <span className="lbl">Từ điểm</span>
                            <p className="flex min-h-11 items-center text-sm text-slate-600">
                              0 điểm — bậc đầu cố định
                            </p>
                          </div>
                        ) : (
                          <OSo
                            nhan="Từ điểm"
                            giaTri={d.tuDiem}
                            macDinh={md.danhHieu[i].tuDiem}
                            gioiHan={g.tuDiem}
                            donVi="điểm"
                            onDoi={(n) => doiBac(i, { tuDiem: n })}
                          />
                        )}
                      </div>
                      <OChu
                        nhan="Ý nghĩa"
                        giaTri={d.y}
                        dai={160}
                        onDoi={(s) => doiBac(i, { y: s })}
                      />
                    </li>
                  ))}
                </ol>
                {!tangDan && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Điểm các bậc phải tăng dần. Khi lưu, máy chủ tự nâng bậc sau
                    lên cao hơn bậc trước ít nhất 1 điểm.
                  </p>
                )}
              </Nhom>

              <Nhom ten="Bậc cao nhất — Ngọn lửa (không tính bằng điểm)">
                <div className={LUOI}>
                  <OChu
                    nhan="Tên danh hiệu"
                    giaTri={v.ngonLua.ten}
                    dai={40}
                    onDoi={(s) => doiLua({ ten: s })}
                  />
                  <OChu
                    nhan="Ý nghĩa"
                    giaTri={v.ngonLua.y}
                    dai={160}
                    onDoi={(s) => doiLua({ y: s })}
                  />
                  <OSo
                    nhan="Số trạm phải vượt"
                    giaTri={v.ngonLua.soTram}
                    macDinh={md.ngonLua.soTram}
                    gioiHan={g.ngonLuaSoTram}
                    donVi="trạm"
                    onDoi={(n) => doiLua({ soTram: n })}
                  />
                  <OSo
                    nhan="Tổng số sao tối thiểu"
                    giaTri={v.ngonLua.soSao}
                    macDinh={md.ngonLua.soSao}
                    gioiHan={g.ngonLuaSoSao}
                    donVi="sao"
                    onDoi={(n) => doiLua({ soSao: n })}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Kèm điều kiện cố định: cân bằng 4 vốn — đã có huy hiệu Doanh
                  nhân cân bằng, hoặc cả 4 vốn đạt ngưỡng ở trên (để Ban tắt huy
                  hiệu này vẫn thắp được lửa).
                </p>
              </Nhom>
            </div>
          );
        }}
      </KhungCaiDat>

      {/* ── Huy hiệu ── */}
      <KhungCaiDat
        muc="luat"
        nhom={["huyHieu", "nguoiBacCauSoLan"]}
        giaTri={luat.giaTri}
        macDinh={md}
        tieuDe="Huy hiệu"
        moTa="Tắt một huy hiệu thì từ lúc lưu không trao mới nữa; ai đã có vẫn giữ và giữ điểm đã cộng."
        canhBao={canhBao}
      >
        {(v, sua) => {
          const doiHh = (ma: string, phan: { bat?: boolean; diem?: number }) =>
            sua((x) => ({
              ...x,
              huyHieu: {
                ...x.huyHieu,
                [ma]: { ...x.huyHieu[ma], ...phan },
              },
            }));
          return (
            <div className="space-y-3">
              <ul className="space-y-3">
                {HUY_HIEU.map((h) => {
                  const hh = v.huyHieu[h.ma];
                  if (!hh) return null;
                  return (
                    <li
                      key={h.ma}
                      className="grid items-start gap-2 sm:grid-cols-[1fr_11rem]"
                    >
                      <OBat
                        nhan={h.ten}
                        moTa={
                          h.ma === "CHUYEN_CAN"
                            ? `Thử thách hằng ngày ${luat.giaTri.thuThachNgay.ngayChuyenCan} ngày liên tiếp (số ngày chỉnh ở khung Thử thách hằng ngày)`
                            : h.ma === "NGUOI_BAC_CAU"
                              ? `Hoàn thành nhiệm vụ “Người bắc cầu” ${v.nguoiBacCauSoLan} lần`
                              : h.ma === "CAN_BANG"
                                ? `Cả 4 loại vốn đạt từ ${luat.giaTri.von.nguongCanBang} (ngưỡng chỉnh ở khung Vốn)`
                                : h.dieuKien
                        }
                        giaTri={hh.bat}
                        onDoi={(b) => doiHh(h.ma, { bat: b })}
                      />
                      <OSo
                        nhan="Điểm thưởng"
                        giaTri={hh.diem}
                        macDinh={md.huyHieu[h.ma]?.diem}
                        gioiHan={g.diemHuyHieu}
                        donVi="điểm"
                        onDoi={(n) => doiHh(h.ma, { diem: n })}
                      />
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-slate-100 pt-3">
                <OSo
                  nhan="Người bắc cầu: số lần hoàn thành nhiệm vụ"
                  giaTri={v.nguoiBacCauSoLan}
                  macDinh={md.nguoiBacCauSoLan}
                  gioiHan={g.nguoiBacCauSoLan}
                  donVi="lần"
                  onDoi={(n) => sua((x) => ({ ...x, nguoiBacCauSoLan: n }))}
                />
              </div>
            </div>
          );
        }}
      </KhungCaiDat>
    </div>
  );
}
