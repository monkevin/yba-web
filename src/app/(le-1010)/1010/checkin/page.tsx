import type { Metadata } from "next";
import { soVoiNgaySuKien } from "@/lib/checkin-1010";
import { docGiaoDien } from "@/lib/giao-dien";
import TuCheckin from "./TuCheckin";

/**
 * TRANG TỰ CHECK-IN — đích của HAI mã QR BTC in ngày 10/10 (Chủ tịch chốt
 * 07/10: khách check-in HAI lần, hai mã phải nhìn là biết khác nhau):
 *  QR 1  → /1010/checkin?phien=CHIEU (tai-lieu/qr-checkin-dau-gio.png)
 *          "Check-in sự kiện Lễ Chuyển Giao & Ra Mắt Ban Điều Hành YBA Chợ
 *          Lớn Nhiệm Kỳ 2026–2029": vào Phiên 1–2, máy ghi Tọa đàm/Lễ theo
 *          giờ, KHÔNG xếp bàn;
 *  QR 2  → /1010/checkin?phien=GALA  (tai-lieu/qr-checkin-gala.png)
 *          "Check-in Gala Vinh danh & Tri ân": tất cả khách check-in lại để
 *          vào tiệc, màn kết quả hiện to SỐ BÀN DỰ KIẾN (mở từ 17:00, xem
 *          MO_GALA_PHUT ở moi/actions.ts).
 * Không có ?phien thì máy tự chọn phiên theo giờ như trước
 * (tai-lieu/qr-checkin-1010.png).
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Check-in · Lễ chuyển giao YBA Chợ Lớn 10.10.2026" },
  robots: { index: false, follow: false },
};

type Khoa = "CHIEU" | "GALA";

/** Nhãn nhỏ phía trên tiêu đề */
const NHAN_KHOA: Record<Khoa, string> = {
  CHIEU: "QR 1 · CHECK-IN SỰ KIỆN",
  GALA: "QR 2 · CHECK-IN GALA — NHẬN SỐ BÀN",
};
/** Tiêu đề lớn (hai dòng: dòng đầu trắng, dòng sau chữ lửa) */
const TIEU_DE: Record<Khoa, [string, string]> = {
  CHIEU: [
    "Check-in sự kiện",
    "Lễ Chuyển Giao & Ra Mắt Ban Điều Hành YBA Chợ Lớn Nhiệm Kỳ 2026–2029",
  ],
  GALA: ["Check-in Gala", "Vinh danh & Tri ân sự kiện"],
};
const HUONG_DAN: Record<Khoa, string> = {
  CHIEU:
    "Anh/chị gõ họ tên để check-in vào dự Phiên 1 & 2 (Tọa đàm · Lễ chuyển giao). Hai phiên này không xếp bàn.",
  GALA:
    "Vui lòng check-in để nhận SỐ BÀN dự kiến — anh/chị gõ họ tên bên dưới. " +
    "Trong trường hợp bàn của anh/chị đã full, vui lòng chọn vị trí phù hợp hoặc liên hệ BTC.",
};
/** Tên rút gọn trên nút bấm */
const NUT_KHOA: Record<Khoa, string> = {
  CHIEU: "Phiên 1 & 2",
  GALA: "Gala",
};

export default async function CheckinKhach({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const gd = await docGiaoDien();
  const sp = await searchParams;
  // ?thu=1 — BTC chạy thử luồng check-in, CHỈ có tác dụng trước ngày sự kiện
  // (máy chủ cũng tự bỏ qua từ ngày 10.10; xét ở đây để dải "CHẠY THỬ"
  // không hiện sai vào ngày lễ)
  const chayThu = sp.thu === "1" && soVoiNgaySuKien() === "TRUOC";
  // ?gio=15:00 — giả lập giờ khi chạy thử để thử từng phiên (xem docGio ở
  // moi/actions.ts); chỉ nhận khi đang chạy thử
  const gioGia = chayThu
    ? (String(sp.gio ?? "").match(/^\d{1,2}:\d{2}$/)?.[0] ?? undefined)
    : undefined;
  // ?phien=CHIEU | GALA — mã QR riêng từng lần check-in (nhận thêm vài cách
  // gõ cho dễ: 1-2, dau-gio, 3, gala…)
  const phienTho = String(sp.phien ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const khoa: Khoa | null =
    phienTho === "GALA" || phienTho === "3"
      ? "GALA"
      : phienTho === "CHIEU" ||
          phienTho === "DAUGIO" ||
          phienTho === "12" ||
          phienTho === "1" ||
          phienTho === "TOADAM" ||
          phienTho === "LE"
        ? "CHIEU"
        : null;

  return (
    <main className="san-do luoi-ky-thuat relative min-h-screen overflow-hidden text-white">
      <div className="relative mx-auto w-full max-w-md px-4 py-10 sm:px-6">
        {chayThu && (
          <p className="mb-4 rounded-xl border border-dashed border-sky-300/70 bg-sky-400/15 px-4 py-2 text-center text-xs font-bold text-sky-100">
            🧪 CHẠY THỬ{gioGia ? ` — giả lập đang là ${gioGia}` : ""} — lượt
            check-in này chỉ là thử, Ban Tổ chức sẽ xoá trước ngày lễ (mã thử
            chỉ dùng được TRƯỚC ngày 10.10).
          </p>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gd.logo} alt="YBA Chợ Lớn" className="mx-auto h-14 w-14 drop-shadow" />
        {khoa ? (
          <>
            <p className="mx-auto mt-4 w-fit rounded-full border border-amber-300/70 bg-amber-400/20 px-4 py-1.5 text-center text-xs font-extrabold tracking-wider text-amber-200">
              🎫 {NHAN_KHOA[khoa]}
            </p>
            <h1 className="mt-3 text-center text-3xl leading-[1.2] font-extrabold">
              {TIEU_DE[khoa][0]}
              <span
                className={`chu-lua mt-1 block ${
                  khoa === "CHIEU" ? "text-xl leading-snug" : "text-2xl"
                }`}
              >
                {TIEU_DE[khoa][1]}
              </span>
            </h1>
            <p className="mt-3 text-center text-sm text-white/75">{HUONG_DAN[khoa]}</p>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-center text-2xl font-extrabold">
              Chào mừng đến với
              <span className="chu-lua block">Lễ chuyển giao 10.10.2026</span>
            </h1>
            <p className="mt-2 text-center text-sm text-white/70">
              Anh/chị gõ họ tên để check-in — hệ thống sẽ báo số bàn ngay.
            </p>
          </>
        )}
        <div className="mt-6">
          <TuCheckin
            chayThu={chayThu}
            gioGia={gioGia}
            phienKhoa={khoa ?? undefined}
            tenPhienKhoa={khoa ? NUT_KHOA[khoa] : undefined}
          />
        </div>
      </div>
    </main>
  );
}
