import Link from "next/link";
import LogoDoanhNghiep from "@/components/web/LogoDoanhNghiep";
import { prisma } from "@/lib/prisma";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { BAC_TAI_TRO, thuHangBac, tienGon } from "@/lib/tai-tro";

/**
 * Bảng vinh danh nhà tài trợ — gom toàn bộ lượt tài trợ đã ghi nhận theo từng
 * doanh nghiệp, xếp theo bậc cao nhất họ từng đạt rồi tới tổng giá trị.
 */
export default async function NhaTaiTro() {
  const ds = await prisma.taiTroSuKien.findMany({
    where: { trangThai: { not: "Huỷ" } },
    include: {
      member: { select: { slug: true, company: true, logo: true } },
    },
  });

  if (ds.length === 0) return null;

  // Gom theo doanh nghiệp (ưu tiên khớp hội viên, còn lại theo tên đã ghi)
  type Gom = {
    ten: string;
    slug: string | null;
    logo: string | null;
    company: string;
    tong: number;
    soLan: number;
    bacTot: number;
    suKien: Set<string>;
  };
  const bang = new Map<string, Gom>();

  for (const t of ds) {
    const khoa = t.member?.slug ?? t.nhaTaiTro.toLowerCase();
    const cu = bang.get(khoa);
    const hang = thuHangBac(t.mucTaiTro);
    if (cu) {
      cu.tong += t.giaTri;
      cu.soLan++;
      cu.bacTot = Math.min(cu.bacTot, hang);
      cu.suKien.add(t.suKien);
    } else {
      bang.set(khoa, {
        ten: t.member ? tenDoanhNghiep(t.member.company) : t.nhaTaiTro,
        slug: t.member?.slug ?? null,
        logo: t.member?.logo ?? null,
        company: t.member?.company ?? t.nhaTaiTro,
        tong: t.giaTri,
        soLan: 1,
        bacTot: hang,
        suKien: new Set([t.suKien]),
      });
    }
  }

  const tatCa = [...bang.values()].sort(
    (a, b) => a.bacTot - b.bacTot || b.tong - a.tong
  );
  const tongGiaTri = tatCa.reduce((s, x) => s + x.tong, 0);
  const soSuKien = new Set(ds.map((t) => t.suKien)).size;

  return (
    <section className="mt-16">
      <div className="text-center">
        <span className="eyebrow">Tri ân</span>
        <h2 className="section-title">Nhà tài trợ đồng hành cùng Chi hội</h2>
        <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-slate-600">
          {tatCa.length} doanh nghiệp đã đồng hành qua {soSuKien} chương trình, với
          tổng giá trị đóng góp {tienGon(tongGiaTri)} ₫. Chi hội trân trọng cảm ơn
          anh chị.
        </p>
      </div>

      <div className="mt-10 space-y-8">
        {BAC_TAI_TRO.map((bac, i) => {
          const nhom = tatCa.filter((x) => x.bacTot === i);
          if (nhom.length === 0) return null;

          return (
            <div key={bac.ten}>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r px-4 py-1.5 text-sm font-bold text-white ${bac.lop}`}
                >
                  {bac.icon} {bac.ten}
                </span>
                <span className="text-sm text-slate-500">
                  {nhom.length} nhà tài trợ
                </span>
              </div>

              <div
                className={`mt-4 grid gap-4 ${
                  i === 0
                    ? "sm:grid-cols-2 lg:grid-cols-3"
                    : "sm:grid-cols-3 lg:grid-cols-4"
                }`}
              >
                {nhom.map((x) => {
                  const ruot = (
                    <>
                      <div className="flex items-start gap-3">
                        <LogoDoanhNghiep
                          company={x.company}
                          logo={x.logo}
                          size={i === 0 ? "md" : "sm"}
                        />
                        <div className="min-w-0">
                          <p
                            className={`font-bold leading-snug text-navy-800 ${
                              i === 0 ? "text-base" : "text-sm"
                            }`}
                          >
                            {x.ten}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {x.soLan} lần đồng hành
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-do-700">
                        {tienGon(x.tong)} ₫
                      </p>
                    </>
                  );

                  return x.slug ? (
                    <Link
                      key={x.ten}
                      href={`/doanh-nghiep/${x.slug}`}
                      className={`tile p-4 ring-1 ${bac.vien}`}
                    >
                      {ruot}
                    </Link>
                  ) : (
                    <div key={x.ten} className={`card p-4 ring-1 ${bac.vien}`}>
                      {ruot}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 rounded-xl bg-navy-50 px-4 py-3 text-center text-xs leading-relaxed text-slate-600">
        Số liệu tổng hợp từ hồ sơ quyết toán các chương trình do Ban Chủ nhiệm
        lưu. Giá trị gồm cả hiện kim và hiện vật quy đổi.
      </p>
    </section>
  );
}
