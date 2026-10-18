/**
 * Nhật ký thao tác quản trị game — CHỈ MÁY CHỦ. Dùng lại bảng `ActivityLog`
 * (dealId để trống) nên không cần đổi cấu trúc CSDL. Mã hành động bắt đầu bằng
 * "nn." để lọc riêng.
 */
import { prisma } from "@/lib/prisma";

const DAI_CHI_TIET = 4000;

/** Cắt chuỗi giữ nguyên số ký tự đọc được, thêm dấu … khi bị cắt. */
const catChu = (x: unknown, dai: number) =>
  typeof x === "string" && x
    ? x.length > dai
      ? `${x.slice(0, dai)}…`
      : x
    : undefined;

/**
 * JSON của chi tiết, bảo đảm KHÔNG vượt giới hạn cột. Cắt thẳng chuỗi JSON là
 * ra JSON hỏng → `docNhatKy` parse không được và mất sạch chi tiết dòng đó,
 * nên quá dài thì dựng lại một đối tượng hợp lệ chỉ còn hai trường màn Nhật ký
 * thật sự hiện (`muc`, `moTa`).
 */
function chiTietJson(chiTiet: Record<string, unknown>): string {
  const day = JSON.stringify(chiTiet);
  if (day.length <= DAI_CHI_TIET) return day;
  const gon = JSON.stringify({
    muc: catChu(chiTiet.muc, 200),
    moTa: catChu(chiTiet.moTa, 1000),
    catBot: true,
  });
  // Chữ có dấu / ký tự lạ nở ra khi JSON thoát — vẫn dài thì bỏ luôn chi tiết
  return gon.length <= DAI_CHI_TIET ? gon : '{"catBot":true}';
}

export async function ghiNhatKy(
  userId: string | null,
  hanhDong: `nn.${string}`,
  chiTiet: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action: hanhDong.slice(0, 120),
        detail: chiTietJson(chiTiet),
      },
    });
  } catch (e) {
    // Nhật ký hỏng không được làm hỏng thao tác chính
    console.error("[ngoi-nha] ghi nhật ký", e);
  }
}

export type DongNhatKy = {
  id: string;
  luc: Date;
  nguoi: string;
  hanhDong: string;
  chiTiet: Record<string, unknown>;
};

export async function docNhatKy(gioiHan = 30): Promise<DongNhatKy[]> {
  const rows = await prisma.activityLog.findMany({
    where: { dealId: null, action: { startsWith: "nn." } },
    orderBy: { createdAt: "desc" },
    take: gioiHan,
    select: {
      id: true,
      action: true,
      detail: true,
      createdAt: true,
      user: {
        select: { name: true, member: { select: { name: true } } },
      },
    },
  });
  return rows.map((r) => {
    let chiTiet: Record<string, unknown> = {};
    try {
      chiTiet = r.detail ? JSON.parse(r.detail) : {};
    } catch {
      chiTiet = {};
    }
    return {
      id: r.id,
      luc: r.createdAt,
      nguoi: r.user?.member?.name ?? r.user?.name ?? "Hệ thống",
      hanhDong: r.action,
      chiTiet,
    };
  });
}
