"use server";

import { prisma } from "@/lib/prisma";
import {
  batDauDauTri,
  batDauThuThachNgay,
  batDauTram,
  chonTheCoHoi,
  dungTroGiup,
  ketThucLuot,
  moCau,
  rutTheCoHoi,
  traLoi,
} from "@/lib/ngoi-nha/dong-co";
import { docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import { chay } from "@/lib/ngoi-nha/chay-action";
import type { DapAnGui } from "@/lib/ngoi-nha/kieu";
import type { TroGiup } from "@/lib/ngoi-nha/luat";
import {
  dongBoTuDong,
  guiLoiChuc,
  guiNhiemVu,
  xuLyNhiemVu,
} from "@/lib/ngoi-nha/nhiem-vu";
import { LoiGame } from "@/lib/ngoi-nha/so-cai";
import {
  cauTranDau,
  nopTranDau,
  taoTranDau,
  timDoiThu,
} from "@/lib/ngoi-nha/dau-truong";
import { bangDauTri, timTheoMa } from "@/lib/ngoi-nha/dau-tri";

/**
 * Server action của game. Mỗi hàm tự lấy người chơi từ phiên đăng nhập —
 * không bao giờ nhận userId từ trình duyệt. Mọi kiểm tra luật chơi nằm trong
 * `src/lib/ngoi-nha/`; `chay()` dùng chung (chay-action.ts) bọc lỗi thành thông
 * báo dễ hiểu và chặn khi Ban Điều hành tạm dừng game.
 *
 * Tính năng bị Ban tắt được chặn ở hàm thư viện (thử thách ngày, Thẻ Cơ hội,
 * trợ giúp, Đấu trí…). Riêng việc MỚI ở Đấu trường / Nhiệm vụ chặn thêm ở đây
 * cho chắc; trận / yêu cầu đang dở vẫn làm nốt.
 */
async function canBat(ten: "dauTruong" | "nhiemVu", loi: string) {
  if (!(await docTinhNang())[ten]) throw new LoiGame(loi, "TAT");
}

export async function aBatDauTram(tramMa: string, tiepTuc: boolean) {
  return chay((n) => batDauTram(n, String(tramMa), tiepTuc === true));
}

export async function aBatDauThuThach() {
  return chay((n) => batDauThuThachNgay(n));
}

export async function aMoCau(luotId: string) {
  return chay((n) => moCau(n, String(luotId)));
}

export async function aTraLoi(luotId: string, viTri: number, dapAn: DapAnGui) {
  return chay((n) => traLoi(n, String(luotId), Number(viTri), dapAn));
}

export async function aTroGiup(luotId: string, viTri: number, loai: TroGiup) {
  return chay((n) => dungTroGiup(n, String(luotId), Number(viTri), loai));
}

export async function aKetThucLuot(luotId: string) {
  return chay((n) => ketThucLuot(n, String(luotId)));
}

export async function aRutThe(luotId: string) {
  return chay((n) => rutTheCoHoi(n, String(luotId)));
}

export async function aChonThe(luotId: string, lua: number) {
  return chay((n) => chonTheCoHoi(n, String(luotId), Number(lua)));
}

export async function aDaXemHuongDan() {
  return chay(async (n) => {
    await prisma.nnNguoiChoi.upsert({
      where: { userId: n.userId },
      create: { userId: n.userId, daXemHuongDan: true },
      update: { daXemHuongDan: true },
    });
    return true;
  });
}

export async function aGuiNhiemVu(d: {
  maNv: string;
  moTa: string;
  anh?: string | null;
  lienQuanMemberId?: string | null;
}) {
  return chay(async (n) => {
    await canBat(
      "nhiemVu",
      "Nhiệm vụ Huynh đệ đang tạm nghỉ — chưa gửi được nhiệm vụ mới.",
    );
    await guiNhiemVu(n, {
      maNv: String(d.maNv),
      moTa: String(d.moTa ?? ""),
      anh: d.anh ? String(d.anh) : null,
      lienQuanMemberId: d.lienQuanMemberId ? String(d.lienQuanMemberId) : null,
    });
    return true;
  });
}

/** Hội viên được nêu tên xác nhận / từ chối yêu cầu của huynh đệ. */
export async function aXacNhanGiup(
  nvId: string,
  dongY: boolean,
  lyDo?: string,
) {
  return chay((n) =>
    xuLyNhiemVu(
      { userId: n.userId, memberId: n.memberId, laBan: false },
      String(nvId),
      dongY === true,
      lyDo,
    ),
  );
}

export async function aGuiLoiChuc(nhanId: string, noiDung: string) {
  return chay((n) => guiLoiChuc(n, String(nhanId), String(noiDung ?? "")));
}

export async function aDongBoNhiemVu() {
  // Tắt Nhiệm vụ thì không tự ghi nhận thêm (trả rỗng, không báo lỗi)
  return chay(async (n) =>
    (await docTinhNang()).nhiemVu ? dongBoTuDong(n) : [],
  );
}

// ─── Đấu trường 1-1 ───────────────────────────────────────────────────

export async function aTimDoiThu(q: string) {
  return chay((n) => timDoiThu(n, String(q ?? "")));
}

export async function aTaoTranDau(doiThuId: string, chonBo?: string) {
  return chay(async (n) => {
    await canBat(
      "dauTruong",
      "Đấu trường đang tạm nghỉ — chưa tạo được trận mới.",
    );
    return taoTranDau(n, String(doiThuId), String(chonBo ?? ""));
  });
}

export async function aCauTranDau(tranId: string) {
  return chay((n) => cauTranDau(n, String(tranId)));
}

export async function aNopTranDau(tranId: string, dapAn: number[], ms: number) {
  return chay((n) =>
    nopTranDau(
      n,
      String(tranId),
      Array.isArray(dapAn) ? dapAn.map((x) => Number(x)) : [],
      Number(ms) || 0,
    ),
  );
}

// ─── Đấu trí sự kiện ──────────────────────────────────────────────────

export async function aBatDauDauTri(dauTriId: string) {
  return chay((n) => batDauDauTri(n, String(dauTriId)));
}

export async function aBangDauTri(dauTriId: string) {
  return chay((n) => bangDauTri(String(dauTriId), n.userId));
}

export async function aTimDauTri(ma: string) {
  return chay(async () => {
    const p = await timTheoMa(String(ma ?? ""));
    return p ? { id: p.id, ten: p.ten, trangThai: p.trangThai } : null;
  });
}
