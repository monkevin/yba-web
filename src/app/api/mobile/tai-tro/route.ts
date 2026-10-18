import { prisma } from "@/lib/prisma";
import { docHoiVien } from "@/lib/mobile-auth";
import { moJson, moOptions } from "@/lib/mobile-cors";

export const OPTIONS = moOptions;

/**
 * Chương trình đang kêu gọi tài trợ và các gói — cùng dữ liệu với /tai-tro.
 * GET  /api/mobile/tai-tro
 * POST /api/mobile/tai-tro  { duAnSlug, goiId?, ghiChu? }  → đăng ký đồng hành
 *
 * Số tiền trong CSDL lưu bằng VND. Trả thêm `soTienTrieu` để Mini App khỏi phải
 * tự chia — màn hình điện thoại hẹp, hiện "100 triệu" gọn hơn "100.000.000 ₫".
 */

const trieu = (vnd: number) => Math.round(vnd / 1_000_000);

export async function GET(req: Request) {
  const member = await docHoiVien(req);

  const duAn = await prisma.duAnTaiTro.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: {
      slug: true,
      ten: true,
      tomTat: true,
      moTa: true,
      anh: true,
      mucTieu: true,
      daGop: true,
      goi: {
        where: { active: true },
        orderBy: [{ noiBat: "desc" }, { soTien: "desc" }, { order: "asc" }],
        select: { id: true, ten: true, soTien: true, quyenLoi: true, noiBat: true },
      },
    },
  });

  return moJson({
    laHoiVien: !!member,
    duAn: duAn.map((d) => ({
      ...d,
      mucTieuTrieu: trieu(d.mucTieu),
      daGopTrieu: trieu(d.daGop),
      phanTram: d.mucTieu > 0 ? Math.min(100, Math.round((d.daGop / d.mucTieu) * 100)) : null,
      goi: d.goi.map((g) => ({
        ...g,
        soTienTrieu: trieu(g.soTien),
        quyenLoi: (g.quyenLoi ?? "")
          .split(/\r?\n/)
          .map((x) => x.trim())
          .filter(Boolean),
      })),
    })),
  });
}

export async function POST(req: Request) {
  const member = await docHoiVien(req);
  if (!member) return moJson({ error: "Cần xác thực hội viên" }, 401);

  let than: Record<string, unknown>;
  try {
    than = await req.json();
  } catch {
    return moJson({ error: "Dữ liệu gửi lên không hợp lệ" }, 400);
  }

  const duAnSlug = String(than.duAnSlug ?? "").trim();
  if (!duAnSlug) return moJson({ error: "Thiếu chương trình tài trợ" }, 400);

  const duAn = await prisma.duAnTaiTro.findFirst({
    where: { slug: duAnSlug, active: true },
    select: { id: true, ten: true },
  });
  if (!duAn) return moJson({ error: "Không tìm thấy chương trình" }, 404);

  const goiId = than.goiId ? String(than.goiId) : null;
  if (goiId) {
    const goi = await prisma.goiTaiTro.findFirst({
      where: { id: goiId, duAnId: duAn.id, active: true },
      select: { id: true },
    });
    if (!goi) return moJson({ error: "Gói tài trợ không hợp lệ" }, 400);
  }

  await prisma.dangKyTaiTro.create({
    data: {
      duAnId: duAn.id,
      goiId,
      memberId: member.id,
      name: member.name,
      phone: member.phone ?? "",
      email: member.email,
      company: member.company,
      // `loiNhan` là lời hội viên gửi kèm; `ghiChu` để Ban Tài trợ tự ghi khi
      // xử lý — đừng đổ nội dung của hội viên vào đó.
      loiNhan: than.ghiChu ? String(than.ghiChu).slice(0, 500) : null,
    },
  });

  return moJson({
    ok: true,
    message: `Đã gửi đăng ký đồng hành cùng ${duAn.ten}. Ban Tài trợ sẽ liên hệ anh/chị.`,
  });
}
