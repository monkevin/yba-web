import BaoCaoTuVi from "@/components/chan-dung/BaoCaoTuVi";
import { PageHeader } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DieuHuongChanDung } from "../Dieu";
import { FormNgaySinh } from "../Forms";

export const dynamic = "force-dynamic";

export default async function TuVi() {
  const user = await requireUserPage();
  const cd = user.memberId
    ? await prisma.chanDung.findUnique({
        where: { memberId: user.memberId },
        include: { member: { select: { name: true } } },
      })
    : null;

  const ngaySinh = cd?.birthDate ?? null;
  const gioSinh = cd?.birthHour ?? null;

  const goc = {
    ngaySinh,
    gioSinh,
    noiSinh: cd?.noiSinh ?? "",
    hoTen: cd?.hoTen ?? "",
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Tử vi & lá số"
        subtitle="Lá số 12 cung an theo giờ sinh, luận giải cung Mệnh, cục, thân cư — kèm con giáp, mệnh ngũ hành và tuổi hợp."
      />
      <DieuHuongChanDung dang="/tai-khoan/chan-dung/tu-vi" />

      <div className="card p-5">
        <p className="font-semibold text-navy-800">
          {ngaySinh ? "Thông tin của anh/chị" : "Nhập thông tin để xem lá số"}
        </p>
        <p className="mb-4 mt-1 text-sm leading-relaxed text-slate-600">
          Lá số tử vi cần <strong>cả ngày và giờ sinh</strong> — không nhớ giờ
          thì hỏi ba mẹ giúp, vì sai giờ là sai cả lá số.
        </p>
        <FormNgaySinh banDau={goc} />
      </div>

      {ngaySinh && (
        <BaoCaoTuVi
          ngaySinh={ngaySinh}
          gioSinh={gioSinh}
          noiSinh={cd?.noiSinh ?? ""}
          hoTen={cd?.hoTen || cd?.member.name || user.name}
        />
      )}
    </div>
  );
}
