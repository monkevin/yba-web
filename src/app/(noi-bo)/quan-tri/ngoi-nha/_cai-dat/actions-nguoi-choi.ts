"use server";

/**
 * Thao tác của Ban vận hành trên một người chơi: ẩn / hiện khỏi bảng xếp hạng,
 * điều chỉnh điểm - vốn có lý do, cho xem lại hướng dẫn, đóng lượt bỏ dở.
 * Phần ghi CSDL nằm ở `nguoi-choi-loi.ts`; file này chỉ kiểm quyền, ghi nhật
 * ký và làm mới trang. Gọi thẳng trong `startTransition` (không `<form action>`).
 */
import { muaHienTai } from "@/lib/ngoi-nha/mua";
import { ghiNhatKy } from "@/lib/ngoi-nha/nhat-ky";
import {
  chotLuotBoDo,
  ghiAnXepHang,
  ghiDieuChinh,
  ghiXemLaiHuongDan,
} from "./nguoi-choi-loi";
import { KHONG_QUYEN_VAN_HANH, lamMoiGame, nguoiVanHanh } from "./quyen";

export type KetQuaNguoiChoi = {
  ok?: boolean;
  error?: string;
  message?: string;
};

const LOI_BAN = "Máy chủ đang bận, chưa làm được — thử lại sau vài giây";

/** Ẩn (`an = true`) hoặc hiện lại một người trên bảng xếp hạng. */
export async function anHienXepHang(
  userId: string,
  an: boolean,
): Promise<KetQuaNguoiChoi> {
  try {
    const user = await nguoiVanHanh();
    if (!user) return { error: KHONG_QUYEN_VAN_HANH };
    const kq = await ghiAnXepHang(userId, an);
    if (!kq.ok) return { error: kq.error };
    if (kq.doi) {
      await ghiNhatKy(user.id, "nn.nguoiChoi:anXepHang", {
        muc: kq.tenNguoi,
        moTa: an ? "ẩn khỏi bảng xếp hạng" : "hiện lại trên bảng xếp hạng",
        userId,
      });
      lamMoiGame();
    }
    return {
      ok: true,
      message: an
        ? `Đã ẩn ${kq.tenNguoi} khỏi bảng xếp hạng — vẫn chơi, vẫn nhận quà mốc, không nhận giải xếp hạng`
        : `Đã đưa ${kq.tenNguoi} trở lại bảng xếp hạng`,
    };
  } catch (e) {
    console.error("[quan-tri ngoi-nha] an xep hang", e);
    return { error: LOI_BAN };
  }
}

/**
 * Điều chỉnh điểm / vốn thủ công. `duLieu` = `{ userId, muaId, diem, von, lyDo }`
 * — máy chủ kiểm tra lại toàn bộ (giới hạn, lý do ≥ 5 ký tự, mùa còn tính điểm).
 */
export async function dieuChinhDiem(duLieu: unknown): Promise<KetQuaNguoiChoi> {
  try {
    const user = await nguoiVanHanh();
    if (!user) return { error: KHONG_QUYEN_VAN_HANH };
    const mua = await muaHienTai();
    const kq = await ghiDieuChinh(
      duLieu,
      {
        id: user.id,
        ten: `${user.memberName ?? user.name} (${user.username})`,
      },
      mua,
    );
    if (!kq.ok) return { error: kq.error };
    await ghiNhatKy(user.id, "nn.nguoiChoi:dieuChinh", {
      muc: kq.tenNguoi,
      moTa: `điều chỉnh ${kq.moTa} — ${kq.lyDo}`,
      muaId: kq.muaId,
      nguon: kq.nguon,
      soCaiId: kq.soCaiId,
    });
    lamMoiGame();
    return {
      ok: true,
      message: `Đã ghi ${kq.moTa} cho ${kq.tenNguoi}${
        kq.huyHieuMoi.length
          ? ` · đạt thêm huy hiệu ${kq.huyHieuMoi.join(", ")}`
          : ""
      }`,
    };
  } catch (e) {
    console.error("[quan-tri ngoi-nha] dieu chinh diem", e);
    return { error: LOI_BAN };
  }
}

/** Lần vào game tới, người này thấy lại hướng dẫn người mới. */
export async function xemLaiHuongDan(userId: string): Promise<KetQuaNguoiChoi> {
  try {
    const user = await nguoiVanHanh();
    if (!user) return { error: KHONG_QUYEN_VAN_HANH };
    const kq = await ghiXemLaiHuongDan(userId);
    if (!kq.ok) return { error: kq.error };
    await ghiNhatKy(user.id, "nn.nguoiChoi:huongDan", {
      muc: kq.tenNguoi,
      moTa: "cho xem lại hướng dẫn",
      userId,
    });
    lamMoiGame();
    return {
      ok: true,
      message: `Lần vào game tới, ${kq.tenNguoi} sẽ thấy lại phần hướng dẫn`,
    };
  } catch (e) {
    console.error("[quan-tri ngoi-nha] xem lai huong dan", e);
    return { error: LOI_BAN };
  }
}

/** Chốt các lượt bỏ dở quá 6 giờ của người này (chấm theo câu đã trả lời). */
export async function dongLuotBoDo(userId: string): Promise<KetQuaNguoiChoi> {
  try {
    const user = await nguoiVanHanh();
    if (!user) return { error: KHONG_QUYEN_VAN_HANH };
    const kq = await chotLuotBoDo(userId);
    if (!kq.ok) return { error: kq.error };
    if (!kq.soDong && !kq.conLai)
      return {
        ok: true,
        message: "Không có lượt nào bỏ dở quá 6 giờ",
      };
    if (kq.soDong)
      await ghiNhatKy(user.id, "nn.nguoiChoi:dongLuot", {
        muc: kq.tenNguoi,
        moTa: `đóng ${kq.soDong} lượt bỏ dở quá 6 giờ`,
        userId,
      });
    lamMoiGame();
    if (kq.conLai)
      return {
        error: `Đã đóng ${kq.soDong} lượt, còn ${kq.conLai} lượt không đóng được — báo người phụ trách kỹ thuật`,
      };
    return { ok: true, message: `Đã đóng ${kq.soDong} lượt bỏ dở` };
  } catch (e) {
    console.error("[quan-tri ngoi-nha] dong luot bo do", e);
    return { error: LOI_BAN };
  }
}
