import { docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import { tranChuaXong } from "@/lib/ngoi-nha/dau-truong";
import DauTruongDsTran from "./DauTruongDsTran";

/** Trận Đấu trường bị treo: xem và huỷ. */
export default async function VanHanhDauTruong() {
  const [tinhNang, { tong, ds, luc }] = await Promise.all([
    docTinhNang(),
    tranChuaXong(),
  ]);
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-navy-800">
          Đấu trường: trận chưa xong
        </h2>
        <p className="text-sm text-slate-500">
          Trận chưa xong chặn hai người thách nhau trận mới. Người được thách
          quá lâu không nhận lời thì huỷ trận để họ đấu lại — trận chưa xong
          chưa cộng điểm nên huỷ không trừ điểm ai.
        </p>
      </div>
      {!tinhNang.dauTruong && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <b>Đấu trường đang tắt</b>: không ai tạo được trận mới; các trận dưới
          đây vẫn chơi nốt được.
        </div>
      )}
      <DauTruongDsTran ds={ds} tong={tong} bayGio={luc} />
    </section>
  );
}
