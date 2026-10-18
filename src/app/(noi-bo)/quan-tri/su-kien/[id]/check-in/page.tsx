import { prisma } from "@/lib/prisma";
import { cheSoDienThoai } from "@/lib/so-dien-thoai";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import CheckinClient from "./CheckinClient";

/** Màn check-in ở bàn lễ tân — dùng tốt trên điện thoại / máy tính bảng. */
export default async function CheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sk, ev, quyen } = await napTrang(id, "checkin");
  const khach = await prisma.skKhach.findMany({
    where: { skId: sk.id },
    orderBy: [{ order: "asc" }],
    select: {
      id: true,
      danhXung: true,
      ten: true,
      chucDanh: true,
      donVi: true,
      phone: true,
      nhom: true,
      vip: true,
      ban: true,
      memberId: true,
      thamDu: { select: { phienId: true, xacNhan: true, checkinLuc: true } },
    },
  });
  // Phiên mặc định: phiên đã bắt đầu gần nhất, chưa có giờ thì phiên đầu
  const now = new Date().getTime();
  const daBatDau = sk.phien.filter((p) => p.batDau && p.batDau.getTime() <= now + 30 * 60_000);
  const macDinh = (daBatDau.at(-1) ?? sk.phien[0])?.id ?? "";

  return (
    <CheckinClient
      eventId={ev.id}
      phien={sk.phien.map((p) => ({ id: p.id, ten: p.ten }))}
      phienMacDinh={macDinh}
      khach={khach.map((k) => ({
        ...k,
        // Tình nguyện viên lễ tân chỉ thấy SĐT đã che — đủ để hỏi lại khách
        phone: quyen.quanLy ? k.phone : cheSoDienThoai(k.phone),
        thamDu: k.thamDu.map((t) => ({ ...t, checkinLuc: t.checkinLuc?.toISOString() ?? null })),
      }))}
    />
  );
}
