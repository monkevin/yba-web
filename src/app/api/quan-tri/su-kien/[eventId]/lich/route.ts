import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/slug";
import { chuanSoDienThoai } from "@/lib/so-dien-thoai";
import { chuan, gioVN } from "@/lib/trung-tam-sk/bang";
import { ghepHoiVien, napChiMucHoiVien } from "@/lib/trung-tam-sk/checkin";
import { nguoiDungApi } from "@/lib/trung-tam-sk/may-chu";

/**
 * Nối sự kiện ở Trung tâm với mục Lịch hoạt động (trang công khai cho hội
 * viên đăng ký). POST { hanhDong }:
 *  - "tao"  : đưa sự kiện lên Lịch (công bố theo trạng thái công bố của sự kiện)
 *  - "gan"  : gắn mục lịch có sẵn { lichId }
 *  - "go"   : bỏ gắn (mục lịch giữ nguyên)
 *  - "nhap" : đăng ký ĐÃ DUYỆT trên Lịch → khách mời (trùng SĐT bỏ qua);
 *             đăng ký tài trợ → nhà tài trợ "Đang vận động" (cần quyền Tài chính)
 */

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ eventId: string }> }) {
  const a = await nguoiDungApi("quanLy");
  if (a instanceof Response) return a;
  const { eventId } = await ctx.params;
  const sk = await prisma.skSuKien.findUnique({
    where: { eventId },
    select: {
      id: true,
      lichId: true,
      event: { select: { title: true, startAt: true, location: true, summary: true, slug: true, published: true } },
      phien: { select: { id: true, ten: true }, orderBy: { order: "asc" } },
    },
  });
  if (!sk) return Response.json({ error: "Sự kiện chưa bật quản lý ở Trung tâm" }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (b.hanhDong === "tao") {
    if (sk.lichId && (await prisma.lichHoatDong.findUnique({ where: { id: sk.lichId }, select: { id: true } })))
      return Response.json({ error: "Sự kiện đã có trên Lịch hoạt động" }, { status: 400 });
    const ev = sk.event;
    const lich = await prisma.lichHoatDong.create({
      data: {
        tieuDe: ev.title,
        moTa: ev.summary,
        tuNgay: ev.startAt,
        diaDiem: ev.location,
        gioText: gioVN(ev.startAt),
        lienKet: ev.published ? `/su-kien/${ev.slug}` : null,
        // Sự kiện chưa công bố thì mục lịch cũng ẩn — bật ở Lịch hoạt động khi sẵn sàng
        published: ev.published,
        choDangKy: true,
        slug: await uniqueSlug(
          `${ev.title} ${ev.startAt.getFullYear()}`,
          async (s) => !!(await prisma.lichHoatDong.findUnique({ where: { slug: s } }))
        ),
      },
      select: { id: true },
    });
    await prisma.skSuKien.update({ where: { id: sk.id }, data: { lichId: lich.id } });
    revalidatePath("/lich-hoat-dong");
    return Response.json({ ok: true, lichId: lich.id });
  }

  if (b.hanhDong === "gan") {
    const lich = await prisma.lichHoatDong.findUnique({ where: { id: String(b.lichId ?? "") }, select: { id: true } });
    if (!lich) return Response.json({ error: "Không tìm thấy mục lịch" }, { status: 404 });
    await prisma.skSuKien.update({ where: { id: sk.id }, data: { lichId: lich.id } });
    return Response.json({ ok: true });
  }

  if (b.hanhDong === "go") {
    await prisma.skSuKien.update({ where: { id: sk.id }, data: { lichId: null } });
    return Response.json({ ok: true });
  }

  if (b.hanhDong === "nhap") {
    if (!sk.lichId) return Response.json({ error: "Chưa gắn mục Lịch hoạt động" }, { status: 400 });
    const dk = await prisma.dangKyHoatDong.findMany({
      where: { lichId: sk.lichId, status: "DA_DUYET" },
      orderBy: { createdAt: "asc" },
    });
    const khach = await prisma.skKhach.findMany({ where: { skId: sk.id }, select: { phone: true } });
    const daCo = new Set(khach.map((k) => chuanSoDienThoai(k.phone)).filter(Boolean));
    const cm = await napChiMucHoiVien();
    let order = (await prisma.skKhach.aggregate({ where: { skId: sk.id }, _max: { order: true } }))._max.order ?? 0;
    let soKhach = 0;
    let soTrung = 0;
    for (const d of dk.filter((x) => x.loai !== "TAI_TRO")) {
      const so = chuanSoDienThoai(d.phone);
      if (so && daCo.has(so)) {
        soTrung++;
        continue;
      }
      if (so) daCo.add(so);
      // "Phiên" trên Lịch ghi bằng tên, nối dấu phẩy — khớp được thì đánh dấu đúng phiên
      const tenPhien = (d.phien ?? "").split(",").map((x) => chuan(x)).filter(Boolean);
      const phien = sk.phien.filter((p) => !tenPhien.length || tenPhien.includes(chuan(p.ten)));
      const k = await prisma.skKhach.create({
        data: {
          skId: sk.id,
          ten: d.name,
          phone: so || d.phone,
          email: d.email,
          donVi: d.company,
          chucDanh: d.chucVu,
          nhom: d.memberId ? "Hội viên" : "Đăng ký web",
          nguon: "LICH",
          memberId: d.memberId ?? ghepHoiVien({ ten: d.name, phone: d.phone, donVi: d.company, nhom: null }, cm),
          ghiChu: [d.soNguoi > 1 ? `Đi ${d.soNguoi} người` : null, d.ghiChu].filter(Boolean).join(" · ") || null,
          order: ++order,
        },
        select: { id: true },
      });
      await prisma.skThamDu.createMany({
        data: (phien.length ? phien : sk.phien).map((p) => ({ khachId: k.id, phienId: p.id, xacNhan: "CO" })),
      });
      soKhach++;
    }

    let soTaiTro = 0;
    const dkTaiTro = dk.filter((x) => x.loai === "TAI_TRO");
    if (dkTaiTro.length && a.quyen.taiChinh) {
      const ntt = await prisma.taiTroSuKien.findMany({ where: { eventId }, select: { nhaTaiTro: true, memberId: true } });
      const coTen = new Set(ntt.map((t) => chuan(t.nhaTaiTro)));
      const coHv = new Set(ntt.map((t) => t.memberId).filter(Boolean));
      for (const d of dkTaiTro) {
        const ten = d.company || d.name;
        if (coTen.has(chuan(ten)) || (d.memberId && coHv.has(d.memberId))) continue;
        coTen.add(chuan(ten));
        await prisma.taiTroSuKien.create({
          data: {
            suKien: sk.event.title,
            eventId,
            nhaTaiTro: ten,
            memberId: d.memberId,
            mucTaiTro: d.mucTaiTro,
            hienKim: d.soTien,
            giaTri: d.soTien,
            hienVat: d.hienVat,
            // Mới đăng ký trên web — BTC liên hệ chốt rồi mới đổi trạng thái
            trangThai: "Đang vận động",
            lienHe: d.name,
            ghiChu: "Đăng ký tài trợ trên Lịch hoạt động",
          },
        });
        soTaiTro++;
      }
    }
    return Response.json({
      ok: true,
      soKhach,
      soTrung,
      soTaiTro,
      boQuaTaiTro: dkTaiTro.length && !a.quyen.taiChinh ? dkTaiTro.length : 0,
    });
  }

  return Response.json({ error: "Thao tác không hợp lệ" }, { status: 400 });
}
