import { prisma } from "@/lib/prisma";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import TruyenThongClient from "./TruyenThongClient";

/**
 * Truyền thông — không sinh kế hoạch tự động (tuỳ quy mô): chỉ lưu link quan
 * trọng (Drive, KV, kế hoạch, album) và bài đã đăng + reach cho báo cáo NTT.
 */
export default async function TruyenThongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sk, ev } = await napTrang(id, "quanLy");
  const [taiLieu, baiDang] = await Promise.all([
    prisma.skTaiLieu.findMany({ where: { skId: sk.id }, orderBy: { order: "asc" } }),
    prisma.skBaiDang.findMany({ where: { skId: sk.id }, orderBy: [{ ngay: "asc" }, { order: "asc" }] }),
  ]);
  return <TruyenThongClient eventId={ev.id} taiLieu={taiLieu} baiDang={baiDang} />;
}
