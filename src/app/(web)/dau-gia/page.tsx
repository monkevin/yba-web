import type { Metadata } from "next";
import Link from "next/link";
import HienDan from "@/components/web/HienDan";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import { nhanMucDich } from "../../(noi-bo)/uu-dai/muc-dich";

/**
 * TRANG ĐẤU GIÁ CÔNG KHAI (Chủ tịch chốt 25/09/2026): ai cũng xem được
 * các phiên BTC đánh dấu "công khai" — vật phẩm, mục đích (thiện nguyện /
 * gây quỹ Chi hội / cá nhân trích %), giá đang đấu và người giữ giá — để
 * lan toả và minh bạch. TRẢ GIÁ là đặc quyền hội viên: nút đưa về đăng
 * nhập rồi vào khu nội bộ /uu-dai?tab=daugia.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Đấu giá thiện nguyện & gây quỹ",
  description: `Các phiên đấu giá thiện nguyện và gây quỹ của ${SITE.fullName} — công khai diễn biến, hội viên đăng nhập để trả giá.`,
};

function vnd(x: number | null | undefined): string {
  return x ? x.toLocaleString("vi-VN") + "đ" : "";
}

export default async function DauGiaCongKhai() {
  const now = new Date();
  const phien = await prisma.hotDeal.findMany({
    where: { loai: "DAU_GIA", an: false, congKhai: true },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { traGia: { orderBy: { soTien: "desc" }, take: 3 } },
  });
  const dangMo = phien.filter((h) => !h.denNgay || h.denNgay > now);
  const daChot = phien.filter((h) => h.denNgay && h.denNgay <= now);

  // Tên sự kiện gắn với từng phiên
  const slugs = [...new Set(phien.map((h) => h.suKienSlug).filter(Boolean))] as string[];
  const lich = slugs.length
    ? await prisma.lichHoatDong.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true, tieuDe: true },
      })
    : [];
  const tenSuKien = new Map(lich.map((l) => [l.slug, l.tieuDe]));

  const The = ({ h, ketThuc }: { h: (typeof phien)[number]; ketThuc: boolean }) => {
    const caoNhat = h.traGia[0];
    const md = nhanMucDich(h);
    return (
      <div className={`card p-5 ${ketThuc ? "opacity-75" : ""}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-lg font-bold text-navy-800">🔨 {h.tieuDe}</p>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              ketThuc ? "bg-slate-100 text-slate-500" : "bg-do-600 text-white"
            }`}
          >
            {ketThuc
              ? "Đã kết thúc"
              : `Đến ${h.denNgay?.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}`}
          </span>
        </div>
        <p className="mt-1.5 flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${md.lop}`}>
            {md.nhan}
          </span>
          {h.suKienSlug && tenSuKien.get(h.suKienSlug) && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              📅 {tenSuKien.get(h.suKienSlug)}
            </span>
          )}
        </p>
        {h.moTa && (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{h.moTa}</p>
        )}
        <div className="mt-3 rounded-xl bg-navy-50 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">
            {ketThuc ? "Giá chốt" : "Giá cao nhất hiện tại"}
          </p>
          <p className="mt-0.5 text-2xl font-extrabold text-do-600">
            {vnd(caoNhat?.soTien ?? h.giaKhoiDiem)}
          </p>
          {caoNhat && (
            <p className="text-sm text-slate-600">
              {ketThuc ? "🏆 " : ""}
              {caoNhat.tenHien}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Khởi điểm {vnd(h.giaKhoiDiem)} · bước giá {vnd(h.buocGia)}
            {h.traGia.length > 0 && ` · ${h.traGia.length}+ lượt trả giá`}
          </p>
        </div>
        {ketThuc && caoNhat && h.mucDich === "CA_NHAN" && (
          <p className="mt-2 text-sm font-bold text-emerald-700">
            Trích {h.trichPhanTram ?? 0}% ={" "}
            {vnd(Math.round((caoNhat.soTien * (h.trichPhanTram ?? 0)) / 100))} về
            quỹ Chi hội.
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-14 text-white">
        <div className="wrap relative">
          <p className="eyebrow text-do-300">Chung tay vì cộng đồng</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Đấu giá thiện nguyện &amp; gây quỹ
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-white/85">
            Các phiên đấu giá do {SITE.fullName} tổ chức — công khai diễn biến
            để mọi người cùng theo dõi. Trả giá là đặc quyền của hội viên đã
            đăng nhập.
          </p>
          <Link
            href="/login?tiep=/uu-dai?tab=daugia"
            className="btn-cta mt-6 inline-flex"
          >
            Hội viên đăng nhập để trả giá →
          </Link>
        </div>
      </section>

      <div className="wrap py-10">
        {dangMo.length > 0 && (
          <HienDan the="section">
            <h2 className="section-title">Đang diễn ra</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {dangMo.map((h) => (
                <The key={h.id} h={h} ketThuc={false} />
              ))}
            </div>
          </HienDan>
        )}

        {daChot.length > 0 && (
          <HienDan the="section" className="mt-12">
            <h2 className="section-title">Đã chốt</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {daChot.map((h) => (
                <The key={h.id} h={h} ketThuc />
              ))}
            </div>
          </HienDan>
        )}

        {phien.length === 0 && (
          <p className="card p-10 text-center text-slate-500">
            Chưa có phiên đấu giá công khai nào — anh/chị theo dõi fanpage Chi
            hội để đón phiên gần nhất.
          </p>
        )}
      </div>
    </>
  );
}
