import type { Metadata } from "next";
import BaoCaoThanSo from "@/components/chan-dung/BaoCaoThanSo";
import { DauTrang, DieuHuong, ChuaKhaiBao, MoiThamGia, layKhach } from "../Chung";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thần số học cho doanh nhân — WHO AM I?",
  description:
    "Số chủ đạo tính từ ngày sinh, kèm diễn giải về phong cách kinh doanh và lời khuyên cho người làm chủ.",
};

export default async function ThanSoHocCongKhai() {
  const khach = await layKhach();

  return (
    <>
      <DauTrang
        tieuDe="Thần số học"
        moTa="Báo cáo đầy đủ từ ngày sinh và họ tên: số chủ đạo, biểu đồ ngày sinh, số sứ mệnh – linh hồn – nhân cách, các chỉ số phụ và năm cá nhân."
      />

      <div className="wrap py-10">
        <DieuHuong dang="/who-am-i/than-so-hoc" />

        {!khach?.birthDate ? (
          <ChuaKhaiBao />
        ) : (
          <div className="mx-auto max-w-3xl">
            <BaoCaoThanSo
              ngaySinh={khach.birthDate}
              hoTen={khach.name}
              ten={khach.name}
            />
            <div className="mt-12">
              <MoiThamGia />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
