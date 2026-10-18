"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicListing } from "@/lib/public";

export type KetQua = { error?: string; ok?: boolean; message?: string };

/**
 * Hội viên bấm "Tôi quan tâm" ở một tin nhu cầu. Chủ tin sẽ thấy danh sách người
 * quan tâm trong khu quản lý tin đăng của mình.
 */
export async function guiQuanTam(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const user = await getCurrentUser();
  if (!user) return { error: "Vui lòng đăng nhập để liên hệ với người đăng tin" };
  if (!user.memberId) {
    return {
      error:
        "Tài khoản chưa gắn với hồ sơ doanh nghiệp nên chưa gửi quan tâm được. Nhờ thư ký Chi hội gắn giúp.",
    };
  }

  const listingId = String(fd.get("listingId") ?? "");
  const loiNhan = String(fd.get("message") ?? "").trim();

  // Tin phải đang thực sự hiển thị — không cho gửi vào tin đã ẩn / hết hạn
  const tin = await prisma.listing.findFirst({
    where: { id: listingId, ...publicListing() },
    select: { id: true, memberId: true, slug: true },
  });
  if (!tin) return { error: "Tin này không còn hiển thị" };

  if (tin.memberId === user.memberId) {
    return { error: "Đây là tin của chính doanh nghiệp anh/chị" };
  }

  const daGui = await prisma.listingContact.findFirst({
    where: { listingId: tin.id, memberId: user.memberId },
    select: { id: true },
  });
  if (daGui) {
    return { ok: true, message: "Anh/chị đã gửi quan tâm tin này rồi." };
  }

  await prisma.listingContact.create({
    data: {
      listingId: tin.id,
      memberId: user.memberId,
      message: loiNhan || null,
    },
  });

  revalidatePath(`/giao-thuong/${tin.slug}`);
  return {
    ok: true,
    message:
      "Đã gửi. Doanh nghiệp đăng tin sẽ thấy thông tin của anh/chị và chủ động liên hệ lại.",
  };
}
