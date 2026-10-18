import { moCong, tuCheckinCong } from "@/lib/trung-tam-sk/cong";

/** Cổng QR — khách tự check-in bằng SĐT + PIN (logic ở lib/trung-tam-sk/cong.ts). */

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ ma: string }> }) {
  const { ma } = await ctx.params;
  const m = await moCong(req, ma, "moTuCheckin", { may: 30, suKien: 2000, phut: 10 });
  if (m instanceof Response) return m;
  const r = await tuCheckinCong(m.c, m.body, m.ip);
  return Response.json(r.body, { status: r.status ?? 200 });
}
