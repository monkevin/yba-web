import { prisma } from "@/lib/prisma";
import { getCurrentUser, isBackOffice } from "@/lib/auth";
import { resolvePeriod } from "@/lib/period";
import { approvedIn } from "@/lib/stats";
import { STATUS_LABEL, type DealStatus } from "@/lib/deal";

/** Escape một ô CSV cho Excel. */
function cell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

/** Xuất danh sách giao dịch đã duyệt trong kỳ ra CSV mở được bằng Excel. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Chưa đăng nhập", { status: 401 });
  if (!isBackOffice(user))
    return new Response("Không có quyền xuất dữ liệu", { status: 403 });

  const sp = new URL(req.url).searchParams;
  const period = resolvePeriod(
    sp.get("ky") ?? "nam-nay",
    sp.get("tu") ?? undefined,
    sp.get("den") ?? undefined
  );

  const deals = await prisma.deal.findMany({
    where: approvedIn(period),
    orderBy: { dealDate: "asc" },
    include: {
      seller: { select: { code: true, company: true, name: true } },
      buyer: { select: { code: true, company: true, name: true } },
      referrer: { select: { code: true, company: true } },
    },
  });

  const header = [
    "Mã giao dịch",
    "Ngày",
    "Mã bên bán",
    "Bên bán",
    "Mã bên mua",
    "Bên mua",
    "Mã người giới thiệu",
    "Người giới thiệu",
    "Giá trị (VND)",
    "Nội dung",
    "Trạng thái",
  ];

  const lines = [
    header.map(cell).join(","),
    ...deals.map((d) =>
      [
        d.code,
        d.dealDate.toLocaleDateString("vi-VN"),
        d.seller.code,
        d.seller.company,
        d.buyer.code,
        d.buyer.company,
        d.referrer?.code ?? "",
        d.referrer?.company ?? "",
        d.amount,
        d.description ?? "",
        STATUS_LABEL[d.status as DealStatus] ?? d.status,
      ]
        .map(cell)
        .join(",")
    ),
  ];

  // BOM để Excel nhận đúng tiếng Việt UTF-8
  const csv = "﻿" + lines.join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="giao-thuong-${period.key}.csv"`,
    },
  });
}
