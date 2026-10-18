"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { QUYEN, co } from "@/lib/quyen";
import { prisma } from "@/lib/prisma";

export type KetQua = { error?: string; ok?: boolean; message?: string };

function chuoi(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

/** Ban Chủ nhiệm duyệt hồ sơ doanh nghiệp cho hiện công khai. */
export async function duyetHoSo(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const user = await requireUser();
  if (!co(user, QUYEN.HO_SO_DUYET)) return { error: "Không có quyền duyệt hồ sơ" };

  const id = chuoi(fd, "id");
  if (!id) return { error: "Thiếu hội viên" };

  await prisma.member.update({
    where: { id },
    data: { profileStatus: "DA_DUYET" },
  });

  revalidatePath("/quan-tri/ho-so");
  revalidatePath("/doanh-nghiep");
  return { ok: true, message: "Đã duyệt hồ sơ" };
}

/**
 * Trả hồ sơ về để hội viên sửa lại. Hồ sơ quay lại trạng thái NHAP nên tạm thời
 * KHÔNG hiện ở danh bạ công khai.
 */
export async function traHoSo(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const user = await requireUser();
  if (!co(user, QUYEN.HO_SO_DUYET)) return { error: "Không có quyền duyệt hồ sơ" };

  const id = chuoi(fd, "id");
  const lyDo = chuoi(fd, "lyDo");
  if (!id) return { error: "Thiếu hội viên" };
  if (!lyDo) return { error: "Ghi lý do để hội viên biết cần sửa gì" };

  const cu = await prisma.member.findUnique({
    where: { id },
    select: { note: true },
  });

  await prisma.member.update({
    where: { id },
    data: {
      profileStatus: "NHAP",
      note: [cu?.note, `[Trả hồ sơ] ${lyDo}`].filter(Boolean).join("\n"),
    },
  });

  revalidatePath("/quan-tri/ho-so");
  revalidatePath("/doanh-nghiep");
  return { ok: true, message: "Đã trả hồ sơ về cho hội viên" };
}

/** Bật / tắt hiển thị doanh nghiệp ở khối "Doanh nghiệp tiêu biểu" trang chủ. */
export async function doiNoiBat(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const user = await requireUser();
  if (!co(user, QUYEN.HO_SO_DUYET)) {
    return { error: "Không có quyền chọn doanh nghiệp tiêu biểu" };
  }

  const id = chuoi(fd, "id");
  const hienTai = await prisma.member.findUnique({
    where: { id },
    select: { featured: true },
  });
  if (!hienTai) return { error: "Không tìm thấy hội viên" };

  await prisma.member.update({
    where: { id },
    data: { featured: !hienTai.featured },
  });

  revalidatePath("/quan-tri/ho-so");
  revalidatePath("/");
  return {
    ok: true,
    message: hienTai.featured ? "Đã bỏ khỏi trang chủ" : "Đã đưa lên trang chủ",
  };
}
