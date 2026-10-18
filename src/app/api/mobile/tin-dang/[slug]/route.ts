import { prisma } from "@/lib/prisma";
import { publicListing, PUBLIC_MEMBER } from "@/lib/public";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { moJson, moOptions } from "@/lib/mobile-cors";
import { docHoiVien } from "@/lib/mobile-auth";
import { DIEU_KIEN } from "@/lib/listing";
import { NGUONG_PHU_HOP, doPhuHop } from "@/lib/do-phu-hop";
import { THU_TU_HOI_VIEN } from "@/lib/xep-hang";
import { nhanChucDanh } from "@/lib/vai-tro-hoi";

export const OPTIONS = moOptions;

const docMang = (s: string | null) => {
  if (!s) return [];
  try {
    const a = JSON.parse(s);
    return Array.isArray(a) ? a.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
};

/** Chi tiết một tin chợ nhu cầu. GET /api/mobile/tin-dang/:slug */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const t = await prisma.listing.findFirst({
    where: { slug, ...publicListing() },
    select: {
      slug: true,
      type: true,
      title: true,
      summary: true,
      description: true,
      priceText: true,
      quantity: true,
      location: true,
      images: true,
      nganSach: true,
      hanBaoGia: true,
      yeuCau: true,
      dieuKien: true,
      createdAt: true,
      categoryId: true,
      category: { select: { name: true, icon: true, slug: true } },
      member: {
        select: {
          id: true,
          slug: true,
          name: true,
          company: true,
          logo: true,
          avatar: true,
          district: true,
          industry: true,
          hoiRole: true,
          zalo: true,
          phone: true,
        },
      },
      _count: { select: { contacts: true } },
    },
  });

  if (!t) return moJson({ error: "Không tìm thấy tin đăng" }, 404);

  const member = await docHoiVien(req);

  // Mã người dùng Zalo của chủ tin — chỉ tra khi người xem đã xác thực hội viên
  const zaloUserIdCuaChu = member
    ? (
        await prisma.phienMiniApp.findFirst({
          where: { memberId: t.member.id, zaloUserId: { not: null } },
          orderBy: { lanCuoi: "desc" },
          select: { zaloUserId: true },
        })
      )?.zaloUserId ?? null
    : null;

  // Độ phù hợp của CHÍNH NGƯỜI ĐANG XEM với tin này
  const toi = member
    ? await prisma.member.findUnique({
        where: { id: member.id },
        select: {
          categoryId: true, district: true, offering: true,
          services: true, needing: true, toiGiupGi: true, toiCanGi: true,
        },
      })
    : null;

  const pv = toi
    ? doPhuHop(
        {
          type: t.type, categoryId: t.categoryId, title: t.title,
          summary: t.summary, description: t.description,
          memberDistrict: t.member.district,
        },
        toi
      )
    : null;

  /**
   * "Hội viên phù hợp" — gợi ý người trong Chi hội có thể đáp ứng tin này.
   * Chấm bằng cùng thuật toán, KHÔNG bịa danh sách: chỉ lấy người thật sự
   * vượt ngưỡng. Không ai đạt thì trả mảng rỗng, màn hình ẩn hẳn khối đó.
   */
  const ungVien = await prisma.member.findMany({
    where: {
      ...PUBLIC_MEMBER,
      id: { not: t.member.id },
      OR: [
        { categoryId: t.categoryId ?? undefined },
        { offering: { not: null } },
      ],
    },
    orderBy: THU_TU_HOI_VIEN,
    take: 60,
    select: {
      slug: true, name: true, company: true, avatar: true, logo: true,
      categoryId: true, district: true, offering: true, services: true,
      needing: true, toiGiupGi: true, toiCanGi: true,
      category: { select: { name: true } },
    },
  });

  const goiY = ungVien
    .map((m) => {
      const d = doPhuHop(
        {
          type: t.type, categoryId: t.categoryId, title: t.title,
          summary: t.summary, description: t.description,
          memberDistrict: t.member.district,
        },
        m
      );
      return { m, d };
    })
    .filter((x) => x.d.diem >= NGUONG_PHU_HOP)
    .sort((a, b) => b.d.diem - a.d.diem)
    .slice(0, 4)
    .map((x) => ({
      slug: x.m.slug,
      name: x.m.name,
      company: tenDoanhNghiep(x.m.company),
      avatar: x.m.avatar,
      logo: x.m.logo,
      nganh: x.m.category?.name ?? null,
      diem: x.d.diem,
    }));

  const { member: chu, categoryId, _count, ...con } = t;

  return moJson({
    tin: {
      ...con,
      yeuCau: (t.yeuCau ?? "")
        .split(/\r?\n/)
        .map((d) => d.trim())
        .filter((d) => d.length > 1),
      dieuKien: docMang(t.dieuKien)
        .filter((m) => DIEU_KIEN[m])
        .map((m) => ({ ma: m, ten: DIEU_KIEN[m] })),
      soQuanTam: _count.contacts,
      member: {
        slug: chu.slug,
        name: chu.name,
        company: tenDoanhNghiep(chu.company),
        logo: chu.logo,
        avatar: chu.avatar,
        district: chu.district,
        industry: chu.industry,
        hoiRole: chu.hoiRole,
        chucDanh: nhanChucDanh(chu.hoiRole),
        // Liên hệ chỉ mở cho hội viên đã xác thực — đúng quy tắc AGENTS.md
        zalo: member ? chu.zalo : null,
        phone: member ? chu.phone : null,
        // Mã người dùng Zalo để Mini App mở thẳng cửa sổ chat (openChat).
        // Chỉ có với người từng đăng nhập Mini App; không có thì app ẩn nút nhắn.
        zaloUserId: member ? zaloUserIdCuaChu : null,
      },
      phuHop: pv && pv.diem >= NGUONG_PHU_HOP ? pv : null,
    },
    laHoiVien: !!member,
    hoiVienPhuHop: goiY,
  });
}
