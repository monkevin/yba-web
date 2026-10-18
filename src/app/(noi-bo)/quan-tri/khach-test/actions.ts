"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";

export type KetQua = { error?: string; ok?: string };

/** Dữ liệu khách để lại thuộc nhóm biểu mẫu gửi từ web. */
async function canQuyen() {
  const user = await requireUser();
  if (!co(user, QUYEN.BIEU_MAU_XU_LY))
    return { error: "Không có quyền thực hiện thao tác này" as const };
  return { user };
}

/** Đánh dấu đã liên hệ lại khách / bỏ đánh dấu. */
export async function doiTrangThai(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  const id = String(fd.get("id") ?? "");
  const hienTai = await prisma.khachTest.findUnique({
    where: { id },
    select: { daXuLy: true },
  });
  if (!hienTai) return { error: "Không tìm thấy bản ghi" };

  await prisma.khachTest.update({
    where: { id },
    data: { daXuLy: !hienTai.daXuLy },
  });
  revalidatePath("/quan-tri/khach-test");
  return { ok: hienTai.daXuLy ? "Đã bỏ đánh dấu." : "Đã đánh dấu liên hệ xong." };
}

/** Ghi chú nội bộ cho một khách. */
export async function luuGhiChu(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  const id = String(fd.get("id") ?? "");
  const ghiChu = String(fd.get("ghiChu") ?? "").trim().slice(0, 500);

  await prisma.khachTest
    .update({ where: { id }, data: { ghiChu: ghiChu || null } })
    .catch(() => null);
  revalidatePath("/quan-tri/khach-test");
  return { ok: "Đã lưu ghi chú." };
}

/** Xoá một bản ghi (khách yêu cầu gỡ dữ liệu chẳng hạn). */
export async function xoaKhach(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  const id = String(fd.get("id") ?? "");
  await prisma.khachTest.delete({ where: { id } }).catch(() => null);
  revalidatePath("/quan-tri/khach-test");
  return { ok: "Đã xoá." };
}
