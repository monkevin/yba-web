import Link from "next/link";
import { requireQuyen } from "@/lib/auth";
import {
  CAC_PHIEN,
  TEN_PHIEN_CI,
  gioPhut,
  lucCheckin,
} from "@/lib/checkin-1010";
import { prisma } from "@/lib/prisma";
import { QUYEN } from "@/lib/quyen";
import ManChao, { type LuotDen } from "./ManChao";

/**
 * MÀN HÌNH CHÀO MỪNG Ở SẢNH (Chủ tịch đặt 04/10/2026) — chiếu lên TV/màn
 * LED ở lối vào: khách vừa check-in (quét QR, bấm trên thiệp, lễ tân bấm)
 * là tên + chức danh hiện thật to, kèm các khách đến trước đó và quân số
 * ba phiên. Trang tự làm mới 5 giây một lần (client gọi router.refresh).
 *
 * Nằm trong /quan-tri nên chỉ tài khoản BTC mở được — laptop nối màn hình
 * sảnh đăng nhập tài khoản lễ tân là chạy. KHÔNG hiện SĐT / bàn; khách đã
 * bấm "Ẩn khỏi danh sách công khai" và ê-kíp BTC không hiện trên màn này.
 */

export const dynamic = "force-dynamic";

export default async function ChaoMung1010() {
  await requireQuyen(QUYEN.SU_KIEN_QUAN_LY);

  const daVao = await prisma.khachMoi1010.findMany({
    where: {
      OR: [
        { checkinLuc: { not: null } },
        { checkinLeLuc: { not: null } },
        { checkinGalaLuc: { not: null } },
      ],
    },
    select: {
      ma: true,
      ten: true,
      danhXung: true,
      chucDanh: true,
      donVi: true,
      nhom: true,
      anKhoiDanhSach: true,
      checkinLuc: true,
      checkinLeLuc: true,
      checkinGalaLuc: true,
    },
  });

  // Mỗi lượt check-in (một khách có thể vào 2–3 phiên) thành một dòng chào
  const luot: LuotDen[] = [];
  const dem = { td: 0, le: 0, gala: 0 };
  for (const k of daVao) {
    for (const p of CAC_PHIEN) {
      const luc = lucCheckin(k, p);
      if (!luc) continue;
      if (p === "TOA_DAM") dem.td++;
      else if (p === "LE") dem.le++;
      else dem.gala++;
      if (k.anKhoiDanhSach || k.nhom === "BTC") continue; // không chào trên màn
      luot.push({
        khoa: `${k.ma}-${p}`,
        ten: [k.danhXung, k.ten].filter(Boolean).join(" "),
        moTa: [k.chucDanh, k.donVi].filter(Boolean).join(" · "),
        phien: TEN_PHIEN_CI[p],
        gio: gioPhut(luc),
        luc: luc.getTime(),
      });
    }
  }
  luot.sort((a, b) => b.luc - a.luc);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-navy-800">
            📺 Màn hình chào mừng ở sảnh
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Tự làm mới 5 giây/lần — khách check-in là tên hiện lên ngay
          </p>
        </div>
        <Link href="/quan-tri/khach-moi-1010/check-in" className="btn-ghost shrink-0">
          ← Màn check-in
        </Link>
      </div>

      <ManChao luot={luot.slice(0, 9)} dem={dem} />

      <p className="mt-4 rounded-xl border border-navy-100 bg-navy-50/60 px-4 py-3 text-sm leading-relaxed text-navy-800">
        💡 Cách chạy: laptop nối TV/màn LED ở sảnh, đăng nhập tài khoản Ban Tổ
        chức, mở trang này rồi bấm <b>⛶ Toàn màn hình</b>. Khách nào quét QR /
        được lễ tân check-in là tên hiện lên trong vòng vài giây. Khách đã bấm
        "Ẩn khỏi danh sách công khai" và ê-kíp BTC không hiện trên màn; số
        quân ba phiên ở góc dưới thì vẫn đếm đủ.
      </p>
    </div>
  );
}
