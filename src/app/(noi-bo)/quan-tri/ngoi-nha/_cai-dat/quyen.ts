/**
 * Kiểm quyền cho server action quản trị game (KHÔNG phải file "use server").
 *  - NGOI_NHA_QUAN_LY: vận hành hằng ngày (duyệt, trao quà, Đấu trí, người chơi)
 *  - NGOI_NHA_CAI_DAT: mùa giải, quà, luật, bật tắt, nội dung
 * ADMIN luôn có cả hai.
 */
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { co, QUYEN } from "@/lib/quyen";

export async function nguoiVanHanh() {
  const user = await getCurrentUser();
  return user && co(user, QUYEN.NGOI_NHA_QUAN_LY) ? user : null;
}

export async function nguoiCaiDat() {
  const user = await getCurrentUser();
  return user && co(user, QUYEN.NGOI_NHA_CAI_DAT) ? user : null;
}

export const KHONG_QUYEN_VAN_HANH = "Không có quyền vận hành game";
export const KHONG_QUYEN_CAI_DAT =
  "Không có quyền cài đặt game — cần quyền “Cài đặt game Ngôi nhà Chợ Lớn”";

export const GOC_QUAN_TRI_GAME = "/quan-tri/ngoi-nha";

/** Làm mới trang quản trị game và mọi trang trong game. */
export function lamMoiGame() {
  revalidatePath(GOC_QUAN_TRI_GAME);
  revalidatePath("/ngoi-nha", "layout");
}
