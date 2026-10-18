import Link from "next/link";
import type { Metadata } from "next";
import BaoCaoTuVi from "@/components/chan-dung/BaoCaoTuVi";
import { DauTrang, DieuHuong, ChuaKhaiBao, MoiThamGia, layKhach } from "../Chung";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tử vi & lá số 12 cung cho doanh nhân — WHO AM I?",
  description:
    "Lá số tử vi 12 cung an theo giờ sinh, luận giải cung Mệnh, cục, thân cư và chính tinh, kèm con giáp, mệnh ngũ hành và tuổi hợp — tuổi xung.",
};

export default async function TuViCongKhai() {
  const khach = await layKhach();

  return (
    <>
      <DauTrang
        tieuDe="Tử vi & lá số"
        moTa="Lá số 12 cung an theo giờ sinh, luận giải cung Mệnh, cục và thân cư — kèm con giáp, mệnh ngũ hành, tuổi hợp và cách dùng màu bản mệnh trong kinh doanh."
      />

      <div className="wrap py-10">
        <DieuHuong dang="/who-am-i/tu-vi" />

        {!khach?.birthDate ? (
          <ChuaKhaiBao />
        ) : (
          <div className="mx-auto max-w-3xl">
            {/* Chưa có giờ sinh thì nhắc bổ sung để mở khoá lá số */}
            {khach.birthHour === null && (
              <div className="card flex flex-wrap items-center justify-between gap-4 border-amber-200 bg-amber-50 p-5">
                <div>
                  <p className="font-bold text-amber-900">
                    🕐 Bổ sung giờ sinh để lập lá số tử vi
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-amber-800">
                    Lá số 12 cung là phần chi tiết nhất, nhưng cần biết giờ sinh
                    mới an sao được.
                  </p>
                </div>
                <Link href="/who-am-i#sua-thong-tin" className="btn-primary shrink-0">
                  Thêm giờ sinh
                </Link>
              </div>
            )}

            <BaoCaoTuVi
              ngaySinh={khach.birthDate}
              gioSinh={khach.birthHour}
              noiSinh={khach.noiSinh ?? ""}
              hoTen={khach.name}
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
