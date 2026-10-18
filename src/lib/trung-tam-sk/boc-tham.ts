import { randomInt } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Bốc thăm may mắn — máy chủ chọn (trình duyệt chỉ diễn hoạt cảnh), nên bấm
 * hai máy cùng lúc cũng không ra hai người cho một suất: SkTrungGiai unique
 * (skId, khachId) chặn một khách trúng hai lần.
 * Ứng viên: khách ĐÃ CHECK-IN ít nhất một phiên, chưa trúng / chưa bị gọi vắng.
 */
export async function bocTham(
  skId: string,
  giaiId: string
): Promise<
  | { trungId: string; id: string; danhXung: string | null; ten: string; donVi: string | null; ban: string | null; soUngVien: number }
  | { error: string; status: number }
> {
  const giai = await prisma.skGiai.findFirst({ where: { id: giaiId, skId } });
  if (!giai) return { error: "Không tìm thấy giải", status: 404 };

  for (let lan = 0; lan < 3; lan++) {
    const daTrung = await prisma.skTrungGiai.count({ where: { giaiId: giai.id, trangThai: "TRUNG" } });
    if (daTrung >= giai.soLuong) return { error: `"${giai.ten}" đã đủ ${giai.soLuong} người`, status: 400 };
    const ung = await prisma.skKhach.findMany({
      where: { skId, thamDu: { some: { checkinLuc: { not: null } } }, trungGiai: { none: {} } },
      select: { id: true },
    });
    if (!ung.length) return { error: "Không còn khách đã check-in nào chưa trúng giải", status: 400 };
    const khachId = ung[randomInt(ung.length)].id;
    try {
      const t = await prisma.skTrungGiai.create({
        data: { skId, giaiId: giai.id, khachId },
        select: { id: true, khach: { select: { id: true, danhXung: true, ten: true, donVi: true, ban: true } } },
      });
      return { trungId: t.id, ...t.khach, soUngVien: ung.length };
    } catch (e) {
      // Máy khác vừa quay trúng đúng người này → quay lại
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }
  return { error: "Nhiều máy đang quay cùng lúc — bấm lại", status: 409 };
}
