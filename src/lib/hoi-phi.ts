import { prisma } from "@/lib/prisma";

/**
 * Hội viên đã đóng hội phí được ưu tiên hiện lên trên ở danh bạ doanh nghiệp và
 * chợ nhu cầu. Prisma không sắp xếp được theo "có bản ghi FeePayment năm nay hay
 * không", nên năm đóng gần nhất được ghi sẵn vào `Member.feePaidYear` và mọi nơi
 * chỉ cần `orderBy: { feePaidYear: "desc" }`.
 *
 * Hội viên được miễn phí coi như đã đóng của năm hiện tại — họ đang trong diện
 * ưu đãi của Chi hội chứ không phải nợ phí.
 */

/** Đồng bộ `feePaidYear` cho một hội viên sau khi thay đổi hội phí. */
export async function dongBoNamDongPhi(memberId: string): Promise<number> {
  const m = await prisma.member.findUnique({
    where: { id: memberId },
    select: { feeExempt: true },
  });
  if (!m) return 0;

  const moiNhat = await prisma.feePayment.findFirst({
    where: { memberId },
    orderBy: { year: "desc" },
    select: { year: true },
  });

  const nam = m.feeExempt
    ? Math.max(new Date().getFullYear(), moiNhat?.year ?? 0)
    : (moiNhat?.year ?? 0);

  await prisma.member.update({
    where: { id: memberId },
    data: { feePaidYear: nam },
  });
  return nam;
}

/** Đồng bộ lại toàn bộ hội viên. Trả về số hội viên được sửa. */
export async function dongBoTatCa(): Promise<number> {
  const namNay = new Date().getFullYear();
  const members = await prisma.member.findMany({
    select: { id: true, feeExempt: true, feePaidYear: true },
  });
  const dong = await prisma.feePayment.groupBy({
    by: ["memberId"],
    _max: { year: true },
  });
  const bang = new Map(dong.map((d) => [d.memberId, d._max.year ?? 0]));

  let sua = 0;
  for (const m of members) {
    const daDong = bang.get(m.id) ?? 0;
    const nam = m.feeExempt ? Math.max(namNay, daDong) : daDong;
    if (nam !== m.feePaidYear) {
      await prisma.member.update({
        where: { id: m.id },
        data: { feePaidYear: nam },
      });
      sua++;
    }
  }
  return sua;
}
