import { prisma } from "@/lib/prisma";

/**
 * ĐIỂM HOẠT ĐỘNG TỰ ĐỘNG khi check-in bằng mã QR (Chủ tịch đặt hàng
 * 01/10/2026): hội viên có mặt ở sự kiện thì sổ điểm /bang-hoat-dong tự có
 * một dòng "Tham gia hoạt động", thư ký không phải cộng tay từng người.
 *
 * Mỗi dòng tự động mang một KHOÁ NGUỒN (`DiemHoatDong.nguon`) và mỗi khoá
 * chỉ được có MỘT dòng — `datDiemTuDong` gọi bao nhiêu lần cũng ra đúng
 * một dòng (hai người bấm cùng lúc thì dòng sinh sau bị xoá). Cột `nguon`
 * không đặt unique ở CSDL, xem lý do trong schema.prisma.
 *
 * Quy tắc điểm do Ban Điều hành chỉnh ở /bang-hoat-dong (lưu SiteSetting
 * khoá `diem.tuDong`); chưa lưu gì thì dùng QUY_TAC_MAC_DINH.
 */

export const KHOA_QUY_TAC = "diem.tuDong";

export type QuyTacDiem = {
  /** Bật cộng điểm tự động khi check-in */
  bat: boolean;
  /** Điểm cho MỖI PHIÊN có mặt ở Lễ chuyển giao 10/10 (Tọa đàm / Lễ / Gala) */
  phien1010: number;
  /** Điểm mỗi lần Ban Tổ chức quét thẻ hội viên ở sự kiện thường (Mini App) */
  suKien: number;
  /**
   * Diễn tập: tính điểm cả những lượt check-in ghi TRƯỚC ngày sự kiện, để
   * BTC thử trọn luồng. Tắt đi là điểm của các lượt thử tự biến mất.
   */
  dienTap: boolean;
};

/**
 * Mặc định 5 điểm mỗi phiên: dự đủ ba phiên 10/10 = 15 điểm, bằng đúng
 * "5 điểm tham gia × hệ số 3" Chủ tịch nêu cho sự kiện 300 khách (24/09).
 */
export const QUY_TAC_MAC_DINH: QuyTacDiem = {
  bat: true,
  phien1010: 5,
  suKien: 5,
  dienTap: false,
};

/** Trần một lần cộng tự động — gõ nhầm 500 cũng không phá bảng xếp hạng */
export const TRAN_DIEM_TU_DONG = 100;

function soDiem(v: unknown, macDinh: number): number {
  const n = Math.round(Number(v));
  if (v === null || v === undefined || v === "" || !Number.isFinite(n)) {
    return macDinh;
  }
  return Math.max(0, Math.min(TRAN_DIEM_TU_DONG, n));
}

/** Đưa giá trị lưu (hoặc form gửi lên) về đúng khuôn — hàm thuần. */
export function chuanQuyTac(tho: unknown): QuyTacDiem {
  const o = (tho && typeof tho === "object" ? tho : {}) as Record<string, unknown>;
  return {
    bat: typeof o.bat === "boolean" ? o.bat : QUY_TAC_MAC_DINH.bat,
    phien1010: soDiem(o.phien1010, QUY_TAC_MAC_DINH.phien1010),
    suKien: soDiem(o.suKien, QUY_TAC_MAC_DINH.suKien),
    dienTap: typeof o.dienTap === "boolean" ? o.dienTap : QUY_TAC_MAC_DINH.dienTap,
  };
}

export async function docQuyTacDiem(): Promise<QuyTacDiem> {
  const r = await prisma.siteSetting.findUnique({ where: { key: KHOA_QUY_TAC } });
  if (!r?.value) return { ...QUY_TAC_MAC_DINH };
  try {
    return chuanQuyTac(JSON.parse(r.value));
  } catch {
    return { ...QUY_TAC_MAC_DINH };
  }
}

export async function ghiQuyTacDiem(q: QuyTacDiem): Promise<void> {
  const value = JSON.stringify(chuanQuyTac(q));
  await prisma.siteSetting.upsert({
    where: { key: KHOA_QUY_TAC },
    create: { key: KHOA_QUY_TAC, value },
    update: { value },
  });
}

/** Người đứng tên xác nhận trên dòng sổ ("✓ xác nhận: …") */
export type NguoiGhiDiem = { id: string; ten: string };

/**
 * Bảo đảm khoá `nguon` có ĐÚNG MỘT dòng sổ với đúng hội viên + đúng mức
 * điểm hiện hành. `diem <= 0` nghĩa là không được điểm → gỡ dòng nếu có.
 * Trả `taoMoi = true` khi lần gọi này vừa sinh dòng (để báo "+5 điểm").
 */
export async function datDiemTuDong(d: {
  nguon: string;
  memberId: string;
  diem: number;
  lyDo: string;
  loai?: string;
  nguoi: NguoiGhiDiem;
}): Promise<{ taoMoi: boolean; diem: number }> {
  if (!(d.diem > 0)) {
    await goDiemTuDong(d.nguon);
    return { taoMoi: false, diem: 0 };
  }
  const tim = () =>
    prisma.diemHoatDong.findMany({
      where: { nguon: d.nguon },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, memberId: true, diem: true },
    });

  let ds = await tim();
  let idVuaTao: string | null = null;
  if (ds.length === 0) {
    const moi = await prisma.diemHoatDong.create({
      data: {
        memberId: d.memberId,
        diem: d.diem,
        loai: d.loai ?? "THAM_GIA",
        lyDo: d.lyDo.slice(0, 300),
        nguoiCongId: d.nguoi.id,
        nguoiCongTen: d.nguoi.ten.slice(0, 120),
        nguon: d.nguon,
      },
      select: { id: true },
    });
    idVuaTao = moi.id;
    // Đọc lại: hai yêu cầu cùng lúc đều thấy "chưa có" rồi cùng tạo — cả hai
    // sẽ cùng giữ dòng xếp đầu và xoá dòng còn lại, kết cục vẫn một dòng.
    ds = await tim();
  }
  const [giu, ...thua] = ds;
  if (thua.length > 0) {
    await prisma.diemHoatDong.deleteMany({
      where: { id: { in: thua.map((x) => x.id) } },
    });
  }
  if (giu.memberId !== d.memberId || giu.diem !== d.diem) {
    await prisma.diemHoatDong.update({
      where: { id: giu.id },
      data: { memberId: d.memberId, diem: d.diem },
    });
  }
  return { taoMoi: idVuaTao !== null && giu.id === idVuaTao, diem: d.diem };
}

/** Gỡ dòng điểm tự động của một khoá nguồn; trả số điểm đã gỡ. */
export async function goDiemTuDong(nguon: string): Promise<number> {
  const ds = await prisma.diemHoatDong.findMany({
    where: { nguon },
    select: { id: true, diem: true },
  });
  if (ds.length === 0) return 0;
  await prisma.diemHoatDong.deleteMany({
    where: { id: { in: ds.map((x) => x.id) } },
  });
  // Bản trùng (nếu có) không được tính là điểm thật — chỉ một dòng có nghĩa
  return ds[0].diem;
}
