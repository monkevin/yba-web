import Link from "next/link";
import { requireQuyen } from "@/lib/auth";
import {
  CAC_PHIEN,
  MOC_1010,
  NHAN_CACH,
  TEN_PHIEN_CI,
  gioPhut,
  lucCheckin,
  ngayThang,
  type Phien1010,
} from "@/lib/checkin-1010";
import { prisma } from "@/lib/prisma";
import { QUYEN } from "@/lib/quyen";
import TuLamMoi from "./TuLamMoi";

/**
 * DANH SÁCH ĐÃ CHECK-IN 10/10 (Chủ tịch đặt 07/10/2026) — "những ai đã
 * check-in, giờ check-in, check-in 2–3 lần hệ thống có ghi luôn, thật dễ
 * nhìn". Mỗi khách một dòng: giờ MỚI NHẤT của từng phiên (cột checkin*Luc)
 * + số lần quét + lịch sử từng lượt (bảng LuotCheckin1010). Bên dưới là
 * nhật ký các lượt quét gần nhất. Tự làm mới 15 giây/lần.
 */

export const dynamic = "force-dynamic";

const PHIEN_LOC: Record<string, Phien1010> = {
  td: "TOA_DAM",
  le: "LE",
  gala: "GALA",
};

/** Ô giờ: "14:05" + ngày nhỏ; lượt trước ngày lễ tô xám để biết là thử */
function OGio({ d }: { d: Date | null }) {
  if (!d) return <span className="text-slate-300">—</span>;
  const truocLe = d < MOC_1010;
  return (
    <span className={truocLe ? "text-slate-400" : "font-bold text-emerald-700"}>
      {gioPhut(d)}
      <span className="ml-1 text-xs font-normal">{ngayThang(d)}</span>
      {truocLe && <span className="block text-[11px] font-normal">trước ngày lễ</span>}
    </span>
  );
}

export default async function DaCheckin1010({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireQuyen(QUYEN.SU_KIEN_QUAN_LY);
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const pLoc = typeof sp.p === "string" ? PHIEN_LOC[sp.p] : undefined;

  const coCheckin = {
    OR: [
      { checkinLuc: { not: null } },
      { checkinLeLuc: { not: null } },
      { checkinGalaLuc: { not: null } },
    ],
  };
  const [khachTho, td, le, gala, tongLuot, nhatKy] = await Promise.all([
    prisma.khachMoi1010.findMany({
      where: {
        ...coCheckin,
        ...(pLoc === "TOA_DAM"
          ? { checkinLuc: { not: null } }
          : pLoc === "LE"
            ? { checkinLeLuc: { not: null } }
            : pLoc === "GALA"
              ? { checkinGalaLuc: { not: null } }
              : {}),
        ...(q
          ? {
              AND: [
                {
                  OR: [
                    { ten: { contains: q } },
                    { donVi: { contains: q } },
                    { ma: { contains: q.toUpperCase() } },
                    { phone: { contains: q } },
                  ],
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        ma: true,
        ten: true,
        danhXung: true,
        chucDanh: true,
        donVi: true,
        nhom: true,
        ban: true,
        checkinLuc: true,
        checkinLeLuc: true,
        checkinGalaLuc: true,
      },
    }),
    prisma.khachMoi1010.count({ where: { checkinLuc: { not: null } } }),
    prisma.khachMoi1010.count({ where: { checkinLeLuc: { not: null } } }),
    prisma.khachMoi1010.count({ where: { checkinGalaLuc: { not: null } } }),
    prisma.luotCheckin1010.count({ where: { cach: { not: "HUY" } } }),
    prisma.luotCheckin1010.findMany({ orderBy: { luc: "desc" }, take: 60 }),
  ]);

  // Lịch sử của các khách đang hiện + tên khách cho nhật ký
  const idsCanTen = [...new Set(nhatKy.map((l) => l.khachId))].filter(
    (id) => !khachTho.some((k) => k.id === id)
  );
  const [lichSuTho, tenThem] = await Promise.all([
    khachTho.length
      ? prisma.luotCheckin1010.findMany({
          where: { khachId: { in: khachTho.map((k) => k.id) } },
          orderBy: { luc: "asc" },
        })
      : Promise.resolve([]),
    idsCanTen.length
      ? prisma.khachMoi1010.findMany({
          where: { id: { in: idsCanTen } },
          select: { id: true, ten: true, danhXung: true },
        })
      : Promise.resolve([]),
  ]);
  const lichSuTheoKhach = new Map<string, typeof lichSuTho>();
  for (const l of lichSuTho) {
    lichSuTheoKhach.set(l.khachId, [...(lichSuTheoKhach.get(l.khachId) ?? []), l]);
  }
  const tenTheoId = new Map<string, string>([
    ...khachTho.map((k) => [k.id, [k.danhXung, k.ten].filter(Boolean).join(" ")] as const),
    ...tenThem.map((k) => [k.id, [k.danhXung, k.ten].filter(Boolean).join(" ")] as const),
  ]);

  // Mới check-in gần nhất lên đầu
  const moiNhat = (k: (typeof khachTho)[number]) =>
    Math.max(...CAC_PHIEN.map((p) => lucCheckin(k, p)?.getTime() ?? 0));
  const khach = [...khachTho].sort((a, b) => moiNhat(b) - moiNhat(a));
  const coMat = khachTho.length;

  const chip = (ma: string, nhan: string) => {
    const dang = (sp.p ?? "") === ma;
    const href = `/quan-tri/khach-moi-1010/da-checkin${ma ? `?p=${ma}` : ""}${
      q ? `${ma ? "&" : "?"}q=${encodeURIComponent(q)}` : ""
    }`;
    return (
      <Link
        key={ma || "tat-ca"}
        href={href}
        className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
          dang ? "bg-navy-700 text-white" : "bg-navy-50 text-navy-700 hover:bg-navy-100"
        }`}
      >
        {nhan}
      </Link>
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-navy-800">
            ✅ Danh sách đã check-in — Lễ chuyển giao 10/10
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Mỗi khách một dòng, giờ <b>mới nhất</b> của từng phiên; bấm “Xem” ở
            cột Số lần để thấy đủ lịch sử từng lần quét. <TuLamMoi />
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/quan-tri/khach-moi-1010/check-in" className="btn-ghost">
            📷 Màn check-in
          </Link>
          <Link href="/quan-tri/khach-moi-1010" className="btn-ghost">
            ← Khách mời
          </Link>
        </div>
      </div>

      {/* Tổng số */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(
          [
            ["Có mặt", coMat, "người"],
            ["Tọa đàm", td, "người"],
            ["Lễ chuyển giao", le, "người"],
            ["Gala", gala, "người"],
            ["Tổng lượt quét", tongLuot, "lượt"],
          ] as const
        ).map(([nhan, so, dv]) => (
          <div key={nhan} className="card px-4 py-3">
            <p className="text-xs font-semibold text-slate-500 uppercase">{nhan}</p>
            <p className="text-2xl font-extrabold text-navy-800">
              {so} <span className="text-sm font-medium text-slate-400">{dv}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Lọc */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {chip("", "Tất cả")}
        {chip("td", "Đã vào Tọa đàm")}
        {chip("le", "Đã vào Lễ")}
        {chip("gala", "Đã vào Gala")}
        <form className="ml-auto flex gap-2">
          {typeof sp.p === "string" && <input type="hidden" name="p" value={sp.p} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Tìm tên / đơn vị / SĐT…"
            className="inp min-h-10 w-56"
          />
          <button className="btn-primary min-h-10">Tìm</button>
        </form>
      </div>

      {/* Bảng chính */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50 text-left text-xs font-bold text-navy-700 uppercase">
              <th className="w-10 px-3 py-2.5 text-center">#</th>
              <th className="px-3 py-2.5">Khách</th>
              <th className="w-28 px-3 py-2.5 text-center">Bàn</th>
              <th className="w-28 px-3 py-2.5">Tọa đàm</th>
              <th className="w-28 px-3 py-2.5">Lễ</th>
              <th className="w-28 px-3 py-2.5">Gala</th>
              <th className="w-52 px-3 py-2.5">Số lần · lịch sử</th>
            </tr>
          </thead>
          <tbody>
            {khach.map((k, i) => {
              const ls = (lichSuTheoKhach.get(k.id) ?? []).filter((l) => l.cach !== "HUY");
              const coHuy = (lichSuTheoKhach.get(k.id) ?? []).some((l) => l.cach === "HUY");
              const soCot = CAC_PHIEN.filter((p) => lucCheckin(k, p)).length;
              const soLan = Math.max(ls.length, soCot);
              return (
                <tr key={k.id} className="border-b border-navy-50 align-top">
                  <td className="px-3 py-3 text-center text-slate-400">{i + 1}</td>
                  <td className="px-3 py-3">
                    <p className="font-bold text-navy-800">
                      {[k.danhXung, k.ten].filter(Boolean).join(" ")}
                      {k.nhom === "BTC" && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          Ê-kíp BTC
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {[k.chucDanh, k.donVi].filter(Boolean).join(" · ") || k.ma}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-center font-extrabold whitespace-nowrap text-do-600">
                    {k.ban || <span className="text-sm font-normal text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-3"><OGio d={k.checkinLuc} /></td>
                  <td className="px-3 py-3"><OGio d={k.checkinLeLuc} /></td>
                  <td className="px-3 py-3"><OGio d={k.checkinGalaLuc} /></td>
                  <td className="px-3 py-3">
                    <span className="font-bold text-navy-800">{soLan} lần</span>
                    {(ls.length > 0 || coHuy) && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs font-semibold text-navy-600 underline">
                          Xem lịch sử
                        </summary>
                        <ol className="mt-1 space-y-0.5 text-xs text-slate-600">
                          {(lichSuTheoKhach.get(k.id) ?? []).map((l) => (
                            <li key={l.id} className={l.cach === "HUY" ? "text-do-600" : ""}>
                              <b>{gioPhut(l.luc)}</b> {ngayThang(l.luc)} ·{" "}
                              {TEN_PHIEN_CI[l.phien as Phien1010] ?? l.phien} ·{" "}
                              {NHAN_CACH[l.cach] ?? l.cach}
                              {l.nguoi ? ` (${l.nguoi})` : ""}
                            </li>
                          ))}
                        </ol>
                      </details>
                    )}
                  </td>
                </tr>
              );
            })}
            {khach.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                  {q || pLoc
                    ? "Không có khách nào khớp bộ lọc."
                    : "Chưa có ai check-in."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Nhật ký từng lượt */}
      <h2 className="mt-8 mb-2 font-bold text-navy-800">
        Nhật ký các lượt quét gần nhất ({nhatKy.length})
      </h2>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50 text-left text-xs font-bold text-navy-700 uppercase">
              <th className="w-32 px-3 py-2">Giờ</th>
              <th className="px-3 py-2">Khách</th>
              <th className="w-36 px-3 py-2">Phiên</th>
              <th className="w-48 px-3 py-2">Cách</th>
            </tr>
          </thead>
          <tbody>
            {nhatKy.map((l) => (
              <tr
                key={l.id}
                className={`border-b border-navy-50 ${l.cach === "HUY" ? "text-do-600" : ""}`}
              >
                <td className="px-3 py-2">
                  <b>{gioPhut(l.luc)}</b>{" "}
                  <span className="text-xs text-slate-500">{ngayThang(l.luc)}</span>
                </td>
                <td className="px-3 py-2 font-semibold">
                  {tenTheoId.get(l.khachId) ?? "(khách đã xoá)"}
                </td>
                <td className="px-3 py-2">{TEN_PHIEN_CI[l.phien as Phien1010] ?? l.phien}</td>
                <td className="px-3 py-2 text-slate-600">
                  {NHAN_CACH[l.cach] ?? l.cach}
                  {l.nguoi ? ` (${l.nguoi})` : ""}
                </td>
              </tr>
            ))}
            {nhatKy.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                  Chưa có lượt quét nào được ghi lịch sử.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
        💡 Giờ tô <b>xám “trước ngày lễ”</b> là các lượt quét thử trước 10/10 — vẫn
        tính vào số đang có mặt. Sáng 10/10 vào màn check-in bấm{" "}
        <b>“Xoá lượt check-in thử”</b> để quân số ngày lễ bắt đầu từ 0 (lịch sử
        quét thử vẫn giữ ở đây để tra lại).
      </p>
    </div>
  );
}
