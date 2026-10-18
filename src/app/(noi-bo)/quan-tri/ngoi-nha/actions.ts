"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { co, QUYEN } from "@/lib/quyen";
import { prisma } from "@/lib/prisma";
import {
  chuanGiai,
  coCauMau,
  ghiCoCauMau,
  type DongPhanThuong,
} from "@/lib/ngoi-nha/mua";
import {
  chuanMoc,
  chuanThongSo,
  MA_GIAI,
  type MocQua,
} from "@/lib/ngoi-nha/moc-qua";
import { ghiThongSo } from "@/lib/ngoi-nha/cau-hinh";

import { ghiNhatKy } from "@/lib/ngoi-nha/nhat-ky";
import {
  DAU_CO_QUA,
  QUA_THANG_TOI_DA_MOI_MUA,
} from "@/lib/ngoi-nha/vinh-danh-thang";
import { KHONG_QUYEN_CAI_DAT, nguoiCaiDat } from "./_cai-dat/quyen";

export type KetQua = {
  ok?: boolean;
  error?: string;
  message?: string;
  /** Cơ cấu quà sau khi máy chủ làm sạch — form hiện lại đúng bản đã lưu */
  giai?: DongPhanThuong[];
  moc?: MocQua[];
};

const chuoi = (fd: FormData, ten: string) => String(fd.get(ten) ?? "").trim();
const GOC = "/quan-tri/ngoi-nha";

/** Mọi thao tác vận hành game đều cần quyền NGOI_NHA_QUAN_LY (ADMIN luôn có). */
async function nguoiVanHanh() {
  const user = await requireUser();
  return co(user, QUYEN.NGOI_NHA_QUAN_LY) ? user : null;
}

/** Ngày nhập "yyyy-mm-dd" → mốc giờ Việt Nam: bắt đầu 0:00, kết thúc 23:59:59. */
function mocVN(ngay: string, cuoiNgay: boolean): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) return null;
  const d = new Date(
    `${ngay}T${cuoiNgay ? "23:59:59.999" : "00:00:00.000"}+07:00`,
  );
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Tạo mùa mới hoặc sửa mùa đang có (tên, ngày, ghi chú). */
export async function luuMua(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const user = await nguoiCaiDat();
  if (!user) return { error: KHONG_QUYEN_CAI_DAT };
  const id = chuoi(fd, "id");
  const ten = chuoi(fd, "ten").slice(0, 120);
  const batDau = mocVN(chuoi(fd, "batDau"), false);
  const ketThuc = mocVN(chuoi(fd, "ketThuc"), true);
  const ghiChu = chuoi(fd, "ghiChu").slice(0, 1000) || null;
  if (!ten) return { error: "Nhập tên mùa giải, ví dụ “Mùa 1 – Thắp lửa”" };
  if (!batDau || !ketThuc)
    return { error: "Ngày bắt đầu / kết thúc chưa đúng" };
  if (ketThuc <= batDau)
    return { error: "Ngày kết thúc phải sau ngày bắt đầu" };

  if (id) {
    const cn = await prisma.nnMua.updateMany({
      where: { id },
      data: { ten, batDau, ketThuc, ghiChu },
    });
    if (cn.count !== 1) return { error: "Không tìm thấy mùa giải" };
  } else {
    // Mùa mới lấy cơ cấu quà mẫu Ban Điều hành đã soạn (chơi thử đang dùng)
    await prisma.nnMua.create({
      data: {
        ten,
        batDau,
        ketThuc,
        ghiChu,
        trangThai: "SAP_MO",
        phanThuong: JSON.stringify(await coCauMau()),
      },
    });
  }
  await ghiNhatKy(user.id, "nn.mua:luu", {
    muc: ten,
    moTa: id ? "sửa" : "tạo mới",
  });
  revalidatePath(GOC);
  revalidatePath("/ngoi-nha", "layout");
  return {
    ok: true,
    message: id
      ? "Đã lưu mùa giải"
      : "Đã tạo mùa giải — bấm “Mở mùa” khi sẵn sàng",
  };
}

/**
 * Mở mùa: chỉ một mùa DANG_MO tại một thời điểm. Người chơi bắt đầu tính điểm
 * từ ngày bắt đầu; trước ngày đó vẫn là chơi thử.
 */
export async function moMua(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const user = await nguoiCaiDat();
  if (!user) return { error: KHONG_QUYEN_CAI_DAT };
  const id = chuoi(fd, "id");
  const mua = await prisma.nnMua.findUnique({
    where: { id },
    select: { ten: true, trangThai: true },
  });
  if (!mua) return { error: "Không tìm thấy mùa giải" };
  if (mua.trangThai !== "SAP_MO")
    return { error: "Chỉ mở được mùa chưa mở (mùa đã đóng không mở lại)" };
  const dangMo = await prisma.nnMua.findFirst({
    where: { trangThai: "DANG_MO", id: { not: id } },
    select: { ten: true },
  });
  if (dangMo)
    return {
      error: `Đang mở “${dangMo.ten}”. Đóng mùa đó trước khi mở mùa mới.`,
    };
  await prisma.nnMua.update({ where: { id }, data: { trangThai: "DANG_MO" } });
  await ghiNhatKy(user.id, "nn.mua:mo", { muc: mua.ten, moTa: "mở mùa" });
  revalidatePath(GOC);
  revalidatePath("/ngoi-nha", "layout");
  return { ok: true, message: "Đã mở mùa giải" };
}

export async function dongMua(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const user = await nguoiCaiDat();
  if (!user) return { error: KHONG_QUYEN_CAI_DAT };
  const id = chuoi(fd, "id");
  const cn = await prisma.nnMua.updateMany({
    where: { id, trangThai: "DANG_MO" },
    data: { trangThai: "DA_DONG" },
  });
  if (cn.count !== 1) return { error: "Mùa này không ở trạng thái đang mở" };
  await ghiNhatKy(user.id, "nn.mua:dong", { moTa: "đóng mùa" });
  revalidatePath(GOC);
  revalidatePath("/ngoi-nha", "layout");
  return {
    ok: true,
    message: "Đã đóng mùa giải. Bảng xếp hạng được giữ nguyên để tổng kết.",
  };
}

/**
 * Lưu cơ cấu quà (giải xếp hạng + mốc quà). `muaId` trống = cơ cấu mẫu (dùng khi
 * chơi thử và làm khuôn cho mùa tạo sau); có `muaId` = cơ cấu riêng của mùa đó.
 */
export async function luuCoCauQua(
  _prev: KetQua,
  fd: FormData,
): Promise<KetQua> {
  const user = await nguoiCaiDat();
  if (!user) return { error: KHONG_QUYEN_CAI_DAT };
  const muaId = chuoi(fd, "muaId");
  let giai, moc;
  try {
    giai = chuanGiai(JSON.parse(chuoi(fd, "giai") || "[]"));
    moc = chuanMoc(JSON.parse(chuoi(fd, "moc") || "[]"));
  } catch {
    return {
      error: "Dữ liệu cơ cấu quà không đọc được, tải lại trang rồi thử lại",
    };
  }
  if (!giai.length && !moc.length)
    return { error: "Cần ít nhất một giải hoặc một mốc quà" };
  if (muaId) {
    const mua = await prisma.nnMua.findUnique({
      where: { id: muaId },
      select: { id: true },
    });
    if (!mua) return { error: "Không tìm thấy mùa giải" };
    await prisma.nnMua.update({
      where: { id: muaId },
      data: { phanThuong: JSON.stringify({ giai, moc }) },
    });
  } else {
    await ghiCoCauMau({ giai, moc });
  }
  await ghiNhatKy(user.id, "nn.qua:coCau", {
    muc: muaId ? "cơ cấu quà của mùa" : "cơ cấu quà mẫu",
    moTa: `${giai.length} giải, ${moc.length} mốc`,
  });
  revalidatePath(GOC);
  revalidatePath("/ngoi-nha", "layout");
  return {
    ok: true,
    message: `Đã lưu ${giai.length} giải và ${moc.length} mốc quà`,
    giai,
    moc,
  };
}

/** Lưu thông số game (Đấu trường, lượt tính điểm, câu thưởng). */
export async function luuThongSo(_prev: KetQua, fd: FormData): Promise<KetQua> {
  if (!(await nguoiCaiDat())) return { error: KHONG_QUYEN_CAI_DAT };
  const so = (k: string) => Number(chuoi(fd, k));
  const kq = await ghiThongSo(
    chuanThongSo({
      dauTruong: {
        soCau: so("soCau"),
        giay: so("giay"),
        thang: so("thang"),
        hoa: so("hoa"),
        thua: so("thua"),
        moiCauDung: so("moiCauDung"),
      },
      luotTinhDiemToiDa: so("luotTinhDiemToiDa"),
      cauThuong: fd.get("cauThuong") === "on",
    }),
  );
  revalidatePath(GOC);
  revalidatePath("/ngoi-nha", "layout");
  return {
    ok: true,
    message: `Đã lưu: Đấu trường ${kq.dauTruong.soCau} câu × ${kq.dauTruong.giay} giây, ${kq.luotTinhDiemToiDa} lượt tính điểm mỗi trạm, câu thưởng ${kq.cauThuong ? "bật" : "tắt"}`,
  };
}

/** Ghi nhận đã trao quà: mốc quà (mã mốc, ví dụ AO_THUN) hoặc giải xếp hạng (GIAI). */
export async function ghiTraoQua(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const user = await nguoiVanHanh();
  if (!user) return { error: "Không có quyền vận hành game" };
  const userId = chuoi(fd, "userId");
  const muaId = chuoi(fd, "muaId");
  const loai = chuoi(fd, "loai");
  const ghiChu = chuoi(fd, "ghiChu").slice(0, 300) || null;
  if (
    !userId ||
    !muaId ||
    !(loai === MA_GIAI || /^[A-Z0-9_]{2,40}$/.test(loai))
  )
    return { error: "Thiếu thông tin" };

  // Trần quà tháng: một người chỉ NHẬN QUÀ tối đa 2 lần mỗi mùa (anh Khang
  // chốt 20/09/2026) — chặn ở máy chủ, không tin giao diện đã ẩn nút
  if (loai.startsWith("VD_") && ghiChu?.includes(DAU_CO_QUA)) {
    const daCo = await prisma.nnTraoQua.findMany({
      where: { userId, muaId, loai: { startsWith: "VD_" } },
      select: { loai: true, ghiChu: true },
    });
    const soLan = daCo.filter(
      (x) => x.loai !== loai && x.ghiChu?.includes(DAU_CO_QUA),
    ).length;
    if (soLan >= QUA_THANG_TOI_DA_MOI_MUA)
      return {
        error: `Hội viên này đã nhận quà tháng ${soLan} lần trong mùa (tối đa ${QUA_THANG_TOI_DA_MOI_MUA}). Vẫn vinh danh được, nhưng suất quà nhường người kế tiếp.`,
      };
  }

  await prisma.nnTraoQua.upsert({
    where: { userId_muaId_loai: { userId, muaId, loai } },
    create: { userId, muaId, loai, ghiChu, traoBoi: user.id },
    update: { ghiChu, traoBoi: user.id },
  });
  await ghiNhatKy(user.id, "nn.qua:trao", {
    moTa: ghiChu ? `${loai} · ${ghiChu}` : loai,
    userId,
  });
  revalidatePath(GOC);
  return {
    ok: true,
    message: loai.startsWith("VD_")
      ? "Đã ghi nhận vinh danh"
      : "Đã ghi nhận trao quà",
  };
}

/** Ẩn / hiện một người chơi khỏi bảng xếp hạng (Ban soạn đề, Ban vận hành). */
export async function doiAnXepHang(
  _prev: KetQua,
  fd: FormData,
): Promise<KetQua> {
  const user = await nguoiVanHanh();
  if (!user) return { error: "Không có quyền vận hành game" };
  const userId = chuoi(fd, "userId");
  if (!userId) return { error: "Thiếu người chơi" };
  const nc = await prisma.nnNguoiChoi.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  await prisma.nnNguoiChoi.update({
    where: { userId },
    data: { anXepHang: !nc.anXepHang },
  });
  await ghiNhatKy(user.id, "nn.nguoiChoi:anXepHang", {
    moTa: nc.anXepHang
      ? "hiện lại trên bảng xếp hạng"
      : "ẩn khỏi bảng xếp hạng",
    userId,
  });
  revalidatePath(GOC);
  revalidatePath("/ngoi-nha/xep-hang");
  return {
    ok: true,
    message: nc.anXepHang
      ? "Đã đưa lại vào bảng xếp hạng"
      : "Đã ẩn khỏi bảng xếp hạng (vẫn chơi, vẫn nhận quà hoàn thành)",
  };
}
