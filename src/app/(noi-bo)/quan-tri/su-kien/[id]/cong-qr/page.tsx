import { prisma } from "@/lib/prisma";
import { NGUOI_TU_CHECKIN } from "@/lib/trung-tam-sk/cong";
import { gocWeb } from "@/lib/trung-tam-sk/goc-web";
import { damBaoMaCong } from "@/lib/trung-tam-sk/may-chu";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import CongQrClient from "./CongQrClient";

/**
 * Cổng QR cho khách: bật / tắt từng cổng, PIN tự check-in, mã QR để in.
 * Sự kiện tạo từ đợt 1 chưa có mã cổng → cấp ngay khi mở tab.
 */
export default async function CongQrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sk, ev } = await napTrang(id, "quanLy");
  const { ma, pinCheckin } = await damBaoMaCong(sk.id);
  const [dangKy, tuCheckin, cauHoi, danhGia] = await Promise.all([
    prisma.skKhach.count({ where: { skId: sk.id, nguon: "ONLINE" } }),
    prisma.skThamDu.count({ where: { khach: { skId: sk.id }, checkinBoi: NGUOI_TU_CHECKIN.ten } }),
    prisma.skCauHoi.count({ where: { skId: sk.id } }),
    prisma.skDanhGia.count({ where: { skId: sk.id } }),
  ]);
  return (
    <CongQrClient
      eventId={ev.id}
      tieuDe={ev.title}
      goc={`${await gocWeb()}/sk/${ma}`}
      duong={`/sk/${ma}`}
      pin={pinCheckin}
      mo={{ moDangKy: sk.moDangKy, moTuCheckin: sk.moTuCheckin, moHoiDap: sk.moHoiDap, moDanhGia: sk.moDanhGia }}
      dem={{ moDangKy: dangKy, moTuCheckin: tuCheckin, moHoiDap: cauHoi, moDanhGia: danhGia }}
    />
  );
}
