import { prisma } from "@/lib/prisma";
import { docHoiVien } from "@/lib/mobile-auth";
import { moJson, moOptions } from "@/lib/mobile-cors";

export const OPTIONS = moOptions;

const HANH_DONG = ["QUAN_TAM", "NHAN_UU_DAI", "LIEN_HE"] as const;

/**
 * Hội viên bấm Quan tâm / Nhận ưu đãi / Liên hệ.
 * POST /api/mobile/uu-dai/:slug/quan-tam  { hanhDong }
 *
 * Đây chính là "lead" trả về cho doanh nghiệp — bằng chứng sinh hoạt Hội ra
 * đơn hàng. Một hội viên chỉ tính MỘT lead cho mỗi hành động trên mỗi ưu đãi
 * (ràng buộc @@unique), bấm lại không thổi phồng số liệu.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const member = await docHoiVien(req);
  if (!member) {
    return moJson(
      { error: "Cần xác thực là hội viên mới nhận được ưu đãi" },
      401
    );
  }

  const { slug } = await params;
  const uuDai = await prisma.uuDai.findUnique({
    where: { slug },
    select: { id: true, memberId: true, title: true },
  });
  if (!uuDai) return moJson({ error: "Không tìm thấy ưu đãi" }, 404);

  if (uuDai.memberId === member.id) {
    return moJson({ error: "Đây là ưu đãi của chính doanh nghiệp anh/chị" }, 400);
  }

  let than: { hanhDong?: string; ghiChu?: string } = {};
  try {
    than = await req.json();
  } catch {
    /* không có thân cũng được, mặc định QUAN_TAM */
  }

  const hanhDong = HANH_DONG.includes(than.hanhDong as (typeof HANH_DONG)[number])
    ? (than.hanhDong as string)
    : "QUAN_TAM";

  await prisma.uuDaiLead.upsert({
    where: {
      uuDaiId_memberId_hanhDong: { uuDaiId: uuDai.id, memberId: member.id, hanhDong },
    },
    create: {
      uuDaiId: uuDai.id,
      memberId: member.id,
      hanhDong,
      ghiChu: than.ghiChu ?? null,
    },
    update: { ghiChu: than.ghiChu ?? undefined },
  });

  const soQuanTam = await prisma.uuDaiLead.count({ where: { uuDaiId: uuDai.id } });

  return moJson({ ok: true, hanhDong, soQuanTam });
}
