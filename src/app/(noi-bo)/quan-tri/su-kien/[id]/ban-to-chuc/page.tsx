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
  const ds = await prisma.banToChuc.findMany({
    where: { eventId: ev.id },
    orderBy: [{ order: "asc" }],
    include: { member: { select: { code: true } } },
  });
  return (
    <BtcClient
      eventId={ev.id}
      cacBan={docCacBan(sk.cacBan)}
      ds={ds.map(({ member, ...b }) => ({ ...b, ma: member?.code ?? null }))}
    />
  );
}
