import { prisma } from "@/lib/prisma";
import { docCacBan } from "@/lib/trung-tam-sk/may-chu";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import CongViecClient from "./CongViecClient";

export default async function CongViecPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ban?: string }>;
}) {
  const { id } = await params;
  const { ban } = await searchParams;
  const { sk, ev } = await napTrang(id, "quanLy");
  const [ds, btc] = await Promise.all([
    prisma.skViec.findMany({ where: { skId: sk.id }, orderBy: [{ hanChot: "asc" }, { order: "asc" }] }),
    prisma.banToChuc.findMany({ where: { eventId: ev.id }, select: { hoTen: true, ban: true }, orderBy: { order: "asc" } }),
  ]);
  // Gợi ý "Người làm" = người trong chính ban đó
  const nguoiTheoBan: Record<string, string[]> = {};
  for (const b of btc) (nguoiTheoBan[b.ban ?? ""] ??= []).push(b.hoTen);
  return (
    <CongViecClient
      eventId={ev.id}
      ds={ds}
      cacBan={docCacBan(sk.cacBan).map((b) => b.ten)}
      ngaySk={ev.startAt.toISOString()}
      banChon={typeof ban === "string" ? ban : ""}
      nguoiTheoBan={nguoiTheoBan}
    />
  );
}
