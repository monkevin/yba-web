"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  aBatDauDauTri,
  aBatDauThuThach,
  aBatDauTram,
  aChonThe,
  aKetThucLuot,
  aMoCau,
  aRutThe,
  aTraLoi,
  aTroGiup,
} from "@/app/(ngoi-nha)/ngoi-nha/actions";
import type {
  DapAnGui,
  KetQuaLuot,
  KetQuaTheCoHoi,
  KetQuaTroGiup,
  LuatManChoi,
  PhanHoi,
  TheCoHoiHienThi,
  TrangThaiCau,
} from "@/lib/ngoi-nha/kieu";
import {
  LOAI_CAU,
  LOI_KHEN,
  MA_VON,
  SO_CAU_MOI_TRAM,
  VON,
  duongDanTram,
  luatManChoi,
  mocChuoi,
  soDep,
  type TroGiup,
  type Von,
} from "@/lib/ngoi-nha/luat";
import { LUAT_MAC_DINH } from "@/lib/ngoi-nha/cai-dat/luat-choi";
import { TINH_NANG_MAC_DINH } from "@/lib/ngoi-nha/cai-dat/tinh-nang";
import type { TramCongKhai } from "@/lib/ngoi-nha/noi-dung";
import BieuTuong from "./BieuTuong";
import PhaoGiay from "./PhaoGiay";
import { am, rung } from "./am-thanh";

export type ThongTinTramChoi = {
  moKhoa: boolean;
  sao: number;
  daQua: boolean;
  diemTot: number;
  luotTinhDiemConLai: number;
  luotTinhDiemToiDa: number;
  dangChoi: { luotId: string; viTri: number } | null;
  luotRutThe: string | null;
};

type Man =
  | { loai: "gioi-thieu"; loi?: string }
  | { loai: "cho" }
  | { loai: "dem-nguoc"; luotId: string }
  | { loai: "cau"; tt: TrangThaiCau }
  | {
      loai: "phan-hoi";
      tt: TrangThaiCau;
      ph: PhanHoi;
      daGui: DapAnGui;
      troGiup: TroGiupCau;
    }
  | { loai: "ket-qua"; kq: KetQuaLuot }
  | {
      loai: "the";
      kq: KetQuaLuot | null;
      the: TheCoHoiHienThi;
      lat: boolean;
      chon?: KetQuaTheCoHoi;
      daChon?: number;
    };

type TroGiupCau = {
  an: number[];
  phanTram?: number[];
  soNguoi?: number;
  goiY?: string;
};
const TRO_GIUP_RONG: TroGiupCau = { an: [] };

/** Trang chưa truyền luật (vd trang Đấu trí) thì hiện theo luật gốc trong code. */
const LUAT_MAN_CHOI_GOC: LuatManChoi = luatManChoi(
  LUAT_MAC_DINH,
  TINH_NANG_MAC_DINH,
  true,
);

/** Mô tả thưởng chuỗi đúng liên tiếp theo luật; cả hai mốc 0 điểm thì không có. */
function moTaChuoi(l: LuatManChoi): string | null {
  if (l.chuoiTu3 > 0 && l.chuoiTu5 > 0 && l.chuoiTu3 !== l.chuoiTu5)
    return `Đúng liên tiếp từ câu thứ 3 được thưởng chuỗi +${l.chuoiTu3}, từ câu thứ 5 được +${l.chuoiTu5} mỗi câu.`;
  if (l.chuoiTu3 > 0)
    return `Đúng liên tiếp từ câu thứ 3 được thưởng chuỗi +${l.chuoiTu3} mỗi câu.`;
  if (l.chuoiTu5 > 0)
    return `Đúng liên tiếp từ câu thứ 5 được thưởng chuỗi +${l.chuoiTu5} mỗi câu.`;
  return null;
}

/** Chữ ăn mừng mốc chuỗi theo luật (mốc 3 / 5 nêu đúng điểm thưởng đang dùng). */
function mocChuoiTheoLuat(chuoi: number, l: LuatManChoi) {
  const m = mocChuoi(chuoi);
  if (!m) return null;
  const giuNhip = "Giữ nhịp tới câu cuối";
  if (m.tu === 3)
    return {
      ...m,
      mo:
        l.chuoiTu3 > 0
          ? `Từ câu này mỗi câu đúng thêm +${l.chuoiTu3}`
          : giuNhip,
    };
  if (m.tu === 5)
    return {
      ...m,
      mo:
        l.chuoiTu5 > 0 && l.chuoiTu5 !== l.chuoiTu3
          ? `Thưởng chuỗi tăng lên +${l.chuoiTu5} mỗi câu`
          : giuNhip,
    };
  if (m.tu === 10 && !l.hoanHao)
    return { ...m, mo: "Giữ trọn phong độ tới câu cuối" };
  return m;
}

function tenTroGiup(k: TroGiup, l: LuatManChoi): string {
  return k === "5050"
    ? "50 : 50"
    : k === "HOI"
      ? "Hỏi Huynh đệ"
      : `Thêm ${l.giayThem} giây`;
}
const SO_CHU = ["Không", "Một", "Hai", "Ba"];

export default function ManChoi({
  cheDo,
  tram,
  thongTin,
  mua,
  thuThach,
  dauTri,
  luat: luatProp,
}: {
  cheDo: "tram" | "ngay" | "dau-tri";
  tram?: TramCongKhai;
  thongTin?: ThongTinTramChoi;
  mua: { ten: string; tinhDiem: boolean; choiThu: boolean };
  thuThach?: {
    trangThai: "CHUA" | "DANG_CHOI" | "XONG";
    chuoiNgay: number;
    luotId: string | null;
  };
  /** Phiên Đấu trí sự kiện đang chơi (`soCau` không truyền thì hiện 10) */
  dauTri?: {
    id: string;
    ten: string;
    moTa: string | null;
    giay: number;
    maThamGia: string;
    trangThai: "CHUA" | "DANG_CHOI" | "XONG";
    luotId: string | null;
    soCau?: number;
  };
  /** Luật rút gọn từ cài đặt game (`luatManChoi()` ở trang máy chủ) */
  luat?: LuatManChoi;
}) {
  // Đấu trí sự kiện thi đấu công bằng — máy chủ từ chối mọi trợ giúp, nên đừng
  // hiện nút để người chơi bấm rồi nhận báo lỗi (trang Đấu trí không truyền luật)
  const luatNhan = luatProp ?? LUAT_MAN_CHOI_GOC;
  const luat: LuatManChoi =
    cheDo === "dau-tri" ? { ...luatNhan, troGiup: [] } : luatNhan;
  const moTaThuongChuoi = moTaChuoi(luat);
  const router = useRouter();
  const [man, setMan] = useState<Man>({ loai: "gioi-thieu" });
  const [ketQuaCau, setKetQuaCau] = useState<(boolean | null)[]>([]);
  const [luotId, setLuotId] = useState<string | null>(null);
  const [hoiThoat, setHoiThoat] = useState(false);

  const moCauTiep = useCallback(async (id: string) => {
    setMan({ loai: "cho" });
    const r = await aMoCau(id);
    if (!r.ok) {
      setMan({ loai: "gioi-thieu", loi: r.loi });
      return;
    }
    if (r.data.ketQua) {
      setMan({ loai: "ket-qua", kq: r.data.ketQua });
      return;
    }
    const tt = r.data.cau!;
    setKetQuaCau((cu) => {
      const moi = [...cu];
      for (let i = 0; i < tt.viTri; i++)
        if (moi[i] === undefined) moi[i] = null;
      return moi;
    });
    setMan({ loai: "cau", tt });
  }, []);

  async function batDau(tiepTuc: boolean) {
    am.bam();
    setMan({ loai: "cho" });
    const r =
      cheDo === "ngay"
        ? await aBatDauThuThach()
        : cheDo === "dau-tri"
          ? await aBatDauDauTri(dauTri!.id)
          : await aBatDauTram(tram!.ma, tiepTuc);
    if (!r.ok) {
      setMan({ loai: "gioi-thieu", loi: r.loi });
      return;
    }
    setLuotId(r.data.luotId);
    setKetQuaCau([]);
    // Lượt mới thì đếm ngược 3-2-1 cho có nhịp; lượt đang dở / đã xong thì mở
    // luôn — câu đang mở vẫn chạy đồng hồ ở máy chủ, đếm ngược là mất mấy giây
    const moLuon =
      r.data.tiepTuc || ("daXong" in r.data && r.data.daXong === true);
    if (moLuon) await moCauTiep(r.data.luotId);
    else setMan({ loai: "dem-nguoc", luotId: r.data.luotId });
  }

  async function moTheCho(id: string) {
    setMan({ loai: "cho" });
    const r = await aRutThe(id);
    if (!r.ok) {
      setMan({ loai: "gioi-thieu", loi: r.loi });
      return;
    }
    setLuotId(id);
    setMan({ loai: "the", kq: null, the: r.data, lat: false });
  }

  // ─── đếm ngược trước lượt mới ───────────────────────────────────────
  if (man.loai === "dem-nguoc") {
    const id = man.luotId;
    return <DemNguoc xong={() => void moCauTiep(id)} />;
  }

  // ─── màn giới thiệu ────────────────────────────────────────────────
  if (man.loai === "gioi-thieu" || man.loai === "cho") {
    const dangTai = man.loai === "cho";
    return (
      <div className="mx-auto max-w-lg px-4 pt-5">
        <Link
          href={cheDo === "dau-tri" ? "/ngoi-nha/dau-tri" : "/ngoi-nha"}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-white/70 hover:text-white"
        >
          <BieuTuong ten="quay-lai" className="h-4 w-4" />{" "}
          {cheDo === "dau-tri" ? "Đấu trí sự kiện" : "Ngôi nhà"}
        </Link>
        <div className="nn-hien mt-2 overflow-hidden rounded-3xl bg-white text-navy-900 shadow-2xl">
          <div className="san-do px-5 py-6 text-white">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
              {cheDo === "ngay"
                ? `Mỗi ngày ${luat.thuThachSoCau} câu`
                : cheDo === "dau-tri"
                  ? `Đấu trí sự kiện · mã ${dauTri!.maThamGia}`
                  : `Chặng ${tram!.changSo} · ${tram!.changTen} · Trạm ${tram!.ma}`}
            </div>
            <h1 className="mt-2 text-3xl leading-tight">
              {cheDo === "ngay"
                ? "Thử thách hôm nay"
                : cheDo === "dau-tri"
                  ? dauTri!.ten
                  : tram!.ten}
            </h1>
            {cheDo === "dau-tri" && dauTri!.moTa && (
              <p className="mt-1 text-sm text-white/80">{dauTri!.moTa}</p>
            )}
            {cheDo === "tram" && tram!.thuThach && (
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                <BieuTuong ten="tia" dac className="h-3.5 w-3.5" /> Trạm Thử
                thách
                {luat.heSoThuThach > 1 ? ` · điểm ×${luat.heSoThuThach}` : ""} ·
                cần đúng {luat.canDeQuaThuThach}/10
              </span>
            )}
          </div>
          <div className="space-y-4 p-5">
            {cheDo === "tram" && thongTin && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <O nhan="Sao cao nhất">
                  <span className="flex justify-center gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <BieuTuong
                        key={i}
                        ten="sao"
                        dac
                        className={`h-5 w-5 ${i < thongTin.sao ? "text-vang-500" : "text-slate-200"}`}
                      />
                    ))}
                  </span>
                </O>
                <O nhan="Điểm cao nhất">{soDep(thongTin.diemTot)}</O>
                <O nhan={mua.tinhDiem ? "Lượt tính điểm" : "Chế độ"}>
                  {mua.tinhDiem
                    ? `${thongTin.luotTinhDiemConLai}/${thongTin.luotTinhDiemToiDa}`
                    : "Luyện tập"}
                </O>
              </div>
            )}
            {cheDo === "ngay" && thuThach && (
              <div className="flex items-center gap-3 rounded-2xl bg-son-50 p-3 text-son-900">
                <BieuTuong ten="lua" dac className="h-8 w-8 text-son-600" />
                <div className="text-sm">
                  Chuỗi đang giữ: <b>{thuThach.chuoiNgay} ngày</b>.{" "}
                  {luat.thuongMoiNgay > 0
                    ? `Chơi mỗi ngày để được thưởng thêm ${soDep(luat.thuongMoiNgay)} điểm × số ngày liên tiếp (tối đa ${soDep(luat.thuongToiDa)}).`
                    : "Chơi mỗi ngày để giữ chuỗi."}
                </div>
              </div>
            )}
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <BieuTuong
                  ten="dong-ho"
                  className="mt-0.5 h-4 w-4 shrink-0 text-navy-500"
                />
                {cheDo === "ngay"
                  ? `${luat.thuThachSoCau} câu ngẫu nhiên từ các trạm bạn đã mở, mỗi ngày một lần.`
                  : cheDo === "dau-tri"
                    ? `${dauTri!.soCau ?? 10} câu, mỗi câu ${dauTri!.giay} giây. Trả lời càng nhanh điểm càng cao — mọi người chơi cùng một bộ câu.`
                    : "10 câu, mỗi câu có đồng hồ riêng. Trả lời càng nhanh càng nhiều điểm."}
              </li>
              {moTaThuongChuoi && (
                <li className="flex gap-2">
                  <BieuTuong
                    ten="lua"
                    className="mt-0.5 h-4 w-4 shrink-0 text-son-600"
                  />
                  {moTaThuongChuoi}
                </li>
              )}
              {cheDo === "dau-tri" ? (
                <li className="flex gap-2">
                  <BieuTuong
                    ten="cup"
                    className="mt-0.5 h-4 w-4 shrink-0 text-vang-600"
                  />
                  Không có trợ giúp — thi đấu công bằng. Bảng xếp hạng chiếu lên
                  màn hình sân khấu, mỗi câu đúng +1 Vốn tri thức.
                </li>
              ) : (
                <>
                  {luat.troGiup.length > 0 && (
                    <li className="flex gap-2">
                      <BieuTuong
                        ten="nguoi"
                        className="mt-0.5 h-4 w-4 shrink-0 text-navy-500"
                      />
                      {SO_CHU[luat.troGiup.length]} quyền trợ giúp mỗi lượt:{" "}
                      {luat.troGiup.map((k) => tenTroGiup(k, luat)).join(", ")}.
                    </li>
                  )}
                  {luat.cauThuong.length > 0 && (
                    <li className="flex gap-2">
                      <BieuTuong
                        ten="the"
                        className="mt-0.5 h-4 w-4 shrink-0 text-vang-600"
                      />
                      <span>
                        Cuối lượt có <b>câu thưởng</b>:{" "}
                        {luat.cauThuong
                          .map((k) =>
                            k === "HOI_VIEN"
                              ? `biết mặt biết tên một huynh đệ (+${soDep(luat.diemThuong.HOI_VIEN)})`
                              : `chia sẻ về bạn (+${soDep(luat.diemThuong.CHIA_SE)})`,
                          )
                          .join(" hoặc ")}
                        .
                      </span>
                    </li>
                  )}
                </>
              )}
              {mua.choiThu && (
                <li className="flex gap-2 text-amber-700">
                  <BieuTuong ten="lich" className="mt-0.5 h-4 w-4 shrink-0" />
                  Chưa phát động mùa giải: điểm chơi thử vẫn lên bảng, nhưng sẽ
                  tính lại từ đầu khi mở Mùa 1.
                </li>
              )}
              {!mua.tinhDiem && (
                <li className="flex gap-2 text-amber-700">
                  <BieuTuong ten="lich" className="mt-0.5 h-4 w-4 shrink-0" />
                  Mùa giải đã kết thúc: chơi luyện tập, không cộng điểm.
                </li>
              )}
              {cheDo === "tram" &&
                mua.tinhDiem &&
                thongTin?.luotTinhDiemConLai === 0 && (
                  <li className="flex gap-2 text-amber-700">
                    <BieuTuong
                      ten="lam-lai"
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    Đã dùng hết {thongTin.luotTinhDiemToiDa} lượt tính điểm mùa
                    này — lượt tiếp theo là luyện tập (vẫn được sao và mở trạm).
                  </li>
                )}
            </ul>

            {man.loai === "gioi-thieu" && man.loi && (
              <p
                className="rounded-xl bg-do-50 px-3 py-2 text-sm text-do-700"
                role="alert"
              >
                {man.loi}
              </p>
            )}

            {cheDo === "tram" && thongTin && !thongTin.moKhoa ? (
              <p className="flex items-center justify-center gap-2 rounded-full bg-slate-100 py-3 text-sm font-medium text-slate-500">
                <BieuTuong ten="khoa" className="h-4 w-4" /> Vượt trạm liền
                trước để mở trạm này
              </p>
            ) : (
              <div className="space-y-2">
                {cheDo === "tram" && thongTin?.luotRutThe && (
                  <button
                    type="button"
                    disabled={dangTai}
                    onClick={() => moTheCho(thongTin.luotRutThe!)}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-vang-500 font-bold text-navy-900 hover:bg-vang-400 disabled:opacity-60"
                  >
                    <BieuTuong ten="the" className="h-5 w-5" /> Mở Thẻ Cơ hội
                    đang chờ
                  </button>
                )}
                {cheDo === "tram" && thongTin?.dangChoi ? (
                  <>
                    <NutChinh onClick={() => batDau(true)} dangTai={dangTai}>
                      Chơi tiếp lượt đang dở{" "}
                      {/* Bỏ dở ở câu thưởng thì viTri = 10, đừng ghi "câu 11/10" */}
                      {thongTin.dangChoi.viTri >= SO_CAU_MOI_TRAM
                        ? "(câu thưởng)"
                        : `(câu ${thongTin.dangChoi.viTri + 1}/${SO_CAU_MOI_TRAM})`}
                    </NutChinh>
                    <button
                      type="button"
                      disabled={dangTai}
                      onClick={() => batDau(false)}
                      className="min-h-11 w-full rounded-full text-sm font-medium text-slate-500 hover:bg-slate-100"
                    >
                      Kết thúc lượt dở và chơi lượt mới
                    </button>
                  </>
                ) : cheDo === "ngay" && thuThach?.trangThai === "XONG" ? (
                  <NutChinh
                    onClick={() =>
                      thuThach.luotId && moCauTiep(thuThach.luotId)
                    }
                    dangTai={dangTai}
                  >
                    Xem kết quả hôm nay
                  </NutChinh>
                ) : cheDo === "dau-tri" && dauTri?.trangThai === "XONG" ? (
                  <NutChinh
                    onClick={() => dauTri.luotId && moCauTiep(dauTri.luotId)}
                    dangTai={dangTai}
                  >
                    Xem kết quả của bạn
                  </NutChinh>
                ) : (
                  <NutChinh
                    onClick={() => batDau(cheDo !== "tram")}
                    dangTai={dangTai}
                  >
                    {cheDo === "ngay" && thuThach?.trangThai === "DANG_CHOI"
                      ? "Chơi tiếp thử thách"
                      : cheDo === "dau-tri"
                        ? dauTri?.trangThai === "DANG_CHOI"
                          ? "Chơi tiếp"
                          : "Vào đấu trí"
                        : "Bắt đầu"}
                  </NutChinh>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── màn Thẻ Cơ hội ────────────────────────────────────────────────
  if (man.loai === "the") {
    return (
      <ManTheCoHoi
        man={man}
        lat={() => {
          am.lat();
          setMan({ ...man, lat: true });
        }}
        chon={async (i) => {
          if (man.chon) return;
          const r = await aChonThe(man.the.luotId, i);
          if (!r.ok) {
            alert(r.loi);
            return;
          }
          if (r.data.khonNgoan) am.dung();
          else am.sai();
          setMan({ ...man, chon: r.data, daChon: i });
        }}
        xong={() => {
          if (man.kq)
            setMan({ loai: "ket-qua", kq: { ...man.kq, coTheCoHoi: false } });
          else {
            router.refresh();
            setMan({ loai: "gioi-thieu" });
          }
        }}
      />
    );
  }

  // ─── màn kết quả ───────────────────────────────────────────────────
  if (man.loai === "ket-qua") {
    return (
      <ManKetQua
        kq={man.kq}
        tram={tram}
        luat={luat}
        rutThe={async () => {
          const r = await aRutThe(man.kq.luotId);
          if (!r.ok) {
            alert(r.loi);
            return;
          }
          setMan({ loai: "the", kq: man.kq, the: r.data, lat: false });
        }}
        choiLai={() => {
          router.refresh();
          setMan({ loai: "gioi-thieu" });
        }}
      />
    );
  }

  // ─── màn câu hỏi + phản hồi ────────────────────────────────────────
  const tt = man.tt;
  return (
    <>
      <ManCau
        key={`${tt.luotId}-${tt.viTri}`}
        tt={tt}
        tenTram={
          cheDo === "ngay"
            ? "Thử thách hôm nay"
            : cheDo === "dau-tri"
              ? dauTri!.ten
              : `Trạm ${tram!.ma} · ${tram!.ten}`
        }
        luat={luat}
        ketQuaCau={ketQuaCau}
        phanHoi={man.loai === "phan-hoi" ? man : null}
        guiDapAn={async (dapAn, troGiup) => {
          const r = await aTraLoi(tt.luotId, tt.viTri, dapAn);
          if (!r.ok) {
            if (r.ma === "LECH" && luotId) await moCauTiep(luotId);
            else alert(r.loi);
            return false;
          }
          if (
            r.data.dung &&
            !tt.cau.thuong &&
            mocChuoiTheoLuat(r.data.chuoi, luat)
          )
            am.chuoi();
          else if (r.data.dung) am.dung();
          else {
            am.sai();
            rung();
          }
          setKetQuaCau((cu) => {
            const moi = [...cu];
            moi[tt.viTri] = r.data.dung;
            return moi;
          });
          setMan({ loai: "phan-hoi", tt, ph: r.data, daGui: dapAn, troGiup });
          return true;
        }}
        tiep={() => {
          if (man.loai !== "phan-hoi") return;
          am.bam();
          if (man.ph.cuoi && man.ph.ketQua)
            setMan({ loai: "ket-qua", kq: man.ph.ketQua });
          else void moCauTiep(tt.luotId);
        }}
        thoat={() => setHoiThoat(true)}
      />
      {hoiThoat && (
        <HopThoai dong={() => setHoiThoat(false)}>
          <h3 className="text-lg font-bold">Dừng lượt chơi?</h3>
          <p className="mt-1 text-sm text-slate-600">
            Ra ngôi nhà thì lượt vẫn được giữ, nhưng câu đang mở vẫn chạy đồng
            hồ. Kết thúc ngay thì các câu chưa trả lời tính là sai.
          </p>
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => setHoiThoat(false)}
              className="min-h-11 rounded-full bg-navy-600 font-semibold text-white hover:bg-navy-700"
            >
              Chơi tiếp
            </button>
            <Link
              href="/ngoi-nha"
              className="flex min-h-11 items-center justify-center rounded-full border border-slate-300 font-medium text-slate-700"
            >
              Ra ngôi nhà, giữ lượt
            </Link>
            <button
              type="button"
              onClick={async () => {
                setHoiThoat(false);
                const r = await aKetThucLuot(tt.luotId);
                if (r.ok) setMan({ loai: "ket-qua", kq: r.data });
                else alert(r.loi);
              }}
              className="min-h-11 rounded-full font-medium text-do-600 hover:bg-do-50"
            >
              Kết thúc lượt ngay
            </button>
          </div>
        </HopThoai>
      )}
    </>
  );
}

// ═══ Màn một câu hỏi ═══════════════════════════════════════════════════

function ManCau({
  tt,
  tenTram,
  luat,
  ketQuaCau,
  phanHoi,
  guiDapAn,
  tiep,
  thoat,
}: {
  tt: TrangThaiCau;
  tenTram: string;
  luat: LuatManChoi;
  ketQuaCau: (boolean | null)[];
  phanHoi: { ph: PhanHoi; daGui: DapAnGui; troGiup: TroGiupCau } | null;
  guiDapAn: (d: DapAnGui, troGiup: TroGiupCau) => Promise<boolean>;
  tiep: () => void;
  thoat: () => void;
}) {
  const c = tt.cau;
  const [troGiup, setTroGiup] = useState<TroGiupCau>(
    phanHoi?.troGiup ?? TRO_GIUP_RONG,
  );
  const [daDung, setDaDung] = useState<TroGiup[]>(tt.troGiupDaDung);
  const [dangGui, setDangGui] = useState(false);
  const [gioiHan, setGioiHan] = useState(tt.gioiHanMs);
  const hanChot = useRef<number | null>(null);
  const [conLai, setConLai] = useState(tt.conLaiMs);
  const daGuiRef = useRef(false);
  const tichCuoi = useRef(0);

  // xếp / ghép: lựa chọn đang làm
  const soMuc = c.muc?.length ?? c.trai?.length ?? 0;
  const [thuTu, setThuTu] = useState<number[]>([]);
  const [cap, setCap] = useState<number[]>(() => Array(soMuc).fill(-1));
  const [traiDangChon, setTraiDangChon] = useState<number | null>(null);

  // Giữ bản mới nhất trong ref để hàm gửi và đồng hồ không phải dựng lại mỗi 100ms
  const guiDapAnRef = useRef(guiDapAn);
  const troGiupRef = useRef(troGiup);
  useEffect(() => {
    guiDapAnRef.current = guiDapAn;
    troGiupRef.current = troGiup;
  });

  const gui = useCallback(async (dapAn: DapAnGui) => {
    if (daGuiRef.current) return;
    daGuiRef.current = true;
    setDangGui(true);
    const ok = await guiDapAnRef.current(dapAn, troGiupRef.current);
    if (!ok) daGuiRef.current = false;
    setDangGui(false);
  }, []);

  // Đồng hồ: hết giờ tự gửi "không trả lời"
  useEffect(() => {
    if (phanHoi) return;
    // Mốc hết giờ tính từ lúc gắn màn (không đặt lại khi React vẽ lại)
    hanChot.current ??= Date.now() + tt.conLaiMs;
    const id = setInterval(() => {
      const x = Math.max(0, (hanChot.current ?? 0) - Date.now());
      setConLai(x);
      const giay = Math.ceil(x / 1000);
      if (x > 0 && giay <= 5 && giay !== tichCuoi.current) {
        tichCuoi.current = giay;
        am.tich();
      }
      if (x <= 0) void gui(null);
    }, 100);
    return () => clearInterval(id);
  }, [phanHoi, gui, tt.conLaiMs]);

  async function dungQuyen(loai: TroGiup) {
    if (daDung.includes(loai) || phanHoi || daGuiRef.current) return;
    am.bam();
    const r = await aTroGiup(tt.luotId, tt.viTri, loai);
    if (!r.ok) {
      alert(r.loi);
      return;
    }
    const kq: KetQuaTroGiup = r.data;
    if (!kq.hoanLai) setDaDung((d) => [...d, loai]);
    if (kq.conLaiMs !== undefined) hanChot.current = Date.now() + kq.conLaiMs;
    if (kq.gioiHanMs) setGioiHan(kq.gioiHanMs);
    setTroGiup((cu) => ({
      an: [...new Set([...cu.an, ...(kq.an ?? [])])],
      phanTram: kq.phanTram ?? cu.phanTram,
      soNguoi: kq.soNguoi ?? cu.soNguoi,
      goiY: kq.goiY ?? cu.goiY,
    }));
  }

  const ph = phanHoi?.ph;
  const daGui = phanHoi?.daGui;
  const tiLe = gioiHan > 0 ? conLai / gioiHan : 0;
  const giay = Math.ceil(conLai / 1000);
  const laChiaSe = c.loai === "chia-se";
  const loai =
    c.thuong === "CHIA_SE"
      ? {
          ten: "Câu chia sẻ",
          huongDan: "Không có đúng sai — chọn điều đúng với bạn nhất",
        }
      : c.thuong === "HOI_VIEN"
        ? {
            ten: "Câu thưởng",
            huongDan: "Biết mặt biết tên huynh đệ — chọn 1 đáp án",
          }
        : LOAI_CAU[c.loai as keyof typeof LOAI_CAU];
  const moc = ph?.dung && !c.thuong ? mocChuoiTheoLuat(ph.chuoi, luat) : null;
  const khen = ph ? loiKhen(ph, tt.viTri, laChiaSe, soMuc) : "";

  return (
    <div
      className={`mx-auto max-w-lg px-4 pt-3 ${phanHoi ? "pb-[66vh]" : "pb-10"}`}
    >
      {/* Thanh trên */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={thoat}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white/80 hover:bg-white/20"
          aria-label="Dừng lượt"
        >
          <BieuTuong ten="sai" className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs text-white/60">{tenTram}</div>
          <div className="mt-1 flex gap-1">
            {Array.from({ length: tt.tong }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  ketQuaCau[i] === true
                    ? "bg-emerald-400"
                    : ketQuaCau[i] === false
                      ? "bg-son-500"
                      : i < tt.viTri
                        ? "bg-white/40"
                        : i === tt.viTri
                          ? "bg-white"
                          : "bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>
        {tt.heSo > 1 && !c.thuong && (
          <span className="rounded-full bg-son-600 px-2 py-0.5 text-xs font-bold text-white">
            ×{tt.heSo}
          </span>
        )}
        {c.thuong && (
          <BieuTuong ten="the" dac className="h-5 w-5 text-vang-400" />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <DongHo
          tiLe={phanHoi ? 0 : tiLe}
          giay={phanHoi ? 0 : giay}
          dung={ph?.dung}
          hetGio={ph?.hetGio}
        />
        <div className="text-right">
          <div className="nn-so text-3xl font-bold text-white">
            {soDep(ph ? ph.tongDiem : tt.diem)}
          </div>
          <div className="flex items-center justify-end gap-1 text-sm text-white/70">
            {(ph ? ph.chuoi : tt.chuoi) >= 2 && (
              <span className="inline-flex items-center gap-0.5 font-bold text-vang-400">
                <BieuTuong ten="lua" dac className="h-4 w-4" />{" "}
                {ph ? ph.chuoi : tt.chuoi}
              </span>
            )}
            <span>
              {c.thuong ? "Câu thưởng" : `Câu ${tt.viTri + 1}/${tt.tong}`}
            </span>
          </div>
        </div>
      </div>

      <div
        className={`mt-4 rounded-3xl bg-white p-5 text-navy-900 shadow-2xl ${ph && !ph.dung ? "nn-rung" : "nn-hien"}`}
      >
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
          {c.thuong ? (
            <span className="rounded-full bg-vang-500 px-2 py-0.5 text-navy-900">
              {loai.ten} · +{soDep(luat.diemThuong[c.thuong])}
              {c.thuong === "HOI_VIEN" ? " nếu đúng" : ""}
            </span>
          ) : (
            <span className="rounded-full bg-navy-50 px-2 py-0.5 text-navy-600">
              {loai.ten}
            </span>
          )}
          <span
            className="rounded-full px-2 py-0.5 text-white"
            style={{ background: VON[c.von].mau }}
          >
            {VON[c.von].ten}
          </span>
        </div>
        <h2
          className="mt-3 font-sans text-lg font-semibold leading-snug sm:text-xl"
          style={{ fontFamily: "var(--font-noi-dung)" }}
        >
          {c.hoi}
        </h2>
        <p className="mt-1 text-xs text-slate-500">{loai.huongDan}</p>

        {/* Trắc nghiệm / tình huống */}
        {c.phuongAn && (
          <div className="mt-4 grid gap-2.5">
            {c.phuongAn.map((pa, i) => {
              const an = troGiup.an.includes(i);
              const laDung = ph?.dapAnDung.chon === i;
              const daChon = daGui && "chon" in daGui && daGui.chon === i;
              const lop =
                ph && laChiaSe
                  ? daChon
                    ? "bg-navy-50 ring-2 ring-navy-500 text-navy-900"
                    : "bg-slate-50 text-slate-500 ring-1 ring-slate-200"
                  : ph
                    ? laDung
                      ? "bg-emerald-50 ring-2 ring-emerald-500 text-emerald-900"
                      : daChon
                        ? "bg-do-50 ring-2 ring-do-500 text-do-900"
                        : "bg-slate-50 text-slate-400 ring-1 ring-slate-200"
                    : an
                      ? "bg-slate-50 text-slate-300 ring-1 ring-slate-100 line-through"
                      : "bg-white ring-1 ring-navy-100 hover:ring-2 hover:ring-navy-400 active:scale-[0.99]";
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!!ph || an || dangGui}
                  onClick={() => gui({ chon: i })}
                  className={`relative flex min-h-14 w-full items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 text-left text-[15px] font-medium transition ${lop}`}
                >
                  {troGiup.phanTram && !ph && (
                    <span
                      className="absolute inset-y-0 left-0 bg-navy-100/70"
                      style={{ width: `${troGiup.phanTram[i]}%` }}
                    />
                  )}
                  {ph?.phanTram && laChiaSe && (
                    <span
                      className="absolute inset-y-0 left-0 bg-navy-100/80"
                      style={{ width: `${ph.phanTram[i]}%` }}
                    />
                  )}
                  <span
                    className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                      ph && laChiaSe
                        ? daChon
                          ? "bg-navy-600 text-white"
                          : "bg-slate-200 text-slate-500"
                        : ph && laDung
                          ? "bg-emerald-500 text-white"
                          : ph && daChon
                            ? "bg-do-500 text-white"
                            : "bg-navy-600 text-white"
                    }`}
                  >
                    {ph && !laChiaSe && laDung ? (
                      <BieuTuong ten="dung" className="h-4 w-4" />
                    ) : ph && !laChiaSe && daChon ? (
                      <BieuTuong ten="sai" className="h-4 w-4" />
                    ) : (
                      "ABCDE"[i]
                    )}
                  </span>
                  <span className="relative flex-1">{pa}</span>
                  {troGiup.phanTram && !ph && (
                    <span className="nn-so relative text-sm font-bold text-navy-600">
                      {troGiup.phanTram[i]}%
                    </span>
                  )}
                  {ph?.phanTram && laChiaSe && (
                    <span className="nn-so relative text-sm font-bold text-navy-600">
                      {ph.phanTram[i]}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Đúng / Sai */}
        {c.loai === "ds" && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[true, false].map((v, i) => {
              const laDung = ph?.dapAnDung.dung === v;
              const daChon = daGui && "dung" in daGui && daGui.dung === v;
              return (
                <button
                  key={String(v)}
                  type="button"
                  disabled={!!ph || dangGui}
                  onClick={() => gui({ dung: v })}
                  className={`relative flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl text-lg font-bold transition ${
                    ph
                      ? laDung
                        ? "bg-emerald-500 text-white"
                        : daChon
                          ? "bg-do-500 text-white"
                          : "bg-slate-100 text-slate-400"
                      : v
                        ? "bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200 hover:ring-emerald-500"
                        : "bg-do-50 text-do-700 ring-2 ring-do-200 hover:ring-do-500"
                  }`}
                >
                  <BieuTuong ten={v ? "dung" : "sai"} className="h-6 w-6" />
                  {v ? "ĐÚNG" : "SAI"}
                  {troGiup.phanTram && !ph && (
                    <span className="text-xs font-semibold opacity-80">
                      {troGiup.phanTram[i]}% huynh đệ chọn
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Sắp xếp */}
        {c.muc && (
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              {Array.from({ length: soMuc }, (_, k) => {
                const d = ph
                  ? daGui && "thuTu" in daGui
                    ? daGui.thuTu[k]
                    : undefined
                  : thuTu[k];
                const dungViTri = ph?.dapAnDung.thuTu
                  ? ph.dapAnDung.thuTu[k] === d
                  : undefined;
                return (
                  <button
                    key={k}
                    type="button"
                    disabled={!!ph || d === undefined}
                    onClick={() => setThuTu((x) => x.filter((_, j) => j !== k))}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium ${
                      d === undefined
                        ? "border-2 border-dashed border-slate-200 text-slate-300"
                        : ph
                          ? dungViTri
                            ? "bg-emerald-50 ring-2 ring-emerald-500"
                            : "bg-do-50 ring-2 ring-do-400"
                          : "bg-navy-50 ring-1 ring-navy-200"
                    }`}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy-600 text-xs font-bold text-white">
                      {k + 1}
                    </span>
                    <span className="flex-1">
                      {d === undefined ? "Chạm một mục bên dưới" : c.muc![d]}
                    </span>
                    {ph &&
                      (dungViTri ? (
                        <BieuTuong
                          ten="dung"
                          className="h-4 w-4 text-emerald-600"
                        />
                      ) : (
                        <BieuTuong ten="sai" className="h-4 w-4 text-do-600" />
                      ))}
                  </button>
                );
              })}
            </div>
            {!ph && (
              <>
                <div className="flex flex-wrap gap-2">
                  {c.muc.map((m, i) =>
                    thuTu.includes(i) ? null : (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          am.bam();
                          setThuTu((x) => [...x, i]);
                        }}
                        className="min-h-11 rounded-xl bg-white px-3 py-2 text-left text-sm font-medium ring-2 ring-navy-200 hover:ring-navy-500"
                      >
                        {m}
                      </button>
                    ),
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setThuTu([])}
                    className="min-h-11 rounded-full px-4 text-sm font-medium text-slate-500 hover:bg-slate-100"
                  >
                    Làm lại
                  </button>
                  <button
                    type="button"
                    disabled={thuTu.length !== soMuc || dangGui}
                    onClick={() => gui({ thuTu })}
                    className="min-h-11 flex-1 rounded-full bg-navy-600 font-bold text-white disabled:opacity-40"
                  >
                    Chốt thứ tự
                  </button>
                </div>
              </>
            )}
            {ph?.dapAnDung.thuTu && !ph.dung && (
              <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                <b>Thứ tự đúng:</b>
                <ol className="mt-1 list-decimal space-y-0.5 pl-5">
                  {ph.dapAnDung.thuTu.map((d) => (
                    <li key={d}>{c.muc![d]}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Ghép cặp */}
        {c.trai && c.phai && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                {c.trai.map((t, i) => {
                  const soCap = cap[i] >= 0 ? i + 1 : null;
                  const dungCap =
                    ph?.dapAnDung.cap && daGui && "cap" in daGui
                      ? daGui.cap[i] === ph.dapAnDung.cap[i]
                      : undefined;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!!ph}
                      onClick={() => {
                        am.bam();
                        if (cap[i] >= 0)
                          setCap((x) => x.map((v, j) => (j === i ? -1 : v)));
                        else setTraiDangChon(i === traiDangChon ? null : i);
                      }}
                      className={`flex min-h-14 w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium ${
                        ph
                          ? dungCap
                            ? "bg-emerald-50 ring-2 ring-emerald-500"
                            : "bg-do-50 ring-2 ring-do-400"
                          : traiDangChon === i
                            ? "bg-navy-600 text-white"
                            : soCap
                              ? "bg-navy-50 ring-2 ring-navy-300"
                              : "bg-white ring-1 ring-navy-200"
                      }`}
                    >
                      {soCap && <MauCap so={soCap} />}
                      <span className="flex-1">{t}</span>
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2">
                {c.phai.map((p, d) => {
                  const trai = cap.indexOf(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      disabled={!!ph || (traiDangChon === null && trai < 0)}
                      onClick={() => {
                        if (trai >= 0) {
                          setCap((x) => x.map((v) => (v === d ? -1 : v)));
                          return;
                        }
                        if (traiDangChon === null) return;
                        am.bam();
                        setCap((x) =>
                          x.map((v, j) => (j === traiDangChon ? d : v)),
                        );
                        setTraiDangChon(null);
                      }}
                      className={`flex min-h-14 w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium ${
                        trai >= 0
                          ? "bg-navy-50 ring-2 ring-navy-300"
                          : traiDangChon !== null
                            ? "bg-white ring-2 ring-son-300"
                            : "bg-white ring-1 ring-navy-200"
                      }`}
                    >
                      {trai >= 0 && <MauCap so={trai + 1} />}
                      <span className="flex-1">{p}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {!ph && (
              <button
                type="button"
                disabled={cap.some((v) => v < 0) || dangGui}
                onClick={() => gui({ cap })}
                className="min-h-11 w-full rounded-full bg-navy-600 font-bold text-white disabled:opacity-40"
              >
                Chốt các cặp
              </button>
            )}
            {ph?.dapAnDung.cap && !ph.dung && (
              <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                <b>Các cặp đúng:</b>
                <ul className="mt-1 space-y-0.5">
                  {c.trai.map((t, i) => (
                    <li key={i}>
                      {t} — <b>{c.phai![ph.dapAnDung.cap![i]]}</b>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {troGiup.goiY && !ph && (
          <p className="nn-hien mt-3 flex gap-2 rounded-xl bg-vang-400/15 px-3 py-2 text-sm text-navy-800">
            <BieuTuong
              ten="nguoi"
              className="mt-0.5 h-4 w-4 shrink-0 text-vang-600"
            />
            {troGiup.goiY}
          </p>
        )}
        {troGiup.soNguoi && !ph && (
          <p className="mt-2 text-xs text-slate-500">
            Theo lựa chọn của {troGiup.soNguoi} huynh đệ đã trả lời câu này.
          </p>
        )}
      </div>

      {/* Quyền trợ giúp — câu thưởng không dùng; loại Ban đang tắt thì ẩn nút */}
      {!ph && !c.thuong && luat.troGiup.length > 0 && (
        <div
          className={`mt-4 grid gap-2 ${luat.troGiup.length === 3 ? "grid-cols-3" : luat.troGiup.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {luat.troGiup.includes("5050") && (
            <NutTroGiup
              nhan="50 : 50"
              dung={
                daDung.includes("5050") ||
                !(c.loai === "chon" || c.loai === "th")
              }
              onClick={() => dungQuyen("5050")}
              icon={<span className="text-sm font-black">50</span>}
            />
          )}
          {luat.troGiup.includes("HOI") && (
            <NutTroGiup
              nhan="Hỏi Huynh đệ"
              dung={daDung.includes("HOI")}
              onClick={() => dungQuyen("HOI")}
              icon={<BieuTuong ten="nguoi" className="h-5 w-5" />}
            />
          )}
          {luat.troGiup.includes("GIO") && (
            <NutTroGiup
              nhan={`+${luat.giayThem} giây`}
              dung={daDung.includes("GIO")}
              onClick={() => dungQuyen("GIO")}
              icon={<BieuTuong ten="cat" className="h-5 w-5" />}
            />
          )}
        </div>
      )}

      {/* Bảng phản hồi */}
      {ph && (
        <div
          className="fixed inset-x-0 bottom-0 z-40"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="nn-truot-len mx-auto max-h-[62vh] max-w-lg overflow-y-auto rounded-t-3xl bg-white px-5 pb-5 pt-4 text-navy-900 shadow-[0_-12px_40px_rgba(0,0,0,0.35)]">
            {moc && (
              <div className="nn-sao-bay mb-3 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-son-700 to-son-500 px-4 py-2.5 text-white">
                <BieuTuong ten="lua" dac className="h-8 w-8 text-vang-400" />
                <div>
                  <div className="text-lg font-black leading-tight">
                    {moc.ten}
                  </div>
                  <div className="text-xs text-white/80">{moc.mo}</div>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <div
                className={`flex items-center gap-2 text-xl font-bold ${ph.dung ? (laChiaSe ? "text-navy-700" : "text-emerald-600") : "text-do-600"}`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${ph.dung ? (laChiaSe ? "bg-navy-600" : "bg-emerald-500") : "bg-do-500"}`}
                >
                  <BieuTuong
                    ten={ph.dung ? "dung" : ph.hetGio ? "dong-ho" : "sai"}
                    className="h-5 w-5"
                  />
                </span>
                {khen}
              </div>
              <div className="relative text-right">
                <span className="nn-diem-bay absolute -top-4 right-0 text-lg font-black text-vang-500">
                  {ph.diem > 0 ? `+${ph.diem}` : ""}
                </span>
                <div className="nn-so text-2xl font-black">
                  {ph.diem > 0 ? `+${soDep(ph.diem)}` : "0"}
                </div>
              </div>
            </div>
            {ph.diem > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
                {ph.chiTiet.goc > 0 && <Chip>Đúng +{ph.chiTiet.goc}</Chip>}
                {ph.chiTiet.tocDo > 0 && (
                  <Chip>Tốc độ +{ph.chiTiet.tocDo}</Chip>
                )}
                {ph.chiTiet.chuoi > 0 && <Chip>Chuỗi +{ph.chiTiet.chuoi}</Chip>}
                {ph.chiTiet.motPhan > 0 && (
                  <Chip>Đúng một phần +{ph.chiTiet.motPhan}</Chip>
                )}
                {ph.chiTiet.heSo > 1 && (
                  <Chip dam>×{ph.chiTiet.heSo} Thử thách</Chip>
                )}
              </div>
            )}
            <div className="mt-3 rounded-2xl bg-nga-50 p-3.5">
              <div className="text-xs font-bold uppercase tracking-wide text-son-700">
                {laChiaSe
                  ? "Huynh đệ nói gì?"
                  : c.thuong
                    ? "Làm quen"
                    : "Bạn có biết?"}
              </div>
              <p className="mt-1 text-[15px] leading-relaxed text-navy-900">
                {ph.giaiThich}
              </p>
              {laChiaSe && !!ph.soNguoi && (
                <p className="mt-1 text-xs text-slate-500">
                  {ph.soNguoi} huynh đệ đã trả lời câu này — tỉ lệ hiện ở từng
                  phương án.
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">Nguồn: {ph.nguon}</p>
              {ph.lienKet && (
                <Link
                  href={ph.lienKet}
                  target="_blank"
                  className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-navy-700 underline-offset-2 hover:underline"
                >
                  Xem hồ sơ doanh nghiệp{" "}
                  <BieuTuong ten="mui-ten" className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={tiep}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-son-600 text-base font-bold text-white hover:bg-son-700"
            >
              {ph.cuoi ? "Xem kết quả" : "Câu tiếp theo"}{" "}
              <BieuTuong ten="mui-ten" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Lời khen / động viên theo kết quả — chọn cố định theo số câu để không nhảy chữ khi vẽ lại. */
function loiKhen(
  ph: PhanHoi,
  viTri: number,
  laChiaSe: boolean,
  soMuc: number,
): string {
  if (laChiaSe) return ph.hetGio ? "Hết giờ" : "Cảm ơn bạn đã chia sẻ!";
  if (ph.dung) {
    const kho = ph.chiTiet.tocDo >= 35 ? LOI_KHEN.nhanh : LOI_KHEN.dung;
    return kho[viTri % kho.length];
  }
  if (ph.hetGio) return LOI_KHEN.hetGio[0];
  if (ph.motPhan > 0) return `Đúng ${ph.motPhan}/${soMuc} — gần rồi!`;
  return LOI_KHEN.sai[viTri % LOI_KHEN.sai.length];
}

/** Đếm ngược 3-2-1 trước lượt mới. Gọi `xong` đúng một lần. */
function DemNguoc({ xong }: { xong: () => void }) {
  const [so, setSo] = useState(3);
  const xongRef = useRef(xong);
  useEffect(() => {
    xongRef.current = xong;
  });
  useEffect(() => {
    if (so === 0) {
      am.batDau();
      xongRef.current();
      return;
    }
    am.dem();
    const id = setTimeout(() => setSo((s) => s - 1), 750);
    return () => clearTimeout(id);
  }, [so]);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div key={so} className="nn-sao-bay">
        <div className="text-[110px] font-black leading-none text-white drop-shadow-[0_0_30px_rgba(230,32,57,0.6)]">
          {so > 0 ? so : "Đi!"}
        </div>
      </div>
      <div className="mt-4 text-sm uppercase tracking-[0.3em] text-white/60">
        Sẵn sàng
      </div>
    </div>
  );
}

function DongHo({
  tiLe,
  giay,
  dung,
  hetGio,
}: {
  tiLe: number;
  giay: number;
  dung?: boolean;
  hetGio?: boolean;
}) {
  const r = 26;
  const chuVi = 2 * Math.PI * r;
  const gap = giay <= 5 && dung === undefined;
  return (
    <div className="relative h-16 w-16">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={
            dung === undefined
              ? gap
                ? "#e62039"
                : "#e3b94a"
              : dung
                ? "#10b981"
                : "#e62039"
          }
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={chuVi}
          strokeDashoffset={chuVi * (1 - (dung === undefined ? tiLe : 1))}
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
      </svg>
      <span
        className={`nn-so absolute inset-0 grid place-items-center text-xl font-bold ${gap ? "text-son-300" : "text-white"}`}
      >
        {dung === undefined ? (
          giay
        ) : hetGio ? (
          <BieuTuong ten="dong-ho" className="h-6 w-6" />
        ) : (
          <BieuTuong ten={dung ? "dung" : "sai"} className="h-6 w-6" />
        )}
      </span>
    </div>
  );
}

function NutTroGiup({
  nhan,
  dung,
  onClick,
  icon,
}: {
  nhan: string;
  dung: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={dung}
      onClick={onClick}
      className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-white/10 text-xs font-semibold text-white ring-1 ring-white/15 hover:bg-white/20 disabled:opacity-30"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15">
        {icon}
      </span>
      {nhan}
    </button>
  );
}

function MauCap({ so }: { so: number }) {
  const mau = [
    "#2e4082",
    "#c8102e",
    "#d4a017",
    "#10b981",
    "#7c3aed",
    "#0891b2",
  ];
  return (
    <span
      className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
      style={{ background: mau[(so - 1) % mau.length] }}
    >
      {so}
    </span>
  );
}

function Chip({ children, dam }: { children: React.ReactNode; dam?: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 ${dam ? "bg-son-600 text-white" : "bg-navy-50 text-navy-700"}`}
    >
      {children}
    </span>
  );
}

function O({ nhan, children }: { nhan: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-navy-50 p-2.5">
      <div className="nn-so text-lg font-bold">{children}</div>
      <div className="text-[11px] text-slate-500">{nhan}</div>
    </div>
  );
}

function NutChinh({
  children,
  onClick,
  dangTai,
}: {
  children: React.ReactNode;
  onClick: () => void;
  dangTai: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={dangTai}
      className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-son-600 text-lg font-bold text-white shadow-lg hover:bg-son-700 disabled:opacity-60"
    >
      {dangTai ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        <BieuTuong ten="choi" dac className="h-5 w-5" />
      )}
      {children}
    </button>
  );
}

function HopThoai({
  children,
  dong,
}: {
  children: React.ReactNode;
  dong: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/70 p-0 sm:items-center sm:p-4"
      onClick={dong}
    >
      <div
        className="nn-truot-len w-full max-w-sm rounded-t-3xl bg-white p-5 text-navy-900 sm:rounded-3xl"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        {children}
      </div>
    </div>
  );
}

// ═══ Màn kết quả ═══════════════════════════════════════════════════════

function DemSoLen({ den, thoiGian = 900 }: { den: number; thoiGian?: number }) {
  const [so, setSo] = useState(0);
  useEffect(() => {
    let raf = 0;
    const batDau = performance.now();
    const buoc = (t: number) => {
      const p = Math.min(1, (t - batDau) / thoiGian);
      setSo(Math.round(den * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(buoc);
    };
    raf = requestAnimationFrame(buoc);
    // Tab đang ẩn thì requestAnimationFrame không chạy — chốt số cuối bằng hẹn giờ
    const chot = setTimeout(() => setSo(den), thoiGian + 200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(chot);
    };
  }, [den, thoiGian]);
  return <>{soDep(so)}</>;
}

function ManKetQua({
  kq,
  tram,
  luat,
  rutThe,
  choiLai,
}: {
  kq: KetQuaLuot;
  tram?: TramCongKhai;
  luat: LuatManChoi;
  rutThe: () => Promise<void>;
  choiLai: () => void;
}) {
  const [dangRut, setDangRut] = useState(false);
  const laDauTri = !!kq.dauTriId;
  const laNgay = kq.cheDo === "THU_THACH_NGAY";
  const vui = laNgay ? kq.soDung >= 3 : kq.daQua;

  useEffect(() => {
    if (vui) am.thang();
    else am.sai();
    for (let i = 0; i < kq.sao; i++) setTimeout(() => am.sao(i), 450 + i * 280);
    if (kq.lenHang) setTimeout(() => am.lenHang(), 1200);
  }, [vui, kq.sao, kq.lenHang]);

  const coVon = MA_VON.some((k) => kq.von[k] > 0);
  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      {vui && <PhaoGiay />}
      <div className="nn-hien overflow-hidden rounded-3xl bg-white text-navy-900 shadow-2xl">
        <div
          className={`${vui ? "san-do" : "bg-navy-800"} px-5 pb-6 pt-7 text-center text-white`}
        >
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            {laDauTri
              ? "Đấu trí sự kiện"
              : laNgay
                ? "Thử thách hôm nay"
                : `Trạm ${kq.tramMa}${tram ? ` · ${tram.ten}` : ""}`}
          </div>
          <h1 className="mt-2 text-3xl">
            {laDauTri
              ? "Đã nộp bài!"
              : laNgay
                ? "Hoàn thành thử thách"
                : kq.daQua
                  ? kq.sao === 3
                    ? "Xuất sắc!"
                    : "Vượt trạm!"
                  : "Chưa vượt trạm"}
          </h1>
          {!laNgay && (
            <div className="mt-4 flex justify-center gap-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={i < kq.sao ? "nn-sao-bay" : ""}
                  style={{ animationDelay: `${0.35 + i * 0.28}s` }}
                >
                  <BieuTuong
                    ten="sao"
                    dac
                    className={`h-12 w-12 ${i < kq.sao ? "text-vang-400 drop-shadow-[0_0_12px_rgba(227,185,74,0.7)]" : "text-white/20"}`}
                  />
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 text-sm text-white/80">
            Đúng <b className="text-white">{kq.soDung}</b>/{kq.tong} câu
            {!laNgay &&
              !kq.daQua &&
              tram &&
              ` · cần ${tram.thuThach ? luat.canDeQuaThuThach : luat.canDeQua} câu để vượt trạm`}
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="text-center">
            <div className="nn-so text-5xl font-black text-navy-800">
              <DemSoLen den={kq.diem + (kq.thuongChuoiNgay ?? 0)} />
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {!kq.tinhDiem
                ? kq.cheDo === "LUYEN_TAP"
                  ? "Lượt luyện tập — không cộng vào bảng xếp hạng"
                  : "Mùa giải đã kết thúc — không cộng điểm nữa"
                : laDauTri
                  ? `Cộng thẳng vào Điểm Vươn tầm · +${kq.von.TT} Vốn tri thức · +${kq.von.XH} Vốn xã hội`
                  : laNgay
                    ? `Gồm ${kq.thuongChuoiNgay ?? 0} điểm thưởng chuỗi ${kq.chuoiNgay} ngày`
                    : kq.kyLucMoi
                      ? `Kỷ lục mới! +${soDep(kq.diemGhiNhan)} điểm vào ${kq.choiThu ? "bảng chơi thử" : "bảng xếp hạng"}`
                      : "Chưa vượt kỷ lục cũ của trạm này"}
            </div>
            {kq.choiThu && kq.tinhDiem && (
              <div className="mt-0.5 text-xs text-amber-700">
                Chơi thử — mùa giải chính thức sẽ tính lại từ đầu.
              </div>
            )}
            {kq.thuong && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-vang-400/20 px-3 py-1 text-xs font-semibold text-navy-800">
                <BieuTuong ten="the" className="h-3.5 w-3.5 text-vang-600" />
                {kq.thuong.loai === "CHIA_SE"
                  ? `Câu chia sẻ: ${kq.thuong.dung ? `+${kq.thuong.diem}` : "bỏ qua"}`
                  : `Câu thưởng huynh đệ: ${kq.thuong.dung ? `+${kq.thuong.diem}` : "chưa đúng — lần sau nhớ mặt nhé"}`}
              </div>
            )}
          </div>

          {coVon && (
            <div className="rounded-2xl bg-navy-50 p-3">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-navy-600">
                Vốn tích lũy thêm
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MA_VON.filter((k) => kq.von[k] > 0).map((k) => (
                  <div
                    key={k}
                    className="flex items-center gap-2 rounded-xl bg-white px-3 py-2"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: VON[k].mau }}
                    />
                    <span className="flex-1 text-sm">{VON[k].ten}</span>
                    <b className="nn-so text-emerald-600">+{kq.von[k]}</b>
                  </div>
                ))}
              </div>
            </div>
          )}

          {kq.theSuuTam && (
            <div
              className="nn-lat-the rounded-2xl bg-gradient-to-br from-navy-700 to-navy-900 p-4 text-white"
              style={{ animationDelay: "0.6s" }}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-vang-400">
                <BieuTuong ten="the" className="h-4 w-4" /> Mở khóa thẻ sưu tầm
              </div>
              <div className="mt-1 text-lg font-bold">{kq.theSuuTam.ten}</div>
              <p className="mt-1 text-sm text-white/85">
                {kq.theSuuTam.noiDung}
              </p>
            </div>
          )}

          {kq.lenHang && (
            <div
              className="nn-sao-bay rounded-2xl bg-gradient-to-r from-son-700 via-son-500 to-vang-500 p-4 text-white"
              style={{ animationDelay: "1s" }}
            >
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                Lên hạng
              </div>
              <div className="chu-tieu-de text-2xl">{kq.lenHang.ten}</div>
              <div className="text-sm text-white/90">{kq.lenHang.y}</div>
            </div>
          )}

          {kq.huyHieuMoi.length > 0 && (
            <div className="space-y-2">
              {kq.huyHieuMoi.map((h) => (
                <div
                  key={h.ma}
                  className="nn-hien flex items-center gap-3 rounded-2xl bg-vang-400/15 p-3"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-vang-500 text-navy-900">
                    <BieuTuong ten="khien" dac className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold uppercase text-vang-600">
                      Huy hiệu mới
                    </div>
                    <div className="font-bold">{h.ten}</div>
                  </div>
                  <b className="nn-so text-navy-700">+{soDep(h.diem)}</b>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 pt-1">
            {laDauTri && (
              <Link
                href={`/ngoi-nha/dau-tri/${kq.dauTriId}/bang`}
                className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-son-600 text-base font-bold text-white hover:bg-son-700"
              >
                <BieuTuong ten="cup" className="h-5 w-5" /> Xem bảng xếp hạng sự
                kiện
              </Link>
            )}
            {kq.coTheCoHoi && (
              <button
                type="button"
                disabled={dangRut}
                onClick={async () => {
                  setDangRut(true);
                  await rutThe();
                  setDangRut(false);
                }}
                className="nn-tho flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-vang-500 text-lg font-bold text-navy-900 hover:bg-vang-400 disabled:opacity-60"
              >
                <BieuTuong ten="the" className="h-5 w-5" /> Rút Thẻ Cơ hội
              </button>
            )}
            {kq.tramTiep && (
              <Link
                href={duongDanTram(kq.tramTiep.ma)}
                className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-son-600 px-4 text-center text-base font-bold text-white hover:bg-son-700"
              >
                Trạm tiếp: {kq.tramTiep.ma} · {kq.tramTiep.ten}{" "}
                <BieuTuong ten="mui-ten" className="h-4 w-4 shrink-0" />
              </Link>
            )}
            <div className="grid grid-cols-2 gap-2">
              {!laNgay && (
                <button
                  type="button"
                  onClick={choiLai}
                  className="flex min-h-12 items-center justify-center gap-1.5 rounded-full border border-slate-300 font-semibold text-slate-700"
                >
                  <BieuTuong ten="lam-lai" className="h-4 w-4" /> Chơi lại
                </button>
              )}
              <Link
                href="/ngoi-nha"
                className={`flex min-h-12 items-center justify-center gap-1.5 rounded-full bg-navy-600 font-semibold text-white ${laNgay ? "col-span-2" : ""}`}
              >
                <BieuTuong ten="nha" className="h-4 w-4" /> Về Ngôi nhà
              </Link>
            </div>
            {!laNgay && kq.tinhDiem && (
              <p className="text-center text-xs text-slate-500">
                Còn {kq.luotTinhDiemConLai} lượt tính điểm ở trạm này trong mùa.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ Thẻ Cơ hội ════════════════════════════════════════════════════════

function ManTheCoHoi({
  man,
  lat,
  chon,
  xong,
}: {
  man: Extract<Man, { loai: "the" }>;
  lat: () => void;
  chon: (i: number) => Promise<void>;
  xong: () => void;
}) {
  const [dangChon, setDangChon] = useState(false);
  const kq = man.chon;
  return (
    <div className="mx-auto max-w-lg px-4 pt-8">
      {!man.lat ? (
        <button
          type="button"
          onClick={lat}
          className="nn-hien nn-tho mx-auto flex aspect-[3/4] w-64 flex-col items-center justify-center gap-3 rounded-3xl border-4 border-vang-400 bg-gradient-to-br from-son-700 to-son-900 text-white shadow-2xl"
        >
          <BieuTuong ten="the" className="h-16 w-16 text-vang-400" />
          <span className="chu-tieu-de text-2xl">Thẻ Cơ hội</span>
          <span className="text-sm text-white/75">Chạm để lật thẻ</span>
        </button>
      ) : (
        <div className="nn-lat-the overflow-hidden rounded-3xl bg-white text-navy-900 shadow-2xl">
          <div className="bg-gradient-to-br from-son-700 to-son-900 px-5 py-4 text-white">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-vang-400">
              Thẻ Cơ hội · {man.the.ma}
            </div>
            <h2 className="mt-1 text-2xl">{man.the.ten}</h2>
          </div>
          <div className="space-y-3 p-5">
            <p className="text-[15px] leading-relaxed">{man.the.tinhHuong}</p>
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Bạn sẽ làm gì?
            </div>
            {man.the.lua.map((l, i) => {
              const daChon = man.daChon === i;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!!kq || dangChon}
                  onClick={async () => {
                    setDangChon(true);
                    await chon(i);
                    setDangChon(false);
                  }}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[15px] font-medium ${
                    kq
                      ? daChon
                        ? kq.khonNgoan
                          ? "bg-emerald-50 ring-2 ring-emerald-500"
                          : "bg-do-50 ring-2 ring-do-500"
                        : "bg-slate-50 text-slate-400"
                      : "bg-white ring-1 ring-navy-100 hover:ring-2 hover:ring-navy-400"
                  }`}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy-600 text-sm font-bold text-white">
                    {"AB"[i]}
                  </span>
                  {l}
                </button>
              );
            })}
            {kq && (
              <div
                className={`nn-hien rounded-2xl p-4 ${kq.khonNgoan ? "bg-emerald-50" : "bg-do-50"}`}
              >
                <div
                  className={`font-bold ${kq.khonNgoan ? "text-emerald-700" : "text-do-700"}`}
                >
                  {kq.khonNgoan ? "Lựa chọn khôn ngoan" : "Lựa chọn vội vàng"}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {MA_VON.filter((k) => (kq.von as Partial<Von>)[k]).map(
                    (k) => {
                      const v = (kq.von as Partial<Von>)[k]!;
                      return (
                        <span
                          key={k}
                          className={`rounded-full px-2.5 py-1 text-sm font-bold ${v > 0 ? "bg-emerald-500 text-white" : "bg-do-500 text-white"}`}
                        >
                          {VON[k].ten} {v > 0 ? "+" : ""}
                          {v}
                        </span>
                      );
                    },
                  )}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-navy-900">
                  {kq.giai}
                </p>
                {!kq.ghiNhan && (
                  <p className="mt-2 text-xs text-slate-500">
                    Chơi thử — vốn chưa được ghi vào mùa giải.
                  </p>
                )}
                {kq.huyHieuMoi.map((h) => (
                  <p
                    key={h.ma}
                    className="mt-2 text-sm font-bold text-vang-600"
                  >
                    Huy hiệu mới: {h.ten} (+{soDep(h.diem)})
                  </p>
                ))}
              </div>
            )}
            {kq && (
              <button
                type="button"
                onClick={xong}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-son-600 font-bold text-white"
              >
                Tiếp tục <BieuTuong ten="mui-ten" className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
