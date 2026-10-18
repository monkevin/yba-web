import { xuatExcel } from "@/lib/trung-tam-sk/excel";
import { nguoiDungApi } from "@/lib/trung-tam-sk/may-chu";

/** Xuất toàn bộ sự kiện ra Excel — sheet tài chính chỉ có khi đủ quyền. */

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ eventId: string }> }) {
  const a = await nguoiDungApi("vao");
  if (a instanceof Response) return a;
  if (!a.quyen.quanLy && !a.quyen.taiChinh)
    return Response.json({ error: "Không có quyền xuất dữ liệu" }, { status: 403 });
  const { eventId } = await ctx.params;
  try {
    const { ten, buf } = await xuatExcel(eventId, a.quyen);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(ten)}"; filename*=UTF-8''${encodeURIComponent(ten)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Lỗi xuất file" }, { status: 400 });
  }
}
