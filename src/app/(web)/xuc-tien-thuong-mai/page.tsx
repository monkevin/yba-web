import Link from "next/link";
import type { Metadata } from "next";
import BarChart from "@/components/BarChart";
import KyChon from "@/components/web/KyChon";
import { SCOPE_CLASS, SCOPE_LABEL, SCOPE_SHORT } from "@/lib/deal";
import { formatShortVnd, formatVnd } from "@/lib/format";
import { resolvePeriod } from "@/lib/period";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import {
  byExternalOrg,
  byScope,
  monthlySeries,
  overview,
  quarterlySeries,
  topBuyers,
  topReferrers,
  topSellers,
  yearlySeries,
  type Ranking,
} from "@/lib/stats";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import HienDan from "@/components/web/HienDan";

export const metadata: Metadata = {
  title: "Chỉ số xúc tiến thương mại",
  description: `Giá trị giao thương của ${SITE.fullName}: nội bộ Chi hội, với chi hội bạn và với các hội doanh nhân khác. Số liệu tổng hợp từ giao dịch đã được Ban Chủ nhiệm duyệt.`,
};

export default async function XucTienThuongMai({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const ky = typeof sp.ky === "string" ? sp.ky : "nam-nay";
  const period = resolvePeriod(ky);

  const [
    stats,
    scopes,
    hoiBan,
    theoThang,
    theoQuy,
    theoNam,
    sellers,
    buyers,
    referrers,
    namCoDuLieu,
  ] = await Promise.all([
    overview(period),
    byScope(period),
    byExternalOrg(period, 8),
    monthlySeries(period),
    quarterlySeries(period),
    yearlySeries(period),
    topSellers(period, 10),
    topBuyers(period, 10),
    topReferrers(period, 10),
    prisma.deal.findMany({
      where: { status: "DA_DUYET" },
      select: { dealDate: true },
      distinct: ["dealDate"],
    }),
  ]);

  const cacNam = [...new Set(namCoDuLieu.map((d) => d.dealDate.getFullYear()))]
    .sort((a, b) => b - a)
    .slice(0, 4);

  // Kỳ dài thì xem theo năm / quý cho dễ đọc, kỳ ngắn thì theo tháng
  const bieuDo =
    ky === "tat-ca"
      ? { data: theoNam, nhan: "theo năm" }
      : ky === "thang-nay"
        ? { data: theoThang, nhan: "theo tháng" }
        : theoThang.length > 1
          ? { data: theoThang, nhan: "theo tháng" }
          : { data: theoQuy, nhan: "theo quý" };

  const coSoLieu = stats.count > 0;

  return (
    <>
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-12 text-white">
        <div className="wrap">
          <p className="eyebrow text-do-300">Xúc tiến thương mại</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Chỉ số giao thương Chi hội
          </h1>
          <p className="mt-3 max-w-3xl text-white/85">
            Giá trị giao thương thực tế giữa các doanh nghiệp hội viên với nhau,
            với chi hội bạn trong {SITE.parent}, và với các hội doanh nhân khác.
            Số liệu tổng hợp từ giao dịch đã được Ban Chủ nhiệm duyệt.
          </p>
        </div>
      </section>

      <HienDan the="section" className="wrap mt-8">
        <KyChon duongDan="/xuc-tien-thuong-mai" kyHienTai={ky} cacNam={cacNam} />
        <p className="mt-3 text-sm text-slate-500">
          Đang xem: <strong className="text-navy-800">{period.label}</strong>
        </p>
      </HienDan>

      {!coSoLieu ? (
        <HienDan the="section" className="wrap mt-8">
          <div className="card p-12 text-center">
            <span className="text-4xl">📈</span>
            <p className="mt-3 font-semibold text-navy-800">
              Chưa có giao dịch nào được duyệt trong {period.label.toLowerCase()}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Chọn kỳ khác ở trên, hoặc xem toàn bộ từ trước tới nay.
            </p>
            <Link href="/xuc-tien-thuong-mai?ky=tat-ca" className="btn-ghost mt-5">
              Xem từ trước tới nay
            </Link>
          </div>
        </HienDan>
      ) : (
        <>
          {/* ── Bốn con số lớn ─────────────────────────────────── */}
          <HienDan the="section" className="wrap mt-6">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Tổng giá trị giao thương",
                  value: `${formatShortVnd(stats.total)} ₫`,
                  hint: formatVnd(stats.total),
                  nhan: true,
                },
                {
                  label: "Số giao dịch ghi nhận",
                  value: String(stats.count),
                  hint: "đơn đã được duyệt",
                },
                {
                  label: "Doanh nghiệp tham gia",
                  value: `${stats.activeMembers}/${stats.memberCount}`,
                  hint: `${
                    stats.memberCount
                      ? Math.round((stats.activeMembers / stats.memberCount) * 100)
                      : 0
                  }% hội viên có phát sinh giao thương`,
                },
                {
                  label: "Cặp kết nối thành công",
                  value: String(stats.pairs),
                  hint: "số cặp doanh nghiệp đã mua bán với nhau",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`card p-5 ${s.nhan ? "ring-2 ring-do-200" : ""}`}
                >
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {s.label}
                  </dt>
                  <dd
                    className={`mt-1.5 text-2xl font-extrabold sm:text-3xl ${
                      s.nhan ? "text-do-700" : "text-navy-800"
                    }`}
                  >
                    {s.value}
                  </dd>
                  <dd className="mt-1 text-xs text-slate-500">{s.hint}</dd>
                </div>
              ))}
            </dl>
          </HienDan>

          {/* ── Ba cấp xúc tiến thương mại ─────────────────────── */}
          <HienDan the="section" className="wrap mt-14">
            <span className="eyebrow">Phân theo phạm vi</span>
            <h2 className="section-title">Giao thương ở ba cấp</h2>
            <p className="mt-2 max-w-3xl text-slate-600">
              Chi hội theo dõi riêng ba dòng giao thương: trong nội bộ Chi hội Chợ
              Lớn, với các chi hội bạn thuộc {SITE.parent}, và với các hội – hiệp
              hội doanh nhân khác.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {scopes.map((s) => (
                <div key={s.scope} className="card p-5">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${SCOPE_CLASS[s.scope]}`}
                  >
                    {SCOPE_SHORT[s.scope]}
                  </span>
                  <p className="mt-3 text-2xl font-extrabold text-navy-800">
                    {s.total ? `${formatShortVnd(s.total)} ₫` : "—"}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {s.count} giao dịch
                  </p>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy-50">
                    <div
                      className="h-full rounded-full bg-navy-500"
                      style={{ width: `${Math.max(s.share, 0)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-slate-500">
                    {s.share.toFixed(1)}% tổng giá trị · {SCOPE_LABEL[s.scope]}
                  </p>
                </div>
              ))}
            </div>
          </HienDan>

          {/* ── Biểu đồ ────────────────────────────────────────── */}
          <HienDan the="section" className="wrap mt-14">
            <span className="eyebrow">Diễn biến</span>
            <h2 className="section-title">
              Giá trị giao thương {bieuDo.nhan}
            </h2>
            <div className="card mt-6 overflow-hidden">
              <BarChart data={bieuDo.data} />
            </div>
          </HienDan>

          {/* ── Hội bạn ────────────────────────────────────────── */}
          {hoiBan.length > 0 && (
            <HienDan the="section" className="wrap mt-14">
              <span className="eyebrow">Kết nối bên ngoài</span>
              <h2 className="section-title">
                Chi hội &amp; hội bạn đã giao thương
              </h2>
              <div className="card mt-6 overflow-hidden">
                <ul className="divide-y divide-navy-100">
                  {hoiBan.map((h) => (
                    <li
                      key={h.org}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <span className="font-medium text-navy-800">{h.org}</span>
                      <span className="text-sm text-slate-600">
                        <strong className="text-navy-700">
                          {formatShortVnd(h.total)} ₫
                        </strong>{" "}
                        · {h.count} giao dịch
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </HienDan>
          )}

          {/* ── Bảng xếp hạng ──────────────────────────────────── */}
          <HienDan the="section" className="wrap mt-14">
            <span className="eyebrow">Thi đua</span>
            <h2 className="section-title">Bảng xếp hạng {period.label.toLowerCase()}</h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <BangXepHang
                title="Bán ra nhiều nhất"
                mo="Doanh nghiệp cung cấp hàng hoá, dịch vụ cho hội viên khác"
                rows={sellers}
              />
              <BangXepHang
                title="Mua vào nhiều nhất"
                mo="Doanh nghiệp ưu tiên mua hàng của hội viên trong Hội"
                rows={buyers}
              />
              <BangXepHang
                title="Kết nối nhiều nhất"
                mo="Hội viên đứng ra giới thiệu, kết nối hai bên gặp nhau"
                rows={referrers}
              />
            </div>
          </HienDan>
        </>
      )}

      <HienDan the="section" className="wrap mt-16">
        <div className="san-do relative overflow-hidden rounded-3xl px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-extrabold">
            Số liệu này đến từ đâu?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-white/85">
            Mỗi giao dịch do một bên khai báo, bên còn lại xác nhận, rồi Ban Chủ
            nhiệm duyệt mới được tính. Nhờ vậy con số phản ánh giao thương có
            thật, không phải ước lượng.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/vinh-danh" className="btn-cta">
              Xem bảng vinh danh
            </Link>
            <Link href="/giao-dich/moi" className="btn-cta-ghost">
              Hội viên khai giao dịch
            </Link>
          </div>
        </div>
      </HienDan>
    </>
  );
}

function BangXepHang({
  title,
  mo,
  rows,
}: {
  title: string;
  mo: string;
  rows: Ranking[];
}) {
  const HANG = ["bg-vang-500 text-white", "bg-slate-400 text-white", "bg-amber-700 text-white"];

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-navy-100 px-5 py-4">
        <h3 className="font-bold text-navy-800">{title}</h3>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{mo}</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-500">
          Chưa có số liệu trong kỳ.
        </p>
      ) : (
        <ol className="divide-y divide-navy-100">
          {rows.map((r, i) => (
            <li key={r.memberId} className="flex items-center gap-3 px-4 py-3">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  HANG[i] ?? "bg-navy-50 text-navy-600"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <Link
                  href={`/doanh-nghiep/${r.slug}`}
                  className="line-clamp-1 text-sm font-medium text-navy-800 hover:text-do-600"
                >
                  {tenDoanhNghiep(r.company)}
                </Link>
                <span className="block text-xs text-slate-500">
                  {r.count} giao dịch
                  {r.partners > 0 && ` · ${r.partners} đối tác`}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-navy-700">
                {formatShortVnd(r.total)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
