import { prisma } from "@/lib/prisma";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import HauCanClient from "./HauCanClient";

export default async function HauCanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sk, ev } = await napTrang(id, "quanLy");
  const ds = await prisma.skHauCan.findMany({ where: { skId: sk.id }, orderBy: [{ order: "asc" }] });
  return <HauCanClient eventId={ev.id} ds={ds} />;
}
