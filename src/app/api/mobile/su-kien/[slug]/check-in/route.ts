import { prisma } from "@/lib/prisma";
import { congDiemCheckinSuKien } from "@/lib/diem-su-kien";
import { docHoiVien } from "@/lib/mobile-auth";
import { moJson, moOptions } from "@/lib/mobile-cors";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { CAP_BAC } from "@/lib/xep-hang";

export const OPTIONS = moOptions;

/**
 * Ban Tổ chức quét mã QR thẻ hội viên để check-in.
 * POST /api/mobile/su-kien/:slug/check-in  { ma: "YBACL:HV0001" }
 *
 * Ai được quét: Ban Chủ nhiệm / Ban Chấp hành (capBac <= 2) hoặc người có
 * tên trong Ban Tổ chức của chính sự kiện đó. Hội viên thường không tự
 * check-in cho mình được — nếu không con số tham dự sẽ không đáng tin.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const nguoiQuet = await docHoiVien(req);
  if (!nguoiQuet) return moJson({ error: "Cần xác thực hội viên" }, 401);

  const { slug } = await params;
  const event = await prisma.event.findFirst({
    where: { slug, published: true },
    select: { id: true, title: true, slug: true, startAt: true },
  });
  if (!event) return moJson({ error: "Không tìm thấy sự kiện" }, 404);

  const [capBac, trongBTC] = await Promise.all([
    prisma.member
      .findUnique({ where: { id: nguoiQuet.id }, select: { capBac: true } })
      .then((m) => m?.capBac ?? 99),
    prisma.banToChuc.count({ where: { eventId: event.id, memberId: nguoiQuet.id } }),
  ]);

  if (capBac > CAP_BAC.BAN_CHAP_HANH && trongBTC === 0) {
    return moJson(
      { error: "Chỉ Ban Tổ chức hoặc Ban Chấp hành mới quét check-in được" },
      403
    );
  }

  let than: { ma?: string } = {};
  try {
    than = await req.json();
  } catch {
    return moJson({ error: "Thiếu mã QR" }, 400);
  }

  // Mã trong thẻ hội viên có dạng "YBACL:HV0001"; chấp nhận cả khi chỉ dán mã HV
  const maHV = (than.ma ?? "").trim().replace(/^YBACL:/i, "").toUpperCase();
  if (!maHV) return moJson({ error: "Thiếu mã QR" }, 400);

  const khach = await prisma.member.findUnique({
    where: { code: maHV },
    select: { id: true, code: true, name: true, company: true, position: true, avatar: true },
  });
  if (!khach) {
    return moJson({ error: `Không tìm thấy hội viên có mã ${maHV}` }, 404);
  }

  const daCo = await prisma.thamDuSuKien.findUnique({
    where: { eventId_memberId: { eventId: event.id, memberId: khach.id } },
    select: { trangThai: true, checkinAt: true },
  });

  if (daCo?.trangThai === "DA_CHECKIN") {
    return moJson({
      ok: true,
      daCheckinTruoc: true,
      checkinAt: daCo.checkinAt,
      member: { ...khach, company: tenDoanhNghiep(khach.company) },
    });
  }

  // Chưa đăng ký trước vẫn check-in được — nhiều hội viên tới thẳng không ghi danh
  await prisma.thamDuSuKien.upsert({
    where: { eventId_memberId: { eventId: event.id, memberId: khach.id } },
    create: {
      eventId: event.id,
      memberId: khach.id,
      trangThai: "DA_CHECKIN",
      checkinAt: new Date(),
      checkinBoi: nguoiQuet.code,
    },
    update: {
      trangThai: "DA_CHECKIN",
      checkinAt: new Date(),
      checkinBoi: nguoiQuet.code,
    },
  });

  const soCheckin = await prisma.thamDuSuKien.count({
    where: { eventId: event.id, trangThai: "DA_CHECKIN" },
  });

  // Điểm hoạt động tự động (sổ /bang-hoat-dong, tính từ 10.10.2026). Lỗi
  // ở khâu điểm không được làm hỏng lượt check-in vừa ghi xong.
  let diemHoatDong = 0;
  try {
    diemHoatDong = await congDiemCheckinSuKien({
      event,
      memberId: khach.id,
      nguoi: {
        id: `hv:${nguoiQuet.id}`,
        ten: `${nguoiQuet.name} (quét thẻ trên Mini App)`,
      },
    });
  } catch (e) {
    console.error("Cộng điểm check-in lỗi:", e);
  }

  return moJson({
    ok: true,
    daCheckinTruoc: false,
    dangKyTruoc: !!daCo,
    diemHoatDong,
    soCheckin,
    member: { ...khach, company: tenDoanhNghiep(khach.company) },
  });
}
