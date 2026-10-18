"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BieuTuong from "@/components/ngoi-nha/BieuTuong";
import { am, rung } from "@/components/ngoi-nha/am-thanh";
import type { KetQuaTran } from "@/lib/ngoi-nha/dau-truong";
import type { CauHienThi } from "@/lib/ngoi-nha/kieu";
import { soDep } from "@/lib/ngoi-nha/luat";
import { aCauTranDau, aNopTranDau } from "../../actions";

/**
 * Màn chơi một lượt đấu trường: số câu và giây mỗi câu theo đề bài của trận
 * (Ban Điều hành chỉnh ở quản trị), hết giờ tính bỏ câu.
 * Đồng hồ và cú bấm tay có thể về cùng lúc → chặn trả lời đúp bằng `traLoiRef`.
 */
export default function ChoiTranDau({
  tranId,
  laThach,
  doiThu,
  soCau,
  giayMoiCau,
}: {
  tranId: string;
  laThach: boolean;
  doiThu: string;
  soCau: number;
  giayMoiCau: number;
}) {
  const router = useRouter();
  const [cau, setCau] = useState<CauHienThi[] | null>(null);
  const [giay, setGiay] = useState<number>(giayMoiCau);
  const [i, setI] = useState(0);
  const [conLai, setConLai] = useState(giayMoiCau * 1000);
  const [kq, setKq] = useState<KetQuaTran | null>(null);
  const [ban, setBan] = useState(false);
  const [loi, setLoi] = useState("");
  /** Đã trả lời hết mà nộp lỗi (mạng) — hiện nút gửi lại */
  const [choGuiLai, setChoGuiLai] = useState(false);
  const traLoiRef = useRef<number[]>([]);
  const batDauRef = useRef(0);
  const hanRef = useRef(0);
  const daNopRef = useRef(false);

  async function batDau() {
    am.bam();
    setBan(true);
    setLoi("");
    const r = await aCauTranDau(tranId);
    setBan(false);
    if (!r.ok) {
      setLoi(r.loi);
      return;
    }
    traLoiRef.current = [];
    batDauRef.current = Date.now();
    setGiay(r.data.giay);
    setConLai(r.data.giay * 1000);
    setCau(r.data.cau);
    setI(0);
  }

  // Đồng hồ từng câu — mốc hết giờ đặt khi sang câu, số hiển thị cập nhật mỗi 100ms
  useEffect(() => {
    if (!cau || kq) return;
    hanRef.current = Date.now() + giay * 1000;
    const id = setInterval(() => {
      const x = Math.max(0, hanRef.current - Date.now());
      setConLai(x);
      if (x <= 0) void traLoi(-1);
    }, 100);
    return () => clearInterval(id);
    // chỉ chạy lại khi sang câu mới
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cau, i, kq]);

  async function nop() {
    daNopRef.current = true;
    setBan(true);
    setLoi("");
    try {
      const r = await aNopTranDau(
        tranId,
        traLoiRef.current,
        Date.now() - batDauRef.current,
      );
      if (!r.ok) {
        setLoi(r.loi);
        daNopRef.current = false;
        setChoGuiLai(true);
        return;
      }
      setChoGuiLai(false);
      if (r.data.xong ? r.data.thang !== false : true) am.thang();
      else am.sai();
      setKq(r.data);
    } catch {
      setLoi("Mạng chập chờn, chưa gửi được kết quả.");
      daNopRef.current = false;
      setChoGuiLai(true);
    } finally {
      setBan(false);
    }
  }

  async function traLoi(chon: number) {
    if (!cau || daNopRef.current) return;
    if (traLoiRef.current.length !== i) return; // câu này đã ghi nhận
    traLoiRef.current.push(chon);
    if (chon >= 0) am.bam();
    else rung();
    if (traLoiRef.current.length >= cau.length) {
      await nop();
    } else {
      setConLai(giay * 1000);
      setI((k) => k + 1);
    }
  }

  if (!cau) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center text-navy-900">
        <BieuTuong ten="tia" dac className="mx-auto h-12 w-12 text-son-600" />
        <h2 className="mt-2 text-2xl">
          {laThach ? `Bạn thách ${doiThu}` : `${doiThu} thách đấu bạn`}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Bấm bắt đầu là đồng hồ chạy ngay: {soCau} câu, mỗi câu {giayMoiCau}{" "}
          giây, hết giờ câu nào tính bỏ câu đó. Không có trợ giúp. Đúng nhiều
          hơn thắng — hoà điểm thì ai nhanh hơn thắng. Đồng hồ chạy ở máy chủ:
          tải lại trang giữa trận không được tính lại từ đầu.
        </p>
        {loi && (
          <p
            className="mt-3 rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700"
            role="alert"
          >
            {loi}
          </p>
        )}
        <button
          type="button"
          onClick={batDau}
          disabled={ban}
          className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-son-600 text-lg font-bold text-white hover:bg-son-700 disabled:opacity-60"
        >
          <BieuTuong ten="choi" dac className="h-5 w-5" />{" "}
          {ban ? "Đang mở…" : "Vào trận"}
        </button>
      </div>
    );
  }

  if (kq) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl bg-white p-5 text-center text-navy-900">
          <div className="chu-tieu-de text-2xl">
            {kq.xong
              ? kq.thang === null
                ? "Hoà!"
                : kq.thang
                  ? "Bạn thắng!"
                  : "Bạn thua trận này"
              : "Đã nộp lượt của bạn"}
          </div>
          <div className="nn-so mt-2 text-5xl font-black text-navy-800">
            {kq.soDung}
            <span className="text-xl font-normal text-slate-500">
              /{kq.tong}
            </span>
          </div>
          <div className="mt-1 text-sm text-slate-500">
            {kq.xong
              ? kq.tinhDiem === false
                ? (kq.ghiChuDiem ?? "Trận này không cộng điểm.")
                : [
                    `+${soDep(kq.diem)} điểm Vươn tầm`,
                    kq.von?.TT ? `+${kq.von.TT} Vốn tri thức` : "",
                    kq.von?.XH ? `+${kq.von.XH} Vốn xã hội` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")
              : `Chờ ${doiThu} chơi lượt của họ — kết quả chung cuộc và điểm sẽ hiện ở trang này.`}
          </div>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-4 min-h-11 rounded-full bg-navy-600 px-5 text-sm font-bold text-white"
          >
            Xem trang trận đấu
          </button>
        </div>
        <div className="rounded-3xl bg-white p-4 text-navy-900">
          <div className="font-bold">Xem lại đáp án</div>
          <ol className="mt-2 space-y-3">
            {kq.xemLai.map((c, k) => {
              const ok = c.chon === c.dung;
              return (
                <li
                  key={k}
                  className="border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0"
                >
                  <div className="flex gap-2">
                    <span
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white ${ok ? "bg-emerald-500" : "bg-do-500"}`}
                    >
                      <BieuTuong
                        ten={ok ? "dung" : c.chon < 0 ? "dong-ho" : "sai"}
                        className="h-3 w-3"
                      />
                    </span>
                    <span className="font-medium">{c.hoi}</span>
                  </div>
                  <div className="mt-1 pl-7 text-xs text-slate-600">
                    Đúng:{" "}
                    <b className="text-emerald-700">{c.phuongAn[c.dung]}</b>
                    {!ok && c.chon >= 0 && (
                      <>
                        {" "}
                        · Bạn chọn:{" "}
                        <span className="text-do-600">
                          {c.phuongAn[c.chon]}
                        </span>
                      </>
                    )}
                    {!ok && c.chon < 0 && " · Hết giờ"}
                  </div>
                  {!ok && c.giai && (
                    <p className="mt-1 pl-7 text-xs italic text-slate-500">
                      {c.giai}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    );
  }

  const c = cau[i];
  const tiLe = conLai / (giay * 1000);
  const s = Math.ceil(conLai / 1000);
  return (
    <div className="rounded-3xl bg-white p-4 text-navy-900">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">
          Câu {i + 1}/{cau.length}
        </span>
        <span
          className={`nn-so text-xl font-black ${s <= 5 ? "text-do-600" : "text-navy-800"}`}
        >
          {s}s
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${s <= 5 ? "bg-do-500" : "bg-navy-600"}`}
          style={{ width: `${tiLe * 100}%`, transition: "width 0.1s linear" }}
        />
      </div>
      <h2
        className="mt-4 text-lg font-semibold leading-snug"
        style={{ fontFamily: "var(--font-noi-dung)" }}
      >
        {c.hoi}
      </h2>
      <div className="mt-4 grid gap-2.5">
        {(c.phuongAn ?? []).map((pa, k) => (
          <button
            key={k}
            type="button"
            disabled={ban}
            onClick={() => traLoi(k)}
            className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left text-[15px] font-medium ring-1 ring-navy-100 hover:ring-2 hover:ring-navy-400 active:scale-[0.99] disabled:opacity-60"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy-600 text-sm font-bold text-white">
              {"ABCD"[k]}
            </span>
            <span className="flex-1">{pa}</span>
          </button>
        ))}
      </div>
      {loi && <p className="mt-3 text-sm text-do-600">{loi}</p>}
      {choGuiLai && (
        <button
          type="button"
          onClick={() => void nop()}
          disabled={ban}
          className="mt-3 flex min-h-12 w-full items-center justify-center rounded-full bg-son-600 font-bold text-white hover:bg-son-700 disabled:opacity-60"
        >
          {ban ? "Đang gửi…" : "Gửi lại kết quả"}
        </button>
      )}
    </div>
  );
}
