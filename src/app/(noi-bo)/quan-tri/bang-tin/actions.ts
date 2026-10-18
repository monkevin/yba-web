"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { co, QUYEN } from "@/lib/quyen";
import { prisma } from "@/lib/prisma";

export type KetQua = { ok?: boolean; error?: string; message?: string };

const chuoi = (fd: FormData, ten: string) => String(fd.get(ten) ?? "").trim();

/**
 * Duyệt / gỡ / ghim tin bảng tin nội bộ do hội viên đăng từ Mini App.
 *
 * Dùng chung mã quyền với chợ nhu cầu (`TIN_DANG_DUYET`) — cùng một người
 * kiểm soát nội dung hội viên đăng, không đẻ thêm quyền mới cho Ban Chủ nhiệm
 * phải tích lại từ đầu.
 */
async function kiemTraQuyen() {
  const user = await requireUser();
  if (!co(user, QUYEN.TIN_DANG_DUYET)) return null;
  return user;
}

export async function duyetBangTin(_prev: KetQua, fd: FormData): Promise<KetQua> {
  if (!(await kiemTraQuyen())) return { error: "Không có quyền duyệt tin" };

  const id = chuoi(fd, "id");
  if (!id) return { error: "Thiếu tin" };

  await prisma.bangTin.update({ where: { id }, data: { status: "DANG_HIEN" } });
  revalidatePath("/quan-tri/bang-tin");
  return { ok: true, message: "Đã duyệt, tin hiện trên Mini App" };
}

export async function goBangTin(_prev: KetQua, fd: FormData): Promise<KetQua> {
  if (!(await kiemTraQuyen())) return { error: "Không có quyền gỡ tin" };

  const id = chuoi(fd, "id");
  if (!id) return { error: "Thiếu tin" };

  await prisma.bangTin.update({ where: { id }, data: { status: "AN" } });
  revalidatePath("/quan-tri/bang-tin");
  return { ok: true, message: "Đã gỡ tin khỏi bảng tin" };
}

export async function ghimBangTin(_prev: KetQua, fd: FormData): Promise<KetQua> {
  if (!(await kiemTraQuyen())) return { error: "Không có quyền ghim tin" };

  const id = chuoi(fd, "id");
  if (!id) return { error: "Thiếu tin" };

  const tin = await prisma.bangTin.findUnique({ where: { id }, select: { pinned: true } });
  if (!tin) return { error: "Không tìm thấy tin" };

  await prisma.bangTin.update({ where: { id }, data: { pinned: !tin.pinned } });
  revalidatePath("/quan-tri/bang-tin");
  return { ok: true, message: tin.pinned ? "Đã bỏ ghim" : "Đã ghim lên đầu bảng tin" };
}
