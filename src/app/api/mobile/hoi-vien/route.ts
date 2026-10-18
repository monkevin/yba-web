import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PUBLIC_MEMBER } from "@/lib/public";
import { THU_TU_HOI_VIEN } from "@/lib/xep-hang";
import { normalizeSearch } from "@/lib/search";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { moJson, moOptions } from "@/lib/mobile-cors";
import { laBanChuNhiem, nhanChucDanh } from "@/lib/vai-tro-hoi";

export const OPTIONS = moOptions;

const MOI_TRANG = 20;

/**
 * Danh bạ doanh nghiệp công khai — CÙNG dữ liệu với /doanh-nghiep trên web.
 * KHÔNG trả số điện thoại / email (theo đúng quy tắc AGENTS.md), chỉ hiện với
 * người đã đăng nhập — Mini App sẽ mở lại việc này sau khi nối Zalo Login.
 *
 * GET /api/mobile/hoi-vien?q=&nganh=&khuvuc=&trang=1
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const nganh = sp.get("nganh")?.trim() ?? "";
  const khuvuc = sp.get("khuvuc")?.trim() ?? "";
  const trang = Math.max(1, Number(sp.get("trang") ?? 1) || 1);

  const where: Prisma.MemberWhereInput = { ...PUBLIC_MEMBER };
  if (q) where.searchText = { contains: normalizeSearch(q) };
  if (nganh) where.category = { slug: nganh };
  if (khuvuc) where.district = khuvuc;

  const [tong, members] = await Promise.all([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      orderBy: [{ featured: "desc" }, ...THU_TU_HOI_VIEN],
      skip: (trang - 1) * MOI_TRANG,
      take: MOI_TRANG,
      select: {
        slug: true,
        code: true,
        name: true,
        company: true,
        position: true,
        hoiRole: true,
        memberType: true,
        industry: true,
        district: true,
        logo: true,
        avatar: true,
        intro: true,
        // Chức danh trong Hội + năm gia nhập là hai tín hiệu uy tín hội viên
        // muốn thấy ngay trên thẻ danh bạ (Ban Chủ nhiệm góp ý 20/08/2026)
        joinedAt: true,
        category: { select: { name: true, slug: true, icon: true } },
      },
    }),
  ]);

  return moJson({
    tong,
    trang,
    soTrang: Math.max(1, Math.ceil(tong / MOI_TRANG)),
    members: members.map((m) => ({
      ...m,
      company: tenDoanhNghiep(m.company),
      chucDanh: nhanChucDanh(m.hoiRole),
      laBanChuNhiem: laBanChuNhiem(m.hoiRole),
    })),
  });
}
