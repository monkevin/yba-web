import { dangKyCong, moCong } from "@/lib/trung-tam-sk/cong";

/** Cổng QR — khách tự đăng ký (logic ở lib/trung-tam-sk/cong.ts). */

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ ma: string }> }) {
  const { ma } = await ctx.params;
  const m = await moCong(req, ma, "moDangKy", { may: 10, suKien: 400, phut: 10 });
  if (m instanceof Response) return m;
  const r = await dangKyCong(m.c, m.body);
  return Response.json(r.body, { status: r.status ?? 200 });
}
