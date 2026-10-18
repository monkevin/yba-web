import { notFound } from "next/navigation";
import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bangDauTri } from "@/lib/ngoi-nha/dau-tri";
import BangDauTri from "./BangDauTri";

export const metadata = { title: "Bảng xếp hạng đấu trí · Ngôi nhà Chợ Lớn" };
export const dynamic = "force-dynamic";

/**
 * Bảng xếp hạng một phiên — tự làm mới mỗi 5 giây. Thêm `?san-khau=1` để chiếu
 * lên màn hình lớn (chữ to, mã tham gia thật lớn, danh sách người có mặt).
 */
export default async function TrangBangDauTri({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, sp, user] = await Promise.all([
    params,
    searchParams,
    requireUserPage(),
  ]);
  const phien = await prisma.nnDauTri.findUnique({ where: { id } });
  if (!phien) notFound();
  const dau = await bangDauTri(id, user.id);
  return (
    <BangDauTri
      phien={{
        id: phien.id,
        ten: phien.ten,
        moTa: phien.moTa,
        maThamGia: phien.maThamGia,
        trangThai: phien.trangThai,
        giay: phien.giayMoiCau,
      }}
      banDau={dau}
      sanKhau={sp["san-khau"] === "1"}
    />
  );
}
