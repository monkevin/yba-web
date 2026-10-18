import Link from "next/link";
import type { Metadata } from "next";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import HienDan from "@/components/web/HienDan";
import {
  HANG_MUC_ICON,
  HANG_MUC_MO_TA,
  HUY_HIEU,
  THU_TU_HANG_MUC,
} from "@/lib/vinh-danh";

export const metadata: Metadata = {
  title: "Vinh danh hội viên",
  description: `Bảng vinh danh doanh nghiệp hội viên ${SITE.fullName} theo từng kỳ: doanh số giao thương, ưu tiên mua hàng hội viên và đóng góp kết nối.`,
};

export default async function VinhDanh({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const kySlug = typeof sp.ky === "string" ? sp.ky : "";

  const cacKy = await prisma.awardPeriod.findMany({
    where: { published: true },
    orderBy: { from: "desc" },
    select: { id: true, slug: true, name: true, from: true, to: true },
  });

  if (cacKy.length === 0) {
    return (
      <>
        <Hero />
        <section className="wrap py-16">
          <div className="card mx-auto max-w-2xl p-10 text-center">
            <span className="text-4xl">🏆</span>
            <h2 className="mt-3 font-bold text-navy-800">
              Chưa có kỳ vinh danh nào được công bố
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
              Ban Chủ nhiệm sẽ công bố bảng vinh danh vào cuối mỗi kỳ, dựa trên
              số liệu giao thương thực tế của hội viên.
            </p>
            <Link href="/xuc-tien-thuong-mai" className="btn-primary mt-6">
              Xem chỉ số xúc tiến thương mại
            </Link>
          </div>
        </section>
      </>
    );
  }

  const kyDangXem = cacKy.find((k) => k.slug === kySlug) ?? cacKy[0];

  const awards = await prisma.award.findMany({
    where: { periodId: kyDangXem.id },
    orderBy: [{ rank: "asc" }],
    include: {
      member: {
        select: {
          slug: true,
          company: true,
          name: true,
          position: true,
          logo: true,
          publicVisible: true,
          active: true,
        },
      },
    },
  });

  // Gom theo hạng mục, ba hạng mục chuẩn lên trước, hạng mục riêng xếp sau
  const theoHangMuc = new Map<string, typeof awards>();
  for (const a of awards) {
    if (!theoHangMuc.has(a.category)) theoHangMuc.set(a.category, []);
    theoHangMuc.get(a.category)!.push(a);
  }
  const thuTu = [
    ...THU_TU_HANG_MUC.filter((h) => theoHangMuc.has(h)),
    ...[...theoHangMuc.keys()].filter((h) => !THU_TU_HANG_MUC.includes(h)),
  ];

  return (
    <>
      <Hero />

      {cacKy.length > 1 && (
        <HienDan the="section" className="wrap mt-8">
          <div className="flex flex-wrap gap-2">
            {cacKy.map((k) => (
              <Link
                key={k.slug}
                href={k.slug === cacKy[0].slug ? "/vinh-danh" : `/vinh-danh?ky=${k.slug}`}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  k.id === kyDangXem.id
                    ? "bg-navy-600 text-white"
                    : "bg-navy-50 text-navy-700 hover:bg-navy-100"
                }`}
              >
                {k.name}
              </Link>
            ))}
          </div>
        </HienDan>
      )}

      <HienDan the="section" className="wrap mt-8">
        <p className="text-sm text-slate-500">
          Kỳ <strong className="text-navy-800">{kyDangXem.name}</strong> ·{" "}
          {formatDate(kyDangXem.from)} – {formatDate(kyDangXem.to)}
        </p>
      </HienDan>

      {thuTu.map((hangMuc) => {
        const ds = theoHangMuc.get(hangMuc)!;
        return (
          <HienDan the="section" key={hangMuc} className="wrap mt-12">
            <span className="eyebrow">
              {HANG_MUC_ICON[hangMuc] ?? "🎖️"} Hạng mục
            </span>
            <h2 className="section-title">{hangMuc}</h2>
            {HANG_MUC_MO_TA[hangMuc] && (
              <p className="mt-2 max-w-2xl text-slate-600">
                {HANG_MUC_MO_TA[hangMuc]}
              </p>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ds.map((a) => {
                const ten = tenDoanhNghiep(a.member.company);
                const huy = HUY_HIEU[a.rank];
                const xemDuocHoSo = a.member.active && a.member.publicVisible;

                const noiDung = (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-navy-50 ring-1 ring-navy-100">
                        {a.member.logo ? (
                          // Logo hội viên tải lên
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={a.member.logo}
                            alt=""
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-xl font-bold text-navy-300">
                            {ten.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        {huy && (
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${huy.lop}`}
                          >
                            {huy.nhan}
                          </span>
                        )}
                        <h3 className="mt-1.5 line-clamp-2 font-bold leading-snug text-navy-800">
                          {ten}
                        </h3>
                        <p className="mt-0.5 truncate text-sm text-slate-500">
                          {a.member.name}
                          {a.member.position ? ` · ${a.member.position}` : ""}
                        </p>
                      </div>
                    </div>

                    {a.metric && (
                      <p className="mt-4 rounded-lg bg-do-50 px-3 py-2 text-sm font-semibold text-do-700">
                        {a.metric}
                      </p>
                    )}
                    {a.note && (
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {a.note}
                      </p>
                    )}
                  </>
                );

                return xemDuocHoSo ? (
                  <Link
                    key={a.id}
                    href={`/doanh-nghiep/${a.member.slug}`}
                    className="tile p-5"
                  >
                    {noiDung}
                  </Link>
                ) : (
                  <div key={a.id} className="card p-5">
                    {noiDung}
                  </div>
                );
              })}
            </div>
          </HienDan>
        );
      })}

      <HienDan the="section" className="wrap mt-16">
        <div className="san-do relative overflow-hidden rounded-3xl px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-extrabold">
            Vinh danh dựa trên số liệu thật
          </h2>
          <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-white/85">
            Danh sách được tổng hợp từ các giao dịch giao thương đã qua ba bước:
            một bên khai báo, bên còn lại xác nhận, Ban Chủ nhiệm duyệt. Không có
            bình chọn cảm tính.
          </p>
          <Link href="/xuc-tien-thuong-mai" className="btn-cta mt-7">
            Xem chỉ số xúc tiến thương mại
          </Link>
        </div>
      </HienDan>
    </>
  );
}

function Hero() {
  return (
    <HienDan the="section" className="san-do luoi-ky-thuat relative overflow-hidden py-12 text-white">
      <div className="wrap">
        <p className="eyebrow text-do-300">Thi đua giao thương</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Vinh danh hội viên
        </h1>
        <p className="mt-3 max-w-3xl text-white/85">
          Ghi nhận những doanh nghiệp đóng góp nhiều nhất cho hoạt động giao
          thương của {SITE.fullName} trong từng kỳ.
        </p>
      </div>
    </HienDan>
  );
}
