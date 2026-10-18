import Link from "next/link";
import { docMucDayDu, docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import {
  DANH_NGON_GOC,
  LOI_NHAN_GOC,
  NHOM_DANH_NGON,
  thongKeLaBai,
  type ThongKeLaBai,
} from "@/lib/ngoi-nha/la-bai";
import {
  CAC_LOAI_LA,
  ngayLaDep,
  TEN_LOAI_LA,
  type LoaiLa,
} from "@/lib/ngoi-nha/la-bai-luat";
import { muaHienTai } from "@/lib/ngoi-nha/mua";
import { ngayVN } from "@/lib/ngoi-nha/thoi-gian";
import LaBaiCaiDat from "./LaBaiCaiDat";

const MAU_LOAI: Record<LoaiLa, string> = {
  DANH_NGON: "bg-navy-50 text-navy-700",
  LOI_NHAN: "bg-emerald-50 text-emerald-700",
  DIEM: "bg-amber-50 text-amber-800",
  QUA: "bg-do-50 text-do-700",
};

const so = (n: number) => Math.round(n).toLocaleString("vi-VN");

/** Tab Lá bài mỗi ngày: thống kê, cách chơi, tỉ lệ, điểm, quà, danh ngôn, lời nhắn. */
export default async function QuanTriLaBai({ muaId }: { muaId: string }) {
  const du = await docMucDayDu("laBai");
  const tinhNang = await docTinhNang();
  const mua = await muaHienTai();
  const tk = await thongKeLaBai(muaId);

  return (
    <div className="max-w-3xl space-y-4">
      {!tinhNang.laBai && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Lá bài mỗi ngày đang <b>tắt</b> — hội viên không thấy ô lá bài, không
          lật được lá mới (lịch sử vẫn xem được). Bật lại ở tab{" "}
          <Link
            href="/quan-tri/ngoi-nha?tab=tinh-nang"
            className="font-semibold text-navy-700 underline"
          >
            Tính năng
          </Link>
          . Cài đặt dưới đây vẫn lưu được.
        </div>
      )}

      <ThongKe tk={tk} />

      <LaBaiCaiDat
        du={du}
        danhNgonGoc={DANH_NGON_GOC}
        loiNhanGoc={LOI_NHAN_GOC}
        nhomDanhNgon={NHOM_DANH_NGON}
        thongKeQua={tk.qua}
        mua={{
          trangThai: mua.trangThai,
          ten: mua.ten,
          ketThuc: mua.ketThuc ? ngayVN(mua.ketThuc) : null,
        }}
      />
    </div>
  );
}

function ChipLoai({ l, n }: { l: LoaiLa; n: number }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${MAU_LOAI[l]}`}
    >
      {TEN_LOAI_LA[l]} {so(n)}
    </span>
  );
}

function ThongKe({ tk }: { tk: ThongKeLaBai }) {
  const cao = Math.max(1, ...tk.bayNgay.theoNgay.map((d) => d.tong));
  return (
    <section className="card space-y-4 p-4 sm:p-5">
      <h2 className="font-semibold text-navy-800">Lá bài đã lật</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-xs text-slate-500">
            Hôm nay ({ngayLaDep(tk.ngay)}, tính từ 6:00 sáng)
          </div>
          <div className="text-2xl font-bold text-navy-800">
            {so(tk.homNay.tong)}{" "}
            <span className="text-sm font-normal text-slate-500">lượt lật</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {CAC_LOAI_LA.map((l) => (
              <ChipLoai key={l} l={l} n={tk.homNay.theoLoai[l]} />
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">7 ngày gần nhất</div>
          <div className="text-2xl font-bold text-navy-800">
            {so(tk.bayNgay.tong)}{" "}
            <span className="text-sm font-normal text-slate-500">
              lượt · {so(tk.bayNgay.soNguoi)} người · +{so(tk.bayNgay.diem)}{" "}
              điểm
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {CAC_LOAI_LA.map((l) => (
              <ChipLoai key={l} l={l} n={tk.bayNgay.theoLoai[l]} />
            ))}
          </div>
        </div>
      </div>
      {/* Cột theo ngày, cũ bên trái → mới bên phải */}
      <div
        className="flex h-24 items-end gap-1.5"
        role="img"
        aria-label={`Số lượt lật 7 ngày: ${[...tk.bayNgay.theoNgay]
          .reverse()
          .map((d) => `${ngayLaDep(d.ngay).slice(0, 5)} ${d.tong}`)
          .join(", ")}`}
      >
        {[...tk.bayNgay.theoNgay].reverse().map((d) => (
          <div
            key={d.ngay}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
          >
            <span className="text-[11px] font-semibold text-navy-700">
              {d.tong}
            </span>
            <span
              className="w-full max-w-10 rounded-t-md bg-navy-400"
              style={{ height: `${Math.max(3, (d.tong / cao) * 56)}px` }}
            />
            <span className="text-[11px] text-slate-500">
              {ngayLaDep(d.ngay).slice(0, 5)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
