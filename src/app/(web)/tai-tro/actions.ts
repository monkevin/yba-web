"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type KetQuaTaiTro = { error?: string; ok?: string };

function chuoi(fd: FormData, k: string): string {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

function hopLeSdt(s: string): boolean {
  return /^[0-9]{9,11}$/.test(s.replace(/[\s.\-()+]/g, ""));
}

/**
 * Đăng ký đồng hành / tài trợ. Không thu tiền qua website — đây là bước ghi
 * nhận cam kết để Ban Tài trợ liên hệ làm việc chính thức.
 */
export async function dangKyTaiTro(
  _prev: KetQuaTaiTro,
  fd: FormData
): Promise<KetQuaTaiTro> {
  const name = chuoi(fd, "name");
  const phone = chuoi(fd, "phone");

  if (name.length < 2) return { error: "Anh/chị vui lòng nhập họ tên." };
  if (!hopLeSdt(phone)) return { error: "Số điện thoại chưa đúng." };

  const goiId = chuoi(fd, "goiId");
  const goi = goiId
    ? await prisma.goiTaiTro.findUnique({
        where: { id: goiId },
        select: { id: true, soTien: true, duAnId: true },
      })
    : null;

  // Nhà tài trợ tự đề xuất số tiền khác gói cũng được — nhập triệu đồng
  const tuNhap = Number(chuoi(fd, "soTien").replace(/[^\d]/g, ""));
  const soTien = tuNhap > 0 ? tuNhap * 1_000_000 : (goi?.soTien ?? 0);

  const duAnId = chuoi(fd, "duAnId") || goi?.duAnId || null;
  const user = await getCurrentUser();

  await prisma.dangKyTaiTro.create({
    data: {
      duAnId,
      goiId: goi?.id ?? null,
      memberId: user?.memberId ?? null,
      name,
      phone,
      email: chuoi(fd, "email") || null,
      company: chuoi(fd, "company") || null,
      soTien,
      loiNhan: chuoi(fd, "loiNhan") || null,
    },
  });

  revalidatePath("/quan-tri/tai-tro");
  return {
    ok: "Cảm ơn anh/chị! Ban Tài trợ của Chi hội sẽ liên hệ lại trong 1–2 ngày làm việc để trao đổi chi tiết.",
  };
}
