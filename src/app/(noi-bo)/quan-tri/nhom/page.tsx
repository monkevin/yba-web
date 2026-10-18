import { requireQuyen } from "@/lib/auth";
import { QUYEN } from "@/lib/quyen";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import ChapterForm from "./ChapterForm";

export default async function ChaptersPage() {
  await requireQuyen(QUYEN.HOI_VIEN_SUA);

  const chapters = await prisma.chapter.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { members: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Nhóm / chi hội"
        subtitle="Chia hội viên thành các cụm sinh hoạt để dễ theo dõi thi đua"
      />

      <div className="card mb-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5">Mã</th>
              <th className="px-3 py-2.5">Tên nhóm</th>
              <th className="px-3 py-2.5 text-right">Số hội viên</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {chapters.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2.5 font-mono text-xs text-slate-500">
                  {c.code}
                </td>
                <td className="px-3 py-2.5 text-slate-800">{c.name}</td>
                <td className="px-3 py-2.5 text-right text-slate-600">
                  {c._count.members}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {chapters.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Chưa có nhóm nào.
          </p>
        )}
      </div>

      <ChapterForm />
    </div>
  );
}
