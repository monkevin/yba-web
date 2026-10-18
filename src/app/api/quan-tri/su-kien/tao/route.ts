import { LOAI_SU_KIEN, type QuyMo } from "@/lib/trung-tam-sk/mau";
import { nguoiDungApi, taoToChuc } from "@/lib/trung-tam-sk/may-chu";

/**
 * Tạo sự kiện mới theo mẫu loại × quy mô, hoặc bật quản lý tổ chức cho một
 * sự kiện đã có ở mục "Sự kiện & chương trình" (gửi kèm eventId).
 */

export const runtime = "nodejs";

export async function POST(req: Request) {
  const a = await nguoiDungApi("quanLy");
  if (a instanceof Response) return a;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const loai = LOAI_SU_KIEN.some((l) => l.value === b.loai) ? String(b.loai) : "other";
  const quyMo: QuyMo = b.quyMo === "nho" || b.quyMo === "lon" ? b.quyMo : "vua";
  const muc = Number(b.mucTieuKhach);
  try {
    const eventId = await taoToChuc({
      eventId: typeof b.eventId === "string" && b.eventId ? b.eventId : null,
      tieuDe: String(b.tieuDe ?? ""),
      ngay: String(b.ngay ?? ""),
      gio: String(b.gio ?? "08:00"),
      diaDiem: typeof b.diaDiem === "string" ? b.diaDiem : null,
      loai,
      quyMo,
      mucTieuKhach: Number.isFinite(muc) && muc > 0 ? Math.round(muc) : null,
      dungMau: b.dungMau !== false,
    });
    return Response.json({ eventId });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Không tạo được sự kiện" }, { status: 400 });
  }
}
