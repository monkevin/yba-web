import { GIA_TRI_KV } from "@/lib/site";

/**
 * Key visual (KV) của Chi hội — huy hiệu tròn: ngôi sao đỏ ở giữa, sáu
 * giá trị chạy quanh vành.
 *
 * Ảnh KV do Ban Chủ nhiệm tải lên ở /quan-tri/giao-dien (hoặc đặt sẵn
 * file `public/kv-hoi.png`). CHƯA có ảnh thì khối này KHÔNG hiện gì —
 * cố ý như vậy: KV là nhận diện chính thức của Hội, thà chưa hiện còn
 * hơn hiện một hình tự vẽ na ná.
 *
 * Hiệu ứng quanh KV:
 *  - quầng sáng đỏ thở nhè nhẹ phía sau (`tho-sang`)
 *  - vệt loé quét ngang mặt huy hiệu (`quet-sang`) cho ra chất kim loại
 *  - vòng nét đứt quay chậm bên ngoài, gợi cảm giác "đang vận hành"
 * Tất cả đều tự tắt khi người xem bật "giảm chuyển động".
 */
export default function KvHoi({
  src,
  kichThuoc = "vua",
}: {
  src?: string | null;
  kichThuoc?: "vua" | "lon";
}) {
  if (!src) return null;

  const co = kichThuoc === "lon" ? "max-w-md" : "max-w-xs sm:max-w-sm";

  return (
    <div className={`relative mx-auto w-full ${co}`}>
      {/* Quầng sáng đỏ phía sau */}
      <div
        aria-hidden
        className="tho-sang absolute inset-0 -z-10 rounded-full bg-son-500 blur-3xl"
      />

      {/* Vòng nét đứt quay chậm — chỉ là trang trí, ẩn với trình đọc màn hình */}
      <div
        aria-hidden
        className="vong-quay absolute -inset-4 rounded-full border border-dashed border-white/25"
      />

      <div className="quet-sang relative rounded-full">
        {/* Ảnh KV do Ban Chủ nhiệm tải lên nên không biết trước kích thước */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`Key visual Chi hội Doanh nhân trẻ Chợ Lớn: ngôi sao đỏ giữa vành sáu giá trị ${GIA_TRI_KV.join(" · ")}`}
          className="w-full rounded-full drop-shadow-2xl"
        />
      </div>
    </div>
  );
}
