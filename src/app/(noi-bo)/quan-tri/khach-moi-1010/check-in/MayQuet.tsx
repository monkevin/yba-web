"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { huyQuet, quetMa, type KetQuaQuet } from "../actions";

/**
 * MÁY QUÉT MÃ QR cho lễ tân ngày 10/10 (Chủ tịch đặt hàng 01/10/2026).
 *
 * Lễ tân bật camera điện thoại, đưa vào mã QR trên thư mời của khách (hoặc
 * thẻ hội viên trong Zalo Mini App) — máy đọc mã, gọi `quetMa` ở máy chủ
 * và hiện ngay tên + bàn + phiên; quét liên tục không phải bấm gì thêm.
 *
 *  - Giải mã ngay trong trình duyệt: ưu tiên BarcodeDetector có sẵn của
 *    máy (Android/Chrome), không có thì dùng thư viện jsQR (iPhone/Safari).
 *  - Camera chỉ chạy trên https (ybacholon.vn) và phải do người dùng bấm
 *    nút bật — đừng tự bật trong useEffect, iPhone sẽ chặn.
 *  - "Chạy thử": chỉ đọc mã và tra tên, KHÔNG ghi. Mặc định bật khi chưa
 *    tới ngày sự kiện để BTC tập dượt không làm bẩn số liệu.
 *  - Ô gõ tay bên dưới nhận cả súng quét mã (gõ như bàn phím rồi Enter).
 */

type PhienThat = "TOA_DAM" | "LE" | "GALA";
type PhienChon = "TU_DONG" | PhienThat;
type Luot = KetQuaQuet & { khoa: number; daHuy?: boolean; dangHuy?: boolean };

const TEN_PHIEN: Record<PhienThat, string> = {
  TOA_DAM: "Tọa đàm",
  LE: "Lễ",
  GALA: "Gala",
};

/** Cùng luật với `phienTheoGio` ở máy chủ — ở đây chỉ để HIỆN nhãn nút. */
function phienTheoGioMay(): PhienThat {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const so = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
  const phut = (so("hour") % 24) * 60 + so("minute");
  return phut >= 17 * 60 + 30 ? "GALA" : phut >= 16 * 60 + 30 ? "LE" : "TOA_DAM";
}

type GiaiMa = (
  cv: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) => Promise<string | null>;

type BoDoMaVach = {
  detect: (nguon: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};
type LopDoMaVach = {
  new (o: { formats: string[] }): BoDoMaVach;
  getSupportedFormats?: () => Promise<string[]>;
};

/** Chọn bộ giải mã: của máy nếu có, không thì jsQR (nạp lúc cần). */
async function taoGiaiMa(): Promise<GiaiMa> {
  let jsqr: typeof import("jsqr").default | null = null;
  const bangJsqr: GiaiMa = async (cv, ctx) => {
    if (!jsqr) jsqr = (await import("jsqr")).default;
    const anh = ctx.getImageData(0, 0, cv.width, cv.height);
    return (
      jsqr(anh.data, cv.width, cv.height, { inversionAttempts: "dontInvert" })
        ?.data || null
    );
  };

  const Lop = (window as unknown as { BarcodeDetector?: LopDoMaVach })
    .BarcodeDetector;
  if (Lop) {
    try {
      const ho = (await Lop.getSupportedFormats?.()) ?? [];
      if (ho.includes("qr_code")) {
        const may = new Lop({ formats: ["qr_code"] });
        let hong = false;
        return async (cv, ctx) => {
          if (!hong) {
            try {
              return (await may.detect(cv))[0]?.rawValue || null;
            } catch {
              hong = true; // máy báo có mà chạy lỗi — đổi hẳn sang jsQR
            }
          }
          return bangJsqr(cv, ctx);
        };
      }
    } catch {
      /* dùng jsQR */
    }
  }
  return bangJsqr;
}

function keu(ac: AudioContext | null, kieu: "ok" | "lai" | "loi") {
  if (!ac) return;
  const not: [number, number, number][] =
    kieu === "ok"
      ? [[880, 0, 0.13]]
      : kieu === "lai"
        ? [
            [520, 0, 0.1],
            [520, 0.17, 0.1],
          ]
        : [[190, 0, 0.38]];
  for (const [tanSo, tre, dai] of not) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    const t = ac.currentTime + tre;
    o.type = "sine";
    o.frequency.value = tanSo;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dai);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + dai + 0.03);
  }
}

const MAU: Record<KetQuaQuet["kieu"], { khung: string; chu: string; dau: string }> = {
  MOI: { khung: "border-emerald-400 bg-emerald-50", chu: "text-emerald-800", dau: "✓" },
  DA_CO: { khung: "border-amber-400 bg-amber-50", chu: "text-amber-800", dau: "↺" },
  NGOAI_SUAT: { khung: "border-orange-500 bg-orange-50", chu: "text-orange-800", dau: "!" },
  KHONG_THAY: { khung: "border-do-400 bg-do-50", chu: "text-do-700", dau: "✕" },
  LOI: { khung: "border-do-400 bg-do-50", chu: "text-do-700", dau: "✕" },
};

export default function MayQuet({ macDinhThu }: { macDinhThu: boolean }) {
  const router = useRouter();
  const [camBat, setCamBat] = useState(false);
  const [dangMo, setDangMo] = useState(false);
  const [loiCam, setLoiCam] = useState("");
  const [thu, setThu] = useState(macDinhThu);
  const [phien, setPhien] = useState<PhienChon>("TU_DONG");
  const [phienGio, setPhienGio] = useState<PhienThat | null>(null);
  const [coTieng, setCoTieng] = useState(true);
  const [dangGui, setDangGui] = useState(false);
  const [luot, setLuot] = useState<Luot[]>([]);
  const [maTay, setMaTay] = useState("");
  const [huongCam, setHuongCam] = useState<"environment" | "user">("environment");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const luong = useRef<MediaStream | null>(null);
  /** Đang bận giải mã hoặc đang chờ máy chủ — vòng quét bỏ qua khung hình */
  const ban = useRef(false);
  const lanThu = useRef(0);
  const giaiMa = useRef<GiaiMa | null>(null);
  const maCuoi = useRef<{ ma: string; luc: number }>({ ma: "", luc: 0 });
  const amThanh = useRef<AudioContext | null>(null);
  const khoaManHinh = useRef<{ release: () => Promise<void> } | null>(null);
  const dem = useRef(0);
  // Bản sao trạng thái cho vòng quét (vòng chạy ngoài chu kỳ vẽ của React)
  const tt = useRef({ thu, phien, coTieng });
  useEffect(() => {
    tt.current = { thu, phien, coTieng };
  }, [thu, phien, coTieng]);

  useEffect(() => {
    const dat = () => setPhienGio(phienTheoGioMay());
    dat();
    const h = window.setInterval(dat, 30_000);
    return () => window.clearInterval(h);
  }, []);

  /** Gửi một mã lên máy chủ rồi hiện kết quả. */
  const xuLy = useCallback(
    async (ma: string) => {
      const { thu: laThu, phien: p, coTieng: tieng } = tt.current;
      ban.current = true;
      setDangGui(true);
      let kq: KetQuaQuet;
      try {
        kq = await quetMa(ma, p, laThu);
      } catch {
        kq = {
          kieu: "LOI",
          thu: laThu,
          thongBao: "Mất kết nối tới máy chủ — kiểm tra mạng rồi quét lại.",
        };
      }
      setDangGui(false);
      ban.current = false;
      // Mã lỗi thì cho quét lại ngay; mã đúng thì 6 giây sau mới nhận lại
      if (kq.kieu === "LOI") maCuoi.current = { ma: "", luc: 0 };
      dem.current += 1;
      setLuot((cu) => [{ ...kq, khoa: dem.current }, ...cu].slice(0, 15));
      if (tieng) {
        keu(
          amThanh.current,
          kq.kieu === "MOI" ? "ok" : kq.kieu === "DA_CO" ? "lai" : "loi"
        );
      }
      try {
        navigator.vibrate?.(kq.kieu === "MOI" ? 90 : [70, 70, 70]);
      } catch {
        /* máy không rung */
      }
      if (!kq.thu && (kq.kieu === "MOI" || kq.kieu === "DA_CO")) router.refresh();
    },
    [router]
  );

  const nhanMa = useCallback(
    (ma: string) => {
      const sach = ma.trim();
      if (!sach) return;
      const now = Date.now();
      if (sach === maCuoi.current.ma && now - maCuoi.current.luc < 6000) return;
      maCuoi.current = { ma: sach, luc: now };
      void xuLy(sach);
    },
    [xuLy]
  );

  // Vòng quét gọi hàm nhận mã MỚI NHẤT qua ref (vòng sống lâu hơn một lần vẽ)
  const nhanMaRef = useRef(nhanMa);
  useEffect(() => {
    nhanMaRef.current = nhanMa;
  }, [nhanMa]);

  // VÒNG QUÉT: chạy suốt lúc camera bật, ~7 khung hình mỗi giây
  useEffect(() => {
    if (!camBat) return;
    let dung = false;
    let id = 0;
    function buoc() {
      if (dung) return;
      const v = videoRef.current;
      const now = performance.now();
      if (
        v &&
        giaiMa.current &&
        !ban.current &&
        v.readyState >= 2 &&
        now - lanThu.current > 140
      ) {
        lanThu.current = now;
        const w = v.videoWidth;
        const h = v.videoHeight;
        if (w && h) {
          const cv = (canvasRef.current ??= document.createElement("canvas"));
          // Lấy ô vuông giữa khung hình, thu về tối đa 640 điểm ảnh cho nhanh
          const s = Math.min(w, h);
          const d = Math.min(s, 640);
          if (cv.width !== d) {
            cv.width = d;
            cv.height = d;
          }
          const ctx = cv.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(v, (w - s) / 2, (h - s) / 2, s, s, 0, 0, d, d);
            ban.current = true;
            giaiMa
              .current(cv, ctx)
              .then((ma) => {
                ban.current = false;
                if (ma && !dung) nhanMaRef.current(ma);
              })
              .catch(() => {
                ban.current = false;
              });
          }
        }
      }
      id = requestAnimationFrame(buoc);
    }
    id = requestAnimationFrame(buoc);
    return () => {
      dung = true;
      cancelAnimationFrame(id);
    };
  }, [camBat]);

  const tatCam = useCallback(() => {
    luong.current?.getTracks().forEach((t) => t.stop());
    luong.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    void khoaManHinh.current?.release().catch(() => {});
    khoaManHinh.current = null;
    setCamBat(false);
  }, []);

  const batCam = useCallback(
    async (huong: "environment" | "user") => {
      setLoiCam("");
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setLoiCam(
          "Camera chỉ chạy khi mở web bằng địa chỉ https://ybacholon.vn trên Safari hoặc Chrome. Nếu đang mở trong Zalo, bấm dấu ⋯ → “Mở bằng trình duyệt”."
        );
        return;
      }
      setDangMo(true);
      try {
        // Âm báo phải được tạo từ một cú bấm của người dùng
        if (!amThanh.current) {
          const Lop =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext })
              .webkitAudioContext;
          if (Lop) amThanh.current = new Lop();
        }
        void amThanh.current?.resume().catch(() => {});

        luong.current?.getTracks().forEach((t) => t.stop());
        const s = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: huong },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        luong.current = s;
        const v = videoRef.current;
        if (!v) throw new Error("no-video");
        v.srcObject = s;
        await v.play();
        if (!giaiMa.current) giaiMa.current = await taoGiaiMa();
        ban.current = false;
        setCamBat(true);
        try {
          const wl = (
            navigator as unknown as {
              wakeLock?: { request: (k: "screen") => Promise<{ release: () => Promise<void> }> };
            }
          ).wakeLock;
          khoaManHinh.current = (await wl?.request("screen")) ?? null;
        } catch {
          /* không giữ sáng màn hình được cũng không sao */
        }
      } catch (e) {
        const ten = (e as { name?: string })?.name ?? "";
        setLoiCam(
          ten === "NotAllowedError"
            ? "Trình duyệt chưa được phép dùng camera. Bấm biểu tượng ổ khoá / “aA” cạnh thanh địa chỉ → cho phép Camera, rồi bấm bật lại."
            : ten === "NotFoundError" || ten === "OverconstrainedError"
              ? "Không tìm thấy camera trên máy này — dùng ô gõ mã bên dưới."
              : ten === "NotReadableError"
                ? "Camera đang bị ứng dụng khác chiếm — đóng ứng dụng đó rồi bật lại."
                : "Không bật được camera — thử lại, hoặc dùng ô gõ mã bên dưới."
        );
        tatCam();
      } finally {
        setDangMo(false);
      }
    },
    [tatCam]
  );

  // Rời trang thì trả camera
  useEffect(() => tatCam, [tatCam]);

  async function huy(l: Luot) {
    if (!l.id || !l.phien) return;
    setLuot((cu) => cu.map((x) => (x.khoa === l.khoa ? { ...x, dangHuy: true } : x)));
    let loi = "";
    try {
      const r = await huyQuet(l.id, l.phien);
      loi = r.error ?? "";
    } catch {
      loi = "Mất kết nối — chưa huỷ được.";
    }
    setLuot((cu) =>
      cu.map((x) =>
        x.khoa === l.khoa
          ? { ...x, dangHuy: false, daHuy: !loi, thongBao: loi || x.thongBao }
          : x
      )
    );
    if (!loi) {
      maCuoi.current = { ma: "", luc: 0 };
      router.refresh();
    }
  }

  const moi = luot[0];
  const nhanTuDong = phienGio ? `Tự động · ${TEN_PHIEN[phienGio]}` : "Tự động";

  return (
    <section className="card mb-5 p-4" aria-label="Quét mã QR check-in">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold text-navy-800">📷 Quét mã QR</h2>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-navy-50 px-3 text-sm font-semibold text-navy-700">
          <input
            type="checkbox"
            checked={thu}
            onChange={(e) => setThu(e.target.checked)}
            className="h-5 w-5"
          />
          Chạy thử (không ghi)
        </label>
      </div>

      {thu ? (
        <p className="mt-2 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-sm text-sky-800">
          <b>ĐANG CHẠY THỬ</b> — máy đọc mã và tra tên nhưng KHÔNG ghi check-in.
          Khi đón khách thật, bỏ dấu tích “Chạy thử”.
        </p>
      ) : (
        macDinhThu && (
          <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <b>ĐANG GHI THẬT</b> dù chưa tới ngày 10.10 — mỗi lượt quét sẽ tính
            là khách đã vào. Thử xong nhớ bấm “Huỷ” từng lượt.
          </p>
        )
      )}

      {/* Phiên */}
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Phiên check-in">
        {(["TU_DONG", "TOA_DAM", "LE", "GALA"] as PhienChon[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPhien(p)}
            aria-pressed={phien === p}
            className={`min-h-11 rounded-lg px-3 text-sm font-bold transition ${
              phien === p
                ? "bg-navy-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-navy-100 hover:bg-navy-50"
            }`}
          >
            {p === "TU_DONG" ? nhanTuDong : TEN_PHIEN[p]}
          </button>
        ))}
      </div>

      {/* Khung camera */}
      <div className="relative mx-auto mt-3 aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-slate-900">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`h-full w-full object-cover ${camBat ? "" : "invisible"} ${
            huongCam === "user" ? "-scale-x-100" : ""
          }`}
        />
        {camBat && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-[14%] rounded-2xl border-4 border-white/85 shadow-[0_0_0_999px_rgba(15,23,42,0.35)]"
            />
            {dangGui && (
              <div className="absolute inset-x-0 bottom-3 text-center text-sm font-bold text-white drop-shadow">
                Đang tra mã…
              </div>
            )}
          </>
        )}
        {!camBat && (
          <div className="absolute inset-0 grid place-items-center p-5 text-center">
            <button
              type="button"
              onClick={() => batCam(huongCam)}
              disabled={dangMo}
              className="min-h-14 rounded-full bg-do-600 px-7 text-lg font-extrabold text-white shadow-lg transition hover:bg-do-700 disabled:opacity-60"
            >
              {dangMo ? "Đang mở camera…" : "Bật camera để quét"}
            </button>
          </div>
        )}
      </div>
      {camBat && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={tatCam} className="btn-ghost min-h-11">
            Tắt camera
          </button>
          <button
            type="button"
            onClick={() => {
              const moiHuong = huongCam === "environment" ? "user" : "environment";
              setHuongCam(moiHuong);
              void batCam(moiHuong);
            }}
            className="btn-ghost min-h-11"
          >
            Đổi camera trước / sau
          </button>
          <button
            type="button"
            onClick={() => setCoTieng((x) => !x)}
            className="btn-ghost min-h-11"
            aria-pressed={coTieng}
          >
            {coTieng ? "🔔 Có tiếng" : "🔕 Tắt tiếng"}
          </button>
        </div>
      )}
      {loiCam && (
        <p role="alert" className="mt-2 rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
          {loiCam}
        </p>
      )}

      {/* Kết quả lượt vừa quét */}
      <div aria-live="polite" className="mt-3">
        {moi && (
          <div className={`rounded-2xl border-2 p-4 ${MAU[moi.kieu].khung}`}>
            <p className={`text-sm font-bold ${MAU[moi.kieu].chu}`}>
              <span className="mr-1.5 inline-grid h-6 w-6 place-items-center rounded-full bg-white text-base">
                {MAU[moi.kieu].dau}
              </span>
              {moi.daHuy ? "ĐÃ HUỶ lượt này" : moi.thongBao}
              {moi.thu && !/CHẠY THỬ/.test(moi.thongBao) && (
                <span className="ml-2 rounded-full bg-sky-600 px-2 py-0.5 text-xs text-white">
                  chạy thử
                </span>
              )}
            </p>
            {moi.ten && (
              <>
                <p className="mt-2 text-2xl leading-tight font-extrabold text-navy-800">
                  {moi.ten}
                  {moi.hoiVien && (
                    <span className="ml-2 rounded-full bg-navy-600 px-2 py-0.5 align-middle text-xs font-bold text-white">
                      Hội viên {moi.hoiVien}
                    </span>
                  )}
                </p>
                {moi.moTa && <p className="text-sm text-slate-600">{moi.moTa}</p>}
                {moi.kieu !== "KHONG_THAY" && (
                  <p className="mt-1.5 text-3xl font-extrabold text-do-600">
                    {moi.ban ? `Bàn ${moi.ban}` : "Chưa xếp bàn"}
                  </p>
                )}
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {moi.tenPhien}
                  {moi.gio ? ` · ${moi.gio}` : ""}
                  {moi.ma ? ` · ${moi.ma}` : ""}
                </p>
              </>
            )}
            {moi.diem && (
              <p className="mt-1.5 text-sm font-bold text-navy-700">⭐ {moi.diem}</p>
            )}
            {moi.canhBao?.map((c) => (
              <p key={c} className="mt-1 text-sm text-amber-800">
                ⚠ {c}
              </p>
            ))}
            {moi.soDaVao && (
              <p className="mt-2 text-xs text-slate-500">
                Đã vào: Tọa đàm <b>{moi.soDaVao.td}</b> · Lễ <b>{moi.soDaVao.le}</b> ·
                Gala <b>{moi.soDaVao.gala}</b>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Gõ tay / súng quét */}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const ma = maTay.trim();
          if (!ma) return;
          setMaTay("");
          maCuoi.current = { ma: "", luc: 0 };
          void xuLy(ma);
        }}
      >
        <input
          value={maTay}
          onChange={(e) => setMaTay(e.target.value)}
          placeholder="Hoặc gõ mã: CL-… / HV…"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="inp min-h-12 flex-1 text-base uppercase"
        />
        <button disabled={dangGui} className="btn-primary min-h-12 shrink-0">
          {thu ? "Tra mã" : "Check-in"}
        </button>
      </form>

      {/* Các lượt gần đây */}
      {luot.length > 1 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold text-slate-500 uppercase">
            Các lượt vừa quét
          </p>
          <ul className="divide-y divide-navy-50 rounded-xl border border-navy-100">
            {luot.slice(1).map((l) => (
              <li key={l.khoa} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className={`font-bold ${MAU[l.kieu].chu}`}>{MAU[l.kieu].dau}</span>
                <span className={`min-w-0 flex-1 truncate ${l.daHuy ? "text-slate-400 line-through" : "text-navy-800"}`}>
                  {l.ten ?? l.thongBao}
                  <span className="ml-1.5 text-xs text-slate-500">
                    {[l.tenPhien, l.gio, l.ban ? `bàn ${l.ban}` : "", l.thu ? "thử" : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                {l.kieu === "MOI" && !l.thu && !l.daHuy && (
                  <button
                    type="button"
                    disabled={l.dangHuy}
                    onClick={() => huy(l)}
                    className="min-h-9 shrink-0 rounded-lg bg-slate-100 px-2.5 text-xs font-semibold text-slate-600 hover:bg-do-50 hover:text-do-700"
                  >
                    {l.dangHuy ? "…" : "Huỷ"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {moi && moi.kieu === "MOI" && !moi.thu && !moi.daHuy && (
        <div className="mt-2 text-right">
          <button
            type="button"
            disabled={moi.dangHuy}
            onClick={() => huy(moi)}
            className="min-h-10 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-600 hover:bg-do-50 hover:text-do-700"
          >
            {moi.dangHuy ? "Đang huỷ…" : "Quét nhầm — huỷ lượt vừa rồi"}
          </button>
        </div>
      )}
    </section>
  );
}
