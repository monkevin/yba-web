import { prisma } from "@/lib/prisma";
import { docMucDayDu, docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import { docThongSo } from "@/lib/ngoi-nha/cau-hinh";
import GiaoDienSuaChiaSe from "./GiaoDienSuaChiaSe";

/** Sửa / tắt / thêm câu "chia sẻ về mình" (câu thưởng cuối lượt). */
export default async function NoiDungChiaSe() {
  const [du, tinhNang, thongSo, nhom] = await Promise.all([
    docMucDayDu("chiaSe"),
    docTinhNang(),
    docThongSo(),
    // Kết quả gom theo đúng chữ lựa chọn — cần để cảnh báo khi Ban sửa chữ
    prisma.nnChiaSe
      .groupBy({ by: ["maCau", "luaChon"], _count: { _all: true } })
      .catch(() => []),
  ]);
  const soTraLoi: Record<string, Record<string, number>> = {};
  for (const r of nhom) {
    (soTraLoi[r.maCau] ??= {})[r.luaChon] = r._count._all;
  }
  return (
    <GiaoDienSuaChiaSe
      du={du}
      soTraLoi={soTraLoi}
      cauThuongBat={thongSo.cauThuong}
      chiaSeBat={tinhNang.cauThuongChiaSe}
    />
  );
}
