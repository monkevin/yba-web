"use server";

/**
 * Thao tác quản trị của nhóm giao diện game không phải "lưu một mục cài đặt"
 * (việc đó đi qua `luuCaiDat`). Kiểm quyền cài đặt, ghi nhật ký, bọc lỗi.
 */
import { prisma } from "@/lib/prisma";
import { ghiNhatKy } from "@/lib/ngoi-nha/nhat-ky";
import { KHONG_QUYEN_CAI_DAT, lamMoiGame, nguoiCaiDat } from "./quyen";

/**
 * Cho mọi người chơi xem lại hướng dẫn người mới ở lần vào game kế tiếp (vd sau
 * khi Ban soạn lại nội dung hướng dẫn). Không gắn với ô nhập nào nên client gọi
 * thẳng sau khi hỏi xác nhận.
 */
export async function choXemLaiHuongDan(): Promise<{
  ok?: boolean;
  error?: string;
  message?: string;
}> {
  const user = await nguoiCaiDat();
  if (!user) return { error: KHONG_QUYEN_CAI_DAT };
  try {
    const { count } = await prisma.nnNguoiChoi.updateMany({
      where: { daXemHuongDan: true },
      data: { daXemHuongDan: false },
    });
    await ghiNhatKy(user.id, "nn.huongDan:xemLai", {
      muc: "hướng dẫn người mới",
      moTa: `Cho ${count} người chơi xem lại hướng dẫn`,
      soNguoi: count,
    });
    lamMoiGame();
    return {
      ok: true,
      message: count
        ? `Đã bật lại hướng dẫn cho ${count} người chơi — họ sẽ thấy ở lần vào game kế tiếp.`
        : "Chưa ai tắt hướng dẫn — mọi người chơi vẫn đang thấy hướng dẫn khi vào game.",
    };
  } catch (e) {
    console.error("[quan-tri ngoi-nha] xem lai huong dan", e);
    return { error: "Máy chủ đang bận — thử lại sau vài giây" };
  }
}
