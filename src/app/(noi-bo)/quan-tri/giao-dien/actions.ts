"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { BO_MAU, KHOA } from "@/lib/giao-dien";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";

export type KetQua = { error?: string; ok?: boolean; message?: string };

function chuoi(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

/** Chuẩn hoá đường dẫn ngoài: thiếu http thì thêm https. */
function url(v: string): string {
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export async function luuGiaoDien(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const user = await requireUser();
  if (!co(user, QUYEN.GIAO_DIEN_SUA)) {
    return { error: "Không có quyền đổi giao diện website" };
  }

  const mau = chuoi(fd, "mau");
  if (!BO_MAU.some((b) => b.ma === mau)) return { error: "Bộ màu không hợp lệ" };

  const tieuDe = chuoi(fd, "bannerTieuDe");
  if (tieuDe.length < 5) return { error: "Tiêu đề banner quá ngắn" };

  const gia: Record<string, string> = {
    [KHOA.BANNER]: chuoi(fd, "banner") || "/banner-trang-chu.jpg",
    [KHOA.BANNER_TIEU_DE]: tieuDe,
    [KHOA.BANNER_MO_TA]: chuoi(fd, "bannerMoTa"),
    [KHOA.SLOGAN]: chuoi(fd, "slogan"),
    [KHOA.MAU]: mau,
    [KHOA.HOTLINE]: chuoi(fd, "hotline"),
    [KHOA.EMAIL]: chuoi(fd, "email"),
    [KHOA.DIA_CHI]: chuoi(fd, "diaChi"),
    [KHOA.FACEBOOK]: url(chuoi(fd, "facebook")),
    [KHOA.FACEBOOK_HOI]: url(chuoi(fd, "facebookHoi")),
    [KHOA.LOGO]: chuoi(fd, "logo") || "/logo-yba-cholon.png",
    // Để trống thì mỗi hồ sơ tự dựng dải nhận diện riêng theo tên doanh nghiệp
    [KHOA.BIA_HO_SO]: chuoi(fd, "biaHoSo"),
    [KHOA.KV]: chuoi(fd, "kv"),
  };

  for (const [key, value] of Object.entries(gia)) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  // Toàn bộ khu công khai đọc cấu hình này nên phải làm mới hết
  revalidatePath("/", "layout");

  return { ok: true, message: "Đã lưu. Mở trang chủ để xem kết quả." };
}
