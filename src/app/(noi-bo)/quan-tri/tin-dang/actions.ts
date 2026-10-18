"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { QUYEN, co } from "@/lib/quyen";
import { CAI_DAT, ghiCaiDat } from "@/lib/cai-dat";
import { TRANG_THAI_TIN, ngayHetHan } from "@/lib/listing";
import { prisma } from "@/lib/prisma";

export type KetQua = { error?: string; ok?: boolean; message?: string };

function chuoi(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

async function banChuNhiem() {
  const user = await requireUser();
  if (!co(user, QUYEN.TIN_DANG_DUYET)) {
    return { error: "Không có quyền kiểm soát chợ nhu cầu" as const };
  }
  return { user };
}

/** Duyệt tin cho hiển thị trên chợ. */
export async function duyetTin(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await banChuNhiem();
  if ("error" in q) return { error: q.error };

  await prisma.listing.update({
    where: { id: chuoi(fd, "id") },
    data: {
      status: TRANG_THAI_TIN.DANG_HIEN,
      rejectReason: null,
      expiresAt: ngayHetHan(),
    },
  });

  revalidatePath("/quan-tri/tin-dang");
  revalidatePath("/giao-thuong");
  return { ok: true, message: "Đã duyệt tin" };
}

/** Gỡ tin khỏi chợ kèm lý do để hội viên biết. */
export async function goTin(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await banChuNhiem();
  if ("error" in q) return { error: q.error };

  const lyDo = chuoi(fd, "lyDo");
  if (!lyDo) return { error: "Ghi lý do để hội viên biết cần sửa gì" };

  await prisma.listing.update({
    where: { id: chuoi(fd, "id") },
    data: { status: TRANG_THAI_TIN.TU_CHOI, rejectReason: lyDo },
  });

  revalidatePath("/quan-tri/tin-dang");
  revalidatePath("/giao-thuong");
  return { ok: true, message: "Đã gỡ tin khỏi chợ" };
}

/** Ghim / bỏ ghim tin lên đầu chợ. */
export async function doiGhim(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await banChuNhiem();
  if ("error" in q) return { error: q.error };

  const id = chuoi(fd, "id");
  const tin = await prisma.listing.findUnique({
    where: { id },
    select: { pinned: true },
  });
  if (!tin) return { error: "Không tìm thấy tin" };

  await prisma.listing.update({ where: { id }, data: { pinned: !tin.pinned } });

  revalidatePath("/quan-tri/tin-dang");
  revalidatePath("/giao-thuong");
  return { ok: true, message: tin.pinned ? "Đã bỏ ghim" : "Đã ghim lên đầu chợ" };
}

/** Bật / tắt chế độ bắt buộc duyệt tin trước khi hiển thị. */
export async function doiCheDoDuyet(
  _prev: KetQua,
  fd: FormData
): Promise<KetQua> {
  const q = await banChuNhiem();
  if ("error" in q) return { error: q.error };

  const bat = chuoi(fd, "bat") === "1";
  await ghiCaiDat(CAI_DAT.DUYET_TIN_DANG, bat ? "1" : "0");

  revalidatePath("/quan-tri/tin-dang");
  return {
    ok: true,
    message: bat
      ? "Từ giờ tin mới phải được duyệt mới hiển thị."
      : "Từ giờ hội viên đăng tin là hiển thị ngay.",
  };
}
