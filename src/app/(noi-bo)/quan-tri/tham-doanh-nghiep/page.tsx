import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireQuyen } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { QUYEN } from "@/lib/quyen";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { NHAN_THAM } from "@/lib/tham-dn";
import { FormXuLyChuyen, NutXoaChuyen, DanhSachDangKy } from "./Forms";

export default async function QuanTriTham() {
  await requireQuyen(QUYEN.SU_KIEN_QUAN_LY);

  const ds = await prisma.thamDoanhNghiep.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      member: { select: { code: true, company: true, phone: true, slug: true } },
      dangKy: { orderBy: { createdAt: "asc" } },
    },
  });

  const choDuyet = ds.filter((t) => t.status === "DE_XUAT").length;

  return (
    <div>
      <PageHeader
        title="Đi thăm doanh nghiệp hội viên"
        subtitle={`${ds.length} chuyến · ${choDuyet} lời mời chờ duyệt`}
        action={
          <Link href="/tham-doanh-nghiep" className="btn-ghost">
            Xem trang công khai
          </Link>
        }
      />

      {ds.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="text-4xl">🏭</span>
          <h2 className="mt-3 font-bold text-navy-800">Chưa có chuyến nào</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
            Khi hội viên gửi lời mời Chi hội đến thăm doanh nghiệp của họ, lời
            mời sẽ hiện tại đây để Ban Chủ nhiệm duyệt và mở đăng ký.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {ds.map((t) => {
            const n = NHAN_THAM[t.status] ?? NHAN_THAM.DE_XUAT;
            return (
              <li
                key={t.id}
                className={`card p-4 ${t.status === "DE_XUAT" ? "ring-2 ring-amber-100" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${n.lop}`}
                    >
                      {n.ten}
                    </span>
                    <h2 className="mt-1.5 font-semibold text-navy-800">
                      {t.tieuDe}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-600">
                      <Link
                        href={`/doanh-nghiep/${t.member.slug}`}
                        className="hover:underline"
                      >
                        {tenDoanhNghiep(t.member.company)}
                      </Link>
                      {" · "}
                      {t.member.code}
                      {t.member.phone && (
                        <>
                          {" · "}
                          <a href={`tel:${t.member.phone}`} className="hover:underline">
                            {t.member.phone}
                          </a>
                        </>
                      )}
                    </p>
                    {t.diaChi && (
                      <p className="mt-0.5 text-sm text-slate-500">{t.diaChi}</p>
                    )}
                    {t.ngayMongMuon && (
                      <p className="mt-1 text-sm text-slate-500">
                        Chủ nhà mong muốn: {formatDate(t.ngayMongMuon)}
                      </p>
                    )}
                    {t.noiDungTham && (
                      <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
                        {t.noiDungTham}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatDateTime(t.createdAt)}
                  </span>
                </div>

                <div className="mt-4 border-t border-navy-100 pt-3">
                  <FormXuLyChuyen
                    id={t.id}
                    status={t.status}
                    ngayToChuc={t.ngayToChuc}
                    soLuongToiDa={t.soLuongToiDa}
                    ghiChuBCN={t.ghiChuBCN}
                  />
                </div>

                <div className="mt-4 border-t border-navy-100 pt-3">
                  <DanhSachDangKy
                    ds={t.dangKy.map((d) => ({
                      id: d.id,
                      name: d.name,
                      phone: d.phone,
                      company: d.company,
                      soNguoi: d.soNguoi,
                      ghiChu: d.ghiChu,
                      status: d.status,
                    }))}
                  />
                  <div className="mt-2">
                    <NutXoaChuyen id={t.id} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
