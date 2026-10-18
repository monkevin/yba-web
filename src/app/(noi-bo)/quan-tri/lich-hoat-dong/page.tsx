import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireQuyen } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { QUYEN } from "@/lib/quyen";
import { FormMuc, NutXoaMuc, DanhSachDangKy } from "./Forms";

const NGUON: Record<string, string> = {
  CHI_HOI: "Chi hội Chợ Lớn",
  HOI: "Hội DNT TP.HCM",
  DOI_TAC: "Đối tác",
};

export default async function QuanTriLich() {
  await requireQuyen(QUYEN.SU_KIEN_QUAN_LY);

  const dauNgay = new Date();
  dauNgay.setHours(0, 0, 0, 0);

  const [ds, sapToi, choDuyet] = await Promise.all([
    prisma.lichHoatDong.findMany({
      orderBy: [{ tuNgay: "desc" }, { order: "asc" }],
      take: 200,
      include: {
        dangKy: {
          orderBy: [{ status: "asc" }, { createdAt: "asc" }],
          include: { member: { select: { code: true } } },
        },
      },
    }),
    prisma.lichHoatDong.count({
      where: { published: true, tuNgay: { gte: dauNgay } },
    }),
    prisma.dangKyHoatDong.count({ where: { status: "CHO_DUYET" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Lịch hoạt động"
        subtitle={`${ds.length} hoạt động đã lưu · ${sapToi} sắp diễn ra đang hiện trên web${choDuyet > 0 ? ` · ${choDuyet} đăng ký chờ duyệt` : ""}`}
        action={
          <Link href="/lich-hoat-dong" className="btn-ghost">
            Xem trang công khai
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:items-start">
        <div>
          {ds.length === 0 ? (
            <div className="card p-12 text-center">
              <span className="text-4xl">🗓️</span>
              <h2 className="mt-3 font-bold text-navy-800">Lịch còn trống</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                Thêm hoạt động ở ô bên cạnh — mục sắp diễn ra sẽ tự hiện lên
                trang chủ và trang Lịch hoạt động.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {ds.map((m) => {
                const daQua = m.tuNgay < dauNgay;
                return (
                  <li
                    key={m.id}
                    className={`card p-4 ${daQua ? "opacity-60" : ""} ${
                      m.noiBat ? "border-do-200" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                              m.published
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : "bg-slate-100 text-slate-600 ring-slate-200"
                            }`}
                          >
                            {m.published ? "Đang hiện" : "Đang ẩn"}
                          </span>
                          <span className="chip">{NGUON[m.nguon] ?? m.nguon}</span>
                          {m.noiBat && <span className="chip-do">Nổi bật</span>}
                          {daQua && (
                            <span className="text-xs text-slate-400">đã qua</span>
                          )}
                        </div>

                        <h2 className="mt-1.5 font-semibold text-navy-800">
                          {m.tieuDe}
                        </h2>
                        <p className="mt-0.5 text-sm text-slate-600">
                          {formatDate(m.tuNgay)}
                          {m.denNgay && ` – ${formatDate(m.denNgay)}`}
                          {m.gioText && ` · ${m.gioText}`}
                        </p>
                        {m.diaDiem && (
                          <p className="mt-0.5 text-sm text-slate-500">
                            📍 {m.diaDiem}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <FormMuc
                          muc={{
                            id: m.id,
                            tieuDe: m.tieuDe,
                            moTa: m.moTa,
                            noiDung: m.noiDung,
                            yNghia: m.yNghia,
                            banToChuc: m.banToChuc,
                            lienHe: m.lienHe,
                            tuNgay: m.tuNgay,
                            denNgay: m.denNgay,
                            diaDiem: m.diaDiem,
                            gioText: m.gioText,
                            nguon: m.nguon,
                            lienKet: m.lienKet,
                            noiBat: m.noiBat,
                            published: m.published,
                            order: m.order,
                            choDangKy: m.choDangKy,
                            soLuongToiDa: m.soLuongToiDa,
                            hanDangKy: m.hanDangKy,
                            hienDanhSach: m.hienDanhSach,
                          }}
                        />
                        <NutXoaMuc id={m.id} />
                      </div>
                    </div>

                    {/* Danh sách đăng ký tham gia / tài trợ của hoạt động này */}
                    <div className="mt-3 border-t border-navy-100 pt-3">
                      <DanhSachDangKy
                        lichId={m.id}
                        ds={m.dangKy.map((d) => ({
                          id: d.id,
                          name: d.name,
                          phone: d.phone,
                          email: d.email,
                          company: d.company,
                          chucVu: d.chucVu,
                          loai: d.loai,
                          soNguoi: d.soNguoi,
                          mucTaiTro: d.mucTaiTro,
                          soTien: d.soTien,
                          hienVat: d.hienVat,
                          ghiChu: d.ghiChu,
                          status: d.status,
                          doBTCThem: d.doBTCThem,
                          maHoiVien: d.member?.code ?? null,
                        }))}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card p-5 lg:sticky lg:top-24">
          <h2 className="mb-4 font-bold text-navy-800">Thêm hoạt động mới</h2>
          <FormMuc />
        </div>
      </div>
    </div>
  );
}
