import { nhapKhachExcel } from "@/lib/trung-tam-sk/excel";
import { nguoiDungApi } from "@/lib/trung-tam-sk/may-chu";

/** Nhập danh sách khách từ file Excel của BTC (trùng SĐT chỉ bổ sung ô trống). */

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ eventId: string }> }) {
  const a = await nguoiDungApi("quanLy");
  if (a instanceof Response) return a;
  const { eventId } = await ctx.params;
  const fd = await req.formData().catch(() => null);
  const file = fd?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Chưa chọn file" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return Response.json({ error: "File quá 10 MB" }, { status: 400 });
  try {
    return Response.json(await nhapKhachExcel(eventId, await file.arrayBuffer()));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Không đọc được file" }, { status: 400 });
  }
}
