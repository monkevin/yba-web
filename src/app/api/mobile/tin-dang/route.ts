import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { publicListing } from "@/lib/public";
import { THU_TU_TIN_DANG } from "@/lib/xep-hang";
import { normalizeSearch } from "@/lib/search";
import { LOAI_TIN } from "@/lib/listing";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { moJson, moOptions } from "@/lib/mobile-cors";
import { docHoiVien } from "@/lib/mobile-auth";
import { NGUONG_PHU_HOP, doPhuHop } from "@/lib/do-phu-hop";
import { prisma as db } from "@/lib/prisma";

export const OPTIONS = moOptions;

const MOI_TRANG = 20;

/**
 * Chợ nhu cầu mua – bán công khai — CÙNG dữ liệu với /giao-thuong trên web.
 * GET /api/mobile/tin-dang?q=&loai=CAN_MUA|CAN_BAN&nganh=&khuvuc=&trang=1
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const loai = sp.get("loai")?.trim() ?? "";
  const nganh = sp.get("nganh")?.trim() ?? "";
  const khuvuc = sp.get("khuvuc")?.trim() ?? "";
  const trang = Math.max(1, Number(sp.get("trang") ?? 1) || 1);

  const where: Prisma.ListingWhereInput = { ...publicListing() };
  if (q) where.searchText = { contains: normalizeSearch(q) };
  if (loai === LOAI_TIN.CAN_MUA || loai === LOAI_TIN.CAN_BAN) where.type = loai;
  if (nganh) where.category = { slug: nganh };
  if (khuvuc) where.member = { ...(where.member as object), district: khuvuc };

  const [tong, tin] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy: THU_TU_TIN_DANG,
      skip: (trang - 1) * MOI_TRANG,
      take: MOI_TRANG,
      select: {
        slug: true,
        type: true,
        title: true,
        summary: true,
        priceText: true,
        quantity: true,
        location: true,
        images: true,
        createdAt: true,
        description: true,
        categoryId: true,
        category: { select: { name: true, icon: true, slug: true } },
        member: {
          select: {
            slug: true,
            name: true,
            company: true,
            logo: true,
            avatar: true,
            district: true,
            hoiRole: true,
          },
        },
      },
    }),
  ]);

  // Độ phù hợp — chỉ tính khi biết người xem là ai (mục 3 "AI Matching")
  const member = await docHoiVien(req);
  const toi = member
    ? await db.member.findUnique({
        where: { id: member.id },
        select: {
          categoryId: true,
          district: true,
          offering: true,
          services: true,
          needing: true,
          toiGiupGi: true,
          toiCanGi: true,
        },
      })
    : null;

  return moJson({
    tong,
    trang,
    soTrang: Math.max(1, Math.ceil(tong / MOI_TRANG)),
    laHoiVien: !!member,
    tin: tin.map((t) => {
      const { description, categoryId, ...con } = t;
      const pv = toi
        ? doPhuHop(
            {
              type: t.type,
              categoryId,
              title: t.title,
              summary: t.summary,
              description,
              memberDistrict: t.member.district,
            },
            toi
          )
        : null;

      return {
        ...con,
        member: { ...t.member, company: tenDoanhNghiep(t.member.company) },
        // Chỉ gửi khi đủ cơ sở — dưới ngưỡng thì không hiện huy hiệu
        phuHop: pv && pv.diem >= NGUONG_PHU_HOP ? pv : null,
      };
    }),
  });
}
