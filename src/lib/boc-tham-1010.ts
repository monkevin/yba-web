/**
 * BỐC THĂM TRÚNG THƯỞNG 10/10 — điều kiện lọc dùng chung giữa server action
 * (quay) và trang quản trị (đếm nguồn, danh sách ứng viên). File thuần,
 * không "use server", không import auth.
 *
 * Luật Chủ tịch đặt 04/10/2026: check-in chính là vé bốc thăm — chỉ khách
 * ĐÃ CHECK-IN mới nằm trong nguồn quay; mỗi khách trúng tối đa MỘT giải
 * (cột `KhachMoi1010.trungGiai`); ê-kíp BTC mặc định không tham gia.
 */

export type NguonQuay = "TOA_DAM" | "LE" | "GALA" | "BAT_KY";

export const CAC_NGUON: NguonQuay[] = ["GALA", "LE", "TOA_DAM", "BAT_KY"];

export const TEN_NGUON: Record<NguonQuay, string> = {
  TOA_DAM: "Đã vào Tọa đàm",
  LE: "Đã vào Lễ chuyển giao",
  GALA: "Đã vào Gala",
  BAT_KY: "Có mặt bất kỳ phiên nào",
};

export const dieuKienNguon = (nguon: NguonQuay) =>
  nguon === "BAT_KY"
    ? {
        OR: [
          { checkinLuc: { not: null } },
          { checkinLeLuc: { not: null } },
          { checkinGalaLuc: { not: null } },
        ],
      }
    : nguon === "GALA"
      ? { checkinGalaLuc: { not: null } }
      : nguon === "LE"
        ? { checkinLeLuc: { not: null } }
        : { checkinLuc: { not: null } };

/** Đủ tư cách quay: đã check-in nguồn đã chọn + CHƯA trúng giải nào. */
export function dieuKienQuay(nguon: NguonQuay, caBTC: boolean) {
  return {
    ...dieuKienNguon(nguon),
    trungGiai: null,
    ...(caBTC ? {} : { nhom: { not: "BTC" } }),
  };
}

/** Một ứng viên trong nguồn quay — truyền xuống client để chạy hiệu ứng tên
 *  (kết quả thật do máy chủ chọn, danh sách này chỉ để trình diễn). */
export type UngVienQuay = {
  ten: string;
  moTa: string;
  nhom: string;
  td: boolean;
  le: boolean;
  gala: boolean;
};

/** Một dòng trong bảng "Đã trúng giải". */
export type DongTrung = {
  id: string;
  ten: string;
  moTa: string;
  giai: string;
  gio: string;
};

/** Ứng viên có thuộc nguồn quay đã chọn không (bản client, để trình diễn). */
export function thuocNguon(u: UngVienQuay, nguon: NguonQuay, caBTC: boolean): boolean {
  if (!caBTC && u.nhom === "BTC") return false;
  if (nguon === "GALA") return u.gala;
  if (nguon === "LE") return u.le;
  if (nguon === "TOA_DAM") return u.td;
  return u.td || u.le || u.gala;
}
