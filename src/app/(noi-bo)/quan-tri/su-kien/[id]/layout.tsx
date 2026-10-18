import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { LOP_TONG, TRANG_THAI_SU_KIEN, gioVN, ngayVN, nhanLuaChon, tongLuaChon } from "@/lib/trung-tam-sk/bang";
import { napSuKien, quyenSk } from "@/lib/trung-tam-sk/may-chu";
import TabSuKien from "./TabSuKien";

/** Khung chung của một sự kiện ở Trung tâm: tiêu đề + các tab (lọc theo quyền). */
export default async function KhungSuKien({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const [{ id }, user] = await Promise.all([params, requireUserPage()]);
  const q = quyenSk(user);
  const ev = q.vao ? await napSuKien(id) : null;
  // Chưa bật quản lý / không có quyền: trang con tự chuyển hướng
  if (!ev?.toChuc) return <>{children}</>;

  const goc = `/quan-tri/su-kien/${id}`;
  const tab = [
    { href: goc, ten: "Tổng quan", hien: q.quanLy || q.taiChinh },
    { href: `${goc}/khach`, ten: "Khách mời", hien: q.quanLy },
    { href: `${goc}/check-in`, ten: "Check-in", hien: q.checkin },
    { href: `${goc}/ban-to-chuc`, ten: "Ban tổ chức", hien: q.quanLy },
    { href: `${goc}/cong-viec`, ten: "Công việc", hien: q.quanLy },
    { href: `${goc}/kich-ban`, ten: "Kịch bản", hien: q.quanLy },
    { href: `${goc}/hau-can`, ten: "Hậu cần", hien: q.quanLy },
    { href: `${goc}/tai-tro`, ten: "Tài trợ", hien: q.taiChinh },
    { href: `${goc}/thu-chi`, ten: "Thu chi", hien: q.taiChinh },
    { href: `${goc}/bao-cao`, ten: "Báo cáo", hien: q.quanLy || q.taiChinh },
    { href: `${goc}/thong-tin`, ten: "Thông tin", hien: q.quanLy },
  ].filter((t) => t.hien);

  return (
    <div>
      <div className="mb-3 print:hidden">
        <Link href="/quan-tri/su-kien" className="text-sm text-navy-600 hover:underline">
          ← Trung tâm sự kiện
        </Link>
      </div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-800">{ev.title}</h1>
          <p className="text-sm text-slate-500">
            {gioVN(ev.startAt)} · {ngayVN(ev.startAt)}
            {ev.location ? ` · ${ev.location}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${LOP_TONG[tongLuaChon(TRANG_THAI_SU_KIEN, ev.toChuc.trangThai)]}`}
          >
            {nhanLuaChon(TRANG_THAI_SU_KIEN, ev.toChuc.trangThai)}
          </span>
          {ev.published && (
            <Link href={`/su-kien/${ev.slug}`} className="btn-ghost !py-1.5" target="_blank">
              Trang công khai ↗
            </Link>
          )}
          {(q.quanLy || q.taiChinh) && (
            <a href={`/api/quan-tri/su-kien/${id}/xuat`} className="btn-ghost !py-1.5">
              ⬇ Xuất Excel
            </a>
          )}
        </div>
      </div>
      <TabSuKien tab={tab} goc={goc} />
      {children}
    </div>
  );
}
