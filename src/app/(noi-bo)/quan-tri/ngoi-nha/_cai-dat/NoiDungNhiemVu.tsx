import { docMucDayDu, docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import { CAU_HINH_NV } from "@/lib/ngoi-nha/nhiem-vu-cau-hinh";
import { NHOM_NHIEM_VU } from "@/lib/ngoi-nha/luat";
import { NHIEM_VU } from "@/lib/ngoi-nha/noi-dung";
import DauTruongSuaNhiemVu from "./DauTruongSuaNhiemVu";

/** Bật tắt / điểm / vốn / giới hạn / chữ của 16 Nhiệm vụ Huynh đệ. */
export default async function NoiDungNhiemVu() {
  const [muc, tinhNang] = await Promise.all([
    docMucDayDu("nhiemVu"),
    docTinhNang(),
  ]);
  // Thông tin cố định trong code (nhóm, cách xác nhận) — chỉ để hiển thị
  const coDinh = Object.fromEntries(
    NHIEM_VU.map((n) => {
      const ch = CAU_HINH_NV[n.ma];
      return [
        n.ma,
        {
          nhom: NHOM_NHIEM_VU[n.muc] ?? n.muc,
          tuDong: !!ch?.tuDong,
          thuCong: ch?.thuCong ?? null,
        },
      ];
    }),
  );
  return (
    <div className="max-w-3xl space-y-3">
      {!tinhNang.nhiemVu && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Cả tính năng <b>Nhiệm vụ Huynh đệ đang tắt</b> (Cài đặt → Bật / tắt
          tính năng). Sửa ở đây vẫn lưu, áp dụng khi bật lại.
        </div>
      )}
      <DauTruongSuaNhiemVu muc={muc} coDinh={coDinh} />
    </div>
  );
}
