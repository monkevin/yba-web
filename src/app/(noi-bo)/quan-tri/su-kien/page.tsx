import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import { SLUG_1010 } from "@/lib/checkin-1010";
import { prisma } from "@/lib/prisma";
import { LOP_TONG, TRANG_THAI_SU_KIEN, gioVN, ngayVN, nhanLuaChon, tongLuaChon } from "@/lib/trung-tam-sk/bang";
import { LOAI_SU_KIEN, THONG_TIN_QUY_MO, type QuyMo } from "@/lib/trung-tam-sk/mau";
import { quyenSk } from "@/lib/trung-tam-sk/may-chu";

type TheSk = {
  id: string;
  loai: string;
  quyMo: string;
  trangThai: string;
  event: { id: string; title: string; startAt: Date; location: string | null };
  _count: { khach: number };
};

function TheSuKien({
  d,
  href,
  xacNhan,
  daDen,
  tre,
  now,
}: {
  d: TheSk;
  href: string;
  xacNhan: number;
  daDen: number;
  tre: number;
  now: Date;
}) {
  const soNgay = Math.ceil((d.event.startAt.getTime() - now.getTime()) / 86_400_000);
  return (
    <Link href={href} className="card block p-4 transition hover:ring-navy-300">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${LOP_TONG[tongLuaChon(TRANG_THAI_SU_KIEN, d.trangThai)]}`}>
          {nhanLuaChon(TRANG_THAI_SU_KIEN, d.trangThai)}
        </span>
        <span className="rounded-full bg-nga-100 px-2 py-0.5 text-xs text-navy-700">
          {LOAI_SU_KIEN.find((l) => l.value === d.loai)?.label ?? "Khác"} · Quy mô{" "}
          {THONG_TIN_QUY_MO[d.quyMo as QuyMo]?.label.toLowerCase() ?? d.quyMo}
        </span>
        {soNgay >= 0 && soNgay <= 60 && (
          <span className="ml-auto text-xs font-semibold text-do-600">{soNgay === 0 ? "Hôm nay" : `Còn ${soNgay} ngày`}</span>
        )}
      </div>
      <h3 className="mt-2 font-bold text-navy-800">{d.event.title}</h3>
      <p className="text-sm text-slate-500">
        {gioVN(d.event.startAt)} · {ngayVN(d.event.startAt)}
        {d.event.location ? ` · ${d.event.location}` : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
        <span>
          <b className="text-navy-800">{xacNhan}</b>/{d._count.khach} khách xác nhận
        </span>
        <span>
          <b className="text-navy-800">{daDen}</b> đã check-in
        </span>
        {tre > 0 && <span className="font-semibold text-do-600">{tre} việc trễ hạn</span>}
      </div>
    </Link>
  );
}

/**
 * TRUNG TÂM SỰ KIỆN — danh sách sự kiện đang quản lý tổ chức, sự kiện sắp
 * tới chưa bật quản lý, và lưu trữ công cụ riêng của Lễ chuyển giao 10/10.
 */
export default async function TrungTamSuKien() {
  const user = await requireUserPage();
  const q = quyenSk(user);
  if (!q.vao) redirect("/quan-tri?thieu-quyen=1");

  const homQua = new Date(new Date().getTime() - 36 * 3600_000);
  const [ds, chuaQuanLy] = await Promise.all([
    prisma.skSuKien.findMany({
      include: {
        event: { select: { id: true, title: true, startAt: true, location: true, published: true } },
        _count: { select: { khach: true } },
      },
      orderBy: { event: { startAt: "asc" } },
    }),
    q.quanLy
      ? prisma.event.findMany({
          where: { startAt: { gte: homQua }, toChuc: null, slug: { not: SLUG_1010 } },
          select: { id: true, title: true, startAt: true, location: true },
          orderBy: { startAt: "asc" },
          take: 10,
        })
      : Promise.resolve([]),
  ]);

  // Số liệu nhanh cho từng thẻ: khách đã xác nhận, đã đến, việc trễ hạn
  const skIds = ds.map((d) => d.id);
  const now = new Date();
  const [xacNhan, daDen, tre] = await Promise.all([
    prisma.skThamDu.findMany({
      where: { xacNhan: "CO", khach: { skId: { in: skIds } } },
      select: { khachId: true, khach: { select: { skId: true } } },
    }),
    prisma.skThamDu.findMany({
      where: { checkinLuc: { not: null }, khach: { skId: { in: skIds } } },
      select: { khachId: true, khach: { select: { skId: true } } },
    }),
    prisma.skViec.groupBy({
      by: ["skId"],
      where: { skId: { in: skIds }, trangThai: { not: "XONG" }, hanChot: { lt: now } },
      _count: { _all: true },
    }),
  ]);
  const dem = (rows: { khachId: string; khach: { skId: string } }[]) => {
    const m = new Map<string, Set<string>>();
    for (const r of rows) m.set(r.khach.skId, (m.get(r.khach.skId) ?? new Set()).add(r.khachId));
    return m;
  };
  const mXn = dem(xacNhan);
  const mDen = dem(daDen);
  const mTre = new Map(tre.map((t) => [t.skId, t._count._all]));

  const sapToi = ds.filter((d) => d.event.startAt >= homQua && d.trangThai !== "HUY");
  const daQua = ds.filter((d) => !sapToi.includes(d)).reverse();
  const chiCheckin = q.checkin && !q.quanLy && !q.taiChinh;

  return (
    <div>
      <PageHeader
        title="Trung tâm sự kiện"
        subtitle="Tổ chức mọi sự kiện của Chi hội ở một nơi: khách mời, check-in, Ban tổ chức, công việc, kịch bản, tài trợ, thu chi, báo cáo."
        action={
          q.quanLy || q.taiChinh ? (
            <div className="flex flex-wrap gap-2">
              <Link href="/quan-tri/su-kien/bao-cao-nam" className="btn-ghost">
                Báo cáo năm
              </Link>
              {q.quanLy && (
                <Link href="/quan-tri/su-kien/moi" className="btn-primary">
                  + Tạo sự kiện
                </Link>
              )}
            </div>
          ) : undefined
        }
      />

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-navy-700">Đang &amp; sắp diễn ra</h2>
      {sapToi.length === 0 ? (
        <div className="card mb-8 p-10 text-center">
          <span className="text-4xl">🎪</span>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">
            Chưa có sự kiện nào sắp diễn ra.
            {q.quanLy && " Bấm “Tạo sự kiện”, chọn loại và quy mô — hệ thống sinh sẵn phiên, Ban tổ chức, công việc theo mốc D-x, kịch bản, hậu cần và dự trù chi."}
          </p>
        </div>
      ) : (
        <div className="mb-8 grid gap-3 md:grid-cols-2">
          {sapToi.map((d) => (
            <TheSuKien
              key={d.id}
              d={d}
              href={chiCheckin ? `/quan-tri/su-kien/${d.event.id}/check-in` : `/quan-tri/su-kien/${d.event.id}`}
              xacNhan={mXn.get(d.id)?.size ?? 0}
              daDen={mDen.get(d.id)?.size ?? 0}
              tre={mTre.get(d.id) ?? 0}
              now={now}
            />
          ))}
        </div>
      )}

      {chuaQuanLy.length > 0 && (
        <>
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-navy-700">
            Sự kiện sắp tới chưa quản lý tổ chức
          </h2>
          <p className="mb-3 text-sm text-slate-500">Đã có ở mục “Sự kiện &amp; chương trình”. Bật để dùng các công cụ tổ chức.</p>
          <ul className="card mb-8 divide-y divide-slate-100">
            {chuaQuanLy.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <div className="font-medium text-navy-800">{e.title}</div>
                  <div className="text-xs text-slate-500">
                    {ngayVN(e.startAt)}
                    {e.location ? ` · ${e.location}` : ""}
                  </div>
                </div>
                <Link href={`/quan-tri/su-kien/moi?eventId=${e.id}`} className="btn-ghost !py-1.5">
                  Bật quản lý tổ chức
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {daQua.length > 0 && (
        <>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-navy-700">Đã diễn ra</h2>
          <div className="mb-8 grid gap-3 md:grid-cols-2">
            {daQua.map((d) => (
              <TheSuKien
              key={d.id}
              d={d}
              href={chiCheckin ? `/quan-tri/su-kien/${d.event.id}/check-in` : `/quan-tri/su-kien/${d.event.id}`}
              xacNhan={mXn.get(d.id)?.size ?? 0}
              daDen={mDen.get(d.id)?.size ?? 0}
              tre={mTre.get(d.id) ?? 0}
              now={now}
            />
            ))}
          </div>
        </>
      )}

      {q.quanLy && (
        <>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-navy-700">Lưu trữ</h2>
          <div className="card p-4">
            <h3 className="font-bold text-navy-800">Lễ chuyển giao 10/10/2026</h3>
            <p className="mt-1 text-sm text-slate-600">
              Dùng bộ công cụ riêng (thư mời mã CL, hai QR check-in, bốc thăm, màn chào mừng) — giữ nguyên dữ liệu
              để tra cứu.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/quan-tri/su-kien-1010" className="btn-ghost !py-1.5">
                Trung tâm 10/10
              </Link>
              <Link href="/quan-tri/khach-moi-1010" className="btn-ghost !py-1.5">
                Khách mời 10/10
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
