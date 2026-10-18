"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  soChuDao,
  canChiCua,
  napAmCua,
  chamTinhCach,
  chamKhiChat,
  type TinhCachKey,
} from "@/lib/chan-dung";
import { TINH_CACH_CAU_HOI } from "@/lib/chan-dung-noi-dung";
import { KHI_CHAT_CAU_HOI, type KhiChatKey } from "@/lib/khi-chat-noi-dung";

/**
 * Bộ trắc nghiệm công khai: khách điền thông tin liên hệ một lần rồi làm bài.
 * Mã phiên lưu trong cookie để khách quay lại vẫn thấy kết quả cũ mà không phải
 * đăng nhập — cookie chỉ chứa id bản ghi, không chứa thông tin cá nhân.
 */
const COOKIE = "yba_test";
const HAN_COOKIE = 60 * 60 * 24 * 90; // 90 ngày

export type KetQuaGui = { error?: string; ok?: boolean };

function chuoi(fd: FormData, k: string): string {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

/** Số điện thoại Việt Nam: 9–11 chữ số, cho phép khoảng trắng và dấu chấm. */
function hopLeSdt(s: string): boolean {
  return /^[0-9]{9,11}$/.test(s.replace(/[\s.\-()+]/g, ""));
}

/** Đọc id phiên hiện tại từ cookie. */
export async function layPhien(): Promise<string | null> {
  const c = await cookies();
  return c.get(COOKIE)?.value ?? null;
}

/** Bước 1 — khách khai thông tin, hệ thống tính luôn phần theo ngày sinh. */
export async function batDauTest(
  _prev: KetQuaGui,
  fd: FormData
): Promise<KetQuaGui> {
  const name = chuoi(fd, "name");
  const phone = chuoi(fd, "phone");

  if (name.length < 2) return { error: "Anh/chị vui lòng nhập họ tên." };
  if (!hopLeSdt(phone))
    return { error: "Số điện thoại chưa đúng, anh/chị kiểm tra lại giúp." };

  const ngay = Number(chuoi(fd, "ngay"));
  const thang = Number(chuoi(fd, "thang"));
  const nam = Number(chuoi(fd, "nam"));

  let birthDate: Date | null = null;
  if (ngay && thang && nam) {
    const d = new Date(nam, thang - 1, ngay, 12);
    if (
      d.getDate() === ngay &&
      d.getMonth() === thang - 1 &&
      nam >= 1930 &&
      d <= new Date()
    ) {
      birthDate = d;
    } else {
      return { error: "Ngày sinh chưa hợp lệ." };
    }
  } else {
    return { error: "Anh/chị vui lòng chọn đủ ngày, tháng, năm sinh." };
  }

  // Giờ sinh để trống = không rõ; có giờ mới an sao được lá số tử vi
  const gio = chuoi(fd, "gioSinh");
  const birthHour = gio === "" ? null : Number(gio);
  if (birthHour !== null && (!Number.isInteger(birthHour) || birthHour < 0 || birthHour > 23)) {
    return { error: "Giờ sinh chưa hợp lệ." };
  }

  const y = birthDate.getFullYear();
  const dulieu = {
    name,
    phone,
    email: chuoi(fd, "email") || null,
    ngheNghiep: chuoi(fd, "ngheNghiep") || null,
    congTy: chuoi(fd, "congTy") || null,
    nganhNghe: chuoi(fd, "nganhNghe") || null,
    noiSinh: chuoi(fd, "noiSinh") || null,
    birthDate,
    birthHour,
    soChuDao: soChuDao(birthDate),
    conGiap: canChiCua(y),
    menh: napAmCua(y).nguHanh,
  };

  const c = await cookies();
  const cu = c.get(COOKIE)?.value;

  // Quay lại sửa thông tin thì cập nhật đúng bản ghi cũ, không tạo bản trùng
  const bg = cu
    ? await prisma.khachTest.update({ where: { id: cu }, data: dulieu }).catch(() => null)
    : null;

  const ban = bg ?? (await prisma.khachTest.create({ data: dulieu }));

  c.set(COOKIE, ban.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: HAN_COOKIE,
  });

  revalidatePath("/who-am-i");
  return { ok: true };
}

/** Bước 2a — nộp bài tính cách. */
export async function guiTinhCach(traLoi: TinhCachKey[]) {
  const id = await layPhien();
  if (!id) throw new Error("Phiên làm bài đã hết, anh/chị điền lại thông tin giúp.");
  if (
    !Array.isArray(traLoi) ||
    traLoi.length !== TINH_CACH_CAU_HOI.length ||
    traLoi.some((a) => !["lua", "gio", "dat", "nuoc"].includes(a))
  ) {
    throw new Error("Bài làm chưa đủ câu trả lời");
  }

  const { chinh } = chamTinhCach(traLoi);
  await prisma.khachTest.update({ where: { id }, data: { tinhCach: chinh } });
  revalidatePath("/who-am-i/tinh-cach");
  return { chinh };
}

/** Bước 2b — nộp bài khí chất. */
export async function guiKhiChat(traLoi: KhiChatKey[]) {
  const id = await layPhien();
  if (!id) throw new Error("Phiên làm bài đã hết, anh/chị điền lại thông tin giúp.");
  if (
    !Array.isArray(traLoi) ||
    traLoi.length !== KHI_CHAT_CAU_HOI.length ||
    traLoi.some((a) => !["ung", "ho", "xa", "holy", "long"].includes(a))
  ) {
    throw new Error("Bài làm chưa đủ câu trả lời");
  }

  const { chinh, phanTram } = chamKhiChat(traLoi);
  await prisma.khachTest.update({
    where: { id },
    data: { khiChat: chinh, khiChatTyLe: JSON.stringify(phanTram) },
  });
  revalidatePath("/who-am-i/khi-chat");
  return { chinh, phanTram };
}

/** Làm lại một bài. */
export async function lamLaiKhach(bai: "tinh-cach" | "khi-chat") {
  const id = await layPhien();
  if (!id) return;
  await prisma.khachTest.update({
    where: { id },
    data:
      bai === "tinh-cach"
        ? { tinhCach: null }
        : { khiChat: null, khiChatTyLe: null },
  });
  revalidatePath(`/who-am-i/${bai}`);
}
