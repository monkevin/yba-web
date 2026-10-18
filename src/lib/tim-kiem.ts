/**
 * Tìm kiếm chung cho toàn bộ khu công khai.
 *
 * Gom kết quả từ mọi nơi người xem có thể quan tâm: hội viên, tin mua/bán,
 * sự kiện, tin tức, lịch hoạt động, Ban Chủ nhiệm, video, chương trình tài trợ.
 *
 * Nguyên tắc:
 *  - Chỉ trả về thứ ĐANG CÔNG KHAI — dùng lại `PUBLIC_MEMBER` / `publicListing()`
 *    thay vì tự viết điều kiện lọc, để không lỡ tay để lộ hồ sơ đang ẩn.
 *  - Tìm được cả khi gõ không dấu: bảng nào có sẵn cột `searchText` thì tìm
 *    trên cột đó, bảng nào không có thì so trên các cột chữ.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PUBLIC_MEMBER, publicListing } from "@/lib/public";
import { normalizeSearch } from "@/lib/search";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { THU_TU_HOI_VIEN, THU_TU_TIN_DANG } from "@/lib/xep-hang";

export type KetQuaTim = {
  nhom: string;
  icon: string;
  href: string;
  tieuDe: string;
  moTa: string;
  phu?: string;
};

export type NhomKetQua = {
  ten: string;
  icon: string;
  tatCa?: string;
  muc: KetQuaTim[];
};

/** Cắt bớt cho gọn thẻ kết quả, không cắt giữa chữ. */
function gonLai(s: string | null | undefined, n = 150): string {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return t.slice(0, t.lastIndexOf(" ", n) > 0 ? t.lastIndexOf(" ", n) : n) + "…";
}

/**
 * SQLite trong Prisma không có `mode: "insensitive"`, nhưng cột `searchText`
 * đã lưu sẵn dạng thường không dấu nên so thẳng là đủ.
 */
function chuaChu(truong: string, khoa: string): Prisma.StringFilter {
  return { contains: khoa };
}

export async function timKiemToanWeb(tuKhoa: string): Promise<{
  soKetQua: number;
  nhom: NhomKetQua[];
}> {
  const q = tuKhoa.trim();
  const khoa = normalizeSearch(q);
  if (khoa.length < 2) return { soKetQua: 0, nhom: [] };

  const [hoiVien, tinDang, suKien, tinTuc, lichHD, banCN, video, duAn] =
    await Promise.all([
      prisma.member.findMany({
        where: { ...PUBLIC_MEMBER, searchText: chuaChu("searchText", khoa) },
        orderBy: THU_TU_HOI_VIEN,
        take: 8,
        select: {
          slug: true,
          company: true,
          name: true,
          position: true,
          intro: true,
          district: true,
          category: { select: { name: true, icon: true } },
        },
      }),

      prisma.listing.findMany({
        where: { ...publicListing(), searchText: chuaChu("searchText", khoa) },
        orderBy: THU_TU_TIN_DANG,
        take: 8,
        select: {
          slug: true,
          title: true,
          summary: true,
          type: true,
          location: true,
          member: { select: { company: true } },
        },
      }),

      // Event chưa có cột searchText nên so trên các cột chữ
      prisma.event.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: q } },
            { summary: { contains: q } },
            { seriesName: { contains: q } },
            { activityGroup: { contains: q } },
            { location: { contains: q } },
          ],
        },
        orderBy: { startAt: "desc" },
        take: 6,
        select: {
          slug: true,
          title: true,
          summary: true,
          startAt: true,
          location: true,
        },
      }),

      prisma.post.findMany({
        where: { published: true, searchText: chuaChu("searchText", khoa) },
        orderBy: { publishedAt: "desc" },
        take: 6,
        select: { slug: true, title: true, excerpt: true, type: true },
      }),

      prisma.lichHoatDong.findMany({
        where: {
          published: true,
          OR: [
            { tieuDe: { contains: q } },
            { moTa: { contains: q } },
            { noiDung: { contains: q } },
            { diaDiem: { contains: q } },
          ],
        },
        orderBy: { tuNgay: "asc" },
        take: 6,
        select: {
          slug: true,
          tieuDe: true,
          moTa: true,
          tuNgay: true,
          diaDiem: true,
        },
      }),

      prisma.leader.findMany({
        where: {
          active: true,
          OR: [
            { name: { contains: q } },
            { title: { contains: q } },
            { company: { contains: q } },
            { position: { contains: q } },
          ],
        },
        orderBy: { order: "asc" },
        take: 6,
        select: {
          slug: true,
          name: true,
          title: true,
          company: true,
          position: true,
        },
      }),

      prisma.video.findMany({
        where: {
          published: true,
          OR: [{ title: { contains: q } }, { summary: { contains: q } }],
        },
        orderBy: { publishedAt: "desc" },
        take: 4,
        select: { title: true, summary: true, youtubeId: true },
      }),

      prisma.duAnTaiTro.findMany({
        where: {
          active: true,
          OR: [
            { ten: { contains: q } },
            { tomTat: { contains: q } },
            { moTa: { contains: q } },
          ],
        },
        take: 4,
        select: { slug: true, ten: true, tomTat: true },
      }),
    ]);

  const ngay = (d: Date) =>
    d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  const nhom: NhomKetQua[] = [
    {
      ten: "Doanh nghiệp hội viên",
      icon: "🏢",
      tatCa: `/doanh-nghiep?q=${encodeURIComponent(q)}`,
      muc: hoiVien.map((m) => ({
        nhom: "Doanh nghiệp hội viên",
        icon: m.category?.icon ?? "🏢",
        href: `/doanh-nghiep/${m.slug}`,
        tieuDe: tenDoanhNghiep(m.company),
        moTa: gonLai(m.intro),
        phu: [m.name, m.position, m.category?.name, m.district]
          .filter(Boolean)
          .join(" · "),
      })),
    },
    {
      ten: "Nhu cầu mua – bán",
      icon: "🤝",
      tatCa: `/giao-thuong?q=${encodeURIComponent(q)}`,
      muc: tinDang.map((l) => ({
        nhom: "Nhu cầu mua – bán",
        icon: l.type === "CAN_MUA" ? "🛒" : "📦",
        href: `/giao-thuong/${l.slug}`,
        tieuDe: l.title,
        moTa: gonLai(l.summary),
        phu: [
          l.type === "CAN_MUA" ? "Cần mua" : "Cần bán",
          l.member ? tenDoanhNghiep(l.member.company) : null,
          l.location,
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    },
    {
      ten: "Sự kiện & chương trình",
      icon: "📅",
      tatCa: "/su-kien",
      muc: suKien.map((e) => ({
        nhom: "Sự kiện & chương trình",
        icon: "📅",
        href: `/su-kien/${e.slug}`,
        tieuDe: e.title,
        moTa: gonLai(e.summary),
        phu: [ngay(e.startAt), e.location].filter(Boolean).join(" · "),
      })),
    },
    {
      ten: "Lịch hoạt động sắp tới",
      icon: "🗓️",
      tatCa: "/lich-hoat-dong",
      muc: lichHD.map((l) => ({
        nhom: "Lịch hoạt động sắp tới",
        icon: "🗓️",
        href: l.slug ? `/lich-hoat-dong/${l.slug}` : "/lich-hoat-dong",
        tieuDe: l.tieuDe,
        moTa: gonLai(l.moTa),
        phu: [ngay(l.tuNgay), l.diaDiem].filter(Boolean).join(" · "),
      })),
    },
    {
      ten: "Ban Chủ nhiệm",
      icon: "👤",
      tatCa: "/ban-chap-hanh",
      muc: banCN.map((b) => ({
        nhom: "Ban Chủ nhiệm",
        icon: "👤",
        href: b.slug ? `/ban-chap-hanh/${b.slug}` : "/ban-chap-hanh",
        tieuDe: b.name,
        moTa: [b.position, b.company].filter(Boolean).join(" · "),
        phu: b.title,
      })),
    },
    {
      ten: "Tin tức & bản tin",
      icon: "📰",
      tatCa: "/tin-tuc",
      muc: tinTuc.map((p) => ({
        nhom: "Tin tức & bản tin",
        icon: "📰",
        href: `/tin-tuc/${p.slug}`,
        tieuDe: p.title,
        moTa: gonLai(p.excerpt),
      })),
    },
    {
      ten: "Video",
      icon: "🎬",
      tatCa: "/video",
      muc: video.map((v) => ({
        nhom: "Video",
        icon: "🎬",
        href: `/video#${v.youtubeId}`,
        tieuDe: v.title,
        moTa: gonLai(v.summary, 120),
      })),
    },
    {
      ten: "Chương trình cần đồng hành",
      icon: "🤲",
      tatCa: "/tai-tro",
      muc: duAn.map((d) => ({
        nhom: "Chương trình cần đồng hành",
        icon: "🤲",
        href: `/tai-tro#${d.slug}`,
        tieuDe: d.ten,
        moTa: gonLai(d.tomTat),
      })),
    },
  ].filter((n) => n.muc.length > 0);

  return { soKetQua: nhom.reduce((s, n) => s + n.muc.length, 0), nhom };
}
