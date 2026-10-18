"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/slug";
import { dangMoDangKy, conCho } from "@/lib/tham-dn";

export type KetQuaTham = { error?: string; ok?: string };

function chuoi(fd: FormData, k: string): string {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

function hopLeSdt(s: string): boolean {
  return /^[0-9]{9,11}$/.test(s.replace(/[\s.\-()+]/g, ""));
}

/**
 * Hội viên mời Chi hội đến thăm doanh nghiệp mình.
 * Bắt buộc đăng nhập vì lời mời gắn với một hồ sơ doanh nghiệp cụ thể.
 */
export async function moiDenTham(
  _prev: KetQuaTham,
  fd: FormData
): Promise<KetQuaTham> {
  const user = await requireUser();
  if (!user.memberId) {
    return {
      error: "Tài khoản này chưa gắn hồ sơ hội viên nên chưa gửi lời mời được.",
    };
  }

  const tieuDe = chuoi(fd, "tieuDe");
  if (tieuDe.length < 8)
    return { error: "Tiêu đề quá ngắn — anh/chị ghi rõ hơn giúp." };

  const ngay = chuoi(fd, "ngayMongMuon");
  const ngayMongMuon = ngay ? new Date(`${ngay}T09:00:00`) : null;
  if (ngayMongMuon && Number.isNaN(ngayMongMuon.getTime())) {
    return { error: "Ngày mong muốn chưa hợp lệ." };
  }

  const soLuong = Number(chuoi(fd, "soLuongToiDa"));

  const mem = await prisma.member.findUnique({
    where: { id: user.memberId },
    select: { company: true, address: true },
  });

  await prisma.thamDoanhNghiep.create({
    data: {
      memberId: user.memberId,
      slug: await uniqueSlug(
        tieuDe,
        async (s) =>
          !!(await prisma.thamDoanhNghiep.findUnique({ where: { slug: s } }))
      ),
      tieuDe,
      gioiThieu: chuoi(fd, "gioiThieu") || null,
      noiDungTham: chuoi(fd, "noiDungTham") || null,
      diaChi: chuoi(fd, "diaChi") || mem?.address || null,
      ngayMongMuon,
      soLuongToiDa: soLuong > 0 && soLuong <= 500 ? soLuong : null,
    },
  });

  revalidatePath("/tham-doanh-nghiep");
  revalidatePath("/quan-tri/tham-doanh-nghiep");
  return {
    ok: "Đã gửi lời mời. Ban Chủ nhiệm sẽ xem xét và liên hệ lại để chốt lịch.",
  };
}

/** Hội viên (hoặc khách) đăng ký tham gia một chuyến đã mở. */
export async function dangKyTham(
  _prev: KetQuaTham,
  fd: FormData
): Promise<KetQuaTham> {
  const thamId = chuoi(fd, "thamId");
  const name = chuoi(fd, "name");
  const phone = chuoi(fd, "phone");
  const soNguoi = Math.max(1, Math.min(20, Number(chuoi(fd, "soNguoi")) || 1));

  if (name.length < 2) return { error: "Anh/chị vui lòng nhập họ tên." };
  if (!hopLeSdt(phone)) return { error: "Số điện thoại chưa đúng." };

  const chuyen = await prisma.thamDoanhNghiep.findUnique({
    where: { id: thamId },
    select: {
      id: true,
      slug: true,
      status: true,
      soLuongToiDa: true,
      _count: { select: { dangKy: { where: { status: { not: "HUY" } } } } },
    },
  });
  if (!chuyen) return { error: "Không tìm thấy chuyến thăm này." };
  if (!dangMoDangKy(chuyen.status))
    return { error: "Chuyến này đã đóng đăng ký." };

  const con = conCho(chuyen.soLuongToiDa, chuyen._count.dangKy);
  if (con !== null && con < soNguoi) {
    return {
      error:
        con === 0
          ? "Chuyến này đã đủ người rồi ạ."
          : `Chỉ còn ${con} chỗ, anh/chị đăng ký lại giúp.`,
    };
  }

  const user = await getCurrentUser();

  // Một người chỉ đăng ký một lần cho mỗi chuyến
  if (user?.memberId) {
    const daCo = await prisma.dangKyTham.findFirst({
      where: { thamId, memberId: user.memberId, status: { not: "HUY" } },
      select: { id: true },
    });
    if (daCo) return { error: "Anh/chị đã đăng ký chuyến này rồi." };
  }

  await prisma.dangKyTham.create({
    data: {
      thamId,
      memberId: user?.memberId ?? null,
      name,
      phone,
      company: chuoi(fd, "company") || null,
      soNguoi,
      ghiChu: chuoi(fd, "ghiChu") || null,
    },
  });

  revalidatePath(`/tham-doanh-nghiep/${chuyen.slug}`);
  revalidatePath("/quan-tri/tham-doanh-nghiep");
  return {
    ok: "Đã ghi nhận đăng ký. Chi hội sẽ nhắn lại lịch cụ thể trước ngày đi.",
  };
}
