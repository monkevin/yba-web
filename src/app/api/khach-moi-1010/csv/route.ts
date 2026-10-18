import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";

/** Bọc một ô CSV: nhân đôi dấu nháy kép và luôn đặt trong nháy. */
function o(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function gio(d: Date | null): string {
  if (!d) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const TEN_PHIEN: Record<string, string> = {
  TOA_DAM: "Tọa đàm",
  CHUYEN_GIAO: "Lễ chuyển giao",
  GALA: "Gala",
};

const TEN_TT: Record<string, string> = {
  CHO_PHAN_HOI: "Chờ phản hồi",
  XAC_NHAN: "Đã xác nhận",
  VANG: "Xin vắng",
};

/** Xuất danh sách khách mời 10/10 ra CSV mở bằng Excel — dữ liệu cá nhân,
 *  chỉ người có quyền quản lý sự kiện tải được. */
export async function GET() {
  const user = await getCurrentUser();
  if (!co(user, QUYEN.SU_KIEN_QUAN_LY)) {
    return new Response("Không có quyền", { status: 403 });
  }

  const ds = await prisma.khachMoi1010.findMany({ orderBy: { ten: "asc" } });
  const dong = [
    [
      "Số thư", "Danh xưng", "Họ tên", "Chức danh", "Đơn vị", "SĐT", "Email", "Nhóm",
      "Mã thư mời", "Link thư mời", "Phản hồi", "Phiên tham dự", "Khách đi cùng",
      "Quan tâm tài trợ", "Góp quỹ NCDN", "Tiền góp quỹ (VNĐ)", "Chi tiết đồng hành", "Ghi chú của khách",
      "Bàn", "Check-in Tọa đàm", "Check-in Lễ", "Check-in Gala", "Ghi chú BTC",
    ].map(o).join(","),
    ...ds.map((k) =>
      [
        k.soThu, k.danhXung, k.ten, k.chucDanh, k.donVi, k.phone, k.email, k.nhom,
        k.ma, `https://ybacholon.vn/1010/moi/${k.ma}`,
        TEN_TT[k.trangThai] ?? k.trangThai,
        (k.phien ?? "").split(",").filter(Boolean).map((p) => TEN_PHIEN[p] ?? p).join(" + "),
        k.soKhachDiCung,
        k.quanTamTaiTro ? "Có" : "", k.dongGopQuy ? "Có" : "", k.dongGopSoTien || "", k.dongHanhGhiChu,
        k.ghiChu, k.ban, gio(k.checkinLuc), gio(k.checkinLeLuc), gio(k.checkinGalaLuc), k.ghiChuBTC,
      ].map(o).join(",")
    ),
  ];

  // BOM để Excel mở ra không vỡ dấu tiếng Việt
  return new Response("﻿" + dong.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="khach-moi-10-10-2026.csv"',
    },
  });
}
