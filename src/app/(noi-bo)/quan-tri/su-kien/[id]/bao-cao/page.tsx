import { redirect } from "next/navigation";
import { formatVnd } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { TT_TAI_TRO_CHUA_CHOT } from "@/lib/tai-tro";
import { VAI_TRO_BTC, gioVN, ngayVN, nhanLuaChon } from "@/lib/trung-tam-sk/bang";
import { LOAI_SU_KIEN, THONG_TIN_QUY_MO, type QuyMo } from "@/lib/trung-tam-sk/mau";
import { thongKe } from "@/lib/trung-tam-sk/may-chu";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import NutIn from "./NutIn";

const pt = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "—");

function Dong({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <tr className="border-t border-slate-100">
      <td className="py-1.5 text-slate-600">{k}</td>
      <td className="py-1.5 text-right font-semibold text-slate-800">{v}</td>
    </tr>
  );
}

/** Báo cáo tổng kết một trang — in hoặc lưu PDF gửi Ban Chủ nhiệm. */
export default async function BaoCaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { quyen: q, ev, sk } = await napTrang(id, "vao");
  if (!q.quanLy && !q.taiChinh) redirect(`/quan-tri/su-kien/${id}/check-in`);
  const s = await thongKe(ev.id, sk.id);
  const [btc, taiTro, kichBan] = await Promise.all([
    q.quanLy ? prisma.banToChuc.findMany({ where: { eventId: ev.id }, orderBy: [{ order: "asc" }] }) : [],
    q.taiChinh
      ? prisma.taiTroSuKien.findMany({
          where: { eventId: ev.id, trangThai: { notIn: TT_TAI_TRO_CHUA_CHOT } },
          orderBy: [{ giaTri: "desc" }],
          include: { quyenLoi: { select: { xong: true } } },
        })
      : [],
    q.quanLy
      ? prisma.skKichBan.findMany({ where: { skId: sk.id, noiBo: false }, orderBy: { order: "asc" }, include: { phien: { select: { ten: true } } } })
      : [],
  ]);

  return (
    <div className="card mx-auto max-w-4xl p-6 print:p-0 print:shadow-none print:ring-0 md:p-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-do-600">Báo cáo tổng kết sự kiện</div>
          <h1 className="mt-1 text-2xl font-bold text-navy-800">{ev.title}</h1>
          <p className="text-sm text-slate-600">
            {gioVN(ev.startAt)} · {ngayVN(ev.startAt)}
            {ev.location ? ` · ${ev.location}` : ""} · {LOAI_SU_KIEN.find((l) => l.value === sk.loai)?.label} · quy mô{" "}
            {THONG_TIN_QUY_MO[sk.quyMo as QuyMo]?.label.toLowerCase()}
          </p>
        </div>
        <NutIn />
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-navy-700">1. Kết quả chính</h2>
      <table className="mt-2 w-full text-sm">
        <tbody>
          <Dong k="Mục tiêu số khách" v={sk.mucTieuKhach ?? "—"} />
          <Dong k="Khách trong danh sách mời" v={s.khach.tong} />
          <Dong k="Xác nhận tham dự (≥ 1 phiên)" v={`${s.khach.xacNhan} (${pt(s.khach.xacNhan, sk.mucTieuKhach ?? s.khach.tong)} mục tiêu)`} />
          <Dong k="Thực đến (check-in)" v={s.khach.daDen ? `${s.khach.daDen} (${pt(s.khach.daDen, s.khach.xacNhan)} khách xác nhận)` : "Chưa ghi nhận"} />
          <Dong k="Hội viên có mặt (được cộng điểm hoạt động)" v={s.khach.hoiVienDen} />
          <Dong k="Ban tổ chức" v={`${s.btc.tong} người · ${s.btc.hoiVien} hội viên`} />
          <Dong k="Công việc hoàn thành" v={`${s.viec.xong}/${s.viec.tong} (${pt(s.viec.xong, s.viec.tong)})`} />
          <Dong k="Hậu cần đã chuẩn bị" v={`${s.hauCan.xong}/${s.hauCan.tong}`} />
        </tbody>
      </table>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-navy-700">2. Khách theo phiên</h2>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500">
            <th className="py-1 font-medium">Phiên</th>
            <th className="py-1 text-right font-medium">Xác nhận</th>
            <th className="py-1 text-right font-medium">Không dự</th>
            <th className="py-1 text-right font-medium">Thực đến</th>
            <th className="py-1 text-right font-medium">Tỷ lệ đến</th>
          </tr>
        </thead>
        <tbody>
          {s.phien.map((p) => (
            <tr key={p.id} className="border-t border-slate-100">
              <td className="py-1.5">{p.ten}</td>
              <td className="py-1.5 text-right tabular-nums">{p.co}</td>
              <td className="py-1.5 text-right tabular-nums">{p.khong}</td>
              <td className="py-1.5 text-right tabular-nums">{p.checkin}</td>
              <td className="py-1.5 text-right tabular-nums">{pt(p.checkin, p.co)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {q.taiChinh && (
        <>
          <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-navy-700">3. Tài chính</h2>
          <table className="mt-2 w-full text-sm">
            <tbody>
              <Dong k="Tài trợ tiền mặt cam kết" v={formatVnd(s.taiChinh.taiTroCamKet)} />
              <Dong k="Tài trợ đã thu" v={formatVnd(s.taiChinh.taiTroDaThu)} />
              <Dong k="Tổng giá trị tài trợ (gồm hiện vật)" v={formatVnd(s.taiChinh.taiTroGiaTri)} />
              <Dong k="Thu khác (vé, quỹ…)" v={formatVnd(s.taiChinh.thucThuKhac)} />
              <Dong k="Dự trù chi / thực chi" v={`${formatVnd(s.taiChinh.duTruChi)} / ${formatVnd(s.taiChinh.thucChi)}`} />
              <Dong k="Chi phí / khách thực đến" v={s.khach.daDen ? formatVnd(Math.round(s.taiChinh.thucChi / s.khach.daDen)) : "—"} />
              <Dong k={s.taiChinh.ketDu >= 0 ? "Kết dư" : "Thâm hụt"} v={formatVnd(Math.abs(s.taiChinh.ketDu))} />
            </tbody>
          </table>
          {taiTro.length > 0 && (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="py-1 font-medium">Nhà tài trợ</th>
                  <th className="py-1 font-medium">Hạng</th>
                  <th className="py-1 text-right font-medium">Giá trị</th>
                  <th className="py-1 text-right font-medium">Quyền lợi đã thực hiện</th>
                </tr>
              </thead>
              <tbody>
                {taiTro.map((t) => (
                  <tr key={t.id} className="border-t border-slate-100">
                    <td className="py-1.5">{t.nhaTaiTro}</td>
                    <td className="py-1.5">{t.mucTaiTro ?? ""}</td>
                    <td className="py-1.5 text-right tabular-nums">{formatVnd(t.giaTri)}</td>
                    <td className="py-1.5 text-right tabular-nums">
                      {t.quyenLoi.filter((x) => x.xong).length}/{t.quyenLoi.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {q.quanLy && btc.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-navy-700">4. Ban tổ chức</h2>
          <ul className="mt-2 columns-1 text-sm sm:columns-2">
            {btc.map((b) => (
              <li key={b.id} className="break-inside-avoid py-0.5">
                <b>{b.hoTen}</b> — {b.ban ?? ""} {b.vaiTro !== "THANH_VIEN" ? `(${nhanLuaChon(VAI_TRO_BTC, b.vaiTro)})` : ""}
              </li>
            ))}
          </ul>
        </>
      )}

      {(sk.baiHocTot || sk.baiHocCaiThien) && (
        <>
          <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-navy-700">5. Bài học kinh nghiệm</h2>
          <div className="mt-2 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <div className="font-semibold text-emerald-700">Làm tốt — giữ lại</div>
              <p className="whitespace-pre-line text-slate-700">{sk.baiHocTot || "—"}</p>
            </div>
            <div>
              <div className="font-semibold text-do-600">Cần cải thiện kỳ sau</div>
              <p className="whitespace-pre-line text-slate-700">{sk.baiHocCaiThien || "—"}</p>
            </div>
          </div>
        </>
      )}

      {kichBan.length > 0 && (
        <div className="break-before-page">
          <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-navy-700">Phụ lục — Kịch bản chương trình</h2>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {kichBan.map((k) => (
                <tr key={k.id} className="border-t border-slate-100 align-top">
                  <td className="w-16 py-1.5 tabular-nums text-slate-500">{k.gio}</td>
                  <td className="py-1.5">
                    {k.noiDung}
                    {k.phien ? <span className="ml-1 text-xs text-slate-400">· {k.phien.ten}</span> : null}
                  </td>
                  <td className="py-1.5 text-slate-600">{k.phuTrach ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
