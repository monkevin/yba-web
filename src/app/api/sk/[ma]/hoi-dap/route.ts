import { prisma } from "@/lib/prisma";
import { chu, moCong } from "@/lib/trung-tam-sk/cong";

/** Cổng QR — khách gửi câu hỏi cho diễn giả (BTC duyệt rồi mới chiếu). */

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ ma: string }> }) {
  const { ma } = await ctx.params;
  const m = await moCong(req, ma, "moHoiDap", { may: 6, suKien: 600, phut: 5 });
  if (m instanceof Response) return m;
  const noiDung = chu(m.body.noiDung, 500);
  if (!noiDung || noiDung.length < 5) return Response.json({ error: "Câu hỏi hơi ngắn" }, { status: 400 });
  await prisma.skCauHoi.create({ data: { skId: m.c.id, noiDung, ten: chu(m.body.ten, 80) } });
  return Response.json({ ok: true });
}
