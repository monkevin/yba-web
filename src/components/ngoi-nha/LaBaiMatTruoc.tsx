"use client";

/**
 * Mặt trước lá bài đã lật (dùng trong bảng chọn lá của `LaBaiMoiNgay`). Mỗi
 * loại một kiểu: danh ngôn trang trọng chữ có chân, lời nhắn như lá thư ngà,
 * lá điểm vàng có số chạy, lá quà nền đỏ son.
 */
import { useEffect, useState } from "react";
import {
  BIEU_TUONG_LA,
  ngayLaDep,
  TEN_LOAI_LA,
  type KetQuaLaBai,
} from "@/lib/ngoi-nha/la-bai-luat";
import BieuTuong from "./BieuTuong";

const so = (n: number) => Math.round(n).toLocaleString("vi-VN");

/** Số chạy từ 0 lên (chỉ khi vừa lật; xem lại thì hiện luôn số cuối). */
function DemSo({ den, chay }: { den: number; chay: boolean }) {
  const [hien, setHien] = useState(chay ? 0 : den);
  useEffect(() => {
    if (!chay) return;
    let raf = 0;
    const batDau = performance.now();
    const buoc = (t: number) => {
      const p = Math.min(1, (t - batDau) / 900);
      setHien(Math.round(den * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(buoc);
    };
    raf = requestAnimationFrame(buoc);
    // Tab ẩn thì requestAnimationFrame đứng — chốt số cuối bằng hẹn giờ
    const chot = setTimeout(() => setHien(den), 1100);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(chot);
    };
  }, [den, chay]);
  return <>{so(hien)}</>;
}

function NhanLoai({ kq, className }: { kq: KetQuaLaBai; className: string }) {
  return (
    <div
      className={`flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.18em] ${className}`}
    >
      <span className="flex items-center gap-1.5">
        <BieuTuong ten={BIEU_TUONG_LA[kq.loai]} className="h-4 w-4" />
        {TEN_LOAI_LA[kq.loai]}
      </span>
      <span className="font-semibold tracking-normal opacity-70">
        {ngayLaDep(kq.ngay)}
      </span>
    </div>
  );
}

export default function LaBaiMatTruoc({
  kq,
  vuaLat,
  className = "",
}: {
  kq: KetQuaLaBai;
  /** Vừa lật trong phiên này → số điểm chạy lên */
  vuaLat: boolean;
  className?: string;
}) {
  if (kq.loai === "DANH_NGON") {
    const d = kq.danhNgon;
    return (
      <div
        className={`rounded-3xl bg-white p-5 text-navy-900 shadow-2xl ring-4 ring-vang-400 ${className}`}
      >
        <NhanLoai kq={kq} className="text-son-700" />
        {d ? (
          <>
            <blockquote className="chu-tieu-de mt-4 text-[1.35rem] leading-[1.3] text-navy-900">
              “{d.noiDung}”
            </blockquote>
            <div className="mt-3 text-[15px] font-bold text-son-700">
              {d.tacGia}
            </div>
            {d.moTaTacGia && (
              <div className="text-xs text-slate-500">{d.moTaTacGia}</div>
            )}
            {d.yNghia && (
              <div className="mt-4 rounded-2xl bg-nga-50 p-3 ring-1 ring-nga-200">
                <div className="text-[11px] font-bold uppercase tracking-wide text-vang-600">
                  Ý nghĩa cho doanh nhân
                </div>
                <p className="mt-1 text-[15px] leading-relaxed text-navy-800">
                  {d.yNghia}
                </p>
              </div>
            )}
            {d.nguyenVan && (
              <p className="mt-3 text-xs italic leading-snug text-slate-500">
                Nguyên văn: {d.nguyenVan}
              </p>
            )}
            {d.nguon && (
              <p className="mt-1 text-[11px] leading-snug text-slate-400">
                Nguồn: {d.nguon}
              </p>
            )}
          </>
        ) : (
          <p className="mt-4 text-[15px] text-slate-600">
            Câu danh ngôn của lá này đã được Ban Điều hành gỡ khỏi bộ bài.
          </p>
        )}
      </div>
    );
  }

  if (kq.loai === "LOI_NHAN") {
    const l = kq.loiNhan;
    return (
      <div
        className={`rounded-3xl bg-nga-50 p-5 text-navy-900 shadow-2xl ring-4 ring-vang-400 ${className}`}
      >
        <NhanLoai kq={kq} className="text-son-700" />
        {l ? (
          <>
            <p className="mt-4 text-[17px] leading-relaxed">{l.noiDung}</p>
            {l.goiY && (
              <div className="mt-4 flex gap-2.5 rounded-2xl bg-white p-3 ring-1 ring-nga-200">
                <BieuTuong
                  ten="dung"
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                />
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                    Việc nhỏ cho hôm nay
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-navy-800">
                    {l.goiY}
                  </p>
                </div>
              </div>
            )}
            <div className="mt-5 text-right">
              <div className="text-xs text-slate-500">Thân gửi hội viên,</div>
              <div className="chu-tieu-de text-lg leading-[1.25] text-son-700">
                {l.nguoiKy}
              </div>
            </div>
          </>
        ) : (
          <p className="mt-4 text-[15px] text-slate-600">
            Lời nhắn của lá này đã được Ban Điều hành gỡ khỏi bộ bài.
          </p>
        )}
      </div>
    );
  }

  if (kq.loai === "DIEM")
    return (
      <div
        className={`flex flex-col rounded-3xl bg-gradient-to-br from-vang-400 to-vang-500 p-5 text-center text-navy-900 shadow-2xl ring-4 ring-white/70 ${className}`}
      >
        <NhanLoai kq={kq} className="text-navy-900" />
        <div className="flex flex-1 flex-col items-center justify-center py-4">
          <BieuTuong
            ten="sao"
            dac
            className="h-14 w-14 text-white drop-shadow"
          />
          <div className="nn-so mt-3 text-6xl font-black leading-none">
            +<DemSo den={kq.diem} chay={vuaLat} />
          </div>
          <div className="mt-2 text-sm font-bold uppercase tracking-wide">
            Điểm Vươn tầm
          </div>
          <p className="mt-3 max-w-[16rem] text-sm text-navy-900/80">
            Cộng thẳng vào bảng xếp hạng mùa giải — mai quay lại lật tiếp nhé.
          </p>
        </div>
      </div>
    );

  const q = kq.qua;
  return (
    <div
      className={`flex flex-col rounded-3xl bg-gradient-to-br from-son-600 to-son-900 p-5 text-center text-white shadow-2xl ring-4 ring-vang-400 ${className}`}
    >
      <NhanLoai kq={kq} className="text-vang-400" />
      <div className="flex flex-1 flex-col items-center justify-center py-3">
        <BieuTuong ten="qua" className="h-16 w-16 text-vang-400" />
        <div className="chu-tieu-de mt-3 text-2xl leading-[1.25]">
          {q?.ten ?? "Quà tặng đặc biệt"}
        </div>
        {q?.nhaDongHanh && (
          <div className="mt-1 text-sm text-white/85">
            Nhà đồng hành: <b className="text-white">{q.nhaDongHanh}</b>
          </div>
        )}
        {q?.moTa && (
          <p className="mt-2 text-sm leading-relaxed text-white/80">{q.moTa}</p>
        )}
        <p className="mt-4 rounded-2xl bg-white/10 px-3 py-2.5 text-sm leading-relaxed">
          {q?.daTrao
            ? "Anh/chị đã nhận phần quà này. Cảm ơn nhà đồng hành!"
            : "Ban Điều hành sẽ liên hệ — nhận tại Văn phòng Chi hội."}
        </p>
      </div>
    </div>
  );
}

/** Chip điểm và chuỗi ngày + ghi chú chơi thử / mùa đã kết thúc. */
export function LaBaiGhiChu({ kq }: { kq: KetQuaLaBai }) {
  const coDiem = kq.diem + kq.diemChuoi > 0;
  return (
    <div className="space-y-2 text-center">
      {coDiem && (
        <div className="flex flex-wrap justify-center gap-2">
          {/* Lá điểm đã hiện số to trên mặt lá */}
          {kq.diem > 0 && kq.loai !== "DIEM" && (
            <span className="nn-so rounded-full bg-vang-400 px-3 py-1 text-sm font-bold text-navy-900">
              +{so(kq.diem)} điểm
            </span>
          )}
          {kq.diemChuoi > 0 && (
            <span className="nn-so inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-vang-400 ring-1 ring-vang-400/40">
              <BieuTuong ten="lua" dac className="h-4 w-4" />
              Chuỗi {kq.chuoiNgay} ngày +{so(kq.diemChuoi)}
            </span>
          )}
        </div>
      )}
      {coDiem && !kq.ghiNhan && (
        <p className="text-xs text-white/65">
          Mùa giải đã kết thúc — lá này không cộng thêm điểm.
        </p>
      )}
      {coDiem && kq.ghiNhan && kq.choiThu && (
        <p className="text-xs text-amber-300">
          Chơi thử — điểm tính lại khi mùa giải bắt đầu.
        </p>
      )}
    </div>
  );
}
