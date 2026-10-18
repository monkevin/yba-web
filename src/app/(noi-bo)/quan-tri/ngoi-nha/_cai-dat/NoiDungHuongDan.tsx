import { prisma } from "@/lib/prisma";
import { docMucDayDu, docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import GiaoDienSuaHuongDan from "./GiaoDienSuaHuongDan";

/** Sửa 3 bước hướng dẫn người mới + cho mọi người xem lại. */
export default async function NoiDungHuongDan() {
  const [du, tinhNang, soDaXem] = await Promise.all([
    docMucDayDu("huongDan"),
    docTinhNang(),
    prisma.nnNguoiChoi.count({ where: { daXemHuongDan: true } }).catch(() => 0),
  ]);
  return (
    <GiaoDienSuaHuongDan
      du={du}
      dangBat={tinhNang.huongDan}
      soDaXem={soDaXem}
    />
  );
}
