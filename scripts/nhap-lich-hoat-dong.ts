/**
 * Tạo lịch hoạt động sắp tới ban đầu. Chạy nhiều lần không tạo trùng.
 *
 *   npm run nhap-lich
 */
import { prisma } from "../src/lib/prisma";
import { LICH_MAC_DINH } from "../prisma/lich-hoat-dong-mac-dinh";

(async () => {
  let them = 0;
  for (const m of LICH_MAC_DINH) {
    const daCo = await prisma.lichHoatDong.findFirst({
      where: { tieuDe: m.tieuDe },
      select: { id: true },
    });
    if (daCo) continue;

    await prisma.lichHoatDong.create({
      data: {
        tieuDe: m.tieuDe,
        moTa: m.moTa ?? null,
        tuNgay: new Date(`${m.tuNgay}T09:00:00`),
        denNgay: m.denNgay ? new Date(`${m.denNgay}T18:00:00`) : null,
        diaDiem: m.diaDiem ?? null,
        nguon: m.nguon,
        noiBat: m.noiBat ?? false,
        order: m.order,
      },
    });
    them++;
  }

  const tong = await prisma.lichHoatDong.count();
  console.log(`Thêm ${them} mục. Lịch hiện có ${tong} hoạt động.`);
  await prisma.$disconnect();
})();
