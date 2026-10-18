import { prisma } from "@/lib/prisma";
import { PUBLIC_MEMBER, publicListing } from "@/lib/public";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { moJson, moOptions } from "@/lib/mobile-cors";
import { docHoiVien } from "@/lib/mobile-auth";
import { laBanChuNhiem, nhanChucDanh } from "@/lib/vai-tro-hoi";

export const OPTIONS = moOptions;

/**
 * Hồ sơ doanh nghiệp công khai — cùng dữ liệu với /doanh-nghiep/[slug] trên web.
 * GET /api/mobile/hoi-vien/:slug
 *
 * Số điện thoại, email và mã người dùng Zalo CHỈ trả cho người ĐÃ xác thực hội
 * viên — đúng quy tắc "trang công khai không để lộ liên hệ hội viên" trong
 * AGENTS.md. Khách vãng lai vẫn xem được toàn bộ phần giới thiệu doanh nghiệp.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const nguoiXem = await docHoiVien(req);

  const m = await prisma.member.findFirst({
    where: { slug, ...PUBLIC_MEMBER },
    select: {
      slug: true,
      code: true,
      name: true,
      salutation: true,
      company: true,
      position: true,
      hoiRole: true,
      memberType: true,
      industry: true,
      district: true,
      website: true,
      facebook: true,
      zalo: true,
      linkedin: true,
      youtube: true,
      videoUrl: true,
      logo: true,
      avatar: true,
      coverImage: true,
      gallery: true,
      intro: true,
      description: true,
      capabilities: true,
      services: true,
      offering: true,
      needing: true,
      toiGiupGi: true,
      toiCanGi: true,
      toiMuonGap: true,
      history: true,
      foundedYear: true,
      headcount: true,
      taxCode: true,
      pressLinks: true,
      joinedAt: true,
      category: { select: { name: true, slug: true, icon: true } },
      chapter: { select: { name: true } },
      // Huy hiệu vinh danh (mục 10) — chỉ lấy từ kỳ đã công bố
      awards: {
        where: { period: { published: true } },
        orderBy: [{ rank: "asc" }],
        take: 6,
        select: {
          category: true,
          rank: true,
          metric: true,
          period: { select: { name: true } },
        },
      },
      products: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true, summary: true, priceText: true, image: true },
      },
      listings: {
        where: publicListing(),
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          slug: true,
          type: true,
          title: true,
          summary: true,
          priceText: true,
          location: true,
          images: true,
          createdAt: true,
          category: { select: { name: true, icon: true } },
        },
      },
    },
  });

  if (!m) return moJson({ error: "Không tìm thấy doanh nghiệp" }, 404);

  // Liên hệ chỉ mở cho hội viên đã xác thực
  let lienHe: { phone: string | null; email: string | null; zaloUserId: string | null } = {
    phone: null,
    email: null,
    zaloUserId: null,
  };
  if (nguoiXem) {
    const rieng = await prisma.member.findUnique({
      where: { slug },
      select: { id: true, phone: true, email: true },
    });
    // Mã người dùng Zalo lấy từ phiên đăng nhập gần nhất của chính họ trên
    // Mini App — ai chưa từng mở app thì không có, khi đó chỉ hiện nút gọi.
    const phien = rieng
      ? await prisma.phienMiniApp.findFirst({
          where: { memberId: rieng.id, zaloUserId: { not: null } },
          orderBy: { lanCuoi: "desc" },
          select: { zaloUserId: true },
        })
      : null;
    lienHe = {
      phone: rieng?.phone ?? null,
      email: rieng?.email ?? null,
      zaloUserId: phien?.zaloUserId ?? null,
    };
  }

  return moJson({
    laHoiVien: !!nguoiXem,
    member: {
      ...m,
      company: tenDoanhNghiep(m.company),
      chucDanh: nhanChucDanh(m.hoiRole),
      laBanChuNhiem: laBanChuNhiem(m.hoiRole),
      ...lienHe,
    },
  });
}
