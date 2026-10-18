import { prisma } from "@/lib/prisma";
import { nguoiDungApi } from "@/lib/trung-tam-sk/may-chu";

/** Đặt xác nhận tham dự của khách ở một phiên (CHO | CO | KHONG). Không đụng check-in. */

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ eventId: string }> }) {
  const a = await nguoiDungApi("quanLy");
  if (a instanceof Response) return a;
  const { eventId } = await ctx.params;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const xacNhan = String(b.xacNhan ?? "");
  if (!["CHO", "CO", "KHONG"].includes(xacNhan))
    return Response.json({ error: "Giá trị xác nhận không hợp lệ" }, { status: 400 });
  const ids = (Array.isArray(b.khachIds) ? b.khachIds : [b.khachId]).filter(
    (x): x is string => typeof x === "string"
  );
  const phien = await prisma.skPhien.findFirst({
    where: { id: String(b.phienId ?? ""), sk: { eventId } },
    select: { id: true, skId: true },
  });
  if (!phien || !ids.length) return Response.json({ error: "Thiếu khách hoặc phiên" }, { status: 400 });
  const khach = await prisma.skKhach.findMany({
    where: { id: { in: ids.slice(0, 2000) }, skId: phien.skId },
    select: { id: true },
  });
  for (const k of khach) {
    await prisma.skThamDu.upsert({
      where: { khachId_phienId: { khachId: k.id, phienId: phien.id } },
      create: { khachId: k.id, phienId: phien.id, xacNhan },
      update: { xacNhan },
    });
  }
  return Response.json({ count: khach.length });
}
