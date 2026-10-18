import { requireQuyen } from "@/lib/auth";
import { QUYEN } from "@/lib/quyen";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { FormSuKien } from "../../Forms";
import { goiYPhanLoai } from "../goi-y";

export default async function SuaSuKien({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireQuyen(QUYEN.SU_KIEN_QUAN_LY);

  const { id } = await params;
  const [e, goiY] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: { registrations: { orderBy: { createdAt: "desc" } } },
    }),
    goiYPhanLoai(),
  ]);
  if (!e) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Sửa sự kiện"
        subtitle={e.title}
        action={
          <Link href="/quan-tri/noi-dung/su-kien" className="btn-ghost">
            ← Danh sách
          </Link>
        }
      />

      <FormSuKien
        suKien={{
          id: e.id,
          slug: e.slug,
          title: e.title,
          summary: e.summary,
          content: e.content,
          location: e.location,
          seriesName: e.seriesName,
          activityGroup: e.activityGroup,
          coverImage: e.coverImage,
          gallery: e.gallery,
          startAt: e.startAt,
          endAt: e.endAt,
          allowSignup: e.allowSignup,
          capacity: e.capacity,
          published: e.published,
        }}
        cacChuongTrinh={goiY.cacChuongTrinh}
        cacMang={goiY.cacMang}
      />

      {e.registrations.length > 0 && (
        <section className="card mt-5 overflow-hidden">
          <div className="border-b border-navy-100 px-5 py-4">
            <h2 className="font-bold text-navy-800">
              Danh sách đăng ký ({e.registrations.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Họ tên</th>
                  <th className="px-4 py-2.5">Điện thoại</th>
                  <th className="px-4 py-2.5">Doanh nghiệp</th>
                  <th className="px-4 py-2.5">Ghi chú</th>
                  <th className="px-4 py-2.5">Lúc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {e.registrations.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 font-medium text-navy-800">
                      {r.name}
                    </td>
                    <td className="px-4 py-2.5">
                      <a href={`tel:${r.phone}`} className="text-navy-600 hover:underline">
                        {r.phone}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{r.company ?? "—"}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.note ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">
                      {formatDateTime(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
