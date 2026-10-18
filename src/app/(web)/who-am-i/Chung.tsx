import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { layPhien } from "./actions";

/** Bốn bài trong bộ trắc nghiệm, dùng chung cho thanh điều hướng và trang chủ đề. */
export const BAI = [
  {
    href: "/who-am-i/than-so-hoc",
    icon: "🔢",
    ten: "Thần số học",
    mo: "Số chủ đạo từ ngày sinh — năng lượng tự nhiên và phong cách kinh doanh.",
  },
  {
    href: "/who-am-i/tu-vi",
    icon: "🏮",
    ten: "Tử vi tham khảo",
    mo: "Con giáp, mệnh ngũ hành và gợi ý dùng màu bản mệnh trong kinh doanh.",
  },
  {
    href: "/who-am-i/tinh-cach",
    icon: "🧭",
    ten: "Tính cách điều hành",
    mo: "12 câu · 4 nhóm Lửa – Gió – Đất – Nước, kèm cách làm việc với từng nhóm.",
  },
  {
    href: "/who-am-i/khi-chat",
    icon: "👑",
    ten: "Khí chất doanh nhân",
    mo: "Ưng · Hổ · Xà · Hồ · Long — phong cách lãnh đạo theo góc nhìn Đông phương.",
  },
];

/** Bản ghi của khách đang làm bài, null nếu chưa khai thông tin. */
export async function layKhach() {
  const id = await layPhien();
  if (!id) return null;
  return prisma.khachTest.findUnique({ where: { id } });
}

export function DieuHuong({ dang }: { dang: string }) {
  const muc = [{ href: "/who-am-i", ten: "Tổng quan" }, ...BAI.map((b) => ({ href: b.href, ten: `${b.icon} ${b.ten}` }))];
  return (
    <div className="mb-6 flex flex-wrap gap-1.5">
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

/** Đầu trang chung cho toàn bộ khu WHO AM I. */
export function DauTrang({ tieuDe, moTa }: { tieuDe: string; moTa: string }) {
  return (
    <section className="san-do luoi-ky-thuat relative overflow-hidden py-14 text-white">
      <div
        aria-hidden
        className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-do-600/25 blur-2xl"
      />
      <div className="wrap relative">
        <p className="eyebrow text-do-300">Dành cho doanh nhân</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">
          {tieuDe}
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-white/85">{moTa}</p>
      </div>
    </section>
  );
}

/** Nhắc khách khai thông tin trước khi xem kết quả. */
export function ChuaKhaiBao() {
  return (
    <div className="card p-8 text-center">
      <span className="text-4xl">📝</span>
      <h2 className="mt-3 text-lg font-bold text-navy-800">
        Điền thông tin để xem kết quả
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        Bộ trắc nghiệm cần ngày sinh để tính thần số học và tử vi. Anh/chị điền
        một lần, dùng được cho cả bốn bài.
      </p>
      <Link href="/who-am-i" className="btn-primary mt-6">
        Điền thông tin
      </Link>
    </div>
  );
}

/** Mục nội dung trong trang kết quả. */
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

/** Mời khách tìm hiểu Chi hội sau khi xem xong kết quả. */
export function MoiThamGia() {
  return (
    <div className="overflow-hidden rounded-2xl bg-navy-800 px-6 py-8 text-center text-white">
      <h2 className="text-xl font-bold">Gặp những doanh nhân cùng khí chất</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-white/85">
        Chi hội Doanh nhân trẻ Chợ Lớn là nơi hơn 250 chủ doanh nghiệp gặp nhau
        mỗi tháng để kết nối, giao thương và cùng lớn mạnh.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/dang-ky-hoi-vien" className="btn-cta">
          Đăng ký hội viên
        </Link>
        <Link href="/gioi-thieu" className="btn-cta-ghost">
          Tìm hiểu Chi hội
        </Link>
      </div>
    </div>
  );
}
