import { prisma } from "@/lib/prisma";
import { ghepHoiVien, napChiMucHoiVien } from "@/lib/trung-tam-sk/checkin";
import { nguoiDungApi } from "@/lib/trung-tam-sk/may-chu";

/** Thử ghép hồ sơ hội viên cho mọi khách chưa ghép (theo SĐT / tên + đơn vị). */

export const runtime = "nodejs";

export async function POST(_req: Request, ctx: { params: Promise<{ eventId: string }> }) {
  const a = await nguoiDungApi("quanLy");
  if (a instanceof Response) return a;
  const { eventId } = await ctx.params;
  const ds = await prisma.skKhach.findMany({
    where: { sk: { eventId }, memberId: null },
    select: { id: true, ten: true, phone: true, donVi: true, nhom: true },
  });
  const cm = await napChiMucHoiVien();
  let ghep = 0;
  for (const k of ds) {
    const memberId = ghepHoiVien(k, cm);
    if (!memberId) continue;
    await prisma.skKhach.update({ where: { id: k.id }, data: { memberId } });
    ghep++;
  }
  return Response.json({ ghep, conLai: ds.length - ghep });
}
