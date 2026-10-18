import Link from "next/link";
import { notFound } from "next/navigation";
import { formatVnd } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { gioVN, linkAnToan, ngayVN, soVN } from "@/lib/trung-tam-sk/bang";
import { tongHopDanhGia } from "@/lib/trung-tam-sk/danh-gia";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import NutIn from "../../bao-cao/NutIn";

/**
 * Báo cáo quyền lợi gửi MỘT nhà tài trợ (in / lưu PDF): quyền lợi đã thực
 * hiện + bằng chứng, kết quả sự kiện, bài truyền thông và reach.
 * Không in số đã thu, người vận động, liên hệ, ghi chú nội bộ.
 */
export default async function BaoCaoNhaTaiTro({ params }: { params: Promise<{ id: string; ttId: string }> }) {
  const { id, ttId } = await params;
  const { ev, sk } = await napTrang(id, "taiChinh");
  const tt = await prisma.taiTroSuKien.findFirst({
    where: { id: ttId, eventId: ev.id },
    include: { quyenLoi: { orderBy: { order: "asc" } }, member: { select: { company: true } } },
  });
  if (!tt) notFound();
  const [daDen, soPhien, baiDang, album, dg] = await Promise.all([
    prisma.skKhach.count({ where: { skId: sk.id, thamDu: { some: { checkinLuc: { not: null } } } } }),
    prisma.skPhien.count({ where: { skId: sk.id } }),
    prisma.skBaiDang.findMany({ where: { skId: sk.id }, orderBy: [{ ngay: "asc" }, { order: "asc" }] }),
    prisma.skTaiLieu.findMany({ where: { skId: sk.id, url: { not: null } }, orderBy: { order: "asc" } }),
    tongHopDanhGia(sk.id),
  ]);
  const anh = album.filter((t) => /ảnh|anh|video|clip|album/i.test(`${t.nhom ?? ""} ${t.ten}`) && linkAnToan(t.url));
  const reach = baiDang.reduce((a, b) => a + b.reach, 0);
  const tuongTac = baiDang.reduce((a, b) => a + b.tuongTac, 0);
  const xong = tt.quyenLoi.filter((q) => q.xong).length;
  const ten = tenDoanhNghiep(tt.member?.company || tt.nhaTaiTro);

  return (
    <div className="space-y-3">
      <Link href={`/quan-tri/su-kien/${ev.id}/tai-tro`} className="text-sm text-navy-600 hover:underline print:hidden">
        ← Tài trợ
      </Link>
      <div className="card mx-auto max-w-4xl p-6 print:p-0 print:shadow-none print:ring-0 md:p-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-do-600">Báo cáo quyền lợi nhà tài trợ</div>
            <h1 className="mt-1 text-2xl font-bold text-navy-800">{ev.title}</h1>
            <p className="text-sm text-slate-600">
              {gioVN(ev.startAt)} · {ngayVN(ev.startAt)}
              {ev.location ? ` · ${ev.location}` : ""}
            </p>
          </div>
          <NutIn />
        </div>

        <div className="mt-6 rounded-xl bg-navy-50 p-4">
          <div className="text-sm text-slate-600">Kính gửi</div>
          <div className="text-xl font-bold text-navy-800">{ten}</div>
          <div className="mt-1 text-sm text-slate-700">
            {tt.mucTaiTro && (
              <>
                Hạng <b>{tt.mucTaiTro}</b> ·{" "}
              </>
            )}
            Giá trị tài trợ <b>{formatVnd(tt.giaTri)}</b>
            {tt.hienVat ? ` (gồm hiện vật: ${tt.hienVat})` : ""}
          </div>
        </div>

        <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-navy-700">1. Kết quả sự kiện</h2>
        <table className="mt-2 w-full text-sm">
          <tbody>
            <tr className="border-t border-slate-100">
              <td className="py-1.5 text-slate-600">Khách tham dự (check-in thực tế)</td>
              <td className="py-1.5 text-right font-semibold">{daDen ? soVN(daDen) : "—"}</td>
            </tr>
            {soPhien > 1 && (
              <tr className="border-t border-slate-100">
                <td className="py-1.5 text-slate-600">Số phiên chương trình</td>
                <td className="py-1.5 text-right font-semibold">{soPhien}</td>
              </tr>
            )}
            {dg.so > 0 && (
              <tr className="border-t border-slate-100">
                <td className="py-1.5 text-slate-600">Mức hài lòng của khách ({dg.so} phiếu)</td>
                <td className="py-1.5 text-right font-semibold">
                  {dg.tbHaiLong?.toFixed(1)}/5{dg.nps !== null ? ` · NPS ${dg.nps > 0 ? "+" : ""}${dg.nps}` : ""}
                </td>
              </tr>
            )}
            {baiDang.length > 0 && (
              <tr className="border-t border-slate-100">
                <td className="py-1.5 text-slate-600">Bài truyền thông · tổng reach · tương tác</td>
                <td className="py-1.5 text-right font-semibold">
                  {baiDang.length} bài · {soVN(reach)} · {soVN(tuongTac)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-navy-700">
          2. Quyền lợi đã thực hiện ({xong}/{tt.quyenLoi.length})
        </h2>
        {tt.quyenLoi.length ? (
          <table className="mt-2 w-full text-sm">
            <tbody>
              {tt.quyenLoi.map((q) => {
                const l = linkAnToan(q.ghiChu);
                return (
                  <tr key={q.id} className="border-t border-slate-100 align-top">
                    <td className="w-8 py-1.5 text-lg leading-none">{q.xong ? "✅" : "⬜"}</td>
                    <td className="py-1.5 text-slate-800">{q.noiDung}</td>
                    <td className="py-1.5 text-right text-xs text-slate-500">
                      {l ? (
                        <a href={l} target="_blank" rel="noopener noreferrer" className="text-navy-600 underline">
                          Bằng chứng
                        </a>
                      ) : (
                        q.ghiChu
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Chưa có danh sách quyền lợi.</p>
        )}

        {baiDang.length > 0 && (
          <>
            <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-navy-700">3. Truyền thông</h2>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="py-1 font-medium">Ngày</th>
                  <th className="py-1 font-medium">Kênh</th>
                  <th className="py-1 font-medium">Bài</th>
                  <th className="py-1 text-right font-medium">Reach</th>
                  <th className="py-1 text-right font-medium">Tương tác</th>
                </tr>
              </thead>
              <tbody>
                {baiDang.map((b) => {
                  const l = linkAnToan(b.link);
                  return (
                    <tr key={b.id} className="border-t border-slate-100">
                      <td className="py-1.5 text-slate-600">{b.ngay ? ngayVN(b.ngay).slice(0, 5) : ""}</td>
                      <td className="py-1.5 text-slate-600">{b.kenh}</td>
                      <td className="py-1.5">
                        {l ? (
                          <a href={l} target="_blank" rel="noopener noreferrer" className="text-navy-700 underline">
                            {b.tieuDe}
                          </a>
                        ) : (
                          b.tieuDe
                        )}
                      </td>
                      <td className="py-1.5 text-right">{soVN(b.reach)}</td>
                      <td className="py-1.5 text-right">{soVN(b.tuongTac)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {anh.length > 0 && (
          <>
            <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-navy-700">{baiDang.length ? 4 : 3}. Hình ảnh & video</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {anh.map((t) => (
                <li key={t.id}>
                  <a href={linkAnToan(t.url)!} target="_blank" rel="noopener noreferrer" className="text-navy-700 underline">
                    {t.ten}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-10 text-sm text-slate-700">
          Ban tổ chức trân trọng cảm ơn {ten} đã đồng hành cùng YBA Chợ Lớn. Rất mong tiếp tục nhận được sự ủng hộ của Quý doanh
          nghiệp ở các chương trình tiếp theo.
        </p>
        <p className="mt-6 text-right text-sm font-semibold text-navy-800">Ban tổ chức · Chi hội Doanh nhân trẻ Chợ Lớn</p>
      </div>
    </div>
  );
}
