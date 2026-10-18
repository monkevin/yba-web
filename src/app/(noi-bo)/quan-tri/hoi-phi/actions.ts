"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, isBackOffice } from "@/lib/auth";
import { dongBoNamDongPhi } from "@/lib/hoi-phi";

export type FeeResult = { error?: string; ok?: boolean };

/** Đánh dấu một hội viên đã đóng hội phí năm X (hoặc bỏ đánh dấu). */
export async function toggleFee(
  memberId: string,
  year: number,
  note?: string
): Promise<FeeResult> {
  const user = await requireUser();
  if (!isBackOffice(user)) return { error: "Không có quyền" };

  const existing = await prisma.feePayment.findUnique({
    where: { memberId_year: { memberId, year } },
  });

  if (existing) {
    await prisma.feePayment.delete({ where: { id: existing.id } });
  } else {
    await prisma.feePayment.create({
      data: {
        memberId,
        year,
        note: note?.trim() || `Đánh dấu thủ công`,
        paidAt: new Date(),
      },
    });
  }

  // Đóng phí xong thì hội viên được ưu tiên hiện lên trên ở khu công khai
  await dongBoNamDongPhi(memberId);

  revalidatePath("/quan-tri/hoi-phi");
  revalidatePath(`/hoi-vien/${memberId}`);
  revalidatePath("/doanh-nghiep");
  revalidatePath("/giao-thuong");
  return { ok: true };
}

/** Bật/tắt miễn hội phí cho hội viên. */
export async function toggleExempt(memberId: string): Promise<FeeResult> {
  const user = await requireUser();
  if (!isBackOffice(user)) return { error: "Không có quyền" };

  const m = await prisma.member.findUnique({
    where: { id: memberId },
    select: { feeExempt: true },
  });
  if (!m) return { error: "Không tìm thấy hội viên" };

  await prisma.member.update({
    where: { id: memberId },
    data: { feeExempt: !m.feeExempt },
  });
  await dongBoNamDongPhi(memberId);

  revalidatePath("/quan-tri/hoi-phi");
  revalidatePath(`/hoi-vien/${memberId}`);
  revalidatePath("/doanh-nghiep");
  revalidatePath("/giao-thuong");
  return { ok: true };
}
