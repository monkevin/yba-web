import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { PUBLIC_MEMBER, publicListing } from "@/lib/public";
import { SITE } from "@/lib/site";
import { thamCongKhai } from "@/lib/tham-dn";

/**
 * Sơ đồ trang cho máy tìm kiếm. Chỉ liệt kê đường dẫn CÔNG KHAI — khu hội viên
 * và khu quản trị không được vào đây.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const goc = SITE.url;

  const [
    members,
    listings,
    events,
    posts,
    awardPeriods,
    lichHoatDong,
    chuyenTham,
    nhanSu,
    coDieuLe,
  ] = await Promise.all([
    prisma.member.findMany({
      where: PUBLIC_MEMBER,
      select: { slug: true, updatedAt: true },
    }),
    prisma.listing.findMany({
      where: publicListing(),
      select: { slug: true, updatedAt: true },
    }),
    prisma.event.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.post.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.awardPeriod.count({ where: { published: true } }),
    prisma.lichHoatDong.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.thamDoanhNghiep.findMany({
      where: thamCongKhai(),
      select: { slug: true, updatedAt: true },
    }),
    // Trang chân dung từng nhân sự — chỉ người có slug
    prisma.leader.findMany({
      where: { active: true, slug: { not: null } },
      select: { slug: true },
    }),
    // /dieu-le chỉ tồn tại khi Ban Chủ nhiệm đã soạn nội dung
    prisma.page.count({ where: { slug: "dieu-le" } }),
  ]);

  const coDinh: MetadataRoute.Sitemap = [
    { url: goc, changeFrequency: "daily", priority: 1 },
    { url: `${goc}/lich-hoat-dong`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${goc}/tai-tro`, changeFrequency: "monthly", priority: 0.7 },
    {
      url: `${goc}/tham-doanh-nghiep`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    { url: `${goc}/dat-lich`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${goc}/hoi-ai`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${goc}/video`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${goc}/who-am-i`, changeFrequency: "monthly", priority: 0.6 },
    // Landing sự kiện 10/10 — cũng chạy ở 1010.ybacholon.vn
    { url: `${goc}/1010`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${goc}/gioi-thieu`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${goc}/ban-chap-hanh`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${goc}/doanh-nghiep`, changeFrequency: "daily", priority: 0.9 },
    { url: `${goc}/giao-thuong`, changeFrequency: "daily", priority: 0.9 },
    {
      url: `${goc}/xuc-tien-thuong-mai`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    { url: `${goc}/su-kien`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${goc}/dau-gia`, changeFrequency: "daily", priority: 0.7 },
    { url: `${goc}/tin-tuc`, changeFrequency: "weekly", priority: 0.8 },
    {
      url: `${goc}/dang-ky-hoi-vien`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    { url: `${goc}/lien-he`, changeFrequency: "monthly", priority: 0.6 },
    {
      url: `${goc}/huong-dan-dang-nhap`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${goc}/mini-app/dieu-khoan`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  if (coDieuLe > 0) {
    coDinh.push({
      url: `${goc}/dieu-le`,
      changeFrequency: "yearly",
      priority: 0.5,
    });
  }

  if (awardPeriods > 0) {
    coDinh.push({
      url: `${goc}/vinh-danh`,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return [
    ...coDinh,
    ...members.map((m) => ({
      url: `${goc}/doanh-nghiep/${m.slug}`,
      lastModified: m.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...listings.map((l) => ({
      url: `${goc}/giao-thuong/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...events.map((e) => ({
      url: `${goc}/su-kien/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...posts.map((p) => ({
      url: `${goc}/tin-tuc/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...lichHoatDong.map((l) => ({
      url: `${goc}/lich-hoat-dong/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...chuyenTham.map((t) => ({
      url: `${goc}/tham-doanh-nghiep/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...nhanSu.map((n) => ({
      url: `${goc}/ban-chap-hanh/${n.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
