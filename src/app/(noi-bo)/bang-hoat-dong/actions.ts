"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { dongBoTatCa1010 } from "@/lib/checkin-1010";
import { dongBoDiemSuKienThuong } from "@/lib/diem-su-kien";
import { chuanQuyTac, ghiQuyTacDiem } from "@/lib/diem-tu-dong";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";
import { LOAI_DIEM } from "./loai-diem";

export type KetQuaDiem = { error?: string; ok?: string };

function chuoi(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

/**
 * Thư ký / Ban Điều hành cộng điểm hoạt động cho một hội viên (Chủ tịch
 * chốt 24/09/2026, sổ tính từ 10.10.2026). Điểm cuối = (điểm gốc HOẶC số
 * triệu tài trợ, 1 triệu = 1 điểm) × hệ số quy mô — ví dụ Trưởng BTC 30đ
 * × hệ số 3 (sự kiện 300 khách) = 90đ; tài trợ 50tr = 50đ. Mỗi lần cộng
 * lưu một dòng sổ kèm LÝ DO + NGƯỜI XÁC NHẬN để dò lại.
 */
export async function congDiem(_p: KetQuaDiem, fd: FormData): Promise<KetQuaDiem> {
  const user = await requireUser();
  if (!co(user, QUYEN.VINH_DANH_QUAN_LY)) {
    return { error: "Anh/chị chưa có quyền cộng điểm (quyền Quản lý vinh danh)." };
  }

  const memberId = chuoi(fd, "memberId");
  const loai = LOAI_DIEM[chuoi(fd, "loai")] ? chuoi(fd, "loai") : "KHAC";
  const lyDo = chuoi(fd, "lyDo").slice(0, 300);
  const diemGocTho = Number(chuoi(fd, "diem"));
  const trieuTho = Number(chuoi(fd, "trieu"));
  const heSoTho = Number(chuoi(fd, "heSo"));

  if (!memberId) return { error: "Chọn hội viên cần cộng điểm." };
  if (lyDo.length < 3) {
    return { error: "Ghi rõ lý do (ví dụ: Tài trợ Kim cương chương trình 10/10)." };
  }
  const heSo = Number.isFinite(heSoTho) && heSoTho > 0 ? Math.min(heSoTho, 10) : 1;
  const goc = Number.isFinite(diemGocTho) && diemGocTho !== 0
    ? diemGocTho
    : Number.isFinite(trieuTho) && trieuTho !== 0
      ? trieuTho // 1 triệu = 1 điểm
      : 0;
  const diem = Math.round(goc * heSo);
  if (!diem) return { error: "Nhập điểm hoặc số tiền tài trợ (triệu)." };
  if (Math.abs(diem) > 1000) return { error: "Một lần cộng tối đa 1.000 điểm." };

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { name: true },
  });
  if (!member) return { error: "Không tìm thấy hội viên." };

  // Ghi kèm cách tính vào lý do để sau này dò lại không phải đoán
  const cachTinh =
    trieuTho && !diemGocTho
      ? ` [${trieuTho} triệu × 1đ/triệu${heSo !== 1 ? ` × hệ số ${heSo}` : ""} = ${diem}đ]`
      : heSo !== 1
        ? ` [${goc}đ × hệ số ${heSo} = ${diem}đ]`
        : "";

  await prisma.diemHoatDong.create({
    data: {
      memberId,
      diem,
      loai,
      lyDo: lyDo + cachTinh,
      nguoiCongId: user.id,
      nguoiCongTen: user.name,
    },
  });
  revalidatePath("/bang-hoat-dong");
  return { ok: `Đã cộng ${diem} điểm cho ${member.name}.` };
}

/** Xoá một dòng sổ điểm (cộng nhầm) — chỉ cấp lãnh đạo. */
export async function xoaDiem(_p: KetQuaDiem, fd: FormData): Promise<KetQuaDiem> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    return { error: "Chỉ cấp lãnh đạo mới xoá được dòng sổ điểm." };
  }
  const dong = await prisma.diemHoatDong.findUnique({
    where: { id: chuoi(fd, "id") },
    select: { nguon: true },
  });
  if (!dong) return { error: "Dòng điểm này không còn." };
  if (dong.nguon) {
    return {
      error:
        "Dòng này do máy cộng theo check-in — muốn bỏ thì huỷ lượt check-in ở màn check-in, điểm tự rút.",
    };
  }
  await prisma.diemHoatDong.delete({ where: { id: chuoi(fd, "id") } });
  revalidatePath("/bang-hoat-dong");
  return { ok: "Đã xoá dòng điểm." };
}

/**
 * Lưu QUY TẮC CỘNG ĐIỂM TỰ ĐỘNG khi check-in bằng mã QR (01/10/2026) rồi
 * tính lại ngay toàn bộ dòng điểm tự động theo quy tắc mới — đổi 5 thành 10
 * là các dòng đã cộng đổi theo, tắt đi là rút hết, bật lại là có lại.
 */
export async function luuQuyTacDiem(
  _p: KetQuaDiem,
  fd: FormData
): Promise<KetQuaDiem> {
  const user = await requireUser();
  if (!co(user, QUYEN.VINH_DANH_QUAN_LY)) {
    return { error: "Anh/chị chưa có quyền đổi quy tắc điểm (quyền Quản lý vinh danh)." };
  }
  const q = chuanQuyTac({
    bat: fd.get("bat") === "1",
    phien1010: chuoi(fd, "phien1010"),
    suKien: chuoi(fd, "suKien"),
    dienTap: fd.get("dienTap") === "1",
  });
  await ghiQuyTacDiem(q);
  const [a, b] = [await dongBoTatCa1010(), await dongBoDiemSuKienThuong(q)];
  revalidatePath("/bang-hoat-dong");
  revalidatePath("/quan-tri/su-kien-1010");
  revalidatePath("/quan-tri/khach-moi-1010");
  revalidatePath("/quan-tri/khach-moi-1010/check-in");
  return {
    ok:
      `Đã lưu. Điểm check-in tính lại theo quy tắc mới: Lễ chuyển giao 10/10 — ` +
      `${a.soHoiVienCoDiem} hội viên, ${a.tongDiem} điểm; sự kiện khác — ${b.soDong} lượt, ${b.tongDiem} điểm.`,
  };
}
