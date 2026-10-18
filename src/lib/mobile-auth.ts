import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { chuanSoDienThoai } from "@/lib/so-dien-thoai";

// Giữ tên cũ cho nơi đang import từ file này; logic nằm ở so-dien-thoai.ts
export { chuanSoDienThoai };

/**
 * Xác thực hội viên trên Zalo Mini App.
 *
 * Khác hẳn đăng nhập web (`src/lib/auth.ts`): không dùng cookie vì Mini App
 * chạy trong webview Zalo ở domain khác. Danh tính lấy từ SĐT chính chủ do
 * Zalo xác thực, đối chiếu với `Member.phone`.
 */

const NGAY = 24 * 60 * 60 * 1000;
const HAN_PHIEN = 90 * NGAY;

const bam = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

/**
 * Đổi token của `getPhoneNumber` thành số điện thoại thật.
 * Xem https://mini.zalo.me/documents/api/getPhoneNumber/
 */
export async function doiTokenLaySoDienThoai(
  tokenSdt: string,
  accessToken: string,
): Promise<string> {
  const secret = process.env.ZALO_APP_SECRET;
  if (!secret) throw new Error("Chưa cấu hình ZALO_APP_SECRET trong .env");

  const r = await fetch("https://graph.zalo.me/v2.0/me/info", {
    headers: {
      access_token: accessToken,
      code: tokenSdt,
      secret_key: secret,
    },
  });

  const j = (await r.json()) as {
    error?: number;
    message?: string;
    data?: { number?: string };
  };

  if (j.error !== 0 || !j.data?.number) {
    throw new Error(
      `Zalo từ chối trả số điện thoại: ${j.message ?? "không rõ"}`,
    );
  }

  return chuanSoDienThoai(j.data.number);
}

/** Tạo phiên mới, trả về token thô để Mini App lưu vào máy. */
export async function taoPhien(phone: string, zaloUserId?: string) {
  const member = await prisma.member.findFirst({
    where: { phone, active: true },
    select: { id: true },
  });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.phienMiniApp.create({
    data: {
      tokenHash: bam(token),
      phone,
      zaloUserId: zaloUserId ?? null,
      memberId: member?.id ?? null,
      expiresAt: new Date(Date.now() + HAN_PHIEN),
    },
  });

  return { token, memberId: member?.id ?? null };
}

/**
 * Đọc phiên từ header `x-yba-phien`. Trả null nếu không có / hết hạn.
 * Tự gia hạn khi phiên còn dùng — hội viên không phải đăng nhập lại mỗi 90 ngày
 * nếu vẫn mở app đều.
 */
export async function docPhien(req: Request) {
  const token = req.headers.get("x-yba-phien");
  if (!token) return null;

  const phien = await prisma.phienMiniApp.findUnique({
    where: { tokenHash: bam(token) },
    select: { id: true, phone: true, memberId: true, expiresAt: true },
  });

  if (!phien || phien.expiresAt < new Date()) return null;

  // Gia hạn tối đa một lần mỗi ngày để không ghi CSDL mỗi lần gọi API
  const conLai = phien.expiresAt.getTime() - Date.now();
  if (conLai < HAN_PHIEN - NGAY) {
    await prisma.phienMiniApp.update({
      where: { id: phien.id },
      data: {
        lanCuoi: new Date(),
        expiresAt: new Date(Date.now() + HAN_PHIEN),
      },
    });
  }

  return phien;
}

/** Phiên có gắn với một hội viên thật hay không. */
export async function docHoiVien(req: Request) {
  const phien = await docPhien(req);
  if (!phien?.memberId) return null;
  return prisma.member.findUnique({
    where: { id: phien.memberId },
    select: {
      id: true,
      code: true,
      slug: true,
      name: true,
      salutation: true,
      company: true,
      position: true,
      hoiRole: true,
      memberType: true,
      phone: true,
      email: true,
      avatar: true,
      logo: true,
      district: true,
      offering: true,
      needing: true,
      category: { select: { name: true, icon: true } },
    },
  });
}
