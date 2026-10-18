import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeSearch } from "@/lib/search";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { docHoiVien } from "@/lib/mobile-auth";
import { moJson, moOptions } from "@/lib/mobile-cors";
import { uniqueSlug } from "@/lib/slug";
import { laBanChuNhiem } from "@/lib/vai-tro-hoi";

export const OPTIONS = moOptions;

const MOI_TRANG = 20;

/** Ưu đãi đang hiệu lực — là HÀM vì có so sánh với thời điểm hiện tại. */
function uuDaiDangChay(): Prisma.UuDaiWhereInput {
  const now = new Date();
  return {
    status: "DANG_HIEN",
    member: { active: true, publicVisible: true },
    AND: [
      { OR: [{ startAt: null }, { startAt: { lte: now } }] },
      { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
    ],
  };
}

/**
 * Danh sách ưu đãi hội viên. GET /api/mobile/uu-dai?q=&trang=1
 *
 * Ưu đãi là QUYỀN LỢI HỘI VIÊN nên chỉ hội viên đã xác thực mới xem được chi
 * tiết. Người chưa đăng nhập vẫn thấy có bao nhiêu ưu đãi và của ngành nào —
 * đủ để thấy giá trị mà chưa lộ nội dung.
 */
export async function GET(req: Request) {
  const member = await docHoiVien(req);
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const trang = Math.max(1, Number(sp.get("trang") ?? 1) || 1);

  const where: Prisma.UuDaiWhereInput = { ...uuDaiDangChay() };
  if (q) where.searchText = { contains: normalizeSearch(q) };

  const [tong, ds] = await Promise.all([
    prisma.uuDai.count({ where }),
    prisma.uuDai.findMany({
      where,
      // Thứ tự Ban Chủ nhiệm chốt 24/08/2026: nhà tài trợ chiến lược của Chi
      // hội lên trên cùng → rồi tới ưu đãi được ghim → còn lại mới nhất trước.
      orderBy: [
        { member: { nhaTaiTroChienLuoc: "desc" } },
        { pinned: "desc" },
        { createdAt: "desc" },
      ],
      skip: (trang - 1) * MOI_TRANG,
      take: MOI_TRANG,
      select: {
        slug: true,
        title: true,
        mucUuDai: true,
        summary: true,
        dieuKien: true,
        images: true,
        expiresAt: true,
        pinned: true,
        member: {
          select: {
            slug: true,
            company: true,
            logo: true,
            avatar: true,
            nhaTaiTroChienLuoc: true,
            category: { select: { name: true, icon: true } },
          },
        },
        _count: { select: { leads: true } },
      },
    }),
  ]);

  return moJson({
    tong,
    trang,
    soTrang: Math.max(1, Math.ceil(tong / MOI_TRANG)),
    laHoiVien: !!member,
    uuDai: ds.map((u) => ({
      slug: u.slug,
      title: u.title,
      mucUuDai: u.mucUuDai,
      expiresAt: u.expiresAt,
      pinned: u.pinned,
      nhaTaiTro: u.member.nhaTaiTroChienLuoc,
      soQuanTam: u._count.leads,
      member: { ...u.member, company: tenDoanhNghiep(u.member.company) },
      // Nội dung chi tiết chỉ mở cho hội viên đã xác thực
      summary: member ? u.summary : null,
      dieuKien: member ? u.dieuKien : null,
      images: member ? u.images : null,
    })),
  });
}

/**
 * Hội viên tự đăng ưu đãi của doanh nghiệp mình từ Mini App.
 * POST /api/mobile/uu-dai  { title, mucUuDai, summary?, dieuKien?, expiresAt? }
 *
 * Vào trạng thái CHO_DUYET, Ban Chủ nhiệm duyệt ở /quan-tri/uu-dai mới hiện —
 * cùng nguyên tắc với bảng tin. Người có chức danh trong Ban Chủ nhiệm đăng là
 * hiện ngay (Ban Chủ nhiệm chốt 20/08/2026).
 */
export async function POST(req: Request) {
  const member = await docHoiVien(req);
  if (!member) return moJson({ error: "Cần xác thực hội viên" }, 401);

  let than: Record<string, unknown>;
  try {
    than = await req.json();
  } catch {
    return moJson({ error: "Dữ liệu gửi lên không hợp lệ" }, 400);
  }

  const title = String(than.title ?? "").trim();
  const mucUuDai = String(than.mucUuDai ?? "").trim();
  if (title.length < 8) return moJson({ error: "Tiêu đề quá ngắn" }, 400);
  if (!mucUuDai) {
    return moJson({ error: "Ghi rõ mức ưu đãi giúp anh/chị, ví dụ Giảm 20%" }, 400);
  }

  const expiresAt = than.expiresAt ? new Date(String(than.expiresAt)) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return moJson({ error: "Hạn áp dụng không hợp lệ" }, 400);
  }

  const slug = await uniqueSlug(title, async (s) =>
    (await prisma.uuDai.count({ where: { slug: s } })) > 0
  );

  const mienDuyet = laBanChuNhiem(member.hoiRole);

  const uuDai = await prisma.uuDai.create({
    data: {
      memberId: member.id,
      slug,
      title: title.slice(0, 200),
      mucUuDai: mucUuDai.slice(0, 100),
      summary: than.summary ? String(than.summary).slice(0, 500) : null,
      dieuKien: than.dieuKien ? String(than.dieuKien).slice(0, 1000) : null,
      expiresAt,
      status: mienDuyet ? "DANG_HIEN" : "CHO_DUYET",
      searchText: normalizeSearch(`${title} ${mucUuDai} ${member.company}`),
    },
    select: { slug: true, title: true, status: true },
  });

  return moJson({ ok: true, uuDai, mienDuyet, phaiDuyet: !mienDuyet });
}
