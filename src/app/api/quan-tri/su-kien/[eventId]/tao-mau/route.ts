import { prisma } from "@/lib/prisma";
import { QUYEN_LOI_THEO_HANG, ngayNhap, tabCuaBan, tuNgayNhap } from "@/lib/trung-tam-sk/bang";
import { type QuyMo, hangTaiTroMau, taoDuLieuMau, taoDuLieuMauDot2 } from "@/lib/trung-tam-sk/mau";
import { nguoiDungApi } from "@/lib/trung-tam-sk/may-chu";

/**
 * Sinh dữ liệu mẫu cho một phần còn TRỐNG của sự kiện (sự kiện tạo trước
 * khi có phần đó): hạng tài trợ, nhà cung cấp, rủi ro, giải bốc thăm.
 * Phần đã có dữ liệu thì không đụng.
 * `{ phan: "viec", ban }` — bổ sung checklist mẫu của MỘT ban: chỉ thêm việc
 * mẫu chưa có (so theo tiêu đề), hạn chót tính theo ngày diễn ra hiện tại.
 */

export const runtime = "nodejs";

const PHAN = ["hang", "ncc", "ruiro", "giai", "viec"] as const;

export async function POST(req: Request, ctx: { params: Promise<{ eventId: string }> }) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const phan = PHAN.find((p) => p === b.phan);
  if (!phan) return Response.json({ error: "Phần không hợp lệ" }, { status: 400 });
  const a = await nguoiDungApi(phan === "hang" ? "taiChinh" : "quanLy");
  if (a instanceof Response) return a;
  const { eventId } = await ctx.params;
  const sk = await prisma.skSuKien.findUnique({
    where: { eventId },
    select: { id: true, loai: true, quyMo: true, event: { select: { startAt: true } } },
  });
  if (!sk) return Response.json({ error: "Sự kiện chưa bật quản lý ở Trung tâm" }, { status: 404 });
  const skId = sk.id;
  const quyMo = (["nho", "vua", "lon"].includes(sk.quyMo) ? sk.quyMo : "vua") as QuyMo;
  const m2 = taoDuLieuMauDot2(sk.loai, quyMo);

  let count = 0;
  if (phan === "hang" && !(await prisma.skHangTaiTro.count({ where: { skId } })))
    count = (await prisma.skHangTaiTro.createMany({ data: hangTaiTroMau(quyMo, QUYEN_LOI_THEO_HANG).map((h) => ({ ...h, skId })) })).count;
  if (phan === "ncc" && !(await prisma.skNhaCungCap.count({ where: { skId } })))
    count = (await prisma.skNhaCungCap.createMany({ data: m2.nhaCungCap.map((x) => ({ ...x, skId })) })).count;
  if (phan === "ruiro" && !(await prisma.skRuiRo.count({ where: { skId } })))
    count = (await prisma.skRuiRo.createMany({ data: m2.ruiRo.map((x) => ({ ...x, skId })) })).count;
  if (phan === "giai" && !(await prisma.skGiai.count({ where: { skId } }))) {
    const ds = m2.giai.length ? m2.giai : [{ ten: "Giải may mắn", soLuong: 3, order: 1 }];
    count = (await prisma.skGiai.createMany({ data: ds.map((x) => ({ ...x, skId })) })).count;
  }
  if (phan === "viec") {
    const ban = typeof b.ban === "string" ? b.ban.trim() : "";
    if (!ban) return Response.json({ error: "Thiếu tên ban" }, { status: 400 });
    const mau = taoDuLieuMau(sk.loai, quyMo, tuNgayNhap(ngayNhap(sk.event.startAt)));
    const daCo = new Set(
      (await prisma.skViec.findMany({ where: { skId, ban }, select: { tieuDe: true } })).map((v) => v.tieuDe)
    );
    const max = (await prisma.skViec.aggregate({ where: { skId }, _max: { order: true } }))._max.order ?? 0;
    // Ban đã đổi tên ("Ban Hậu cần – Quà tặng") vẫn nhận mẫu của ban cùng mảng việc
    const mang = tabCuaBan(ban)?.duong;
    const cungBan = (t: string) => t === ban || (!!mang && tabCuaBan(t)?.duong === mang);
    const them = mau.viec.filter((v) => cungBan(v.ban) && !daCo.has(v.tieuDe));
    count = (
      await prisma.skViec.createMany({ data: them.map((v, i) => ({ ...v, ban, skId, order: max + i + 1 })) })
    ).count;
  }
  return Response.json({ count });
}
