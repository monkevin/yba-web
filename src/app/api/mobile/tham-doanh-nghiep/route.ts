import { prisma } from "@/lib/prisma";
import { docHoiVien } from "@/lib/mobile-auth";
import { moJson, moOptions } from "@/lib/mobile-cors";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";

export const OPTIONS = moOptions;

/**
 * Chương trình đi thăm doanh nghiệp hội viên — cùng dữ liệu với /tham-doanh-nghiep.
 * GET  /api/mobile/tham-doanh-nghiep
 * POST /api/mobile/tham-doanh-nghiep  { slug, soNguoi?, ghiChu? }  → ghi danh
 *
 * Chỉ trả các đợt đã được Ban Chủ nhiệm duyệt trở đi (DA_DUYET, DA_DONG,
 * DA_TO_CHUC) — đợt còn ở DE_XUAT là chủ nhà mới ngỏ ý, chưa chốt, đưa lên app
 * là hội viên tưởng đã có lịch. Luồng trạng thái xem `src/lib/tham-dn.ts`.
 */

const HIEN = ["DA_DUYET", "DA_DONG", "DA_TO_CHUC"] as const;

const NHAN_TRANG_THAI: Record<string, string> = {
  DA_DUYET: "Đang mở đăng ký",
  DA_DONG: "Đã đóng đăng ký",
  DA_TO_CHUC: "Đã tổ chức",
};

export async function GET(req: Request) {
  const member = await docHoiVien(req);

  const ds = await prisma.thamDoanhNghiep.findMany({
    where: { status: { in: [...HIEN] } },
    orderBy: [{ ngayToChuc: "desc" }, { createdAt: "desc" }],
    take: 40,
    select: {
      slug: true,
      tieuDe: true,
      gioiThieu: true,
      noiDungTham: true,
      diaChi: true,
      ngayToChuc: true,
      ngayMongMuon: true,
      soLuongToiDa: true,
      anhBia: true,
      status: true,
      member: { select: { slug: true, name: true, company: true, logo: true, avatar: true } },
      _count: { select: { dangKy: true } },
      ...(member
        ? { dangKy: { where: { memberId: member.id }, select: { id: true, status: true } } }
        : {}),
    },
  });

  return moJson({
    laHoiVien: !!member,
    dot: ds.map((d) => ({
      ...d,
      nhanTrangThai: NHAN_TRANG_THAI[d.status] ?? d.status,
      moDangKy: d.status === "DA_DUYET",
      soDangKy: d._count.dangKy,
      toiDaDangKy: Array.isArray((d as { dangKy?: unknown[] }).dangKy)
        ? (d as { dangKy: unknown[] }).dangKy.length > 0
        : false,
      member: { ...d.member, company: tenDoanhNghiep(d.member.company) },
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

  const slug = String(than.slug ?? "").trim();
  if (!slug) return moJson({ error: "Thiếu đợt thăm" }, 400);

  const dot = await prisma.thamDoanhNghiep.findFirst({
    where: { slug },
    select: { id: true, tieuDe: true, status: true, soLuongToiDa: true },
  });
  if (!dot) return moJson({ error: "Không tìm thấy đợt thăm" }, 404);
  if (dot.status !== "DA_DUYET") {
    return moJson({ error: "Đợt này đã đóng đăng ký" }, 400);
  }

  const daCo = await prisma.dangKyTham.findFirst({
    where: { thamId: dot.id, memberId: member.id, status: { not: "HUY" } },
    select: { id: true },
  });
  if (daCo) return moJson({ ok: true, daDangKy: true, message: "Anh/chị đã ghi danh đợt này" });

  const soNguoi = Math.max(1, Math.min(20, Number(than.soNguoi ?? 1) || 1));

  // Đủ chỗ chưa — đếm theo số NGƯỜI chứ không phải số lượt đăng ký
  if (dot.soLuongToiDa) {
    const dsCu = await prisma.dangKyTham.findMany({
      where: { thamId: dot.id, status: { not: "HUY" } },
      select: { soNguoi: true },
    });
    const daCoNguoi = dsCu.reduce((t, x) => t + x.soNguoi, 0);
    if (daCoNguoi + soNguoi > dot.soLuongToiDa) {
      return moJson(
        { error: `Đợt này chỉ còn ${Math.max(0, dot.soLuongToiDa - daCoNguoi)} chỗ` },
        400
      );
    }
  }

  await prisma.dangKyTham.create({
    data: {
      thamId: dot.id,
      memberId: member.id,
      name: member.name,
      phone: member.phone ?? "",
      company: member.company,
      soNguoi,
      ghiChu: than.ghiChu ? String(than.ghiChu).slice(0, 500) : null,
    },
  });

  return moJson({
    ok: true,
    message: `Đã ghi danh ${dot.tieuDe}. Ban Tổ chức sẽ xác nhận với anh/chị.`,
  });
}
