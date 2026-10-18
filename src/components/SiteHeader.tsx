"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BieuTuong from "@/components/ngoi-nha/BieuTuong";
import { MAIN_MENU, MENU_CHINH, MENU_THEM, SITE } from "@/lib/site";

/** Game hội viên — có nút riêng trên thanh và hàng nổi bật trong menu điện thoại. */
const NGOI_NHA = "/ngoi-nha";

/**
 * Thanh điều hướng của khu công khai. Nhận `userName` từ server layout:
 * có tên = đang đăng nhập → hiện lối vào khu hội viên; không có = khách vãng lai.
 *
 * Bố cục: 5 mục chính + nút "Thêm" gom phần còn lại. Trước đây để cả 8 mục ra
 * ngoài thì thanh chật, nhãn dài tự xuống hàng và vỡ bố cục — nên mọi nhãn ở
 * đây đều `whitespace-nowrap`, mục nào thêm mới thì cho vào `MENU_THEM`.
 *
 * Bề rộng đã ĐO bằng phông thật (16/09/2026, trình duyệt Edge): logo + 5 mục +
 * "Thêm" + cụm nút phải cần ~1.100px, khách chưa đăng nhập ~1.140px. Vì vậy:
 *  - thanh menu ngang chỉ hiện từ `xl` (1280px); dưới đó dùng nút ☰ — trước
 *    đây hiện từ `lg` nên ở 1024–1150px cụm nút phải tràn ra ngoài màn hình;
 *  - khung header rộng `max-w-7xl` (nội dung trang vẫn `max-w-6xl`) để có chỗ
 *    cho nút "Ngôi nhà"; "Hỏi AI" chỉ còn biểu tượng khi thanh menu ngang hiện,
 *    ô tìm kiếm thu về nút kính lúp ở mọi khổ.
 * Thêm nút / đổi nhãn ở đây thì chụp lại 1024 · 1280 · 1440 · 1536 trước khi đưa lên.
 */
export default function SiteHeader({
  userName,
  logo = "/logo-yba-cholon.png",
}: {
  userName: string | null;
  logo?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [moThem, setMoThem] = useState(false);
  const themRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => pathname.startsWith(href);
  const themDangMo = MENU_THEM.some((it) => isActive(it.href));

  // Đổi trang thì đóng hết menu, không để nó treo lại ở trang mới. Chỉnh
  // state ngay lúc render khi đường dẫn đổi (cách React khuyên) thay vì
  // setState trong useEffect — cách cũ vẽ thừa một lượt, eslint chặn.
  const [trangTruoc, setTrangTruoc] = useState(pathname);
  if (trangTruoc !== pathname) {
    setTrangTruoc(pathname);
    setOpen(false);
    setMoThem(false);
  }

  // Bấm ra ngoài hoặc nhấn Esc thì đóng bảng "Thêm"
  useEffect(() => {
    if (!moThem) return;
    const ngoai = (e: MouseEvent) => {
      if (themRef.current && !themRef.current.contains(e.target as Node)) {
        setMoThem(false);
      }
    };
    const phim = (e: KeyboardEvent) => e.key === "Escape" && setMoThem(false);
    document.addEventListener("mousedown", ngoai);
    document.addEventListener("keydown", phim);
    return () => {
      document.removeEventListener("mousedown", ngoai);
      document.removeEventListener("keydown", phim);
    };
  }, [moThem]);

  const lopMuc = (dang: boolean) =>
    `whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium transition ${
      dang
        ? "bg-navy-50 text-navy-700"
        : "text-slate-600 hover:bg-slate-50 hover:text-navy-700"
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-navy-100 bg-white/95 backdrop-blur">
      <div className="h-1 bg-do-600" />
      {/* Rộng hơn `.wrap` một bậc — xem ghi chú bề rộng ở đầu tệp */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            {/* Logo đọc từ cấu hình giao diện — dùng thẻ img thường vì đường
                dẫn do Ban Chủ nhiệm tải lên, không biết trước kích thước */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt={`Logo ${SITE.name}`}
              width={44}
              height={44}
              className="h-11 w-11 object-contain"
            />
            <span className="leading-tight">
              <span className="block whitespace-nowrap text-base font-extrabold tracking-tight text-navy-700">
                YBA CHỢ LỚN
              </span>
              <span className="hidden whitespace-nowrap text-[11px] text-slate-500 sm:block">
                Hội Doanh nhân trẻ TP.HCM
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 xl:flex">
            {MENU_CHINH.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={lopMuc(isActive(it.href))}
              >
                {it.label}
              </Link>
            ))}

            <div className="relative" ref={themRef}>
              <button
                onClick={() => setMoThem((v) => !v)}
                aria-expanded={moThem}
                aria-haspopup="true"
                className={`${lopMuc(themDangMo || moThem)} inline-flex items-center gap-1`}
              >
                Thêm
                {/* Mũi tên vẽ bằng SVG chứ không dùng ký tự ▼: ký tự phải thu
                    xuống 10px mới cân, mà cỡ đó là dưới ngưỡng đọc được trên
                    điện thoại (npm run test:dienthoai bắt lỗi này). */}
                <svg
                  viewBox="0 0 12 12"
                  aria-hidden="true"
                  className={`h-3 w-3 shrink-0 fill-none stroke-current stroke-2 transition-transform ${
                    moThem ? "rotate-180" : ""
                  }`}
                >
                  <path
                    d="M2.5 4.5 6 8l3.5-3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {moThem && (
                <div className="absolute left-0 top-full z-40 mt-1 w-72 overflow-hidden rounded-xl border border-navy-100 bg-white py-1.5 shadow-xl">
                  {MENU_THEM.map((it) => (
                    <Link
                      key={it.href}
                      href={it.href}
                      prefetch={it.href === NGOI_NHA ? false : undefined}
                      className={`block px-4 py-2.5 transition ${
                        isActive(it.href) ? "bg-navy-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-navy-800">
                        {it.label}
                      </span>
                      {it.mo && (
                        <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                          {it.mo}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {/* Tìm kiếm luôn là nút kính lúp (trang /tim-kiem có ô nhập). Ô
                nhập ngay trên thanh từng hiện ở 2xl nhưng thanh không đủ chỗ
                — đo thật thì cụm nút phải lấn ra ngoài khung ~190px. */}
            <Link
              href="/tim-kiem"
              aria-label="Tìm kiếm"
              title="Tìm kiếm"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-navy-700"
            >
              🔍
            </Link>

            <Link
              href="/hoi-ai"
              title="Hỏi trợ lý AI về Chi hội"
              aria-label="Hỏi trợ lý AI về Chi hội"
              className="hidden h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-navy-700 sm:inline-flex"
            >
              <span aria-hidden="true">✨</span>
              {/* Nhãn chỉ hiện khi thanh menu ngang còn ẩn (lg) — từ xl hết chỗ */}
              <span className="hidden lg:inline xl:hidden">Hỏi AI</span>
            </Link>

            {/* Lối vào game hội viên. Từ lg: ở lg thanh menu ngang đang ẩn nên
                dư chỗ, ở xl đã đo đủ chỗ trong khung max-w-7xl. prefetch tắt:
                /ngoi-nha là trang động nặng và khách chưa đăng nhập bị chuyển
                sang /login — nạp trước là tốn công vô ích. */}
            <Link
              href={NGOI_NHA}
              prefetch={false}
              title="Ngôi nhà Chợ Lớn — game dành cho hội viên"
              className="hidden h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-navy-950 px-3 text-sm font-semibold text-white ring-1 ring-vang-400/60 transition hover:bg-navy-800 lg:inline-flex"
            >
              <BieuTuong ten="nha" className="h-4 w-4 shrink-0 text-vang-400" />
              Ngôi nhà
            </Link>

            {userName ? (
              <Link
                href="/tai-khoan"
                className="hidden max-w-[10rem] shrink-0 truncate whitespace-nowrap rounded-full bg-navy-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700 sm:inline-block"
              >
                {userName}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden shrink-0 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition hover:text-navy-700 md:inline-flex"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/dang-ky-hoi-vien"
                  className="hidden shrink-0 whitespace-nowrap rounded-full bg-do-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-do-700 sm:inline-block"
                >
                  Gia nhập
                </Link>
              </>
            )}

            <button
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 xl:hidden"
              aria-label="Mở menu"
              aria-expanded={open}
            >
              {open ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {open && (
          <nav className="grid gap-1 border-t border-navy-100 py-3 xl:hidden">
            <form action="/tim-kiem" className="mb-2 flex gap-2">
              <input
                name="q"
                placeholder="Tìm doanh nghiệp, sự kiện…"
                aria-label="Tìm trên toàn trang"
                className="inp min-h-11 flex-1"
              />
              <button className="btn-ghost min-h-11 shrink-0 px-4">Tìm</button>
            </form>
            <Link
              href="/hoi-ai"
              onClick={() => setOpen(false)}
              className="mb-1 flex min-h-11 items-center gap-2 rounded-lg bg-navy-50 px-3 py-2.5 text-sm font-semibold text-navy-700"
            >
              <span aria-hidden="true">✨</span> Hỏi trợ lý AI về Hội
            </Link>
            <Link
              href={NGOI_NHA}
              prefetch={false}
              onClick={() => setOpen(false)}
              className="mb-1 flex min-h-11 items-center gap-2 rounded-lg bg-navy-950 px-3 py-2.5 text-sm font-semibold text-white"
            >
              <BieuTuong ten="nha" className="h-4 w-4 shrink-0 text-vang-400" />
              Ngôi nhà Chợ Lớn
              <span className="ml-auto text-xs font-medium text-white/70">
                Game hội viên
              </span>
            </Link>
            {/* /ngoi-nha đã có hàng nổi bật ngay trên — bỏ khỏi danh sách để khỏi lặp */}
            {MAIN_MENU.filter((it) => it.href !== NGOI_NHA).map((it) => (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                // min-h-11 = 44px — cỡ tối thiểu để bấm trúng bằng ngón tay
                className={`flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive(it.href)
                    ? "bg-navy-50 text-navy-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {it.label}
              </Link>
            ))}
            <div className="mt-2 grid gap-2 border-t border-navy-100 pt-3">
              <Link
                href={userName ? "/tai-khoan" : "/login"}
                onClick={() => setOpen(false)}
                className="btn-ghost min-h-11 w-full"
              >
                {userName ? `Khu hội viên · ${userName}` : "Đăng nhập hội viên"}
              </Link>
              {!userName && (
                <Link
                  href="/dang-ky-hoi-vien"
                  onClick={() => setOpen(false)}
                  className="btn-danger min-h-11 w-full"
                >
                  Gia nhập Chi hội
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
