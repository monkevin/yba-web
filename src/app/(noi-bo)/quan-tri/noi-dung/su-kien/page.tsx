import { requireQuyen } from "@/lib/auth";
import { QUYEN } from "@/lib/quyen";
import Link from "next/link";
import { SLUG_1010 } from "@/lib/checkin-1010";
import { PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { NutXoaSuKien } from "../Forms";
import NhapFile from "./NhapFile";

export default async function QuanTriSuKien({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireQuyen(QUYEN.SU_KIEN_QUAN_LY);

  const sp = await searchParams;
  const loc = typeof sp.loc === "string" ? sp.loc : "";

  const nay = new Date();
  const where =
    loc === "sap-toi"
      ? { startAt: { gte: nay } }
      : loc === "can-sua"
        ? { OR: [{ location: null }, { activityGroup: null }] }
        : {};

  const [ds, tong, sapToi, canSua] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { startAt: "desc" },
      include: {
        _count: { select: { registrations: true } },
        toChuc: { select: { id: true } },
      },
    }),
    prisma.event.count(),
    prisma.event.count({ where: { startAt: { gte: nay } } }),
    prisma.event.count({
      where: { OR: [{ location: null }, { activityGroup: null }] },
    }),
  ]);

  const TAB = [
    { key: "", label: "Tất cả", so: tong },
    { key: "sap-toi", label: "Sắp diễn ra", so: sapToi },
    { key: "can-sua", label: "Thiếu thông tin", so: canSua },
  ];

  return (
    <div>
      <PageHeader
        title="Sự kiện & chương trình"
        subtitle={`${tong} sự kiện · ${sapToi} sắp diễn ra`}
        action={
          <div className="flex gap-2">
            <Link href="/su-kien" className="btn-ghost">
              Xem trang công khai
            </Link>
            <Link href="/quan-tri/noi-dung/su-kien/moi" className="btn-primary">
              + Tạo sự kiện
            </Link>
          </div>
        }
      />

      <div className="mb-6">
        <NhapFile />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {TAB.map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/quan-tri/noi-dung/su-kien?loc=${t.key}` : "/quan-tri/noi-dung/su-kien"}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              t.key === loc
                ? "bg-navy-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-navy-100 hover:bg-navy-50"
            }`}
          >
            {t.label}
            <span
              className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                t.key === loc ? "bg-white/20" : "bg-slate-100 text-slate-500"
              }`}
            >
              {t.so}
            </span>
          </Link>
        ))}
      </div>

      {loc === "can-sua" && canSua > 0 && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Các sự kiện nhập tự động từ thư mục ảnh còn thiếu địa điểm hoặc mảng
          hoạt động. Bổ sung dần cho hồ sơ Chi hội đầy đủ hơn.
        </p>
      )}

      <ul className="space-y-3">
        {ds.map((e) => {
          const soAnh = (() => {
            if (!e.gallery) return 0;
            try {
              const a = JSON.parse(e.gallery);
              return Array.isArray(a) ? a.length : 0;
            } catch {
              return 0;
            }
          })();

          return (
            <li key={e.id} className="card flex flex-wrap items-start gap-4 p-4">
              <div className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-navy-50">
                {e.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.coverImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl opacity-50">📅</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {!e.published && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                      Đang ẩn
                    </span>
                  )}
                  {e.seriesName && <span className="chip">{e.seriesName}</span>}
                  {e.activityGroup && <span className="chip-do">{e.activityGroup}</span>}
                  {e.allowSignup && <span className="chip">Mở đăng ký</span>}
                </div>

                <Link
                  href={`/quan-tri/noi-dung/su-kien/${e.id}`}
                  className="mt-1.5 block font-semibold leading-snug text-navy-800 hover:text-do-600"
                >
                  {e.title}
                </Link>

                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(e.startAt)}
                  {e.endAt && ` – ${formatDate(e.endAt)}`}
                  {e.location ? ` · ${e.location}` : " · chưa có địa điểm"} ·{" "}
                  {soAnh} ảnh
                  {e._count.registrations > 0 &&
                    ` · ${e._count.registrations} đăng ký`}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                {e.slug !== SLUG_1010 && (
                  <Link
                    href={
                      e.toChuc
                        ? `/quan-tri/su-kien/${e.id}`
                        : `/quan-tri/su-kien/moi?eventId=${e.id}`
                    }
                    className="btn-ghost py-1.5"
                    title="Khách mời, check-in, Ban tổ chức, công việc, tài trợ, thu chi — ở Trung tâm sự kiện"
                  >
                    {e.toChuc ? "Tổ chức" : "+ Tổ chức"}
                  </Link>
                )}
                <Link
                  href={`/quan-tri/noi-dung/su-kien/${e.id}`}
                  className="btn-ghost py-1.5"
                >
                  Sửa
                </Link>
                <NutXoaSuKien id={e.id} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
