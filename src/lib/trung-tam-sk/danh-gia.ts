import { prisma } from "@/lib/prisma";

/**
 * Tổng hợp đánh giá khách: điểm hài lòng trung bình (1–5) và NPS
 * = %người chấm 9–10 trừ %người chấm 0–6 (chỉ tính phiếu có chấm NPS).
 */
export function tinhDanhGia(ds: { haiLong: number; nps: number | null }[]) {
  const phanBo = [1, 2, 3, 4, 5].map((s) => ds.filter((d) => d.haiLong === s).length);
  const coNps = ds.filter((d) => d.nps !== null) as { nps: number }[];
  const ung = coNps.filter((d) => d.nps >= 9).length;
  const che = coNps.filter((d) => d.nps <= 6).length;
  return {
    so: ds.length,
    tbHaiLong: ds.length ? ds.reduce((a, d) => a + d.haiLong, 0) / ds.length : null,
    phanBo,
    soNps: coNps.length,
    nps: coNps.length ? Math.round(((ung - che) / coNps.length) * 100) : null,
    ungHo: ung,
    cheBai: che,
  };
}

export type TongHopDanhGia = ReturnType<typeof tinhDanhGia>;

export async function tongHopDanhGia(skId: string) {
  return tinhDanhGia(await prisma.skDanhGia.findMany({ where: { skId }, select: { haiLong: true, nps: true } }));
}
