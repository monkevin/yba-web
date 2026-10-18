import { prisma } from "@/lib/prisma";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import HoiDapClient from "./HoiDapClient";

export default async function HoiDapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sk, ev } = await napTrang(id, "quanLy");
  const ds = await prisma.skCauHoi.findMany({ where: { skId: sk.id }, orderBy: { createdAt: "asc" } });
  return <HoiDapClient eventId={ev.id} ds={ds} moHoiDap={sk.moHoiDap} />;
}
