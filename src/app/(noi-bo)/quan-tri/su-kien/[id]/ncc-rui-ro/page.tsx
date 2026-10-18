import { prisma } from "@/lib/prisma";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import NccRuiRoClient from "./NccRuiRoClient";

export default async function NccRuiRoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sk, ev } = await napTrang(id, "quanLy");
  const [ncc, ruiRo] = await Promise.all([
    prisma.skNhaCungCap.findMany({ where: { skId: sk.id }, orderBy: { order: "asc" } }),
    prisma.skRuiRo.findMany({ where: { skId: sk.id }, orderBy: { order: "asc" } }),
  ]);
  return <NccRuiRoClient eventId={ev.id} ncc={ncc} ruiRo={ruiRo} />;
}
