import type { Metadata } from "next";
import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import { laNguoiVanHanh } from "@/lib/ngoi-nha/chay-action";
import { co, QUYEN } from "@/lib/quyen";
import BieuTuong from "@/components/ngoi-nha/BieuTuong";
import NutAmThanh from "@/components/ngoi-nha/NutAmThanh";
import ThanhDuoi from "@/components/ngoi-nha/ThanhDuoi";
import "./ngoi-nha.css";

export const metadata: Metadata = {
  title: "Ngôi nhà Chợ Lớn",
  description:
    "Game onboarding hội viên YBA Chợ Lớn — Biết, Bạn, Bàn, Bán, Vươn tầm.",
  robots: { index: false, follow: false },
};

/**
 * Khung riêng cho game: nền đêm navy, thanh trên gọn, thanh dưới kiểu ứng dụng
 * (ẩn khi đang chơi trạm). Không dùng Nav của khu hội viên để màn chơi rộng.
 *
 * Ban Điều hành tạm dừng game → hội viên chỉ thấy màn bảo trì (server action đã
 * bị chặn riêng trong `chay()`); người vận hành vẫn vào được để thử trước khi mở
 * lại, kèm dải nhắc để khỏi quên.
 */
export default async function NgoiNhaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, tinhNang] = await Promise.all([
    requireUserPage(),
    docTinhNang(),
  ]);
  const vanHanh = laNguoiVanHanh(user);
  const baoTri = tinhNang.tamDung && !vanHanh;

  return (
    <div className="nn-nen min-h-dvh flex-1">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-navy-950/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-4">
          <Link
            href="/tai-khoan"
            className="flex min-h-11 items-center gap-2 rounded-lg pr-2 text-sm text-white/70 hover:text-white"
            title="Về khu hội viên"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-yba-cholon.png"
              alt="YBA Chợ Lớn"
              className="h-8 w-8"
            />
            <span className="hidden sm:inline">Khu hội viên</span>
          </Link>
          <Link href="/ngoi-nha" className="text-center leading-none">
            <span className="chu-tieu-de block text-lg tracking-wide text-white">
              Ngôi nhà Chợ Lớn
            </span>
            <span className="text-[11px] uppercase tracking-[0.25em] text-son-300">
              Tình Huynh Đệ
            </span>
          </Link>
          <NutAmThanh />
        </div>
        {tinhNang.tamDung && vanHanh && (
          <div className="bg-vang-500 px-4 py-1.5 text-center text-xs font-semibold text-navy-900">
            Game đang tạm dừng với hội viên — bạn vẫn vào được vì là người vận
            hành.{" "}
            {/* Chỉ người có quyền cài đặt mới mở lại được ở tab Bật / tắt */}
            {co(user, QUYEN.NGOI_NHA_CAI_DAT) ? (
              <Link
                href="/quan-tri/ngoi-nha?tab=tinh-nang"
                className="underline underline-offset-2"
              >
                Mở lại
              </Link>
            ) : (
              "Người có quyền cài đặt game sẽ mở lại."
            )}
          </div>
        )}
      </header>

      {baoTri ? (
        <main className="mx-auto flex max-w-md flex-col items-center px-4 pb-16 pt-16 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-son-600 text-white ring-4 ring-white/15">
            <BieuTuong ten="dong-ho" className="h-10 w-10" />
          </span>
          <h1 className="mt-6 text-2xl leading-tight">Tạm dừng một chút</h1>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-white/80">
            {tinhNang.thongBaoTamDung}
          </p>
          <Link
            href="/tai-khoan"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-base font-bold text-navy-900 hover:bg-white/90"
          >
            <BieuTuong ten="quay-lai" className="h-4 w-4" /> Về Khu hội viên
          </Link>
        </main>
      ) : (
        <>
          <div className="pb-24">{children}</div>
          <ThanhDuoi
            dauTruong={tinhNang.dauTruong}
            nhiemVu={tinhNang.nhiemVu}
          />
        </>
      )}
    </div>
  );
}
