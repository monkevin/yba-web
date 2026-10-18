"use client";

/**
 * Quà tặng đặc biệt của Lá bài: điều kiện nhận quà + danh sách quà (tên, nhà
 * đồng hành, tổng suất, tối đa mỗi ngày, tỉ trọng, khoảng ngày). Mã quà sinh
 * MỘT LẦN khi bấm "+ Thêm quà" (`taoMaQuaLaBai`) và giữ nguyên khi sửa — số
 * suất đã trúng đếm theo mã. Quà đã có người trúng thì chỉ tắt, không xoá.
 */
import { useState } from "react";
import type { DuLieuMuc } from "@/lib/ngoi-nha/cai-dat";
import {
  GIOI_HAN_LA_BAI,
  taoMaQuaLaBai,
  type CauHinhLaBai,
  type QuaLaBai,
} from "@/lib/ngoi-nha/la-bai-luat";
import KhungCaiDat from "./KhungCaiDat";
import { LaBaiNhan } from "./LaBaiDanhSach";
import { doiCho, NutDong, OBat, OChu, ONgay, OSo } from "./truong";

export type ThongKeQuaLaBai = Record<
  string,
  { daTrung: number; homNay: number; conLai: number }
>;

const TEN_TRANG_THAI_MUA: Record<string, string> = {
  CHOI_THU: "chưa có mùa giải (đang chơi thử)",
  SAP_MO: "mùa giải chưa tới ngày bắt đầu",
  DA_KET_THUC: "mùa giải đã hết hạn",
};

export default function LaBaiQua({
  du,
  thongKe,
  mua,
}: {
  du: DuLieuMuc<CauHinhLaBai>;
  thongKe: ThongKeQuaLaBai;
  mua: { trangThai: string; ten: string; ketThuc: string | null };
}) {
  // Quà vừa thêm thì mở sẵn khung sửa
  const [moSan, setMoSan] = useState<string[]>([]);
  const m = du.macDinh;
  const g = GIOI_HAN_LA_BAI;
  const dangChay = mua.trangThai === "DANG_DIEN_RA";

  return (
    <KhungCaiDat
      muc="laBai"
      nhom={["dieuKienQua", "dsQua"]}
      giaTri={du.giaTri}
      macDinh={du.macDinh}
      tieuDe="Quà tặng đặc biệt"
      moTa="Quà thật từ nhà đồng hành, rơi ngẫu nhiên khi hội viên lật lá. Chỉ ghi tên nhà đồng hành khi doanh nghiệp đã nhận lời."
      canhBao={
        dangChay
          ? "Mùa giải đang diễn ra — thay đổi áp dụng ngay cho lượt lật tiếp theo."
          : undefined
      }
    >
      {(v, sua) => {
        const dk = v.dieuKienQua;
        const suaDk = (p: Partial<CauHinhLaBai["dieuKienQua"]>) =>
          sua((x) => ({ ...x, dieuKienQua: { ...x.dieuKienQua, ...p } }));
        const suaQua = (ma: string, p: Partial<QuaLaBai>) =>
          sua((x) => ({
            ...x,
            dsQua: x.dsQua.map((q) => (q.ma === ma ? { ...q, ...p } : q)),
          }));
        const tongTs = v.dsQua
          .filter((q) => q.bat)
          .reduce((s, q) => s + q.trongSo, 0);
        return (
          <div className="space-y-5">
            <div
              className={`rounded-xl px-4 py-3 text-sm ${dangChay ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}
            >
              <b>Quà chỉ rơi khi mùa giải chính thức đang diễn ra.</b>{" "}
              {dangChay
                ? `${mua.ten} đang diễn ra — lá quà đang có thể rơi.`
                : `Hiện ${TEN_TRANG_THAI_MUA[mua.trangThai] ?? "chưa có mùa giải"} nên chưa ai trúng quà; phần tỉ trọng quà được chia cho các loại lá khác.`}{" "}
              Tỉ lệ ra lá quà chỉnh ở mục “Tỉ lệ các loại lá”.
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-navy-800">
                Ai được nhận quà
              </legend>
              <OBat
                nhan="Chỉ tài khoản gắn hồ sơ hội viên đang sinh hoạt"
                moTa="Tắt thì tài khoản văn phòng / thư ký chưa gắn hồ sơ cũng có thể trúng quà."
                giaTri={dk.canGanHoiVien}
                onDoi={(b) => suaDk({ canGanHoiVien: b })}
              />
              <OBat
                nhan="Không trao cho người ẩn khỏi bảng xếp hạng"
                moTa="Ban soạn đề, Ban vận hành game vẫn lật lá, vẫn có điểm nhưng không trúng quà."
                giaTri={dk.boQuaAnXepHang}
                onDoi={(b) => suaDk({ boQuaAnXepHang: b })}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <OSo
                  nhan="Đã qua ít nhất"
                  donVi="trạm"
                  giaTri={dk.toiThieuTramQua}
                  macDinh={m.dieuKienQua.toiThieuTramQua}
                  gioiHan={g.toiThieuTramQua}
                  goiY="trong mùa"
                  onDoi={(n) => suaDk({ toiThieuTramQua: n })}
                />
                <OSo
                  nhan="Mỗi người tối đa"
                  donVi="quà / mùa"
                  giaTri={dk.toiDaMoiNguoiMua}
                  macDinh={m.dieuKienQua.toiDaMoiNguoiMua}
                  gioiHan={g.toiDaMoiNguoiMua}
                  onDoi={(n) => suaDk({ toiDaMoiNguoiMua: n })}
                />
                <OSo
                  nhan="Cả Chi hội tối đa"
                  donVi="quà / ngày"
                  giaTri={dk.toiDaQuaMoiNgay}
                  macDinh={m.dieuKienQua.toiDaQuaMoiNgay}
                  gioiHan={g.toiDaQuaMoiNgay}
                  goiY="0 = không giới hạn"
                  onDoi={(n) => suaDk({ toiDaQuaMoiNgay: n })}
                />
              </div>
            </fieldset>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-navy-800">
                  Danh sách quà ({v.dsQua.length})
                </h3>
                <button
                  type="button"
                  className="btn-ghost min-h-11"
                  disabled={v.dsQua.length >= g.soQua}
                  onClick={() => {
                    const ma = taoMaQuaLaBai();
                    sua((x) => ({
                      ...x,
                      dsQua: [
                        ...x.dsQua,
                        {
                          ma,
                          bat: true,
                          ten: "",
                          moTa: "",
                          nhaDongHanh: "",
                          giaTri: 0,
                          tongSo: 1,
                          toiDaMoiNgay: 1,
                          trongSo: 10,
                          tuNgay: null,
                          denNgay: null,
                        },
                      ],
                    }));
                    setMoSan((ds) => [...ds, ma]);
                  }}
                >
                  + Thêm quà
                </button>
              </div>

              {v.dsQua.length === 0 && (
                <p className="rounded-xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
                  Chưa có quà nào. Khi nhà đồng hành nhận lời, bấm “+ Thêm quà”
                  để đưa quà vào bộ bài.
                </p>
              )}

              <ul className="space-y-2">
                {v.dsQua.map((q, i) => {
                  const tk = thongKe[q.ma];
                  const daTrung = tk?.daTrung ?? 0;
                  const conLai = Math.max(0, q.tongSo - daTrung);
                  const phanTram =
                    q.bat && tongTs > 0
                      ? Math.round((q.trongSo / tongTs) * 100)
                      : 0;
                  const quaHanMua =
                    !!mua.ketThuc && !!q.denNgay && q.denNgay > mua.ketThuc;
                  return (
                    <li key={q.ma}>
                      <details
                        className="group rounded-xl bg-white ring-1 ring-slate-200"
                        open={moSan.includes(q.ma) || undefined}
                      >
                        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-sm font-semibold ${q.bat ? "text-navy-800" : "text-slate-400 line-through"}`}
                            >
                              {q.ten.trim() || "(chưa có tên quà)"}
                            </span>
                            <span className="mt-0.5 flex flex-wrap items-center gap-1">
                              {q.nhaDongHanh && (
                                <span className="text-xs text-slate-500">
                                  {q.nhaDongHanh} ·
                                </span>
                              )}
                              <LaBaiNhan mau="navy">
                                Đã trúng {daTrung}/{q.tongSo}
                              </LaBaiNhan>
                              <LaBaiNhan mau={conLai > 0 ? "xanh" : "do"}>
                                Còn {conLai}
                              </LaBaiNhan>
                              {(tk?.homNay ?? 0) > 0 && (
                                <LaBaiNhan mau="vang">
                                  Hôm nay {tk!.homNay}
                                </LaBaiNhan>
                              )}
                              {!q.bat && (
                                <LaBaiNhan mau="xam">Đang tắt</LaBaiNhan>
                              )}
                              {!q.ten.trim() && (
                                <LaBaiNhan mau="vang">Thiếu tên</LaBaiNhan>
                              )}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-navy-600">
                            Sửa
                          </span>
                        </summary>

                        <div className="space-y-3 border-t border-slate-100 p-3">
                          {!q.ten.trim() && (
                            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                              Quà chưa có tên sẽ bị bỏ khi lưu.
                            </p>
                          )}
                          <OBat
                            nhan="Đưa quà này vào bộ bài"
                            moTa="Tắt thì quà không rơi nữa; người đã trúng vẫn giữ quà."
                            giaTri={q.bat}
                            onDoi={(b) => suaQua(q.ma, { bat: b })}
                          />
                          <OChu
                            nhan="Tên quà"
                            giaTri={q.ten}
                            dai={120}
                            placeholder="vd Voucher 500.000đ"
                            onDoi={(s) => suaQua(q.ma, { ten: s })}
                          />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <OChu
                              nhan="Nhà đồng hành"
                              giaTri={q.nhaDongHanh}
                              dai={80}
                              goiY="Chỉ ghi khi doanh nghiệp đã nhận lời."
                              onDoi={(s) => suaQua(q.ma, { nhaDongHanh: s })}
                            />
                            <OSo
                              nhan="Trị giá một phần"
                              donVi="đồng"
                              giaTri={q.giaTri}
                              gioiHan={g.giaTriQua}
                              goiY="chỉ để Ban theo dõi"
                              onDoi={(n) => suaQua(q.ma, { giaTri: n })}
                            />
                          </div>
                          <OChu
                            nhan="Mô tả (hiện cho người trúng)"
                            giaTri={q.moTa}
                            dai={300}
                            nhieuDong={2}
                            onDoi={(s) => suaQua(q.ma, { moTa: s })}
                          />
                          <div className="grid gap-3 sm:grid-cols-3">
                            <OSo
                              nhan="Tổng số suất"
                              donVi="suất"
                              giaTri={q.tongSo}
                              gioiHan={g.tongSoQua}
                              goiY={`đã trúng ${daTrung}, còn ${conLai}`}
                              onDoi={(n) => suaQua(q.ma, { tongSo: n })}
                            />
                            <OSo
                              nhan="Tối đa mỗi ngày"
                              donVi="suất"
                              giaTri={q.toiDaMoiNgay}
                              gioiHan={g.toiDaMoiNgayQua}
                              goiY="0 = không giới hạn"
                              onDoi={(n) => suaQua(q.ma, { toiDaMoiNgay: n })}
                            />
                            <OSo
                              nhan="Tỉ trọng giữa các quà"
                              giaTri={q.trongSo}
                              gioiHan={g.trongSo}
                              goiY={
                                q.bat ? `≈ ${phanTram}% số lá quà` : "đang tắt"
                              }
                              onDoi={(n) => suaQua(q.ma, { trongSo: n })}
                            />
                          </div>
                          {q.tongSo < daTrung && (
                            <p className="text-xs text-amber-800">
                              Tổng suất đang nhỏ hơn số đã trúng — quà này sẽ
                              không rơi thêm.
                            </p>
                          )}
                          <div className="grid gap-3 sm:grid-cols-2">
                            <ONgay
                              nhan="Rơi từ ngày (trống = ngay)"
                              giaTri={q.tuNgay}
                              onDoi={(d) => suaQua(q.ma, { tuNgay: d })}
                            />
                            <ONgay
                              nhan="Đến ngày (trống = hết mùa)"
                              giaTri={q.denNgay}
                              onDoi={(d) => suaQua(q.ma, { denNgay: d })}
                            />
                          </div>
                          {q.tuNgay && q.denNgay && q.tuNgay > q.denNgay && (
                            <p className="text-xs text-do-600">
                              Ngày bắt đầu đang sau ngày kết thúc — quà này sẽ
                              không bao giờ rơi.
                            </p>
                          )}
                          {quaHanMua && (
                            <p className="text-xs text-amber-800">
                              Hạn quà sau ngày kết thúc mùa ({mua.ketThuc}) —
                              hết mùa quà tự ngừng rơi.
                            </p>
                          )}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                            <span className="text-[11px] text-slate-400">
                              Mã quà {q.ma}
                            </span>
                            <NutDong
                              i={i}
                              tong={v.dsQua.length}
                              onDoi={(j) =>
                                sua((x) => ({
                                  ...x,
                                  dsQua: doiCho(x.dsQua, i, j),
                                }))
                              }
                              onXoa={
                                daTrung === 0
                                  ? () => {
                                      if (
                                        confirm(
                                          `Xoá quà “${q.ten || "chưa có tên"}”? Bấm Lưu sau đó mới áp dụng.`,
                                        )
                                      )
                                        sua((x) => ({
                                          ...x,
                                          dsQua: x.dsQua.filter(
                                            (y) => y.ma !== q.ma,
                                          ),
                                        }));
                                    }
                                  : undefined
                              }
                            />
                          </div>
                          {daTrung > 0 && (
                            <p className="text-right text-[11px] text-slate-500">
                              Đã có người trúng — muốn ngừng thì tắt, không xoá.
                            </p>
                          )}
                        </div>
                      </details>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      }}
    </KhungCaiDat>
  );
}
