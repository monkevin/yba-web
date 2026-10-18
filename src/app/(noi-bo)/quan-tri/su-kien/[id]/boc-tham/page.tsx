import { prisma } from "@/lib/prisma";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import BocThamClient from "./BocThamClient";

export default async function BocThamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sk, ev } = await napTrang(id, "quanLy");
  const [giai, ungVien] = await Promise.all([
    prisma.skGiai.findMany({
      where: { skId: sk.id },
      orderBy: { order: "asc" },
      include: {
        trung: {
          orderBy: { luc: "asc" },
          select: { id: true, trangThai: true, khach: { select: { danhXung: true, ten: true, donVi: true, ban: true } } },
        },
      },
    }),
    // Chỉ tên (để diễn hoạt cảnh quay) — người trúng do máy chủ chọn
    prisma.skKhach.findMany({
      where: { skId: sk.id, thamDu: { some: { checkinLuc: { not: null } } }, trungGiai: { none: {} } },
      select: { ten: true },
      take: 400,
    }),
  ]);
  return (
    <BocThamClient
      eventId={ev.id}
      tieuDe={ev.title}
      giai={giai.map(({ trung, ...g }) => ({ ...g, trung: trung.map((t) => ({ id: t.id, trangThai: t.trangThai, ...t.khach })) }))}
      tenUngVien={ungVien.map((k) => k.ten)}
    />
  );
}
