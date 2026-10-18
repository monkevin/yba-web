import { prisma } from "@/lib/prisma";
import { moJson, moOptions } from "@/lib/mobile-cors";
import { docHoiVien } from "@/lib/mobile-auth";

export const OPTIONS = moOptions;

/**
 * Lịch hoạt động Chi hội (mục 6) — gộp ba nguồn vào một dòng thời gian:
 *  1. `LichHoatDong` — chương trình Ban Chủ nhiệm lên lịch trước
 *  2. `Event` sắp diễn ra — sự kiện đã có trang riêng
 *  3. Sinh nhật hội viên trong 30 ngày tới (mục 16) — chỉ cho hội viên xem
 *
 * GET /api/mobile/lich
 */
export async function GET(req: Request) {
  const member = await docHoiVien(req);
  const homNay = new Date();
  homNay.setHours(0, 0, 0, 0);
  const sau90 = new Date(homNay.getTime() + 90 * 24 * 60 * 60 * 1000);

  const [hoatDong, suKien] = await Promise.all([
    prisma.lichHoatDong.findMany({
      where: { published: true, tuNgay: { gte: homNay } },
      orderBy: { tuNgay: "asc" },
      take: 30,
      select: {
        slug: true,
        tieuDe: true,
        moTa: true,
        anhBia: true,
        tuNgay: true,
        denNgay: true,
        diaDiem: true,
        gioText: true,
        nguon: true,
        noiBat: true,
      },
    }),
    prisma.event.findMany({
      where: { published: true, startAt: { gte: homNay, lte: sau90 } },
      orderBy: { startAt: "asc" },
      take: 20,
      select: {
        slug: true,
        title: true,
        summary: true,
        coverImage: true,
        startAt: true,
        location: true,
        activityGroup: true,
      },
    }),
  ]);

  // Sinh nhật là thông tin cá nhân — chỉ hội viên đã xác thực mới xem
  let sinhNhat: { name: string; company: string; slug: string; ngay: number; thang: number }[] = [];
  if (member) {
    const ai = await prisma.member.findMany({
      where: { active: true, publicVisible: true, birthday: { not: null } },
      select: { slug: true, name: true, company: true, birthday: true },
    });

    const trong30Ngay = (bd: Date) => {
      const nam = homNay.getFullYear();
      // So theo ngày–tháng, bỏ qua năm sinh
      let ngayNay = new Date(nam, bd.getMonth(), bd.getDate());
      if (ngayNay < homNay) ngayNay = new Date(nam + 1, bd.getMonth(), bd.getDate());
      const cach = (ngayNay.getTime() - homNay.getTime()) / (24 * 60 * 60 * 1000);
      return cach >= 0 && cach <= 30;
    };

    sinhNhat = ai
      .filter((m) => m.birthday && trong30Ngay(m.birthday))
      .map((m) => ({
        slug: m.slug,
        name: m.name,
        company: m.company,
        ngay: m.birthday!.getDate(),
        thang: m.birthday!.getMonth() + 1,
      }))
      .sort((a, b) => {
        const th = new Date().getMonth() + 1;
        const key = (x: typeof a) => ((x.thang - th + 12) % 12) * 100 + x.ngay;
        return key(a) - key(b);
      })
      .slice(0, 12);
  }

  return moJson({ hoatDong, suKien, sinhNhat, laHoiVien: !!member });
}
