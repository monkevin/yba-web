"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isBackOffice } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMemberSearchText } from "@/lib/search";
import { hoiVienKhacCungSdt } from "@/lib/dang-nhap";
import { chuanSoDienThoai, soDienThoaiDeLuu } from "@/lib/so-dien-thoai";

export type KetQua = { error?: string; ok?: boolean; message?: string };

function chuoi(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

function url(fd: FormData, k: string): string | null {
  const v = chuoi(fd, k);
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

/**
 * Xác định hội viên mà người dùng hiện tại được phép sửa hồ sơ.
 * Hội viên chỉ sửa được hồ sơ của chính mình; ban chủ nhiệm / thư ký sửa hộ
 * được bất kỳ ai khi truyền `memberId`.
 */
async function hoiVienDuocSua(memberId: string | null) {
  const user = await getCurrentUser();
  if (!user) return { error: "Chưa đăng nhập" as const };

  if (memberId && memberId !== user.memberId) {
    if (!isBackOffice(user))
      return { error: "Không có quyền sửa hồ sơ này" as const };
    return { user, id: memberId };
  }
  if (!user.memberId) {
    return {
      error:
        "Tài khoản của anh/chị chưa được gắn với hồ sơ doanh nghiệp nào. Nhờ thư ký Chi hội gắn giúp." as const,
    };
  }
  return { user, id: user.memberId };
}

/** Hội viên tự cập nhật hồ sơ doanh nghiệp công khai. */
export async function luuHoSo(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const quyen = await hoiVienDuocSua(chuoi(fd, "memberId") || null);
  if ("error" in quyen) return { error: quyen.error };
  const { user, id } = quyen;

  const hienTai = await prisma.member.findUnique({
    where: { id },
    select: { code: true, company: true, name: true, phone: true },
  });
  if (!hienTai) return { error: "Không tìm thấy hồ sơ" };

  // SĐT là một cách đăng nhập web + nhận diện trên Zalo Mini App → lưu dạng
  // chuẩn và không để hai hội viên đang sinh hoạt dùng chung một số. Chỉ xét
  // khi số THAY ĐỔI, để hồ sơ lỡ trùng từ trước vẫn lưu được các mục khác.
  const soMoi = soDienThoaiDeLuu(chuoi(fd, "phone"));
  const doiSo = chuanSoDienThoai(soMoi) !== chuanSoDienThoai(hienTai.phone);
  let canhBaoSdt = "";
  if (soMoi && doiSo) {
    const trung = await hoiVienKhacCungSdt(soMoi, id);
    if (trung && !isBackOffice(user)) {
      return {
        error:
          "Số điện thoại này đã được đăng ký cho một hội viên khác. Nếu đây là số của anh/chị, vui lòng liên hệ Văn phòng Chi hội để được cập nhật.",
      };
    }
    // Ban Chủ nhiệm / thư ký sửa hộ: vẫn cho lưu nhưng nói rõ hệ quả
    if (trung) {
      canhBaoSdt = ` Lưu ý: số điện thoại trùng với hồ sơ ${trung.code} — cả hai sẽ không đăng nhập web bằng số điện thoại được cho tới khi sửa một bên.`;
    }
  }

  const capabilities = chuoi(fd, "capabilities");
  const namThanhLap = Number(chuoi(fd, "foundedYear"));

  const dulieu = {
    intro: chuoi(fd, "intro") || null,
    description: chuoi(fd, "description") || null,
    offering: chuoi(fd, "offering") || null,
    services: chuoi(fd, "services") || null,
    history: chuoi(fd, "history") || null,
    needing: chuoi(fd, "needing") || null,
    capabilities: capabilities || null,
    logo: chuoi(fd, "logo") || null,
    coverImage: chuoi(fd, "coverImage") || null,
    gallery: chuoi(fd, "gallery") || null,
    phone: soMoi,
    email: chuoi(fd, "email") || null,
    address: chuoi(fd, "address") || null,
    website: url(fd, "website"),
    facebook: url(fd, "facebook"),
    zalo: url(fd, "zalo"),
    linkedin: url(fd, "linkedin"),
    youtube: url(fd, "youtube"),
    videoUrl: url(fd, "videoUrl"),
    taxCode: chuoi(fd, "taxCode") || null,
    headcount: chuoi(fd, "headcount") || null,
    foundedYear:
      namThanhLap >= 1900 && namThanhLap <= new Date().getFullYear()
        ? namThanhLap
        : null,
    categoryId: chuoi(fd, "categoryId") || null,
    publicVisible: fd.get("publicVisible") !== null,
    // Hội viên tự sửa thì hồ sơ phải chờ Ban Chủ nhiệm duyệt lại; ban chủ nhiệm
    // sửa thì duyệt luôn.
    profileStatus: isBackOffice(user) ? "DA_DUYET" : "CHO_DUYET",
  };

  await prisma.member.update({
    where: { id },
    data: {
      ...dulieu,
      searchText: buildMemberSearchText({
        code: hienTai.code,
        name: hienTai.name,
        company: hienTai.company,
        offering: dulieu.offering,
        needing: dulieu.needing,
        phone: dulieu.phone,
        email: dulieu.email,
      }),
    },
  });

  revalidatePath("/tai-khoan/ho-so");
  revalidatePath("/doanh-nghiep");
  revalidatePath("/quan-tri/ho-so");

  return {
    ok: true,
    message: isBackOffice(user)
      ? `Đã lưu hồ sơ.${canhBaoSdt}`
      : "Đã lưu. Hồ sơ sẽ hiện công khai sau khi Ban Chủ nhiệm duyệt.",
  };
}

/** Thêm hoặc sửa một sản phẩm / dịch vụ tiêu biểu. */
export async function luuSanPham(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const quyen = await hoiVienDuocSua(chuoi(fd, "memberId") || null);
  if ("error" in quyen) return { error: quyen.error };

  const ten = chuoi(fd, "name");
  if (!ten) return { error: "Nhập tên sản phẩm / dịch vụ" };

  const id = chuoi(fd, "id");
  const dulieu = {
    name: ten,
    summary: chuoi(fd, "summary") || null,
    priceText: chuoi(fd, "priceText") || null,
    image: chuoi(fd, "image") || null,
    order: Number(chuoi(fd, "order")) || 0,
  };

  if (id) {
    // Kiểm tra lại ở server: sản phẩm phải thuộc đúng hội viên này
    const sp = await prisma.product.findUnique({
      where: { id },
      select: { memberId: true },
    });
    if (!sp || sp.memberId !== quyen.id) return { error: "Không có quyền sửa" };
    await prisma.product.update({ where: { id }, data: dulieu });
  } else {
    const dem = await prisma.product.count({ where: { memberId: quyen.id } });
    if (dem >= 12) return { error: "Mỗi doanh nghiệp đăng tối đa 12 sản phẩm" };
    await prisma.product.create({ data: { ...dulieu, memberId: quyen.id } });
  }

  revalidatePath("/tai-khoan/ho-so");
  return { ok: true, message: id ? "Đã lưu sản phẩm" : "Đã thêm sản phẩm" };
}

/** Xoá một sản phẩm / dịch vụ. */
export async function xoaSanPham(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const quyen = await hoiVienDuocSua(chuoi(fd, "memberId") || null);
  if ("error" in quyen) return { error: quyen.error };

  const id = chuoi(fd, "id");
  const sp = await prisma.product.findUnique({
    where: { id },
    select: { memberId: true },
  });
  if (!sp || sp.memberId !== quyen.id) return { error: "Không có quyền xoá" };

  await prisma.product.delete({ where: { id } });
  revalidatePath("/tai-khoan/ho-so");
  return { ok: true, message: "Đã xoá sản phẩm" };
}
