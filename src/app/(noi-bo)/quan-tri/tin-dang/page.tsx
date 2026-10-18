import { requireQuyen } from "@/lib/auth";
import { QUYEN } from "@/lib/quyen";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/ui";
import { phaiDuyetTinDang } from "@/lib/cai-dat";
import { formatDate } from "@/lib/format";
import {
  LOAI_TIN_LABEL,
  TRANG_THAI_TIN,
  TRANG_THAI_TIN_CLASS,
  TRANG_THAI_TIN_LABEL,
} from "@/lib/listing";
import { prisma } from "@/lib/prisma";
import { firstImage } from "@/lib/public";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import {
  CheDoDuyet,
  NutDuyetTin,
  NutGhim,
  NutGoTin,
} from "./TinAdminActions";

const TAB = [
  { key: "cho-duyet", label: "Chờ duyệt", status: TRANG_THAI_TIN.CHO_DUYET },
  { key: "dang-hien", label: "Đang hiển thị", status: TRANG_THAI_TIN.DANG_HIEN },
  { key: "tu-choi", label: "Đã gỡ", status: TRANG_THAI_TIN.TU_CHOI },
  { key: "an", label: "Hội viên tự ẩn", status: TRANG_THAI_TIN.AN },
] as const;

/** Ban Chủ nhiệm kiểm soát tin trên chợ nhu cầu mua – bán. */
export default async function QuanTriTinDang({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireQuyen(QUYEN.TIN_DANG_DUYET);

  const sp = await searchParams;
  const tab = typeof sp.tab === "string" ? sp.tab : "cho-duyet";
  const muc = TAB.find((t) => t.key === tab) ?? TAB[0];

  const where: Prisma.ListingWhereInput = { status: muc.status };

  const [danhSach, dem, canDuyet] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        category: { select: { name: true, icon: true } },
        member: { select: { slug: true, company: true, name: true, phone: true } },
        _count: { select: { contacts: true } },
      },
    }),
    Promise.all(TAB.map((t) => prisma.listing.count({ where: { status: t.status } }))),
    phaiDuyetTinDang(),
  ]);

  return (
    <div>
      <PageHeader
        title="Chợ nhu cầu mua – bán"
        subtitle="Kiểm soát tin hội viên đăng lên chợ giao thương"
        action={
          <Link href="/giao-thuong" className="btn-ghost">
            Xem chợ công khai
          </Link>
        }
      />

      <CheDoDuyet dangBat={canDuyet} />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {TAB.map((t, i) => (
          <Link
            key={t.key}
            href={`/quan-tri/tin-dang?tab=${t.key}`}
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
          Không có tin nào trong mục này.
        </div>
      ) : (
        <ul className="space-y-3">
          {danhSach.map((t) => {
            const anh = firstImage(t.images);
            return (
              <li key={t.id} className="card flex flex-wrap items-start gap-4 p-4">
                <div className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-navy-50">
                  {anh ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={anh} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl opacity-50">
                      {t.category?.icon ?? "🤝"}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${TRANG_THAI_TIN_CLASS[t.status]}`}
                    >
                      {TRANG_THAI_TIN_LABEL[t.status]}
                    </span>
                    <span className="chip">{LOAI_TIN_LABEL[t.type]}</span>
                    {t.category && <span className="chip">{t.category.name}</span>}
                  </div>

                  <Link
                    href={`/giao-thuong/${t.slug}`}
                    className="mt-1.5 block font-semibold leading-snug text-navy-800 hover:text-do-600"
                  >
                    {t.title}
                  </Link>

                  <p className="mt-1 text-sm text-slate-500">
                    <Link
                      href={`/doanh-nghiep/${t.member.slug}`}
                      className="hover:underline"
                    >
                      {tenDoanhNghiep(t.member.company)}
                    </Link>
                    {" · "}
                    {t.member.name}
                    {t.member.phone ? ` · ${t.member.phone}` : ""}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Đăng {formatDate(t.createdAt)} · {t.views} lượt xem ·{" "}
                    {t._count.contacts} người quan tâm
                  </p>

                  {t.rejectReason && (
                    <p className="mt-2 rounded-lg bg-do-50 px-3 py-2 text-xs text-do-800">
                      Lý do gỡ: {t.rejectReason}
                    </p>
                  )}
                </div>

                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                  <Link
                    href={`/tai-khoan/tin-dang/${t.id}`}
                    className="btn-ghost py-1.5"
                  >
                    Sửa hộ
                  </Link>
                  {t.status === TRANG_THAI_TIN.DANG_HIEN && (
                    <NutGhim id={t.id} dangGhim={t.pinned} />
                  )}
                  {t.status !== TRANG_THAI_TIN.DANG_HIEN && <NutDuyetTin id={t.id} />}
                  {t.status === TRANG_THAI_TIN.DANG_HIEN && <NutGoTin id={t.id} />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
