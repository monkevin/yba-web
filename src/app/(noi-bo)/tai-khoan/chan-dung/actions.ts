"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chamTinhCach, chamKhiChat, type TinhCachKey } from "@/lib/chan-dung";
import { TINH_CACH_CAU_HOI } from "@/lib/chan-dung-noi-dung";
import { KHI_CHAT_CAU_HOI, type KhiChatKey } from "@/lib/khi-chat-noi-dung";

/** Làm mới trang tổng quan và cả 4 trang con. */
function lamMoi() {
  for (const p of [
    "/tai-khoan",
    "/tai-khoan/chan-dung",
    "/tai-khoan/chan-dung/than-so-hoc",
    "/tai-khoan/chan-dung/tu-vi",
    "/tai-khoan/chan-dung/tinh-cach",
    "/tai-khoan/chan-dung/khi-chat",
  ]) {
    revalidatePath(p);
  }
}

/**
 * Chân dung gắn với hồ sơ hội viên. Tài khoản quản trị thuần (không gắn hội
 * viên nào) thì không có chỗ lưu — báo lỗi rõ thay vì ghi nhầm cho người khác.
 */
async function layMemberId(): Promise<string> {
  const user = await requireUser();
  if (!user.memberId) {
    throw new Error(
      "Tài khoản này chưa gắn với hồ sơ hội viên nào nên chưa dùng được Chân dung doanh nhân."
    );
  }
  return user.memberId;
}

/**
 * Lưu thông tin gốc cho cả bốn bài: ngày sinh (bắt buộc), giờ sinh (để an sao
 * lá số tử vi), nơi sinh và họ tên khai sinh (để tính các chỉ số theo tên).
 */
export async function luuNgaySinh(
  ngay: number,
  thang: number,
  nam: number,
  gioSinh: number | null = null,
  noiSinh = "",
  hoTen = ""
) {
  const memberId = await layMemberId();

  // 12h trưa để đổi múi giờ không làm lệch sang ngày khác
  const d = new Date(nam, thang - 1, ngay, 12);
  if (
    !Number.isFinite(d.getTime()) ||
    d.getDate() !== ngay ||
    d.getMonth() !== thang - 1 ||
    nam < 1930 ||
    d > new Date()
  ) {
    throw new Error("Ngày sinh không hợp lệ");
  }
  if (
    gioSinh !== null &&
    (!Number.isInteger(gioSinh) || gioSinh < 0 || gioSinh > 23)
  ) {
    throw new Error("Giờ sinh không hợp lệ");
  }

  const ten = hoTen.trim().replace(/\s+/g, " ").slice(0, 60);
  // Họ tên chỉ nhận chữ cái có dấu và khoảng trắng, tối thiểu hai từ
  const tenHopLe = ten === "" || (/^[\p{L} ]+$/u.test(ten) && ten.split(" ").length >= 2);
  if (!tenHopLe) {
    throw new Error("Họ tên chưa hợp lệ — anh/chị nhập họ tên đầy đủ giúp");
  }

  const dulieu = {
    birthDate: d,
    birthHour: gioSinh,
    noiSinh: noiSinh.trim().slice(0, 80) || null,
    hoTen: ten || null,
  };

  await prisma.chanDung.upsert({
    where: { memberId },
    create: { memberId, ...dulieu },
    update: dulieu,
  });
  lamMoi();
}

/** Chấm trắc nghiệm tính cách; `traLoi` xếp theo đúng thứ tự câu hỏi. */
export async function luuTinhCach(traLoi: TinhCachKey[]) {
  const memberId = await layMemberId();
  if (
    !Array.isArray(traLoi) ||
    traLoi.length !== TINH_CACH_CAU_HOI.length ||
    traLoi.some((a) => !["lua", "gio", "dat", "nuoc"].includes(a))
  ) {
    throw new Error("Bài làm chưa đủ câu trả lời");
  }

  const { chinh } = chamTinhCach(traLoi);
  await prisma.chanDung.upsert({
    where: { memberId },
    create: { memberId, tinhCach: chinh },
    update: { tinhCach: chinh },
  });
  lamMoi();
  return { chinh };
}

/** Chấm test Khí chất doanh nhân (Ưng · Hổ · Xà · Hồ · Long). */
export async function luuKhiChat(traLoi: KhiChatKey[]) {
  const memberId = await layMemberId();
  if (
    !Array.isArray(traLoi) ||
    traLoi.length !== KHI_CHAT_CAU_HOI.length ||
    traLoi.some((a) => !["ung", "ho", "xa", "holy", "long"].includes(a))
  ) {
    throw new Error("Bài làm chưa đủ câu trả lời");
  }

  const { chinh, phanTram } = chamKhiChat(traLoi);
  await prisma.chanDung.upsert({
    where: { memberId },
    create: { memberId, khiChat: chinh, khiChatTyLe: JSON.stringify(phanTram) },
    update: { khiChat: chinh, khiChatTyLe: JSON.stringify(phanTram) },
  });
  lamMoi();
  return { chinh, phanTram };
}

/** Xoá kết quả một bài để làm lại. */
export async function lamLai(bai: "tinh-cach" | "khi-chat") {
  const memberId = await layMemberId();
  await prisma.chanDung.updateMany({
    where: { memberId },
    data:
      bai === "tinh-cach"
        ? { tinhCach: null }
        : { khiChat: null, khiChatTyLe: null },
  });
  lamMoi();
}
