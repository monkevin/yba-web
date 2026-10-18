import { prisma } from "@/lib/prisma";
import { datCheckin, ghepHoiVien, napChiMucHoiVien } from "@/lib/trung-tam-sk/checkin";
import { nguoiDungApi, nguoiGhi } from "@/lib/trung-tam-sk/may-chu";

/**
 * Bàn lễ tân: check-in / huỷ check-in một khách ở một phiên.
 * Gửi `themKhach: { ten, donVi, phone }` thay cho khachId = khách vãng lai:
 * thêm vào danh sách (nguồn LE_TAN) rồi check-in luôn.
 */

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ eventId: string }> }) {
  const a = await nguoiDungApi("checkin");
  if (a instanceof Response) return a;
  const { eventId } = await ctx.params;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (b.themKhach && typeof b.themKhach === "object" && typeof b.phienId === "string") {
    const t = b.themKhach as Record<string, unknown>;
    const ten = String(t.ten ?? "").trim().slice(0, 200);
    if (!ten) return Response.json({ error: "Nhập tên khách" }, { status: 400 });
    const sk = await prisma.skSuKien.findUnique({ where: { eventId }, select: { id: true } });
    if (!sk) return Response.json({ error: "Sự kiện chưa bật quản lý ở Trung tâm" }, { status: 404 });
    const donVi = String(t.donVi ?? "").trim().slice(0, 300) || null;
    const phone = String(t.phone ?? "").trim().slice(0, 30) || null;
    const max = await prisma.skKhach.aggregate({ where: { skId: sk.id }, _max: { order: true } });
    const moi = await prisma.skKhach.create({
      data: {
        skId: sk.id,
        ten,
        donVi,
        phone,
        nhom: "Khách vãng lai",
        nguon: "LE_TAN",
        memberId: ghepHoiVien({ ten, phone, donVi, nhom: null }, await napChiMucHoiVien()),
        order: (max._max.order ?? 0) + 1,
      },
      select: { id: true },
    });
    b.khachId = moi.id;
  }
  if (typeof b.khachId !== "string" || typeof b.phienId !== "string")
    return Response.json({ error: "Thiếu khách hoặc phiên" }, { status: 400 });
  const r = await datCheckin({
    eventId,
    khachId: b.khachId,
    phienId: b.phienId,
    coMat: b.coMat !== false,
    nguoi: nguoiGhi(a.user),
  });
  if (!r.ok) return Response.json({ error: r.error }, { status: 404 });
  return Response.json(r);
}
