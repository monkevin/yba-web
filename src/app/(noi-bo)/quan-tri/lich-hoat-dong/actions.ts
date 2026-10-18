"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";
import { uniqueSlug } from "@/lib/slug";

export type KetQua = { error?: string; ok?: string };

/** Lịch hoạt động là nội dung công bố nên dùng chung quyền với sự kiện. */
async function canQuyen() {
  const user = await requireUser();
  if (!co(user, QUYEN.SU_KIEN_QUAN_LY))
    return { error: "Không có quyền thực hiện thao tác này" as const };
  return { user };
}

function chuoi(fd: FormData, k: string): string {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

function lamMoi() {
  revalidatePath("/quan-tri/lich-hoat-dong");
  revalidatePath("/lich-hoat-dong");
  revalidatePath("/");
}

/** Duyệt / từ chối một đăng ký tham gia hoặc tài trợ. */
export async function duyetDangKy(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  const status = chuoi(fd, "status");
  if (!["CHO_DUYET", "DA_DUYET", "TU_CHOI"].includes(status)) {
    return { error: "Trạng thái không hợp lệ" };
  }

  await prisma.dangKyHoatDong
    .update({ where: { id: chuoi(fd, "id") }, data: { status } })
    .catch(() => null);

  lamMoi();
  revalidatePath("/lich-hoat-dong", "layout");
  return {
    ok:
      status === "DA_DUYET"
        ? "Đã duyệt — tên sẽ hiện trên trang chi tiết."
        : status === "TU_CHOI"
          ? "Đã từ chối."
          : "Đã đưa về chờ duyệt.",
  };
}

/**
 * Ban Tổ chức tự thêm người tham gia / nhà tài trợ.
 * Dùng khi người ta đăng ký qua Zalo, điện thoại hay tại chỗ — thêm tay là đã
 * duyệt luôn, hiện ngay lên trang chi tiết.
 */
export async function themNguoi(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  const lichId = chuoi(fd, "lichId");
  const name = chuoi(fd, "name");
  if (name.length < 2) return { error: "Chưa nhập họ tên" };

  const loai = chuoi(fd, "loai") === "TAI_TRO" ? "TAI_TRO" : "THAM_GIA";
  const trieu = Number(chuoi(fd, "soTien").replace(/[^\d]/g, "")) || 0;
  const maHV = chuoi(fd, "maHoiVien").toUpperCase();

  // Gắn với hồ sơ hội viên nếu nhập mã — để sau này chấm điểm cống hiến
  const member = maHV
    ? await prisma.member.findUnique({
        where: { code: maHV },
        select: { id: true, name: true, phone: true, company: true },
      })
    : null;
  if (maHV && !member) return { error: `Không tìm thấy hội viên mã ${maHV}` };

  await prisma.dangKyHoatDong.create({
    data: {
      lichId,
      memberId: member?.id ?? null,
      name: name || member?.name || "",
      phone: chuoi(fd, "phone") || member?.phone || "—",
      company: chuoi(fd, "company") || member?.company || null,
      loai,
      soNguoi: loai === "THAM_GIA" ? Math.max(1, Number(chuoi(fd, "soNguoi")) || 1) : 1,
      mucTaiTro: loai === "TAI_TRO" ? chuoi(fd, "mucTaiTro") || null : null,
      soTien: loai === "TAI_TRO" ? trieu * 1_000_000 : 0,
      hienVat: loai === "TAI_TRO" ? chuoi(fd, "hienVat") || null : null,
      ghiChu: chuoi(fd, "ghiChu") || null,
      status: "DA_DUYET",
      doBTCThem: true,
    },
  });

  lamMoi();
  revalidatePath("/lich-hoat-dong", "layout");
  return { ok: `Đã thêm ${name}.` };
}

export async function xoaDangKy(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  await prisma.dangKyHoatDong
    .delete({ where: { id: chuoi(fd, "id") } })
    .catch(() => null);
  lamMoi();
  revalidatePath("/lich-hoat-dong", "layout");
  return { ok: "Đã xoá." };
}

/** Thêm mới hoặc sửa một mục lịch. */
export async function luuMuc(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  const id = chuoi(fd, "id");
  const tieuDe = chuoi(fd, "tieuDe");
  const tu = chuoi(fd, "tuNgay");
  if (tieuDe.length < 4) return { error: "Tên hoạt động quá ngắn" };
  if (!tu) return { error: "Chưa chọn ngày diễn ra" };

  const tuNgay = new Date(`${tu}T09:00:00`);
  if (Number.isNaN(tuNgay.getTime())) return { error: "Ngày không hợp lệ" };

  const den = chuoi(fd, "denNgay");
  const denNgay = den ? new Date(`${den}T18:00:00`) : null;
  if (denNgay && (Number.isNaN(denNgay.getTime()) || denNgay < tuNgay)) {
    return { error: "Ngày kết thúc phải sau ngày bắt đầu" };
  }

  const han = chuoi(fd, "hanDangKy");
  const hanDangKy = han ? new Date(`${han}T23:59:00`) : null;
  const soLuong = Number(chuoi(fd, "soLuongToiDa"));

  const nguon = chuoi(fd, "nguon");
  const dulieu = {
    tieuDe,
    moTa: chuoi(fd, "moTa") || null,
    noiDung: chuoi(fd, "noiDung") || null,
    yNghia: chuoi(fd, "yNghia") || null,
    banToChuc: chuoi(fd, "banToChuc") || null,
    lienHe: chuoi(fd, "lienHe") || null,
    tuNgay,
    denNgay,
    diaDiem: chuoi(fd, "diaDiem") || null,
    gioText: chuoi(fd, "gioText") || null,
    nguon: ["CHI_HOI", "HOI", "DOI_TAC"].includes(nguon) ? nguon : "CHI_HOI",
    lienKet: chuoi(fd, "lienKet") || null,
    noiBat: fd.get("noiBat") !== null,
    published: fd.get("published") !== null,
    order: Number(chuoi(fd, "order")) || 0,
    choDangKy: fd.get("choDangKy") !== null,
    hienDanhSach: fd.get("hienDanhSach") !== null,
    soLuongToiDa: soLuong > 0 && soLuong <= 5000 ? soLuong : null,
    hanDangKy: hanDangKy && !Number.isNaN(hanDangKy.getTime()) ? hanDangKy : null,
  };

  if (id) {
    await prisma.lichHoatDong.update({ where: { id }, data: dulieu });
  } else {
    // Hoạt động nào cũng cần đường dẫn riêng để có trang chi tiết
    await prisma.lichHoatDong.create({
      data: {
        ...dulieu,
        slug: await uniqueSlug(
          `${tieuDe} ${tuNgay.getFullYear()}`,
          async (s) => !!(await prisma.lichHoatDong.findUnique({ where: { slug: s } }))
        ),
      },
    });
  }

  lamMoi();
  return { ok: id ? "Đã lưu hoạt động." : "Đã thêm hoạt động." };
}

export async function xoaMuc(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  await prisma.lichHoatDong
    .delete({ where: { id: chuoi(fd, "id") } })
    .catch(() => null);
  lamMoi();
  return { ok: "Đã xoá." };
}
