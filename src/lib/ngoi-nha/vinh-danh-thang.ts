/**
 * Vinh danh theo tháng — CHỈ MÁY CHỦ.
 *
 * Nhịp thưởng anh Khang chốt 20/09/2026: mỗi tháng của mùa giải, top 10 theo
 * điểm **trong tháng đó** (KHÔNG cộng dồn cả mùa) được gọi tên ở buổi sinh hoạt
 * — hạng 1–3 kèm quà nhỏ. Điểm cộng dồn vẫn giữ nguyên cho giải cuối mùa.
 *
 * Vì sao tính riêng từng tháng: điểm cộng dồn thì sau vài tuần bảng đã "chốt
 * sổ", hội viên biết game muộn hết cửa và bỏ cuộc.
 *
 * Ghi "đã vinh danh" dùng lại bảng `NnTraoQua` với `loai = VD_<yyyymm>` (khoá
 * duy nhất theo userId + muaId + loai nên mỗi người mỗi tháng đúng một lần) —
 * không cần thêm bảng mới.
 */
import { prisma } from "@/lib/prisma";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { dauThang } from "./thoi-gian";

/** Mã tháng "yyyy-mm" theo giờ Việt Nam. */
export function maThangVN(d: Date = new Date()): string {
  return new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 7);
}

export const laMaThang = (x: unknown): x is string =>
  typeof x === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(x);

/** Mốc đầu tháng (giờ VN) của mã tháng "yyyy-mm". */
export function mocThang(maThang: string): Date {
  return new Date(`${maThang}-01T00:00:00.000+07:00`);
}

/** Mã ghi vào NnTraoQua.loai, vd "VD_202610". */
export const maVinhDanhThang = (maThang: string) =>
  `VD_${maThang.replace("-", "")}`;

/**
 * Anh Khang chốt 20/09/2026: một người chỉ NHẬN QUÀ tháng tối đa 2 lần mỗi mùa
 * — lần thứ ba vẫn được vinh danh (gọi tên) nhưng suất quà nhường người kế
 * tiếp, để quà trải đều trong Chi hội.
 */
export const QUA_THANG_TOI_DA_MOI_MUA = 2;
/** Số người đầu bảng được kèm quà mỗi tháng. */
export const SO_NGUOI_CO_QUA = 3;
/** Ghi chú đánh dấu lần vinh danh CÓ kèm quà (để đếm cho đúng trần). */
export const DAU_CO_QUA = "có quà";

/** Tên tháng cho người đọc, vd "tháng 10/2026". */
export function tenThang(maThang: string): string {
  const [nam, thang] = maThang.split("-");
  return `tháng ${Number(thang)}/${nam}`;
}

/**
 * Các tháng nằm trong khoảng ngày của mùa (cũ → mới). Mùa 3 tháng cho ra 3 mã.
 * Không có mùa thật thì trả tháng hiện tại để quản trị vẫn xem được.
 */
export function thangCuaMua(mua: {
  batDau?: Date | null;
  ketThuc?: Date | null;
}): string[] {
  if (!mua.batDau || !mua.ketThuc) return [maThangVN()];
  const ds: string[] = [];
  let m = maThangVN(mua.batDau);
  const cuoi = maThangVN(mua.ketThuc);
  // Mùa dài nhất theo form quản trị cũng chỉ vài tháng — chặn 36 cho chắc
  for (let i = 0; i < 36 && m <= cuoi; i++) {
    ds.push(m);
    const [nam, thang] = m.split("-").map(Number);
    m =
      thang === 12
        ? `${nam + 1}-01`
        : `${nam}-${String(thang + 1).padStart(2, "0")}`;
  }
  return ds.length ? ds : [maThangVN()];
}

export type DongThang = {
  userId: string;
  hang: number;
  ten: string;
  congTy: string | null;
  dienThoai: string | null;
  diem: number;
  daVinhDanh: boolean;
  /** Số lần đã NHẬN QUÀ tháng trong mùa này (kể cả tháng đang xem) */
  soLanNhanQua: number;
  /** Tháng này được kèm quà không (top 3 và chưa chạm trần) */
  nhanQua: boolean;
  /** Đầu bảng nhưng đã đủ 2 lần → nhường suất quà, vẫn vinh danh */
  nhuongQua: boolean;
};

/**
 * Top người có điểm cao nhất TRONG tháng của một mùa. Bỏ người đang ẩn khỏi
 * bảng xếp hạng (Ban soạn đề / vận hành) như bảng xếp hạng chính; bằng điểm thì
 * người chạm mốc sớm hơn xếp trên.
 */
export async function topThang(
  muaId: string,
  maThang: string,
  gioiHan = 10,
): Promise<DongThang[]> {
  const tu = mocThang(maThang);
  const den = dauThang(new Date(tu.getTime() + 40 * 86400e3));
  const [nhom, an, daTrao, quaMua] = await Promise.all([
    prisma.nnSoCai.groupBy({
      by: ["userId"],
      where: { muaId, createdAt: { gte: tu, lt: den } },
      _sum: { diem: true },
      _max: { createdAt: true },
    }),
    prisma.nnNguoiChoi.findMany({
      where: { anXepHang: true },
      select: { userId: true },
    }),
    prisma.nnTraoQua.findMany({
      where: { muaId, loai: maVinhDanhThang(maThang) },
      select: { userId: true },
    }),
    // Mọi lần vinh danh CÓ QUÀ trong mùa — để chặn trần 2 lần mỗi người
    prisma.nnTraoQua.findMany({
      where: { muaId, loai: { startsWith: "VD_" } },
      select: { userId: true, loai: true, ghiChu: true },
    }),
  ]);
  const biAn = new Set(an.map((x) => x.userId));
  const roi = new Set(daTrao.map((x) => x.userId));
  const demQua = new Map<string, number>();
  for (const t of quaMua)
    if (t.loai.startsWith("VD_") && t.ghiChu?.includes(DAU_CO_QUA))
      demQua.set(t.userId, (demQua.get(t.userId) ?? 0) + 1);
  const xep = nhom
    .map((x) => ({
      userId: x.userId,
      diem: x._sum.diem ?? 0,
      luc: x._max.createdAt?.getTime() ?? 0,
    }))
    .filter((x) => x.diem > 0 && !biAn.has(x.userId))
    .sort((a, b) => b.diem - a.diem || a.luc - b.luc)
    .slice(0, gioiHan);
  if (!xep.length) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: xep.map((x) => x.userId) } },
    select: {
      id: true,
      name: true,
      member: { select: { name: true, company: true, phone: true } },
    },
  });
  const theoId = new Map(users.map((u) => [u.id, u]));
  // Chia suất quà từ trên xuống: ai chạm trần thì nhường cho người kế tiếp
  let conSuat = SO_NGUOI_CO_QUA;
  return xep.map((x, i) => {
    const u = theoId.get(x.userId);
    const soLanNhanQua = demQua.get(x.userId) ?? 0;
    const daDuLan = soLanNhanQua >= QUA_THANG_TOI_DA_MOI_MUA;
    const nhanQua = conSuat > 0 && !daDuLan;
    if (nhanQua) conSuat--;
    return {
      userId: x.userId,
      hang: i + 1,
      ten: u?.member?.name ?? u?.name ?? "Hội viên",
      congTy: u?.member?.company ? tenDoanhNghiep(u.member.company) : null,
      dienThoai: u?.member?.phone ?? null,
      diem: x.diem,
      daVinhDanh: roi.has(x.userId),
      soLanNhanQua,
      nhanQua,
      nhuongQua: daDuLan && i < SO_NGUOI_CO_QUA,
    };
  });
}

/** Các tháng người này đã được vinh danh trong mùa (cũ → mới). */
export async function vinhDanhCuaToi(
  userId: string,
  muaId: string,
): Promise<{ maThang: string; ten: string; luc: Date; coQua: boolean }[]> {
  const ds = await prisma.nnTraoQua.findMany({
    where: { userId, muaId, loai: { startsWith: "VD_" } },
    select: { loai: true, createdAt: true, ghiChu: true },
  });
  return ds
    .map((x) => {
      const so = x.loai.slice(3);
      const maThang = `${so.slice(0, 4)}-${so.slice(4, 6)}`;
      return {
        maThang,
        ten: tenThang(maThang),
        luc: x.createdAt,
        coQua: !!x.ghiChu?.includes(DAU_CO_QUA),
      };
    })
    .filter((x) => laMaThang(x.maThang))
    .sort((a, b) => a.maThang.localeCompare(b.maThang));
}
