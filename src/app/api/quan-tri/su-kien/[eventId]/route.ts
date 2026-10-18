import { prisma } from "@/lib/prisma";
import { TRANG_THAI_SU_KIEN, docSo, tuNgayNhap } from "@/lib/trung-tam-sk/bang";
import { dongBoHoiVien } from "@/lib/trung-tam-sk/checkin";
import { LOAI_SU_KIEN } from "@/lib/trung-tam-sk/mau";
import { nguoiDungApi, nguoiGhi } from "@/lib/trung-tam-sk/may-chu";

/**
 * Thông tin chung của một sự kiện ở Trung tâm.
 * PATCH — sửa thông tin (ghi cả vào Event: tên, ngày giờ, địa điểm, công bố).
 * DELETE — gỡ khỏi Trung tâm: xoá lớp tổ chức (khách, việc, kịch bản, thu
 * chi, hậu cần), GIỮ NGUYÊN sự kiện, Ban tổ chức và nhà tài trợ.
 */

export const runtime = "nodejs";

type Ctx = { params: Promise<{ eventId: string }> };

const chuoi = (v: unknown, max = 300) =>
  typeof v === "string" ? v.trim().slice(0, max) || null : undefined;

export async function PATCH(req: Request, ctx: Ctx) {
  const a = await nguoiDungApi("quanLy");
  if (a instanceof Response) return a;
  const { eventId } = await ctx.params;
  const sk = await prisma.skSuKien.findUnique({ where: { eventId }, select: { id: true } });
  if (!sk) return Response.json({ error: "Sự kiện chưa bật quản lý ở Trung tâm" }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const ev: Record<string, unknown> = {};
  if (typeof b.title === "string") {
    if (!b.title.trim()) return Response.json({ error: "Tên sự kiện không được để trống" }, { status: 400 });
    ev.title = b.title.trim().slice(0, 200);
  }
  if (typeof b.ngay === "string") {
    if (!tuNgayNhap(b.ngay)) return Response.json({ error: "Ngày không hợp lệ" }, { status: 400 });
    const gio = typeof b.gio === "string" && /^\d{2}:\d{2}$/.test(b.gio) ? b.gio : "08:00";
    ev.startAt = new Date(`${b.ngay}T${gio}:00+07:00`);
  }
  if ("location" in b) ev.location = chuoi(b.location);
  if ("summary" in b) ev.summary = chuoi(b.summary, 300);
  if (typeof b.published === "boolean") ev.published = b.published;

  const d: Record<string, unknown> = {};
  if (typeof b.loai === "string" && LOAI_SU_KIEN.some((l) => l.value === b.loai)) d.loai = b.loai;
  if (b.quyMo === "nho" || b.quyMo === "vua" || b.quyMo === "lon") d.quyMo = b.quyMo;
  if (typeof b.trangThai === "string" && TRANG_THAI_SU_KIEN.some((t) => t.value === b.trangThai))
    d.trangThai = b.trangThai;
  if ("mucTieuKhach" in b) {
    const n = docSo(b.mucTieuKhach);
    d.mucTieuKhach = n && n > 0 ? Math.round(n) : null;
  }
  if ("mucTieuThu" in b) d.mucTieuThu = Math.max(0, docSo(b.mucTieuThu) ?? 0);
  for (const k of ["ghiChu", "baiHocTot", "baiHocCaiThien"] as const) {
    if (k in b) d[k] = chuoi(b[k], 4000);
  }
  if (Array.isArray(b.cacBan)) {
    const ds = b.cacBan
      .filter((x): x is { ten: unknown; moTa?: unknown } => !!x && typeof x === "object")
      .map((x) => ({ ten: String(x.ten ?? "").trim().slice(0, 80), moTa: String(x.moTa ?? "").trim().slice(0, 300) }))
      .filter((x) => x.ten);
    d.cacBan = JSON.stringify(ds.slice(0, 30));
  }

  await prisma.$transaction([
    ...(Object.keys(ev).length ? [prisma.event.update({ where: { id: eventId }, data: ev })] : []),
    ...(Object.keys(d).length ? [prisma.skSuKien.update({ where: { eventId }, data: d })] : []),
  ]);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const a = await nguoiDungApi("quanLy");
  if (a instanceof Response) return a;
  const { eventId } = await ctx.params;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (b.xacNhan !== "GO") return Response.json({ error: "Thiếu xác nhận" }, { status: 400 });
  const hv = await prisma.skKhach.findMany({
    where: { sk: { eventId }, memberId: { not: null } },
    select: { memberId: true },
  });
  await prisma.skSuKien.deleteMany({ where: { eventId } });
  // Lượt check-in mất theo → đưa điểm hội viên về đúng (lượt quét Mini App giữ nguyên)
  for (const m of new Set(hv.map((x) => x.memberId!))) await dongBoHoiVien(eventId, m, nguoiGhi(a.user));
  return Response.json({ ok: true });
}
