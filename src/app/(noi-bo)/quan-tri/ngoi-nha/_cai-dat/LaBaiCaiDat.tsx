"use client";

/**
 * Trình sửa cài đặt Lá bài mỗi ngày (tab Cài đặt → Lá bài mỗi ngày). Mỗi nhóm
 * một khung lưu riêng (`KhungCaiDat muc="laBai"`), máy chủ gộp theo trường cấp
 * 1 nên lưu nhóm này không đè nhóm khác.
 */
import type { DuLieuMuc } from "@/lib/ngoi-nha/cai-dat";
import {
  CAC_LOAI_LA,
  GIOI_HAN_LA_BAI,
  kyVong,
  TEN_LOAI_LA,
  thuongChuoiLaBai,
  type CauHinhLaBai,
  type DanhNgon,
  type LoaiLa,
  type LoiNhan,
} from "@/lib/ngoi-nha/la-bai-luat";
import KhungCaiDat from "./KhungCaiDat";
import LaBaiDanhNgon from "./LaBaiDanhNgon";
import LaBaiLoiNhan from "./LaBaiLoiNhan";
import LaBaiQua, { type ThongKeQuaLaBai } from "./LaBaiQua";
import { doiCho, NutDong, OBat, OSo } from "./truong";

const MAU_LOAI: Record<LoaiLa, string> = {
  DANH_NGON: "bg-navy-500",
  LOI_NHAN: "bg-emerald-500",
  DIEM: "bg-vang-500",
  QUA: "bg-do-600",
};

const phanTram = (x: number) =>
  `${(Math.round(x * 1000) / 10).toLocaleString("vi-VN")}%`;
const so = (n: number) => Math.round(n).toLocaleString("vi-VN");

/** Dòng tóm tắt kỳ vọng điểm / quà theo cấu hình đang sửa. */
function KyVong({ c }: { c: CauHinhLaBai }) {
  const k = kyVong(c);
  const coQua = c.dsQua.some((q) => q.bat && q.trongSo > 0 && q.tongSo > 0);
  return (
    <div className="space-y-1 rounded-xl bg-navy-50 px-3 py-2.5 text-sm text-navy-800">
      <p>
        Trung bình mỗi lá: <b>{so(k.diemMoiNgayKhongQua)} điểm</b> (chơi thử /
        chưa đủ điều kiện quà)
        {coQua && c.trongSo.QUA > 0 && (
          <>
            {" "}
            · <b>{so(k.diemMoiNgay)} điểm</b> với người đủ điều kiện, tỉ lệ
            trúng quà <b>{phanTram(k.tiLeQua)}</b> mỗi lần lật
          </>
        )}
        .
      </p>
      <p className="text-xs text-slate-600">
        Chưa tính thưởng chuỗi ngày
        {c.chuoi.bat
          ? ` (thêm tối đa +${so(c.chuoi.toiDa)} điểm/ngày).`
          : " (đang tắt)."}
      </p>
    </div>
  );
}

export default function LaBaiCaiDat({
  du,
  danhNgonGoc,
  loiNhanGoc,
  nhomDanhNgon,
  thongKeQua,
  mua,
}: {
  du: DuLieuMuc<CauHinhLaBai>;
  danhNgonGoc: DanhNgon[];
  loiNhanGoc: LoiNhan[];
  nhomDanhNgon: { ma: string; ten: string }[];
  thongKeQua: ThongKeQuaLaBai;
  mua: { trangThai: string; ten: string; ketThuc: string | null };
}) {
  const m = du.macDinh;
  const g = GIOI_HAN_LA_BAI;

  return (
    <div className="space-y-4">
      {/* (a) Chung */}
      <KhungCaiDat
        muc="laBai"
        nhom={["soLa", "tuMo"]}
        giaTri={du.giaTri}
        macDinh={m}
        tieuDe="Cách chơi"
        moTa="Mỗi hội viên được lật một lá mỗi ngày, lá mới mở lúc 6:00 sáng (giống Thử thách hằng ngày). Bật / tắt cả tính năng ở tab Tính năng."
      >
        {(v, sua) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <OSo
              nhan="Số lá úp cho hội viên chọn"
              donVi="lá"
              giaTri={v.soLa}
              macDinh={m.soLa}
              gioiHan={g.soLa}
              goiY="chỉ để chọn cho vui, kết quả do máy chủ bốc"
              onDoi={(n) => sua((x) => ({ ...x, soLa: n }))}
            />
            <OBat
              nhan="Tự mở bảng chọn lá"
              moTa="Bật thì khi vào trang chủ game (đã xem hướng dẫn, hôm nay chưa lật) bảng chọn lá tự bật lên một lần. Tắt thì chỉ hiện ô Lá bài hôm nay."
              giaTri={v.tuMo}
              onDoi={(b) => sua((x) => ({ ...x, tuMo: b }))}
            />
          </div>
        )}
      </KhungCaiDat>

      {/* (b) Tỉ lệ các loại lá */}
      <KhungCaiDat
        muc="laBai"
        nhom={["trongSo"]}
        giaTri={du.giaTri}
        macDinh={m}
        tieuDe="Tỉ lệ các loại lá"
        moTa="Tỉ trọng không cần cộng đủ 100 — máy tự quy ra phần trăm. Loại nào hết nội dung (hoặc lá quà ngoài mùa giải) thì phần của nó chia lại cho các loại còn lại."
      >
        {(v, sua) => {
          const tong = CAC_LOAI_LA.reduce((s, l) => s + v.trongSo[l], 0);
          return (
            <div className="space-y-3">
              <div
                className="flex h-3 overflow-hidden rounded-full bg-slate-100"
                aria-hidden="true"
              >
                {CAC_LOAI_LA.map((l) =>
                  v.trongSo[l] > 0 && tong > 0 ? (
                    <div
                      key={l}
                      className={MAU_LOAI[l]}
                      style={{ width: `${(v.trongSo[l] / tong) * 100}%` }}
                    />
                  ) : null,
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {CAC_LOAI_LA.map((l) => (
                  <OSo
                    key={l}
                    nhan={TEN_LOAI_LA[l]}
                    giaTri={v.trongSo[l]}
                    macDinh={m.trongSo[l]}
                    gioiHan={g.trongSo}
                    goiY={
                      <b className="text-navy-700">
                        {tong > 0 ? phanTram(v.trongSo[l] / tong) : "0%"}
                      </b>
                    }
                    onDoi={(n) =>
                      sua((x) => ({
                        ...x,
                        trongSo: { ...x.trongSo, [l]: n },
                      }))
                    }
                  />
                ))}
              </div>
              {tong === 0 && (
                <p className="text-xs text-amber-800">
                  Tất cả bằng 0 — hội viên sẽ luôn nhận lá điểm.
                </p>
              )}
              {v.trongSo.QUA > 0 &&
                !v.dsQua.some((q) => q.bat && q.tongSo > 0) && (
                  <p className="text-xs text-amber-800">
                    Chưa có quà nào đang bật — phần tỉ trọng quà sẽ chia cho các
                    loại khác. Thêm quà ở mục “Quà tặng đặc biệt”.
                  </p>
                )}
              <KyVong c={v} />
            </div>
          );
        }}
      </KhungCaiDat>

      {/* (c) Điểm */}
      <KhungCaiDat
        muc="laBai"
        nhom={["diemKem", "bacDiem", "chuoi"]}
        giaTri={du.giaTri}
        macDinh={m}
        tieuDe="Điểm của lá bài"
        moTa="Điểm cộng thẳng vào Điểm Vươn tầm (bảng xếp hạng mùa). Mùa giải đã hết hạn thì lá vẫn lật được nhưng không cộng điểm."
        canhBao={
          mua.trangThai === "DANG_DIEN_RA"
            ? "Mùa giải đang diễn ra — đổi điểm giữa mùa làm người lật trước và sau khác nhau."
            : undefined
        }
      >
        {(v, sua) => {
          const tongBac = v.bacDiem.reduce((s, b) => s + b.trongSo, 0);
          return (
            <div className="space-y-5">
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-navy-800">
                  Điểm kèm lá chữ
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <OSo
                    nhan="Lá danh ngôn"
                    donVi="điểm"
                    giaTri={v.diemKem.DANH_NGON}
                    macDinh={m.diemKem.DANH_NGON}
                    gioiHan={g.diemKem}
                    onDoi={(n) =>
                      sua((x) => ({
                        ...x,
                        diemKem: { ...x.diemKem, DANH_NGON: n },
                      }))
                    }
                  />
                  <OSo
                    nhan="Lá lời nhắn"
                    donVi="điểm"
                    giaTri={v.diemKem.LOI_NHAN}
                    macDinh={m.diemKem.LOI_NHAN}
                    gioiHan={g.diemKem}
                    onDoi={(n) =>
                      sua((x) => ({
                        ...x,
                        diemKem: { ...x.diemKem, LOI_NHAN: n },
                      }))
                    }
                  />
                </div>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-navy-800">
                  Lá điểm — các bậc điểm
                </legend>
                <p className="text-xs text-slate-500">
                  Rơi vào lá điểm thì bốc một bậc theo tỉ trọng. Trung bình một
                  lá điểm ≈ <b>{so(kyVong(v).diemTrungBinhBac)} điểm</b>.
                </p>
                <ul className="space-y-2">
                  {v.bacDiem.map((b, i) => (
                    <li
                      key={i}
                      className="space-y-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <OSo
                          nhan={`Bậc ${i + 1}`}
                          donVi="điểm"
                          giaTri={b.diem}
                          gioiHan={g.diemBac}
                          onDoi={(n) =>
                            sua((x) => ({
                              ...x,
                              bacDiem: x.bacDiem.map((y, j) =>
                                j === i ? { ...y, diem: n } : y,
                              ),
                            }))
                          }
                        />
                        <OSo
                          nhan="Tỉ trọng"
                          giaTri={b.trongSo}
                          gioiHan={g.trongSo}
                          goiY={
                            <b className="text-navy-700">
                              {tongBac > 0
                                ? phanTram(b.trongSo / tongBac)
                                : "0%"}
                            </b>
                          }
                          onDoi={(n) =>
                            sua((x) => ({
                              ...x,
                              bacDiem: x.bacDiem.map((y, j) =>
                                j === i ? { ...y, trongSo: n } : y,
                              ),
                            }))
                          }
                        />
                      </div>
                      <div className="flex justify-end">
                        <NutDong
                          i={i}
                          tong={v.bacDiem.length}
                          onDoi={(j) =>
                            sua((x) => ({
                              ...x,
                              bacDiem: doiCho(x.bacDiem, i, j),
                            }))
                          }
                          onXoa={
                            v.bacDiem.length > 1
                              ? () =>
                                  sua((x) => ({
                                    ...x,
                                    bacDiem: x.bacDiem.filter(
                                      (_, j) => j !== i,
                                    ),
                                  }))
                              : undefined
                          }
                        />
                      </div>
                    </li>
                  ))}
                </ul>
                {v.bacDiem.length < g.soBac && (
                  <button
                    type="button"
                    className="btn-ghost min-h-11"
                    onClick={() =>
                      sua((x) => ({
                        ...x,
                        bacDiem: [...x.bacDiem, { diem: 50, trongSo: 10 }],
                      }))
                    }
                  >
                    + Thêm bậc điểm
                  </button>
                )}
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-navy-800">
                  Thưởng chuỗi ngày lật liên tiếp
                </legend>
                <OBat
                  nhan="Thưởng khi lật nhiều ngày liền"
                  moTa="Mỗi ngày liên tiếp (tính cả hôm nay) cộng thêm điểm, có trần. Bỏ một ngày là chuỗi về 0."
                  giaTri={v.chuoi.bat}
                  onDoi={(b) =>
                    sua((x) => ({ ...x, chuoi: { ...x.chuoi, bat: b } }))
                  }
                />
                {v.chuoi.bat && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <OSo
                        nhan="Mỗi ngày liên tiếp"
                        donVi="điểm"
                        giaTri={v.chuoi.moiNgay}
                        macDinh={m.chuoi.moiNgay}
                        gioiHan={g.chuoiMoiNgay}
                        onDoi={(n) =>
                          sua((x) => ({
                            ...x,
                            chuoi: { ...x.chuoi, moiNgay: n },
                          }))
                        }
                      />
                      <OSo
                        nhan="Tối đa mỗi ngày"
                        donVi="điểm"
                        giaTri={v.chuoi.toiDa}
                        macDinh={m.chuoi.toiDa}
                        gioiHan={g.chuoiToiDa}
                        onDoi={(n) =>
                          sua((x) => ({
                            ...x,
                            chuoi: { ...x.chuoi, toiDa: n },
                          }))
                        }
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Ví dụ: ngày thứ 1 +{so(thuongChuoiLaBai(v, 1))} · ngày thứ
                      3 +{so(thuongChuoiLaBai(v, 3))} · ngày thứ 7 +
                      {so(thuongChuoiLaBai(v, 7))} · ngày thứ 30 +
                      {so(thuongChuoiLaBai(v, 30))}
                    </p>
                  </>
                )}
              </fieldset>

              <KyVong c={v} />
            </div>
          );
        }}
      </KhungCaiDat>

      {/* (d) Quà */}
      <LaBaiQua du={du} thongKe={thongKeQua} mua={mua} />

      {/* (e) Danh ngôn */}
      <LaBaiDanhNgon du={du} goc={danhNgonGoc} nhom={nhomDanhNgon} />

      {/* (f) Lời nhắn */}
      <LaBaiLoiNhan du={du} goc={loiNhanGoc} />
    </div>
  );
}
