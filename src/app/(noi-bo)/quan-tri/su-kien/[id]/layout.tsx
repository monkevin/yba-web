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
  const t = (duong: string, ten: string, hien: boolean) => ({ href: duong ? `${goc}/${duong}` : goc, ten, hien });
  const nhom = [
    { ten: "Tổng quan", tab: [t("", "Tổng quan", q.quanLy || q.taiChinh)] },
    {
      ten: "Chuẩn bị",
      tab: [
        t("ban-to-chuc", "Ban tổ chức", q.quanLy),
        t("cong-viec", "Công việc", q.quanLy),
        t("kich-ban", "Kịch bản", q.quanLy),
        t("hau-can", "Hậu cần", q.quanLy),
        t("ncc-rui-ro", "NCC & rủi ro", q.quanLy),
      ],
    },
    {
      ten: "Khách mời",
      tab: [t("khach", "Danh sách", q.quanLy), t("xep-ban", "Xếp bàn", q.quanLy), t("check-in", "Check-in", q.checkin)],
    },
    { ten: "Tài chính", tab: [t("tai-tro", "Tài trợ", q.taiChinh), t("thu-chi", "Thu chi", q.taiChinh)] },
    { ten: "Truyền thông", tab: [t("truyen-thong", "Truyền thông", q.quanLy)] },
    {
      ten: "Tại sự kiện",
      tab: [t("cong-qr", "Cổng QR", q.quanLy), t("boc-tham", "Bốc thăm", q.quanLy), t("hoi-dap", "Hỏi đáp", q.quanLy)],
    },
    {
      ten: "Sau sự kiện",
      tab: [t("danh-gia", "Đánh giá", q.quanLy || q.taiChinh), t("bao-cao", "Báo cáo", q.quanLy || q.taiChinh)],
    },
    { ten: "Thông tin", tab: [t("thong-tin", "Thông tin", q.quanLy)] },
  ]
    .map((n) => ({ ten: n.ten, tab: n.tab.filter((x) => x.hien).map(({ href, ten }) => ({ href, ten })) }))
    .filter((n) => n.tab.length);

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
      <TabSuKien nhom={nhom} goc={goc} />
      {children}
    </div>
  );
}
