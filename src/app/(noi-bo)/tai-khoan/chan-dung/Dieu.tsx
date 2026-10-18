import Link from "next/link";

/** Thanh điều hướng giữa 4 bài trong bộ Chân dung doanh nhân. */
export function DieuHuongChanDung({ dang }: { dang: string }) {
  const muc = [
    { href: "/tai-khoan/chan-dung", ten: "Tổng quan" },
    { href: "/tai-khoan/chan-dung/than-so-hoc", ten: "🔢 Thần số học" },
    { href: "/tai-khoan/chan-dung/tu-vi", ten: "🏮 Tử vi" },
    { href: "/tai-khoan/chan-dung/tinh-cach", ten: "🧭 Tính cách" },
    { href: "/tai-khoan/chan-dung/khi-chat", ten: "👑 Khí chất" },
  ];

  return (
    <div className="mb-5 flex flex-wrap gap-1.5">
      {muc.map((m) => (
        <Link
          key={m.href}
          href={m.href}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            m.href === dang
              ? "bg-navy-600 text-white"
              : "bg-white text-slate-600 ring-1 ring-navy-100 hover:bg-navy-50"
          }`}
        >
          {m.ten}
        </Link>
      ))}
    </div>
  );
}

/** Khung một mục nội dung trong trang kết quả. */
export function Muc({
  tieuDe,
  children,
}: {
  tieuDe: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <h2 className="font-bold text-navy-800">{tieuDe}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Danh sách gạch đầu dòng có dấu tích hoặc dấu chấm than. */
export function DanhSach({
  y,
  dau = "✓",
  mau = "text-emerald-600",
}: {
  y: string[];
  dau?: string;
  mau?: string;
}) {
  return (
    <ul className="space-y-2">
      {y.map((t, i) => (
        <li key={i} className="flex gap-2.5">
          <span className={`mt-0.5 shrink-0 ${mau}`}>{dau}</span>
          <span className="leading-relaxed text-slate-700">{t}</span>
        </li>
      ))}
    </ul>
  );
}
