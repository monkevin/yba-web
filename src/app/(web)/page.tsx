import Link from "next/link";
import type { Metadata } from "next";
import ListingCard from "@/components/web/ListingCard";
import MemberCard from "@/components/web/MemberCard";
import { formatDate, formatShortVnd } from "@/lib/format";
import { docGiaoDien } from "@/lib/giao-dien";
import DemSo from "@/components/web/DemSo";
import HienDan from "@/components/web/HienDan";
import KvHoi from "@/components/web/KvHoi";
import LuoiDiem from "@/components/web/LuoiDiem";
import TheSang from "@/components/web/TheSang";
import { prisma } from "@/lib/prisma";
import LichHoatDongBang from "@/components/web/LichHoatDong";
import VideoNhung from "@/components/web/VideoNhung";
import BieuTuong from "@/components/ngoi-nha/BieuTuong";
import { getCurrentUser } from "@/lib/auth";
import { ngoiNhaCongKhai } from "@/lib/ngoi-nha/cong-khai";
import {
  anhHoatDong,
  featuredMembers,
  homeStats,
  latestListings,
  latestPosts,
  upcomingEvents,
  videoNoiBat,
} from "@/lib/public";
import { DINH_HUONG, SITE } from "@/lib/site";

export const metadata: Metadata = {
  // absolute: thoát mẫu "%s · YBA Chợ Lớn" của layout — không thì "Chợ Lớn"
  // lặp hai lần và Google cắt mất đuôi
  title: { absolute: `${SITE.fullName} — Kết nối · Giao thương · Vươn tầm` },
  description: SITE.tagline,
};

/** Nền "trời đêm" sau ảnh Chợ Bình Tây: ảnh chưa có / tải lỗi thì khung vẫn đẹp. */
const NEN_DEM =
  "radial-gradient(55% 45% at 82% 14%, rgba(227,185,74,0.22), transparent 70%), linear-gradient(180deg, #0a0f20 0%, #121b36 58%, #2d0208 100%)";

export default async function TrangChu() {
  const [
    stats,
    members,
    listings,
    { events, upcoming },
    posts,
    gd,
    anh,
    video,
    lich,
    nn,
    user,
  ] = await Promise.all([
    homeStats(),
    featuredMembers(8),
    latestListings(6),
    upcomingEvents(3),
    latestPosts(3),
    docGiaoDien(),
    anhHoatDong(9),
    videoNoiBat(),
    (() => {
      const dauNgay = new Date();
      dauNgay.setHours(0, 0, 0, 0);
      return prisma.lichHoatDong.findMany({
        where: { published: true, tuNgay: { gte: dauNgay } },
        orderBy: [{ tuNgay: "asc" }, { order: "asc" }],
        take: 6,
      });
    })(),
    // Tối đa 3 truy vấn nhẹ, lỗi thì trả mặc định — không làm sập trang chủ
    ngoiNhaCongKhai(),
    getCurrentUser(),
  ]);

  // Bốn ô số của dải game: ưu tiên số thật đáng khoe, thiếu thì lấy số nội
  // dung cố định. KHÔNG hiện tên người chơi hay nhà đồng hành ở đây.
  const oSoGame = [
    { label: `Trạm qua ${nn.soChang} chặng`, so: nn.soTram },
    nn.soNguoiChoi
      ? { label: "Hội viên đã thắp sáng trạm", so: nn.soNguoiChoi }
      : { label: "Câu hỏi về Hội & nghề", so: nn.soCau },
    nn.soDanhNgon
      ? { label: "Danh ngôn trong Lá bài", so: nn.soDanhNgon }
      : null,
    nn.soQua ? { label: "Phần quà mùa giải", so: nn.soQua } : null,
    nn.coDauTruong ? { label: "Bộ câu ở Đấu trường", so: 100 } : null,
    { label: "Loại vốn tích luỹ", so: 4 },
  ]
    .filter((o): o is { label: string; so: number } => o !== null)
    .slice(0, 4);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────
          Ảnh nền, tiêu đề, slogan và mô tả đều đọc từ cấu hình giao diện — Ban
          Chủ nhiệm đổi được ở /quan-tri/giao-dien mà không cần sửa mã nguồn. */}
      <section className="san-do relative overflow-hidden text-white">
        {/* Ảnh hoạt động thật hiện RÕ; chữ dễ đọc nhờ dải che chuyển sắc đè
            lên — đậm ở bên trái (chỗ có chữ), loãng dần sang phải để người
            trong ảnh vẫn thấy mặt. Đừng quay lại kiểu làm chìm cả tấm ảnh:
            ảnh sự kiện là người thật của Chi hội, mờ quá thành vô nghĩa. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${gd.banner}')` }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-son-950/95 via-son-900/80 to-son-900/35"
        />
        <div aria-hidden className="luoi-ky-thuat absolute inset-0" />
        {/* Lưới chấm sáng lên theo con trỏ — xem LuoiDiem.tsx */}
        <LuoiDiem className="opacity-70" />
        <div
          aria-hidden
          className="tho-sang pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-son-500 blur-3xl"
        />

        <div className="wrap relative grid gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-son-200 ring-1 ring-white/20">
                {SITE.term}
              </p>
              {/* Nhắc game mới ngay đầu trang — nhảy xuống dải #ngoi-nha */}
              <a
                href="#ngoi-nha"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white ring-1 ring-vang-400/60 transition hover:bg-white/20"
              >
                <span className="text-vang-400">Mới</span>
                <span aria-hidden="true">·</span>
                Ngôi nhà Chợ Lớn
                <span aria-hidden="true">→</span>
              </a>
            </div>
            <h1 className="chu-lua mt-5 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              {gd.bannerTieuDe}
            </h1>
            {gd.slogan && (
              <p className="mt-3 text-lg font-semibold text-son-200 sm:text-xl">
                {gd.slogan}
              </p>
            )}
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
              {gd.bannerMoTa} Chi hội quy tụ doanh nhân trẻ tại{" "}
              {SITE.areas.length} quận huyện khu vực Chợ Lớn, hoạt động từ năm{" "}
              {SITE.founded}.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/giao-thuong" className="btn-cta">
                Vào chợ nhu cầu mua – bán
              </Link>
              <Link href="/doanh-nghiep" className="btn-cta-ghost">
                Xem danh bạ doanh nghiệp
              </Link>
            </div>
          </div>

          {/* KV của Chi hội. Chưa tải ảnh lên thì khối này không hiện gì,
              bố cục tự thu về một cột. */}
          <KvHoi src={gd.kv} kichThuoc="lon" />
        </div>

        {/* Chỉ số chạy từ dữ liệu thật, đếm lên khi cuộn tới */}
        <div className="wrap relative pb-16 sm:pb-20">
          <TheSang>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/15 sm:grid-cols-4">
              {[
                {
                  label: "Doanh nghiệp hội viên",
                  so: stats.members,
                  chu: String(stats.members),
                },
                {
                  label: "Giá trị giao thương",
                  so: 0, // tiền rút gọn ("41,2 tỷ") không đếm được, để hiện thẳng
                  chu: stats.dealTotal
                    ? `${formatShortVnd(stats.dealTotal)} ₫`
                    : "—",
                },
                {
                  label: "Giao dịch đã ghi nhận",
                  so: stats.dealCount,
                  chu: String(stats.dealCount),
                },
                {
                  label: "Cặp kết nối thành công",
                  so: stats.connections,
                  chu: String(stats.connections),
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="the-sang bg-son-950/70 px-5 py-6 backdrop-blur"
                >
                  <dt className="text-xs font-medium uppercase tracking-wide text-son-200">
                    {s.label}
                  </dt>
                  <dd className="mt-1.5 text-2xl font-extrabold text-white sm:text-3xl">
                    <DemSo den={s.so} chu={s.chu} />
                  </dd>
                </div>
              ))}
            </dl>
          </TheSang>
          <p className="mt-3 text-xs text-white/55">
            Số liệu cập nhật tự động từ các giao dịch đã được Ban Chủ nhiệm
            duyệt.{" "}
            <Link
              href="/xuc-tien-thuong-mai"
              className="underline hover:no-underline"
            >
              Xem chi tiết chỉ số xúc tiến thương mại
            </Link>
          </p>
        </div>
      </section>

      {/* ── Ba trụ cột ─────────────────────────────────────────── */}
      <HienDan the="section" className="wrap -mt-8 sm:-mt-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              href: "/xuc-tien-thuong-mai",
              icon: "📈",
              title: "Xúc tiến thương mại",
              desc: "Ghi nhận và đo lường giao thương giữa hội viên, với chi hội bạn và các hội khác. Có bảng xếp hạng và vinh danh theo kỳ.",
            },
            {
              href: "/giao-thuong",
              icon: "🛒",
              title: "Chợ nhu cầu mua – bán",
              desc: "Hội viên chủ động đăng nhu cầu cần mua, cần bán. Ai cũng tìm kiếm được theo ngành nghề và khu vực.",
            },
            {
              href: "/doanh-nghiep",
              icon: "🏢",
              title: "Hồ sơ doanh nghiệp",
              desc: "Mỗi hội viên một trang giới thiệu đầy đủ: năng lực, sản phẩm dịch vụ, hình ảnh và thông tin liên hệ.",
            },
          ].map((c, i) => (
            <Link key={c.href} href={c.href} className="tile flex flex-col">
              {/* Ảnh hoạt động thật làm nền cho từng trụ cột */}
              {anh[i] ? (
                <div className="relative h-32 w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={anh[i].src}
                    alt={anh[i].title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-navy-900/20"
                  />
                  <span className="absolute bottom-3 left-5 text-3xl">
                    {c.icon}
                  </span>
                </div>
              ) : (
                <span className="px-6 pt-6 text-3xl">{c.icon}</span>
              )}
              <div className="flex flex-1 flex-col p-6">
                <h2 className="text-lg font-bold text-navy-800">{c.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {c.desc}
                </p>
                <span className="mt-4 inline-block text-sm font-semibold text-do-600">
                  Khám phá →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </HienDan>

      {/* ── Game Ngôi nhà Chợ Lớn ──────────────────────────────────
          Dải đêm navy giống nền game, đặt ngay dưới ba trụ cột cho hội viên
          thấy sớm. Chỉ số tổng từ `ngoiNhaCongKhai()` — KHÔNG tên người chơi,
          không nhà đồng hành (bảng xếp hạng là chuyện nội bộ). Nút vào game
          trỏ thẳng /ngoi-nha chứ không /login?tiep=…: khách chưa đăng nhập
          được proxy đưa qua /login rồi quay lại, còn người đã đăng nhập mà mở
          /login thì bị đẩy về /tai-khoan, lỡ mất game. Chia sẻ lên Zalo /
          Facebook thì dùng liên kết ybacholon.vn/#ngoi-nha (trang game chặn
          máy tìm kiếm nên xem trước chỉ ra trang đăng nhập). */}
      <HienDan
        the="section"
        id="ngoi-nha"
        className="relative mt-20 scroll-mt-24 overflow-hidden bg-navy-950 py-16 text-white"
      >
        <div aria-hidden className="luoi-ky-thuat absolute inset-0" />
        <div
          aria-hidden
          className="tho-sang pointer-events-none absolute -left-28 top-1/3 h-96 w-96 rounded-full bg-son-700 blur-3xl"
        />

        <div className="wrap relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
          <div>
            <span className="eyebrow text-son-300">
              Game dành riêng cho hội viên
            </span>
            {/* Playfair cỡ lớn: leading-tight để dấu Ô/Ớ không đâm lên dòng trên */}
            <h2 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
              Ngôi nhà Chợ Lớn
            </h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-son-300">
              Tình Huynh Đệ
            </p>
            <p className="mt-4 leading-relaxed text-white/80">
              Chợ Bình Tây của riêng Chi hội, dựng thành game cho hội viên: đi
              qua {nn.soChang} gian chợ theo hành trình 4B — Biết, Bạn, Bàn, Bán
              rồi Vươn tầm. {nn.soTram} trạm, mỗi trạm {nn.cauMoiTram} câu hỏi
              về Hội, về tình huynh đệ và nghề kinh doanh; trả lời đúng để tích
              luỹ 4 loại vốn và thắp sáng từng gian chợ.
            </p>
            {(nn.soDanhNgon || nn.coDauTruong || nn.coDauTri) && (
              <p className="mt-3 leading-relaxed text-white/65">
                {nn.soDanhNgon
                  ? `Mỗi ngày lật một Lá bài: một trong ${nn.soDanhNgon} câu danh ngôn chọn lọc, lời nhắn của Chi hội hoặc điểm thưởng. `
                  : ""}
                {nn.coDauTruong
                  ? `Muốn so tài thì thách đấu 1-1 ở Đấu trường với kho 100 bộ câu hỏi${
                      nn.coDauTri
                        ? ", hoặc cùng chơi Đấu trí ngay tại buổi sinh hoạt."
                        : "."
                    }`
                  : nn.coDauTri
                    ? "Tại buổi sinh hoạt, cả Chi hội cùng chơi Đấu trí trên màn hình lớn."
                    : ""}
              </p>
            )}

            <ul
              aria-label={`${nn.soChang} chặng hành trình`}
              className="mt-5 flex flex-wrap gap-2"
            >
              {nn.chang.map((c) => (
                <li
                  key={c.so}
                  title={c.tieuDe}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide ring-1 ring-white/15"
                >
                  <span className="text-vang-400">{c.so}</span> · {c.ten}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              {/* prefetch tắt: trang game động, nặng; khách chưa đăng nhập
                  còn bị chuyển hướng — nạp trước chỉ tốn truy vấn */}
              <Link href="/ngoi-nha" prefetch={false} className="btn-cta">
                <BieuTuong ten="nha" className="h-4 w-4 shrink-0" />
                Vào Ngôi nhà Chợ Lớn
              </Link>
              {!user && (
                <Link href="/huong-dan-dang-nhap" className="btn-cta-ghost">
                  Cách đăng nhập
                </Link>
              )}
            </div>
            {!user && (
              <p className="mt-3 text-sm text-white/65">
                Dành cho hội viên đã có tài khoản. Chưa là hội viên?{" "}
                <Link
                  href="/dang-ky-hoi-vien"
                  className="font-semibold text-white underline hover:no-underline"
                >
                  Đăng ký gia nhập
                </Link>
              </p>
            )}
          </div>

          <figure className="min-w-0">
            <div className="vien-chay relative rounded-2xl">
              <div className="overflow-hidden rounded-2xl bg-navy-900 shadow-2xl ring-1 ring-white/15">
                <div className="flex items-center gap-2 border-b border-white/10 bg-navy-950/80 px-4 py-3">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full bg-son-500"
                  />
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full bg-vang-400"
                  />
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full bg-white/25"
                  />
                  <span className="ml-2 truncate text-xs font-medium text-white/60">
                    Chợ Bình Tây · {nn.soChang} gian ứng với {nn.soChang} chặng
                  </span>
                </div>
                {/* Ảnh chụp màn hình game. Server component không có onError
                    nên phòng ảnh thiếu bằng nền trời đêm: khung giữ đúng tỉ lệ,
                    thẻ img mang cùng nền và ::after phủ lên biểu tượng "ảnh
                    hỏng" + chữ alt (Chrome/Firefox chỉ vẽ ::after khi ảnh lỗi). */}
                <div
                  className="relative aspect-[1600/869] w-full"
                  style={{ background: NEN_DEM }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/anh-game/cho-binh-tay.webp"
                    alt="Chợ Bình Tây trong game Ngôi nhà Chợ Lớn: năm gian chợ ứng với năm chặng, trạm đã qua sáng đèn"
                    width={1600}
                    height={869}
                    loading="lazy"
                    decoding="async"
                    style={{ background: NEN_DEM }}
                    className="absolute inset-0 h-full w-full object-cover text-transparent after:absolute after:inset-0 after:content-[''] after:[background:inherit]"
                  />
                </div>
              </div>
            </div>
            {nn.dongMua && (
              <figcaption className="mt-3 flex items-start justify-center gap-2 text-center text-xs leading-snug text-white/70">
                <span
                  aria-hidden
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    nn.dangDienRa && !nn.tamDung ? "bg-vang-400" : "bg-white/35"
                  }`}
                />
                {nn.dongMua}
              </figcaption>
            )}
          </figure>
        </div>

        <div className="wrap relative mt-10">
          <TheSang>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-4">
              {oSoGame.map((s) => (
                <div
                  key={s.label}
                  className="the-sang bg-navy-950/80 px-4 py-5 sm:px-5"
                >
                  <dt className="text-xs font-medium uppercase tracking-wide text-white/60">
                    {s.label}
                  </dt>
                  <dd className="mt-1.5 text-2xl font-extrabold text-white sm:text-3xl">
                    <DemSo den={s.so} chu={String(s.so)} />
                  </dd>
                </div>
              ))}
            </dl>
          </TheSang>
        </div>

        {user ? (
          // Đã đăng nhập: khỏi hướng dẫn, mời vào lật lá bài luôn
          <div className="wrap relative mt-10">
            <div className="flex flex-col gap-5 rounded-2xl bg-white/5 p-5 ring-1 ring-vang-400/30 sm:flex-row sm:items-center sm:p-6">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-vang-400/15 text-vang-400 ring-1 ring-vang-400/40">
                <BieuTuong
                  ten={nn.soDanhNgon ? "the" : "nha"}
                  className="h-7 w-7"
                />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold">
                  {nn.soDanhNgon
                    ? "Lá bài hôm nay đang chờ bạn"
                    : "Hành trình của bạn đang chờ"}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-white/75">
                  {nn.tamDung
                    ? "Ban Điều hành đang tạm dừng game ít phút để bảo trì — anh/chị quay lại sau nhé."
                    : nn.soDanhNgon
                      ? "Mỗi ngày một lá: câu danh ngôn chọn lọc, lời nhắn của Chi hội hoặc điểm cộng vào hành trình. Lá mới mở lúc 6 giờ sáng."
                      : "Vào tiếp tục thắp sáng các gian chợ và tích luỹ vốn cùng huynh đệ Chi hội."}
                </p>
              </div>
              <Link
                href="/ngoi-nha"
                prefetch={false}
                className="btn-cta shrink-0"
              >
                {nn.soDanhNgon ? "Lật lá bài hôm nay" : "Vào chơi tiếp"}
              </Link>
            </div>
          </div>
        ) : (
          <div id="cach-dang-nhap" className="wrap relative mt-10 scroll-mt-24">
            <h3 className="text-lg font-bold">Cách đăng nhập để vào chơi</h3>
            <ol className="mt-4 grid gap-3 md:grid-cols-3">
              <li className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <p className="font-bold text-vang-400">1. Nhận tài khoản</p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/75">
                  Tên đăng nhập do Văn phòng Chi hội gửi (dạng hv0xxx), hoặc số
                  điện thoại anh/chị đã đăng ký với Chi hội.
                </p>
              </li>
              <li className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <p className="font-bold text-vang-400">
                  2. Bấm “Vào Ngôi nhà Chợ Lớn”
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/75">
                  Nhập tên đăng nhập (hoặc số điện thoại) và mật khẩu — web tự
                  đưa anh/chị vào game. Chơi ngay trên điện thoại, không cần cài
                  ứng dụng.
                </p>
              </li>
              <li className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <p className="font-bold text-vang-400">3. Quên mật khẩu?</p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/75">
                  Gọi hotline{" "}
                  <a
                    href={`tel:${gd.hotline.replace(/[^\d+]/g, "")}`}
                    className="whitespace-nowrap font-semibold text-white underline hover:no-underline"
                  >
                    {gd.hotline}
                  </a>{" "}
                  để Văn phòng Chi hội hỗ trợ, hoặc xem{" "}
                  <Link
                    href="/huong-dan-dang-nhap"
                    className="font-semibold text-white underline hover:no-underline"
                  >
                    Hướng dẫn đăng nhập
                  </Link>
                  .
                </p>
              </li>
            </ol>
          </div>
        )}
      </HienDan>

      {/* ── Lịch hoạt động sắp tới ─────────────────────────────────
          Thứ hội viên cần nhất khi vào web: sắp tới có gì để thu xếp đi. */}
      {lich.length > 0 && (
        <HienDan the="section" className="wrap mt-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="eyebrow">
                Kết nối – Hợp tác – Phát triển bền vững
              </span>
              <h2 className="section-title">Lịch hoạt động sắp tới</h2>
            </div>
            <Link
              href="/lich-hoat-dong"
              className="text-sm font-semibold text-navy-600 hover:text-do-600"
            >
              Xem toàn bộ lịch →
            </Link>
          </div>
          <div className="mt-6">
            <LichHoatDongBang ds={lich} gonGang />
          </div>
        </HienDan>
      )}

      {/* ── Dải ảnh hoạt động thật ─────────────────────────────────
          Lấy thẳng từ album các sự kiện đã đăng, nên trang chủ luôn có hình
          thật của Chi hội mà không phải tải ảnh riêng cho trang chủ. */}
      {anh.length >= 5 && (
        <HienDan the="section" className="wrap mt-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="eyebrow">Hình ảnh Chi hội</span>
              <h2 className="section-title">Khoảnh khắc hoạt động</h2>
            </div>
            <Link
              href="/su-kien"
              className="text-sm font-semibold text-navy-600 hover:text-do-600"
            >
              Xem toàn bộ hình ảnh sự kiện →
            </Link>
          </div>

          <div className="mt-6 grid auto-rows-[130px] grid-cols-2 gap-3 sm:auto-rows-[150px] sm:grid-cols-4 lg:auto-rows-[165px]">
            {anh.slice(0, 9).map((a, i) => (
              <Link
                key={`${a.src}-${i}`}
                href={`/su-kien/${a.slug}`}
                title={a.title}
                className={`group relative overflow-hidden rounded-xl ring-1 ring-navy-100 ${
                  // Ảnh đầu chiếm ô vuông lớn để dải ảnh có nhịp, không đều đều
                  i === 0 ? "col-span-2 row-span-2" : ""
                }`}
              >
                {/* Ảnh sự kiện do Ban Truyền thông tải lên */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.src}
                  alt={a.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-navy-950/90 to-transparent px-3 pb-2.5 pt-8 text-xs font-medium leading-snug text-white opacity-0 transition group-hover:opacity-100 sm:text-sm">
                  {a.title}
                </span>
              </Link>
            ))}
          </div>
        </HienDan>
      )}

      {/* ── Doanh nghiệp tiêu biểu ─────────────────────────────── */}
      {members.length > 0 && (
        <HienDan the="section" className="wrap mt-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="eyebrow">Danh bạ hội viên</span>
              <h2 className="section-title">Doanh nghiệp tiêu biểu</h2>
            </div>
            <Link
              href="/doanh-nghiep"
              className="text-sm font-semibold text-navy-600 hover:text-do-600"
            >
              Xem tất cả {stats.members} doanh nghiệp →
            </Link>
          </div>
          <TheSang className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {members.map((m) => (
              <MemberCard key={m.slug} m={m} />
            ))}
          </TheSang>
        </HienDan>
      )}

      {/* ── Chợ nhu cầu ────────────────────────────────────────── */}
      {listings.length > 0 && (
        <HienDan the="section" className="mt-20 bg-navy-50 py-16">
          <div className="wrap">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="eyebrow">Cơ hội giao thương</span>
                <h2 className="section-title">Nhu cầu mua – bán mới nhất</h2>
              </div>
              <Link
                href="/giao-thuong"
                className="text-sm font-semibold text-navy-600 hover:text-do-600"
              >
                Vào chợ nhu cầu →
              </Link>
            </div>
            <TheSang className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <ListingCard key={l.slug} l={l} />
              ))}
            </TheSang>
          </div>
        </HienDan>
      )}

      {/* ── Video Chi hội ──────────────────────────────────────────
          Hình đại diện video là do YouTube tự cắt, không kiểm soát được đẹp
          xấu — nên đặt nó vào trong một khung "trình phát" có thanh tiêu đề
          và viền sáng chạy quanh, để tấm hình nằm trong bối cảnh có chủ đích
          thay vì trơ trọi giữa trang. Nền navy sẫm cho đỡ trùng với các dải
          đỏ son trước và sau nó. */}
      {video && (
        <HienDan
          the="section"
          className="relative mt-20 overflow-hidden bg-navy-950 py-16 text-white"
        >
          <div aria-hidden className="luoi-ky-thuat absolute inset-0" />
          <div
            aria-hidden
            className="tho-sang pointer-events-none absolute -right-28 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-son-600 blur-3xl"
          />
          <div className="wrap relative grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-center">
            <div className="vien-chay relative rounded-2xl">
              <div className="overflow-hidden rounded-2xl bg-navy-900 shadow-2xl ring-1 ring-white/15">
                <div className="flex items-center gap-2 border-b border-white/10 bg-navy-950/80 px-4 py-3">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full bg-son-500"
                  />
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full bg-vang-400"
                  />
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full bg-white/25"
                  />
                  <span className="ml-2 truncate text-xs font-medium text-white/60">
                    Video Chi hội · Kênh YouTube YBA Chợ Lớn
                  </span>
                </div>
                <VideoNhung
                  youtubeId={video.youtubeId}
                  title={video.title}
                  lon
                />
              </div>
            </div>
            <div>
              <span className="eyebrow text-son-300">Thư viện video</span>
              <h2 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">
                {video.title}
              </h2>
              {video.summary && (
                <p className="mt-3 leading-relaxed text-white/80">
                  {video.summary}
                </p>
              )}
              <p className="mt-3 leading-relaxed text-white/65">
                Toàn bộ khoảnh khắc của Chi hội — chương trình thường niên, hoạt
                động cộng đồng và các buổi kết nối hội viên.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/video" className="btn-cta">
                  Xem thư viện video
                </Link>
                <a
                  href={SITE.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-cta-ghost"
                >
                  Kênh YouTube →
                </a>
              </div>
            </div>
          </div>
        </HienDan>
      )}

      {/* Khối chân dung Ban Chủ nhiệm đã CHUYỂN sang trang /gioi-thieu
          (07/08, anh Khang yêu cầu) — trang chủ đang dài, phần nhân sự hợp
          với mạch "tìm hiểu về Chi hội" hơn. Đừng thêm lại vào đây. */}

      {/* ── Định hướng nhiệm kỳ ────────────────────────────────── */}
      <HienDan the="section" className="wrap mt-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <div>
            <span className="eyebrow">{SITE.term}</span>
            <h2 className="section-title">Mục tiêu &amp; định hướng</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Hoạt động của Chi hội Chợ Lớn gắn liền với các chương trình từ
              thiện và các hoạt động xúc tiến thương mại, nhằm hỗ trợ tối đa cho
              doanh nghiệp hội viên: quảng bá sản phẩm, dịch vụ tới các doanh
              nghiệp cùng ngành và người tiêu dùng.
            </p>
            {/* Một ảnh hoạt động thật đặt cạnh phần chữ cho đỡ khô */}
            {anh[3] && (
              <Link
                href={`/su-kien/${anh[3].slug}`}
                className="mt-6 block overflow-hidden rounded-2xl ring-1 ring-navy-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={anh[3].src}
                  alt={anh[3].title}
                  loading="lazy"
                  className="ratio-3-2 w-full object-cover transition duration-500 hover:scale-105"
                />
              </Link>
            )}
            <Link href="/gioi-thieu" className="btn-primary mt-6">
              Tìm hiểu về Chi hội
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {DINH_HUONG.map((d) => (
              <div key={d.no} className="card p-5">
                <span className="text-2xl font-extrabold text-do-200">
                  {d.no}
                </span>
                <h3 className="mt-1 font-bold text-navy-800">{d.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {d.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </HienDan>

      {/* ── Sự kiện ────────────────────────────────────────────── */}
      {events.length > 0 && (
        <HienDan the="section" className="wrap mt-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="eyebrow">Hoạt động Chi hội</span>
              <h2 className="section-title">
                {upcoming ? "Sự kiện sắp diễn ra" : "Sự kiện gần đây"}
              </h2>
            </div>
            <Link
              href="/su-kien"
              className="text-sm font-semibold text-navy-600 hover:text-do-600"
            >
              Tất cả sự kiện →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {events.map((e) => (
              <Link key={e.slug} href={`/su-kien/${e.slug}`} className="tile">
                {e.coverImage ? (
                  // Ảnh sự kiện do ban truyền thông tải lên
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.coverImage}
                    alt={e.title}
                    className="ratio-16-9 w-full object-cover"
                  />
                ) : (
                  <div className="ratio-16-9 grid w-full place-items-center bg-navy-100 text-4xl">
                    📅
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-do-600">
                    {formatDate(e.startAt)}
                    {e.seriesName ? ` · ${e.seriesName}` : ""}
                  </p>
                  <h3 className="mt-1.5 line-clamp-2 font-semibold leading-snug text-navy-800">
                    {e.title}
                  </h3>
                  {e.location && (
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {e.location}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </HienDan>
      )}

      {/* ── Tin tức ────────────────────────────────────────────── */}
      {posts.length > 0 && (
        <HienDan the="section" className="wrap mt-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="eyebrow">Bản tin</span>
              <h2 className="section-title">Tin tức mới</h2>
            </div>
            <Link
              href="/tin-tuc"
              className="text-sm font-semibold text-navy-600 hover:text-do-600"
            >
              Tất cả tin tức →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.slug} href={`/tin-tuc/${p.slug}`} className="tile">
                {p.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.coverImage}
                    alt={p.title}
                    className="ratio-16-9 w-full object-cover"
                  />
                ) : (
                  <div className="ratio-16-9 grid w-full place-items-center bg-navy-100 text-4xl">
                    📰
                  </div>
                )}
                <div className="p-5">
                  {p.publishedAt && (
                    <p className="text-xs text-slate-500">
                      {formatDate(p.publishedAt)}
                    </p>
                  )}
                  <h3 className="mt-1 line-clamp-2 font-semibold leading-snug text-navy-800">
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">
                      {p.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </HienDan>
      )}

      {/* ── Kêu gọi gia nhập ───────────────────────────────────── */}
      <HienDan the="section" className="wrap mt-20">
        <div className="san-do relative overflow-hidden rounded-3xl px-6 py-14 text-center text-white sm:px-12">
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            Trở thành hội viên YBA Chợ Lớn
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/85">
            Gia nhập cộng đồng doanh nhân trẻ để mở rộng mạng lưới, tìm khách
            hàng và nhà cung cấp ngay trong Hội, cùng học hỏi và cùng lớn mạnh.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/dang-ky-hoi-vien" className="btn-cta">
              Đăng ký hội viên
            </Link>
            <Link href="/lien-he" className="btn-cta-ghost">
              Liên hệ Ban Chủ nhiệm
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/70">
            Theo dõi hoạt động Chi hội tại{" "}
            <a
              href={SITE.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white underline hover:no-underline"
            >
              fanpage YBA Chợ Lớn
            </a>{" "}
            và{" "}
            <a
              href={SITE.social.facebookHoi}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white underline hover:no-underline"
            >
              fanpage YBA HCM
            </a>
          </p>
        </div>
      </HienDan>
    </>
  );
}
