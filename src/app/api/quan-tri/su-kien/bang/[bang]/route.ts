import { BANG } from "@/lib/trung-tam-sk/bang";
import { suaNhieu, themDong, xoaNhieu } from "@/lib/trung-tam-sk/api-bang";
import { coQuyenBang, nguoiDungApi, nguoiGhi } from "@/lib/trung-tam-sk/may-chu";

/**
 * Trung tâm sự kiện — bảng sửa trực tiếp.
 * POST   { eventId | taiTroId, ...cột }  hoặc  { eventId, rows: [...] } (dán từ Excel)
 * PATCH  { ids, data }  — sửa hàng loạt cột phân loại
 * DELETE { ids }
 */

export const runtime = "nodejs";

type Ctx = { params: Promise<{ bang: string }> };

async function moDau(ctx: Ctx) {
  const { bang } = await ctx.params;
  const c = BANG[bang];
  if (!c) return { loi: Response.json({ error: "Bảng không hợp lệ" }, { status: 404 }) };
  const a = await nguoiDungApi("vao");
  if (a instanceof Response) return { loi: a };
  if (!coQuyenBang(a.quyen, c.quyen))
    return { loi: Response.json({ error: "Không có quyền sửa mục này" }, { status: 403 }) };
  return { bang, c, user: a.user };
}

async function docBody(req: Request): Promise<Record<string, unknown>> {
  const b = await req.json().catch(() => null);
  return b && typeof b === "object" && !Array.isArray(b) ? (b as Record<string, unknown>) : {};
}

const tra = (r: { error: string; status?: number } | object) =>
  "error" in r
    ? Response.json({ error: r.error }, { status: (r as { status?: number }).status ?? 400 })
    : null;

export async function POST(req: Request, ctx: Ctx) {
  const m = await moDau(ctx);
  if ("loi" in m) return m.loi;
  const body = await docBody(req);
  const chaId = String(m.c.cha === "taiTro" ? body.taiTroId ?? "" : body.eventId ?? "");
  if (!chaId) return Response.json({ error: "Thiếu sự kiện" }, { status: 400 });
  const ds = Array.isArray(body.rows)
    ? (body.rows as unknown[]).filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    : [body];
  const r = await themDong(m.bang, chaId, ds);
  const loi = tra(r);
  if (loi) return loi;
  const dong = (r as { dong: unknown[] }).dong;
  return Array.isArray(body.rows) ? Response.json({ count: dong.length }) : Response.json(dong[0]);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const m = await moDau(ctx);
  if ("loi" in m) return m.loi;
  const body = await docBody(req);
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string") : [];
  const data = body.data && typeof body.data === "object" ? (body.data as Record<string, unknown>) : {};
  if (!ids.length) return Response.json({ error: "Chưa chọn dòng nào" }, { status: 400 });
  const r = await suaNhieu(m.bang, ids, data);
  return tra(r) ?? Response.json(r);
}

export async function DELETE(req: Request, ctx: Ctx) {
  const m = await moDau(ctx);
  if ("loi" in m) return m.loi;
  const body = await docBody(req);
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string") : [];
  if (!ids.length) return Response.json({ error: "Chưa chọn dòng nào" }, { status: 400 });
  const r = await xoaNhieu(m.bang, ids, nguoiGhi(m.user));
  return tra(r) ?? Response.json(r);
}
