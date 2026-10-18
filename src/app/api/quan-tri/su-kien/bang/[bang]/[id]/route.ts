import { BANG } from "@/lib/trung-tam-sk/bang";
import { suaDong, xoaNhieu } from "@/lib/trung-tam-sk/api-bang";
import { coQuyenBang, nguoiDungApi, nguoiGhi } from "@/lib/trung-tam-sk/may-chu";

/** Trung tâm sự kiện — sửa / xoá MỘT dòng. */

export const runtime = "nodejs";

type Ctx = { params: Promise<{ bang: string; id: string }> };

async function moDau(ctx: Ctx) {
  const { bang, id } = await ctx.params;
  const c = BANG[bang];
  if (!c) return { loi: Response.json({ error: "Bảng không hợp lệ" }, { status: 404 }) };
  const a = await nguoiDungApi("vao");
  if (a instanceof Response) return { loi: a };
  if (!coQuyenBang(a.quyen, c.quyen))
    return { loi: Response.json({ error: "Không có quyền sửa mục này" }, { status: 403 }) };
  return { bang, id, user: a.user };
}

export async function PATCH(req: Request, ctx: Ctx) {
  const m = await moDau(ctx);
  if ("loi" in m) return m.loi;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body))
    return Response.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const r = await suaDong(m.bang, m.id, body as Record<string, unknown>, nguoiGhi(m.user));
  if ("error" in r) return Response.json({ error: r.error }, { status: r.status ?? 400 });
  return Response.json(r.dong);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const m = await moDau(ctx);
  if ("loi" in m) return m.loi;
  const r = await xoaNhieu(m.bang, [m.id], nguoiGhi(m.user));
  if ("error" in r) return Response.json({ error: r.error }, { status: r.status ?? 400 });
  return Response.json(r);
}
