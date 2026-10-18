import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireQuyen } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { QUYEN } from "@/lib/quyen";
import { FormXuLy, NutXoaHen } from "./Forms";

const NHAN: Record<string, { ten: string; lop: string }> = {
  MOI: { ten: "Mới", lop: "bg-do-50 text-do-700 ring-do-200" },
  DA_XAC_NHAN: {
    ten: "Đã xác nhận lịch",
    lop: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  DA_GAP: {
    ten: "Đã gặp xong",
    lop: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  TU_CHOI: {
    ten: "Không sắp xếp được",
    lop: "bg-slate-100 text-slate-600 ring-slate-200",
  },
};

const BUOI: Record<string, string> = {
  SANG: "buổi sáng",
  CHIEU: "buổi chiều",
  TOI: "buổi tối",
};

export default async function QuanTriLichHen({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireQuyen(QUYEN.BIEU_MAU_XU_LY);

  const sp = await searchParams;
  const loc = typeof sp.loc === "string" ? sp.loc : "";

  const [ds, soMoi, tong] = await Promise.all([
    prisma.lichHen.findMany({
      where: loc ? { status: loc } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        leader: { select: { name: true, title: true } },
        member: { select: { code: true, company: true } },
      },
    }),
    prisma.lichHen.count({ where: { status: "MOI" } }),
    prisma.lichHen.count(),
  ]);

  return (
    <div>
      <PageHeader
        title="Đề nghị gặp Ban Chủ nhiệm"
        subtitle={`${tong} đề nghị · ${soMoi} chưa xử lý`}
        action={
          <Link href="/dat-lich" className="btn-ghost">
            Xem trang công khai
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {[{ ma: "", ten: "Tất cả" }, ...Object.entries(NHAN).map(([ma, v]) => ({ ma, ten: v.ten }))].map(
          (t) => (
            <Link
              key={t.ma}
              href={t.ma ? `/quan-tri/lich-hen?loc=${t.ma}` : "/quan-tri/lich-hen"}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                t.ma === loc
                  ? "bg-navy-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-navy-100 hover:bg-navy-50"
              }`}
            >
              {t.ten}
            </Link>
          )
        )}
      </div>

      {ds.length === 0 ? (
        <div className="card px-4 py-14 text-center text-sm text-slate-500">
          Chưa có đề nghị gặp nào. Khi có người gửi từ trang{" "}
          <Link href="/dat-lich" className="text-navy-600 underline">
            Đặt lịch
          </Link>
          , đề nghị sẽ hiện tại đây.
        </div>
      ) : (
        <ul className="space-y-3">
          {ds.map((h) => {
            const n = NHAN[h.status] ?? NHAN.MOI;
            return (
              <li
                key={h.id}
                className={`card p-4 ${h.status === "MOI" ? "ring-2 ring-do-100" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${n.lop}`}
                    >
                      {n.ten}
                    </span>
                    <p className="mt-1.5 font-semibold text-navy-800">
                      {h.name}
                      {h.member && (
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          (hội viên {h.member.code})
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      <a href={`tel:${h.phone}`} className="hover:underline">
                        {h.phone}
                      </a>
                      {h.email && (
                        <>
                          {" · "}
                          <a href={`mailto:${h.email}`} className="hover:underline">
                            {h.email}
                          </a>
                        </>
                      )}
                    </p>
                    {(h.company || h.member?.company) && (
                      <p className="mt-0.5 text-sm text-slate-500">
                        {h.company ?? h.member?.company}
                      </p>
                    )}

                    <p className="mt-2 font-medium text-navy-700">{h.chuDe}</p>
                    {h.noiDung && (
                      <p className="mt-1.5 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
                        {h.noiDung}
                      </p>
                    )}

                    <p className="mt-2 text-sm text-slate-500">
                      Muốn gặp:{" "}
                      <strong className="text-navy-700">
                        {h.leader ? `${h.leader.name} — ${h.leader.title}` : "Ban Chủ nhiệm sắp xếp"}
                      </strong>
                      {h.ngayHen && ` · ${formatDate(h.ngayHen)}`}
                      {h.buoi && ` ${BUOI[h.buoi] ?? ""}`}
                      {` · ${h.hinhThuc === "ONLINE" ? "trực tuyến" : "trực tiếp"}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatDateTime(h.createdAt)}
                  </span>
                </div>

                <div className="mt-3 space-y-2 border-t border-navy-100 pt-3">
                  <FormXuLy id={h.id} hienTai={h.status} ghiChu={h.ghiChu} />
                  <NutXoaHen id={h.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
