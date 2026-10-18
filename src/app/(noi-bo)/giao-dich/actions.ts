"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, isAdmin, isBackOffice } from "@/lib/auth";
import {
  DEAL_STATUS,
  PARTNER_SCOPE,
  canConfirm,
  canEdit,
  canReview,
  canTenToChuc,
  loiPhamVi,
  makeDealCode,
} from "@/lib/deal";

export type ActionResult = { error?: string; ok?: boolean };

/** Sinh mã giao dịch không trùng cho năm hiện tại. */
async function nextDealCode(year: number): Promise<string> {
  const last = await prisma.deal.findFirst({
    where: { code: { startsWith: `GT${year}-` } },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  const seq = last ? Number(last.code.split("-")[1]) + 1 : 1;
  return makeDealCode(year, seq);
}

function parseAmount(raw: FormDataEntryValue | null): number {
  // Chấp nhận "1.250.000", "1250000", "1,250,000"
  const digits = String(raw ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

async function log(
  dealId: string,
  userId: string,
  action: string,
  detail?: string
) {
  await prisma.activityLog.create({
    data: { dealId, userId, action, detail },
  });
}

export async function createDeal(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();

  const sellerId = String(formData.get("sellerId") || "");
  const buyerId = String(formData.get("buyerId") || "");
  const referrerId = String(formData.get("referrerId") || "") || null;
  const amount = parseAmount(formData.get("amount"));
  const dealDateRaw = String(formData.get("dealDate") || "");
  const description = String(formData.get("description") || "").trim() || null;
  const partnerScope = String(formData.get("partnerScope") || PARTNER_SCOPE.NOI_CHI_HOI);
  const externalOrg = String(formData.get("externalOrg") || "").trim() || null;

  if (!sellerId || !buyerId) return { error: "Chọn đủ bên bán và bên mua" };
  if (sellerId === buyerId) return { error: "Bên bán và bên mua phải khác nhau" };
  if (amount <= 0) return { error: "Giá trị đơn phải lớn hơn 0" };
  if (!dealDateRaw) return { error: "Chọn ngày giao dịch" };

  const dealDate = new Date(dealDateRaw);
  if (Number.isNaN(dealDate.getTime())) return { error: "Ngày giao dịch không hợp lệ" };
  if (dealDate.getTime() > Date.now() + 86_400_000)
    return { error: "Ngày giao dịch không được ở tương lai" };

  // Xác định người khai đứng ở bên nào
  let createdSide: "SELLER" | "BUYER" | "ADMIN";
  if (isBackOffice(user) && user.memberId !== sellerId && user.memberId !== buyerId) {
    createdSide = "ADMIN";
  } else if (user.memberId === sellerId) {
    createdSide = "SELLER";
  } else if (user.memberId === buyerId) {
    createdSide = "BUYER";
  } else {
    return { error: "Bạn chỉ được khai đơn mà mình là một bên" };
  }

  if (referrerId && (referrerId === sellerId || referrerId === buyerId)) {
    return { error: "Người giới thiệu phải là hội viên thứ ba" };
  }

  const loiScope = loiPhamVi(partnerScope, externalOrg);
  if (loiScope) return { error: loiScope };

  const members = await prisma.member.findMany({
    where: { id: { in: [sellerId, buyerId] } },
    select: { id: true, active: true },
  });
  if (members.length !== 2) return { error: "Hội viên không tồn tại" };
  if (members.some((m) => !m.active))
    return { error: "Có hội viên đã ngừng hoạt động" };

  // Ban điều hành nhập hộ thì bỏ qua bước đối tác xác nhận
  const status =
    createdSide === "ADMIN" ? DEAL_STATUS.CHO_DUYET : DEAL_STATUS.CHO_DOI_TAC;

  const deal = await prisma.deal.create({
    data: {
      code: await nextDealCode(dealDate.getFullYear()),
      sellerId,
      buyerId,
      referrerId,
      amount,
      dealDate,
      description,
      status,
      partnerScope,
      externalOrg: canTenToChuc(partnerScope) ? externalOrg : null,
      createdByUserId: user.id,
      createdSide,
    },
  });

  await log(deal.id, user.id, "TAO", `Khai đơn ${deal.code}`);
  revalidatePath("/giao-dich");
  revalidatePath("/");
  redirect(`/giao-dich/${deal.id}`);
}

export async function confirmDeal(dealId: string): Promise<ActionResult> {
  const user = await requireUser();
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return { error: "Không tìm thấy giao dịch" };
  if (!canConfirm(user, deal)) return { error: "Bạn không có quyền xác nhận đơn này" };

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      status: DEAL_STATUS.CHO_DUYET,
      confirmedAt: new Date(),
      confirmedByUserId: user.id,
    },
  });
  await log(dealId, user.id, "XAC_NHAN", "Đối tác xác nhận đơn đúng");
  revalidatePath(`/giao-dich/${dealId}`);
  revalidatePath("/giao-dich");
  revalidatePath("/");
  return { ok: true };
}

export async function approveDeal(dealId: string): Promise<ActionResult> {
  const user = await requireUser();
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return { error: "Không tìm thấy giao dịch" };
  if (!canReview(user, deal)) return { error: "Bạn không có quyền duyệt" };

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      status: DEAL_STATUS.DA_DUYET,
      reviewedAt: new Date(),
      reviewedByUserId: user.id,
      rejectReason: null,
    },
  });
  await log(dealId, user.id, "DUYET", "Ban điều hành duyệt");
  revalidatePath(`/giao-dich/${dealId}`);
  revalidatePath("/giao-dich");
  revalidatePath("/bao-cao");
  revalidatePath("/");
  return { ok: true };
}

export async function rejectDeal(
  dealId: string,
  reason: string
): Promise<ActionResult> {
  const user = await requireUser();
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return { error: "Không tìm thấy giao dịch" };
  if (!canReview(user, deal)) return { error: "Bạn không có quyền từ chối" };
  if (!reason.trim()) return { error: "Nhập lý do từ chối" };

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      status: DEAL_STATUS.TU_CHOI,
      reviewedAt: new Date(),
      reviewedByUserId: user.id,
      rejectReason: reason.trim(),
    },
  });
  await log(dealId, user.id, "TU_CHOI", reason.trim());
  revalidatePath(`/giao-dich/${dealId}`);
  revalidatePath("/giao-dich");
  revalidatePath("/");
  return { ok: true };
}

export async function cancelDeal(dealId: string): Promise<ActionResult> {
  const user = await requireUser();
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return { error: "Không tìm thấy giao dịch" };
  if (!canEdit(user, deal)) return { error: "Không thể huỷ đơn ở trạng thái này" };

  await prisma.deal.update({
    where: { id: dealId },
    data: { status: DEAL_STATUS.HUY },
  });
  await log(dealId, user.id, "HUY", "Huỷ đơn");
  revalidatePath(`/giao-dich/${dealId}`);
  revalidatePath("/giao-dich");
  return { ok: true };
}

/** Duyệt hàng loạt các đơn đang chờ (chỉ ban điều hành). */
export async function approveMany(dealIds: string[]): Promise<ActionResult> {
  const user = await requireUser();
  if (!isAdmin(user)) return { error: "Chỉ ban điều hành được duyệt" };
  if (!dealIds.length) return { error: "Chưa chọn giao dịch nào" };

  const now = new Date();
  await prisma.deal.updateMany({
    where: { id: { in: dealIds }, status: DEAL_STATUS.CHO_DUYET },
    data: {
      status: DEAL_STATUS.DA_DUYET,
      reviewedAt: now,
      reviewedByUserId: user.id,
    },
  });
  await prisma.activityLog.createMany({
    data: dealIds.map((id) => ({
      dealId: id,
      userId: user.id,
      action: "DUYET",
      detail: "Duyệt hàng loạt",
    })),
  });
  revalidatePath("/giao-dich");
  revalidatePath("/bao-cao");
  revalidatePath("/");
  return { ok: true };
}
