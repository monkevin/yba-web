import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/ui";
import { requireQuyen } from "@/lib/auth";
import { tinhCachCua, khiChatCua } from "@/lib/chan-dung";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { QUYEN } from "@/lib/quyen";
import { NutDaLienHe, OGhiChu, NutXoaKhach } from "./Forms";

const MOI_TRANG = 50;

export default async function KhachTest({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireQuyen(QUYEN.BIEU_MAU_XU_LY);

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const loc = typeof sp.loc === "string" ? sp.loc : "";
  const trang = Math.max(1, Number(sp.trang ?? 1) || 1);

  const where: Prisma.KhachTestWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { phone: { contains: q } },
      { congTy: { contains: q } },
      { nganhNghe: { contains: q } },
    ];
  }
  if (loc === "chua") where.daXuLy = false;
  if (loc === "roi") where.daXuLy = true;
  if (loc === "day-du") where.AND = [{ tinhCach: { not: null } }, { khiChat: { not: null } }];

  const [tong, ds, chuaLienHe, tongTatCa] = await Promise.all([
    prisma.khachTest.count({ where }),
    prisma.khachTest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (trang - 1) * MOI_TRANG,
      take: MOI_TRANG,
    }),
    prisma.khachTest.count({ where: { daXuLy: false } }),
    prisma.khachTest.count(),
  ]);

  const soTrang = Math.max(1, Math.ceil(tong / MOI_TRANG));

  const LOC = [
    { key: "", ten: "Tất cả", so: tongTatCa },
    { key: "chua", ten: "Chưa liên hệ", so: chuaLienHe },
    { key: "roi", ten: "Đã liên hệ", so: tongTatCa - chuaLienHe },
    { key: "day-du", ten: "Làm đủ 4 bài", so: 0 },
  ];

  const duongDan = (p: Record<string, string>) => {
    const t = new URLSearchParams();
    if (q) t.set("q", q);
    if (loc) t.set("loc", loc);
    for (const [k, v] of Object.entries(p)) {
      if (v) t.set(k, v);
      else t.delete(k);
    }
    const s = t.toString();
    return s ? `/quan-tri/khach-test?${s}` : "/quan-tri/khach-test";
  };

  return (
    <div>
      <PageHeader
        title="Khách làm trắc nghiệm WHO AM I?"
        subtitle={`${tongTatCa} người đã để lại thông tin · ${chuaLienHe} chưa liên hệ lại`}
        action={
          <div className="flex flex-wrap gap-2">
            <a href="/api/khach-test/csv" className="btn-ghost">
              ⤓ Tải file Excel
            </a>
            <Link href="/who-am-i" className="btn-ghost">
              Xem trang công khai
            </Link>
          </div>
        }
      />

      <form className="mb-4 flex flex-wrap gap-2">
        {loc && <input type="hidden" name="loc" value={loc} />}
        <input
          name="q"
          defaultValue={q}
          className="inp w-full sm:max-w-xs"
          placeholder="Tìm theo tên, số điện thoại, công ty…"
        />
        <button type="submit" className="btn-primary">
          Tìm
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {LOC.map((l) => (
          <Link
            key={l.key}
            href={
              l.key
                ? `/quan-tri/khach-test?loc=${l.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`
                : `/quan-tri/khach-test${q ? `?q=${encodeURIComponent(q)}` : ""}`
            }
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              l.key === loc
                ? "bg-navy-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-navy-100 hover:bg-navy-50"
            }`}
          >
            {l.ten}
            {l.so > 0 && (
              <span className="ml-1.5 text-xs opacity-70">{l.so}</span>
            )}
          </Link>
        ))}
      </div>

      {ds.length === 0 ? (
        <div className="card px-4 py-14 text-center text-sm text-slate-500">
          {q || loc
            ? "Không có kết quả nào khớp bộ lọc."
            : "Chưa có ai làm trắc nghiệm. Khi có người điền thông tin ở trang WHO AM I?, dữ liệu sẽ hiện tại đây."}
        </div>
      ) : (
        <ul className="space-y-3">
          {ds.map((k) => {
            const tc = k.tinhCach ? tinhCachCua(k.tinhCach) : null;
            const kc = k.khiChat ? khiChatCua(k.khiChat) : null;

            return (
              <li
                key={k.id}
                className={`card p-4 ${k.daXuLy ? "" : "ring-2 ring-do-100"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-800">
                      {k.name}
                      {!k.daXuLy && (
                        <span className="ml-2 inline-block rounded-full bg-do-500 px-1.5 py-0.5 align-middle text-[11px] font-bold text-white">
                          MỚI
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      <a href={`tel:${k.phone}`} className="hover:underline">
                        {k.phone}
                      </a>
                      {k.email && (
                        <>
                          {" · "}
                          <a href={`mailto:${k.email}`} className="hover:underline">
                            {k.email}
                          </a>
                        </>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {[k.ngheNghiep, k.congTy, k.nganhNghe]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {k.birthDate
                        ? `Sinh ${k.birthDate.getDate()}/${k.birthDate.getMonth() + 1}/${k.birthDate.getFullYear()}`
                        : "Chưa có ngày sinh"}
                      {k.noiSinh ? ` · ${k.noiSinh}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatDateTime(k.createdAt)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {k.soChuDao != null && (
                    <span className="chip">🔢 Số chủ đạo {k.soChuDao}</span>
                  )}
                  {k.conGiap && (
                    <span className="chip">
                      🏮 {k.conGiap}
                      {k.menh ? ` · mệnh ${k.menh}` : ""}
                    </span>
                  )}
                  {tc && (
                    <span className="chip">
                      {tc.emoji} {tc.ten}
                    </span>
                  )}
                  {kc && (
                    <span className="chip-do">
                      {kc.emoji} {kc.ten} — {kc.danhHieu}
                    </span>
                  )}
                </div>

                <div className="mt-3 border-t border-navy-100 pt-3">
                  <OGhiChu id={k.id} banDau={k.ghiChu} />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <NutDaLienHe id={k.id} daXuLy={k.daXuLy} />
                    <NutXoaKhach id={k.id} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {soTrang > 1 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {trang > 1 && (
            <Link href={duongDan({ trang: String(trang - 1) })} className="btn-ghost">
              ← Trang trước
            </Link>
          )}
          <span className="text-sm text-slate-500">
            Trang {trang}/{soTrang}
          </span>
          {trang < soTrang && (
            <Link href={duongDan({ trang: String(trang + 1) })} className="btn-ghost">
              Trang sau →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
