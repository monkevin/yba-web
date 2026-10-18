import { prisma } from "@/lib/prisma";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import KhachClient from "./KhachClient";

export default async function KhachMoiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sk, ev } = await napTrang(id, "quanLy");
  const khach = await prisma.skKhach.findMany({
    where: { skId: sk.id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { thamDu: { select: { phienId: true, xacNhan: true, checkinLuc: true } } },
  });
  const hv = await prisma.member.findMany({
    where: { id: { in: khach.map((k) => k.memberId).filter((x): x is string => !!x) } },
    select: { id: true, code: true },
  });
  return (
    <KhachClient
      eventId={ev.id}
      khach={khach}
      phien={sk.phien.map((p) => ({ id: p.id, ten: p.ten }))}
      maHoiVien={Object.fromEntries(hv.map((m) => [m.id, m.code]))}
    />
  );
}
