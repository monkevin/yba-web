"use server";

import { prisma } from "@/lib/prisma";

export type KetQua = { error?: string; ok?: boolean; message?: string };

function chuoi(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

function dienThoaiHopLe(s: string): boolean {
  return /^[\d\s+.()-]{8,}$/.test(s);
}

/** Hồ sơ đăng ký gia nhập Chi hội, gửi từ trang /dang-ky-hoi-vien. */
export async function guiDangKyHoiVien(
  _prev: KetQua,
  fd: FormData
): Promise<KetQua> {
  // Bẫy chống máy gửi tự động: ô ẩn, người thật không bao giờ điền
  if (chuoi(fd, "website_khac")) return { ok: true, message: "Đã nhận hồ sơ." };

  const ten = chuoi(fd, "name");
  const dienThoai = chuoi(fd, "phone");
  const doanhNghiep = chuoi(fd, "company");

  if (!ten) return { error: "Nhập họ và tên" };
  if (!dienThoaiHopLe(dienThoai)) return { error: "Số điện thoại chưa đúng" };
  if (!doanhNghiep) return { error: "Nhập tên doanh nghiệp" };

  // Cùng số điện thoại nộp lại thì cập nhật hồ sơ cũ, không tạo trùng
  const daCo = await prisma.membershipApplication.findFirst({
    where: { phone: dienThoai, status: { in: ["MOI", "DANG_XU_LY"] } },
    select: { id: true },
  });
  if (daCo) {
    return {
      ok: true,
      message:
        "Hồ sơ với số điện thoại này đã được gửi trước đó và đang được Ban Hội viên xem xét.",
    };
  }

  await prisma.membershipApplication.create({
    data: {
      name: ten,
      phone: dienThoai,
      email: chuoi(fd, "email") || null,
      company: doanhNghiep,
      position: chuoi(fd, "position") || null,
      industry: chuoi(fd, "industry") || null,
      address: chuoi(fd, "address") || null,
      website: chuoi(fd, "website") || null,
      referrer: chuoi(fd, "referrer") || null,
      note: chuoi(fd, "note") || null,
    },
  });

  return {
    ok: true,
    message:
      "Ban Hội viên sẽ liên hệ với anh/chị để trao đổi về thủ tục gia nhập Chi hội.",
  };
}

/** Tin nhắn gửi từ trang /lien-he. */
export async function guiLienHe(_prev: KetQua, fd: FormData): Promise<KetQua> {
  if (chuoi(fd, "website_khac")) return { ok: true, message: "Đã nhận tin nhắn." };

  const ten = chuoi(fd, "name");
  const noiDung = chuoi(fd, "message");
  const dienThoai = chuoi(fd, "phone");
  const email = chuoi(fd, "email");

  if (!ten) return { error: "Nhập họ và tên" };
  if (!dienThoai && !email) {
    return { error: "Để lại số điện thoại hoặc email để Chi hội phản hồi" };
  }
  if (dienThoai && !dienThoaiHopLe(dienThoai)) {
    return { error: "Số điện thoại chưa đúng" };
  }
  if (noiDung.length < 10) return { error: "Viết rõ hơn nội dung cần trao đổi" };

  await prisma.contactMessage.create({
    data: {
      name: ten,
      phone: dienThoai || null,
      email: email || null,
      subject: chuoi(fd, "subject") || null,
      message: noiDung,
    },
  });

  return {
    ok: true,
    message: "Chi hội đã nhận tin nhắn và sẽ phản hồi trong thời gian sớm nhất.",
  };
}
