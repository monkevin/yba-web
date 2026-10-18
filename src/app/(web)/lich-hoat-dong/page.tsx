import Link from "next/link";
import type { Metadata } from "next";
import LichHoatDong from "@/components/web/LichHoatDong";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import HienDan from "@/components/web/HienDan";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lịch hoạt động sắp tới",
  description: `Lịch trình các chương trình, sự kiện sắp diễn ra của ${SITE.fullName} và Hội Doanh nhân trẻ TP.HCM.`,
};

export default async function TrangLichHoatDong() {
  // Hoạt động của hôm nay vẫn còn ý nghĩa nên tính từ đầu ngày
  const dauNgay = new Date();
  dauNgay.setHours(0, 0, 0, 0);

  const [sapToi, daQua] = await Promise.all([
    prisma.lichHoatDong.findMany({
      where: { published: true, tuNgay: { gte: dauNgay } },
      orderBy: [{ tuNgay: "asc" }, { order: "asc" }],
    }),
    prisma.lichHoatDong.findMany({
      where: { published: true, tuNgay: { lt: dauNgay } },
      orderBy: { tuNgay: "desc" },
      take: 12,
    }),
  ]);

  return (
    <>
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-14 text-white">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-do-600/25 blur-2xl"
        />
        <div className="wrap relative">
          <p className="eyebrow text-do-300">Kết nối – Hợp tác – Phát triển bền vững</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Lịch hoạt động {SITE.name}
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-white/85">
            Toàn bộ chương trình sắp diễn ra của Chi hội, của Hội Doanh nhân trẻ
            TP.HCM và các đối tác — để anh chị chủ động thu xếp lịch tham dự.
          </p>
        </div>
      </section>

      <div className="wrap py-10">
        <HienDan the="section">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-xl font-bold text-navy-800">
              Sắp diễn ra
              <span className="ml-2 text-sm font-normal text-slate-500">
                {sapToi.length} hoạt động
              </span>
            </h2>
            <Link
              href="/su-kien"
              className="text-sm font-semibold text-navy-600 hover:text-do-600"
            >
              Xem hình ảnh sự kiện đã tổ chức →
            </Link>
          </div>
          <div className="mt-5">
            <LichHoatDong ds={sapToi} />
          </div>
        </HienDan>

        {daQua.length > 0 && (
          <HienDan the="section" className="mt-14">
            <h2 className="text-xl font-bold text-navy-800">Vừa diễn ra</h2>
            <div className="mt-5 opacity-75">
              <LichHoatDong ds={daQua} gonGang />
            </div>
          </HienDan>
        )}

        <div className="mt-12 rounded-2xl bg-navy-50 p-6 text-center">
          <p className="font-bold text-navy-800">
            Muốn tham gia cùng Chi hội?
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            Hội viên nhận thông báo chi tiết qua nhóm Chi hội. Doanh nhân quan
            tâm có thể liên hệ Ban Chủ nhiệm để được mời tham dự.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/dat-lich" className="btn-primary">
              Đặt lịch gặp Ban Chủ nhiệm
            </Link>
            <Link href="/dang-ky-hoi-vien" className="btn-ghost">
              Đăng ký hội viên
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
