import { prisma } from "@/lib/prisma";
import { gioVN, ngayNhap } from "@/lib/trung-tam-sk/bang";
import { docCacBan } from "@/lib/trung-tam-sk/may-chu";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import ThongTinClient from "./ThongTinClient";

export default async function ThongTinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sk, ev } = await napTrang(id, "quanLy");
  const phien = await prisma.skPhien.findMany({ where: { skId: sk.id }, orderBy: { order: "asc" } });
  return (
    <ThongTinClient
      eventId={ev.id}
      slug={ev.slug}
      phien={phien}
      dau={{
        title: ev.title,
        ngay: ngayNhap(ev.startAt),
        gio: gioVN(ev.startAt),
        location: ev.location ?? "",
        summary: ev.summary ?? "",
        published: ev.published,
        loai: sk.loai,
        quyMo: sk.quyMo,
        trangThai: sk.trangThai,
        mucTieuKhach: sk.mucTieuKhach ? String(sk.mucTieuKhach) : "",
        mucTieuThu: sk.mucTieuThu ? String(sk.mucTieuThu) : "",
        ghiChu: sk.ghiChu ?? "",
        baiHocTot: sk.baiHocTot ?? "",
        baiHocCaiThien: sk.baiHocCaiThien ?? "",
      }}
      cacBan={docCacBan(sk.cacBan)}
    />
  );
}
