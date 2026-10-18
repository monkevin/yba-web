"use server";

/**
 * Server action quản trị của nhóm Đấu trường · Đấu trí · Nhiệm vụ · Kho bộ câu.
 * Vận hành hằng ngày (phiên Đấu trí, huỷ trận treo, duyệt nhiệm vụ) cần quyền
 * NGOI_NHA_QUAN_LY; xem đáp án kho bộ câu cần NGOI_NHA_CAI_DAT. Mọi thao tác
 * ghi nhật ký `nn.*` và trả `{ error }` thay vì ném lỗi.
 */
import { BO_THEO_MA } from "@/lib/ngoi-nha/bo-cau";
import {
  doiTrangThaiDauTri,
  moLaiDauTri,
  taoDauTri,
  xoaDauTri,
} from "@/lib/ngoi-nha/dau-tri";
import { huyTranDau, tenNguoiChoi } from "@/lib/ngoi-nha/dau-truong";
import { ghiNhatKy } from "@/lib/ngoi-nha/nhat-ky";
import { xuLyNhiemVu } from "@/lib/ngoi-nha/nhiem-vu";
import { prisma } from "@/lib/prisma";
import { LoiGame } from "@/lib/ngoi-nha/so-cai";
import {
  KHONG_QUYEN_CAI_DAT,
  KHONG_QUYEN_VAN_HANH,
  lamMoiGame,
  nguoiCaiDat,
  nguoiVanHanh,
} from "./quyen";

export type KetQuaDauTruong = {
  ok?: boolean;
  error?: string;
  message?: string;
};

/** Lỗi nghiệp vụ hiện nguyên văn, lỗi khác (Prisma, mạng) báo chung chung. */
function baoLoi(e: unknown, macDinh: string): KetQuaDauTruong {
  if (e instanceof LoiGame) return { error: e.message };
  console.error("[quan-tri ngoi-nha] dau truong", e);
  return { error: macDinh };
}

const chuoi = (x: unknown, dai = 200) =>
  typeof x === "string" ? x.trim().slice(0, dai) : "";

// ─── Đấu trí sự kiện ──────────────────────────────────────────────────

export async function taoPhienDauTri(d: {
  ten: string;
  moTa: string;
  boCau: string;
  giay: number;
}): Promise<KetQuaDauTruong> {
  const user = await nguoiVanHanh();
  if (!user) return { error: KHONG_QUYEN_VAN_HANH };
  try {
    const p = await taoDauTri({
      ten: chuoi(d?.ten, 120),
      moTa: chuoi(d?.moTa, 500),
      boCau: chuoi(d?.boCau, 100),
      giayMoiCau: Number(d?.giay) || 0,
    });
    await ghiNhatKy(user.id, "nn.dauTri:tao", {
      moTa: `${p.ten} · mã ${p.maThamGia}`,
      phienId: p.id,
    });
    lamMoiGame();
    return {
      ok: true,
      message: `Đã tạo phiên “${p.ten}” — mã tham gia ${p.maThamGia}. Bấm “Mở phiên” khi bắt đầu.`,
    };
  } catch (e) {
    return baoLoi(e, "Máy chủ đang bận, chưa tạo được phiên — thử lại");
  }
}

/** Mở / đóng / mở lại một phiên Đấu trí. */
export async function doiPhienDauTri(
  id: string,
  viec: "mo" | "dong" | "moLai",
): Promise<KetQuaDauTruong> {
  const user = await nguoiVanHanh();
  if (!user) return { error: KHONG_QUYEN_VAN_HANH };
  const phienId = chuoi(id, 60);
  if (!phienId || !["mo", "dong", "moLai"].includes(viec))
    return { error: "Thiếu thông tin phiên" };
  try {
    const phien = await prisma.nnDauTri.findUnique({
      where: { id: phienId },
      select: { ten: true, trangThai: true },
    });
    if (!phien) return { error: "Không tìm thấy phiên — tải lại trang" };
    if (viec === "moLai") {
      await moLaiDauTri(phienId);
    } else if (viec === "mo") {
      if (phien.trangThai !== "SAP_MO")
        return {
          error:
            phien.trangThai === "DANG_MO"
              ? "Phiên đang mở rồi"
              : "Phiên đã đóng — dùng nút “Mở lại”",
        };
      await doiTrangThaiDauTri(phienId, "DANG_MO");
    } else {
      if (phien.trangThai !== "DANG_MO")
        return { error: "Phiên không ở trạng thái đang mở" };
      await doiTrangThaiDauTri(phienId, "DA_DONG");
    }
    await ghiNhatKy(user.id, `nn.dauTri:${viec}`, {
      moTa: phien.ten,
      phienId,
    });
    lamMoiGame();
    return {
      ok: true,
      message:
        viec === "dong"
          ? "Đã đóng phiên"
          : viec === "moLai"
            ? "Đã mở lại phiên — ai chưa chơi vào được ngay"
            : "Đã mở phiên — hội viên vào được ngay",
    };
  } catch (e) {
    return baoLoi(e, "Máy chủ đang bận — thử lại sau vài giây");
  }
}

/** Xoá phiên chưa ai chơi (tạo nhầm). */
export async function xoaPhienDauTri(id: string): Promise<KetQuaDauTruong> {
  const user = await nguoiVanHanh();
  if (!user) return { error: KHONG_QUYEN_VAN_HANH };
  const phienId = chuoi(id, 60);
  if (!phienId) return { error: "Thiếu thông tin phiên" };
  try {
    const { ten } = await xoaDauTri(phienId);
    await ghiNhatKy(user.id, "nn.dauTri:xoa", { moTa: ten, phienId });
    lamMoiGame();
    return { ok: true, message: `Đã xoá phiên “${ten}”` };
  } catch (e) {
    return baoLoi(e, "Máy chủ đang bận, chưa xoá được — thử lại");
  }
}

// ─── Đấu trường 1-1 ───────────────────────────────────────────────────

/**
 * Ban huỷ một trận treo — hai người thách nhau trận mới được ngay.
 * Nhật ký ghi rõ TÊN hai bên và đánh dấu khi người huỷ chính là một trong hai
 * người đang đấu: trận chưa xong chưa ghi thắng thua, nên huỷ trận của mình là
 * cách né một trận sắp thua — phải soi được ở Tổng quan.
 */
export async function huyTranDauBan(id: string): Promise<KetQuaDauTruong> {
  const user = await nguoiVanHanh();
  if (!user) return { error: KHONG_QUYEN_VAN_HANH };
  const tranId = chuoi(id, 60);
  if (!tranId) return { error: "Thiếu thông tin trận" };
  try {
    const truoc = await prisma.nnTranDau.findUnique({
      where: { id: tranId },
      select: { thachId: true, doiThuId: true },
    });
    const ok = await huyTranDau(tranId);
    if (!ok)
      return {
        error: "Trận này đã xong hoặc đã huỷ rồi — tải lại trang để xem.",
      };
    const ten = truoc
      ? await tenNguoiChoi([truoc.thachId, truoc.doiThuId])
      : null;
    const cuaNguoiHuy =
      !!truoc && (truoc.thachId === user.id || truoc.doiThuId === user.id);
    await ghiNhatKy(user.id, "nn.dauTruong:huyTran", {
      moTa: truoc
        ? `${ten?.get(truoc.thachId)?.ten ?? "Hội viên"} – ${
            ten?.get(truoc.doiThuId)?.ten ?? "Hội viên"
          }${cuaNguoiHuy ? " (TRẬN CỦA CHÍNH NGƯỜI HUỶ)" : ""}`
        : "huỷ trận chưa xong",
      tranId,
      thachId: truoc?.thachId,
      doiThuId: truoc?.doiThuId,
      cuaNguoiHuy,
    });
    lamMoiGame();
    return { ok: true, message: "Đã huỷ trận" };
  } catch (e) {
    return baoLoi(e, "Máy chủ đang bận, chưa huỷ được — thử lại");
  }
}

// ─── Nhiệm vụ Huynh đệ ────────────────────────────────────────────────

/**
 * Ban xác nhận / từ chối một yêu cầu nhiệm vụ: yêu cầu Ban duyệt, hoặc xử lý
 * HỘ yêu cầu hội viên liên quan để quá lâu không bấm.
 */
export async function xuLyNhiemVuBan(
  id: string,
  dongY: boolean,
  lyDo: string,
): Promise<KetQuaDauTruong> {
  const user = await nguoiVanHanh();
  if (!user) return { error: KHONG_QUYEN_VAN_HANH };
  const nvId = chuoi(id, 60);
  const ghiChu = chuoi(lyDo, 500);
  if (!nvId) return { error: "Thiếu thông tin yêu cầu" };
  if (dongY !== true && !ghiChu)
    return { error: "Ghi lý do để hội viên biết vì sao chưa được xác nhận" };
  try {
    const truoc = await prisma.nnNhiemVu.findUnique({
      where: { id: nvId },
      select: { maNv: true, cach: true, userId: true },
    });
    const kq = await xuLyNhiemVu(
      { userId: user.id, memberId: user.memberId, laBan: true },
      nvId,
      dongY === true,
      ghiChu || undefined,
    );
    await ghiNhatKy(
      user.id,
      kq.trangThai === "DA_XAC_NHAN"
        ? "nn.nhiemVu:xacNhan"
        : "nn.nhiemVu:tuChoi",
      {
        moTa: `${truoc?.maNv ?? ""}${truoc?.cach === "HOI_VIEN" ? " (xử lý hộ hội viên)" : ""}${
          kq.trangThai === "TU_CHOI" && ghiChu ? ` · ${ghiChu}` : ""
        }`,
        nvId,
        userId: truoc?.userId,
      },
    );
    lamMoiGame();
    return {
      ok: true,
      message:
        kq.trangThai === "DA_XAC_NHAN"
          ? `Đã xác nhận, hội viên được cộng điểm${kq.huyHieuMoi.length ? ` + huy hiệu ${kq.huyHieuMoi.map((h) => h.ten).join(", ")}` : ""}`
          : dongY === true
            ? "Không xác nhận được: hội viên đã đủ số lần trong kỳ — yêu cầu chuyển sang không được xác nhận"
            : "Đã từ chối",
    };
  } catch (e) {
    return baoLoi(e, "Máy chủ đang bận, chưa xử lý được — thử lại");
  }
}

// ─── Kho bộ câu ───────────────────────────────────────────────────────

export type CauTrongBo = {
  so: number;
  hoi: string;
  phuongAn: string[];
  dung: number;
  giai: string;
};

/**
 * Câu hỏi (kèm đáp án) của một bộ để Ban soát và ẩn câu hỏng. Tải khi mở bộ
 * để trang quản trị không phải dựng sẵn cả nghìn câu.
 */
export async function xemCauTrongBo(
  ma: string,
): Promise<KetQuaDauTruong & { cau?: CauTrongBo[] }> {
  const user = await nguoiCaiDat();
  if (!user) return { error: KHONG_QUYEN_CAI_DAT };
  const bo = BO_THEO_MA[chuoi(ma, 100)];
  if (!bo) return { error: "Không tìm thấy bộ câu" };
  return {
    ok: true,
    cau: bo.cau.map((c) => ({
      so: c.so,
      hoi: c.hoi,
      phuongAn: c.phuongAn,
      dung: c.dung,
      giai: c.giai,
    })),
  };
}
