"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { ghiCaiDat } from "@/lib/cai-dat";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";
import { KHOA_NHA_TAI_TRO, tachNhaTaiTro } from "@/lib/tai-tro-1010";

export type KetQuaNTT = { error?: string; ok?: string };

/** Mã thư mời CL-XXXXX, bỏ ký tự dễ nhìn nhầm — cùng luật với khach-moi-1010. */
function sinhMaMoi(): string {
  const bo = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return (
    "CL-" + Array.from(crypto.randomBytes(5), (b) => bo[b % bo.length]).join("")
  );
}

/**
 * DUYỆT một đăng ký tham dự tự do (form ② trên landing) → tự tạo THƯ MỜI
 * RIÊNG cho khách với SUẤT MỜI đúng các phiên họ đã đăng ký (Chủ tịch chốt
 * 25/09): khách xuất hiện trong danh sách mời theo phiên, nhận link thiệp
 * để tự XÁC NHẬN — trên thiệp các phiên ngoài suất (vd Gala có phí mà chưa
 * đăng ký) hiện nhưng bị khoá.
 */
export async function duyetVaTaoThuMoi(
  _p: KetQuaNTT,
  fd: FormData
): Promise<KetQuaNTT> {
  const user = await requireUser();
  if (!co(user, QUYEN.SU_KIEN_QUAN_LY)) return { error: "Không có quyền." };

  const id = String(fd.get("id") ?? "").trim();
  const dk = await prisma.dangKyHoatDong.findUnique({ where: { id } });
  if (!dk) return { error: "Không tìm thấy đăng ký." };
  if (dk.loai !== "THAM_GIA") return { error: "Đây không phải đăng ký tham dự." };

  // Chống tạo trùng: cùng tên + SĐT đã có thư mời thì chỉ duyệt, không tạo
  const daCo = await prisma.khachMoi1010.findFirst({
    where: dk.phone ? { ten: dk.name, phone: dk.phone } : { ten: dk.name },
  });
  if (daCo) {
    await prisma.dangKyHoatDong.update({
      where: { id },
      data: { status: "DA_DUYET" },
    });
    revalidatePath("/quan-tri/su-kien-1010");
    return {
      ok: `${dk.name} đã có thư mời sẵn (${daCo.ma}) — chỉ đánh dấu đã duyệt.`,
    };
  }

  // Sinh mã chưa trùng
  let ma = sinhMaMoi();
  for (let i = 0; i < 20; i++) {
    if (!(await prisma.khachMoi1010.findUnique({ where: { ma } }))) break;
    ma = sinhMaMoi();
  }

  const phienDangKy = (dk.phien ?? "")
    .split(",")
    .filter((p) => ["TOA_DAM", "CHUYEN_GIAO", "GALA"].includes(p));

  await prisma.$transaction([
    prisma.dangKyHoatDong.update({
      where: { id },
      data: { status: "DA_DUYET" },
    }),
    prisma.khachMoi1010.create({
      data: {
        ma,
        ten: dk.name,
        chucDanh: dk.chucVu || null,
        donVi: dk.company || null,
        phone: dk.phone || null,
        email: dk.email || null,
        nhom: "KHACH_MOI",
        // Suất mời = đúng các phiên đã đăng ký; không chọn gì coi như đủ 3
        phienDuocMoi: phienDangKy.length ? phienDangKy.join(",") : null,
        ghiChuBTC:
          `Từ đăng ký tự do trên landing · duyệt bởi ${user.name}` +
          (dk.soNguoi > 1 ? ` · đăng ký ${dk.soNguoi} người` : ""),
      },
    }),
  ]);

  revalidatePath("/quan-tri/su-kien-1010");
  revalidatePath("/quan-tri/khach-moi-1010");
  return {
    ok:
      `Đã duyệt và tạo thư mời ${ma} cho ${dk.name}` +
      (phienDangKy.length ? ` (suất mời: ${phienDangKy.length} phiên)` : "") +
      ` — vào Danh sách khách mời bấm "Chép link" gửi khách xác nhận.`,
  };
}

/** Xoá một đăng ký tự do (rác/trùng) — bản riêng cho khu 10/10, chỉ
 *  revalidate hai trang quản trị liên quan. */
export async function xoaDangKyLanding(
  _p: KetQuaNTT,
  fd: FormData
): Promise<KetQuaNTT> {
  const user = await requireUser();
  if (!co(user, QUYEN.SU_KIEN_QUAN_LY)) return { error: "Không có quyền." };
  await prisma.dangKyHoatDong
    .delete({ where: { id: String(fd.get("id") ?? "").trim() } })
    .catch(() => null);
  revalidatePath("/quan-tri/khach-moi-1010");
  revalidatePath("/quan-tri/su-kien-1010");
  return { ok: "Đã xoá đăng ký." };
}

/**
 * Lưu danh sách nhà tài trợ hiện trong khung tri ân của landing /1010.
 * BTC dán chữ thường theo mẫu "1/ Tên gói" + các dòng "+ Tên đơn vị".
 */
export async function luuNhaTaiTro(
  _p: KetQuaNTT,
  fd: FormData
): Promise<KetQuaNTT> {
  const user = await requireUser();
  if (!co(user, QUYEN.SU_KIEN_QUAN_LY)) return { error: "Không có quyền." };

  const van = String(fd.get("van") ?? "").trim().slice(0, 20_000);
  const goi = tachNhaTaiTro(van);
  if (van && goi.length === 0) {
    return {
      error:
        "Không đọc được gói nào — mỗi gói bắt đầu bằng \"1/ Tên gói\", " +
        "mỗi đơn vị một dòng bắt đầu bằng dấu +.",
    };
  }
  await ghiCaiDat(KHOA_NHA_TAI_TRO, van);
  revalidatePath("/1010");
  revalidatePath("/quan-tri/su-kien-1010");
  const soDonVi = goi.reduce((s, g) => s + g.donVi.length, 0);
  return {
    ok: `Đã lưu ${goi.length} gói · ${soDonVi} đơn vị — khung tri ân trên landing đã đổi theo.`,
  };
}
