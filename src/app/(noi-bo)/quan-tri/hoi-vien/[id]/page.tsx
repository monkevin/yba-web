import { requireQuyen } from "@/lib/auth";
import { QUYEN } from "@/lib/quyen";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import MemberForm from "../MemberForm";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireQuyen(QUYEN.HOI_VIEN_SUA);

  const { id } = await params;
  const [member, chapters] = await Promise.all([
    prisma.member.findUnique({ where: { id } }),
    prisma.chapter.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!member) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/quan-tri/hoi-vien"
        className="text-sm text-slate-500 hover:underline"
      >
        ← Quản lý hội viên
      </Link>
      <div className="mt-3">
        <PageHeader
          title={tenDoanhNghiep(member.company)}
          subtitle={`Mã hội viên ${member.code}`}
          action={
            <Link href={`/doanh-nghiep/${member.slug}`} className="btn-ghost">
              Xem hồ sơ công khai
            </Link>
          }
        />
      </div>

      {/* Lối tắt sang trình sửa hồ sơ CÔNG KHAI — nơi có tải logo, ảnh bìa,
          sản phẩm kèm ảnh. Form bên dưới chỉ quản dữ liệu hành chính của Hội. */}
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl bg-navy-50 p-4 ring-1 ring-navy-100">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-navy-100">
          {member.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.logo}
              alt=""
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <span className="text-xl text-navy-300">🖼️</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-navy-800">
            Logo, ảnh sản phẩm &amp; nội dung giới thiệu
          </p>
          <p className="mt-0.5 text-sm text-slate-600">
            {member.logo ? "Đã có logo." : "Chưa có logo."} Tải logo, ảnh bìa,
            thêm sản phẩm kèm ảnh và sửa bài giới thiệu trong trình sửa hồ sơ
            công khai.
          </p>
        </div>
        <Link
          href={`/tai-khoan/ho-so?hoivien=${member.id}`}
          className="btn-primary shrink-0"
        >
          Sửa hồ sơ công khai
        </Link>
      </div>

      <MemberForm member={member} chapters={chapters} />
    </div>
  );
}
