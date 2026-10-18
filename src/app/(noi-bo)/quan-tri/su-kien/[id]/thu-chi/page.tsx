import { prisma } from "@/lib/prisma";
import { TT_TAI_TRO_CHUA_CHOT } from "@/lib/tai-tro";
import { docCacBan } from "@/lib/trung-tam-sk/may-chu";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import ThuChiClient from "./ThuChiClient";

export default async function ThuChiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sk, ev } = await napTrang(id, "taiChinh");
  const [ds, tt] = await Promise.all([
    prisma.skThuChi.findMany({ where: { skId: sk.id }, orderBy: [{ loai: "asc" }, { order: "asc" }] }),
    prisma.taiTroSuKien.aggregate({
      where: { eventId: ev.id, trangThai: { notIn: TT_TAI_TRO_CHUA_CHOT } },
      _sum: { daThu: true, hienKim: true },
    }),
  ]);
  return (
    <ThuChiClient
      eventId={ev.id}
      ds={ds}
      cacBan={docCacBan(sk.cacBan).map((b) => b.ten)}
      taiTroDaThu={tt._sum.daThu ?? 0}
      taiTroCamKet={tt._sum.hienKim ?? 0}
      mucTieuThu={sk.mucTieuThu}
    />
  );
}
