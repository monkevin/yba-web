"use client";

import { useActionState, useState } from "react";
import { phanHoiThuMoi, type KetQuaPhanHoi } from "../actions";
import { STK_QUY } from "../../stk-quy";

const VANG = "#e3b94a";

const PHIEN = [
  { ma: "TOA_DAM", ten: "Tọa đàm", gio: "14:30 – 16:30" },
  { ma: "CHUYEN_GIAO", ten: "Lễ chuyển giao", gio: "16:30 – 17:30" },
  { ma: "GALA", ten: "Gala Dinner", gio: "18:00 – 21:30" },
];

/**
 * Khối phản hồi trên thư mời riêng:
 *  - chọn PHIÊN sẽ tham dự (Tọa đàm / Lễ chuyển giao / Gala) hoặc xin vắng
 *  - số khách đi cùng
 *  - quan tâm TÀI TRỢ, hoặc ĐÓNG GÓP quỹ Nhịp Cầu Doanh Nhân (thay quà mừng)
 * Khách đổi ý được — gửi lại là cập nhật, BTC luôn thấy bản mới nhất.
 */
export default function PhanHoi({
  ma,
  trangThai,
  soKhachDiCung,
  phienDaChon,
  phienDuocMoi = null,
}: {
  ma: string;
  trangThai: string;
  soKhachDiCung: number;
  /** Các phiên đã chọn lần trước, ví dụ "TOA_DAM,GALA" */
  phienDaChon: string | null;
  /** SUẤT MỜI (khách tự đăng ký được duyệt): null = mời đủ 3 phiên; có
   *  giá trị thì phiên ngoài suất HIỆN nhưng KHOÁ không tick được */
  phienDuocMoi?: string | null;
}) {
  const [state, formAction, pending] = useActionState<KetQuaPhanHoi, FormData>(
    phanHoiThuMoi,
    {}
  );
  const [chon, setChon] = useState<"XAC_NHAN" | "VANG">(
    trangThai === "VANG" ? "VANG" : "XAC_NHAN"
  );
  // Hai ô đồng hành theo dõi RIÊNG từng ô, đọc checked ngay trong sự kiện.
  // Trước đây đọc e.currentTarget bên trong hàm cập nhật trễ — lúc React
  // chạy hàm đó currentTarget đã null → tích cả 2 ô là trang văng
  // (khách báo lỗi thật trên production 24/09).
  const [quanTam, setQuanTam] = useState(false);
  const [gopQuy, setGopQuy] = useState(false);
  const dongHanh = quanTam || gopQuy;
  // Suất mời giới hạn (khách tự đăng ký được duyệt) — null = đủ 3 phiên
  const suatMoi = phienDuocMoi ? phienDuocMoi.split(",").filter(Boolean) : null;
  const trongSuat = (ma: string) => !suatMoi || suatMoi.includes(ma);
  const macDinhPhien = (
    phienDaChon
      ? phienDaChon.split(",")
      : PHIEN.map((p) => p.ma) // lần đầu: đánh dấu sẵn cả ba phiên
  ).filter(trongSuat);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-amber-300/60 bg-white/10 p-6 text-center backdrop-blur">
        <span className="text-4xl">{chon === "XAC_NHAN" ? "🎉" : "🙏"}</span>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/90">
          {state.ok}
        </p>
        <p className="mt-2 text-xs text-white/55">
          Trang sẽ hiện mã thư mời và số bàn của anh/chị — tải lại trang để xem.
        </p>
      </div>
    );
  }

  const lopO =
    "w-full rounded-lg border border-white/30 bg-white/10 px-3.5 py-2.5 text-base text-white placeholder:text-white/40 focus:border-amber-400 focus:outline-none sm:text-sm";
  const lopNhan = "mb-1 block text-sm font-semibold text-white/85";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="ma" value={ma} />
      <input type="hidden" name="phanHoi" value={chon} />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setChon("XAC_NHAN")}
          className={`rounded-xl border-2 px-4 py-3.5 text-sm font-bold transition ${
            chon === "XAC_NHAN"
              ? "border-amber-400 bg-amber-400/20"
              : "border-white/25 bg-white/5 text-white/70 hover:bg-white/10"
          }`}
          style={chon === "XAC_NHAN" ? { color: VANG } : undefined}
        >
          ✓ Tôi sẽ tham dự
        </button>
        <button
          type="button"
          onClick={() => setChon("VANG")}
          className={`rounded-xl border-2 px-4 py-3.5 text-sm font-bold transition ${
            chon === "VANG"
              ? "border-white/70 bg-white/15 text-white"
              : "border-white/25 bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          Xin phép vắng
        </button>
      </div>

      {chon === "XAC_NHAN" && (
        <>
          {/* Chọn phiên tham dự */}
          <div>
            <p className={lopNhan}>Anh/chị tham dự phiên nào?</p>
            <div className="space-y-2">
              {PHIEN.map((p) => {
                const khoa = !trongSuat(p.ma);
                return (
                  <label
                    key={p.ma}
                    className={`flex min-h-11 items-center gap-3 rounded-xl border px-4 py-2.5 transition ${
                      khoa
                        ? "cursor-not-allowed border-white/10 bg-white/[0.03] opacity-55"
                        : "cursor-pointer border-white/20 bg-white/5 hover:bg-white/10 has-[:checked]:border-amber-400/70 has-[:checked]:bg-amber-400/10"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="phien"
                      value={p.ma}
                      defaultChecked={macDinhPhien.includes(p.ma)}
                      disabled={khoa}
                      className="h-4 w-4 accent-amber-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm font-semibold text-white">
                      {p.ten}
                      {khoa && (
                        <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60">
                          ngoài suất mời
                        </span>
                      )}
                    </span>
                    <span className="ml-auto text-xs" style={{ color: VANG }}>
                      {p.gio}
                    </span>
                  </label>
                );
              })}
            </div>
            {suatMoi && (
              <p className="mt-2 text-xs leading-relaxed text-white/55">
                Suất mời của anh/chị gồm các phiên đang mở ở trên. Muốn tham
                dự thêm phiên khác, anh/chị liên hệ Ban Tổ chức nhé.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="ph-so" className={lopNhan}>
              Số khách đi cùng (không kể anh/chị)
            </label>
            <input
              id="ph-so"
              name="soKhachDiCung"
              type="number"
              min={0}
              max={20}
              defaultValue={soKhachDiCung}
              className={lopO}
            />
          </div>
        </>
      )}

      {/* Đồng hành cùng chương trình — hiện cả khi xin vắng */}
      <div className="rounded-xl border border-amber-300/30 bg-amber-400/5 p-4">
        <p className="text-sm font-bold" style={{ color: VANG }}>
          Đồng hành cùng chương trình
        </p>
        <label className="mt-2.5 flex min-h-11 cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="quanTamTaiTro"
            value="1"
            checked={quanTam}
            onChange={(e) => setQuanTam(e.currentTarget.checked)}
            className="mt-1 h-4 w-4 accent-amber-500"
          />
          <span className="text-sm leading-relaxed text-white/85">
            Tôi quan tâm <b>tài trợ / đồng hành</b> — Ban Tổ chức liên hệ tôi
          </span>
        </label>
        <label className="mt-1 flex min-h-11 cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="dongGopQuy"
            value="1"
            checked={gopQuy}
            onChange={(e) => setGopQuy(e.currentTarget.checked)}
            className="mt-1 h-4 w-4 accent-amber-500"
          />
          <span className="text-sm leading-relaxed text-white/85">
            Tôi muốn <b>đóng góp quỹ thiện nguyện Nhịp Cầu Doanh Nhân</b> (thay
            cho quà mừng)
          </span>
        </label>
        {dongHanh && (
          <div className="mt-2 space-y-2">
            <input
              name="dongGopSoTien"
              inputMode="numeric"
              placeholder="Số tiền đóng góp quỹ dự kiến (VNĐ) — ví dụ 5.000.000"
              className={lopO}
            />
            <input
              name="dongHanhGhiChu"
              placeholder="Gói tài trợ / lời nhắn (không bắt buộc)"
              className={lopO}
            />
            <div className="rounded-lg border border-amber-300/40 bg-[#0a0f20]/50 p-3 text-xs leading-relaxed text-white/75">
              <p className="font-bold text-white/90">Chuyển khoản về:</p>
              <p className="mt-1">{STK_QUY.chuTaiKhoan}</p>
              <p>
                STK: <b className="text-base tracking-wide" style={{ color: VANG }}>{STK_QUY.soTaiKhoan}</b>
              </p>
              <p>{STK_QUY.nganHang}</p>
              <p className="mt-1 text-white/60">
                Nội dung: <b className="text-white/85">{STK_QUY.noiDung}</b>
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="ph-ghichu" className={lopNhan}>
          Ghi chú cho Ban Tổ chức
        </label>
        <textarea
          id="ph-ghichu"
          name="ghiChu"
          rows={2}
          className={lopO}
          placeholder="Ví dụ: ăn chay, đến trễ sau 15h, đi cùng phu nhân…"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-base font-bold text-[#1b274d] shadow-lg transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-60"
      >
        {pending
          ? "Đang gửi…"
          : chon === "XAC_NHAN"
            ? "Gửi xác nhận tham dự"
            : "Gửi lời xin phép vắng"}
      </button>
    </form>
  );
}
