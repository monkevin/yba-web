import Link from "next/link";
import { requireQuyen } from "@/lib/auth";
import { MOC_1010, coHoSo, soVoiNgaySuKien } from "@/lib/checkin-1010";
import { prisma } from "@/lib/prisma";
import { QUYEN } from "@/lib/quyen";
import { NutCheckin, NutXoaLuotThu } from "../CacNut";
import MayQuet from "./MayQuet";

/**
 * MÀN CHECK-IN TẠI CỬA — thiết kế cho điện thoại của lễ tân ngày 10/10.
 * Trên cùng là MÁY QUÉT MÃ QR (camera): khách đưa mã QR trên thư mời hoặc
 * thẻ hội viên, máy tự check-in. Bên dưới là lối dự phòng: gõ tên / SĐT /
 * mã rồi bấm nút phiên. Khách là hội viên Chợ Lớn thì check-in tự cộng
 * điểm hoạt động (xem src/lib/checkin-1010.ts).
 */

export const dynamic = "force-dynamic";
export default async function CheckIn1010({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireQuyen(QUYEN.SU_KIEN_QUAN_LY);
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const [daVao, daVaoLe, daVaoGala, tongXacNhan] = await Promise.all([
    prisma.khachMoi1010.count({ where: { checkinLuc: { not: null } } }),
    prisma.khachMoi1010.count({ where: { checkinLeLuc: { not: null } } }),
    prisma.khachMoi1010.count({ where: { checkinGalaLuc: { not: null } } }),
    prisma.khachMoi1010.count({ where: { trangThai: "XAC_NHAN" } }),
  ]);
  // Lượt bấm thử còn sót (ghi trước 00:00 ngày 10.10) — đang lẫn vào quân số
  const truocLe = { lt: MOC_1010 };
  const luotThu = (
    await Promise.all([
      prisma.khachMoi1010.count({ where: { checkinLuc: truocLe } }),
      prisma.khachMoi1010.count({ where: { checkinLeLuc: truocLe } }),
      prisma.khachMoi1010.count({ where: { checkinGalaLuc: truocLe } }),
    ])
  ).reduce((a, b) => a + b, 0);
  const soVoi = soVoiNgaySuKien();

  const ketQua = q
    ? await prisma.khachMoi1010.findMany({
        where: {
          OR: [
            { ten: { contains: q } },
            { phone: { contains: q } },
            { ma: { contains: q.toUpperCase() } },
            { donVi: { contains: q } },
          ],
        },
        orderBy: { ten: "asc" },
        take: 12,
      })
    : await prisma.khachMoi1010.findMany({
        where: {
          OR: [
            { checkinLuc: { not: null } },
            { checkinLeLuc: { not: null } },
            { checkinGalaLuc: { not: null } },
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
      });

  const idHoiVien = [...new Set(ketQua.map((k) => k.memberId).filter(coHoSo))];
  const maHoiVien = new Map(
    (idHoiVien.length
      ? await prisma.member.findMany({
          where: { id: { in: idHoiVien } },
          select: { id: true, code: true },
        })
      : []
    ).map((m) => [m.id, m.code])
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-navy-800">
            🎫 Check-in Lễ chuyển giao 10/10
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Tọa đàm <b className="text-navy-800">{daVao}</b> · Lễ{" "}
            <b className="text-navy-800">{daVaoLe}</b> · Gala{" "}
            <b className="text-navy-800">{daVaoGala}</b> / {tongXacNhan} khách
            xác nhận — tính cả ê-kíp BTC
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Link href="/quan-tri/khach-moi-1010" className="btn-ghost">
            ← Danh sách
          </Link>
          <Link href="/quan-tri/khach-moi-1010/da-checkin" className="btn-ghost">
            ✅ Đã check-in
          </Link>
          <Link href="/quan-tri/khach-moi-1010/boc-tham" className="btn-ghost">
            🎁 Bốc thăm
          </Link>
          <Link href="/quan-tri/khach-moi-1010/chao-mung" className="btn-ghost">
            📺 Màn chào
          </Link>
        </div>
      </div>

      {luotThu > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="min-w-0 flex-1">
            Còn <b>{luotThu} lượt check-in thử</b> ghi trước ngày 10.10 đang
            lẫn trong quân số (lượt thử không được tính điểm hoạt động).
            {soVoi !== "TRUOC" && " Nên xoá trước khi đón khách."}
          </span>
          <NutXoaLuotThu so={luotThu} />
        </div>
      )}

      <MayQuet macDinhThu={soVoi === "TRUOC"} />

      <h2 className="mb-2 font-bold text-navy-800">
        Tìm theo tên — khi khách không có mã QR
      </h2>
      <form className="mb-5">
        <input
          name="q"
          defaultValue={q}
          placeholder="Gõ tên / SĐT / mã CL-…"
          className="inp min-h-14 w-full text-lg"
        />
        <button className="btn-primary mt-2 min-h-12 w-full text-base">Tìm khách</button>
      </form>

      {!q && ketQua.length > 0 && (
        <p className="mb-2 text-xs font-semibold text-slate-500 uppercase">
          Vừa check-in
        </p>
      )}

      <div className="space-y-3">
        {ketQua.map((k) => (
          <div
            key={k.id}
            className={`card flex items-center justify-between gap-3 p-4 ${
              k.checkinLuc || k.checkinLeLuc || k.checkinGalaLuc
                ? "ring-2 ring-emerald-200"
                : ""
            }`}
          >
            <div className="min-w-0">
              <p className="text-lg font-bold text-navy-800">
                {[k.danhXung, k.ten].filter(Boolean).join(" ")}
                {coHoSo(k.memberId) && maHoiVien.get(k.memberId) && (
                  <span className="ml-2 rounded-full bg-navy-600 px-2 py-0.5 align-middle text-xs font-bold text-white">
                    Hội viên {maHoiVien.get(k.memberId)}
                  </span>
                )}
              </p>
              <p className="truncate text-sm text-slate-500">
                {[k.chucDanh, k.donVi].filter(Boolean).join(" · ") || k.phone || k.ma}
              </p>
              <p className="mt-1 text-sm">
                <span className="font-mono text-xs text-slate-400">{k.ma}</span>
                {k.trangThai !== "XAC_NHAN" && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    {k.trangThai === "VANG" ? "đã xin vắng" : "chưa xác nhận"}
                  </span>
                )}
                {k.soKhachDiCung > 0 && (
                  <span className="ml-2 text-xs text-slate-500">+{k.soKhachDiCung} khách</span>
                )}
              </p>
              <p className="mt-1 text-xl font-extrabold text-do-600">
                {k.ban ? `Bàn ${k.ban}` : "Chưa xếp bàn"}
                {(k.checkinLuc || k.checkinLeLuc || k.checkinGalaLuc) && (
                  <span className="ml-2 text-sm font-bold text-emerald-600">
                    ·{" "}
                    {[
                      ["TĐ", k.checkinLuc] as const,
                      ["Lễ", k.checkinLeLuc] as const,
                      ["Gala", k.checkinGalaLuc] as const,
                    ]
                      .filter(([, d]) => d)
                      .map(
                        ([n, d]) =>
                          n +
                          " " +
                          d!.toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Ho_Chi_Minh",
                          })
                      )
                      .join(" · ")}
                  </span>
                )}
              </p>
            </div>
            <NutCheckin
              id={k.id}
              daVao={!!k.checkinLuc}
              daVaoLe={!!k.checkinLeLuc}
              daVaoGala={!!k.checkinGalaLuc}
              lon
            />
          </div>
        ))}
        {q && ketQua.length === 0 && (
          <div className="card p-8 text-center text-slate-500">
            Không thấy khách nào khớp “{q}”. Thử gõ ngắn hơn (chỉ tên riêng),
            hoặc kiểm tra ở danh sách đầy đủ.
          </div>
        )}
      </div>
    </div>
  );
}
