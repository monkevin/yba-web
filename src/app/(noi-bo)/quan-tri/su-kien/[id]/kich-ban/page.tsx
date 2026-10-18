import { prisma } from "@/lib/prisma";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import KichBanClient from "./KichBanClient";

export default async function KichBanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sk, ev } = await napTrang(id, "quanLy");
  const ds = await prisma.skKichBan.findMany({ where: { skId: sk.id }, orderBy: { order: "asc" } });
  return <KichBanClient eventId={ev.id} ds={ds} phien={sk.phien.map((p) => ({ value: p.id, label: p.ten }))} />;
}
