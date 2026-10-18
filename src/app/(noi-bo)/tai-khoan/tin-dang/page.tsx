import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  LOAI_TIN_LABEL,
  TRANG_THAI_TIN,
  TRANG_THAI_TIN_CLASS,
  TRANG_THAI_TIN_LABEL,
  conLaiNgay,
} from "@/lib/listing";
import { prisma } from "@/lib/prisma";
import { firstImage } from "@/lib/public";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { NutAn, NutGiaHan, NutHien, NutXoaTin } from "./TinActions";

/** Hội viên quản lý tin nhu cầu của doanh nghiệp mình và xem ai quan tâm. */
export default async function TinDangCuaToi() {
  const user = await requireUserPage();

  if (!user.memberId) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Tin đăng của tôi" />
        <div className="card p-8 text-center">
          <h2 className="font-bold text-navy-800">
            Tài khoản chưa gắn hồ sơ doanh nghiệp
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Tài khoản <strong>{user.username}</strong> chưa gắn với hội viên nào
            nên chưa đăng tin được. Nhờ thư ký Chi hội gắn giúp ở Quản trị → Tài
            khoản.
          </p>
        </div>
      </div>
    );
  }

  const [tin, chuaXem] = await Promise.all([
    prisma.listing.findMany({
      where: { memberId: user.memberId },
      orderBy: [{ createdAt: "desc" }],
      include: {
        category: { select: { name: true, icon: true } },
        contacts: {
          orderBy: { createdAt: "desc" },
          include: {
            member: {
              select: { slug: true, company: true, name: true, phone: true, email: true },
            },
          },
        },
      },
    }),
    prisma.listingContact.count({
      where: { listing: { memberId: user.memberId }, seen: false },
    }),
  ]);

  const dangHien = tin.filter((t) => t.status === TRANG_THAI_TIN.DANG_HIEN).length;

  // Đã đọc tới đây coi như chủ tin đã xem — đánh dấu SAU khi đọc dữ liệu để lần
  // này vẫn thấy nhãn "MỚI", lần sau vào thì hết.
  if (chuaXem > 0) {
    await prisma.listingContact.updateMany({
      where: { listing: { memberId: user.memberId }, seen: false },
      data: { seen: true },
    });
  }

  return (
    <div>
      <PageHeader
        title="Tin đăng của tôi"
        subtitle={`${tin.length} tin · ${dangHien} đang hiển thị trên chợ giao thương`}
        action={
          <Link href="/tai-khoan/tin-dang/moi" className="btn-primary">
            + Đăng tin mới
          </Link>
        }
      />

      {chuaXem > 0 && (
        <p className="mb-4 rounded-lg bg-do-50 px-4 py-3 text-sm font-medium text-do-800 ring-1 ring-do-100">
          Có {chuaXem} lượt quan tâm mới tới tin của anh/chị — xem bên dưới và
          chủ động liên hệ lại nhé.
        </p>
      )}

      {tin.length === 0 ? (
        <div className="card p-10 text-center">
          <span className="text-4xl">🛒</span>
          <h2 className="mt-3 font-bold text-navy-800">Chưa đăng tin nào</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
            Đăng nhu cầu cần mua hoặc cần bán để cả Chi hội và khách ghé thăm
            ybacholon.vn nhìn thấy. Miễn phí, hiển thị 90 ngày.
          </p>
          <Link href="/tai-khoan/tin-dang/moi" className="btn-primary mt-6">
            Đăng tin đầu tiên
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {tin.map((t) => {
            const conLai = conLaiNgay(t.expiresAt);
            const hetHan = conLai !== null && conLai < 0;
            const anh = firstImage(t.images);

            return (
              <li key={t.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-start gap-4 p-4">
                  <div className="grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-lg bg-navy-50">
                    {anh ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={anh} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl opacity-50">
                        {t.category?.icon ?? "🤝"}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                          TRANG_THAI_TIN_CLASS[
                            hetHan && t.status === TRANG_THAI_TIN.DANG_HIEN
                              ? TRANG_THAI_TIN.HET_HAN
                              : t.status
                          ]
                        }`}
                      >
                        {
                          TRANG_THAI_TIN_LABEL[
                            hetHan && t.status === TRANG_THAI_TIN.DANG_HIEN
                              ? TRANG_THAI_TIN.HET_HAN
                              : t.status
                          ]
                        }
                      </span>
                      <span className="chip">{LOAI_TIN_LABEL[t.type]}</span>
                      {t.category && <span className="chip">{t.category.name}</span>}
                    </div>

                    <Link
                      href={`/giao-thuong/${t.slug}`}
                      className="mt-1.5 block font-semibold leading-snug text-navy-800 hover:text-do-600"
                    >
                      {t.title}
                    </Link>

                    <p className="mt-1 text-xs text-slate-500">
                      Đăng {formatDate(t.createdAt)} · {t.views} lượt xem ·{" "}
                      {t.contacts.length} người quan tâm
                      {conLai !== null &&
                        t.status === TRANG_THAI_TIN.DANG_HIEN &&
                        (hetHan
                          ? " · đã hết hạn hiển thị"
                          : ` · còn ${conLai} ngày`)}
                    </p>
                  </div>

                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    <Link
                      href={`/tai-khoan/tin-dang/${t.id}`}
                      className="btn-ghost py-1.5"
                    >
                      Sửa
                    </Link>
                    {hetHan && <NutGiaHan id={t.id} />}
                    {t.status === TRANG_THAI_TIN.DANG_HIEN ? (
                      <NutAn id={t.id} />
                    ) : (
                      <NutHien id={t.id} />
                    )}
                    <NutXoaTin id={t.id} />
                  </div>
                </div>

                {t.contacts.length > 0 && (
                  <div className="border-t border-navy-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Người quan tâm ({t.contacts.length})
                    </p>
                    <ul className="mt-2 space-y-2">
                      {t.contacts.map((c) => (
                        <li
                          key={c.id}
                          className={`rounded-lg bg-white p-3 text-sm ring-1 ${
                            c.seen ? "ring-slate-200" : "ring-do-200"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium text-navy-800">
                              {c.member ? (
                                <Link
                                  href={`/doanh-nghiep/${c.member.slug}`}
                                  className="hover:underline"
                                >
                                  {tenDoanhNghiep(c.member.company)}
                                </Link>
                              ) : (
                                (c.guestName ?? "Khách")
                              )}
                              {!c.seen && (
                                <span className="ml-2 inline-block rounded-full bg-do-500 px-1.5 py-0.5 align-middle text-[11px] font-bold text-white">
                                  MỚI
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatDateTime(c.createdAt)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {c.member?.name ?? c.guestName} ·{" "}
                            {c.member?.phone ?? c.guestPhone ?? "—"}
                            {(c.member?.email ?? c.guestEmail) &&
                              ` · ${c.member?.email ?? c.guestEmail}`}
                          </p>
                          {c.message && (
                            <p className="mt-1.5 leading-relaxed text-slate-700">
                              “{c.message}”
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
