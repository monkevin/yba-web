import { prisma } from "@/lib/prisma";
import { docCacBan } from "@/lib/trung-tam-sk/may-chu";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import BtcClient from "./BtcClient";

/**
 * Ban tổ chức — ghi vào bảng BanToChuc có sẵn của web: người gắn hồ sơ hội
 * viên được tính điểm cống hiến (diem-hoat-dong) và được quét thẻ ở Mini App.
 */
export default async function BanToChucPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sk, ev } = await napTrang(id, "quanLy");
  const [ds, viec] = await Promise.all([
    prisma.banToChuc.findMany({
      where: { eventId: ev.id },
      orderBy: [{ order: "asc" }],
      include: { member: { select: { code: true } } },
    }),
    prisma.skViec.findMany({ where: { skId: sk.id }, select: { ban: true, trangThai: true, hanChot: true } }),
  ]);
  const now = new Date();
  const tienDo: Record<string, { xong: number; tong: number; tre: number }> = {};
  for (const v of viec) {
    const t = (tienDo[v.ban ?? ""] ??= { xong: 0, tong: 0, tre: 0 });
    t.tong++;
    if (v.trangThai === "XONG") t.xong++;
    else if (v.hanChot && v.hanChot < now) t.tre++;
  }
  return (
    <BtcClient
      eventId={ev.id}
      cacBan={docCacBan(sk.cacBan)}
      ds={ds.map(({ member, ...b }) => ({ ...b, ma: member?.code ?? null }))}
      tienDo={tienDo}
    />
  );
}
