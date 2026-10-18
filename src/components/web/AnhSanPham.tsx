/**
 * Ô ảnh sản phẩm. Chưa có ảnh thật thì dựng một khung minh hoạ theo ngành —
 * nền chuyển sắc + biểu tượng ngành + tên sản phẩm, nhìn có chủ đích thay vì
 * một ô xám với icon thùng hàng.
 */

const NEN = [
  "from-navy-600 to-navy-800",
  "from-do-600 to-do-800",
  "from-emerald-600 to-emerald-800",
  "from-amber-500 to-amber-700",
  "from-sky-600 to-sky-800",
  "from-violet-600 to-violet-800",
  "from-teal-600 to-teal-800",
  "from-rose-600 to-rose-800",
];

function bam(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 100000;
  return n;
}

export default function AnhSanPham({
  ten,
  anh,
  icon,
}: {
  ten: string;
  anh?: string | null;
  icon?: string | null;
}) {
  if (anh) {
    return (
      // Ảnh do hội viên tải lên
      // eslint-disable-next-line @next/next/no-img-element
      <img src={anh} alt={ten} loading="lazy" className="ratio-3-2 w-full object-cover" />
    );
  }

  const nen = NEN[bam(ten) % NEN.length];

  return (
    <div
      aria-hidden
      className={`ratio-3-2 relative flex w-full flex-col justify-between overflow-hidden bg-gradient-to-br p-4 ${nen}`}
    >
      <span className="absolute -right-5 -top-7 h-28 w-28 rounded-full bg-white/10" />
      <span className="absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-black/10" />
      <span className="relative text-3xl drop-shadow">{icon ?? "📦"}</span>
      <span className="relative line-clamp-2 text-sm font-bold leading-snug text-white drop-shadow">
        {ten}
      </span>
    </div>
  );
}
