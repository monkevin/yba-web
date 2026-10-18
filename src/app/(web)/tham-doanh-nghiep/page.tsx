import Link from "next/link";
import type { Metadata } from "next";
import LogoDoanhNghiep from "@/components/web/LogoDoanhNghiep";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { NHAN_THAM, thamCongKhai, conCho } from "@/lib/tham-dn";
import { FormMoiDenTham } from "./Forms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Đi thăm doanh nghiệp hội viên",
  description: `Chương trình tham quan doanh nghiệp hội viên của ${SITE.fullName} — học hỏi mô hình vận hành thực tế và mở cơ hội hợp tác.`,
};

export default async function ThamDoanhNghiep() {
  const user = await getCurrentUser();

  const [ds, hoiVien] = await Promise.all([
    prisma.thamDoanhNghiep.findMany({
      where: thamCongKhai(),
      orderBy: [{ ngayToChuc: "asc" }, { createdAt: "desc" }],
      include: {
        member: { select: { slug: true, company: true, logo: true, district: true } },
        _count: { select: { dangKy: { where: { status: { not: "HUY" } } } } },
      },
    }),
    user?.memberId
      ? prisma.member.findUnique({
          where: { id: user.memberId },
          select: { company: true, address: true },
        })
      : null,
  ]);

  const dangMo = ds.filter((t) => t.status === "DA_DUYET");
  const khac = ds.filter((t) => t.status !== "DA_DUYET");

  return (
    <>
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-14 text-white">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-do-600/25 blur-2xl"
        />
        <div className="wrap relative">
          <p className="eyebrow text-do-300">Hoạt động Chi hội</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Đi thăm doanh nghiệp hội viên
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-white/85">
            Đến tận nơi xem cách anh chị em trong Hội vận hành: nhà xưởng, kho
            bãi, showroom, quy trình quản trị. Vừa học được cách làm thật, vừa mở
            ra cơ hội hợp tác giữa hội viên với nhau.
          </p>
        </div>
      </section>

      <div className="wrap py-10">
        {/* Ba bước để hội viên hiểu ngay cách chương trình vận hành */}
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            {
              so: "01",
              ten: "Doanh nghiệp mời",
              mo: "Hội viên gửi lời mời Chi hội đến thăm, nêu rõ muốn chia sẻ điều gì với đoàn.",
            },
            {
              so: "02",
              ten: "Ban Chủ nhiệm duyệt",
              mo: "Ban Chủ nhiệm chốt lịch và mở đăng ký cho toàn thể hội viên.",
            },
            {
              so: "03",
              ten: "Hội viên đăng ký đi",
              mo: "Ai quan tâm bấm đăng ký; Chi hội chốt danh sách và tổ chức chuyến đi.",
            },
          ].map((b) => (
            <div key={b.so} className="card p-5">
              <span className="text-2xl font-extrabold text-do-200">{b.so}</span>
              <h2 className="mt-1 font-bold text-navy-800">{b.ten}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {b.mo}
              </p>
            </div>
          ))}
        </section>

        {/* Lời mời từ hội viên */}
        <section className="mt-10">
          {user?.memberId ? (
            <FormMoiDenTham
              banDau={
                hoiVien
                  ? {
                      company: tenDoanhNghiep(hoiVien.company),
                      diaChi: hoiVien.address ?? "",
                    }
                  : null
              }
            />
          ) : (
            <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <h2 className="font-bold text-navy-800">
                  Anh/chị muốn đón Chi hội tới thăm doanh nghiệp mình?
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Hội viên đăng nhập để gửi lời mời tới Ban Chủ nhiệm.
                </p>
              </div>
              <Link
                href="/login?tiep=/tham-doanh-nghiep"
                className="btn-primary shrink-0"
              >
                Đăng nhập hội viên
              </Link>
            </div>
          )}
        </section>

        {/* Đang mở đăng ký */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-navy-800">
            Chuyến đang mở đăng ký
          </h2>
          {dangMo.length === 0 ? (
            <div className="card mt-4 px-4 py-10 text-center text-sm text-slate-500">
              Hiện chưa có chuyến nào đang mở. Anh/chị theo dõi trang này hoặc
              fanpage Chi hội để không bỏ lỡ.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {dangMo.map((t) => (
                <TheChuyen key={t.id} t={t} />
              ))}
            </div>
          )}
        </section>

        {khac.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-navy-800">
              Các chuyến khác
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {khac.map((t) => (
                <TheChuyen key={t.id} t={t} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

type Chuyen = {
  slug: string;
  tieuDe: string;
  gioiThieu: string | null;
  status: string;
  ngayToChuc: Date | null;
  ngayMongMuon: Date | null;
  soLuongToiDa: number | null;
  member: {
    slug: string;
    company: string;
    logo: string | null;
    district: string | null;
  };
  _count: { dangKy: number };
};

function TheChuyen({ t }: { t: Chuyen }) {
  const n = NHAN_THAM[t.status] ?? NHAN_THAM.DE_XUAT;
  const con = conCho(t.soLuongToiDa, t._count.dangKy);
  const ngay = t.ngayToChuc ?? t.ngayMongMuon;

  return (
    <Link href={`/tham-doanh-nghiep/${t.slug}`} className="tile flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <LogoDoanhNghiep company={t.member.company} logo={t.member.logo} size="sm" />
        <div className="min-w-0">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${n.lop}`}
          >
            {n.ten}
          </span>
          <p className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-navy-800">
            {tenDoanhNghiep(t.member.company)}
          </p>
        </div>
      </div>

      <h3 className="mt-3 line-clamp-2 font-semibold leading-snug text-navy-800">
        {t.tieuDe}
      </h3>
      {t.gioiThieu && (
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {t.gioiThieu}
        </p>
      )}

      <dl className="mt-3 space-y-1 text-sm">
        {ngay && (
          <div className="flex gap-2">
            <dt className="text-slate-500">Thời gian:</dt>
            <dd className="font-medium text-navy-700">{formatDate(ngay)}</dd>
          </div>
        )}
        {t.member.district && (
          <div className="flex gap-2">
            <dt className="text-slate-500">Khu vực:</dt>
            <dd className="text-slate-700">{t.member.district}</dd>
          </div>
        )}
      </dl>

      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-slate-500">
        <span>{t._count.dangKy} người đã đăng ký</span>
        {con !== null && (
          <span className={con === 0 ? "font-semibold text-do-600" : ""}>
            {con === 0 ? "Hết chỗ" : `Còn ${con} chỗ`}
          </span>
        )}
      </div>
    </Link>
  );
}
