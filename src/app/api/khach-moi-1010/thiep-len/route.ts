import { unlink } from "fs/promises";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";
import { DUOI_THIEP, thuMucThiepLen } from "@/lib/thiep-1010";

/**
 * BTC tải THIỆP MỜI cho một khách từ trang /quan-tri/khach-moi-1010 —
 * dùng cho khách mời thêm sau đợt nạp Excel (chưa có thiệp) hoặc thay thiệp
 * đã có. Đi qua route handler chứ không qua server action vì ảnh thiệp
 * 2560×2048 thường nặng hơn trần 1 MB của server action.
 *
 * File lưu ở thư mục riêng tư `thuMucThiepLen()` (máy chủ: /data/thiep-len
 * trong volume dữ liệu nên nâng cấp web không mất), tên file = mã CL của
 * khách; CSDL ghi `soThu = "len:CL-XXXXX.jpg"` để API thiệp tìm đúng chỗ.
 */

const CHO_PHEP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const TOI_DA = 10 * 1024 * 1024; // 10 MB — thiệp JPG mẫu Capella ~1–4 MB

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !co(user, QUYEN.SU_KIEN_QUAN_LY)) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const id = form?.get("id");
  const file = form?.get("file");
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "Thiếu mã khách" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Chưa chọn tệp ảnh" }, { status: 400 });
  }

  const duoi = CHO_PHEP[file.type];
  if (!duoi) {
    return NextResponse.json(
      { error: "Chỉ nhận ảnh JPG, PNG hoặc WEBP" },
      { status: 400 }
    );
  }
  if (file.size > TOI_DA) {
    return NextResponse.json(
      {
        error: `Ảnh nặng ${Math.round(file.size / 1024 / 1024)} MB — tối đa 10 MB. Anh/chị nén bớt rồi tải lại.`,
      },
      { status: 400 }
    );
  }

  const khach = await prisma.khachMoi1010.findUnique({
    where: { id },
    select: { ma: true },
  });
  if (!khach) {
    return NextResponse.json({ error: "Không thấy khách này" }, { status: 404 });
  }

  const thuMuc = thuMucThiepLen();
  await mkdir(thuMuc, { recursive: true });
  const ten = `${khach.ma}.${duoi}`;
  await writeFile(
    path.join(thuMuc, ten),
    Buffer.from(await file.arrayBuffer())
  );
  // Đổi thiệp sang định dạng khác thì dọn file cũ để không mồ côi
  for (const duoiCu of Object.keys(DUOI_THIEP)) {
    if (duoiCu === duoi) continue;
    await unlink(path.join(thuMuc, `${khach.ma}.${duoiCu}`)).catch(() => {});
  }

  await prisma.khachMoi1010.update({
    where: { id },
    data: { soThu: `len:${ten}` },
  });
  revalidatePath("/quan-tri/khach-moi-1010");
  revalidatePath(`/1010/moi/${khach.ma}`);

  return NextResponse.json({ ok: true });
}
