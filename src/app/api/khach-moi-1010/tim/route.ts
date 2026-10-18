import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeSearch } from "@/lib/search";

/**
 * Tìm thư mời theo TÊN cho khối ① của landing 10/10 — khách gõ tên mình,
 * bấm đúng tên là mở thiệp riêng (Chủ nhiệm chốt 22/09/2026).
 *
 * CÔNG KHAI có chủ đích, nhưng giữ kín mức tối thiểu:
 *  - chỉ trả tên, chức danh, đơn vị, mã — KHÔNG bao giờ trả SĐT / email /
 *    trạng thái xác nhận / bàn;
 *  - phải gõ ít nhất 2 ký tự, trả tối đa 8 kết quả — không có cách nào kéo
 *    nguyên danh sách một lần;
 *  - so KHÔNG DẤU (gõ "luc" vẫn ra "Lực").
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return Response.json({ kq: [] });

  // Vài trăm khách mời — nạp hết rồi lọc không dấu trong bộ nhớ là đủ nhanh,
  // đổi lại tìm được cả khi khách gõ thiếu dấu.
  const tatCa = await prisma.khachMoi1010.findMany({
    select: { ma: true, ten: true, danhXung: true, chucDanh: true, donVi: true },
  });
  const chuan = normalizeSearch(q);
  const kq = tatCa
    .filter((k) => normalizeSearch(k.ten).includes(chuan))
    .slice(0, 8)
    .map((k) => ({
      ma: k.ma,
      ten: [k.danhXung, k.ten].filter(Boolean).join(" "),
      mo: [k.chucDanh, k.donVi].filter(Boolean).join(" · "),
    }));
  return Response.json({ kq });
}
