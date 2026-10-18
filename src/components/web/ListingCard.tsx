import Link from "next/link";
import LogoDoanhNghiep from "@/components/web/LogoDoanhNghiep";
import { formatDate } from "@/lib/format";
import { firstImage } from "@/lib/public";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";

export type ListingCardData = {
  slug: string;
  type: string;
  title: string;
  summary?: string | null;
  priceText?: string | null;
  location?: string | null;
  images?: string | null;
  createdAt: Date;
  category?: { name: string; icon: string | null } | null;
  member: { slug: string; company: string; logo: string | null };
};

/** Thẻ tin nhu cầu mua/bán — dùng ở trang chủ và chợ /giao-thuong. */
export default function ListingCard({ l }: { l: ListingCardData }) {
  const canMua = l.type === "CAN_MUA";
  const anh = firstImage(l.images);
  const ten = tenDoanhNghiep(l.member.company);

  return (
    <Link href={`/giao-thuong/${l.slug}`} className="tile the-sang flex h-full flex-col">
      {/* Đầu thẻ: ai đăng tin phải đọc được ngay — trước đây tên doanh nghiệp
          nằm mờ ở chân thẻ nên nhìn cả trang không biết tin của công ty nào */}
      <div
        className={`flex items-center gap-3 border-b px-4 py-3 ${
          canMua
            ? "border-navy-100 bg-navy-50/60"
            : "border-do-100 bg-do-50/60"
        }`}
      >
        <LogoDoanhNghiep company={l.member.company} logo={l.member.logo} size="sm" />
        <div className="min-w-0 flex-1">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
              canMua ? "bg-navy-600 text-white" : "bg-do-600 text-white"
            }`}
          >
            {canMua ? "Cần mua" : "Cần bán"}
          </span>
          <p className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-navy-800">
            {ten}
          </p>
        </div>
      </div>

      {anh && (
        // Ảnh do hội viên tải lên
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={anh}
          alt={l.title}
          loading="lazy"
          className="ratio-3-2 w-full object-cover"
        />
      )}

      <div className="flex flex-1 flex-col p-5">
        {l.category && (
          <span className="chip w-fit">
            {l.category.icon ? `${l.category.icon} ` : ""}
            {l.category.name}
          </span>
        )}

        <h2 className="mt-2.5 line-clamp-2 font-semibold leading-snug text-navy-800">
          {l.title}
        </h2>
        {l.summary && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">
            {l.summary}
          </p>
        )}

        <dl className="mt-3 space-y-1 text-sm">
          {l.priceText && (
            <div className="flex gap-2">
              <dt className="text-slate-500">Giá:</dt>
              <dd className="font-semibold text-do-700">{l.priceText}</dd>
            </div>
          )}
          {l.location && (
            <div className="flex gap-2">
              <dt className="text-slate-500">Khu vực:</dt>
              <dd className="text-slate-700">{l.location}</dd>
            </div>
          )}
        </dl>

        <div className="mt-auto pt-4 text-xs text-slate-500">
          Đăng ngày {formatDate(l.createdAt)}
        </div>
      </div>
    </Link>
  );
}
