import { prisma } from "@/lib/prisma";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import XepBanClient from "./XepBanClient";

/** Sơ đồ bàn: ghi vào SkKhach.ban — cùng cột "Bàn" ở danh sách khách và màn check-in. */
export default async function XepBanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sk } = await napTrang(id, "quanLy");
  const ds = await prisma.skKhach.findMany({
    where: { skId: sk.id },
    orderBy: [{ vip: "desc" }, { order: "asc" }],
    select: {
      id: true,
      danhXung: true,
      ten: true,
      donVi: true,
      nhom: true,
      vip: true,
      ban: true,
      moi: true,
      thamDu: { select: { xacNhan: true, checkinLuc: true } },
    },
  });
  return (
    <XepBanClient
      khach={ds.map(({ thamDu, ...k }) => ({
        ...k,
        coDu: thamDu.some((t) => t.xacNhan === "CO"),
        khongDu: k.moi === "TU_CHOI" || (thamDu.length > 0 && thamDu.every((t) => t.xacNhan === "KHONG")),
        coMat: thamDu.some((t) => t.checkinLuc),
      }))}
    />
  );
}
