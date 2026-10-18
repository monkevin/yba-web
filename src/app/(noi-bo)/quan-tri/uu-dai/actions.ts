"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { co, QUYEN } from "@/lib/quyen";
import { prisma } from "@/lib/prisma";

export type KetQua = { ok?: boolean; error?: string; message?: string };

const chuoi = (fd: FormData, ten: string) => String(fd.get(ten) ?? "").trim();

/**
 * Duyệt / ghim / gỡ ưu đãi hội viên tự đăng từ Mini App, và bật cờ "nhà tài
 * trợ chiến lược" cho doanh nghiệp.
 *
 * Dùng chung mã quyền với chợ nhu cầu (`TIN_DANG_DUYET`) — cùng một người
 * kiểm soát nội dung hội viên đăng, không đẻ thêm quyền mới.
 */
async function coQuyen() {
  const user = await requireUser();
  return co(user, QUYEN.TIN_DANG_DUYET) ? user : null;
}

export async function duyetUuDai(_prev: KetQua, fd: FormData): Promise<KetQua> {
  if (!(await coQuyen())) return { error: "Không có quyền duyệt ưu đãi" };

  const id = chuoi(fd, "id");
  if (!id) return { error: "Thiếu ưu đãi" };

  await prisma.uuDai.update({ where: { id }, data: { status: "DANG_HIEN" } });
  revalidatePath("/quan-tri/uu-dai");
  return { ok: true, message: "Đã duyệt, ưu đãi hiện trên Mini App" };
}

export async function goUuDai(_prev: KetQua, fd: FormData): Promise<KetQua> {
  if (!(await coQuyen())) return { error: "Không có quyền gỡ ưu đãi" };

  const id = chuoi(fd, "id");
  if (!id) return { error: "Thiếu ưu đãi" };

  await prisma.uuDai.update({ where: { id }, data: { status: "AN" } });
  revalidatePath("/quan-tri/uu-dai");
  return { ok: true, message: "Đã gỡ ưu đãi" };
}

/** Ghim ưu đãi lên đầu danh sách trong Mini App. */
export async function ghimUuDai(_prev: KetQua, fd: FormData): Promise<KetQua> {
  if (!(await coQuyen())) return { error: "Không có quyền ghim ưu đãi" };

  const id = chuoi(fd, "id");
  if (!id) return { error: "Thiếu ưu đãi" };

  const u = await prisma.uuDai.findUnique({ where: { id }, select: { pinned: true } });
  if (!u) return { error: "Không tìm thấy ưu đãi" };

  await prisma.uuDai.update({ where: { id }, data: { pinned: !u.pinned } });
  revalidatePath("/quan-tri/uu-dai");
  return { ok: true, message: u.pinned ? "Đã bỏ ưu tiên" : "Đã đưa lên đầu danh sách" };
}

/**
 * Bật / tắt cờ nhà tài trợ chiến lược của một doanh nghiệp.
 * Ưu đãi của họ luôn xếp trên đầu, trên cả ưu đãi được ghim.
 */
export async function doiNhaTaiTro(_prev: KetQua, fd: FormData): Promise<KetQua> {
  if (!(await coQuyen())) return { error: "Không có quyền đổi nhà tài trợ" };

  const memberId = chuoi(fd, "memberId");
  if (!memberId) return { error: "Thiếu doanh nghiệp" };

  const m = await prisma.member.findUnique({
    where: { id: memberId },
    select: { nhaTaiTroChienLuoc: true, company: true },
  });
  if (!m) return { error: "Không tìm thấy doanh nghiệp" };

  await prisma.member.update({
    where: { id: memberId },
    data: { nhaTaiTroChienLuoc: !m.nhaTaiTroChienLuoc },
  });
  revalidatePath("/quan-tri/uu-dai");
  return {
    ok: true,
    message: m.nhaTaiTroChienLuoc
      ? `Đã bỏ đánh dấu nhà tài trợ chiến lược`
      : `Đã đánh dấu nhà tài trợ chiến lược`,
  };
}
