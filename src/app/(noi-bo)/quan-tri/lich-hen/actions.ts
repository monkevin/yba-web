"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";

export type KetQua = { error?: string; ok?: string };

async function canQuyen() {
  const user = await requireUser();
  if (!co(user, QUYEN.BIEU_MAU_XU_LY))
    return { error: "Không có quyền thực hiện thao tác này" as const };
  return { user };
}

export const TRANG_THAI_HEN = [
  { ma: "MOI", ten: "Mới" },
  { ma: "DA_XAC_NHAN", ten: "Đã xác nhận lịch" },
  { ma: "DA_GAP", ten: "Đã gặp xong" },
  { ma: "TU_CHOI", ten: "Không sắp xếp được" },
] as const;

/** Đổi trạng thái xử lý một đề nghị gặp, kèm ghi chú nội bộ. */
export async function xuLyHen(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  if (!TRANG_THAI_HEN.some((t) => t.ma === status)) {
    return { error: "Trạng thái không hợp lệ" };
  }

  await prisma.lichHen
    .update({
      where: { id },
      data: {
        status,
        ghiChu: String(fd.get("ghiChu") ?? "").trim().slice(0, 500) || null,
      },
    })
    .catch(() => null);

  revalidatePath("/quan-tri/lich-hen");
  return { ok: "Đã cập nhật." };
}

/** Xoá một đề nghị (trùng lặp hoặc spam). */
export async function xoaHen(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  await prisma.lichHen
    .delete({ where: { id: String(fd.get("id") ?? "") } })
    .catch(() => null);
  revalidatePath("/quan-tri/lich-hen");
  return { ok: "Đã xoá." };
}
