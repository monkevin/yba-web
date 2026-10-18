import { MOC_1010, SLUG_1010 } from "@/lib/checkin-1010";
import {
  datDiemTuDong,
  docQuyTacDiem,
  type NguoiGhiDiem,
  type QuyTacDiem,
} from "@/lib/diem-tu-dong";
import { prisma } from "@/lib/prisma";

/**
 * Điểm hoạt động tự động cho SỰ KIỆN THƯỜNG: Ban Tổ chức quét thẻ hội viên
 * trên Zalo Mini App (`ThamDuSuKien` = DA_CHECKIN) thì hội viên được một
 * dòng "Tham gia hoạt động" ở /bang-hoat-dong (01/10/2026).
 *
 * Sổ điểm tính từ 10.10.2026 nên chỉ sự kiện diễn ra TỪ ngày đó mới cộng.
 * Riêng Lễ chuyển giao 10/10 có luật theo từng phiên ở checkin-1010.ts —
 * loại khỏi đây để không cộng hai lần.
 */

const TIEN_TO = "cisk:";
export const khoaDiemSuKien = (eventId: string, memberId: string) =>
  `${TIEN_TO}${eventId}:${memberId}`;

export function suKienDuocCongDiem(ev: { slug: string; startAt: Date }): boolean {
  return ev.slug !== SLUG_1010 && ev.startAt >= MOC_1010;
}

/** Gọi ngay sau khi một hội viên được check-in ở sự kiện. Trả số điểm vừa cộng. */
export async function congDiemCheckinSuKien(d: {
  event: { id: string; slug: string; title: string; startAt: Date };
  memberId: string;
  nguoi: NguoiGhiDiem;
  quyTac?: QuyTacDiem;
}): Promise<number> {
  if (!suKienDuocCongDiem(d.event)) return 0;
  const q = d.quyTac ?? (await docQuyTacDiem());
  if (!q.bat || q.suKien <= 0) return 0;
  const r = await datDiemTuDong({
    nguon: khoaDiemSuKien(d.event.id, d.memberId),
    memberId: d.memberId,
    diem: q.suKien,
    loai: "THAM_GIA",
    lyDo: `Tham gia ${d.event.title} — check-in bằng mã QR`,
    nguoi: d.nguoi,
  });
  return r.taoMoi ? r.diem : 0;
}

/**
 * Đưa mọi dòng điểm sự-kiện-thường về đúng với danh sách đã check-in và
 * quy tắc hiện hành — chạy sau khi Ban Điều hành đổi quy tắc điểm.
 */
export async function dongBoDiemSuKienThuong(
  quyTac?: QuyTacDiem
): Promise<{ soDong: number; tongDiem: number }> {
  const q = quyTac ?? (await docQuyTacDiem());
  const coMat = await prisma.thamDuSuKien.findMany({
    where: {
      trangThai: "DA_CHECKIN",
      event: { startAt: { gte: MOC_1010 }, slug: { not: SLUG_1010 } },
    },
    select: {
      memberId: true,
      event: { select: { id: true, slug: true, title: true, startAt: true } },
    },
  });
  const nenCo = new Set<string>();
  if (q.bat && q.suKien > 0) {
    for (const t of coMat) {
      nenCo.add(khoaDiemSuKien(t.event.id, t.memberId));
      await datDiemTuDong({
        nguon: khoaDiemSuKien(t.event.id, t.memberId),
        memberId: t.memberId,
        diem: q.suKien,
        loai: "THAM_GIA",
        lyDo: `Tham gia ${t.event.title} — check-in bằng mã QR`,
        nguoi: { id: "tu-dong", ten: "Tự động theo check-in" },
      });
    }
  }
  // Dòng không còn chỗ dựa (đã tắt cộng điểm, lượt check-in bị gỡ) thì xoá
  const hienCo = await prisma.diemHoatDong.findMany({
    where: { nguon: { startsWith: TIEN_TO } },
    select: { id: true, nguon: true, diem: true },
  });
  const thua = hienCo.filter((d) => !d.nguon || !nenCo.has(d.nguon));
  if (thua.length > 0) {
    await prisma.diemHoatDong.deleteMany({
      where: { id: { in: thua.map((d) => d.id) } },
    });
  }
  const con = hienCo.filter((d) => d.nguon && nenCo.has(d.nguon));
  return {
    soDong: nenCo.size,
    tongDiem: q.bat ? nenCo.size * q.suKien : con.reduce((a, d) => a + d.diem, 0),
  };
}
