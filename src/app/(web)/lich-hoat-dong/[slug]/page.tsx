import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import LogoDoanhNghiep from "@/components/web/LogoDoanhNghiep";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { tienGon } from "@/lib/tai-tro";
import FormDangKy from "../FormDangKy";

export const dynamic = "force-dynamic";

const NGUON: Record<string, string> = {
  CHI_HOI: "Chi hội Chợ Lớn",
  HOI: "Hội Doanh nhân trẻ TP.HCM",
  DOI_TAC: "Đối tác",
};

async function napHoatDong(slug: string) {
  return prisma.lichHoatDong.findFirst({
    where: { slug, published: true },
    include: {
      dangKy: {
        where: { status: "DA_DUYET" },
        orderBy: [{ loai: "asc" }, { soTien: "desc" }, { createdAt: "asc" }],
        include: {
          member: { select: { slug: true, company: true, logo: true } },
        },
      },
      _count: {
        select: {
          dangKy: { where: { status: { not: "TU_CHOI" }, loai: "THAM_GIA" } },
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = await napHoatDong(slug);
  if (!m) return { title: "Không tìm thấy hoạt động" };
  return {
    title: m.tieuDe,
    description:
      m.moTa ?? `${m.tieuDe} — hoạt động của ${SITE.fullName} ngày ${formatDate(m.tuNgay)}.`,
    openGraph: { images: m.anhBia ? [m.anhBia] : undefined },
  };
}

export default async function ChiTietHoatDong({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [m, user] = await Promise.all([napHoatDong(slug), getCurrentUser()]);
  if (!m) notFound();

  const hoiVien = user?.memberId
    ? await prisma.member.findUnique({
        where: { id: user.memberId },
        select: {
          name: true,
          phone: true,
          email: true,
          company: true,
          position: true,
        },
      })
    : null;

  const conCho = m.soLuongToiDa
    ? Math.max(0, m.soLuongToiDa - m._count.dangKy)
    : null;
  const hetHan = !!m.hanDangKy && m.hanDangKy < new Date();
  const daQua = m.tuNgay < new Date(new Date().setHours(0, 0, 0, 0));

  const thamGia = m.dangKy.filter((d) => d.loai === "THAM_GIA");
  const taiTro = m.dangKy.filter((d) => d.loai === "TAI_TRO");
  const tongNguoi = thamGia.reduce((s, d) => s + d.soNguoi, 0);

  return (
    <>
      {/* ── Đầu trang ────────────────────────────────────────────── */}
      <section className="san-do luoi-ky-thuat relative overflow-hidden text-white">
        {m.anhBia && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.anhBia}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/85 to-navy-900/40"
            />
          </>
        )}
        <div className="wrap relative py-12">
          <nav className="text-sm text-white/60">
            <Link href="/lich-hoat-dong" className="hover:text-white">
              Lịch hoạt động
            </Link>
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              {NGUON[m.nguon] ?? m.nguon}
            </span>
            {m.noiBat && (
              <span className="rounded-full bg-do-600 px-3 py-1 text-xs font-bold">
                Nổi bật
              </span>
            )}
            {daQua && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                Đã diễn ra
              </span>
            )}
          </div>

          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {m.tieuDe}
          </h1>
          {m.moTa && (
            <p className="mt-3 max-w-2xl leading-relaxed text-white/85">{m.moTa}</p>
          )}

          <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
            {[
              [
                "Thời gian",
                `${formatDate(m.tuNgay)}${m.denNgay ? ` – ${formatDate(m.denNgay)}` : ""}${m.gioText ? ` · ${m.gioText}` : ""}`,
              ],
              ["Địa điểm", m.diaDiem ?? "Cập nhật sau"],
              m.banToChuc ? ["Ban tổ chức", m.banToChuc] : null,
            ]
              .filter((x): x is [string, string] => x !== null)
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-do-300">
                    {k}
                  </dt>
                  <dd className="mt-1 font-semibold">{v}</dd>
                </div>
              ))}
          </dl>
        </div>
      </section>

      <div className="wrap py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          {/* ── Nội dung chương trình ──────────────────────────── */}
          <article>
            {m.noiDung ? (
              <section>
                <h2 className="text-xl font-bold text-navy-800">
                  Nội dung chương trình
                </h2>
                <div className="mt-4 space-y-3 leading-relaxed text-slate-700">
                  {m.noiDung.split(/\n{2,}/).map((d, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {d}
                    </p>
                  ))}
                </div>
              </section>
            ) : (
              <div className="card px-4 py-10 text-center text-sm leading-relaxed text-slate-500">
                Nội dung chi tiết đang được Ban Tổ chức cập nhật. Anh/chị vẫn
                đăng ký được ở ô bên cạnh.
              </div>
            )}

            {m.yNghia && (
              <section className="mt-10 rounded-2xl bg-navy-50 p-6">
                <h2 className="text-lg font-bold text-navy-800">
                  Ý nghĩa chương trình
                </h2>
                <div className="mt-3 space-y-3 leading-relaxed text-slate-700">
                  {m.yNghia.split(/\n{2,}/).map((d, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {d}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {/* ── Nhà tài trợ đã xác nhận ──────────────────────── */}
            {m.hienDanhSach && taiTro.length > 0 && (
              <section className="mt-12">
                <h2 className="text-xl font-bold text-navy-800">
                  Nhà tài trợ đồng hành
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    {taiTro.length} đơn vị
                  </span>
                </h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {taiTro.map((d) => {
                    const ten = d.member
                      ? tenDoanhNghiep(d.member.company)
                      : (d.company ?? d.name);
                    const ruot = (
                      <>
                        <LogoDoanhNghiep
                          company={d.member?.company ?? d.company ?? d.name}
                          logo={d.member?.logo ?? null}
                          size="sm"
                        />
                        <span className="min-w-0">
                          <span className="block font-semibold leading-snug text-navy-800">
                            {ten}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {[
                              d.mucTaiTro,
                              d.soTien > 0 ? `${tienGon(d.soTien)} ₫` : null,
                              d.hienVat,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                      </>
                    );
                    return d.member ? (
                      <Link
                        key={d.id}
                        href={`/doanh-nghiep/${d.member.slug}`}
                        className="tile flex items-start gap-3 p-4"
                      >
                        {ruot}
                      </Link>
                    ) : (
                      <div key={d.id} className="card flex items-start gap-3 p-4">
                        {ruot}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Người đã đăng ký tham gia ────────────────────── */}
            {m.hienDanhSach && thamGia.length > 0 && (
              <section className="mt-12">
                <h2 className="text-xl font-bold text-navy-800">
                  Đã xác nhận tham gia
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    {thamGia.length} đăng ký · {tongNguoi} người
                  </span>
                </h2>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {thamGia.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center gap-3 rounded-xl bg-navy-50 px-4 py-2.5"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy-700 text-xs font-bold text-white">
                        {d.name.trim().split(/\s+/).slice(-1)[0].charAt(0)}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-snug text-navy-800">
                          {d.name}
                          {d.soNguoi > 1 && (
                            <span className="ml-1 text-xs font-normal text-slate-500">
                              {`(+${d.soNguoi - 1} người)`}
                            </span>
                          )}
                        </span>
                        {(d.company || d.member) && (
                          <span className="block truncate text-xs text-slate-500">
                            {d.member
                              ? tenDoanhNghiep(d.member.company)
                              : d.company}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>

          {/* ── Cột đăng ký ─────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-24">
            <div className="card p-6">
              <h2 className="text-lg font-bold text-navy-800">
                {daQua ? "Hoạt động đã diễn ra" : "Đăng ký tham gia"}
              </h2>

              {daQua ? (
                <>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Chương trình này đã kết thúc. Anh/chị xem các hoạt động sắp
                    tới để không bỏ lỡ.
                  </p>
                  <Link href="/lich-hoat-dong" className="btn-primary mt-5 w-full">
                    Xem lịch sắp tới
                  </Link>
                </>
              ) : !m.choDangKy ? (
                <>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Hoạt động này chưa mở đăng ký trên website. Anh/chị liên hệ
                    Ban Tổ chức để biết thêm.
                  </p>
                  {m.lienHe && (
                    <p className="mt-3 rounded-lg bg-navy-50 px-3 py-2 text-sm text-slate-700">
                      {m.lienHe}
                    </p>
                  )}
                  <Link href="/lien-he" className="btn-ghost mt-4 w-full">
                    Liên hệ Chi hội
                  </Link>
                </>
              ) : (
                <>
                  <p className="mb-5 mt-1 text-sm leading-relaxed text-slate-600">
                    {hoiVien
                      ? "Thông tin đã điền sẵn từ hồ sơ hội viên."
                      : "Anh/chị điền thông tin để Ban Tổ chức liên hệ lại."}
                    {m.hanDangKy && !hetHan && (
                      <> Hạn đăng ký: {formatDate(m.hanDangKy)}.</>
                    )}
                  </p>

                  <FormDangKy
                    lichId={m.id}
                    conCho={conCho}
                    hetHan={hetHan}
                    hoiVien={
                      hoiVien
                        ? {
                            name: hoiVien.name,
                            phone: hoiVien.phone ?? "",
                            email: hoiVien.email ?? "",
                            company: tenDoanhNghiep(hoiVien.company),
                            chucVu: hoiVien.position ?? "",
                          }
                        : null
                    }
                  />

                  {!user && (
                    <p className="mt-4 border-t border-navy-100 pt-4 text-xs leading-relaxed text-slate-500">
                      Là hội viên?{" "}
                      <Link
                        href={`/login?tiep=/lich-hoat-dong/${m.slug}`}
                        className="font-semibold text-navy-600 hover:underline"
                      >
                        Đăng nhập
                      </Link>{" "}
                      để hệ thống điền sẵn thông tin.
                    </p>
                  )}
                </>
              )}

              {m.lienHe && !daQua && m.choDangKy && (
                <p className="mt-4 border-t border-navy-100 pt-4 text-sm leading-relaxed text-slate-600">
                  <strong className="text-navy-800">Liên hệ Ban Tổ chức:</strong>{" "}
                  {m.lienHe}
                </p>
              )}
            </div>
          </aside>
        </div>

        <div className="mt-12">
          <Link href="/lich-hoat-dong" className="btn-ghost">
            ← Về lịch hoạt động
          </Link>
        </div>
      </div>
    </>
  );
}
