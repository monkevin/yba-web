import { prisma } from "@/lib/prisma";
import { bocTham } from "@/lib/trung-tam-sk/boc-tham";
import { nguoiDungApi } from "@/lib/trung-tam-sk/may-chu";

/**
 * Bốc thăm may mắn (logic ở lib/trung-tam-sk/boc-tham.ts).
 * POST   { giaiId }                    → quay một người cho giải
 * PATCH  { trungId, trangThai: VANG | TRUNG } → khách vắng: suất được quay lại
 * DELETE { trungId }                   → huỷ lượt (bấm nhầm)
 */

export const runtime = "nodejs";

type Ctx = { params: Promise<{ eventId: string }> };

async function moDau(ctx: Ctx) {
  const a = await nguoiDungApi("quanLy");
  if (a instanceof Response) return a;
  const { eventId } = await ctx.params;
  const sk = await prisma.skSuKien.findUnique({ where: { eventId }, select: { id: true } });
  if (!sk) return Response.json({ error: "Sự kiện chưa bật quản lý ở Trung tâm" }, { status: 404 });
  return { skId: sk.id };
}

const docBody = async (req: Request) => {
  const b = await req.json().catch(() => null);
  return (b && typeof b === "object" ? b : {}) as Record<string, unknown>;
};

export async function POST(req: Request, ctx: Ctx) {
  const m = await moDau(ctx);
  if (m instanceof Response) return m;
  const b = await docBody(req);
  const r = await bocTham(m.skId, String(b.giaiId ?? ""));
  return "error" in r ? Response.json({ error: r.error }, { status: r.status }) : Response.json(r);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const m = await moDau(ctx);
  if (m instanceof Response) return m;
  const b = await docBody(req);
  const trangThai = b.trangThai === "VANG" ? "VANG" : b.trangThai === "TRUNG" ? "TRUNG" : null;
  if (!trangThai) return Response.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
  if (trangThai === "TRUNG") {
    // "Có mặt lại" sau khi suất đã quay cho người khác → không vượt số lượng giải
    const t = await prisma.skTrungGiai.findFirst({
      where: { id: String(b.trungId ?? ""), skId: m.skId },
      select: { giai: { select: { soLuong: true, _count: { select: { trung: { where: { trangThai: "TRUNG" } } } } } } },
    });
    if (t && t.giai._count.trung >= t.giai.soLuong)
      return Response.json({ error: "Giải đã đủ người — huỷ một lượt khác trước" }, { status: 400 });
  }
  const r = await prisma.skTrungGiai.updateMany({ where: { id: String(b.trungId ?? ""), skId: m.skId }, data: { trangThai } });
  return r.count ? Response.json({ ok: true }) : Response.json({ error: "Không tìm thấy lượt trúng" }, { status: 404 });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const m = await moDau(ctx);
  if (m instanceof Response) return m;
  const b = await docBody(req);
  const r = await prisma.skTrungGiai.deleteMany({ where: { id: String(b.trungId ?? ""), skId: m.skId } });
  return r.count ? Response.json({ ok: true }) : Response.json({ error: "Không tìm thấy lượt trúng" }, { status: 404 });
}
