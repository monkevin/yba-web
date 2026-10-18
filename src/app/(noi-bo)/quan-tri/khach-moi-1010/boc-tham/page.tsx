import Link from "next/link";
import { requireQuyen } from "@/lib/auth";
import {
  dieuKienNguon,
  type DongTrung,
  type UngVienQuay,
} from "@/lib/boc-tham-1010";
import { gioPhut } from "@/lib/checkin-1010";
import { prisma } from "@/lib/prisma";
import { QUYEN } from "@/lib/quyen";
import MayQuay from "./MayQuay";

/**
 * BỐC THĂM MAY MẮN 10/10 — màn hình cho người dẫn chương trình, khung sân
 * khấu bấm "Toàn màn hình" để chiếu lên. Nguồn quay là KHÁCH ĐÃ CHECK-IN
 * (check-in = vé bốc thăm); luật và lý do ở src/lib/boc-tham-1010.ts.
 */

export const dynamic = "force-dynamic";

export default async function BocTham1010() {
  await requireQuyen(QUYEN.SU_KIEN_QUAN_LY);

  const [ungTho, trungTho, tongKhach] = await Promise.all([
    // Mọi khách đã check-in ít nhất một phiên và CHƯA trúng — gồm cả ê-kíp
    // BTC, client tự lọc theo ô tick (danh sách chỉ phục vụ hiệu ứng chạy
    // tên; người trúng thật do máy chủ chọn trong action)
    prisma.khachMoi1010.findMany({
      where: { ...dieuKienNguon("BAT_KY"), trungGiai: null },
      select: {
        ten: true,
        danhXung: true,
        chucDanh: true,
        donVi: true,
        nhom: true,
        checkinLuc: true,
        checkinLeLuc: true,
        checkinGalaLuc: true,
      },
    }),
    prisma.khachMoi1010.findMany({
      where: { trungGiai: { not: null } },
      orderBy: { trungLuc: "desc" },
      select: {
        id: true,
        ten: true,
        danhXung: true,
        chucDanh: true,
        donVi: true,
        trungGiai: true,
        trungLuc: true,
      },
    }),
    prisma.khachMoi1010.count(),
  ]);

  const ung: UngVienQuay[] = ungTho.map((k) => ({
    ten: [k.danhXung, k.ten].filter(Boolean).join(" "),
    moTa: [k.chucDanh, k.donVi].filter(Boolean).join(" · "),
    nhom: k.nhom,
    td: !!k.checkinLuc,
    le: !!k.checkinLeLuc,
    gala: !!k.checkinGalaLuc,
  }));
  const daTrung: DongTrung[] = trungTho.map((k) => ({
    id: k.id,
    ten: [k.danhXung, k.ten].filter(Boolean).join(" "),
    moTa: [k.chucDanh, k.donVi].filter(Boolean).join(" · "),
    giai: k.trungGiai ?? "",
    gio: k.trungLuc ? gioPhut(k.trungLuc) : "",
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-navy-800">
            🎁 Bốc thăm may mắn 10/10
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {ung.length + daTrung.length} khách đã check-in / {tongKhach} khách
            mời · {daTrung.length} người đã trúng giải
          </p>
        </div>
        <Link href="/quan-tri/khach-moi-1010/check-in" className="btn-ghost shrink-0">
          ← Màn check-in
        </Link>
      </div>

      <MayQuay ung={ung} daTrung={daTrung} />

      <p className="mt-4 rounded-xl border border-navy-100 bg-navy-50/60 px-4 py-3 text-sm leading-relaxed text-navy-800">
        💡 Cách chạy trên sân khấu: mở trang này trên laptop nối máy chiếu,
        bấm <b>⛶ Toàn màn hình</b> ở góc khung xanh, gõ tên giải rồi bấm{" "}
        <b>🎲 QUAY SỐ</b>. Khách trúng nhưng vắng mặt thì bấm <b>Huỷ</b> ở danh
        sách dưới rồi quay lại. Trước lễ cứ dùng <b>Quay thử</b> thoải mái —
        không ghi gì cả.
      </p>
    </div>
  );
}
