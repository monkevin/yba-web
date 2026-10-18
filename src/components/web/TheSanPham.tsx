import Link from "next/link";
import AnhSanPham from "@/components/web/AnhSanPham";

export type SanPham = {
  id: string;
  name: string;
  summary: string | null;
  priceText: string | null;
  image: string | null;
};

/**
 * Thẻ sản phẩm tiêu biểu.
 *
 * Phần giá trước đây chỉ là chữ "Liên hệ báo giá" nên bấm vào không ra gì —
 * nay thành nút thật: khách đã đăng nhập thì gọi thẳng số của hội viên, chưa
 * đăng nhập thì đưa về trang đăng nhập (số điện thoại hội viên không hiện công
 * khai để tránh bị thu thập).
 */
export default function TheSanPham({
  sp,
  icon,
  soDienThoai,
  slugHoiVien,
}: {
  sp: SanPham;
  icon?: string | null;
  /** Chỉ truyền khi người xem đã đăng nhập */
  soDienThoai?: string | null;
  slugHoiVien: string;
}) {
  const giá = sp.priceText?.trim();
  // "Liên hệ", "Liên hệ báo giá", "Thoả thuận"… là lời mời gọi chứ không phải số
  const laLoiMoi =
    !giá || /liên hệ|thoả thuận|thỏa thuận|báo giá/i.test(giá);

  return (
    <div className="card flex h-full flex-col overflow-hidden">
      <AnhSanPham ten={sp.name} anh={sp.image} icon={icon} />

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold leading-snug text-navy-800">{sp.name}</h3>
        {sp.summary && sp.summary !== sp.name && (
          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-slate-600">
            {sp.summary}
          </p>
        )}

        <div className="mt-auto pt-3">
          {!laLoiMoi ? (
            <p className="text-sm font-bold text-do-700">{giá}</p>
          ) : soDienThoai ? (
            <a
              href={`tel:${soDienThoai}`}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-do-50 px-3 py-2 text-sm font-semibold text-do-700 transition hover:bg-do-100"
            >
              📞 Gọi hỏi giá
            </a>
          ) : (
            <Link
              href={`/login?tiep=/doanh-nghiep/${slugHoiVien}`}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-navy-50 px-3 py-2 text-sm font-semibold text-navy-700 transition hover:bg-navy-100"
            >
              Đăng nhập để hỏi giá →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
