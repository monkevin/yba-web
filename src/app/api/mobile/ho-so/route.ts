import { prisma } from "@/lib/prisma";
import { docHoiVien } from "@/lib/mobile-auth";
import { moJson, moOptions } from "@/lib/mobile-cors";

export const OPTIONS = moOptions;

/** Giới hạn để một người không dán cả bài văn vào hồ sơ danh bạ. */
const DAI_TOI_DA = 600;

const gonLai = (s: unknown) => {
  const v = typeof s === "string" ? s.trim() : "";
  return v ? v.slice(0, DAI_TOI_DA) : null;
};

/**
 * Hội viên tự cập nhật ba câu "LinkedIn nội bộ" của mình.
 * PUT /api/mobile/ho-so  { toiGiupGi, toiCanGi, toiMuonGap }
 *
 * Chỉ sửa được hồ sơ CỦA CHÍNH MÌNH (lấy từ phiên, không nhận memberId từ
 * người gọi). Ba trường này hiện ngay, không cần Ban Chủ nhiệm duyệt — cùng
 * nguyên tắc "sửa xong hiện ngay, hậu kiểm" của hồ sơ doanh nghiệp trên web.
 */
export async function PUT(req: Request) {
  const member = await docHoiVien(req);
  if (!member) return moJson({ error: "Cần xác thực hội viên" }, 401);

  let than: Record<string, unknown>;
  try {
    than = await req.json();
  } catch {
    return moJson({ error: "Dữ liệu gửi lên không hợp lệ" }, 400);
  }

  const daSua = await prisma.member.update({
    where: { id: member.id },
    data: {
      toiGiupGi: gonLai(than.toiGiupGi),
      toiCanGi: gonLai(than.toiCanGi),
      toiMuonGap: gonLai(than.toiMuonGap),
      tagCapNhatLuc: new Date(),
    },
    select: {
      toiGiupGi: true,
      toiCanGi: true,
      toiMuonGap: true,
      tagCapNhatLuc: true,
    },
  });

  return moJson({ ok: true, ...daSua });
}

/** Đọc ba câu của chính mình để đổ vào form. GET /api/mobile/ho-so */
export async function GET(req: Request) {
  const member = await docHoiVien(req);
  if (!member) return moJson({ error: "Cần xác thực hội viên" }, 401);

  const ho = await prisma.member.findUnique({
    where: { id: member.id },
    select: {
      toiGiupGi: true,
      toiCanGi: true,
      toiMuonGap: true,
      tagCapNhatLuc: true,
    },
  });

  return moJson(ho ?? {});
}
