import { prisma } from "@/lib/prisma";

/**
 * Cấu hình chung của website, lưu trong bảng `SiteSetting` để Ban Chủ nhiệm đổi
 * được từ giao diện quản trị mà không cần sửa code.
 */

export const CAI_DAT = {
  /** "1" = tin mua/bán phải được duyệt mới hiện; mặc định đăng là hiện ngay. */
  DUYET_TIN_DANG: "duyet_tin_dang",
} as const;

export async function docCaiDat(key: string): Promise<string | null> {
  const r = await prisma.siteSetting.findUnique({ where: { key } });
  return r?.value ?? null;
}

export async function ghiCaiDat(key: string, value: string): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

/**
 * Tin mới đăng có phải chờ Ban Chủ nhiệm duyệt không.
 * Mặc định KHÔNG — chợ nhu cầu chỉ có tác dụng khi hội viên đăng là thấy ngay.
 * Bật lên ở /quan-tri/tin-dang nếu về sau có tình trạng đăng tin lung tung.
 */
export async function phaiDuyetTinDang(): Promise<boolean> {
  return (await docCaiDat(CAI_DAT.DUYET_TIN_DANG)) === "1";
}
