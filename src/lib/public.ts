import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEAL_STATUS } from "@/lib/deal";
import { THU_TU_HOI_VIEN, THU_TU_TIN_DANG } from "@/lib/xep-hang";

/**
 * Truy vấn dùng cho khu CÔNG KHAI. Mọi hàm ở đây phải tự lọc dữ liệu chưa duyệt
 * / đã ẩn — trang gọi nó không cần nhớ điều kiện lọc nữa.
 */

/**
 * Điều kiện chuẩn của một hồ sơ doanh nghiệp được phép hiện ra ngoài.
 *
 * CHO_DUYET vẫn hiển thị — nếu ẩn, mỗi lần hội viên sửa một chữ là trang doanh
 * nghiệp của họ biến mất khỏi ybacholon.vn cho tới khi Ban Chủ nhiệm duyệt.
 * Hội viên đều là người có danh tính rõ ràng nên rủi ro thấp, còn trang 404 giữa
 * chừng thì rất khó chịu. Ban Chủ nhiệm vẫn kiểm soát được: bấm "Trả lại" ở
 * /quan-tri/ho-so sẽ đưa hồ sơ về NHAP và ẩn ngay khỏi công khai.
 */
export const PUBLIC_MEMBER: Prisma.MemberWhereInput = {
  active: true,
  publicVisible: true,
  profileStatus: { in: ["DA_DUYET", "CHO_DUYET"] },
};

/**
 * Điều kiện chuẩn của một tin mua/bán được phép hiện ra ngoài: đang hiển thị,
 * chưa quá hạn, và doanh nghiệp đăng tin cũng đang hiện công khai.
 */
/// Là HÀM chứ không phải hằng vì có so sánh với thời điểm hiện tại — nếu để
/// hằng, mốc thời gian sẽ đứng yên ở lúc máy chủ khởi động.
export function publicListing(): Prisma.ListingWhereInput {
  return {
    status: "DANG_HIEN",
    OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    member: { active: true, publicVisible: true },
  };
}

/** Bốn con số lớn trên trang chủ. Tính trên toàn bộ giao dịch ĐÃ DUYỆT. */
export async function homeStats() {
  const [members, agg, deals, events] = await Promise.all([
    prisma.member.count({ where: PUBLIC_MEMBER }),
    prisma.deal.aggregate({
      where: { status: DEAL_STATUS.DA_DUYET },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.deal.findMany({
      where: { status: DEAL_STATUS.DA_DUYET },
      select: { sellerId: true, buyerId: true },
    }),
    prisma.event.count({ where: { published: true } }),
  ]);

  // Số "kết nối" = số cặp doanh nghiệp khác nhau từng giao dịch với nhau
  const pairs = new Set(
    deals.map((d) => [d.sellerId, d.buyerId].sort().join("|"))
  );

  return {
    members,
    dealTotal: agg._sum.amount ?? 0,
    dealCount: agg._count._all,
    connections: pairs.size,
    events,
  };
}

/** Doanh nghiệp tiêu biểu hiện ở trang chủ. */
export function featuredMembers(take = 8) {
  return prisma.member.findMany({
    where: { ...PUBLIC_MEMBER, featured: true },
    orderBy: THU_TU_HOI_VIEN,
    take,
    select: {
      id: true,
      slug: true,
      name: true,
      company: true,
      position: true,
      industry: true,
      district: true,
      logo: true,
      avatar: true,
      intro: true,
      category: { select: { name: true, icon: true } },
    },
  });
}

/** Tin nhu cầu mua/bán mới nhất. `type` bỏ trống = lấy cả hai loại. */
export function latestListings(take = 6, type?: "CAN_MUA" | "CAN_BAN") {
  return prisma.listing.findMany({
    where: { ...publicListing(), ...(type ? { type } : {}) },
    orderBy: THU_TU_TIN_DANG,
    take,
    select: {
      id: true,
      slug: true,
      type: true,
      title: true,
      summary: true,
      priceText: true,
      location: true,
      images: true,
      createdAt: true,
      category: { select: { name: true, icon: true } },
      member: { select: { slug: true, company: true, logo: true } },
    },
  });
}

/** Sự kiện sắp diễn ra; nếu không còn sự kiện tương lai thì lấy các kỳ gần nhất. */
export async function upcomingEvents(take = 3) {
  const now = new Date();
  const next = await prisma.event.findMany({
    where: { published: true, startAt: { gte: now } },
    orderBy: { startAt: "asc" },
    take,
  });
  if (next.length) return { events: next, upcoming: true };

  const recent = await prisma.event.findMany({
    where: { published: true },
    orderBy: { startAt: "desc" },
    take,
  });
  return { events: recent, upcoming: false };
}

/** Tin tức mới nhất đã xuất bản. */
export function latestPosts(take = 3) {
  return prisma.post.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      type: true,
    },
  });
}

/** Danh mục ngành nghề đang dùng, kèm số doanh nghiệp mỗi ngành. */
export async function categoriesWithCount() {
  const cats = await prisma.category.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      icon: true,
      _count: { select: { members: true } },
    },
  });
  return cats;
}

/**
 * Ảnh hoạt động lấy từ album các sự kiện đã đăng — dùng để trang chủ và các
 * trang giới thiệu có hình thật của Chi hội thay vì chỉ toàn chữ.
 *
 * Mỗi sự kiện chỉ góp tối đa 2 ảnh để dải ảnh không bị một chương trình chiếm hết.
 */
export async function anhHoatDong(take = 8) {
  const events = await prisma.event.findMany({
    where: { published: true, gallery: { not: null } },
    orderBy: { startAt: "desc" },
    take: 40,
    select: { slug: true, title: true, gallery: true, startAt: true },
  });

  const ra: { src: string; slug: string; title: string }[] = [];
  for (const e of events) {
    let ds: string[] = [];
    try {
      const a = JSON.parse(e.gallery ?? "[]");
      ds = Array.isArray(a) ? a.filter((x) => typeof x === "string") : [];
    } catch {
      ds = [];
    }
    for (const src of ds.slice(0, 2)) {
      ra.push({ src, slug: e.slug, title: e.title });
      if (ra.length >= take) return ra;
    }
  }
  return ra;
}

/** Video nổi bật để nhúng ở trang chủ. */
export function videoNoiBat() {
  return prisma.video.findFirst({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    select: { youtubeId: true, title: true, summary: true },
  });
}

/** Ảnh đầu tiên trong chuỗi JSON `images` / `gallery`, null nếu không có. */
export function firstImage(json: string | null | undefined): string | null {
  if (!json) return null;
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) && typeof arr[0] === "string" ? arr[0] : null;
  } catch {
    return null;
  }
}
