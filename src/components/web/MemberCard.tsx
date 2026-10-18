import Link from "next/link";
import LogoDoanhNghiep from "@/components/web/LogoDoanhNghiep";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";

export type MemberCardData = {
  slug: string;
  name: string;
  company: string;
  position?: string | null;
  industry?: string | null;
  district?: string | null;
  logo?: string | null;
  intro?: string | null;
  category?: { name: string; icon: string | null } | null;
};

/** Thẻ doanh nghiệp — dùng ở trang chủ và danh bạ /doanh-nghiep. */
export default function MemberCard({ m }: { m: MemberCardData }) {
  const nganh = m.category?.name ?? m.industry;
  const ten = tenDoanhNghiep(m.company);

  return (
    <Link href={`/doanh-nghiep/${m.slug}`} className="tile the-sang flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <LogoDoanhNghiep company={m.company} logo={m.logo} size="md" />
        <div className="min-w-0">
          <h2 className="line-clamp-2 font-semibold leading-snug text-navy-800">
            {ten}
          </h2>
          <p className="mt-0.5 truncate text-sm text-slate-500">
            {m.name}
            {m.position ? ` · ${m.position}` : ""}
          </p>
        </div>
      </div>

      {m.intro && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {m.intro}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
        {nganh && (
          <span className="chip">
            {m.category?.icon ? `${m.category.icon} ` : ""}
            {nganh}
          </span>
        )}
        {m.district && <span className="chip">{m.district}</span>}
      </div>
    </Link>
  );
}
