import { prisma } from "@/lib/prisma";
import { docHoiVien } from "@/lib/mobile-auth";
import { moJson, moOptions } from "@/lib/mobile-cors";
import { normalizeSearch } from "@/lib/search";
import { uniqueSlug } from "@/lib/slug";
import { LOAI_TIN, TRANG_THAI_TIN } from "@/lib/listing";
import { phaiDuyetTinDang } from "@/lib/cai-dat";
import { laBanChuNhiem } from "@/lib/vai-tro-hoi";

export const OPTIONS = moOptions;

/**
 * Hội viên đăng tin nhu cầu mua / bán từ Mini App.
 * POST /api/mobile/tin-dang/dang
 *
 * Bật / tắt chế độ duyệt trước ở /quan-tri/tin-dang — luôn hỏi
 * `phaiDuyetTinDang()` chứ không hard-code (xem AGENTS.md).
 *
 * NGOẠI LỆ: người có chức danh trong Ban Chủ nhiệm đăng là hiện ngay kể cả khi
 * đang bật chế độ duyệt — Ban Chủ nhiệm chốt 20/08/2026, họ tự chịu trách
 * nhiệm nội dung mình đăng.
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
  const description = String(than.description ?? "").trim();
  if (title.length < 8) return moJson({ error: "Tiêu đề quá ngắn" }, 400);
  if (description.length < 15) return moJson({ error: "Mô tả thêm giúp anh/chị" }, 400);

  const type = than.type === LOAI_TIN.CAN_BAN ? LOAI_TIN.CAN_BAN : LOAI_TIN.CAN_MUA;

  let categoryId: string | null = null;
  if (than.nganh) {
    const c = await prisma.category.findFirst({
      where: { slug: String(than.nganh), active: true },
      select: { id: true },
    });
    categoryId = c?.id ?? null;
  }

  const slug = await uniqueSlug(title, async (s) =>
    (await prisma.listing.count({ where: { slug: s } })) > 0
  );

  const mienDuyet = laBanChuNhiem(member.hoiRole);
  const phaiDuyet = (await phaiDuyetTinDang()) && !mienDuyet;

  const tin = await prisma.listing.create({
    data: {
      type,
      title: title.slice(0, 200),
      slug,
      summary: than.summary ? String(than.summary).slice(0, 300) : description.slice(0, 160),
      description: description.slice(0, 3000),
      categoryId,
      priceText: than.priceText ? String(than.priceText).slice(0, 100) : "Thoả thuận",
      quantity: than.quantity ? String(than.quantity).slice(0, 100) : null,
      location: than.location
        ? String(than.location).slice(0, 150)
        : member.district
          ? `${member.district}, TP.HCM`
          : null,
      memberId: member.id,
      status: phaiDuyet ? TRANG_THAI_TIN.CHO_DUYET : TRANG_THAI_TIN.DANG_HIEN,
      searchText: normalizeSearch(`${title} ${description} ${member.company}`),
    },
    select: { slug: true, title: true, status: true },
  });

  return moJson({ ok: true, tin, phaiDuyet, mienDuyet });
}
