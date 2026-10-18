import { MA_VON, NGUONG_CAN_BANG, VON, type Von } from "@/lib/ngoi-nha/luat";

/**
 * "Chân dung 4V" hình thoi: bốn đỉnh là bốn loại vốn. Vòng nét đứt là ngưỡng
 * của huy hiệu Doanh nhân cân bằng — Ban Điều hành chỉnh ở quản trị
 * (`nn.luat.von.nguongCanBang`), trang gọi truyền vào qua `nguong`.
 */
export default function KimCuong4V({
  von,
  co = 260,
  nguong = NGUONG_CAN_BANG,
}: {
  von: Von;
  co?: number;
  nguong?: number;
}) {
  const tam = 130;
  const r = 96;
  const moc = Math.max(1, nguong);
  const tran = Math.max(moc * 1.4, ...MA_VON.map((k) => von[k]));
  // Thứ tự đỉnh: trên = Tri thức, phải = Xã hội, dưới = Tài sản, trái = Cá nhân
  const huong: Record<(typeof MA_VON)[number], [number, number]> = {
    TT: [0, -1],
    XH: [1, 0],
    TS: [0, 1],
    CN: [-1, 0],
  };
  const diem = (k: (typeof MA_VON)[number], giaTri: number) => {
    const tl = Math.max(0.04, Math.min(1, giaTri / tran));
    return [tam + huong[k][0] * r * tl, tam + huong[k][1] * r * tl] as const;
  };
  const thu = ["TT", "XH", "TS", "CN"] as const;
  const hinh = thu.map((k) => diem(k, Math.max(0, von[k])).join(",")).join(" ");
  const vongMoc = thu.map((k) => diem(k, moc).join(",")).join(" ");
  const khung = thu
    .map((k) => [tam + huong[k][0] * r, tam + huong[k][1] * r].join(","))
    .join(" ");
  const nhan: Record<
    string,
    { x: number; y: number; anchor: "middle" | "start" | "end" }
  > = {
    TT: { x: tam, y: 18, anchor: "middle" },
    XH: { x: 250, y: tam + 4, anchor: "end" },
    TS: { x: tam, y: 252, anchor: "middle" },
    CN: { x: 10, y: tam + 4, anchor: "start" },
  };
  return (
    <svg
      viewBox="0 0 260 260"
      width={co}
      height={co}
      className="max-w-full"
      role="img"
      aria-label={`Chân dung 4 loại vốn, ngưỡng cân bằng ${moc}`}
    >
      <polygon
        points={khung}
        fill="rgba(46,64,130,0.06)"
        stroke="#c2cbe8"
        strokeWidth="1.5"
      />
      <line x1={tam} y1={tam - r} x2={tam} y2={tam + r} stroke="#e0e5f3" />
      <line x1={tam - r} y1={tam} x2={tam + r} y2={tam} stroke="#e0e5f3" />
      <polygon
        points={vongMoc}
        fill="none"
        stroke="#d4a017"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      <polygon
        points={hinh}
        fill="rgba(200,16,46,0.22)"
        stroke="#c8102e"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {thu.map((k) => {
        const [x, y] = diem(k, Math.max(0, von[k]));
        return (
          <circle
            key={k}
            cx={x}
            cy={y}
            r="5"
            fill={VON[k].mau}
            stroke="#fff"
            strokeWidth="2"
          />
        );
      })}
      {thu.map((k) => (
        <text
          key={k}
          x={nhan[k].x}
          y={nhan[k].y}
          textAnchor={nhan[k].anchor}
          fontSize="12"
          fontWeight="700"
          fill="#1b274d"
          style={{ fontFamily: "var(--font-noi-dung)" }}
        >
          {VON[k].ngan} {von[k]}
        </text>
      ))}
    </svg>
  );
}
