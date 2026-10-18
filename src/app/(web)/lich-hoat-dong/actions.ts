"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type KetQuaDangKy = { error?: string; ok?: string };

function chuoi(fd: FormData, k: string): string {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

function hopLeSdt(s: string): boolean {
  return /^[0-9]{9,11}$/.test(s.replace(/[\s.\-()+]/g, ""));
}

/**
 * Đăng ký tham gia hoặc tài trợ một hoạt động trong lịch.
 *
 * Hội viên đăng nhập thì form đã điền sẵn thông tin; khách vãng lai khai đầy
 * đủ. Cả hai đều vào trạng thái CHO_DUYET — Ban Tổ chức duyệt xong tên mới hiện
 * lên trang chi tiết.
 */
export async function dangKyHoatDong(
  _prev: KetQuaDangKy,
  fd: FormData
): Promise<KetQuaDangKy> {
  const lichId = chuoi(fd, "lichId");
  const name = chuoi(fd, "name");
  const phone = chuoi(fd, "phone");
  const loai = chuoi(fd, "loai") === "TAI_TRO" ? "TAI_TRO" : "THAM_GIA";

  if (name.length < 2) return { error: "Anh/chị vui lòng nhập họ tên." };
  if (!hopLeSdt(phone)) return { error: "Số điện thoại chưa đúng." };

  const lich = await prisma.lichHoatDong.findUnique({
    where: { id: lichId },
    select: {
      id: true,
      slug: true,
      tieuDe: true,
      choDangKy: true,
      published: true,
      hanDangKy: true,
      soLuongToiDa: true,
      _count: {
        select: {
          dangKy: { where: { status: { not: "TU_CHOI" }, loai: "THAM_GIA" } },
        },
      },
    },
  });
  if (!lich || !lich.published) return { error: "Không tìm thấy hoạt động này." };
  if (!lich.choDangKy) return { error: "Hoạt động này chưa mở đăng ký." };
  if (lich.hanDangKy && lich.hanDangKy < new Date()) {
    return { error: "Đã hết hạn đăng ký cho hoạt động này." };
  }

  const soNguoi = Math.max(1, Math.min(50, Number(chuoi(fd, "soNguoi")) || 1));

  // Chỉ giới hạn số chỗ với người tham gia, tài trợ thì không chặn
  if (loai === "THAM_GIA" && lich.soLuongToiDa) {
    const con = lich.soLuongToiDa - lich._count.dangKy;
    if (con < soNguoi) {
      return {
        error:
          con <= 0
            ? "Hoạt động này đã đủ số lượng đăng ký."
            : `Chỉ còn ${con} chỗ, anh/chị đăng ký lại giúp.`,
      };
    }
  }

  const user = await getCurrentUser();

  // Một hội viên chỉ đăng ký một lần cho mỗi loại
  if (user?.memberId) {
    const daCo = await prisma.dangKyHoatDong.findFirst({
      where: { lichId, memberId: user.memberId, loai, status: { not: "TU_CHOI" } },
      select: { id: true },
    });
    if (daCo) {
      return {
        error:
          loai === "TAI_TRO"
            ? "Anh/chị đã đăng ký tài trợ hoạt động này rồi."
            : "Anh/chị đã đăng ký tham gia hoạt động này rồi.",
      };
    }
  }

  // Tiền nhập theo triệu đồng cho dễ gõ
  const trieu = Number(chuoi(fd, "soTien").replace(/[^\d]/g, "")) || 0;

  await prisma.dangKyHoatDong.create({
    data: {
      lichId,
      memberId: user?.memberId ?? null,
      name,
      phone,
      email: chuoi(fd, "email") || null,
      company: chuoi(fd, "company") || null,
      chucVu: chuoi(fd, "chucVu") || null,
      loai,
      soNguoi: loai === "THAM_GIA" ? soNguoi : 1,
      // Sự kiện nhiều phiên (vd 10/10): form gửi kèm các ô "phien"
      phien:
        fd
          .getAll("phien")
          .map((p) => String(p).trim())
          .filter((p) => p && p.length <= 30)
          .slice(0, 5)
          .join(",") || null,
      mucTaiTro: loai === "TAI_TRO" ? chuoi(fd, "mucTaiTro") || null : null,
      soTien: loai === "TAI_TRO" ? trieu * 1_000_000 : 0,
      hienVat: loai === "TAI_TRO" ? chuoi(fd, "hienVat") || null : null,
      ghiChu: chuoi(fd, "ghiChu") || null,
    },
  });

  revalidatePath(`/lich-hoat-dong/${lich.slug}`);
  revalidatePath("/quan-tri/lich-hoat-dong");

  return {
    ok:
      loai === "TAI_TRO"
        ? "Cảm ơn anh/chị! Ban Tổ chức sẽ liên hệ lại để trao đổi chi tiết về gói tài trợ."
        : "Đã ghi nhận đăng ký. Ban Tổ chức sẽ xác nhận và nhắn lại thông tin cụ thể cho anh/chị.",
  };
}
