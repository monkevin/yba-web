import { duongQr } from "@/lib/ma-qr";

/**
 * Mã QR vẽ bằng SVG ngay trong trang (không tải ảnh, không gọi dịch vụ
 * ngoài). Luôn nền TRẮNG + viền trắng 4 ô quanh mã — máy quét cần vùng
 * trắng đó, đừng bỏ kể cả khi đặt trên nền tối.
 */
export default function MaQr({
  noiDung,
  rong = 200,
  nhan = "Mã QR",
  className,
}: {
  noiDung: string;
  /** Cạnh hiển thị (px) */
  rong?: number;
  nhan?: string;
  className?: string;
}) {
  const { path, canh } = duongQr(noiDung);
  const VIEN = 4;
  const tong = canh + VIEN * 2;
  return (
    <svg
      viewBox={`0 0 ${tong} ${tong}`}
      width={rong}
      height={rong}
      role="img"
      aria-label={nhan}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={tong} height={tong} fill="#fff" />
      <path d={path} transform={`translate(${VIEN} ${VIEN})`} fill="#000" />
    </svg>
  );
}
