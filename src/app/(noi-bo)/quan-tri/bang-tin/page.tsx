import { requireQuyen } from "@/lib/auth";
import { QUYEN } from "@/lib/quyen";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { laBanChuNhiem } from "@/lib/vai-tro-hoi";
import { NutDuyet, NutGhim, NutGo } from "./BangTinActions";

const TAB = [
  { key: "cho-duyet", label: "Chờ duyệt", status: "CHO_DUYET" },
  { key: "dang-hien", label: "Đang hiển thị", status: "DANG_HIEN" },
  { key: "an", label: "Đã gỡ", status: "AN" },
] as const;

const NHAN_LOAI: Record<string, string> = {
  TIN_VUI: "Tin vui",
  KHAI_TRUONG: "Khai trương",
  TUYEN_DUNG: "Tuyển dụng",
  CHUONG_TRINH: "Chương trình",
  DAU_TU: "Đầu tư",
  THIEN_NGUYEN: "Thiện nguyện",
  KHAC: "Khác",
};

/**
 * Ban Chủ nhiệm duyệt tin hội viên đăng lên bảng tin nội bộ của Mini App.
 *
 * Tin của hội viên thường vào CHO_DUYET; tin của người có chức danh trong Ban
 * Chủ nhiệm hiện thẳng (xem `src/lib/vai-tro-hoi.ts`) — nên mục "Chờ duyệt"
 * chỉ có tin hội viên thường.
 */
export default async function QuanTriBangTin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireQuyen(QUYEN.TIN_DANG_DUYET);

  const sp = await searchParams;
  const tab = typeof sp.tab === "string" ? sp.tab : "cho-duyet";
  const muc = TAB.find((t) => t.key === tab) ?? TAB[0];

  const [danhSach, dem] = await Promise.all([
    prisma.bangTin.findMany({
      where: { status: muc.status },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        loai: true,
        tieuDe: true,
        noiDung: true,
        lienKet: true,
        pinned: true,
        createdAt: true,
        member: {
          select: { slug: true, name: true, company: true, hoiRole: true, phone: true },
        },
        _count: { select: { quanTam: true } },
      },
    }),
    Promise.all(TAB.map((t) => prisma.bangTin.count({ where: { status: t.status } }))),
  ]);

  return (
    <div>
      <PageHeader
        title="Bảng tin Chi hội"
        subtitle="Duyệt tin hội viên chia sẻ trên Mini App — tin vui, khai trương, tuyển dụng, chương trình"
      />

      <div className="card mb-4 px-4 py-3 text-sm text-slate-600">
        Tin của hội viên thường phải được duyệt mới hiện. Tin của người có chức danh
        trong Ban Chủ nhiệm hiển thị ngay, không qua bước này.
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {TAB.map((t, i) => (
          <Link
            key={t.key}
            href={`/quan-tri/bang-tin?tab=${t.key}`}
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
          {danhSach.map((t) => (
            <li key={t.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="chip">{NHAN_LOAI[t.loai] ?? "Khác"}</span>
                {t.pinned && (
                  <span className="rounded-full bg-vang-50 px-2 py-0.5 text-xs font-medium text-vang-700 ring-1 ring-vang-200">
                    Đang ghim
                  </span>
                )}
                {laBanChuNhiem(t.member.hoiRole) && (
                  <span className="rounded-full bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-700 ring-1 ring-navy-100">
                    Ban Chủ nhiệm
                  </span>
                )}
              </div>

              <p className="mt-1.5 font-semibold text-navy-900">{t.tieuDe}</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {t.noiDung.length > 400 ? t.noiDung.slice(0, 400) + "…" : t.noiDung}
              </p>

              {t.lienKet && (
                <p className="mt-1.5 break-all text-xs text-navy-600">{t.lienKet}</p>
              )}

              <p className="mt-2 text-xs text-slate-500">
                <Link href={`/doanh-nghiep/${t.member.slug}`} className="font-medium text-navy-600">
                  {t.member.name}
                </Link>{" "}
                · {tenDoanhNghiep(t.member.company)}
                {t.member.phone ? ` · ${t.member.phone}` : ""} · {formatDateTime(t.createdAt)}
                {t._count.quanTam > 0 ? ` · ${t._count.quanTam} quan tâm` : ""}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {muc.status !== "DANG_HIEN" && <NutDuyet id={t.id} />}
                {muc.status === "DANG_HIEN" && (
                  <>
                    <NutGhim id={t.id} dangGhim={t.pinned} />
                    <NutGo id={t.id} />
                  </>
                )}
                {muc.status === "CHO_DUYET" && <NutGo id={t.id} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
