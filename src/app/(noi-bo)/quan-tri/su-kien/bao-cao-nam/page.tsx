import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserPage } from "@/lib/auth";
import { formatShortVnd } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { TRANG_THAI_SU_KIEN, ngayVN, nhanLuaChon, soVN } from "@/lib/trung-tam-sk/bang";
import { LOAI_SU_KIEN } from "@/lib/trung-tam-sk/mau";
import { quyenSk, thongKe } from "@/lib/trung-tam-sk/may-chu";
import NutIn from "../[id]/bao-cao/NutIn";

/**
 * Báo cáo năm — mọi sự kiện quản lý ở Trung tâm trong một năm (theo ngày
 * diễn ra, giờ VN): khách, check-in, hội viên, tài trợ, thu chi, đánh giá.
 * Cột tiền chỉ hiện với người có quyền Tài chính sự kiện.
 */
export default async function BaoCaoNam({ searchParams }: { searchParams: Promise<{ nam?: string }> }) {
  const user = await requireUserPage();
  const q = quyenSk(user);
  if (!q.quanLy && !q.taiChinh) redirect("/quan-tri/su-kien");
  const namNay = Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric" }).format(new Date()));
  const { nam: namTho } = await searchParams;
  const nam = /^\d{4}$/.test(namTho ?? "") ? Number(namTho) : namNay;
  const tu = new Date(`${nam}-01-01T00:00:00+07:00`);
  const den = new Date(`${nam + 1}-01-01T00:00:00+07:00`);

  const ds = await prisma.skSuKien.findMany({
    where: { event: { startAt: { gte: tu, lt: den } } },
    select: { id: true, loai: true, trangThai: true, mucTieuKhach: true, event: { select: { id: true, title: true, startAt: true } } },
    orderBy: { event: { startAt: "asc" } },
  });
  const dong = await Promise.all(ds.map(async (d) => ({ d, s: await thongKe(d.event.id, d.id) })));
  const lam = dong.filter((x) => x.d.trangThai !== "HUY");
  const sum = (f: (x: (typeof dong)[number]) => number) => lam.reduce((a, x) => a + f(x), 0);
  const hoiVien = new Set(
    (
      await prisma.skKhach.findMany({
        where: { skId: { in: lam.map((x) => x.d.id) }, memberId: { not: null }, thamDu: { some: { checkinLuc: { not: null } } } },
        select: { memberId: true },
      })
    ).map((k) => k.memberId)
  ).size;
  const coDg = lam.filter((x) => x.s.danhGia.so);
  const tbHaiLong = coDg.length ? coDg.reduce((a, x) => a + (x.s.danhGia.tbHaiLong ?? 0) * x.s.danhGia.so, 0) / sum((x) => x.s.danhGia.so) : null;
  const tc = q.taiChinh;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Link href="/quan-tri/su-kien" className="text-sm text-navy-600 hover:underline">
          ← Trung tâm sự kiện
        </Link>
        <div className="ml-auto flex items-center gap-2 text-sm">
          {[nam - 1, nam, nam + 1].map((n) => (
            <Link
              key={n}
              href={`/quan-tri/su-kien/bao-cao-nam?nam=${n}`}
              className={`rounded-full px-3 py-1 ${n === nam ? "bg-navy-700 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              {n}
            </Link>
          ))}
          <NutIn />
        </div>
      </div>
      <div className="card p-6 print:p-0 print:shadow-none print:ring-0">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-do-600">Báo cáo sự kiện năm {nam}</div>
        <h1 className="mt-1 text-2xl font-bold text-navy-800">Chi hội Doanh nhân trẻ Chợ Lớn</h1>

        <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Sự kiện tổ chức", soVN(lam.length)],
            ["Lượt khách check-in", soVN(sum((x) => x.s.khach.daDen))],
            ["Hội viên tham gia", soVN(hoiVien)],
            ["Người trong BTC", soVN(sum((x) => x.s.btc.tong))],
            ...(tc ? [["Tài trợ đã chốt", formatShortVnd(sum((x) => x.s.taiChinh.taiTroGiaTri))]] : []),
            ...(tc ? [["Kết dư", formatShortVnd(sum((x) => x.s.taiChinh.ketDu))]] : []),
            ...(!tc ? [["Reach truyền thông", soVN(sum((x) => x.s.truyenThong.reach))]] : []),
            ...(!tc ? [["Hài lòng TB", tbHaiLong ? `${tbHaiLong.toFixed(1)}★` : "—"]] : []),
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-navy-50 p-3">
              <div className="text-xs text-slate-500">{k}</div>
              <div className="text-xl font-bold text-navy-800">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="py-1.5 font-medium">Ngày</th>
                <th className="py-1.5 font-medium">Sự kiện</th>
                <th className="py-1.5 text-right font-medium">Khách mời</th>
                <th className="py-1.5 text-right font-medium">Check-in</th>
                <th className="py-1.5 text-right font-medium">Hội viên</th>
                {tc && <th className="py-1.5 text-right font-medium">Tài trợ chốt</th>}
                {tc && <th className="py-1.5 text-right font-medium">Đã thu</th>}
                {tc && <th className="py-1.5 text-right font-medium">Thực chi</th>}
                {tc && <th className="py-1.5 text-right font-medium">Kết dư</th>}
                <th className="py-1.5 text-right font-medium">Reach</th>
                <th className="py-1.5 text-right font-medium">Hài lòng · NPS</th>
              </tr>
            </thead>
            <tbody>
              {dong.map(({ d, s }) => (
                <tr key={d.id} className={`border-t border-slate-100 ${d.trangThai === "HUY" ? "text-slate-400 line-through" : ""}`}>
                  <td className="py-1.5 whitespace-nowrap text-slate-600">{ngayVN(d.event.startAt).slice(0, 5)}</td>
                  <td className="py-1.5">
                    <Link href={`/quan-tri/su-kien/${d.event.id}/bao-cao`} className="font-medium text-navy-800 hover:underline">
                      {d.event.title}
                    </Link>
                    <div className="text-[11px] text-slate-500">
                      {LOAI_SU_KIEN.find((l) => l.value === d.loai)?.label} · {nhanLuaChon(TRANG_THAI_SU_KIEN, d.trangThai)}
                    </div>
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{soVN(s.khach.tong)}</td>
                  <td className="py-1.5 text-right tabular-nums">{soVN(s.khach.daDen)}</td>
                  <td className="py-1.5 text-right tabular-nums">{soVN(s.khach.hoiVienDen)}</td>
                  {tc && <td className="py-1.5 text-right tabular-nums">{formatShortVnd(s.taiChinh.taiTroGiaTri)}</td>}
                  {tc && <td className="py-1.5 text-right tabular-nums">{formatShortVnd(s.taiChinh.tongThu)}</td>}
                  {tc && <td className="py-1.5 text-right tabular-nums">{formatShortVnd(s.taiChinh.thucChi)}</td>}
                  {tc && (
                    <td className={`py-1.5 text-right tabular-nums ${s.taiChinh.ketDu < 0 ? "text-do-600" : ""}`}>
                      {formatShortVnd(s.taiChinh.ketDu)}
                    </td>
                  )}
                  <td className="py-1.5 text-right tabular-nums">{s.truyenThong.reach ? soVN(s.truyenThong.reach) : "—"}</td>
                  <td className="py-1.5 text-right tabular-nums">
                    {s.danhGia.so ? `${s.danhGia.tbHaiLong?.toFixed(1)}★ · ${s.danhGia.nps ?? "—"}` : "—"}
                  </td>
                </tr>
              ))}
              {!dong.length && (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-slate-500">
                    Năm {nam} chưa có sự kiện nào quản lý ở Trung tâm.
                  </td>
                </tr>
              )}
            </tbody>
            {lam.length > 1 && (
              <tfoot>
                <tr className="border-t-2 border-navy-200 font-semibold">
                  <td className="py-1.5" colSpan={2}>
                    Cộng ({lam.length} sự kiện, không tính sự kiện huỷ)
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{soVN(sum((x) => x.s.khach.tong))}</td>
                  <td className="py-1.5 text-right tabular-nums">{soVN(sum((x) => x.s.khach.daDen))}</td>
                  <td className="py-1.5 text-right tabular-nums" title="Số lượt — hội viên khác nhau ở thẻ phía trên">
                    {soVN(sum((x) => x.s.khach.hoiVienDen))}
                  </td>
                  {tc && <td className="py-1.5 text-right tabular-nums">{formatShortVnd(sum((x) => x.s.taiChinh.taiTroGiaTri))}</td>}
                  {tc && <td className="py-1.5 text-right tabular-nums">{formatShortVnd(sum((x) => x.s.taiChinh.tongThu))}</td>}
                  {tc && <td className="py-1.5 text-right tabular-nums">{formatShortVnd(sum((x) => x.s.taiChinh.thucChi))}</td>}
                  {tc && <td className="py-1.5 text-right tabular-nums">{formatShortVnd(sum((x) => x.s.taiChinh.ketDu))}</td>}
                  <td className="py-1.5 text-right tabular-nums">{soVN(sum((x) => x.s.truyenThong.reach))}</td>
                  <td className="py-1.5 text-right tabular-nums">{tbHaiLong ? `${tbHaiLong.toFixed(1)}★` : "—"}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Check-in, hội viên, reach, đánh giá lấy từ Trung tâm sự kiện. Tài trợ chỉ tính khoản đã chốt (không tính &ldquo;Đang vận
          động&rdquo; và &ldquo;Huỷ&rdquo;).
        </p>
      </div>
    </div>
  );
}
