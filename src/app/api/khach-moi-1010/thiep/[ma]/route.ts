import fs from "fs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { timFileThiep } from "@/lib/thiep-1010";

/**
 * Phục vụ THIỆP MỜI của một khách theo mã CL — ảnh nằm trong thư mục riêng
 * tư (KHÔNG nằm trong public/, vì tên file thiệp gốc theo số thứ tự 001–315
 * đoán được; còn mã CL thì không đoán được nên ai giữ link thiệp mới xem/tải
 * được thiệp của mình). Vị trí file và thiệp tải lên: xem `src/lib/thiep-1010.ts`.
 *
 * ?tai=1 → trả về dạng tải xuống, tên file mang tên khách.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ma: string }> }
) {
  const { ma } = await params;
  const maChuan = decodeURIComponent(ma).trim().toUpperCase();
  if (!/^CL-[A-Z0-9]{5}$/.test(maChuan)) {
    return new Response("Sai mã", { status: 400 });
  }
  const khach = await prisma.khachMoi1010.findUnique({
    where: { ma: maChuan },
    select: { soThu: true, ten: true, danhXung: true },
  });
  if (!khach?.soThu) return new Response("Không có thiệp", { status: 404 });

  const file = timFileThiep(khach.soThu);
  if (!file) return new Response("Không có thiệp", { status: 404 });

  const anh = fs.readFileSync(file.duongDan);
  const tai = req.nextUrl.searchParams.get("tai") === "1";
  const tenFile = `Thiep moi 10-10 - ${[khach.danhXung, khach.ten]
    .filter(Boolean)
    .join(" ")}.${file.duoi}`;
  return new Response(new Uint8Array(anh), {
    headers: {
      "Content-Type": file.loai,
      "Cache-Control": "private, max-age=3600",
      ...(tai
        ? {
            "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(tenFile)}`,
          }
        : {}),
    },
  });
}
