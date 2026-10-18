import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { HuyHieuMoi } from "./kieu";
import { HUY_HIEU_THEO_MA, MA_VON, vonRong, type Von } from "./luat";
import { LUAT_MAC_DINH, type LuatChoi } from "./cai-dat/luat-choi";

/** Chạy được cả trong `prisma.$transaction(async (tx) => …)` lẫn ngoài. */
export type Tx = Prisma.TransactionClient | typeof prisma;

/**
 * Tuỳ chọn cho các giao dịch nhiều bước của game. SQLite chỉ một người ghi tại
 * một thời điểm và ổ đĩa máy chủ có lúc chậm — để mặc định 5 giây của Prisma là
 * giao dịch bị cắt ngang giữa chừng, lượt chơi treo ở trạng thái dở.
 */
export const GIAO_DICH = { maxWait: 10_000, timeout: 30_000 } as const;

/** Lỗi nghiệp vụ hiện nguyên văn cho người chơi (lỗi khác chỉ báo chung chung). */
export class LoiGame extends Error {
  ma: string;
  constructor(message: string, ma = "LOI") {
    super(message);
    this.ma = ma;
  }
}

/** Ghi một dòng sổ cái (kể cả mùa chơi thử). Không có gì thay đổi thì bỏ qua. */
export async function ghiSoCai(
  tx: Tx,
  d: {
    userId: string;
    muaId: string;
    loai: string;
    nguon: string;
    diem?: number;
    von?: Partial<Von>;
    ghiChu?: string;
  },
) {
  const v = { ...vonRong(), ...d.von };
  if (!d.diem && MA_VON.every((k) => !v[k])) return;
  await tx.nnSoCai.create({
    data: {
      userId: d.userId,
      muaId: d.muaId,
      loai: d.loai,
      nguon: d.nguon,
      diem: d.diem ?? 0,
      vonCN: v.CN,
      vonTT: v.TT,
      vonXH: v.XH,
      vonTS: v.TS,
      ghiChu: d.ghiChu,
    },
  });
}

export async function tongSoCai(
  tx: Tx,
  userId: string,
  muaId: string,
): Promise<{ diem: number; von: Von }> {
  const s = await tx.nnSoCai.aggregate({
    where: { userId, muaId },
    _sum: { diem: true, vonCN: true, vonTT: true, vonXH: true, vonTS: true },
  });
  return {
    diem: s._sum.diem ?? 0,
    von: {
      CN: s._sum.vonCN ?? 0,
      TT: s._sum.vonTT ?? 0,
      XH: s._sum.vonXH ?? 0,
      TS: s._sum.vonTS ?? 0,
    },
  };
}

/**
 * Trao các huy hiệu chưa có, cộng điểm thưởng vào sổ cái. Trả về huy hiệu mới.
 *
 * `luat` = luật Ban Điều hành đang dùng (đọc TRƯỚC giao dịch rồi truyền vào):
 * huy hiệu đang tắt thì không trao, điểm lấy theo luật. Không truyền thì dùng
 * luật gốc trong code.
 */
export async function traoHuyHieu(
  tx: Tx,
  userId: string,
  muaId: string,
  danhSach: string[],
  luat: LuatChoi = LUAT_MAC_DINH,
): Promise<HuyHieuMoi[]> {
  const xet = [...new Set(danhSach)].filter(
    (m) => HUY_HIEU_THEO_MA[m] && luat.huyHieu[m]?.bat !== false,
  );
  if (!xet.length) return [];
  const daCo = new Set(
    (
      await tx.nnHuyHieu.findMany({
        where: { userId, muaId, ma: { in: xet } },
        select: { ma: true },
      })
    ).map((h) => h.ma),
  );
  const moi: HuyHieuMoi[] = [];
  for (const ma of xet) {
    if (daCo.has(ma)) continue;
    const h = HUY_HIEU_THEO_MA[ma];
    const diem = luat.huyHieu[ma]?.diem ?? h.diem;
    await tx.nnHuyHieu.create({ data: { userId, muaId, ma } });
    await ghiSoCai(tx, {
      userId,
      muaId,
      loai: "HUY_HIEU",
      nguon: `hh:${ma}`,
      diem,
      ghiChu: h.ten,
    });
    moi.push({ ma, ten: h.ten, diem });
  }
  return moi;
}

/**
 * Xét huy hiệu Doanh nhân cân bằng — gọi sau mỗi lần vốn thay đổi. Ngưỡng theo
 * `luat.von.nguongCanBang` (không truyền thì luật gốc).
 */
export async function xetCanBang(
  tx: Tx,
  userId: string,
  muaId: string,
  luat: LuatChoi = LUAT_MAC_DINH,
): Promise<HuyHieuMoi[]> {
  const { von } = await tongSoCai(tx, userId, muaId);
  if (!MA_VON.every((k) => von[k] >= luat.von.nguongCanBang)) return [];
  return traoHuyHieu(tx, userId, muaId, ["CAN_BANG"], luat);
}

export function docJson<T>(s: string | null | undefined, macDinh: T): T {
  if (!s) return macDinh;
  try {
    return JSON.parse(s) as T;
  } catch {
    return macDinh;
  }
}
