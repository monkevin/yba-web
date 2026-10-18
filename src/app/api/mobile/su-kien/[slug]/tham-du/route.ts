import { prisma } from "@/lib/prisma";
import { docHoiVien } from "@/lib/mobile-auth";
import { moJson, moOptions } from "@/lib/mobile-cors";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { THU_TU_HOI_VIEN } from "@/lib/xep-hang";

export const OPTIONS = moOptions;

/**
 * Danh sách hội viên sẽ tham dự sự kiện — thứ Khang coi là quan trọng nhất
 * ở mục 5: "Ai sẽ tham gia sự kiện này?" để hội viên chủ động networking.
 *
 * Chỉ hội viên đã xác thực mới xem được ai đi — đây là thông tin nội bộ,
 * không để khách vãng lai thu thập danh sách doanh nhân.
 *
 * GET /api/mobile/su-kien/:slug/tham-du
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const member = await docHoiVien(req);

  const event = await prisma.event.findFirst({
    where: { slug, published: true },
    select: { id: true, title: true, startAt: true, allowSignup: true, capacity: true },
  });
  if (!event) return moJson({ error: "Không tìm thấy sự kiện" }, 404);

  const [soDangKy, soCheckin, cuaToi] = await Promise.all([
    prisma.thamDuSuKien.count({
      where: { eventId: event.id, trangThai: { in: ["DANG_KY", "DA_CHECKIN"] } },
    }),
    prisma.thamDuSuKien.count({ where: { eventId: event.id, trangThai: "DA_CHECKIN" } }),
    member
      ? prisma.thamDuSuKien.findUnique({
          where: { eventId_memberId: { eventId: event.id, memberId: member.id } },
          select: { trangThai: true, soNguoi: true, ghiChu: true, checkinAt: true },
        })
      : Promise.resolve(null),
  ]);

  // Khách chưa xác thực chỉ thấy CON SỐ, không thấy tên ai
  if (!member) {
    return moJson({
      suKien: event,
      soDangKy,
      soCheckin,
      laHoiVien: false,
      cuaToi: null,
      danhSach: [],
    });
  }

  const danhSach = await prisma.thamDuSuKien.findMany({
    where: { eventId: event.id, trangThai: { in: ["DANG_KY", "DA_CHECKIN"] } },
    orderBy: [{ member: { capBac: "asc" } }, { createdAt: "asc" }],
    select: {
      trangThai: true,
      soNguoi: true,
      member: {
        select: {
          slug: true,
          name: true,
          company: true,
          position: true,
          hoiRole: true,
          avatar: true,
          logo: true,
          category: { select: { name: true, icon: true } },
        },
      },
    },
  });

  return moJson({
    suKien: event,
    soDangKy,
    soCheckin,
    laHoiVien: true,
    cuaToi,
    danhSach: danhSach.map((d) => ({
      trangThai: d.trangThai,
      soNguoi: d.soNguoi,
      member: { ...d.member, company: tenDoanhNghiep(d.member.company) },
    })),
  });
}

/**
 * Hội viên tự đăng ký / huỷ đăng ký tham dự.
 * POST /api/mobile/su-kien/:slug/tham-du  { huy?, soNguoi?, ghiChu? }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const member = await docHoiVien(req);
  if (!member) return moJson({ error: "Cần xác thực hội viên" }, 401);

  const { slug } = await params;
  const event = await prisma.event.findFirst({
    where: { slug, published: true },
    select: { id: true },
  });
  if (!event) return moJson({ error: "Không tìm thấy sự kiện" }, 404);

  let than: { huy?: boolean; soNguoi?: number; ghiChu?: string } = {};
  try {
    than = await req.json();
  } catch {
    /* thân rỗng = đăng ký một mình */
  }

  const soNguoi = Math.max(1, Math.min(10, Number(than.soNguoi) || 1));

  // Đã check-in rồi thì không cho tự huỷ hay tự lùi về "đăng ký" — sự thật
  // là đã tới dự (và lượt check-in đó đã được cộng điểm hoạt động).
  const hienCo = await prisma.thamDuSuKien.findUnique({
    where: { eventId_memberId: { eventId: event.id, memberId: member.id } },
    select: { trangThai: true, soNguoi: true, checkinAt: true },
  });
  if (hienCo?.trangThai === "DA_CHECKIN") {
    return moJson({ ok: true, cuaToi: hienCo });
  }

  const ban = await prisma.thamDuSuKien.upsert({
    where: { eventId_memberId: { eventId: event.id, memberId: member.id } },
    create: {
      eventId: event.id,
      memberId: member.id,
      trangThai: than.huy ? "HUY" : "DANG_KY",
      soNguoi,
      ghiChu: than.ghiChu ?? null,
    },
    update: {
      trangThai: than.huy ? "HUY" : "DANG_KY",
      soNguoi,
      ghiChu: than.ghiChu ?? undefined,
    },
    select: { trangThai: true, soNguoi: true, checkinAt: true },
  });

  return moJson({ ok: true, cuaToi: ban });
}
