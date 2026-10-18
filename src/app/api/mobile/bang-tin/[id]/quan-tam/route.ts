import { prisma } from "@/lib/prisma";
import { docHoiVien } from "@/lib/mobile-auth";
import { moJson, moOptions } from "@/lib/mobile-cors";

export const OPTIONS = moOptions;

/**
 * Hội viên bấm quan tâm / đăng ký tham gia chương trình của hội viên khác
 * (mục 15). Bấm lại = bỏ quan tâm.
 * POST /api/mobile/bang-tin/:id/quan-tam
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await docHoiVien(req);
  if (!member) return moJson({ error: "Cần xác thực hội viên" }, 401);

  const { id } = await params;
  const tin = await prisma.bangTin.findUnique({
    where: { id },
    select: { id: true, memberId: true },
  });
  if (!tin) return moJson({ error: "Không tìm thấy tin" }, 404);
  if (tin.memberId === member.id) {
    return moJson({ error: "Đây là tin của chính anh/chị" }, 400);
  }

  const daCo = await prisma.bangTinQuanTam.findUnique({
    where: { bangTinId_memberId: { bangTinId: tin.id, memberId: member.id } },
    select: { id: true },
  });

  if (daCo) {
    await prisma.bangTinQuanTam.delete({ where: { id: daCo.id } });
  } else {
    await prisma.bangTinQuanTam.create({
      data: { bangTinId: tin.id, memberId: member.id },
    });
  }

  const soQuanTam = await prisma.bangTinQuanTam.count({ where: { bangTinId: tin.id } });

  return moJson({ ok: true, toiDaQuanTam: !daCo, soQuanTam });
}
