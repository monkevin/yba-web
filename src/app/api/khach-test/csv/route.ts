import { getCurrentUser } from "@/lib/auth";
import { tinhCachCua, khiChatCua } from "@/lib/chan-dung";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";

/** Bọc một ô CSV: nhân đôi dấu nháy kép và luôn đặt trong nháy. */
function o(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function ngay(d: Date | null): string {
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

/**
 * Xuất danh sách khách làm trắc nghiệm ra file CSV mở được bằng Excel.
 * Chỉ người có quyền xử lý biểu mẫu mới tải được — đây là dữ liệu cá nhân.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!co(user, QUYEN.BIEU_MAU_XU_LY)) {
    return new Response("Không có quyền", { status: 403 });
  }

  const ds = await prisma.khachTest.findMany({ orderBy: { createdAt: "desc" } });

  const dong = [
    [
      "Ngày làm",
      "Họ tên",
      "Điện thoại",
      "Email",
      "Nghề nghiệp",
      "Công ty",
      "Ngành nghề",
      "Ngày sinh",
      "Nơi sinh",
      "Số chủ đạo",
      "Can chi",
      "Mệnh",
      "Nhóm tính cách",
      "Khí chất",
      "Đã liên hệ",
      "Ghi chú",
    ].map(o).join(","),
    ...ds.map((k) =>
      [
        o(ngay(k.createdAt)),
        o(k.name),
        // Đặt dấu nháy đầu để Excel giữ số 0 ở đầu số điện thoại
        o(`'${k.phone}`),
        o(k.email),
        o(k.ngheNghiep),
        o(k.congTy),
        o(k.nganhNghe),
        o(ngay(k.birthDate)),
        o(k.noiSinh),
        o(k.soChuDao),
        o(k.conGiap),
        o(k.menh),
        o(k.tinhCach ? tinhCachCua(k.tinhCach)?.ten : ""),
        o(k.khiChat ? khiChatCua(k.khiChat)?.ten : ""),
        o(k.daXuLy ? "Rồi" : "Chưa"),
        o(k.ghiChu),
      ].join(",")
    ),
  ].join("\r\n");

  // BOM để Excel trên Windows đọc đúng tiếng Việt
  return new Response("﻿" + dong, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="khach-who-am-i.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
