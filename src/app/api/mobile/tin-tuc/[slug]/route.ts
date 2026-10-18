import { prisma } from "@/lib/prisma";
import { laHtml, locHtmlBaiViet } from "@/lib/html-an-toan";
import { moJson, moOptions } from "@/lib/mobile-cors";

export const OPTIONS = moOptions;

/** Chi tiết một bài — nội dung HTML đã lọc qua bộ lọc an toàn của web chính. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const bai = await prisma.post.findFirst({
    where: { slug, published: true },
    select: {
      slug: true,
      title: true,
      type: true,
      excerpt: true,
      content: true,
      coverImage: true,
      publishedAt: true,
      chuyenMuc: true,
      nguon: true,
      suKienSlug: true,
    },
  });

  if (!bai) return moJson({ error: "Không tìm thấy bài viết" }, 404);

  const noiDungAnToan = laHtml(bai.content) ? locHtmlBaiViet(bai.content) : null;

  return moJson({
    bai: { ...bai, content: noiDungAnToan ?? bai.content, laHtml: noiDungAnToan !== null },
  });
}
