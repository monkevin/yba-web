import { requireQuyen } from "@/lib/auth";
import { QUYEN } from "@/lib/quyen";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { NutDuyet, NutNoiBat, NutTra } from "./HoSoActions";

const TAB = [
  { key: "cho-duyet", label: "Chờ duyệt", status: "CHO_DUYET" },
  { key: "nhap", label: "Đã trả lại", status: "NHAP" },
  { key: "da-duyet", label: "Đã duyệt", status: "DA_DUYET" },
  { key: "an", label: "Hội viên tự ẩn", status: null },
  { key: "thieu", label: "Thiếu thông tin", status: null },
] as const;

/**
 * Hồ sơ "thiếu thông tin" = không có chỗ nào để người xem tìm hiểu thêm về
 * doanh nghiệp: không website, không fanpage, không bài báo. Đây là danh sách
 * để thư ký gọi hỏi hội viên bổ sung.
 */
const WHERE_THIEU = {
  active: true,
  publicVisible: true,
  website: null,
  facebook: null,
  OR: [{ pressLinks: null }, { pressLinks: "" }, { pressLinks: "[]" }],
} as const satisfies Prisma.MemberWhereInput;

/** Liệt kê những ô còn trống của một hồ sơ, để thư ký biết phải hỏi gì. */
function conThieu(m: {
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  offering: string | null;
  phone: string | null;
  email: string | null;
  _count: { products: number };
}): string[] {
  const t: string[] = ["Website", "Fanpage", "Bài báo"];
  if (!m.logo) t.push("Logo");
  if (!m.coverImage) t.push("Ảnh bìa");
  if (!m.offering?.trim()) t.push("Sản phẩm / dịch vụ");
  if (!m._count.products) t.push("Sản phẩm tiêu biểu");
  if (!m.phone?.trim()) t.push("Điện thoại");
  if (!m.email?.trim()) t.push("Email");
  return t;
}

/** Ban Chủ nhiệm duyệt hồ sơ doanh nghiệp trước khi hiện ra ngoài công khai. */
export default async function DuyetHoSo({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireQuyen(QUYEN.HO_SO_DUYET);

  const sp = await searchParams;
  const tab = typeof sp.tab === "string" ? sp.tab : "cho-duyet";
  const muc = TAB.find((t) => t.key === tab) ?? TAB[0];

  const where: Prisma.MemberWhereInput =
    muc.key === "an"
      ? { active: true, publicVisible: false }
      : muc.key === "thieu"
        ? WHERE_THIEU
        : { active: true, profileStatus: muc.status! };

  const [danhSach, dem] = await Promise.all([
    prisma.member.findMany({
      where,
      // Mục "thiếu thông tin" xếp theo mã để thư ký gọi lần lượt từ trên xuống
      orderBy: muc.key === "thieu" ? { code: "asc" } : { updatedAt: "desc" },
      take: muc.key === "thieu" ? 300 : 100,
      select: {
        id: true,
        slug: true,
        code: true,
        company: true,
        name: true,
        phone: true,
        email: true,
        logo: true,
        coverImage: true,
        description: true,
        offering: true,
        intro: true,
        featured: true,
        publicVisible: true,
        profileStatus: true,
        updatedAt: true,
        note: true,
        category: { select: { name: true, icon: true } },
        _count: { select: { products: true } },
      },
    }),
    Promise.all(
      TAB.map((t) =>
        prisma.member.count({
          where:
            t.key === "an"
              ? { active: true, publicVisible: false }
              : t.key === "thieu"
                ? WHERE_THIEU
                : { active: true, profileStatus: t.status! },
        })
      )
    ),
  ]);

  return (
    <div>
      <PageHeader
        title="Duyệt hồ sơ doanh nghiệp"
        subtitle="Hồ sơ hội viên tự sửa phải được duyệt trước khi hiện trên danh bạ công khai"
        action={
          <Link href="/doanh-nghiep" className="btn-ghost">
            Xem danh bạ công khai
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {TAB.map((t, i) => (
          <Link
            key={t.key}
            href={`/quan-tri/ho-so?tab=${t.key}`}
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

      {muc.key === "thieu" && danhSach.length > 0 && (
        <div className="card mb-4 border-l-4 border-l-amber-400 p-4">
          <p className="font-semibold text-navy-800">
            {danhSach.length} hồ sơ chưa có chỗ nào để người xem tìm hiểu thêm
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Không website, không fanpage, cũng chưa có bài báo nào. Hồ sơ vẫn
            hiện bình thường trên danh bạ, nhưng người xem không có gì để bấm
            vào tìm hiểu tiếp. Bấm <strong>Sửa hộ</strong> để điền giúp hội
            viên, hoặc gọi nhờ họ tự bổ sung ở <em>Tài khoản → Hồ sơ</em>.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Chỉ cần <strong>một</strong> trong ba thứ — website, fanpage hoặc
            một liên kết bài báo — là hồ sơ ra khỏi danh sách này.
          </p>
        </div>
      )}

      {danhSach.length === 0 ? (
        <div className="card px-4 py-14 text-center text-sm text-slate-500">
          Không có hồ sơ nào trong mục này.
        </div>
      ) : (
        <ul className="space-y-3">
          {danhSach.map((m) => (
            <li key={m.id} className="card flex flex-wrap items-start gap-4 p-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-navy-50 ring-1 ring-navy-100">
                {m.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.logo} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <span className="text-lg font-bold text-navy-300">
                    {tenDoanhNghiep(m.company).charAt(0)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/doanh-nghiep/${m.slug}`}
                  className="font-semibold text-navy-800 hover:text-do-600"
                >
                  {tenDoanhNghiep(m.company)}
                </Link>
                <p className="mt-0.5 text-sm text-slate-500">
                  {m.code} · {m.name}
                  {m.category ? ` · ${m.category.name}` : ""} ·{" "}
                  {m._count.products} sản phẩm
                </p>
                {muc.key === "thieu" ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {conThieu(m).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200"
                      >
                        Thiếu {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  m.intro && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">
                      {m.intro}
                    </p>
                  )
                )}
                <p className="mt-1.5 text-xs text-slate-400">
                  Sửa lần cuối: {formatDateTime(m.updatedAt)}
                </p>
                {muc.key === "nhap" && m.note?.includes("[Trả hồ sơ]") && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {m.note.split("\n").filter((d) => d.startsWith("[Trả hồ sơ]")).pop()}
                  </p>
                )}
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <Link
                  href={`/tai-khoan/ho-so?hoivien=${m.id}`}
                  className="btn-ghost py-1.5"
                >
                  Sửa hộ
                </Link>
                <NutNoiBat id={m.id} dangBat={m.featured} />
                {m.profileStatus !== "DA_DUYET" && <NutDuyet id={m.id} />}
                {m.profileStatus === "CHO_DUYET" && <NutTra id={m.id} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
