import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";

/**
 * Ảnh bìa đầu trang hồ sơ doanh nghiệp.
 *
 * Thứ tự ưu tiên:
 *  1. Ảnh bìa riêng hội viên tự tải lên
 *  2. Ảnh bìa chung do Ban Chủ nhiệm đặt ở /quan-tri/giao-dien
 *  3. Dải nhận diện tự dựng — nền chuyển sắc theo tên doanh nghiệp, có hoa văn
 *     và tên viết lớn mờ phía sau, nhìn ra dáng thương hiệu chứ không phải một
 *     khối màu trống.
 */

/** Cặp màu nền — chọn theo tên nên mỗi doanh nghiệp luôn ra đúng một tông. */
const TONG = [
  "from-navy-900 via-navy-800 to-navy-600",
  "from-slate-900 via-navy-800 to-navy-700",
  "from-navy-800 via-navy-700 to-sky-800",
  "from-navy-900 via-do-900 to-do-700",
  "from-emerald-900 via-navy-800 to-navy-700",
  "from-navy-800 via-violet-900 to-navy-700",
];

function bam(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 100000;
  return n;
}

export default function AnhBiaHoSo({
  company,
  coverImage,
  biaChung,
  icon,
}: {
  company: string;
  coverImage?: string | null;
  /** Ảnh bìa chung của Chi hội, dùng khi hội viên chưa có ảnh riêng */
  biaChung?: string | null;
  icon?: string | null;
}) {
  const anh = coverImage || biaChung;

  if (anh) {
    return (
      <div className="relative h-44 overflow-hidden bg-navy-900 sm:h-60">
        {/* Ảnh bìa do hội viên hoặc Ban Chủ nhiệm tải lên */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={anh} alt="" className="h-full w-full object-cover" />
        {/* Phủ tối phía dưới để logo và tên đè lên vẫn đọc rõ */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/20 to-transparent"
        />
      </div>
    );
  }

  const ten = tenDoanhNghiep(company);
  const tong = TONG[bam(ten) % TONG.length];

  return (
    <div
      aria-hidden
      className={`relative h-44 overflow-hidden bg-gradient-to-br sm:h-60 ${tong}`}
    >
      {/* Hoa văn tròn mềm cho nền đỡ phẳng */}
      <span className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/[0.07]" />
      <span className="absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-white/[0.05]" />
      <span className="absolute right-1/4 top-1/3 h-40 w-40 rounded-full bg-do-500/15 blur-2xl" />

      {/* Tên doanh nghiệp viết lớn mờ phía sau — cho ra dáng bìa hồ sơ */}
      <span className="absolute inset-x-0 bottom-3 truncate px-6 text-center text-4xl font-extrabold uppercase tracking-tight text-white/[0.08] sm:bottom-5 sm:text-6xl">
        {ten}
      </span>

      {icon && (
        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-6xl opacity-20 sm:right-16 sm:text-8xl">
          {icon}
        </span>
      )}

      {/* Vạch đỏ nhận diện Chi hội ở đáy */}
      <span className="absolute inset-x-0 bottom-0 h-1 bg-do-600" />
    </div>
  );
}
