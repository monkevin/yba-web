import { prisma } from "@/lib/prisma";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import TaiTroClient from "./TaiTroClient";

/** Nhà tài trợ — ghi vào bảng TaiTroSuKien có sẵn (trang vinh danh /tai-tro đọc chung). */
export default async function TaiTroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ev, sk } = await napTrang(id, "taiChinh");
  const [ds, hang] = await Promise.all([
    prisma.taiTroSuKien.findMany({
      where: { eventId: ev.id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { quyenLoi: { orderBy: { order: "asc" } }, member: { select: { code: true } } },
    }),
    prisma.skHangTaiTro.findMany({ where: { skId: sk.id }, orderBy: { order: "asc" } }),
  ]);
  return (
    <TaiTroClient
      eventId={ev.id}
      ds={ds.map(({ member, ...t }) => ({ ...t, ma: member?.code ?? null }))}
      hang={hang}
    />
  );
}
