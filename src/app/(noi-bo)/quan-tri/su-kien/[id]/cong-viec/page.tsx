import { prisma } from "@/lib/prisma";
import { docCacBan } from "@/lib/trung-tam-sk/may-chu";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import CongViecClient from "./CongViecClient";

export default async function CongViecPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sk, ev } = await napTrang(id, "quanLy");
  const ds = await prisma.skViec.findMany({ where: { skId: sk.id }, orderBy: [{ hanChot: "asc" }, { order: "asc" }] });
  return <CongViecClient eventId={ev.id} ds={ds} cacBan={docCacBan(sk.cacBan).map((b) => b.ten)} ngaySk={ev.startAt.toISOString()} />;
}
