import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import HienDan from "@/components/web/HienDan";
import ThuVienAnh from "@/components/web/ThuVienAnh";
import { docGiaoDien } from "@/lib/giao-dien";
import { anhKhach1010 } from "@/lib/khach-1010";
import { prisma } from "@/lib/prisma";
import { normalizeSearch } from "@/lib/search";
import { docNhaTaiTro1010 } from "@/lib/tai-tro-1010";
import DangKyTaiTro from "./DangKyTaiTro";
import FormThamDu from "./FormThamDu";
import KhachThamDu, { type KhachHien } from "./KhachThamDu";
import NhaTaiTroCamOn from "./NhaTaiTroCamOn";
import { STK_QUY } from "./stk-quy";
import TimTen from "./TimTen";

/**
 * LANDING PAGE — Lễ chuyển giao & ra mắt Ban Điều hành YBA Chợ Lớn
 * nhiệm kỳ I (2026–2029), Thứ Bảy 10.10.2026 tại Capella Gallery Hall.
 * Chạy ở ybacholon.vn/1010 và 1010.ybacholon.vn (rewrite trong proxy.ts).
 *
 * BA MẪU — Chủ nhiệm chốt 22/09/2026, đừng gộp lại:
 *  1. XÁC NHẬN tham dự  — khách ĐÃ nhận thư mời → thư mời riêng trên web
 *     /1010/moi/<mã> (quản ở /quan-tri/khach-moi-1010: xác nhận, xếp bàn,
 *     check-in). Google Form (FORM_BTC) chỉ còn là lối dự phòng.
 *  2. ĐĂNG KÝ tham dự   — người CHƯA nhận thư mời → form ngay trên trang,
 *     vào /quan-tri/lich-hoat-dong ở trạng thái chờ để BTC xét và liên hệ.
 *  3. ĐĂNG KÝ tài trợ   — các gói hiện trên landing, điền qua FORM_BTC
 *     (mục tài trợ nằm trong biểu mẫu đó).
 *
 * Ba dấu ấn hiện bằng ba trang proposal (ANH_BA_PHIEN) — proposal đổi
 * bản thì xuất lại ảnh trang 9/10/11 và kiểm giờ trong PhanHoi.tsx.
 * Thời gian/địa điểm ở màn chào đọc từ bản ghi lịch `le-chuyen-giao-10-10-2026`
 * (sửa ở /quan-tri/lich-hoat-dong). Ảnh minh họa ba phiên là ảnh sự kiện
 * THẬT của Chi hội trong public/su-kien — đừng thay bằng ảnh stock.
 */

// Trang đọc số liệu sống (đăng ký, quỹ NCDN) — KHÔNG được để Next đóng
// băng thành trang tĩnh lúc build: từng bị (23/09) khiến cam kết quỹ ghi
// vào CSDL rồi mà landing vẫn hiện số 0 của lúc dựng bản.
export const dynamic = "force-dynamic";

const SLUG = "le-chuyen-giao-10-10-2026";
/** Biểu mẫu Google của BTC: xác nhận tham dự (đã có thư mời) + mục tài trợ */
const FORM_BTC = "https://forms.gle/5ro5CjeyC2QruyzW7";
const PDF = "/su-kien-1010/proposal-le-chuyen-giao-10-10-2026.pdf";
const SO_TRANG_PROPOSAL = 18;
const KV = "/su-kien-1010/trang-01.webp";

const VANG = "#e3b94a";

/** Ba trang proposal của đúng ba phiên — hiện RÕ cho mọi người thấy ba
 *  dấu ấn (Chủ nhiệm chốt 22/09): diễn giả tọa đàm, nội dung lễ chuyển
 *  giao, timeline gala. Bấm là phóng to bằng ThuVienAnh. */
const ANH_BA_PHIEN = [
  "/su-kien-1010/trang-09.webp", // Tọa đàm 14:30 – 16:30
  "/su-kien-1010/trang-10.webp", // Lễ chuyển giao 16:30 – 17:30
  "/su-kien-1010/trang-11.webp", // Gala Dinner 18:00 – 21:30
];

/* Các gói tài trợ nằm trong DangKyTaiTro.tsx — bấm gói là đăng ký ngay. */

export const metadata: Metadata = {
  title: { absolute: "Lễ chuyển giao Ban Điều hành YBA Chợ Lớn · 10.10.2026" },
  description:
    "Thư mời Lễ chuyển giao & ra mắt Ban Điều hành YBA Chợ Lớn nhiệm kỳ I " +
    "(2026–2029) — Tọa đàm · Lễ chuyển giao · Gala Dinner. Thứ Bảy " +
    "10.10.2026, 14:00–21:30, Capella Gallery Hall, TP.HCM.",
  openGraph: {
    title: "Lễ chuyển giao Ban Điều hành YBA Chợ Lớn · 10.10.2026",
    description:
      "Kỷ nguyên hội tụ – Huynh đệ vươn tầm. Xác nhận tham dự, đăng ký tham dự và đồng hành.",
    images: [{ url: KV, width: 1600, height: 900 }],
  },
};

export default async function Landing1010() {
  const [lich, gd] = await Promise.all([
    prisma.lichHoatDong.findUnique({
      where: { slug: SLUG },
      select: {
        id: true,
        gioText: true,
        diaDiem: true,
        published: true,
        hanDangKy: true,
      },
    }),
    docGiaoDien(),
  ]);
  if (!lich || !lich.published) notFound();

  // Quỹ Nhịp Cầu Doanh Nhân: chỉ tính & hiện những cam kết ADMIN ĐÃ DUYỆT
  // (quyCongKhai) — duyệt ở /quan-tri/khach-moi-1010, cột "Bảng vàng"
  const [quy, bangVang] = await Promise.all([
    prisma.khachMoi1010.aggregate({
      _sum: { dongGopSoTien: true },
      _count: { _all: true },
      where: { dongGopQuy: true, quyCongKhai: true },
    }),
    prisma.khachMoi1010.findMany({
      where: { dongGopQuy: true, quyCongKhai: true },
      orderBy: [{ dongGopSoTien: "desc" }, { xacNhanLuc: "asc" }],
      select: { id: true, ten: true, danhXung: true, donVi: true, dongGopSoTien: true },
    }),
  ]);
  const quyTien = quy._sum.dongGopSoTien ?? 0;
  const quyNguoi = quy._count._all;

  // Danh sách công khai tạo háo hức — khách ĐÃ XÁC NHẬN chia BA nhóm theo
  // vai vế (Chủ nhiệm chốt 24/09; khách NTT là khách mời phụ nên nằm chung
  // khách mời, KHÔNG có khối tài trợ riêng). Ê-kíp BTC không hiện.
  // LƯU Ý: cột nhom chứa CẢ mã (BTC/HOI_VIEN… thêm tay) LẪN chữ gốc Excel
  // ("BTT - BCH", "YBA CHỢ LỚN", "KHÁCH VIP CỦA ĐỨC ANH"…).
  const khachTho = await prisma.khachMoi1010.findMany({
    where: {
      trangThai: "XAC_NHAN",
      anKhoiDanhSach: false,
      nhom: { not: "BTC" },
    },
    select: {
      id: true, ma: true, ten: true, danhXung: true, chucDanh: true,
      donVi: true, phien: true, soThu: true, nhom: true,
    },
  });
  // Xếp theo số thư (thứ tự lễ tân trong Excel); khách thêm tay xuống cuối
  const soThuSo = (s: string | null) =>
    s && /^\d+$/.test(s) ? Number(s) : Number.MAX_SAFE_INTEGER;
  khachTho.sort(
    (a, b) =>
      soThuSo(a.soThu) - soThuSo(b.soThu) ||
      a.ten.localeCompare(b.ten, "vi")
  );
  const raHien = (k: (typeof khachTho)[number], noiBat = false): KhachHien => ({
    id: k.id, ten: k.ten, danhXung: k.danhXung, chucDanh: k.chucDanh,
    donVi: k.donVi, phien: k.phien, anh: anhKhach1010(k.soThu, k.ma), noiBat,
  });
  const g1: KhachHien[] = [], g2: KhachHien[] = [], g3: KhachHien[] = [];
  for (const k of khachTho) {
    const n = normalizeSearch(k.nhom);
    if (k.nhom === "LANH_DAO" || n.includes("btt")) g1.push(raHien(k));
    else if (
      k.nhom === "HOI_VIEN" ||
      n.includes("yba") ||
      n.includes("van phong") ||
      n.includes("chi hoi khac")
    )
      g2.push(raHien(k));
    else g3.push(raHien(k)); // khách VIP/nhà nước/NTT/khác — không nêu tên nhóm nội bộ
  }
  // Bốn vị xếp đầu theo thứ tự Chủ nhiệm chốt 24/09, kéo lên ĐẦU nhóm ①;
  // riêng anh Phan Tấn Đạt (Chủ tịch Hội) có vòng vàng bao quanh
  const UU_TIEN = [
    "phan tan dat", "nguyen tri quang", "vo dai khoi", "dang vien khang",
  ];
  const dauBang: KhachHien[] = [];
  for (const tenUT of UU_TIEN) {
    for (const nhom of [g1, g2, g3]) {
      const i = nhom.findIndex((k) => normalizeSearch(k.ten) === tenUT);
      if (i >= 0) {
        dauBang.push({ ...nhom[i], noiBat: tenUT === UU_TIEN[0] });
        nhom.splice(i, 1);
        break;
      }
    }
  }
  g1.unshift(...dauBang);
  const nhomHien = [
    {
      tieuDe: "Ban Thường trực & Ban Chấp hành Hội Doanh nhân trẻ TP.HCM",
      khach: g1,
    },
    {
      tieuDe: "Hội Doanh nhân trẻ TP.HCM",
      ghiChu: "YBA Chợ Lớn · Văn phòng Hội · các Chi hội",
      khach: g2,
    },
    { tieuDe: "Khách mời của YBA Chợ Lớn", khach: g3 },
  ];
  const tongXacNhanHien = g1.length + g2.length + g3.length;

  const nhaTaiTro = await docNhaTaiTro1010();
  const hetHan = !!lich.hanDangKy && lich.hanDangKy < new Date();
  const trangProposal = Array.from(
    { length: SO_TRANG_PROPOSAL },
    (_, i) => `/su-kien-1010/trang-${String(i + 1).padStart(2, "0")}.webp`
  );

  return (
    <main className="min-h-screen bg-[#0a0f20] text-white">
      {/* ── Màn chào ─────────────────────────────────────────────── */}
      <section className="san-do luoi-ky-thuat relative overflow-hidden">
        <div
          aria-hidden
          className="tho-sang pointer-events-none absolute -top-24 left-1/3 h-96 w-96 rounded-full bg-amber-400/40 blur-3xl"
        />
        <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-12 sm:px-6 sm:pt-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
            {/* Cột chữ */}
            <div className="text-center lg:text-left">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gd.logo}
                alt="YBA Chợ Lớn"
                className="mx-auto h-16 w-16 drop-shadow-lg lg:mx-0"
              />
              <p
                className="mt-4 text-xs font-bold tracking-[0.28em] uppercase"
                style={{ color: VANG }}
              >
                Thư mời · Chi hội Doanh nhân trẻ Chợ Lớn
              </p>
              <h1 className="chu-lua mt-3 text-3xl leading-tight font-extrabold sm:text-5xl">
                Lễ chuyển giao &amp; ra mắt Ban Điều hành YBA Chợ Lớn
              </h1>
              <p className="mt-3 text-lg font-semibold sm:text-xl" style={{ color: VANG }}>
                Nhiệm kỳ I (2026 – 2029)
              </p>
              <p className="mt-2 text-sm tracking-[0.18em] text-white/70 uppercase">
                Kỷ nguyên hội tụ · Huynh đệ vươn tầm
              </p>

              {/* Thời gian – địa điểm (đọc từ bản ghi lịch) */}
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <div className="rounded-2xl border border-amber-300/40 bg-white/10 px-5 py-3.5 backdrop-blur">
                  <p className="text-xs font-semibold text-white/60 uppercase">Thời gian</p>
                  <p className="mt-0.5 font-bold" style={{ color: VANG }}>
                    {lich.gioText}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-300/40 bg-white/10 px-5 py-3.5 backdrop-blur">
                  <p className="text-xs font-semibold text-white/60 uppercase">Địa điểm</p>
                  <p className="mt-0.5 font-bold text-white">{lich.diaDiem}</p>
                </div>
              </div>
            </div>

            {/* Cột KV — trang bìa proposal làm hình chủ đạo */}
            <div className="quet-sang relative mx-auto w-full max-w-xl overflow-hidden rounded-2xl ring-2 ring-amber-400/70 shadow-[0_0_60px_rgba(227,185,74,0.25)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={KV}
                alt="Key visual Lễ chuyển giao & ra mắt Ban Điều hành YBA Chợ Lớn 10.10.2026"
                className="w-full"
              />
            </div>
          </div>

          {/* ── BA MẪU — ba lối vào rõ ràng ─────────────────────── */}
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <a
              href="#xac-nhan"
              className="the-sang group rounded-2xl border border-amber-400/70 bg-gradient-to-b from-amber-500/25 to-amber-600/10 p-5 text-center transition hover:from-amber-500/35"
            >
              <p className="text-lg font-extrabold" style={{ color: VANG }}>
                ① Xác nhận tham dự
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/75">
                Dành cho khách <b>đã nhận được thư mời</b> — mở link trong thư
                hoặc nhập mã in trên thiệp.
              </p>
            </a>
            <a
              href="#dang-ky"
              className="the-sang group rounded-2xl border border-white/25 bg-white/5 p-5 text-center transition hover:bg-white/10"
            >
              <p className="text-lg font-extrabold text-white">
                ② Đăng ký tham dự
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/75">
                Anh/chị <b>chưa nhận được thư mời</b> nhưng muốn tham dự — Ban
                Tổ chức sẽ xét và liên hệ.
              </p>
            </a>
            <a
              href="#tai-tro"
              className="the-sang group rounded-2xl border border-white/25 bg-white/5 p-5 text-center transition hover:bg-white/10"
            >
              <p className="text-lg font-extrabold text-white">
                ③ Đăng ký tài trợ
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/75">
                Doanh nghiệp <b>đồng hành cùng sự kiện</b> — xem các gói và
                quyền lợi bên dưới.
              </p>
            </a>
          </div>
          <p className="mt-4 text-center text-xs text-white/55">
            Hạn xác nhận &amp; đăng ký: <b className="text-white/80">05/10/2026</b> ·
            Chương trình không thu phí khách mời — các khoản đóng góp xin gửi
            về tài khoản Hội Doanh nhân trẻ TP.HCM cho chuỗi dự án Nhịp Cầu
            Doanh Nhân.
          </p>
          {quyNguoi > 0 && (
            <p className="mt-2 text-center text-sm font-bold" style={{ color: VANG }}>
              Quỹ Nhịp Cầu Doanh Nhân đã nhận cam kết từ {quyNguoi} anh/chị
              {quyTien
                ? " · tổng " + (quyTien / 1_000_000).toLocaleString("vi-VN") + " triệu đồng"
                : ""}
            </p>
          )}
        </div>
      </section>

      {/* ── ① Xác nhận tham dự — thư mời riêng trên web ──────────
          Mỗi khách được BTC gửi một link /1010/moi/<mã> qua Zalo (quản ở
          /quan-tri/khach-moi-1010). Khối này cho khách cầm THIỆP IN: gõ mã
          là mở đúng thư mời của mình để xác nhận. */}
      <HienDan
        the="section"
        id="xac-nhan"
        className="mx-auto w-full max-w-3xl scroll-mt-10 px-4 py-12 sm:px-6"
      >
        <h2 className="text-center text-2xl font-extrabold sm:text-3xl">
          ① Xác nhận <span style={{ color: VANG }}>tham dự</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-white/70">
          Quý khách trong danh sách mời: <b className="text-white">gõ họ tên
          của mình</b>, bấm vào đúng tên hiện ra là mở thiệp mời riêng — chọn
          phiên tham dự, gửi lưu ý cho Ban Tổ chức, đăng ký tài trợ hoặc ủng
          hộ Nhịp Cầu Doanh Nhân, tất cả ngay trên thiệp.
        </p>
        <div className="mt-6">
          <TimTen />
        </div>
        <p className="mt-4 text-center text-xs leading-relaxed text-white/55">
          Chưa nhận được link hay mã? Gọi hotline hoặc{" "}
          <a
            href={FORM_BTC}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
            style={{ color: VANG }}
          >
            xác nhận qua biểu mẫu của Ban Tổ chức →
          </a>
        </p>
      </HienDan>

      {/* ── Ba phiên — giờ theo agenda proposal ─────────────────── */}
      <HienDan the="section" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-center text-2xl font-extrabold sm:text-3xl">
          Một buổi chiều · <span style={{ color: VANG }}>ba dấu ấn</span>
        </h2>
        <p className="mt-2 text-center text-sm text-white/60">
          Đón khách &amp; check-in từ 14:00 · Bấm vào từng tấm để xem chi tiết
        </p>
        <div className="mt-8 [&_img]:rounded-xl">
          <ThuVienAnh anh={ANH_BA_PHIEN} tieuDe="Ba dấu ấn 10.10.2026" cot={3} />
        </div>
      </HienDan>

      {/* ── Khách đã xác nhận, chia ba nhóm theo vai vế (công khai) ── */}
      {tongXacNhanHien > 0 && (
        <HienDan
          the="section"
          id="khach-moi"
          className="mx-auto w-full max-w-6xl scroll-mt-10 px-4 py-14 sm:px-6"
        >
          <h2 className="text-center text-2xl font-extrabold sm:text-3xl">
            Những gương mặt <span style={{ color: VANG }}>sẽ hội tụ</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-white/70">
            Những anh/chị đã xác nhận có mặt trong ngày 10.10 — biết đâu có
            đối tác anh/chị đang tìm.
          </p>
          <div className="mt-9">
            <KhachThamDu nhom={nhomHien} />
          </div>
        </HienDan>
      )}

      {/* ── Proposal ─────────────────────────────────────────────── */}
      <HienDan the="section" className="border-y border-white/10 bg-[#10182e] py-14">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p
                className="text-xs font-bold tracking-[0.25em] uppercase"
                style={{ color: VANG }}
              >
                Tài liệu chương trình
              </p>
              <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                Proposal sự kiện — {SO_TRANG_PROPOSAL} trang
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
                Bấm vào từng trang để xem phóng to: chương trình chi tiết, agenda,
                các gói đồng hành và quyền lợi nhà tài trợ.
              </p>
            </div>
            <a
              href={PDF}
              download
              className="rounded-full border border-amber-400/70 px-6 py-3 text-sm font-bold transition hover:bg-amber-400/10"
              style={{ color: VANG }}
            >
              ⬇ Tải proposal (PDF)
            </a>
          </div>
          <div className="mt-8 rounded-2xl bg-white/5 p-3 sm:p-4 [&_img]:rounded-lg">
            <ThuVienAnh anh={trangProposal} tieuDe="Proposal Lễ chuyển giao 10.10.2026" cot={3} />
          </div>
        </div>
      </HienDan>

      {/* ── ② Đăng ký tham dự (chưa có thư mời) ─────────────────── */}
      <HienDan
        the="section"
        id="dang-ky"
        className="mx-auto w-full max-w-3xl scroll-mt-10 px-4 py-14 sm:px-6"
      >
        <h2 className="text-center text-2xl font-extrabold sm:text-3xl">
          ② Đăng ký <span style={{ color: VANG }}>tham dự</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-white/70">
          Dành cho anh/chị <b className="text-white">chưa nhận được thư mời</b>{" "}
          nhưng mong muốn tham dự. Ban Tổ chức sẽ xét và liên hệ xác nhận qua số
          điện thoại của anh/chị.
        </p>
        {/* Khách đã có thư mời thì đi lối ① — đặt ngay đây kẻo điền nhầm form */}
        <p className="mx-auto mt-3 max-w-xl rounded-xl border border-amber-300/40 bg-amber-400/10 px-4 py-2.5 text-center text-xs leading-relaxed text-white/80">
          Anh/chị <b style={{ color: VANG }}>đã nhận được thư mời</b>? Vui lòng
          xác nhận tại{" "}
          <a
            href={FORM_BTC}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline underline-offset-2"
            style={{ color: VANG }}
          >
            biểu mẫu của Ban Tổ chức →
          </a>
        </p>
        <div className="mt-6">
          {hetHan ? (
            <div className="rounded-2xl border border-white/20 bg-white/5 p-6 text-center text-white/80">
              Đã hết hạn đăng ký trực tuyến — anh/chị vui lòng gọi hotline{" "}
              <a
                href={`tel:${gd.hotline.replace(/[^\d+]/g, "")}`}
                className="font-bold"
                style={{ color: VANG }}
              >
                {gd.hotline}
              </a>
            </div>
          ) : (
            <FormThamDu lichId={lich.id} />
          )}
        </div>
      </HienDan>

      {/* ── ③ Đăng ký tài trợ ───────────────────────────────────── */}
      <HienDan
        the="section"
        id="tai-tro"
        className="border-t border-white/10 bg-[#10182e] py-14 scroll-mt-10"
      >
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-extrabold sm:text-3xl">
            ③ Đồng hành &amp; <span style={{ color: VANG }}>tài trợ</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-white/70">
            Ban Tổ chức hiện còn nhận các gói dưới đây — suất{" "}
            <b className="text-white">Tài trợ Chính &amp; Kim cương đã đủ</b>{" "}
            nhà đồng hành. Quyền lợi chi tiết từng gói xem trong proposal phía
            trên.
          </p>

          <div className="mt-7">
            <DangKyTaiTro lichId={lich.id} />
          </div>

          {/* Khung tri ân NTT chính thức — BTC sửa ở /quan-tri/su-kien-1010 */}
          <NhaTaiTroCamOn goi={nhaTaiTro.goi} />

          {bangVang.length > 0 && (
            <div className="mx-auto mt-8 max-w-2xl">
              <h3 className="text-center text-lg font-extrabold" style={{ color: VANG }}>
                Bảng vàng Nhịp Cầu Doanh Nhân
              </h3>
              <p className="mt-1 text-center text-xs text-white/60">
                Tri ân các anh/chị cam kết đóng góp quỹ thiện nguyện thay quà mừng
              </p>
              <div className="mt-4 overflow-hidden rounded-2xl border border-amber-300/40">
                {bangVang.map((k, i) => (
                  <div
                    key={k.id}
                    className={
                      "flex items-center justify-between gap-3 px-4 py-3 " +
                      (i % 2 ? "bg-white/5" : "bg-white/10")
                    }
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-white">
                        {[k.danhXung, k.ten].filter(Boolean).join(" ")}
                      </p>
                      {k.donVi && (
                        <p className="truncate text-xs text-white/60">{k.donVi}</p>
                      )}
                    </div>
                    <p className="shrink-0 font-extrabold" style={{ color: VANG }}>
                      {k.dongGopSoTien
                        ? k.dongGopSoTien.toLocaleString("vi-VN") + "đ"
                        : "Đồng hành"}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-xs leading-relaxed text-white/55">
                Đóng góp xin gửi về: <b className="text-white/80">{STK_QUY.chuTaiKhoan}</b>{" "}
                · STK <b style={{ color: VANG }}>{STK_QUY.soTaiKhoan}</b> ·{" "}
                {STK_QUY.nganHang} · Nội dung: {STK_QUY.noiDung}
              </p>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-white/70">
            Trao đổi trực tiếp: <b className="text-white">Anh Đặng Khang</b>{" "}
            <a href="tel:0968111118" className="font-bold" style={{ color: VANG }}>
              0968.111.118
            </a>{" "}
            · <b className="text-white">Anh Đức Anh</b>{" "}
            <a href="tel:0969100888" className="font-bold" style={{ color: VANG }}>
              0969.100.888
            </a>
          </p>
          <p className="mt-2 text-center text-xs text-white/50">
            Anh/chị quen dùng biểu mẫu?{" "}
            <a
              href={FORM_BTC}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
              style={{ color: VANG }}
            >
              Đăng ký qua Google Form của Ban Tổ chức →
            </a>
          </p>
        </div>
      </HienDan>

      {/* ── Chân trang gọn của thư mời ──────────────────────────── */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/60">
        <p className="font-semibold text-white/80">
          Chi hội Doanh nhân trẻ Chợ Lớn — YBA Chợ Lớn
        </p>
        <p className="mt-1">
          Hotline:{" "}
          <a
            href={`tel:${gd.hotline.replace(/[^\d+]/g, "")}`}
            className="font-semibold text-white/90 hover:underline"
          >
            {gd.hotline}
          </a>{" "}
          · Email:{" "}
          <a href={`mailto:${gd.email}`} className="font-semibold text-white/90 hover:underline">
            {gd.email}
          </a>
        </p>
        <p className="mt-3">
          <Link href="https://ybacholon.vn" className="text-white/50 hover:text-white">
            ybacholon.vn — website chính thức của Chi hội →
          </Link>
        </p>
      </footer>
    </main>
  );
}
