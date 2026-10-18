/**
 * Thứ tự ưu tiên hiển thị hội viên trên web.
 *
 * Nguyên tắc Ban Chủ nhiệm đặt ra:
 *  1. Chủ nhiệm và các Phó Chủ nhiệm luôn đứng đầu.
 *  2. Hội viên đã đóng hội phí được ưu tiên hơn người chưa đóng.
 *  3. Doanh nghiệp quy mô lớn được ưu tiên đưa lên trên.
 *
 * LƯU Ý: chưa đóng phí KHÔNG phải là rời hội. Hồ sơ và doanh nghiệp của họ vẫn
 * giữ nguyên, vẫn hiển thị bình thường — chỉ xếp sau người đã đóng. Cờ
 * `trangThai = ROI_HOI` chỉ dùng khi Ban Chủ nhiệm đánh dấu TAY cho người thật
 * sự đã rời khỏi Chi hội; không có quy trình nào tự động gán nó.
 *
 * File chỉ chứa hằng và hàm thuần nên client component dùng được.
 */

export const CAP_BAC = {
  CHU_NHIEM: 0,
  PHO_CHU_NHIEM: 1,
  BAN_CHAP_HANH: 2,
  SANG_LAP: 3,
  HOI_VIEN_VANG: 4,
  HOI_VIEN: 5,
  LIEN_KET: 6,
} as const;

export const TEN_CAP_BAC: Record<number, string> = {
  0: "Chủ nhiệm Chi hội",
  1: "Phó Chủ nhiệm",
  2: "Ban Chấp hành",
  3: "Sáng lập viên",
  4: "Hội viên vàng",
  5: "Hội viên",
  6: "Hội viên liên kết",
};

/** Doanh nghiệp từ 100 nhân sự trở lên coi là quy mô lớn. */
export const NGUONG_DOANH_NGHIEP_LON = 100;

/**
 * Suy ra cấp bậc và quy mô từ dữ liệu hồ sơ.
 * `hoiRole` (chức vụ trong Hội) được ưu tiên vì chính xác nhất, sau đó tới
 * `memberType` từ sheet, cuối cùng mới đọc ghi chú.
 */
export function xepHangHoiVien(m: {
  memberType?: string | null;
  hoiRole?: string | null;
  note?: string | null;
  headcount?: number | string | null;
}): { capBac: number; doanhNghiepLon: boolean } {
  const vai = (m.hoiRole ?? "").toLowerCase();
  const loai = (m.memberType ?? "").toLowerCase();
  const ghi = (m.note ?? "").toLowerCase();

  let capBac: number = CAP_BAC.HOI_VIEN;

  if (vai.includes("chủ nhiệm chi hội") && !vai.includes("phó")) {
    capBac = CAP_BAC.CHU_NHIEM;
  } else if (vai.includes("phó chủ nhiệm")) {
    capBac = CAP_BAC.PHO_CHU_NHIEM;
  } else if (vai.includes("trưởng ban") || vai.includes("cố vấn") || vai) {
    capBac = CAP_BAC.BAN_CHAP_HANH;
  } else if (loai.includes("ban chấp hành") || ghi.includes("bch")) {
    capBac = CAP_BAC.BAN_CHAP_HANH;
  } else if (loai.includes("sáng lập") || ghi.includes("cựu ct") || loai.includes("cựu ct")) {
    capBac = CAP_BAC.SANG_LAP;
  } else if (loai.includes("vàng")) {
    capBac = CAP_BAC.HOI_VIEN_VANG;
  } else if (loai.includes("liên kết")) {
    capBac = CAP_BAC.LIEN_KET;
  }

  const so =
    typeof m.headcount === "number"
      ? m.headcount
      : Number(String(m.headcount ?? "").replace(/[^\d]/g, "")) || 0;

  return { capBac, doanhNghiepLon: so >= NGUONG_DOANH_NGHIEP_LON };
}

/**
 * Thứ tự sắp xếp chuẩn cho danh bạ doanh nghiệp và mọi nơi liệt kê hội viên.
 * Dùng chung để trang nào cũng ra cùng một trật tự.
 */
export const THU_TU_HOI_VIEN = [
  { trangThai: "asc" as const }, // HOAT_DONG trước ROI_HOI
  { capBac: "asc" as const }, // Chủ nhiệm → Phó → BCH → hội viên
  { feePaidYear: "desc" as const }, // đã đóng phí lên trên
  { doanhNghiepLon: "desc" as const }, // doanh nghiệp lớn lên trên
  { sortOrder: "asc" as const },
  { company: "asc" as const },
];

/** Thứ tự tin đăng trên chợ nhu cầu — ưu tiên theo chủ tin. */
export const THU_TU_TIN_DANG = [
  { pinned: "desc" as const },
  { member: { trangThai: "asc" as const } },
  { member: { capBac: "asc" as const } },
  { member: { feePaidYear: "desc" as const } },
  { member: { doanhNghiepLon: "desc" as const } },
  { createdAt: "desc" as const },
];
