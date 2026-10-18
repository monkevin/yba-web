import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireQuyen } from "@/lib/auth";
import { formatDateTime, formatShortVnd } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { QUYEN } from "@/lib/quyen";
import { FormDuAn, FormGoi, NutXoaGoi, FormXuLyDangKy } from "./Forms";

const NHAN: Record<string, { ten: string; lop: string }> = {
  MOI: { ten: "Mới", lop: "bg-do-50 text-do-700 ring-do-200" },
  DA_LIEN_HE: {
    ten: "Đã liên hệ",
    lop: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  DA_NHAN: {
    ten: "Đã nhận tài trợ",
    lop: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  HUY: { ten: "Huỷ", lop: "bg-slate-100 text-slate-500 ring-slate-200" },
};

export default async function QuanTriTaiTro() {
  await requireQuyen(QUYEN.TRANG_TINH_SUA);

  const [duAn, dangKy, soMoi, tongCamKet] = await Promise.all([
    prisma.duAnTaiTro.findMany({
      orderBy: { order: "asc" },
      include: { goi: { orderBy: { order: "asc" } } },
    }),
    prisma.dangKyTaiTro.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        duAn: { select: { ten: true } },
        goi: { select: { ten: true } },
        member: { select: { code: true } },
      },
    }),
    prisma.dangKyTaiTro.count({ where: { status: "MOI" } }),
    prisma.dangKyTaiTro.aggregate({
      where: { status: "DA_NHAN" },
      _sum: { soTien: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Tài trợ & đồng hành"
        subtitle={`${dangKy.length} đăng ký · ${soMoi} chưa xử lý · đã nhận ${formatShortVnd(tongCamKet._sum.soTien ?? 0)} ₫`}
        action={
          <Link href="/tai-tro" className="btn-ghost">
            Xem trang công khai
          </Link>
        }
      />

      {/* ── Chương trình & gói ─────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-bold text-navy-800">
          Chương trình kêu gọi
        </h2>

        <div className="space-y-4">
          {duAn.map((d) => (
            <div key={d.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                        d.active
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-slate-100 text-slate-600 ring-slate-200"
                      }`}
                    >
                      {d.active ? "Đang hiện" : "Đang ẩn"}
                    </span>
                    <span className="chip">{d.goi.length} gói</span>
                  </div>
                  <h3 className="mt-1.5 font-bold text-navy-800">{d.ten}</h3>
                  {d.tomTat && (
                    <p className="mt-1 text-sm text-slate-600">{d.tomTat}</p>
                  )}
                  {(d.mucTieu > 0 || d.daGop > 0) && (
                    <p className="mt-1.5 text-sm text-slate-500">
                      Đã huy động {formatShortVnd(d.daGop)} ₫
                      {d.mucTieu > 0 && ` / ${formatShortVnd(d.mucTieu)} ₫`}
                    </p>
                  )}
                </div>
                <FormDuAn
                  duAn={{
                    id: d.id,
                    ten: d.ten,
                    tomTat: d.tomTat,
                    moTa: d.moTa,
                    mucTieu: d.mucTieu,
                    daGop: d.daGop,
                    active: d.active,
                  }}
                />
              </div>

              <div className="mt-4 space-y-2 border-t border-navy-100 pt-4">
                {d.goi.map((g) => (
                  <div
                    key={g.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-navy-50 px-3 py-2"
                  >
                    <span className="min-w-0 text-sm">
                      <strong className="text-navy-800">{g.ten}</strong>
                      {" · "}
                      {formatShortVnd(g.soTien)} ₫
                      {g.noiBat && (
                        <span className="ml-2 text-xs text-do-600">
                          (nổi bật)
                        </span>
                      )}
                      {!g.active && (
                        <span className="ml-2 text-xs text-slate-500">
                          (đang ẩn)
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      <FormGoi
                        duAnId={d.id}
                        goi={{
                          id: g.id,
                          ten: g.ten,
                          soTien: g.soTien,
                          quyenLoi: g.quyenLoi,
                          noiBat: g.noiBat,
                          active: g.active,
                          order: g.order,
                        }}
                      />
                      <NutXoaGoi id={g.id} />
                    </span>
                  </div>
                ))}
                <FormGoi duAnId={d.id} />
              </div>
            </div>
          ))}
        </div>

        <div className="card mt-4 p-5">
          <h3 className="mb-3 font-bold text-navy-800">
            Thêm chương trình mới
          </h3>
          <FormDuAn />
        </div>
      </section>

      {/* ── Đăng ký tài trợ ────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-navy-800">
          Đăng ký từ website
        </h2>

        {dangKy.length === 0 ? (
          <div className="card px-4 py-14 text-center text-sm text-slate-500">
            Chưa có đăng ký tài trợ nào.
          </div>
        ) : (
          <ul className="space-y-3">
            {dangKy.map((k) => {
              const n = NHAN[k.status] ?? NHAN.MOI;
              return (
                <li
                  key={k.id}
                  className={`card p-4 ${k.status === "MOI" ? "ring-2 ring-do-100" : ""}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${n.lop}`}
                      >
                        {n.ten}
                      </span>
                      <p className="mt-1.5 font-semibold text-navy-800">
                        {k.name}
                        {k.member && (
                          <span className="ml-2 text-xs font-normal text-slate-500">
                            (hội viên {k.member.code})
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
                      {k.company && (
                        <p className="mt-0.5 text-sm text-slate-500">
                          {k.company}
                        </p>
                      )}
                      <p className="mt-2 font-semibold text-do-700">
                        {formatShortVnd(k.soTien)} ₫
                        {k.goi && (
                          <span className="ml-2 text-sm font-normal text-slate-600">
                            · gói {k.goi.ten}
                          </span>
                        )}
                        {k.duAn && (
                          <span className="ml-2 text-sm font-normal text-slate-600">
                            · {k.duAn.ten}
                          </span>
                        )}
                      </p>
                      {k.loiNhan && (
                        <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
                          {k.loiNhan}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatDateTime(k.createdAt)}
                    </span>
                  </div>

                  <div className="mt-3 border-t border-navy-100 pt-3">
                    <FormXuLyDangKy
                      id={k.id}
                      status={k.status}
                      ghiChu={k.ghiChu}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
