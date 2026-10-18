"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type KetQua = { error?: string; ok?: boolean; message?: string };

function chuoi(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

/** Khách hoặc hội viên đăng ký tham dự một sự kiện đang mở đăng ký. */
export async function dangKyThamDu(
  _prev: KetQua,
  fd: FormData
): Promise<KetQua> {
  const eventId = chuoi(fd, "eventId");
  const ten = chuoi(fd, "name");
  const dienThoai = chuoi(fd, "phone");

  if (!ten) return { error: "Nhập họ và tên" };
  if (!/^[\d\s+.()-]{8,}$/.test(dienThoai)) {
    return { error: "Số điện thoại chưa đúng" };
  }

  const suKien = await prisma.event.findFirst({
    where: { id: eventId, published: true, allowSignup: true },
    select: { id: true, slug: true, capacity: true, _count: { select: { registrations: true } } },
  });
  if (!suKien) return { error: "Sự kiện này không nhận đăng ký" };

  if (suKien.capacity && suKien._count.registrations >= suKien.capacity) {
    return { error: "Sự kiện đã đủ số lượng đăng ký" };
  }

  // Cùng số điện thoại thì không ghi trùng
  const daCo = await prisma.eventRegistration.findFirst({
    where: { eventId: suKien.id, phone: dienThoai },
    select: { id: true },
  });
  if (daCo) {
    return { ok: true, message: "Số điện thoại này đã đăng ký sự kiện rồi." };
  }

  await prisma.eventRegistration.create({
    data: {
      eventId: suKien.id,
      name: ten,
      phone: dienThoai,
      email: chuoi(fd, "email") || null,
      company: chuoi(fd, "company") || null,
      note: chuoi(fd, "note") || null,
    },
  });

  revalidatePath(`/su-kien/${suKien.slug}`);
  return {
    ok: true,
    message: "Ban Sự kiện sẽ liên hệ xác nhận với anh/chị trong thời gian sớm nhất.",
  };
}
