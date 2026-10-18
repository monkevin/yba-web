import Form from "next/form";
import Link from "next/link";
import { normalizeSearch } from "@/lib/search";
import { docMucDayDu } from "@/lib/ngoi-nha/cai-dat";
import { CHU_DE_BO_CAU, SO_CAU_TOI_THIEU_BO } from "@/lib/ngoi-nha/bo-cau";
import DauTruongKhoBoCau, {
  type CauTimThay,
  type ChuDeTomTat,
} from "./DauTruongKhoBoCau";

// Server component: KHÔNG import hằng từ file "use client" (./truong) — sẽ nhận
// về tham chiếu client chứ không phải chuỗi
const INP = "inp text-base sm:text-sm";

/** Số câu tối đa hiện trong kết quả tìm — tránh dựng cả nghìn câu một lúc. */
const TOI_DA_KET_QUA = 60;

/** Kho ~100 bộ câu thách đấu: tìm, ẩn câu hoặc cả bộ. */
export default async function NoiDungBoCau({ q }: { q: string }) {
  const muc = await docMucDayDu("boCauAn");
  const tu = normalizeSearch(q ?? "").slice(0, 80);

  // Chỉ gửi xuống trình duyệt mã + tên + số thứ tự câu; nội dung câu (có
  // đáp án) tải riêng khi Ban mở một bộ, hoặc khi khớp ô tìm
  const chuDe: ChuDeTomTat[] = CHU_DE_BO_CAU.map((cd) => ({
    ma: cd.ma,
    ten: cd.ten,
    bo: cd.bo.map((b) => ({
      ma: b.ma,
      ten: b.ten,
      moTa: b.moTa,
      so: b.cau.map((c) => c.so),
    })),
  }));

  let boKhop: string[] = [];
  const cauKhop: CauTimThay[] = [];
  let conNua = 0;
  if (tu) {
    const khop = (s: string) => normalizeSearch(s).includes(tu);
    for (const cd of CHU_DE_BO_CAU)
      for (const b of cd.bo) {
        if (khop(cd.ten) || khop(b.ten) || khop(b.moTa) || b.ma.includes(tu))
          boKhop.push(b.ma);
        for (const c of b.cau)
          if (khop(c.hoi) || c.phuongAn.some(khop)) {
            if (cauKhop.length < TOI_DA_KET_QUA)
              cauKhop.push({
                maBo: b.ma,
                tenBo: `${cd.ten} · ${b.ten}`,
                so: c.so,
                hoi: c.hoi,
                phuongAn: c.phuongAn,
                dung: c.dung,
                giai: c.giai,
              });
            else conNua++;
          }
      }
    boKhop = boKhop.slice(0, 40);
  }

  return (
    <div className="max-w-3xl space-y-3">
      <div className="card space-y-3 p-4">
        <p className="text-sm text-slate-600">
          Kho câu dùng chung cho Đấu trường 1-1 và Đấu trí sự kiện. Ẩn câu sai
          hoặc lỗi thời thì trận / phiên tạo SAU sẽ không ra câu đó; bộ còn dưới{" "}
          {SO_CAU_TOI_THIEU_BO} câu hiện thì tự bị loại khỏi đề. Trận đã tạo giữ
          nguyên đề.
        </p>
        <Form
          action="/quan-tri/ngoi-nha"
          className="flex flex-wrap items-end gap-2"
        >
          <input type="hidden" name="tab" value="noi-dung" />
          <input type="hidden" name="muc" value="bo-cau" />
          <label className="block min-w-0 flex-1" htmlFor="tim-bo-cau">
            <span className="lbl">Tìm chủ đề, tên bộ hoặc nội dung câu</span>
            <input
              id="tim-bo-cau"
              name="q"
              defaultValue={q}
              className={INP}
              placeholder="VD: lạm phát, SWOT, hợp đồng lao động"
              autoComplete="off"
            />
          </label>
          <button type="submit" className="btn-primary min-h-11">
            Tìm
          </button>
          {tu && (
            <Link
              href="/quan-tri/ngoi-nha?tab=noi-dung&muc=bo-cau"
              className="btn-ghost flex min-h-11 items-center"
            >
              Xoá tìm
            </Link>
          )}
        </Form>
      </div>

      <DauTruongKhoBoCau
        muc={muc}
        chuDe={chuDe}
        tim={tu ? { q: q.trim(), boKhop, cauKhop, conNua } : null}
      />
    </div>
  );
}
