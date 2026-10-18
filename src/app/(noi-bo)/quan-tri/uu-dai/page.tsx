import { requireQuyen } from "@/lib/auth";
import { QUYEN } from "@/lib/quyen";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { laBanChuNhiem } from "@/lib/vai-tro-hoi";
import { NutDuyet, NutGhim, NutGo, NutNhaTaiTro } from "./UuDaiActions";

const TAB = [
  { key: "cho-duyet", label: "Chờ duyệt", status: "CHO_DUYET" },
  { key: "dang-hien", label: "Đang hiển thị", status: "DANG_HIEN" },
  { key: "an", label: "Đã gỡ", status: "AN" },
] as const;

/**
 * Ban Chủ nhiệm duyệt ưu đãi hội viên tự đăng từ Mini App.
 *
 * Thứ tự hiện trong app: nhà tài trợ chiến lược → ưu đãi được ghim → mới nhất.
 * Cả hai cờ đều bật ở trang này.
 */
export default async function QuanTriUuDai({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireQuyen(QUYEN.TIN_DANG_DUYET);

  const sp = await searchParams;
  const tab = typeof sp.tab === "string" ? sp.tab : "cho-duyet";
  const muc = TAB.find((t) => t.key === tab) ?? TAB[0];

  const [danhSach, dem, nhaTaiTro] = await Promise.all([
    prisma.uuDai.findMany({
      where: { status: muc.status },
      orderBy: [
        { member: { nhaTaiTroChienLuoc: "desc" } },
        { pinned: "desc" },
        { createdAt: "desc" },
      ],
      take: 100,
      select: {
        id: true,
        slug: true,
        title: true,
        mucUuDai: true,
        summary: true,
        dieuKien: true,
        pinned: true,
        expiresAt: true,
        createdAt: true,
        member: {
          select: {
            id: true,
            slug: true,
            name: true,
            company: true,
            phone: true,
            hoiRole: true,
            nhaTaiTroChienLuoc: true,
          },
        },
        _count: { select: { leads: true } },
      },
    }),
    Promise.all(TAB.map((t) => prisma.uuDai.count({ where: { status: t.status } }))),
    prisma.member.findMany({
      where: { nhaTaiTroChienLuoc: true, active: true },
      orderBy: { company: "asc" },
      select: { id: true, slug: true, company: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Ưu đãi hội viên"
        subtitle="Duyệt ưu đãi doanh nghiệp hội viên dành riêng cho người trong Chi hội"
      />

      <div className="card mb-4 px-4 py-3 text-sm text-slate-600">
        Thứ tự hiển thị trong Mini App:{" "}
        <strong>nhà tài trợ chiến lược</strong> → <strong>ưu đãi được đưa lên đầu</strong> →
        còn lại mới nhất trước. Ưu đãi của người có chức danh trong Ban Chủ nhiệm hiện ngay,
        không qua bước duyệt.
      </div>

      {nhaTaiTro.length > 0 && (
        <div className="card mb-4 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Nhà tài trợ chiến lược ({nhaTaiTro.length})
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {nhaTaiTro.map((n) => (
              <Link
                key={n.id}
                href={`/doanh-nghiep/${n.slug}`}
                className="rounded-full bg-vang-50 px-3 py-1 text-sm font-medium text-vang-700 ring-1 ring-vang-200"
              >
                {tenDoanhNghiep(n.company)}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-1.5">
        {TAB.map((t, i) => (
          <Link
            key={t.key}
            href={`/quan-tri/uu-dai?tab=${t.key}`}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              t.key === muc.key
                ? "bg-navy-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-navy-100 hover:bg-navy-50"
            }`}
          >
            {t.label}
            <span
              className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                t.key === muc.key ? "bg-white/20" : "bg-slate-100 text-slate-500"
              }`}
            >
              {dem[i]}
            </span>
          </Link>
        ))}
      </div>

      {danhSach.length === 0 ? (
        <div className="card px-4 py-14 text-center text-sm text-slate-500">
          Không có ưu đãi nào trong mục này.
        </div>
      ) : (
        <ul className="space-y-3">
          {danhSach.map((u) => (
            <li key={u.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-do-50 px-2 py-0.5 text-xs font-semibold text-do-700 ring-1 ring-do-100">
                  {u.mucUuDai}
                </span>
                {u.member.nhaTaiTroChienLuoc && (
                  <span className="rounded-full bg-vang-50 px-2 py-0.5 text-xs font-medium text-vang-700 ring-1 ring-vang-200">
                    Nhà tài trợ chiến lược
                  </span>
                )}
                {u.pinned && (
                  <span className="rounded-full bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-700 ring-1 ring-navy-100">
                    Đang ưu tiên
                  </span>
                )}
                {laBanChuNhiem(u.member.hoiRole) && (
                  <span className="chip">Ban Chủ nhiệm</span>
                )}
              </div>

              <p className="mt-1.5 font-semibold text-navy-900">{u.title}</p>
              {u.summary && (
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {u.summary}
                </p>
              )}
              {u.dieuKien && (
                <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-slate-500">
                  Điều kiện: {u.dieuKien}
                </p>
              )}

              <p className="mt-2 text-xs text-slate-500">
                <Link
                  href={`/doanh-nghiep/${u.member.slug}`}
                  className="font-medium text-navy-600"
                >
                  {u.member.name}
                </Link>{" "}
                · {tenDoanhNghiep(u.member.company)}
                {u.member.phone ? ` · ${u.member.phone}` : ""} · {formatDateTime(u.createdAt)}
                {u.expiresAt ? ` · hết hạn ${formatDate(u.expiresAt)}` : ""}
                {u._count.leads > 0 ? ` · ${u._count.leads} lượt quan tâm` : ""}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {muc.status !== "DANG_HIEN" && <NutDuyet id={u.id} />}
                {muc.status === "DANG_HIEN" && (
                  <>
                    <NutGhim id={u.id} dangGhim={u.pinned} />
                    <NutGo id={u.id} />
                  </>
                )}
                {muc.status === "CHO_DUYET" && <NutGo id={u.id} />}
                <NutNhaTaiTro
                  memberId={u.member.id}
                  dangBat={u.member.nhaTaiTroChienLuoc}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
