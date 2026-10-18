"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";

export type KetQua = { error?: string; ok?: boolean; message?: string };

function chuoi(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

async function canQuyen() {
  const user = await requireUser();
  if (!co(user, QUYEN.TRANG_TINH_SUA)) {
    return { error: "Không có quyền sửa các trang giới thiệu" as const };
  }
  return { user };
}

/** Lưu nội dung một trang tĩnh (Giới thiệu, Quyền lợi hội viên, Điều lệ…). */
export async function luuTrang(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  const slug = chuoi(fd, "slug");
  const title = chuoi(fd, "title");
  const content = chuoi(fd, "content");

  if (!/^[a-z0-9-]{3,}$/.test(slug)) {
    return { error: "Mã trang chỉ gồm chữ thường, số và dấu gạch ngang" };
  }
  if (title.length < 3) return { error: "Nhập tiêu đề trang" };
  if (content.length < 20) return { error: "Nội dung quá ngắn" };

  await prisma.page.upsert({
    where: { slug },
    create: {
      slug,
      title,
      content,
      metaDesc: chuoi(fd, "metaDesc") || null,
      coverImage: chuoi(fd, "coverImage") || null,
    },
    update: {
      title,
      content,
      metaDesc: chuoi(fd, "metaDesc") || null,
      coverImage: chuoi(fd, "coverImage") || null,
    },
  });

  revalidatePath("/quan-tri/trang");
  revalidatePath(`/${slug}`);
  return { ok: true, message: "Đã lưu nội dung trang" };
}

/** Xoá phần tuỳ chỉnh, đưa trang về nội dung mặc định trong mã nguồn. */
export async function traVeMacDinh(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  const slug = chuoi(fd, "slug");
  await prisma.page.deleteMany({ where: { slug } });

  revalidatePath("/quan-tri/trang");
  revalidatePath(`/${slug}`);
  return { ok: true, message: "Đã trả trang về nội dung mặc định" };
}

// ═══════════════════════════════════════════════════════
// Nhân sự các ban (trang /ban-chap-hanh)
// ═══════════════════════════════════════════════════════

/** Thêm hoặc sửa một nhân sự trong Ban Chủ nhiệm / các ban chuyên môn. */
export async function luuNhanSu(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  const name = chuoi(fd, "name");
  const title = chuoi(fd, "title");
  const group = chuoi(fd, "group");
  if (!name) return { error: "Nhập họ tên" };
  if (!title) return { error: "Nhập chức danh" };
  if (!group) return { error: "Chọn ban" };

  const duLieu = {
    name,
    title,
    group,
    position: chuoi(fd, "position") || null,
    company: chuoi(fd, "company") || null,
    photo: chuoi(fd, "photo") || null,
    term: chuoi(fd, "term") || null,
    memberSlug: chuoi(fd, "memberSlug") || null,
    order: Number(chuoi(fd, "order")) || 0,
    active: fd.get("active") !== null,
  };

  const id = chuoi(fd, "id");
  if (id) {
    await prisma.leader.update({ where: { id }, data: duLieu });
  } else {
    await prisma.leader.create({ data: duLieu });
  }

  revalidatePath("/quan-tri/trang");
  revalidatePath("/ban-chap-hanh");
  return { ok: true, message: id ? "Đã lưu nhân sự" : "Đã thêm nhân sự" };
}

export async function xoaNhanSu(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  await prisma.leader.delete({ where: { id: chuoi(fd, "id") } });
  revalidatePath("/quan-tri/trang");
  revalidatePath("/ban-chap-hanh");
  return { ok: true, message: "Đã xoá nhân sự" };
}
