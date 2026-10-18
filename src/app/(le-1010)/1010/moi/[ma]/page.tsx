import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MaQr from "@/components/MaQr";
import { docGiaoDien } from "@/lib/giao-dien";
import { anhKhach1010 } from "@/lib/khach-1010";
import { prisma } from "@/lib/prisma";
import NutCheckinThiep from "./NutCheckinThiep";
import PhanHoi from "./PhanHoi";
import { STK_QUY } from "../../stk-quy";

/**
 * THƯ MỜI RIÊNG của từng khách — đường link /1010/moi/<mã> do BTC gửi qua
 * Zalo hoặc in kèm thiệp. Mã là chuỗi ngẫu nhiên không đoán được nên trang
 * không cần đăng nhập; ai giữ link là chủ thư mời.
 *
 * Sau khi khách XÁC NHẬN: hiện MÃ QR check-in + số bàn (khi BTC đã xếp) —
 * tại cửa khách đưa mã cho lễ tân quét bằng camera ở
 * /quan-tri/khach-moi-1010/check-in (01/10/2026). Mã QR chỉ chứa mã thư mời
 * "CL-XXXXX" (kiểu chữ-số nên ra QR nhỏ nhất, ô to, dễ quét từ màn hình).
 * Đúng ngày 10.10 mã QR + nút "Tôi đã đến" nhảy lên ĐẦU trang để khách mở
 * ra là đưa quét được ngay, kể cả khách chưa bấm xác nhận.
 */

const VANG = "#e3b94a";

const TEN_PHIEN: Record<string, string> = {
  TOA_DAM: "Tọa đàm",
  CHUYEN_GIAO: "Lễ chuyển giao",
  GALA: "Gala",
};

const SLUG = "le-chuyen-giao-10-10-2026";

export const metadata: Metadata = {
  title: { absolute: "Thư mời · Lễ chuyển giao BĐH YBA Chợ Lớn 10.10.2026" },
  robots: { index: false, follow: false }, // thư riêng — không cho máy tìm kiếm
};

export default async function ThuMoiRieng({
  params,
  searchParams,
}: {
  params: Promise<{ ma: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { ma } = await params;
  const sp = await searchParams;
  const maChuan = decodeURIComponent(ma).trim().toUpperCase();
  const [khach, lich, gd, banBe] = await Promise.all([
    prisma.khachMoi1010.findUnique({ where: { ma: maChuan } }),
    prisma.lichHoatDong.findUnique({
      where: { slug: SLUG },
      select: { gioText: true, diaDiem: true },
    }),
    docGiaoDien(),
    // Chùm mặt "ai đã xác nhận" tạo háo hức — chỉ tên đã công khai trên
    // landing, không lộ gì thêm
    prisma.khachMoi1010.findMany({
      where: {
        trangThai: "XAC_NHAN",
        anKhoiDanhSach: false,
        nhom: { not: "BTC" },
        ma: { not: maChuan },
      },
      orderBy: { xacNhanLuc: "asc" },
      select: { id: true, ma: true, ten: true, soThu: true },
    }),
  ]);
  if (!khach || !lich) notFound();

  const xungHo = [khach.danhXung, khach.ten].filter(Boolean).join(" ");
  const daXacNhan = khach.trangThai === "XAC_NHAN";

  // Nút check-in ngay trên thiệp: chỉ hiện ĐÚNG NGÀY 10.10.2026 (giờ VN)
  // để trước đó thiệp gọn gàng; BTC xem thử trước bằng ?thu=1
  const homNay = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
  const laNgaySuKien = homNay === "2026-10-10" || sp.thu === "1";
  const gioCheckin = (d: Date | null) =>
    d
      ? d.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Ho_Chi_Minh",
        })
      : null;

  const veCheckin = (
    <div className="text-center">
      <p className="text-xs tracking-widest text-white/60 uppercase">
        Mã QR check-in
      </p>
      <div className="mx-auto mt-2 w-fit rounded-2xl bg-white p-2.5 shadow-lg">
        <MaQr noiDung={khach.ma} rong={184} nhan={`Mã QR check-in ${khach.ma}`} />
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-widest" style={{ color: VANG }}>
        {khach.ma}
      </p>
    </div>
  );

  const soXacNhan = banBe.length;
  const chumMat = banBe
    .map((b) => ({ ...b, anh: anhKhach1010(b.soThu, b.ma) }))
    .filter((b) => b.anh)
    .slice(0, 7);

  return (
    <main className="san-do luoi-ky-thuat relative min-h-screen overflow-hidden text-white">
      <div
        aria-hidden
        className="tho-sang pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-400/35 blur-3xl"
      />
      <div className="relative mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gd.logo} alt="YBA Chợ Lớn" className="mx-auto h-16 w-16 drop-shadow" />
        <p
          className="mt-4 text-center text-xs font-bold tracking-[0.3em] uppercase"
          style={{ color: VANG }}
        >
          Thư mời trân trọng
        </p>

        {/* Tên khách — trái tim của thư mời */}
        <h1 className="mt-4 text-center text-3xl font-extrabold sm:text-4xl" style={{ color: VANG }}>
          {xungHo}
        </h1>
        {(khach.chucDanh || khach.donVi) && (
          <p className="mt-1.5 text-center text-white/80">
            {[khach.chucDanh, khach.donVi].filter(Boolean).join(" · ")}
          </p>
        )}

        {laNgaySuKien && khach.trangThai !== "VANG" && (
          <div className="mt-6">
            <div className="mb-4 rounded-2xl border border-amber-300/50 bg-white/10 p-5 backdrop-blur">
              {veCheckin}
              <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-relaxed text-white/80">
                Đưa mã này cho lễ tân quét là vào cửa
                {khach.ban ? (
                  <>
                    {" "}
                    — bàn của {khach.danhXung || "anh/chị"}:{" "}
                    <b style={{ color: VANG }}>{khach.ban}</b>
                  </>
                ) : null}
                . Nên tăng sáng màn hình.
              </p>
            </div>
            <NutCheckinThiep
              ma={khach.ma}
              daChieu={gioCheckin(khach.checkinLuc)}
              daLe={gioCheckin(khach.checkinLeLuc)}
              daGala={gioCheckin(khach.checkinGalaLuc)}
              chayThu={sp.thu === "1"}
            />
          </div>
        )}

        <p className="mx-auto mt-6 max-w-lg text-center leading-relaxed text-white/85">
          Ban Tổ chức trân trọng kính mời {khach.danhXung || "anh/chị"} tham dự
        </p>
        <h2 className="chu-lua mt-2 text-center text-xl font-extrabold sm:text-2xl">
          Lễ chuyển giao &amp; ra mắt Ban Điều hành YBA Chợ Lớn
          <br />
          Nhiệm kỳ I (2026 – 2029)
        </h2>
        <p className="mt-2 text-center text-xs tracking-[0.2em] text-white/65 uppercase">
          Kỷ nguyên hội tụ · Huynh đệ vươn tầm
        </p>

        <div className="mt-6 space-y-2 rounded-2xl border border-amber-300/40 bg-white/10 p-5 text-center backdrop-blur">
          <p className="font-bold" style={{ color: VANG }}>
            {lich.gioText}
          </p>
          <p className="text-sm text-white/90">{lich.diaDiem}</p>
          <p className="text-xs text-white/60">
            Tọa đàm 14:30 · Lễ chuyển giao 16:30 · Gala Dinner 18:00
          </p>
        </div>

        <p className="mx-auto mt-3 max-w-lg text-center text-xs leading-relaxed text-white/55">
          Chương trình <b className="text-white/80">không thu phí khách mời</b>{" "}
          — mọi đóng góp (nếu có) xin gửi về tài khoản của Hội Doanh nhân trẻ
          TP.HCM cho chuỗi dự án thiện nguyện Nhịp Cầu Doanh Nhân.
        </p>

        {/* Thiệp mời thiết kế riêng (JPG do BTC dựng) + nút tải về máy */}
        {khach.soThu && (
          <div className="mt-6">
            <div className="quet-sang overflow-hidden rounded-2xl ring-2 ring-amber-400/70 shadow-[0_0_50px_rgba(227,185,74,0.25)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/khach-moi-1010/thiep/${khach.ma}`}
                alt={`Thiệp mời của ${xungHo}`}
                className="w-full"
              />
            </div>
            <div className="mt-3 text-center">
              <a
                href={`/api/khach-moi-1010/thiep/${khach.ma}?tai=1`}
                className="inline-block rounded-full border border-amber-400/70 px-6 py-2.5 text-sm font-bold transition hover:bg-amber-400/10"
                style={{ color: VANG }}
              >
                ⬇ Tải thiệp mời về máy
              </a>
            </div>
          </div>
        )}

        {/* Trạng thái + phản hồi */}
        <div className="mt-7">
          {daXacNhan && (
            <div className="mb-4 rounded-2xl border-2 border-amber-400/80 bg-amber-400/10 p-5 text-center">
              <p className="text-sm font-bold text-white/90">
                ✅ {khach.danhXung || "Anh/chị"} đã xác nhận tham dự
                {khach.soKhachDiCung > 0 ? ` · ${khach.soKhachDiCung} khách đi cùng` : ""}
              </p>
              {khach.phien && (
                <p className="mt-1 text-xs text-white/70">
                  Phiên:{" "}
                  {khach.phien
                    .split(",")
                    .map((p) => TEN_PHIEN[p] ?? p)
                    .join(" · ")}
                </p>
              )}
              {(khach.quanTamTaiTro || khach.dongGopQuy) && (
                <p className="mt-1 text-xs" style={{ color: VANG }}>
                  {[
                    khach.quanTamTaiTro && "Quan tâm tài trợ — BTC sẽ liên hệ",
                    khach.dongGopQuy &&
                      "Đóng góp quỹ Nhịp Cầu Doanh Nhân" +
                        (khach.dongGopSoTien
                          ? ": " + khach.dongGopSoTien.toLocaleString("vi-VN") + "đ"
                          : ""),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {khach.dongGopQuy && (
                <p className="mt-2 text-xs leading-relaxed text-white/65">
                  Chuyển khoản: {STK_QUY.chuTaiKhoan} · STK{" "}
                  <b className="text-white/90">{STK_QUY.soTaiKhoan}</b> ·{" "}
                  {STK_QUY.nganHang} · Nội dung: {STK_QUY.noiDung}
                </p>
              )}
              {laNgaySuKien ? (
                <>
                  <p className="mt-3 text-xs tracking-widest text-white/60 uppercase">
                    Mã thư mời
                  </p>
                  <p className="text-3xl font-extrabold tracking-widest" style={{ color: VANG }}>
                    {khach.ma}
                  </p>
                </>
              ) : (
                <div className="mt-4">{veCheckin}</div>
              )}
              {khach.ban ? (
                <p className="mt-2 text-lg font-bold text-white">
                  Bàn của {khach.danhXung || "anh/chị"}:{" "}
                  <span style={{ color: VANG }}>{khach.ban}</span>
                </p>
              ) : (
                <p className="mt-2 text-xs text-white/60">
                  Số bàn sẽ hiện tại đây khi Ban Tổ chức xếp chỗ.
                </p>
              )}
              <p className="mt-3 text-xs leading-relaxed text-white/60">
                Ngày 10.10, {khach.danhXung || "anh/chị"} mở lại thư mời này và
                đưa mã QR cho lễ tân quét — vào cửa trong vài giây, không cần
                đọc tên.
              </p>
            </div>
          )}
          {laNgaySuKien && khach.trangThai === "VANG" && (
            <NutCheckinThiep
              ma={khach.ma}
              daChieu={gioCheckin(khach.checkinLuc)}
              daLe={gioCheckin(khach.checkinLeLuc)}
              daGala={gioCheckin(khach.checkinGalaLuc)}
              chayThu={sp.thu === "1"}
            />
          )}
          {soXacNhan > 0 && (
            <a
              href="/1010#khach-moi"
              className="mb-5 flex items-center justify-center gap-3 rounded-2xl border border-amber-300/40 bg-white/5 px-4 py-3 transition hover:bg-white/10"
            >
              {chumMat.length > 0 && (
                <span className="flex -space-x-2.5">
                  {chumMat.map((b) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={b.id}
                      src={b.anh!}
                      alt={b.ten}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-[#1b274d]"
                    />
                  ))}
                </span>
              )}
              <span className="text-sm leading-snug text-white/85">
                <b style={{ color: VANG }}>{soXacNhan} anh/chị</b> đã xác nhận
                có mặt — xem danh sách →
              </span>
            </a>
          )}
          <PhanHoi
            ma={khach.ma}
            trangThai={khach.trangThai}
            soKhachDiCung={khach.soKhachDiCung}
            phienDaChon={khach.phien}
            phienDuocMoi={khach.phienDuocMoi}
          />
        </div>

        <div className="mt-8 text-center text-sm text-white/70">
          <Link href="/1010" className="font-semibold underline underline-offset-2" style={{ color: VANG }}>
            Xem chương trình chi tiết &amp; proposal →
          </Link>
          <p className="mt-3 text-xs text-white/55">
            Cần hỗ trợ? Hotline{" "}
            <a href={`tel:${gd.hotline.replace(/[^\d+]/g, "")}`} className="font-semibold text-white/85">
              {gd.hotline}
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
