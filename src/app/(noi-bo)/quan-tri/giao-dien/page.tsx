import { PageHeader } from "@/components/ui";
import { requireQuyen } from "@/lib/auth";
import { docGiaoDien } from "@/lib/giao-dien";
import { QUYEN } from "@/lib/quyen";
import GiaoDienForm from "./GiaoDienForm";

export default async function TrangGiaoDien() {
  await requireQuyen(QUYEN.GIAO_DIEN_SUA);
  const gd = await docGiaoDien();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Giao diện website"
        subtitle="Đổi banner, màu chủ đạo và thông tin liên hệ hiển thị trên ybacholon.vn"
      />
      <GiaoDienForm gd={gd} />
    </div>
  );
}
