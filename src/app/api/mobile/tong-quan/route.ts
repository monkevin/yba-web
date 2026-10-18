import {
  homeStats,
  featuredMembers,
  latestListings,
  upcomingEvents,
  anhHoatDong,
} from "@/lib/public";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { moJson, moOptions } from "@/lib/mobile-cors";

export const OPTIONS = moOptions;

/**
 * Dữ liệu trang chủ Mini App — CÙNG một nguồn với trang chủ web công khai,
 * không phải bản sao. GET /api/mobile/tong-quan
 */
export async function GET() {
  const [stats, doanhNghiepTieuBieu, tinMoi, suKien, anh] = await Promise.all([
    homeStats(),
    featuredMembers(8),
    latestListings(6),
    upcomingEvents(3),
    // Ảnh hoạt động thật — tài sản hình ảnh mạnh nhất của Chi hội (241 ảnh),
    // dùng làm dải ảnh trang chủ thay vì để trang toàn chữ.
    anhHoatDong(12),
  ]);

  return moJson({
    thongKe: stats,
    doanhNghiepTieuBieu: doanhNghiepTieuBieu.map((m) => ({
      ...m,
      company: tenDoanhNghiep(m.company),
    })),
    tinMoi: tinMoi.map((t) => ({
      ...t,
      member: { ...t.member, company: tenDoanhNghiep(t.member.company) },
    })),
    suKien: suKien.events,
    suKienSapToi: suKien.upcoming,
    anhHoatDong: anh,
  });
}
