import { napChiMucHoiVien, timHoiVienKhop, type ChiMucHoiVien } from "@/lib/checkin-1010";
import { congDiemCheckinSuKien, khoaDiemSuKien } from "@/lib/diem-su-kien";
import { goDiemTuDong, type NguoiGhiDiem } from "@/lib/diem-tu-dong";
import { prisma } from "@/lib/prisma";
import { chuan } from "@/lib/trung-tam-sk/bang";

/**
 * TRUNG TÂM SỰ KIỆN — check-in khách theo phiên, và nối sang hệ điểm có sẵn:
 * khách là HỘI VIÊN (SkKhach.memberId) có mặt ở ít nhất một phiên thì
 * `ThamDuSuKien` của hội viên đó = DA_CHECKIN và sổ điểm có đúng một dòng
 * "Tham gia …" qua `congDiemCheckinSuKien` (cùng khoá `cisk:` với check-in
 * Mini App → quét hai nơi vẫn chỉ một lần điểm). Bỏ check-in hết các phiên
 * thì lùi lại — CHỈ lùi bản ghi do chính luồng này đánh dấu (`checkinBoi`
 * = DAU_TRUNG_TAM), không đụng lượt BTC quét thẻ trên Mini App.
 */

export const DAU_TRUNG_TAM = "trung-tam-su-kien";

/** Nhóm khách được coi là hội viên Chợ Lớn khi ghép theo tên (xem timHoiVienKhop) */
const nhomDeGhep = (nhom: string | null | undefined) => {
  const n = chuan(nhom ?? "");
  return n.includes("hoi vien") ? "HOI_VIEN" : nhom ?? "";
};

/** Thử ghép hồ sơ hội viên cho khách chưa ghép — thà sót còn hơn ghép nhầm. */
export function ghepHoiVien(
  khach: { ten: string; phone: string | null; donVi: string | null; nhom: string | null },
  cm: ChiMucHoiVien
): string | null {
  return (
    timHoiVienKhop(
      { ten: khach.ten, phone: khach.phone, donVi: khach.donVi, nhom: nhomDeGhep(khach.nhom) },
      cm
    )?.hoiVien.id ?? null
  );
}

export { napChiMucHoiVien };

/**
 * Đưa ThamDuSuKien + điểm của MỘT hội viên ở MỘT sự kiện về đúng với các
 * lượt check-in hiện có ở Trung tâm. Gọi lại bao nhiêu lần cũng ra cùng kết
 * quả. Trả số điểm vừa cộng (để báo "+5 điểm").
 */
export async function dongBoHoiVien(
  eventId: string,
  memberId: string,
  nguoi: NguoiGhiDiem
): Promise<number> {
  const [ev, hv, luot] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, slug: true, title: true, startAt: true },
    }),
    prisma.member.findUnique({ where: { id: memberId }, select: { id: true } }),
    prisma.skThamDu.findMany({
      where: { checkinLuc: { not: null }, khach: { memberId, sk: { eventId } } },
      select: { checkinLuc: true },
      orderBy: { checkinLuc: "asc" },
      take: 1,
    }),
  ]);
  if (!ev || !hv) return 0;
  const somNhat = luot[0]?.checkinLuc ?? null;

  if (somNhat) {
    const cu = await prisma.thamDuSuKien.findUnique({
      where: { eventId_memberId: { eventId, memberId } },
      select: { trangThai: true },
    });
    if (cu?.trangThai !== "DA_CHECKIN") {
      await prisma.thamDuSuKien.upsert({
        where: { eventId_memberId: { eventId, memberId } },
        create: { eventId, memberId, trangThai: "DA_CHECKIN", checkinAt: somNhat, checkinBoi: DAU_TRUNG_TAM },
        update: { trangThai: "DA_CHECKIN", checkinAt: somNhat, checkinBoi: DAU_TRUNG_TAM },
      });
    }
    return congDiemCheckinSuKien({ event: ev, memberId, nguoi });
  }

  // Không còn phiên nào có mặt → lùi bản ghi do Trung tâm đánh dấu
  await prisma.thamDuSuKien.updateMany({
    where: { eventId, memberId, trangThai: "DA_CHECKIN", checkinBoi: DAU_TRUNG_TAM },
    data: { trangThai: "DANG_KY", checkinAt: null, checkinBoi: null },
  });
  const conLai = await prisma.thamDuSuKien.findUnique({
    where: { eventId_memberId: { eventId, memberId } },
    select: { trangThai: true },
  });
  if (conLai?.trangThai !== "DA_CHECKIN") await goDiemTuDong(khoaDiemSuKien(eventId, memberId));
  return 0;
}

export type KetQuaCheckin = {
  ok: true;
  coMat: boolean;
  luc: string | null;
  /** Điểm vừa cộng cho hội viên (0 nếu không phải hội viên / đã có điểm) */
  diem: number;
  memberId: string | null;
};

/**
 * Check-in (coMat = true) hoặc huỷ check-in một khách ở một phiên.
 * Check-in thì tự đánh dấu xác nhận "Tham dự" cho phiên đó. Khách chưa ghép
 * hội viên thì thử ghép ngay lúc này.
 */
export async function datCheckin(d: {
  eventId: string;
  khachId: string;
  phienId: string;
  coMat: boolean;
  nguoi: NguoiGhiDiem;
}): Promise<KetQuaCheckin | { ok: false; error: string }> {
  const khach = await prisma.skKhach.findFirst({
    where: { id: d.khachId, sk: { eventId: d.eventId } },
    select: { id: true, ten: true, phone: true, donVi: true, nhom: true, memberId: true, skId: true },
  });
  if (!khach) return { ok: false, error: "Không tìm thấy khách" };
  const phien = await prisma.skPhien.findFirst({
    where: { id: d.phienId, skId: khach.skId },
    select: { id: true },
  });
  if (!phien) return { ok: false, error: "Phiên không thuộc sự kiện này" };

  let memberId = khach.memberId;
  if (!memberId && d.coMat) {
    memberId = ghepHoiVien(khach, await napChiMucHoiVien());
    if (memberId) await prisma.skKhach.update({ where: { id: khach.id }, data: { memberId } });
  }

  const luc = d.coMat ? new Date() : null;
  await prisma.skThamDu.upsert({
    where: { khachId_phienId: { khachId: khach.id, phienId: phien.id } },
    create: {
      khachId: khach.id,
      phienId: phien.id,
      xacNhan: d.coMat ? "CO" : "CHO",
      checkinLuc: luc,
      checkinBoi: d.coMat ? d.nguoi.ten.slice(0, 120) : null,
    },
    update: d.coMat
      ? { checkinLuc: luc, checkinBoi: d.nguoi.ten.slice(0, 120), xacNhan: "CO" }
      : { checkinLuc: null, checkinBoi: null },
  });

  const diem = memberId ? await dongBoHoiVien(d.eventId, memberId, d.nguoi) : 0;
  return { ok: true, coMat: d.coMat, luc: luc?.toISOString() ?? null, diem, memberId };
}
