import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DUOI_ANH_KHACH, thuMucAnhKhachLen } from "@/lib/khach-1010";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";

/**
 * BTC tải ẢNH CHÂN DUNG cho một khách mời 10/10 (ảnh tròn hiện trong danh
 * sách "Những gương mặt sẽ hội tụ" trên landing). Dùng cho khách thêm sau
 * đợt nạp Excel — khách nạp từ Excel đã có sẵn ảnh theo số thư.
 *
 * Trình duyệt đã cắt vuông + thu về 320×320 WEBP trước khi gửi (xem
 * NutTaiAnhKhach trong CacNut.tsx) nên tệp chỉ vài chục KB; ở đây vẫn nhận
 * JPG/PNG phòng khi gửi từ nơi khác.
 *
 * File lưu ở `thuMucAnhKhachLen()` — ổ dữ liệu, nâng cấp web không mất.
 */

const TOI_DA = 4 * 1024 * 1024;
const LOAI_DUOI: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

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
    return NextResponse.json({ error: "Chưa chọn ảnh" }, { status: 400 });
  }
  const duoi = LOAI_DUOI[file.type];
  if (!duoi) {
    return NextResponse.json(
      { error: "Chỉ nhận ảnh JPG, PNG hoặc WEBP" },
      { status: 400 }
    );
  }
  if (file.size > TOI_DA) {
    return NextResponse.json(
      { error: "Ảnh nặng quá 4 MB — chọn ảnh nhẹ hơn." },
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

  const thuMuc = thuMucAnhKhachLen();
  await mkdir(thuMuc, { recursive: true });
  await writeFile(
    path.join(thuMuc, `${khach.ma}.${duoi}`),
    Buffer.from(await file.arrayBuffer())
  );
  // đổi định dạng thì dọn file cũ để không còn ảnh mồ côi
  for (const duoiCu of Object.keys(DUOI_ANH_KHACH)) {
    if (duoiCu === duoi) continue;
    await unlink(path.join(thuMuc, `${khach.ma}.${duoiCu}`)).catch(() => {});
  }

  revalidatePath("/quan-tri/khach-moi-1010");
  revalidatePath("/1010");
  revalidatePath(`/1010/moi/${khach.ma}`);
  return NextResponse.json({ ok: true });
}
