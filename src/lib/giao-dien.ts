import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";

/**
 * Cấu hình giao diện website, lưu trong bảng `SiteSetting` để Ban Chủ nhiệm đổi
 * được từ trang /quan-tri/giao-dien mà không cần sửa mã nguồn.
 *
 * Giá trị mặc định lấy từ `SITE` — chưa cấu hình gì thì web vẫn chạy như cũ.
 */

export const KHOA = {
  BANNER: "gd.banner",
  BANNER_TIEU_DE: "gd.banner_tieu_de",
  BANNER_MO_TA: "gd.banner_mo_ta",
  SLOGAN: "gd.slogan",
  MAU: "gd.mau",
  HOTLINE: "gd.hotline",
  EMAIL: "gd.email",
  DIA_CHI: "gd.dia_chi",
  FACEBOOK: "gd.facebook",
  FACEBOOK_HOI: "gd.facebook_hoi",
  LOGO: "gd.logo",
  /// Ảnh bìa dùng chung cho hồ sơ doanh nghiệp chưa có ảnh riêng
  BIA_HO_SO: "gd.bia_ho_so",
  /// KV (key visual) của Chi hội — huy hiệu tròn hiện ở đầu trang chủ
  KV: "gd.kv",
} as const;

/** Bộ màu chọn sẵn. Đổi màu là đổi toàn bộ nút, tiêu đề, nền trên web. */
export const BO_MAU: {
  ma: string;
  ten: string;
  mo: string;
  chinh: string;
  nhan: string;
}[] = [
  {
    ma: "yba",
    ten: "YBA chuẩn",
    mo: "Navy #2e4082 + đỏ #c8102e — đúng nhận diện Hội Doanh nhân trẻ.",
    chinh: "#2e4082",
    nhan: "#c8102e",
  },
  {
    ma: "navy-dam",
    ten: "Navy đậm",
    mo: "Xanh navy sẫm hơn, cảm giác trang trọng và cổ điển.",
    chinh: "#1b274d",
    nhan: "#c8102e",
  },
  {
    ma: "xanh-bien",
    ten: "Xanh biển",
    mo: "Xanh dương tươi, cảm giác hiện đại và cởi mở.",
    chinh: "#1d4ed8",
    nhan: "#dc2626",
  },
  {
    ma: "xanh-ngoc",
    ten: "Xanh ngọc",
    mo: "Xanh lục đậm, hợp khi muốn nhấn vào phát triển bền vững.",
    chinh: "#0f766e",
    nhan: "#c8102e",
  },
  {
    ma: "do-tram",
    ten: "Đỏ trầm",
    mo: "Lấy đỏ làm màu chính — mạnh mẽ, nổi bật.",
    chinh: "#9f1239",
    nhan: "#1b274d",
  },
];

export type CauHinhGiaoDien = {
  banner: string;
  bannerTieuDe: string;
  bannerMoTa: string;
  slogan: string;
  mau: string;
  hotline: string;
  email: string;
  diaChi: string;
  facebook: string;
  facebookHoi: string;
  logo: string;
  /// Rỗng = mỗi hồ sơ tự dựng dải nhận diện riêng theo tên doanh nghiệp
  biaHoSo: string;
  /// Rỗng = chưa có KV, khối huy hiệu ở trang chủ không hiện gì cả
  kv: string;
};

/** Đọc toàn bộ cấu hình giao diện, đã ghép sẵn giá trị mặc định. */
export async function docGiaoDien(): Promise<CauHinhGiaoDien> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { startsWith: "gd." } },
  });
  const m = new Map(rows.map((r) => [r.key, r.value]));
  const lay = (k: string, macDinh: string) => m.get(k)?.trim() || macDinh;

  return {
    banner: lay(KHOA.BANNER, "/banner-trang-chu.jpg"),
    bannerTieuDe: lay(KHOA.BANNER_TIEU_DE, "Chi hội Doanh nhân trẻ Chợ Lớn"),
    bannerMoTa: lay(KHOA.BANNER_MO_TA, SITE.tagline),
    slogan: lay(KHOA.SLOGAN, SITE.slogan),
    mau: lay(KHOA.MAU, "yba"),
    hotline: lay(KHOA.HOTLINE, SITE.hotline),
    email: lay(KHOA.EMAIL, SITE.email),
    diaChi: lay(KHOA.DIA_CHI, SITE.address),
    facebook: lay(KHOA.FACEBOOK, SITE.social.facebook),
    facebookHoi: lay(KHOA.FACEBOOK_HOI, SITE.social.facebookHoi),
    logo: lay(KHOA.LOGO, "/logo-yba-cholon.png"),
    biaHoSo: lay(KHOA.BIA_HO_SO, ""),
    kv: lay(KHOA.KV, ""),
  };
}

/** Bộ màu đang dùng, luôn trả về một bộ hợp lệ. */
export function timBoMau(ma: string) {
  return BO_MAU.find((b) => b.ma === ma) ?? BO_MAU[0];
}
