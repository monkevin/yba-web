import { requireQuyen } from "@/lib/auth";
import { QUYEN } from "@/lib/quyen";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { FormBaiViet } from "../../Forms";

export default async function SuaBaiViet({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireQuyen(QUYEN.NOI_DUNG_VIET);

  const { id } = await params;
  const bai = await prisma.post.findUnique({ where: { id } });
  if (!bai) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Sửa bài viết" subtitle={bai.title} />
      <FormBaiViet
        bai={{
          id: bai.id,
          slug: bai.slug,
          title: bai.title,
          type: bai.type,
          excerpt: bai.excerpt,
          content: bai.content,
          coverImage: bai.coverImage,
          featured: bai.featured,
          published: bai.published,
        }}
      />
    </div>
  );
}
