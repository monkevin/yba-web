import BaoCaoThanSo from "@/components/chan-dung/BaoCaoThanSo";
import { PageHeader } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DieuHuongChanDung } from "../Dieu";
import { FormNgaySinh } from "../Forms";

export const dynamic = "force-dynamic";

export default async function ThanSoHoc() {
  const user = await requireUserPage();
  const cd = user.memberId
    ? await prisma.chanDung.findUnique({
        where: { memberId: user.memberId },
        include: { member: { select: { name: true } } },
      })
    : null;

  const ngaySinh = cd?.birthDate ?? null;
  const hoTen = cd?.hoTen ?? "";
  const ten = cd?.member.name ?? user.name;

  const goc = {
    ngaySinh,
    gioSinh: cd?.birthHour ?? null,
    noiSinh: cd?.noiSinh ?? "",
    hoTen,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Thần số học"
        subtitle="Báo cáo đầy đủ từ ngày sinh và họ tên — số chủ đạo, biểu đồ ngày sinh, sứ mệnh, linh hồn, nhân cách và năm cá nhân."
      />
      <DieuHuongChanDung dang="/tai-khoan/chan-dung/than-so-hoc" />

      <div className="card p-5">
        <p className="font-semibold text-navy-800">
          {ngaySinh ? "Thông tin của anh/chị" : "Nhập thông tin để xem báo cáo"}
        </p>
        <p className="mb-4 mt-1 text-sm leading-relaxed text-slate-600">
          Ngày sinh là bắt buộc. Thêm họ tên khai sinh để mở khoá ba chỉ số theo
          tên; thêm giờ sinh để lập được lá số tử vi ở mục bên cạnh.
        </p>
        <FormNgaySinh banDau={goc} />
      </div>

      {ngaySinh && (
        <BaoCaoThanSo ngaySinh={ngaySinh} hoTen={hoTen} ten={ten} />
      )}

      <p className="px-4 py-10 text-center text-xs leading-relaxed text-slate-500">
        Thần số học là góc nhìn tham khảo mang tính văn hoá, không phải cơ sở để
        ra quyết định kinh doanh.
      </p>
    </div>
  );
}
