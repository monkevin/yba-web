import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import ManChieuHoiDap from "./ManChieuHoiDap";

/** Màn hình máy chiếu: câu hỏi đang chiếu + QR để khán giả gửi câu hỏi. */
export default async function ChieuHoiDapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sk, ev } = await napTrang(id, "quanLy");
  const q = await prisma.skCauHoi.findFirst({
    where: { skId: sk.id, trangThai: "CHIEU" },
    select: { id: true, noiDung: true, ten: true },
  });
  return (
    <ManChieuHoiDap
      tieuDe={ev.title}
      cauHoi={q}
      linkGui={sk.ma && sk.moHoiDap ? `${SITE.url}/sk/${sk.ma}/hoi-dap` : null}
    />
  );
}
