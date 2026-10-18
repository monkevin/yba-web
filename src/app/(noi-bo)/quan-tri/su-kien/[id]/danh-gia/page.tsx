import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { gioVN, ngayVN } from "@/lib/trung-tam-sk/bang";
import { tinhDanhGia } from "@/lib/trung-tam-sk/danh-gia";
import { napTrang } from "@/lib/trung-tam-sk/trang";

/** Kết quả đánh giá của khách (cổng QR) — đọc trước buổi rút kinh nghiệm. */
export default async function DanhGiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { quyen: q, ev, sk } = await napTrang(id, "vao");
  if (!q.quanLy && !q.taiChinh) redirect(`/quan-tri/su-kien/${id}/check-in`);
  const ds = await prisma.skDanhGia.findMany({ where: { skId: sk.id }, orderBy: { createdAt: "desc" } });
  const t = tinhDanhGia(ds);
  const coLoi = ds.filter((d) => d.thichNhat || d.gopY);
  const max = Math.max(1, ...t.phanBo);

  if (!ds.length)
    return (
      <div className="card p-6 text-sm text-slate-600">
        Chưa có đánh giá nào.{" "}
        {sk.moDanhGia ? (
          "Cổng đánh giá đang mở — chiếu mã QR cuối chương trình hoặc gửi link qua Zalo."
        ) : (
          <Link href={`/quan-tri/su-kien/${ev.id}/cong-qr`} className="text-navy-600 hover:underline">
            Mở cổng đánh giá ở tab Cổng QR →
          </Link>
        )}
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">Số phiếu</div>
          <div className="text-3xl font-bold text-navy-800">{t.so}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">Hài lòng trung bình</div>
          <div className="text-3xl font-bold text-amber-500">{t.tbHaiLong?.toFixed(1)} ★</div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">NPS</div>
          <div className={`text-3xl font-bold ${t.nps === null ? "text-slate-400" : t.nps >= 30 ? "text-emerald-600" : t.nps >= 0 ? "text-amber-600" : "text-do-600"}`}>
            {t.nps === null ? "—" : t.nps > 0 ? `+${t.nps}` : t.nps}
          </div>
          <div className="text-xs text-slate-500">
            {t.ungHo} ủng hộ · {t.cheBai} chê · {t.soNps} phiếu chấm
          </div>
        </div>
      </div>
      <div className="card p-4">
        <h2 className="mb-2 text-sm font-bold text-navy-800">Phân bố mức hài lòng</h2>
        {[5, 4, 3, 2, 1].map((s) => (
          <div key={s} className="flex items-center gap-2 py-0.5 text-sm">
            <span className="w-10 text-amber-500">{s} ★</span>
            <div className="h-3 flex-1 rounded bg-slate-100">
              <div className="h-3 rounded bg-amber-400" style={{ width: `${(t.phanBo[s - 1] / max) * 100}%` }} />
            </div>
            <span className="w-8 text-right text-slate-500">{t.phanBo[s - 1]}</span>
          </div>
        ))}
      </div>
      <div className="card p-4">
        <h2 className="mb-2 text-sm font-bold text-navy-800">Ý kiến ({coLoi.length})</h2>
        <ul className="divide-y divide-slate-100">
          {coLoi.map((d) => (
            <li key={d.id} className="py-2 text-sm">
              <div className="text-xs text-slate-500">
                <span className="text-amber-500">{"★".repeat(d.haiLong)}</span>
                {d.nps !== null && ` · NPS ${d.nps}`} · {d.ten || "Ẩn danh"} · {gioVN(d.createdAt)} {ngayVN(d.createdAt)}
              </div>
              {d.thichNhat && (
                <p className="mt-0.5 text-slate-700">
                  <b className="text-emerald-700">Thích:</b> {d.thichNhat}
                </p>
              )}
              {d.gopY && (
                <p className="mt-0.5 text-slate-700">
                  <b className="text-do-600">Góp ý:</b> {d.gopY}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
      {q.quanLy && (
        <p className="text-sm text-slate-500">
          Ghi bài học vào{" "}
          <Link href={`/quan-tri/su-kien/${ev.id}/thong-tin`} className="text-navy-600 hover:underline">
            tab Thông tin
          </Link>{" "}
          — tự vào báo cáo tổng kết, kỳ sau đọc lại trước khi làm.
        </p>
      )}
    </div>
  );
}
