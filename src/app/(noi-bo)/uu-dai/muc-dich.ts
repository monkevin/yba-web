/** Ba mục đích phiên đấu giá (Chủ tịch chốt 25/09/2026) — file thuần để
 *  cả server action, trang công khai lẫn client component import. */
export const MUC_DICH_DAU_GIA: Record<string, string> = {
  THIEN_NGUYEN: "Thiện nguyện (ghi rõ dự án)",
  QUY_CHI_HOI: "Gây quỹ Chi hội",
  CA_NHAN: "Cá nhân — trích lại % cho Chi hội",
};

/** Nhãn + màu badge mục đích trên thẻ phiên đấu giá. */
export function nhanMucDich(d: {
  mucDich: string | null;
  mucDichGhiChu: string | null;
  trichPhanTram: number | null;
}): { nhan: string; lop: string } {
  if (d.mucDich === "QUY_CHI_HOI")
    return { nhan: "🏛️ Gây quỹ Chi hội", lop: "bg-navy-100 text-navy-700" };
  if (d.mucDich === "CA_NHAN")
    return {
      nhan: `👤 Cá nhân — trích ${d.trichPhanTram ?? 0}% cho Chi hội`,
      lop: "bg-amber-100 text-amber-800",
    };
  return {
    nhan: `❤️ Thiện nguyện${d.mucDichGhiChu ? ` · ${d.mucDichGhiChu}` : ""}`,
    lop: "bg-do-50 text-do-700",
  };
}
