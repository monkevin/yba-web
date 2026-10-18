import { requireQuyen } from "@/lib/auth";
import { QUYEN } from "@/lib/quyen";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { HANG_MUC_ICON, HUY_HIEU } from "@/lib/vinh-danh";
import {
  FormTaoKy,
  FormThem,
  NutCongBo,
  NutDeXuat,
  NutXoaKy,
  NutXoaMuc,
} from "./VinhDanhActions";

/** Ban Chủ nhiệm dựng bảng vinh danh từng kỳ rồi công bố ra trang công khai. */
export default async function QuanTriVinhDanh() {
  await requireQuyen(QUYEN.VINH_DANH_QUAN_LY);

  const kyDs = await prisma.awardPeriod.findMany({
    orderBy: { from: "desc" },
    include: {
      awards: {
        orderBy: [{ category: "asc" }, { rank: "asc" }],
        include: {
          member: { select: { slug: true, company: true, name: true, code: true } },
        },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Vinh danh hội viên"
        subtitle="Dựng bảng vinh danh từng kỳ từ số liệu giao thương rồi công bố ra ybacholon.vn"
        action={
          <Link href="/vinh-danh" className="btn-ghost">
            Xem trang công khai
          </Link>
        }
      />

      <div className="mb-6">
        <FormTaoKy />
      </div>

      {kyDs.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="text-4xl">🏆</span>
          <h2 className="mt-3 font-bold text-navy-800">Chưa có kỳ vinh danh nào</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
            Tạo một kỳ (ví dụ “Quý III/2026”), bấm <strong>Đề xuất từ số liệu</strong>{" "}
            là hệ thống tự lấy top 3 mỗi hạng mục từ giao dịch đã duyệt trong kỳ đó.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {kyDs.map((ky) => {
            const theoHangMuc = new Map<string, typeof ky.awards>();
            for (const a of ky.awards) {
              if (!theoHangMuc.has(a.category)) theoHangMuc.set(a.category, []);
              theoHangMuc.get(a.category)!.push(a);
            }

            return (
              <section key={ky.id} className="card overflow-hidden">
                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-navy-100 px-5 py-4">
                  <div>
                    <h2 className="flex flex-wrap items-center gap-2 font-bold text-navy-800">
                      {ky.name}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                          ky.published
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-slate-100 text-slate-600 ring-slate-200"
                        }`}
                      >
                        {ky.published ? "Đang công bố" : "Bản nháp"}
                      </span>
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {formatDate(ky.from)} – {formatDate(ky.to)} ·{" "}
                      {ky.awards.length} lượt vinh danh
                      {ky.note ? ` · ${ky.note}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-start gap-2">
                    <NutDeXuat periodId={ky.id} />
                    <NutCongBo id={ky.id} dangCongBo={ky.published} />
                    <NutXoaKy id={ky.id} />
                  </div>
                </header>

                <div className="px-5 py-4">
                  {ky.awards.length === 0 ? (
                    <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      Chưa có ai trong kỳ này. Bấm <strong>Đề xuất từ số liệu</strong>{" "}
                      để lấy top 3 mỗi hạng mục, hoặc thêm tay bên dưới.
                    </p>
                  ) : (
                    <div className="grid gap-5 lg:grid-cols-3">
                      {[...theoHangMuc.entries()].map(([hangMuc, ds]) => (
                        <div key={hangMuc}>
                          <h3 className="text-sm font-bold text-navy-700">
                            {HANG_MUC_ICON[hangMuc] ?? "🎖️"} {hangMuc}
                          </h3>
                          <ul className="mt-2 space-y-1.5">
                            {ds.map((a) => (
                              <li
                                key={a.id}
                                className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                              >
                                {a.rank > 0 && (
                                  <span
                                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ring-1 ${
                                      HUY_HIEU[a.rank]?.lop ??
                                      "bg-navy-50 text-navy-600 ring-navy-100"
                                    }`}
                                  >
                                    {a.rank}
                                  </span>
                                )}
                                <span className="min-w-0 flex-1">
                                  <Link
                                    href={`/doanh-nghiep/${a.member.slug}`}
                                    className="font-medium text-navy-800 hover:text-do-600"
                                  >
                                    {tenDoanhNghiep(a.member.company)}
                                  </Link>
                                  {a.metric && (
                                    <span className="block text-xs text-slate-500">
                                      {a.metric}
                                    </span>
                                  )}
                                </span>
                                <NutXoaMuc id={a.id} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  <FormThem periodId={ky.id} />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
