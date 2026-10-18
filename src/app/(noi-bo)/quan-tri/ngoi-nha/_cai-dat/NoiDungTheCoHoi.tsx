import { prisma } from "@/lib/prisma";
import { docMucDayDu, docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import GiaoDienSuaTheCoHoi from "./GiaoDienSuaTheCoHoi";

/** Sửa / tắt / thêm Thẻ Cơ hội. */
export default async function NoiDungTheCoHoi() {
  const [du, tinhNang, rut] = await Promise.all([
    docMucDayDu("theCoHoi"),
    docTinhNang(),
    // Số lần mỗi thẻ đã được rút (mọi mùa) — để Ban biết thẻ nào đã có người gặp
    prisma.nnTienDo
      .groupBy({
        by: ["theCoHoi"],
        where: { theCoHoi: { not: null } },
        _count: { _all: true },
      })
      .catch(() => []),
  ]);
  const soLanRut: Record<string, number> = {};
  for (const r of rut) if (r.theCoHoi) soLanRut[r.theCoHoi] = r._count._all;
  return (
    <GiaoDienSuaTheCoHoi
      du={du}
      soLanRut={soLanRut}
      dangBat={tinhNang.theCoHoi}
    />
  );
}
