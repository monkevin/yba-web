"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";
import { uniqueSlug } from "@/lib/slug";

export type KetQua = { error?: string; ok?: string };

/** Tài trợ là nội dung công khai của Chi hội — dùng chung quyền trang tĩnh. */
async function canQuyen() {
  const user = await requireUser();
  if (!co(user, QUYEN.TRANG_TINH_SUA))
    return { error: "Không có quyền thực hiện thao tác này" as const };
  return { user };
}

function chuoi(fd: FormData, k: string): string {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

/** Số nhập theo triệu đồng → lưu VND. */
function tienTrieu(fd: FormData, k: string): number {
  const n = Number(chuoi(fd, k).replace(/[^\d]/g, ""));
  return n > 0 ? n * 1_000_000 : 0;
}

/** Thêm mới hoặc sửa một chương trình kêu gọi tài trợ. */
export async function luuDuAn(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  const id = chuoi(fd, "id");
  const ten = chuoi(fd, "ten");
  if (ten.length < 4) return { error: "Tên chương trình quá ngắn" };

  const dulieu = {
    ten,
    tomTat: chuoi(fd, "tomTat") || null,
    moTa: chuoi(fd, "moTa") || null,
    mucTieu: tienTrieu(fd, "mucTieu"),
    daGop: tienTrieu(fd, "daGop"),
    active: fd.get("active") !== null,
  };

  if (id) {
    await prisma.duAnTaiTro.update({ where: { id }, data: dulieu });
  } else {
    await prisma.duAnTaiTro.create({
      data: {
        ...dulieu,
        slug: await uniqueSlug(
          ten,
          async (s) => !!(await prisma.duAnTaiTro.findUnique({ where: { slug: s } }))
        ),
      },
    });
  }

  revalidatePath("/quan-tri/tai-tro");
  revalidatePath("/tai-tro");
  return { ok: id ? "Đã lưu chương trình." : "Đã thêm chương trình." };
}

/** Thêm mới hoặc sửa một gói tài trợ. */
export async function luuGoi(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  const id = chuoi(fd, "id");
  const ten = chuoi(fd, "ten");
  const soTien = tienTrieu(fd, "soTien");
  if (!ten) return { error: "Chưa nhập tên gói" };
  if (soTien <= 0) return { error: "Chưa nhập số tiền (đơn vị: triệu đồng)" };

  const dulieu = {
    ten,
    soTien,
    quyenLoi: chuoi(fd, "quyenLoi") || null,
    noiBat: fd.get("noiBat") !== null,
    active: fd.get("active") !== null,
    order: Number(chuoi(fd, "order")) || 0,
  };

  if (id) {
    await prisma.goiTaiTro.update({ where: { id }, data: dulieu });
  } else {
    await prisma.goiTaiTro.create({
      data: { ...dulieu, duAnId: chuoi(fd, "duAnId") || null },
    });
  }

  revalidatePath("/quan-tri/tai-tro");
  revalidatePath("/tai-tro");
  return { ok: id ? "Đã lưu gói." : "Đã thêm gói." };
}

export async function xoaGoi(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  await prisma.goiTaiTro
    .delete({ where: { id: chuoi(fd, "id") } })
    .catch(() => null);
  revalidatePath("/quan-tri/tai-tro");
  revalidatePath("/tai-tro");
  return { ok: "Đã xoá gói." };
}

/** Cập nhật trạng thái một đăng ký tài trợ. */
export async function xuLyDangKy(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  const status = chuoi(fd, "status");
  if (!["MOI", "DA_LIEN_HE", "DA_NHAN", "HUY"].includes(status)) {
    return { error: "Trạng thái không hợp lệ" };
  }

  await prisma.dangKyTaiTro
    .update({
      where: { id: chuoi(fd, "id") },
      data: { status, ghiChu: chuoi(fd, "ghiChu").slice(0, 500) || null },
    })
    .catch(() => null);

  revalidatePath("/quan-tri/tai-tro");
  return { ok: "Đã cập nhật." };
}
