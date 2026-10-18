/**
 * Khung chạy server action của game — CHỈ MÁY CHỦ (không phải file "use server",
 * import từ các file action). Lấy người chơi từ phiên đăng nhập, chặn khi Ban
 * Điều hành tạm dừng game, đổi lỗi thành thông báo dễ hiểu.
 */
import { requireUser } from "@/lib/auth";
import { coMot, QUYEN } from "@/lib/quyen";
import { docTinhNang } from "./cai-dat";
import type { KetQuaAction, NguoiChoi } from "./kieu";
import { LoiGame } from "./so-cai";

export async function chay<T>(
  fn: (nguoi: NguoiChoi) => Promise<T>,
): Promise<KetQuaAction<T>> {
  let nguoi: NguoiChoi;
  let laBan = false;
  try {
    const u = await requireUser();
    nguoi = { userId: u.id, memberId: u.memberId };
    laBan = coMot(u, QUYEN.NGOI_NHA_QUAN_LY, QUYEN.NGOI_NHA_CAI_DAT);
  } catch {
    return {
      ok: false,
      loi: "Phiên đăng nhập đã hết. Đăng nhập lại để chơi tiếp.",
      ma: "DANG_NHAP",
    };
  }
  try {
    // Tạm dừng game: người vận hành vẫn chơi được để kiểm tra trước khi mở lại
    if (!laBan) {
      const tn = await docTinhNang();
      if (tn.tamDung)
        return { ok: false, loi: tn.thongBaoTamDung, ma: "TAM_DUNG" };
    }
    return { ok: true, data: await fn(nguoi) };
  } catch (e) {
    if (e instanceof LoiGame) return { ok: false, loi: e.message, ma: e.ma };
    console.error("[ngoi-nha]", e);
    return { ok: false, loi: "Máy chủ đang bận, thử lại sau vài giây." };
  }
}

/** Người dùng có phải người vận hành / cài đặt game (được chơi khi tạm dừng). */
export function laNguoiVanHanh(u: {
  role: string;
  permissions?: string | null;
}): boolean {
  return coMot(u, QUYEN.NGOI_NHA_QUAN_LY, QUYEN.NGOI_NHA_CAI_DAT);
}
