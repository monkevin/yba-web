"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { dieuKienQuay, type NguonQuay } from "@/lib/boc-tham-1010";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";

/**
 * BỐC THĂM TRÚNG THƯỞNG tại Lễ chuyển giao 10/10 (Chủ tịch đặt 04/10/2026):
 * quay ngẫu nhiên TRONG SỐ KHÁCH ĐÃ CHECK-IN — check-in vừa là vé bốc thăm,
 * khách có mặt thật mới có cơ hội trúng. Luật ở src/lib/boc-tham-1010.ts.
 *
 * Người trúng được chọn bằng crypto.randomInt Ở MÁY CHỦ — hiệu ứng chạy
 * tên trên màn hình chỉ là trình diễn, không quyết định kết quả.
 */

export type KetQuaQuay = {
  /** TRUNG = có người trúng · HET = nguồn đã cạn · LOI = lỗi/thiếu quyền */
  kieu: "TRUNG" | "HET" | "LOI";
  /** Quay thử — không ghi gì vào CSDL */
  thu: boolean;
  thongBao: string;
  id?: string;
  ten?: string;
  moTa?: string;
  ban?: string | null;
  giai?: string;
  /** Còn lại bao nhiêu người trong nguồn này sau lượt quay */
  conLai?: number;
};

/**
 * Quay một lượt. Gọi thẳng từ client như một hàm (không qua form) nên trả
 * lỗi bằng `kieu` thay vì ném ngoại lệ. `thu` = quay nháp, không ghi.
 */
export async function quayBocTham(
  giaiTho: string,
  nguonTho: string,
  caBTC: boolean,
  thu: boolean
): Promise<KetQuaQuay> {
  try {
    const user = await requireUser();
    if (!co(user, QUYEN.SU_KIEN_QUAN_LY)) throw new Error();
  } catch {
    return {
      kieu: "LOI",
      thu,
      thongBao:
        "Phiên đăng nhập đã hết hoặc tài khoản chưa có quyền Quản lý sự kiện — đăng nhập lại rồi quay tiếp.",
    };
  }

  const nguon: NguonQuay = (["TOA_DAM", "LE", "GALA", "BAT_KY"] as const).includes(
    nguonTho as NguonQuay
  )
    ? (nguonTho as NguonQuay)
    : "BAT_KY";
  const giai = String(giaiTho ?? "").trim().slice(0, 120) || "Quà may mắn";

  // Tối đa 5 vòng đề phòng hai máy cùng quay trúng một người (updateMany có
  // điều kiện `trungGiai: null` nên bên thua sẽ quay lại người khác)
  for (let lan = 0; lan < 5; lan++) {
    const ungVien = await prisma.khachMoi1010.findMany({
      where: dieuKienQuay(nguon, caBTC),
      select: {
        id: true,
        ten: true,
        danhXung: true,
        chucDanh: true,
        donVi: true,
        ban: true,
      },
    });
    if (ungVien.length === 0) {
      return {
        kieu: "HET",
        thu,
        thongBao:
          "Không còn ai đủ điều kiện trong nguồn này — mọi người đã trúng giải hoặc chưa ai check-in phiên đã chọn.",
      };
    }

    const chon = ungVien[randomInt(ungVien.length)];
    const ten = [chon.danhXung, chon.ten].filter(Boolean).join(" ");
    const moTa = [chon.chucDanh, chon.donVi].filter(Boolean).join(" · ");

    if (thu) {
      return {
        kieu: "TRUNG",
        thu,
        id: chon.id,
        ten,
        moTa: moTa || undefined,
        ban: chon.ban,
        giai,
        conLai: ungVien.length - 1,
        thongBao: `QUAY THỬ — ra tên ${ten}. Chưa ghi gì, quay thật sẽ chọn lại từ đầu.`,
      };
    }

    const kq = await prisma.khachMoi1010.updateMany({
      where: { id: chon.id, trungGiai: null },
      data: { trungGiai: giai, trungLuc: new Date() },
    });
    if (kq.count !== 1) continue; // người này vừa trúng ở máy khác — quay lại

    revalidatePath("/quan-tri/khach-moi-1010/boc-tham");
    revalidatePath("/quan-tri/khach-moi-1010");
    return {
      kieu: "TRUNG",
      thu,
      id: chon.id,
      ten,
      moTa: moTa || undefined,
      ban: chon.ban,
      giai,
      conLai: ungVien.length - 1,
      thongBao: `🎉 ${ten} trúng ${giai}!`,
    };
  }
  return {
    kieu: "LOI",
    thu,
    thongBao: "Hai máy đang quay cùng lúc — bấm quay lại một lần nữa.",
  };
}

/** Huỷ một kết quả (quay nhầm / khách vắng mặt khi xướng tên) — người đó
 *  quay lại được ở các lượt sau. */
export async function huyTrung(
  id: string
): Promise<{ ok?: string; error?: string }> {
  try {
    const user = await requireUser();
    if (!co(user, QUYEN.SU_KIEN_QUAN_LY)) throw new Error();
  } catch {
    return { error: "Phiên đăng nhập đã hết — đăng nhập lại." };
  }
  const khach = await prisma.khachMoi1010.findUnique({
    where: { id: String(id ?? "") },
    select: { ten: true, trungGiai: true },
  });
  if (!khach?.trungGiai) return { error: "Kết quả này đã được huỷ từ trước." };
  await prisma.khachMoi1010.update({
    where: { id: String(id) },
    data: { trungGiai: null, trungLuc: null },
  });
  revalidatePath("/quan-tri/khach-moi-1010/boc-tham");
  revalidatePath("/quan-tri/khach-moi-1010");
  return { ok: `Đã huỷ kết quả của ${khach.ten} — người này được quay tiếp.` };
}
