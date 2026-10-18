"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, isBackOffice } from "@/lib/auth";
import { phaiDuyetTinDang } from "@/lib/cai-dat";
import { LOAI_TIN, TRANG_THAI_TIN, ngayHetHan } from "@/lib/listing";
import { prisma } from "@/lib/prisma";
import { normalizeSearch } from "@/lib/search";
import { uniqueSlug } from "@/lib/slug";

export type KetQua = { error?: string; ok?: boolean; message?: string };

function chuoi(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

/** Hội viên đang thao tác, kèm hồ sơ doanh nghiệp của họ. */
async function nguoiDang() {
  const user = await getCurrentUser();
  if (!user) return { error: "Chưa đăng nhập" as const };
  if (!user.memberId) {
    return {
      error:
        "Tài khoản chưa gắn với hồ sơ doanh nghiệp nên chưa đăng tin được. Nhờ thư ký Chi hội gắn giúp." as const,
    };
  }
  return { user, memberId: user.memberId };
}

/**
 * Kiểm tra tin có thuộc quyền của người đang thao tác không.
 * Ban Chủ nhiệm / thư ký thao tác được trên mọi tin.
 */
async function tinCuaToi(id: string) {
  const nd = await nguoiDang();
  if ("error" in nd) return { error: nd.error };

  const tin = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, memberId: true, slug: true },
  });
  if (!tin) return { error: "Không tìm thấy tin" as const };
  if (tin.memberId !== nd.memberId && !isBackOffice(nd.user)) {
    return { error: "Không có quyền với tin này" as const };
  }
  return { tin, ...nd };
}

/** Đăng tin mới hoặc lưu tin đã có. */
export async function luuTin(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const nd = await nguoiDang();
  if ("error" in nd) return { error: nd.error };

  const id = chuoi(fd, "id");
  const loai = chuoi(fd, "type");
  const tieuDe = chuoi(fd, "title");
  const noiDung = chuoi(fd, "description");

  if (loai !== LOAI_TIN.CAN_MUA && loai !== LOAI_TIN.CAN_BAN) {
    return { error: "Chọn loại tin: cần mua hay cần bán" };
  }
  if (tieuDe.length < 10) {
    return { error: "Tiêu đề quá ngắn — viết rõ anh/chị cần mua hoặc bán gì" };
  }
  if (noiDung.length < 30) {
    return { error: "Mô tả quá ngắn — thêm chi tiết để đối tác hiểu nhu cầu" };
  }

  const chung = {
    type: loai,
    title: tieuDe,
    summary: chuoi(fd, "summary") || tieuDe,
    description: noiDung,
    categoryId: chuoi(fd, "categoryId") || null,
    images: chuoi(fd, "images") || null,
    priceText: chuoi(fd, "priceText") || null,
    quantity: chuoi(fd, "quantity") || null,
    location: chuoi(fd, "location") || null,
  };

  const doanhNghiep = await prisma.member.findUnique({
    where: { id: nd.memberId },
    select: { company: true, district: true },
  });

  const searchText = normalizeSearch(
    [
      chung.title,
      chung.summary,
      chung.description,
      chung.location,
      doanhNghiep?.company,
      doanhNghiep?.district,
    ]
      .filter(Boolean)
      .join(" ")
  );

  if (id) {
    const q = await tinCuaToi(id);
    if ("error" in q) return { error: q.error };

    await prisma.listing.update({
      where: { id },
      data: { ...chung, searchText },
    });
    revalidatePath("/tai-khoan/tin-dang");
    revalidatePath("/giao-thuong");
    revalidatePath(`/giao-thuong/${q.tin.slug}`);
    return { ok: true, message: "Đã lưu tin" };
  }

  const dangCo = await prisma.listing.count({
    where: {
      memberId: nd.memberId,
      status: { in: [TRANG_THAI_TIN.DANG_HIEN, TRANG_THAI_TIN.CHO_DUYET] },
    },
  });
  if (dangCo >= 20) {
    return {
      error: "Mỗi doanh nghiệp đăng tối đa 20 tin cùng lúc. Ẩn bớt tin cũ rồi đăng tiếp.",
    };
  }

  const slug = await uniqueSlug(
    tieuDe,
    async (s) =>
      !!(await prisma.listing.findUnique({ where: { slug: s }, select: { id: true } })),
    "tin-nhu-cau"
  );

  const canDuyet = await phaiDuyetTinDang();
  const moi = await prisma.listing.create({
    data: {
      ...chung,
      slug,
      searchText,
      memberId: nd.memberId,
      status: canDuyet ? TRANG_THAI_TIN.CHO_DUYET : TRANG_THAI_TIN.DANG_HIEN,
      expiresAt: ngayHetHan(),
    },
    select: { id: true },
  });

  revalidatePath("/tai-khoan/tin-dang");
  revalidatePath("/giao-thuong");
  redirect(`/tai-khoan/tin-dang?moi=${moi.id}`);
}

/** Ẩn / hiện lại một tin. */
export async function doiTrangThaiTin(
  _prev: KetQua,
  fd: FormData
): Promise<KetQua> {
  const q = await tinCuaToi(chuoi(fd, "id"));
  if ("error" in q) return { error: q.error };

  const muon = chuoi(fd, "trangThai");
  if (muon !== TRANG_THAI_TIN.AN && muon !== TRANG_THAI_TIN.DANG_HIEN) {
    return { error: "Trạng thái không hợp lệ" };
  }

  await prisma.listing.update({
    where: { id: q.tin.id },
    data: {
      status: muon,
      // Hiện lại thì gia hạn thêm một chu kỳ nữa cho khỏi vừa hiện đã hết hạn
      ...(muon === TRANG_THAI_TIN.DANG_HIEN ? { expiresAt: ngayHetHan() } : {}),
    },
  });

  revalidatePath("/tai-khoan/tin-dang");
  revalidatePath("/giao-thuong");
  return {
    ok: true,
    message: muon === TRANG_THAI_TIN.AN ? "Đã ẩn tin" : "Đã hiện lại tin",
  };
}

/** Gia hạn thêm 90 ngày cho tin sắp hết hạn. */
export async function giaHanTin(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await tinCuaToi(chuoi(fd, "id"));
  if ("error" in q) return { error: q.error };

  await prisma.listing.update({
    where: { id: q.tin.id },
    data: { status: TRANG_THAI_TIN.DANG_HIEN, expiresAt: ngayHetHan() },
  });

  revalidatePath("/tai-khoan/tin-dang");
  revalidatePath("/giao-thuong");
  return { ok: true, message: "Đã gia hạn thêm 90 ngày" };
}

/** Xoá hẳn một tin. */
export async function xoaTin(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await tinCuaToi(chuoi(fd, "id"));
  if ("error" in q) return { error: q.error };

  await prisma.listing.delete({ where: { id: q.tin.id } });
  revalidatePath("/tai-khoan/tin-dang");
  revalidatePath("/giao-thuong");
  return { ok: true, message: "Đã xoá tin" };
}
