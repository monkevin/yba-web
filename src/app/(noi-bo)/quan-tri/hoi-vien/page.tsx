import { requireQuyen } from "@/lib/auth";
import { QUYEN } from "@/lib/quyen";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { normalizeSearch } from "@/lib/search";
import ImportPanel from "./ImportPanel";

const PAGE_SIZE = 50;

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireQuyen(QUYEN.HOI_VIEN_SUA);

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.trang ?? 1) || 1);

  const where: Prisma.MemberWhereInput = q
    ? { searchText: { contains: normalizeSearch(q) } }
    : {};

  const [total, members] = await Promise.all([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        chapter: { select: { name: true } },
        user: { select: { username: true } },
      },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Quản lý hội viên"
        subtitle={`${total} hồ sơ`}
        action={
          <Link href="/quan-tri/hoi-vien/moi" className="btn-primary">
            + Thêm hội viên
          </Link>
        }
      />

      <ImportPanel />

      <form className="card mb-4 flex gap-3 p-3" action="/quan-tri/hoi-vien">
        <input
          name="q"
          defaultValue={q}
          className="inp"
          placeholder="Tìm theo tên doanh nghiệp, người đại diện, mã hội viên"
        />
        <button className="btn-ghost">Tìm</button>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Mã</th>
                <th className="px-3 py-2.5">Doanh nghiệp</th>
                <th className="px-3 py-2.5">Nhóm</th>
                <th className="px-3 py-2.5">Tài khoản</th>
                <th className="px-3 py-2.5">Gia nhập</th>
                <th className="px-3 py-2.5">Trạng thái</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-500">
                    {m.code}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-800">{m.company}</div>
                    <div className="text-xs text-slate-500">{m.name}</div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {m.chapter?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {m.user?.username ?? (
                      <span className="text-amber-600">chưa có</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {formatDate(m.joinedAt)}
                  </td>
                  <td className="px-3 py-2.5">
                    {m.active ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                        Hoạt động
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        Ngừng
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      href={`/quan-tri/hoi-vien/${m.id}`}
                      className="text-sm text-navy-600 hover:underline"
                    >
                      Sửa
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {members.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            Chưa có hội viên nào.
          </p>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/quan-tri/hoi-vien?q=${encodeURIComponent(q)}&trang=${page - 1}`}
              className="btn-ghost py-1.5"
            >
              ← Trước
            </Link>
          )}
          <span className="text-sm text-slate-500">
            Trang {page}/{pages}
          </span>
          {page < pages && (
            <Link
              href={`/quan-tri/hoi-vien?q=${encodeURIComponent(q)}&trang=${page + 1}`}
              className="btn-ghost py-1.5"
            >
              Sau →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
