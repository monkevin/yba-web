import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import { phaiDuyetTinDang } from "@/lib/cai-dat";
import { prisma } from "@/lib/prisma";
import TinForm from "../TinForm";

export default async function DangTinMoi() {
  const user = await requireUserPage();

  if (!user.memberId) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Đăng tin mới" />
        <div className="card p-8 text-center text-sm text-slate-600">
          Tài khoản chưa gắn với hồ sơ doanh nghiệp nên chưa đăng tin được. Nhờ
          thư ký Chi hội gắn giúp.
          <Link href="/tai-khoan/tin-dang" className="btn-ghost mt-6 block">
            ← Quay lại
          </Link>
        </div>
      </div>
    );
  }

  const [nganhNghe, hoiVien, canDuyet] = await Promise.all([
    prisma.category.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true, icon: true },
    }),
    prisma.member.findUnique({
      where: { id: user.memberId },
      select: { district: true },
    }),
    phaiDuyetTinDang(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Đăng nhu cầu mới"
        subtitle="Tin hiển thị 90 ngày trên chợ giao thương, gia hạn được"
        action={
          <Link href="/tai-khoan/tin-dang" className="btn-ghost">
            ← Tin của tôi
          </Link>
        }
      />

      <p className="mb-4 rounded-lg bg-navy-50 px-4 py-3 text-sm text-slate-700">
        {canDuyet
          ? "Tin sẽ hiển thị sau khi Ban Chủ nhiệm duyệt."
          : "Tin hiển thị ngay sau khi đăng. Ban Chủ nhiệm có thể ẩn tin nếu nội dung không phù hợp."}
      </p>

      {/* Không điền sẵn ngành nghề theo ngành của doanh nghiệp: với tin CẦN MUA
          thì ngành của thứ cần mua thường khác hẳn ngành họ đang kinh doanh. */}
      <TinForm
        nganhNghe={nganhNghe}
        khuVucMacDinh={hoiVien?.district ? `${hoiVien.district}, TP.HCM` : null}
      />
    </div>
  );
}
