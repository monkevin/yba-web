import Link from "next/link";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/ui";
import { formatShortVnd } from "@/lib/format";
import { LOP_TONG, UU_TIEN, gioVN, ngayVN, nhanLuaChon, soVN, tongLuaChon } from "@/lib/trung-tam-sk/bang";
import { thongKe } from "@/lib/trung-tam-sk/may-chu";
import { napTrang } from "@/lib/trung-tam-sk/trang";

const pt = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "—");

function Thanh({ phan, tong, mau = "bg-navy-600" }: { phan: number; tong: number; mau?: string }) {
  const w = tong > 0 ? Math.min(100, Math.round((phan / tong) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${mau}`} style={{ width: `${w}%` }} />
    </div>
  );
}

/** Tổng quan một sự kiện — số liệu sống, đọc thẳng từ các tab. */
export default async function TongQuanSuKien({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { quyen: q, ev, sk } = await napTrang(id);
  if (!q.quanLy && !q.taiChinh) redirect(`/quan-tri/su-kien/${id}/check-in`);
  const s = await thongKe(ev.id, sk.id);

  const soNgay = Math.ceil((ev.startAt.getTime() - new Date().getTime()) / 86_400_000);
  const dem =
    soNgay > 0 ? `Còn ${soNgay} ngày` : soNgay === 0 ? "Diễn ra hôm nay" : `Đã qua ${-soNgay} ngày`;
  const mucTieu = sk.mucTieuKhach ?? 0;
  const goc = `/quan-tri/su-kien/${id}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Đếm ngược" value={dem} hint={`D-Day ${ngayVN(ev.startAt)}`} tone="navy" />
        <StatCard
          label="Khách xác nhận"
          value={`${s.khach.xacNhan}/${s.khach.tong}`}
          hint={mucTieu ? `Mục tiêu ${soVN(mucTieu)} · đạt ${pt(s.khach.xacNhan, mucTieu)}` : `${s.khach.vip} khách VIP`}
          tone="emerald"
        />
        <StatCard
          label="Đã check-in"
          value={soVN(s.khach.daDen)}
          hint={s.khach.xacNhan ? `${pt(s.khach.daDen, s.khach.xacNhan)} khách xác nhận · ${s.khach.hoiVienDen} hội viên` : "Chưa có khách xác nhận"}
        />
        <StatCard
          label="Công việc xong"
          value={pt(s.viec.xong, s.viec.tong)}
          hint={s.viec.tre ? `${s.viec.tre} việc trễ hạn` : `${s.viec.xong}/${s.viec.tong} việc`}
          tone={s.viec.tre ? "amber" : "slate"}
        />
      </div>

      {q.taiChinh && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Tài trợ cam kết"
            value={formatShortVnd(s.taiChinh.taiTroCamKet)}
            hint={`${s.taiChinh.soNtt} nhà tài trợ${s.taiChinh.soNttDangVanDong ? ` · ${s.taiChinh.soNttDangVanDong} đang vận động` : ""}`}
            tone="navy"
          />
          <StatCard
            label="Tài trợ đã thu"
            value={formatShortVnd(s.taiChinh.taiTroDaThu)}
            hint={`Còn phải thu ${formatShortVnd(Math.max(0, s.taiChinh.taiTroCamKet - s.taiChinh.taiTroDaThu))}`}
            tone="emerald"
          />
          <StatCard
            label="Thực chi / dự trù"
            value={formatShortVnd(s.taiChinh.thucChi)}
            hint={`Dự trù ${formatShortVnd(s.taiChinh.duTruChi)} · ${pt(s.taiChinh.thucChi, s.taiChinh.duTruChi)}`}
          />
          <StatCard
            label={s.taiChinh.ketDu >= 0 ? "Kết dư" : "Thâm hụt"}
            value={formatShortVnd(Math.abs(s.taiChinh.ketDu))}
            hint={`Thu ${formatShortVnd(s.taiChinh.tongThu)} − chi ${formatShortVnd(s.taiChinh.thucChi)}`}
            tone={s.taiChinh.ketDu >= 0 ? "emerald" : "amber"}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-bold text-navy-800">Khách theo phiên</h2>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="py-1 font-medium">Phiên</th>
                <th className="py-1 text-right font-medium">Xác nhận</th>
                <th className="py-1 text-right font-medium">Chờ</th>
                <th className="py-1 text-right font-medium">Check-in</th>
              </tr>
            </thead>
            <tbody>
              {s.phien.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="py-2">
                    <div className="font-medium text-slate-800">{p.ten}</div>
                    <div className="mt-1">
                      <Thanh phan={p.checkin} tong={Math.max(p.co, p.checkin)} mau="bg-emerald-500" />
                    </div>
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {p.co}
                    {p.sucChua ? <span className="text-xs text-slate-400">/{p.sucChua}</span> : null}
                  </td>
                  <td className="py-2 text-right tabular-nums text-slate-500">{p.cho}</td>
                  <td className="py-2 text-right font-semibold tabular-nums text-emerald-700">{p.checkin}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {s.khach.tong === 0 && q.quanLy && (
            <p className="mt-3 text-sm text-slate-500">
              Chưa có khách. Vào tab <Link className="text-navy-600 underline" href={`${goc}/khach`}>Khách mời</Link> để
              nhập file Excel hoặc dán danh sách.
            </p>
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-bold text-navy-800">Tiến độ theo ban</h2>
          <ul className="mt-3 space-y-3">
            {s.viec.theoBan.map((b) => (
              <li key={b.ten}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{b.ten}</span>
                  <span className="tabular-nums text-slate-500">
                    {b.xong}/{b.xong + b.mo}
                    {b.tre ? <b className="ml-2 text-do-600">{b.tre} trễ</b> : null}
                  </span>
                </div>
                <div className="mt-1">
                  <Thanh phan={b.xong} tong={b.xong + b.mo} mau={b.tre ? "bg-amber-500" : "bg-navy-600"} />
                </div>
              </li>
            ))}
            {s.viec.theoBan.length === 0 && <li className="text-sm text-slate-500">Chưa có công việc.</li>}
          </ul>
        </section>
      </div>

      {q.quanLy && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-navy-800">Việc trễ hạn</h2>
              <Link href={`${goc}/cong-viec`} className="text-sm text-navy-600 hover:underline">
                Tất cả việc →
              </Link>
            </div>
            {s.viec.dsTre.length === 0 ? (
              <p className="mt-3 text-sm text-emerald-700">Không có việc nào trễ hạn.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {s.viec.dsTre.map((v) => (
                  <li key={v.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                    <div>
                      <div className="text-slate-800">{v.tieuDe}</div>
                      <div className="text-xs text-slate-500">
                        {v.ban ?? "Chung"}
                        {v.nguoiLam ? ` · ${v.nguoiLam}` : ""} · hạn {ngayVN(v.hanChot)}
                      </div>
                    </div>
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${LOP_TONG[tongLuaChon(UU_TIEN, v.uuTien)]}`}>
                      {nhanLuaChon(UU_TIEN, v.uuTien)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <h2 className="font-bold text-navy-800">Khách theo nhóm</h2>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="py-1 font-medium">Nhóm</th>
                  <th className="py-1 text-right font-medium">Mời</th>
                  <th className="py-1 text-right font-medium">Xác nhận</th>
                  <th className="py-1 text-right font-medium">Đến</th>
                </tr>
              </thead>
              <tbody>
                {s.khach.theoNhom.slice(0, 10).map((g) => (
                  <tr key={g.ten} className="border-t border-slate-100">
                    <td className="py-1.5 text-slate-700">{g.ten}</td>
                    <td className="py-1.5 text-right tabular-nums">{g.tong}</td>
                    <td className="py-1.5 text-right tabular-nums">{g.co}</td>
                    <td className="py-1.5 text-right tabular-nums text-emerald-700">{g.den}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-slate-500">
              Hậu cần đã có {s.hauCan.xong}/{s.hauCan.tong} · Ban tổ chức {s.btc.tong} người ({s.btc.hoiVien} gắn hồ sơ hội
              viên — được tính điểm cống hiến).
            </p>
          </section>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Số liệu tính lúc {gioVN(new Date())} — tải lại trang để cập nhật.
      </p>
    </div>
  );
}
