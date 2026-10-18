import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireUserPage, isBackOffice } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TinForm from "../TinForm";

export default async function SuaTin({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUserPage();

  const tin = await prisma.listing.findUnique({ where: { id } });
  if (!tin) notFound();

  // Kiểm tra quyền ở server, không tin vào việc UI đã ẩn đường dẫn
  if (tin.memberId !== user.memberId && !isBackOffice(user)) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Sửa tin" />
        <div className="card p-8 text-center text-sm text-slate-600">
          Tin này không thuộc doanh nghiệp của anh/chị.
          <Link href="/tai-khoan/tin-dang" className="btn-ghost mt-6 block">
            ← Tin của tôi
          </Link>
        </div>
      </div>
    );
  }

  const nganhNghe = await prisma.category.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: { id: true, name: true, icon: true },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Sửa tin"
        subtitle={tin.title}
        action={
          <Link href="/tai-khoan/tin-dang" className="btn-ghost">
            ← Tin của tôi
          </Link>
        }
      />
      <TinForm
        nganhNghe={nganhNghe}
        tin={{
          id: tin.id,
          slug: tin.slug,
          type: tin.type,
          title: tin.title,
          summary: tin.summary,
          description: tin.description,
          categoryId: tin.categoryId,
          images: tin.images,
          priceText: tin.priceText,
          quantity: tin.quantity,
          location: tin.location,
        }}
      />
    </div>
  );
}
