"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";
import { TRANG_THAI_THAM } from "@/lib/tham-dn";

export type KetQua = { error?: string; ok?: string };

/** Chuyến thăm là hoạt động của Chi hội nên dùng chung quyền với sự kiện. */
async function canQuyen() {
  const user = await requireUser();
  if (!co(user, QUYEN.SU_KIEN_QUAN_LY))
    return { error: "Không có quyền thực hiện thao tác này" as const };
  return { user };
}

/** Duyệt / mở đăng ký / đóng / đánh dấu đã tổ chức một chuyến thăm. */
export async function xuLyChuyen(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  if (!Object.values(TRANG_THAI_THAM).includes(status as never)) {
    return { error: "Trạng thái không hợp lệ" };
  }

  const ngay = String(fd.get("ngayToChuc") ?? "").trim();
  const ngayToChuc = ngay ? new Date(`${ngay}T09:00:00`) : null;
  if (ngayToChuc && Number.isNaN(ngayToChuc.getTime())) {
    return { error: "Ngày tổ chức chưa hợp lệ" };
  }

  const soLuong = Number(String(fd.get("soLuongToiDa") ?? ""));

  await prisma.thamDoanhNghiep
    .update({
      where: { id },
      data: {
        status,
        ngayToChuc,
        soLuongToiDa: soLuong > 0 && soLuong <= 500 ? soLuong : null,
        ghiChuBCN:
          String(fd.get("ghiChuBCN") ?? "").trim().slice(0, 800) || null,
      },
    })
    .catch(() => null);

  revalidatePath("/quan-tri/tham-doanh-nghiep");
  revalidatePath("/tham-doanh-nghiep");
  return { ok: "Đã cập nhật chuyến thăm." };
}

/** Xác nhận / huỷ một lượt đăng ký tham gia. */
export async function xuLyDangKy(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  if (!["CHO_XAC_NHAN", "DA_XAC_NHAN", "HUY"].includes(status)) {
    return { error: "Trạng thái không hợp lệ" };
  }

  await prisma.dangKyTham
    .update({ where: { id }, data: { status } })
    .catch(() => null);
  revalidatePath("/quan-tri/tham-doanh-nghiep");
  return { ok: "Đã cập nhật." };
}

/** Xoá hẳn một chuyến (đề xuất trùng hoặc nhập nhầm). */
export async function xoaChuyen(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  await prisma.thamDoanhNghiep
    .delete({ where: { id: String(fd.get("id") ?? "") } })
    .catch(() => null);
  revalidatePath("/quan-tri/tham-doanh-nghiep");
  revalidatePath("/tham-doanh-nghiep");
  return { ok: "Đã xoá chuyến thăm." };
}
