"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type KetQuaHen = { error?: string; ok?: string };

function chuoi(fd: FormData, k: string): string {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

function hopLeSdt(s: string): boolean {
  return /^[0-9]{9,11}$/.test(s.replace(/[\s.\-()+]/g, ""));
}

/**
 * Gửi đề nghị gặp Ban Chủ nhiệm. Cả hội viên lẫn khách đều gửi được — mục tiêu
 * là mở cửa cho người muốn tiếp cận Chi hội, nên không bắt đăng nhập.
 */
export async function datLich(
  _prev: KetQuaHen,
  fd: FormData
): Promise<KetQuaHen> {
  const name = chuoi(fd, "name");
  const phone = chuoi(fd, "phone");
  const chuDe = chuoi(fd, "chuDe");

  if (name.length < 2) return { error: "Anh/chị vui lòng nhập họ tên." };
  if (!hopLeSdt(phone)) return { error: "Số điện thoại chưa đúng." };
  if (chuDe.length < 5)
    return { error: "Anh/chị ghi giúp nội dung muốn trao đổi." };

  const leaderSlug = chuoi(fd, "leader");
  const leader = leaderSlug
    ? await prisma.leader.findFirst({
        where: { slug: leaderSlug, active: true, nhanHen: true },
        select: { id: true },
      })
    : null;

  const ngay = chuoi(fd, "ngayHen");
  const ngayHen = ngay ? new Date(`${ngay}T09:00:00`) : null;
  if (ngayHen && Number.isNaN(ngayHen.getTime())) {
    return { error: "Ngày mong muốn chưa hợp lệ." };
  }

  const user = await getCurrentUser();

  await prisma.lichHen.create({
    data: {
      leaderId: leader?.id ?? null,
      memberId: user?.memberId ?? null,
      name,
      phone,
      email: chuoi(fd, "email") || null,
      company: chuoi(fd, "company") || null,
      chuDe,
      noiDung: chuoi(fd, "noiDung") || null,
      ngayHen,
      buoi: chuoi(fd, "buoi") || null,
      hinhThuc: chuoi(fd, "hinhThuc") === "ONLINE" ? "ONLINE" : "TRUC_TIEP",
    },
  });

  revalidatePath("/quan-tri/lich-hen");
  return {
    ok: "Đã gửi đề nghị. Ban Chủ nhiệm sẽ liên hệ lại với anh/chị để xác nhận lịch.",
  };
}
