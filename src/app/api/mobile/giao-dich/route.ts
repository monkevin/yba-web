import { prisma } from "@/lib/prisma";
import { docHoiVien } from "@/lib/mobile-auth";
import { moJson, moOptions } from "@/lib/mobile-cors";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import {
  DEAL_STATUS,
  PARTNER_SCOPE,
  loiPhamVi,
  makeDealCode,
} from "@/lib/deal";

export const OPTIONS = moOptions;

/** Sinh mã giao dịch không trùng — cùng quy tắc với khu nội bộ trên web. */
async function maMoi(year: number): Promise<string> {
  const cuoi = await prisma.deal.findFirst({
    where: { code: { startsWith: `GT${year}-` } },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  return makeDealCode(year, cuoi ? Number(cuoi.code.split("-")[1]) + 1 : 1);
}

/**
 * Chỉ số giao thương của Chi hội + giao dịch của chính hội viên.
 * GET /api/mobile/giao-dich
 *
 * Con số công bố CHỈ tính đơn `DA_DUYET` — cùng quy tắc với `/bao-cao` và
 * `/xuc-tien-thuong-mai` trên web, để ba nơi không ra ba số khác nhau.
 */
export async function GET(req: Request) {
  const member = await docHoiVien(req);

  const namNay = new Date().getFullYear();
  const dauNam = new Date(namNay, 0, 1);
  const dauThang = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [nam, thang, cuaToi] = await Promise.all([
    prisma.deal.aggregate({
      where: { status: DEAL_STATUS.DA_DUYET, dealDate: { gte: dauNam } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.deal.aggregate({
      where: { status: DEAL_STATUS.DA_DUYET, dealDate: { gte: dauThang } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    member
      ? prisma.deal.findMany({
          where: {
            OR: [
              { sellerId: member.id },
              { buyerId: member.id },
              { referrerId: member.id },
            ],
          },
          orderBy: { dealDate: "desc" },
          take: 20,
          select: {
            code: true,
            amount: true,
            dealDate: true,
            description: true,
            status: true,
            partnerScope: true,
            externalPartner: true,
            sellerId: true,
            buyerId: true,
            referrerId: true,
            seller: { select: { slug: true, company: true } },
            buyer: { select: { slug: true, company: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  return moJson({
    namNay,
    tongNam: nam._sum.amount ?? 0,
    soDonNam: nam._count._all,
    tongThang: thang._sum.amount ?? 0,
    soDonThang: thang._count._all,
    laHoiVien: !!member,
    cuaToi: cuaToi.map((d) => ({
      ...d,
      vaiTro:
        d.sellerId === member?.id
          ? "BAN"
          : d.buyerId === member?.id
            ? "MUA"
            : "GIOI_THIEU",
      seller: { ...d.seller, company: tenDoanhNghiep(d.seller.company) },
      buyer: { ...d.buyer, company: tenDoanhNghiep(d.buyer.company) },
    })),
  });
}

/**
 * Hội viên khai một giao dịch nội bộ.
 * POST /api/mobile/giao-dich
 *   { doiTacSlug, vaiTro: "BAN"|"MUA", amount, dealDate, description,
 *     nguoiKetNoiSlug?, partnerScope?, externalPartner?, externalOrg? }
 *
 * Đơn khai xong vào `CHO_DOI_TAC` — đối tác phải xác nhận rồi Ban Chủ nhiệm
 * mới duyệt. Không cho tự khai thẳng vào DA_DUYET, nếu không con số "Chi hội
 * tạo ra bao nhiêu tỷ" mất hết giá trị.
 */
export async function POST(req: Request) {
  const member = await docHoiVien(req);
  if (!member) return moJson({ error: "Cần xác thực hội viên" }, 401);

  let than: Record<string, unknown>;
  try {
    than = await req.json();
  } catch {
    return moJson({ error: "Dữ liệu gửi lên không hợp lệ" }, 400);
  }

  const vaiTro = than.vaiTro === "MUA" ? "MUA" : "BAN";
  const soTien = Number(String(than.amount ?? "").replace(/[^\d]/g, ""));
  if (!soTien || soTien <= 0) return moJson({ error: "Nhập giá trị giao dịch" }, 400);

  const ngay = than.dealDate ? new Date(String(than.dealDate)) : new Date();
  if (Number.isNaN(ngay.getTime())) return moJson({ error: "Ngày giao dịch không hợp lệ" }, 400);

  const scope = String(than.partnerScope ?? PARTNER_SCOPE.NOI_CHI_HOI);
  const externalOrg = than.externalOrg ? String(than.externalOrg) : null;
  const loi = loiPhamVi(scope, externalOrg);
  if (loi) return moJson({ error: loi }, 400);

  // Đối tác là hội viên (nội Chi hội) hay ngoài Hội
  let doiTacId: string | null = null;
  if (scope === PARTNER_SCOPE.NOI_CHI_HOI) {
    if (!than.doiTacSlug) return moJson({ error: "Chọn doanh nghiệp đối tác" }, 400);
    const dt = await prisma.member.findFirst({
      where: { slug: String(than.doiTacSlug), active: true },
      select: { id: true },
    });
    if (!dt) return moJson({ error: "Không tìm thấy doanh nghiệp đối tác" }, 404);
    if (dt.id === member.id) return moJson({ error: "Đối tác không thể là chính mình" }, 400);
    doiTacId = dt.id;
  } else if (!than.externalPartner) {
    return moJson({ error: "Ghi tên doanh nghiệp đối tác" }, 400);
  }

  let nguoiKetNoiId: string | null = null;
  if (than.nguoiKetNoiSlug) {
    const nk = await prisma.member.findFirst({
      where: { slug: String(than.nguoiKetNoiSlug), active: true },
      select: { id: true },
    });
    nguoiKetNoiId = nk?.id ?? null;
  }

  // Deal bắt buộc có cả sellerId và buyerId. Với đối tác ngoài Hội, đặt hội
  // viên khai vào cả hai đầu rồi ghi tên đối tác thật ở `externalPartner` —
  // giống cách khu nội bộ trên web đang làm.
  const sellerId = vaiTro === "BAN" ? member.id : (doiTacId ?? member.id);
  const buyerId = vaiTro === "MUA" ? member.id : (doiTacId ?? member.id);

  const nguoiDung = await prisma.user.findFirst({
    where: { memberId: member.id },
    select: { id: true },
  });
  if (!nguoiDung) {
    return moJson(
      { error: "Tài khoản của anh/chị chưa được cấp trên hệ thống — báo Ban Thư ký" },
      400
    );
  }

  const deal = await prisma.deal.create({
    data: {
      code: await maMoi(ngay.getFullYear()),
      sellerId,
      buyerId,
      referrerId: nguoiKetNoiId,
      amount: soTien,
      dealDate: ngay,
      description: than.description ? String(than.description).slice(0, 1000) : null,
      status: DEAL_STATUS.CHO_DOI_TAC,
      partnerScope: scope,
      externalPartner: than.externalPartner ? String(than.externalPartner) : null,
      externalOrg,
      createdByUserId: nguoiDung.id,
      createdSide: vaiTro === "BAN" ? "SELLER" : "BUYER",
    },
    select: { code: true, amount: true, status: true },
  });

  return moJson({ ok: true, deal });
}
