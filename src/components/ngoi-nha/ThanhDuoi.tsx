"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BieuTuong from "./BieuTuong";

const MUC = [
  { href: "/ngoi-nha", ten: "Ngôi nhà", icon: "nha", co: null },
  {
    href: "/ngoi-nha/dau-truong",
    ten: "Đấu trường",
    icon: "tia",
    co: "dauTruong",
  },
  { href: "/ngoi-nha/nhiem-vu", ten: "Nhiệm vụ", icon: "tay", co: "nhiemVu" },
  { href: "/ngoi-nha/xep-hang", ten: "Xếp hạng", icon: "cup", co: null },
  { href: "/ngoi-nha/ho-so", ten: "Hồ sơ 4V", icon: "khien", co: null },
] as const;

/** Tên lớp viết đủ để Tailwind nhặt được khi dựng bản (không ghép chuỗi động). */
const LUOI: Record<number, string> = {
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

/** Đang chơi (trạm, thử thách, một trận đấu trường, một phiên đấu trí) thì ẩn thanh để màn chơi rộng. */
const DANG_CHOI =
  /^\/ngoi-nha\/(tram\/|thu-thach|dau-truong\/[^/]+|dau-tri\/[^/]+)/;

/**
 * Thanh điều hướng dưới kiểu ứng dụng — ẩn khi đang chơi để màn câu hỏi rộng.
 * Tính năng Ban Điều hành đang tắt thì bỏ mục đó, lưới tự co theo số mục còn lại.
 */
export default function ThanhDuoi({
  dauTruong = true,
  nhiemVu = true,
}: {
  dauTruong?: boolean;
  nhiemVu?: boolean;
}) {
  const path = usePathname();
  if (DANG_CHOI.test(path)) return null;
  const bat = { dauTruong, nhiemVu };
  const ds = MUC.filter((m) => m.co === null || bat[m.co]);
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-navy-950/90 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className={`mx-auto grid max-w-3xl ${LUOI[ds.length] ?? "grid-cols-5"}`}
      >
        {ds.map((m) => {
          const dang =
            m.href === "/ngoi-nha"
              ? path === "/ngoi-nha"
              : path.startsWith(m.href);
          return (
            <Link
              key={m.href}
              href={m.href}
              aria-current={dang ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                dang ? "text-white" : "text-white/55 hover:text-white/80"
              }`}
            >
              <span
                className={`grid h-7 w-10 place-items-center rounded-full ${dang ? "bg-son-600" : ""}`}
              >
                <BieuTuong ten={m.icon} className="h-[18px] w-[18px]" />
              </span>
              {m.ten}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
