import { prisma } from "@/lib/prisma";
import { chu, moCong } from "@/lib/trung-tam-sk/cong";

/** Cổng QR — khách đánh giá sau sự kiện: hài lòng 1–5, NPS 0–10, góp ý. */

export const runtime = "nodejs";

const so = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

export async function POST(req: Request, ctx: { params: Promise<{ ma: string }> }) {
  const { ma } = await ctx.params;
  const m = await moCong(req, ma, "moDanhGia", { may: 3, suKien: 1500, phut: 60 });
  if (m instanceof Response) return m;
  const b = m.body;
  const haiLong = so(b.haiLong, 1, 5);
  if (!haiLong) return Response.json({ error: "Vui lòng chọn mức hài lòng" }, { status: 400 });
  await prisma.skDanhGia.create({
    data: {
      skId: m.c.id,
      haiLong,
      nps: so(b.nps, 0, 10),
      thichNhat: chu(b.thichNhat, 1000),
      gopY: chu(b.gopY, 1000),
      ten: chu(b.ten, 80),
    },
  });
  return Response.json({ ok: true });
}
