"use client";

/**
 * Ô "Lá bài hôm nay" trên trang chủ game + bảng chọn lá (bottom sheet).
 *
 * - Chưa lật: ô nhấp nháy, bấm mở bảng N lá úp. Tự mở một lần mỗi ngày khi Ban
 *   bật `tuMo` và người chơi đã xem xong hướng dẫn (không chồng lên HuongDan);
 *   đóng rồi thì nhớ trong sessionStorage theo ngày để tải lại không bật lại.
 * - Bấm lá: máy chủ quyết định kết quả (`aLatLaBai`), trình duyệt chỉ lật hai
 *   mặt cho đẹp. Lỗi hiện ngay dưới lá, không dùng alert.
 * - Đã lật: ô hiện tóm tắt, giờ mở lá mới và đường tới Bộ sưu tập.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { aLatLaBai } from "@/app/(ngoi-nha)/ngoi-nha/actions-la-bai";
import "@/app/(ngoi-nha)/la-bai.css";
import {
  BIEU_TUONG_LA,
  TEN_LOAI_LA,
  type KetQuaLaBai,
  type LaBaiHomNay,
} from "@/lib/ngoi-nha/la-bai-luat";
import { congNgay, ngayVN } from "@/lib/ngoi-nha/thoi-gian";
import BieuTuong from "./BieuTuong";
import LaBaiMatTruoc, { LaBaiGhiChu } from "./LaBaiMatTruoc";
import PhaoGiay from "./PhaoGiay";
import { am } from "./am-thanh";

const khoaDaDong = (ngay: string) => `nn-la-bai-${ngay}`;

const NEN_O_LOAI = {
  DANH_NGON: "bg-white text-son-700",
  LOI_NHAN: "bg-nga-100 text-son-700",
  DIEM: "bg-vang-400 text-navy-900",
  QUA: "bg-son-600 text-vang-400",
} as const;

function tomTat(kq: KetQuaLaBai): string {
  if (kq.loai === "DANH_NGON")
    return kq.danhNgon
      ? `“${kq.danhNgon.noiDung}” — ${kq.danhNgon.tacGia}`
      : "Danh ngôn hôm nay";
  if (kq.loai === "LOI_NHAN") return kq.loiNhan?.noiDung ?? "Lời nhắn hôm nay";
  if (kq.loai === "DIEM")
    return `+${kq.diem.toLocaleString("vi-VN")} điểm Vươn tầm`;
  return kq.qua
    ? `${kq.qua.ten}${kq.qua.nhaDongHanh ? ` · ${kq.qua.nhaDongHanh}` : ""}`
    : "Quà tặng đặc biệt";
}

export default function LaBaiMoiNgay({
  duLieu,
  daXemHuongDan,
}: {
  duLieu: LaBaiHomNay;
  daXemHuongDan: boolean;
}) {
  const router = useRouter();
  const [ketQua, setKetQua] = useState<KetQuaLaBai | null>(duLieu.ketQua);
  const [mo, setMo] = useState(false);
  const [dangLat, setDangLat] = useState<number | null>(null);
  /** Mặt trước đang quay ra ngoài */
  const [lat, setLat] = useState(!!duLieu.ketQua);
  /** Lật xong hẳn — giấu mặt lưng (máy không hỗ trợ backface-visibility vẫn đúng) */
  const [xongLat, setXongLat] = useState(!!duLieu.ketQua);
  /** Lật trong lần mở trang này → đóng thì làm mới điểm, có pháo giấy / số chạy */
  const [vuaLat, setVuaLat] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const hen = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Sang ngày mới (router.refresh trả dữ liệu ngày khác) → nhận lại từ máy chủ
  const [ngayDangXem, setNgayDangXem] = useState(duLieu.ngay);
  if (ngayDangXem !== duLieu.ngay) {
    setNgayDangXem(duLieu.ngay);
    setKetQua(duLieu.ketQua);
    setLat(!!duLieu.ketQua);
    setXongLat(!!duLieu.ketQua);
    setVuaLat(false);
    setLoi(null);
  }

  useEffect(() => {
    const ds = hen.current;
    return () => ds.forEach(clearTimeout);
  }, []);

  // Tự mở bảng chọn lá một lần mỗi ngày
  useEffect(() => {
    if (!duLieu.bat || !duLieu.tuMo || duLieu.ketQua || !daXemHuongDan) return;
    try {
      if (sessionStorage.getItem(khoaDaDong(duLieu.ngay))) return;
    } catch {
      /* trình duyệt chặn bộ nhớ phiên — vẫn mở */
    }
    const t = setTimeout(() => setMo(true), 700);
    return () => clearTimeout(t);
  }, [duLieu.bat, duLieu.tuMo, duLieu.ketQua, duLieu.ngay, daXemHuongDan]);

  const dong = () => {
    setMo(false);
    try {
      sessionStorage.setItem(khoaDaDong(duLieu.ngay), "1");
    } catch {
      /* bỏ qua */
    }
    // Vừa lật → làm mới điểm, danh hiệu trên trang chủ; mở lại thì không bắn pháo giấy nữa
    if (vuaLat) {
      router.refresh();
      setVuaLat(false);
    }
  };

  // Phím Esc đóng bảng
  const dongRef = useRef(dong);
  useEffect(() => {
    dongRef.current = dong;
  });
  useEffect(() => {
    if (!mo) return;
    const nghe = (e: KeyboardEvent) => {
      if (e.key === "Escape") dongRef.current();
    };
    window.addEventListener("keydown", nghe);
    return () => window.removeEventListener("keydown", nghe);
  }, [mo]);

  async function chon(i: number) {
    if (dangLat !== null || ketQua) return;
    am.bam();
    setLoi(null);
    setDangLat(i);
    const r = await aLatLaBai(i).catch(() => null);
    setDangLat(null);
    if (!r || !r.ok) {
      setLoi(
        r && !r.ok ? r.loi : "Mạng chập chờn — chạm lại một lá để thử lần nữa.",
      );
      return;
    }
    const kq = r.data;
    setKetQua(kq);
    setVuaLat(true);
    setLat(false);
    setXongLat(false);
    am.lat();
    // Một nhịp cho trình duyệt vẽ mặt lưng rồi mới quay
    hen.current.push(setTimeout(() => setLat(true), 60));
    hen.current.push(setTimeout(() => setXongLat(true), 520));
    hen.current.push(
      setTimeout(() => {
        if (kq.loai === "QUA") am.lenHang();
        else if (kq.loai === "DIEM") am.thang();
        else am.dung();
      }, 700),
    );
  }

  if (!duLieu.bat) return null;

  const mai = ngayVN() !== congNgay(duLieu.ngay, 1);

  const o = !ketQua ? (
    <button
      type="button"
      onClick={() => {
        am.bam();
        setMo(true);
      }}
      className="nn-kinh flex w-full items-center gap-3 rounded-3xl p-4 text-left hover:bg-white/10"
    >
      <span className="nn-lb-lung relative grid h-14 w-12 shrink-0 place-items-center rounded-xl text-vang-400 ring-2 ring-vang-400">
        <BieuTuong ten="the" className="h-6 w-6" />
        <span className="nn-tho absolute -right-1.5 -top-1.5 h-3.5 w-3.5 rounded-full bg-son-500 ring-2 ring-navy-900" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">Lá bài hôm nay</span>
        <span className="block text-sm text-white/70">
          {duLieu.soLa} lá úp · danh ngôn, lời nhắn, điểm
          {duLieu.coQua ? ", quà tặng" : ""}
        </span>
        <span className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-son-600 px-4 text-sm font-bold text-white shadow-lg shadow-son-900/40">
          Chọn lá hôm nay
          <BieuTuong ten="mui-ten" className="h-4 w-4" />
        </span>
      </span>
      {duLieu.chuoiNgay > 0 && (
        <span className="shrink-0 text-right">
          <span className="nn-so block text-2xl font-black text-vang-400">
            {duLieu.chuoiNgay}
          </span>
          <span className="block text-[11px] text-white/60">
            ngày liên tiếp
          </span>
        </span>
      )}
    </button>
  ) : (
    <div className="nn-kinh rounded-3xl p-4">
      <button
        type="button"
        onClick={() => {
          am.bam();
          setMo(true);
        }}
        className="flex min-h-11 w-full items-center gap-3 text-left"
      >
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${NEN_O_LOAI[ketQua.loai]}`}
        >
          <BieuTuong ten={BIEU_TUONG_LA[ketQua.loai]} className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-white/60">
            Lá bài hôm nay · {TEN_LOAI_LA[ketQua.loai]}
          </span>
          <span className="line-clamp-2 block text-sm font-semibold leading-snug">
            {tomTat(ketQua)}
          </span>
        </span>
        {Math.max(duLieu.chuoiNgay, ketQua.chuoiNgay) > 0 && (
          <span className="shrink-0 text-right">
            <span className="nn-so block text-2xl font-black text-vang-400">
              {Math.max(duLieu.chuoiNgay, ketQua.chuoiNgay)}
            </span>
            <span className="block text-[11px] text-white/60">
              ngày liên tiếp
            </span>
          </span>
        )}
      </button>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 border-t border-white/10 pt-1">
        <span className="flex items-center gap-1.5 text-xs text-white/60">
          <BieuTuong ten="dong-ho" className="h-4 w-4" />
          Lá mới lúc 6:00 sáng {mai ? "mai" : "nay"}
          {ketQua.diem + ketQua.diemChuoi > 0 && ketQua.ghiNhan && (
            <b className="nn-so ml-1 text-vang-400">
              +{(ketQua.diem + ketQua.diemChuoi).toLocaleString("vi-VN")} điểm
            </b>
          )}
        </span>
        <Link
          href="/ngoi-nha/la-bai"
          className="inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-semibold text-vang-400 hover:bg-white/10"
        >
          Bộ sưu tập
          <BieuTuong ten="mui-ten" className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );

  const bang =
    mo &&
    createPortal(
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/80 sm:items-center sm:p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && dangLat === null) dong();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Lá bài hôm nay"
          className="nn-truot-len max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-navy-900 px-4 pt-3 text-white shadow-2xl ring-1 ring-white/10 sm:rounded-3xl sm:px-6"
          style={{
            paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-vang-400">
              <BieuTuong ten="the" className="h-4 w-4" />
              Lá bài mỗi ngày
            </span>
            <button
              type="button"
              onClick={dong}
              disabled={dangLat !== null}
              aria-label="Đóng"
              className="grid min-h-11 min-w-11 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              <BieuTuong ten="sai" className="h-5 w-5" />
            </button>
          </div>

          {!ketQua ? (
            <div className="pb-1">
              <h2 className="text-center text-2xl leading-[1.25]">
                Chọn một lá bài
              </h2>
              <p className="mx-auto mt-1 max-w-xs text-center text-sm text-white/70">
                Mỗi ngày một lá — danh ngôn, lời nhắn nhủ, điểm tích lũy
                {duLieu.coQua ? " hoặc quà tặng đặc biệt" : ""}.
              </p>
              <div className="mt-6 flex items-end justify-center gap-2 sm:gap-3">
                {Array.from({ length: duLieu.soLa }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={dangLat !== null}
                    onClick={() => void chon(i)}
                    aria-label={`Lật lá số ${i + 1}`}
                    style={{ animationDelay: `${i * 0.3}s` }}
                    className={`nn-lb-lung relative aspect-[5/7] min-h-11 max-w-[7.5rem] flex-1 rounded-2xl border-2 border-vang-400 shadow-xl shadow-black/40 transition-opacity ${
                      dangLat === i
                        ? "nn-lb-nhac ring-4 ring-vang-400/50"
                        : dangLat !== null
                          ? "opacity-40"
                          : "nn-lb-moi hover:brightness-110"
                    }`}
                  >
                    <span className="absolute inset-1.5 rounded-xl border border-vang-400/40" />
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-son-950/40 ring-1 ring-vang-400/70">
                        <BieuTuong
                          ten="the"
                          className="h-5 w-5 text-vang-400"
                        />
                      </span>
                    </span>
                    <span className="absolute inset-x-0 bottom-2 text-center text-[11px] font-bold text-vang-400/90">
                      {i + 1}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-4 min-h-6 text-center" aria-live="polite">
                {dangLat !== null && (
                  <p className="text-sm text-white/70">
                    Đang lật lá số {dangLat + 1}…
                  </p>
                )}
                {loi && (
                  <p
                    role="alert"
                    className="rounded-2xl bg-son-600/20 px-3 py-2 text-sm text-son-200 ring-1 ring-son-500/40"
                  >
                    {loi}
                  </p>
                )}
              </div>
              <p className="mt-3 text-center text-xs text-white/55">
                Lá mới mở lúc 6:00 sáng mỗi ngày · lật nhiều ngày liên tiếp có
                thưởng chuỗi.
              </p>
              <button
                type="button"
                onClick={dong}
                disabled={dangLat !== null}
                className="mt-4 min-h-11 w-full rounded-full text-sm text-white/60 hover:bg-white/5 disabled:opacity-40"
              >
                Để sau
              </button>
            </div>
          ) : (
            <div className="pb-1">
              <div className="nn-lb-canh mx-auto mt-1 w-full max-w-sm">
                <div className={`nn-lb-the ${lat ? "nn-lb-da-lat" : ""}`}>
                  <div
                    aria-hidden="true"
                    className={`nn-lb-mat nn-lb-lung grid min-h-80 place-items-center rounded-3xl border-4 border-vang-400 ${xongLat ? "invisible" : ""}`}
                  >
                    <span className="grid h-20 w-20 place-items-center rounded-full bg-son-950/40 ring-2 ring-vang-400/70">
                      <BieuTuong
                        ten="the"
                        className="h-10 w-10 text-vang-400"
                      />
                    </span>
                  </div>
                  <div
                    className={`nn-lb-mat nn-lb-mat-truoc ${lat ? "" : "invisible"}`}
                  >
                    <LaBaiMatTruoc
                      kq={ketQua}
                      vuaLat={vuaLat}
                      className="h-full"
                    />
                  </div>
                </div>
              </div>
              {xongLat && (
                <div className="nn-hien mt-4 space-y-3">
                  <LaBaiGhiChu kq={ketQua} />
                  <button
                    type="button"
                    onClick={dong}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-son-600 text-base font-bold text-white hover:bg-son-700"
                  >
                    Đóng
                  </button>
                  <Link
                    href="/ngoi-nha/la-bai"
                    onClick={() => {
                      try {
                        sessionStorage.setItem(khoaDaDong(duLieu.ngay), "1");
                      } catch {
                        /* bỏ qua */
                      }
                    }}
                    className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full text-sm font-semibold text-vang-400 hover:bg-white/5"
                  >
                    Xem bộ sưu tập lá bài
                    <BieuTuong ten="mui-ten" className="h-4 w-4" />
                  </Link>
                  <p className="text-center text-xs text-white/55">
                    Lá mới lúc 6:00 sáng {mai ? "mai" : "nay"}.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        {vuaLat && xongLat && ketQua?.loai === "QUA" && <PhaoGiay />}
      </div>,
      document.body,
    );

  return (
    <>
      {o}
      {bang}
    </>
  );
}
