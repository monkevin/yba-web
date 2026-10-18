"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { duongDanTram } from "@/lib/ngoi-nha/luat";
import type { TramTrenNha } from "@/lib/ngoi-nha/tong-hop";
import BieuTuong from "./BieuTuong";

/**
 * Thế giới 2D "Ngôi nhà Chợ Lớn" vẽ theo mặt tiền Chợ Bình Tây (ảnh tham chiếu
 * anh Khang gửi 15/09/2026): một dãy NĂM GIAN nằm ngang, tháp đồng hồ vuông
 * mặt số trắng ở gian giữa (luôn sáng đèn vì là biểu tượng của chợ), đầu hồi
 * tam giác có hoa văn đỏ ở hai cánh, tường vàng kem liền mạch, mái ngói đỏ
 * cam, bảng tên nền navy, hàng cau trong chậu và sân lát đá hắt ánh đèn.
 * Mỗi gian là một chặng (trái → phải: BIẾT → BẠN → BÀN → BÁN → VƯƠN TẦM), mỗi
 * huy chương là một trạm xếp thành hai hàng quầy trong vòm. Gian chưa mở phủ
 * bóng đêm và vòm tối, gian đang đi vòm sáng ấm, gian xong viền vàng; đi hết
 * 22 trạm thì ngọn lửa trên chóp tháp được thắp. Nhân vật đứng trước cửa gian
 * đang chơi.
 *
 * Hình vẽ bằng SVG (viewBox 1000 × 544, cắt bớt trời phía trên); huy chương là
 * nút HTML đặt theo phần trăm toạ độ để bấm dễ và đọc được bằng trình đọc màn
 * hình. Trên điện thoại chợ rộng 900px và cuộn ngang, tự cuộn tới gian đang đi.
 */

const W = 1000;
const H = 560;
/** Cắt bớt phần trời trống phía trên (viewBox bắt đầu từ đây) */
const DINH_TROI = 16;
/** Mép trái thân chợ, bề rộng mỗi gian */
const MEP = 40;
const RONG_GIAN = 184;
/** Mép trên tường gian (dưới mái), chân vòm, bán kính vòm, nền gian */
const TRAN = 250;
const CHAN_VOM = 378;
const R_VOM = 76;
const NEN = 500;
/** Hai hàng quầy trong gian và khoảng cách giữa hai huy chương cùng hàng */
const HANG_1 = 388;
const HANG_2 = 464;
const BUOC_TRAM = 52;

/** Phần trăm dọc của một toạ độ SVG trong khung HTML (khung đã cắt DINH_TROI) */
const topPct = (y: number) => ((y - DINH_TROI) / (H - DINH_TROI)) * 100;
const leftPct = (x: number) => (x / W) * 100;

type Gian = { changSo: number; trai: number; phai: number; giua: number };
/** Gian theo chặng: chặng 1 ở gian ngoài cùng bên trái, chặng 5 ngoài cùng bên phải */
const GIAN: Gian[] = [1, 2, 3, 4, 5].map((changSo, i) => {
  const trai = MEP + i * RONG_GIAN;
  return { changSo, trai, phai: trai + RONG_GIAN, giua: trai + RONG_GIAN / 2 };
});
const GIAN_THAP = GIAN[2];

/**
 * Toạ độ từng trạm: hàng trên đi trái → phải, hàng dưới đi phải → trái (đường
 * đi uốn hình chữ S trong gian). 5 trạm: 3 trên + 2 dưới; 4 trạm: 2 + 2.
 */
function viTriTram(tram: TramTrenNha[]): Map<string, { x: number; y: number }> {
  const kq = new Map<string, { x: number; y: number }>();
  for (const gian of GIAN) {
    const ds = tram
      .filter((t) => t.changSo === gian.changSo)
      .sort((a, b) => a.thuTu - b.thuTu);
    const n = ds.length;
    const tren = Math.ceil(n / 2);
    const duoi = n - tren;
    const hang = (so: number, i: number) =>
      so === 1 ? 0 : (i - (so - 1) / 2) * BUOC_TRAM;
    ds.forEach((t, i) => {
      if (i < tren) kq.set(t.ma, { x: gian.giua + hang(tren, i), y: HANG_1 });
      else kq.set(t.ma, { x: gian.giua - hang(duoi, i - tren), y: HANG_2 });
    });
  }
  return kq;
}

const MAU = {
  kem: "#faf3e0",
  kemDam: "#e8d9b4",
  go: "#7a4a25",
  son: "#8a1c14",
  sonSang: "#c5142c",
  vang: "#d4a017",
  vangSang: "#f0c75e",
  navy: "#1e2f66",
  la: "#3f8a4c",
  laDam: "#2a5f34",
  troiToi: "#0d1428",
};

type TrangThai = "khoa" | "dang" | "xong";
function trangThaiGian(tram: TramTrenNha[], changSo: number): TrangThai {
  const ds = tram.filter((t) => t.changSo === changSo);
  if (ds.length && ds.every((t) => t.daQua)) return "xong";
  if (ds.some((t) => t.moKhoa)) return "dang";
  return "khoa";
}

export default function NgoiNha({
  tram,
  tramTiep,
  chuCai,
  anh,
  ngonLua,
  soViecHuynhDe,
  tinhDiem,
  luotToiDa,
  heSoThuThach = 2,
  canDeQuaThuThach = 7,
  nhiemVu = true,
}: {
  tram: TramTrenNha[];
  tramTiep: string | null;
  chuCai: string;
  anh: string | null;
  ngonLua: boolean;
  soViecHuynhDe: number;
  /** Mùa giải đang tính điểm; false = chơi thử */
  tinhDiem: boolean;
  /** Số lượt tính điểm tối đa mỗi trạm (Ban Điều hành chỉnh ở quản trị) */
  luotToiDa: number;
  /** Hệ số điểm Trạm Thử thách theo luật đang áp dụng (`nn.luat.tram`) */
  heSoThuThach?: number;
  /** Số câu đúng (trên 10) cần để vượt Trạm Thử thách */
  canDeQuaThuThach?: number;
  /** Nhiệm vụ Huynh đệ đang bật — tắt thì bỏ lối vào Góc Huynh đệ trên hình */
  nhiemVu?: boolean;
}) {
  const [chon, setChon] = useState<TramTrenNha | null>(null);
  const khungCuon = useRef<HTMLDivElement>(null);
  const toaDo = viTriTram(tram);
  const thuTu = [...tram].sort((a, b) => a.thuTu - b.thuTu);
  const diem = thuTu.map((t) => toaDo.get(t.ma)!);
  const lua = ngonLua || (tram.length > 0 && tram.every((t) => t.daQua));
  const changTiep = tram.find((t) => t.ma === tramTiep)?.changSo ?? null;
  const gianTiep = GIAN.find((g) => g.changSo === changTiep) ?? null;
  const ttGian = (changSo: number) => trangThaiGian(tram, changSo);

  // Điện thoại: chợ rộng hơn màn hình → cuộn sẵn tới mép trái gian đang đi (chỉ lúc mở trang)
  useEffect(() => {
    const khung = khungCuon.current;
    if (!khung || khung.scrollWidth <= khung.clientWidth + 4) return;
    const gian = GIAN.find((g) => g.changSo === (changTiep ?? 1)) ?? GIAN[0];
    const tiLe = khung.scrollWidth / W;
    khung.scrollLeft = Math.max(0, gian.trai * tiLe - 24);
  }, [changTiep]);

  return (
    <>
      <div className="select-none">
        <div
          ref={khungCuon}
          className="nn-cho-cuon -mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0"
        >
          <div
            className="relative mx-auto w-[900px] max-w-none lg:w-full lg:max-w-[1000px]"
            style={{ aspectRatio: `${W} / ${H - DINH_TROI}` }}
          >
            <svg
              viewBox={`0 ${DINH_TROI} ${W} ${H - DINH_TROI}`}
              className="absolute inset-0 h-full w-full"
              role="img"
              aria-label="Chợ Bình Tây — Ngôi nhà Chợ Lớn"
            >
              <defs>
                <clipPath id="nn-khung">
                  <rect
                    x="0"
                    y={DINH_TROI}
                    width={W}
                    height={H - DINH_TROI}
                    rx="18"
                  />
                </clipPath>
                <linearGradient id="nn-troi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#0a0f20" />
                  <stop offset="0.6" stopColor="#1b274d" />
                  <stop offset="1" stopColor="#4a2436" />
                </linearGradient>
                <linearGradient id="nn-tuong" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#fbe9b6" />
                  <stop offset="0.55" stopColor="#f1d383" />
                  <stop offset="1" stopColor="#d9ac4f" />
                </linearGradient>
                <linearGradient id="nn-mai" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#cf5a33" />
                  <stop offset="0.5" stopColor="#ad391e" />
                  <stop offset="1" stopColor="#6e1c10" />
                </linearGradient>
                <linearGradient id="nn-vom-sang" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#fff6dc" />
                  <stop offset="1" stopColor="#f3c26f" />
                </linearGradient>
                <linearGradient id="nn-vom-toi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#1a2344" />
                  <stop offset="1" stopColor="#0c1226" />
                </linearGradient>
                <radialGradient id="nn-quang" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0" stopColor="#ffd98a" stopOpacity="0.9" />
                  <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="nn-lua" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0" stopColor="#c5142c" />
                  <stop offset="0.45" stopColor="#e62039" />
                  <stop offset="0.8" stopColor="#f5a524" />
                  <stop offset="1" stopColor="#ffe08a" />
                </linearGradient>
                <linearGradient id="nn-san" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#6f5228" />
                  <stop offset="0.3" stopColor="#3f2e1c" />
                  <stop offset="1" stopColor="#1a130f" />
                </linearGradient>
                <linearGradient id="nn-phan-chieu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ffd98a" stopOpacity="0.55" />
                  <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
                </linearGradient>
              </defs>

              <g clipPath="url(#nn-khung)">
                {/* Bầu trời đêm Chợ Lớn */}
                <rect
                  x="0"
                  y={DINH_TROI}
                  width={W}
                  height={H - DINH_TROI}
                  fill="url(#nn-troi)"
                />
                {[
                  [40, 50, 1.4, 0],
                  [120, 24, 1, 1.2],
                  [210, 70, 1.2, 0.6],
                  [330, 30, 1.1, 2],
                  [430, 60, 1.4, 1.5],
                  [640, 40, 1, 0.3],
                  [720, 90, 1.3, 2.4],
                  [860, 40, 1.3, 1],
                  [930, 110, 1, 1.8],
                  [560, 24, 1.1, 0.8],
                  [90, 150, 1, 2.1],
                  [960, 170, 1.2, 0.5],
                  [270, 140, 0.9, 1.4],
                  [780, 150, 1, 0.9],
                ].map(([x, y, r, d], i) => (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={r}
                    fill="#fff"
                    className="nn-lap-lanh"
                    style={{ animationDelay: `${d}s` }}
                  />
                ))}
                {/* Trăng khuyết */}
                <circle cx="880" cy="70" r="22" fill="#f7f1dc" opacity="0.95" />
                <circle cx="891" cy="62" r="19" fill={MAU.troiToi} />

                {/* Sân chợ lát đá, ánh đèn hắt xuống sân */}
                <rect
                  x="0"
                  y={NEN}
                  width={W}
                  height={H - NEN}
                  fill="url(#nn-san)"
                />
                {Array.from({ length: 26 }, (_, i) => (
                  <line
                    key={i}
                    x1={i * 40}
                    y1={NEN}
                    x2={i * 40 - 22}
                    y2={H}
                    stroke="#000"
                    strokeOpacity="0.16"
                    strokeWidth="1"
                  />
                ))}
                <line
                  x1="0"
                  y1={NEN + 24}
                  x2={W}
                  y2={NEN + 24}
                  stroke="#000"
                  strokeOpacity="0.12"
                />
                <rect
                  x="0"
                  y={NEN}
                  width={W}
                  height="3"
                  fill="#c9a86a"
                  opacity="0.6"
                />

                {/* Thân chợ: dãy năm gian */}
                {GIAN.map((g) => (
                  <GianCho key={g.changSo} gian={g} tt={ttGian(g.changSo)} />
                ))}

                {/* Cột trụ giữa các gian + đèn lồng */}
                {GIAN.slice(1).map((g, i) => {
                  const sang =
                    ttGian(g.changSo) !== "khoa" ||
                    ttGian(GIAN[i].changSo) !== "khoa";
                  return (
                    <g key={g.changSo}>
                      <rect
                        x={g.trai - 7}
                        y={TRAN + 12}
                        width="14"
                        height={NEN - TRAN - 12}
                        fill={MAU.kem}
                      />
                      <rect
                        x={g.trai - 7}
                        y={TRAN + 12}
                        width="3"
                        height={NEN - TRAN - 12}
                        fill="#000"
                        opacity="0.12"
                      />
                      <rect
                        x={g.trai - 10}
                        y={TRAN + 12}
                        width="20"
                        height="8"
                        fill={MAU.kem}
                      />
                      <DenLong
                        x={g.trai}
                        y={TRAN + 22}
                        sang={sang}
                        tre={i * 0.7}
                      />
                    </g>
                  );
                })}
                {/* Hai cột góc */}
                <rect
                  x={MEP - 8}
                  y={TRAN + 12}
                  width="14"
                  height={NEN - TRAN - 12}
                  fill={MAU.kem}
                />
                <rect
                  x={W - MEP - 6}
                  y={TRAN + 12}
                  width="14"
                  height={NEN - TRAN - 12}
                  fill={MAU.kem}
                />

                {/* Mái ngói hai cánh, đầu đao cong lên ở hai góc */}
                <MaiCanh trai={MEP - 22} phai={GIAN_THAP.trai + 8} />
                <MaiCanh trai={GIAN_THAP.phai - 8} phai={W - MEP + 22} lat />

                {/* Đầu hồi tam giác có hoa văn đỏ ở hai gian ngoài cùng */}
                <DauHoi
                  x={GIAN[0].giua}
                  trai={GIAN[0].trai + 16}
                  phai={GIAN[0].phai - 16}
                  chan={TRAN}
                  dinh={TRAN - 58}
                />
                <DauHoi
                  x={GIAN[4].giua}
                  trai={GIAN[4].trai + 16}
                  phai={GIAN[4].phai - 16}
                  chan={TRAN}
                  dinh={TRAN - 58}
                />

                {/* Tháp đồng hồ ở gian giữa */}
                <ThapDongHo x={GIAN_THAP.giua} lua={lua} />

                {/* Đường hành trình nối các trạm (vẽ dưới huy chương) */}
                {diem.slice(1).map((p, i) => {
                  const truoc = diem[i];
                  const daDi = thuTu[i].daQua;
                  const cungHang = Math.abs(truoc.y - p.y) < 5;
                  let d: string;
                  if (cungHang) d = `M${truoc.x} ${truoc.y} L${p.x} ${p.y}`;
                  else if (p.y > truoc.y && p.x < truoc.x)
                    // xuống hàng dưới, lệch trái: cong qua khe giữa hai cụm sao
                    d = `M${truoc.x} ${truoc.y} Q${p.x} ${truoc.y} ${p.x} ${p.y}`;
                  else if (p.y > truoc.y)
                    // xuống hàng dưới thẳng cột (gian 4 trạm): lồi sang phải để không đè sao
                    d = `M${truoc.x} ${truoc.y} C${truoc.x + 40} ${truoc.y + 10} ${p.x + 40} ${p.y - 10} ${p.x} ${p.y}`;
                  // sang gian kế: võng xuống chân quầy rồi vòng lên hàng trên
                  else
                    d = `M${truoc.x} ${truoc.y} C${truoc.x + 60} ${truoc.y + 34} ${p.x - 70} ${p.y + 70} ${p.x} ${p.y}`;
                  return (
                    <path
                      key={i}
                      d={d}
                      fill="none"
                      stroke={daDi ? MAU.sonSang : "rgba(27,39,77,0.4)"}
                      strokeWidth={daDi ? 5 : 3}
                      strokeDasharray={daDi ? undefined : "2 7"}
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* Sân trước: bảng Góc Huynh đệ, hàng cau trong chậu, cột đèn lồng */}
                {/* Ban Điều hành tắt Nhiệm vụ thì bỏ luôn tấm biển, đừng để
                    biển đứng đó mà bấm không ra gì */}
                {nhiemVu && (
                  <g>
                    <rect
                      x="56"
                      y={NEN + 12}
                      width="4"
                      height="40"
                      fill={MAU.go}
                    />
                    <rect
                      x="128"
                      y={NEN + 12}
                      width="4"
                      height="40"
                      fill={MAU.go}
                    />
                    <rect
                      x="44"
                      y={NEN + 6}
                      width="100"
                      height="30"
                      rx="4"
                      fill={MAU.son}
                      stroke={MAU.vang}
                      strokeWidth="2"
                    />
                    <text
                      x="94"
                      y={NEN + 26}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="700"
                      fill="#fff"
                      style={{ fontFamily: "var(--font-noi-dung)" }}
                    >
                      Góc Huynh đệ
                    </text>
                  </g>
                )}
                {[250, 450, 650, 850].map((x, i) => (
                  <CayCau key={x} x={x} lat={i % 2 === 1} />
                ))}
                <DenLong x={300} y={NEN + 8} sang tre={0.4} coc />
                <DenLong x={700} y={NEN + 8} sang tre={1.1} coc />
                <DenLong x={960} y={NEN + 8} sang tre={0.7} coc />
              </g>
            </svg>

            {/* Nhãn chặng trên cửa vòm */}
            {GIAN.map((g) => {
              const t = tram.find((x) => x.changSo === g.changSo);
              if (!t) return null;
              const tt = ttGian(g.changSo);
              return (
                <div
                  key={g.changSo}
                  className={`pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                    tt === "khoa"
                      ? "bg-navy-950/70 text-white/70"
                      : "bg-son-800 text-white ring-1 ring-vang-400/60"
                  }`}
                  style={{
                    left: `${leftPct(g.giua)}%`,
                    top: `${topPct(TRAN + 22)}%`,
                  }}
                >
                  {g.changSo} · {t.changTen}
                </div>
              );
            })}

            {/* Huy chương trạm */}
            {tram.map((t) => {
              const p = toaDo.get(t.ma)!;
              const lop = !t.moKhoa
                ? "bg-navy-950/80 text-white/40 ring-1 ring-white/20"
                : t.daQua
                  ? "bg-gradient-to-b from-navy-500 to-navy-700 text-white ring-2 ring-vang-400 shadow-vang-500/30"
                  : "bg-white text-son-700 ring-4 ring-son-500/70 nn-tho";
              return (
                <button
                  key={t.ma}
                  type="button"
                  onClick={() => setChon(t)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vang-400"
                  style={{ left: `${leftPct(p.x)}%`, top: `${topPct(p.y)}%` }}
                  aria-label={`Chặng ${t.changSo} ${t.changTen} · Trạm ${t.ma} ${t.ten}${t.daQua ? `, đã qua ${t.sao} sao` : t.moKhoa ? ", đang mở" : ", chưa mở"}${t.ma === tramTiep ? ", trạm tiếp theo của bạn" : ""}`}
                >
                  <span
                    className={`grid place-items-center font-bold shadow-lg ${lop} ${
                      t.thuThach
                        ? t.moKhoa
                          ? "h-[50px] w-[50px] rounded-2xl text-[13px]"
                          : "h-10 w-10 rounded-xl"
                        : t.moKhoa
                          ? "h-11 w-11 rounded-full text-[13px]"
                          : "h-9 w-9 rounded-full"
                    }`}
                  >
                    {t.moKhoa ? (
                      t.ma
                    ) : (
                      <BieuTuong ten="khoa" className="h-4 w-4" />
                    )}
                  </span>
                  {t.thuThach && t.moKhoa && !t.daQua && heSoThuThach > 1 && (
                    <span className="absolute -bottom-2 -right-2 rounded-full bg-son-600 px-1.5 text-[11px] font-bold text-white ring-2 ring-white">
                      ×{heSoThuThach}
                    </span>
                  )}
                  {t.daQua && (
                    <span className="absolute left-1/2 top-full mt-0.5 flex -translate-x-1/2 gap-px">
                      {[0, 1, 2].map((i) => (
                        <BieuTuong
                          key={i}
                          ten="sao"
                          dac
                          className={`h-3 w-3 ${i < t.sao ? "text-vang-400" : "text-navy-300/60"}`}
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Nhân vật đứng trước cửa gian đang chơi */}
            {gianTiep && (
              <div
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 nn-nhun"
                style={{
                  left: `${leftPct(gianTiep.giua + 46)}%`,
                  top: `${topPct(NEN + 26)}%`,
                }}
                aria-hidden="true"
              >
                <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-son-600 text-sm font-bold text-white ring-2 ring-white shadow-lg">
                  {anh ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={anh}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    chuCai
                  )}
                </span>
              </div>
            )}

            {nhiemVu && (
              <Link
                href="/ngoi-nha/nhiem-vu"
                className="absolute rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vang-400"
                style={{
                  left: `${leftPct(38)}%`,
                  top: `${topPct(NEN + 6)}%`,
                  width: `${leftPct(112)}%`,
                  height: `${((H - NEN - 6) / (H - DINH_TROI)) * 100}%`,
                }}
                aria-label={`Vào Góc Huynh đệ${soViecHuynhDe > 0 ? `, ${soViecHuynhDe} việc đang chờ` : ""}`}
              >
                {soViecHuynhDe > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-2 right-1 grid h-5 min-w-5 place-items-center rounded-full bg-vang-500 px-1 text-[11px] font-bold text-navy-900 ring-2 ring-white"
                  >
                    {soViecHuynhDe}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>
        {/* Điện thoại: bảng Góc Huynh đệ có thể nằm ngoài khung cuộn → thêm lối vào ngay dưới chợ */}
        <div className="mt-1 flex items-center justify-center gap-3 text-[11px] text-white/60 lg:hidden">
          <span>Vuốt ngang để đi qua cả 5 gian chợ</span>
          {nhiemVu && (
            <Link
              href="/ngoi-nha/nhiem-vu"
              className="rounded-full bg-son-800 px-2.5 py-0.5 font-semibold text-white ring-1 ring-vang-400/60"
            >
              Góc Huynh đệ{soViecHuynhDe > 0 ? ` · ${soViecHuynhDe}` : ""}
            </Link>
          )}
        </div>
      </div>

      {chon && (
        <BangTram
          t={chon}
          tinhDiem={tinhDiem}
          luotToiDa={luotToiDa}
          heSoThuThach={heSoThuThach}
          canDeQuaThuThach={canDeQuaThuThach}
          dong={() => setChon(null)}
        />
      )}
    </>
  );
}

/**
 * Một gian chợ: tường vàng kem, gờ trắng, dải cửa thông gió trên cao, cửa vòm
 * lớn viền đá có đá đỉnh vòm, mở vào sảnh có quầy hàng. Gian chưa mở: phủ
 * bóng đêm, vòm tối; gian đang đi: vòm sáng ấm và thở nhẹ; gian xong: viền vàng.
 */
function GianCho({ gian, tt }: { gian: Gian; tt: TrangThai }) {
  const sang = tt !== "khoa";
  const vom = `M${gian.giua - R_VOM} ${NEN} V${CHAN_VOM} A${R_VOM} ${R_VOM} 0 0 1 ${gian.giua + R_VOM} ${CHAN_VOM} V${NEN} Z`;
  const vienVom = `M${gian.giua - R_VOM - 8} ${NEN} V${CHAN_VOM} A${R_VOM + 8} ${R_VOM + 8} 0 0 1 ${gian.giua + R_VOM + 8} ${CHAN_VOM} V${NEN}`;
  return (
    <g>
      {/* Tường + gờ trắng dưới mái */}
      <rect
        x={gian.trai}
        y={TRAN}
        width={RONG_GIAN}
        height={NEN - TRAN}
        fill="url(#nn-tuong)"
      />
      <rect
        x={gian.trai}
        y={TRAN}
        width={RONG_GIAN}
        height="12"
        fill={MAU.kem}
      />
      <rect
        x={gian.trai}
        y={TRAN + 12}
        width={RONG_GIAN}
        height="3"
        fill="#000"
        opacity="0.12"
      />
      {/* Dải cửa thông gió nhỏ hai bên bảng tên chặng */}
      {[-78, -62, 62, 78].map((dx) => (
        <rect
          key={dx}
          x={gian.giua + dx - 5}
          y={TRAN + 26}
          width="10"
          height="14"
          rx="2"
          fill={sang ? "#6b3d1c" : "#2a2238"}
          opacity="0.85"
        />
      ))}
      {/* Gờ ngang tách tầng trên và vòm */}
      <rect
        x={gian.trai}
        y={TRAN + 50}
        width={RONG_GIAN}
        height="4"
        fill={MAU.kem}
        opacity="0.9"
      />
      {/* Bệ chân tường */}
      <rect
        x={gian.trai}
        y={NEN - 10}
        width={RONG_GIAN}
        height="10"
        fill="#b8862e"
      />
      {/* Cửa vòm và sảnh bên trong */}
      {sang && (
        <ellipse
          cx={gian.giua}
          cy={CHAN_VOM + 20}
          rx="94"
          ry="96"
          fill="url(#nn-quang)"
          opacity="0.5"
          className={tt === "dang" ? "nn-sang-phong" : undefined}
        />
      )}
      <path
        d={vom}
        fill={sang ? "url(#nn-vom-sang)" : "url(#nn-vom-toi)"}
        stroke={sang ? MAU.go : "#3a4568"}
        strokeWidth="4"
      />
      {tt === "xong" && (
        <path
          d={vom}
          fill="none"
          stroke={MAU.vangSang}
          strokeWidth="3"
          strokeDasharray="6 4"
        />
      )}
      {/* Viền đá quanh vòm + đá đỉnh vòm */}
      <path
        d={vienVom}
        fill="none"
        stroke={MAU.kem}
        strokeWidth="7"
        opacity="0.95"
      />
      <path
        d={`M${gian.giua - 7} ${CHAN_VOM - R_VOM - 6} h14 l3 16 h-20 z`}
        fill={MAU.kemDam}
        stroke={MAU.go}
        strokeWidth="1"
      />
      {sang && <QuayHang gian={gian} />}
      {/* Ánh đèn từ sảnh hắt xuống sân */}
      {sang && (
        <rect
          x={gian.giua - 80}
          y={NEN}
          width="160"
          height="46"
          fill="url(#nn-phan-chieu)"
        />
      )}
      {/* Gian chưa mở: phủ bóng đêm lên tường, giữ mặt tiền liền mạch */}
      {!sang && (
        <rect
          x={gian.trai}
          y={TRAN}
          width={RONG_GIAN}
          height={NEN - TRAN}
          fill={MAU.troiToi}
          opacity="0.5"
        />
      )}
    </g>
  );
}

/** Quầy hàng cuối sảnh — vẽ phía sau huy chương, mỗi gian một kiểu hàng. */
function QuayHang({ gian }: { gian: Gian }) {
  const x = gian.giua;
  const day = NEN - 2;
  const mau = ["#2e4082", "#c8102e", "#d4a017", "#3f7a4a", "#7c0717"];
  return (
    <g opacity="0.9">
      <rect x={x - 56} y={day - 20} width="112" height="20" fill={MAU.go} />
      <rect x={x - 58} y={day - 24} width="116" height="5" fill="#c9a36b" />
      <rect
        x={x - 46}
        y={day - 34}
        width="92"
        height="10"
        rx="2"
        fill={mau[(gian.changSo - 1) % mau.length]}
        opacity="0.8"
      />
      <rect
        x={x - 80}
        y={day - 16}
        width="18"
        height="16"
        rx="2"
        fill="#b08d57"
        stroke={MAU.go}
      />
      <rect
        x={x + 62}
        y={day - 14}
        width="20"
        height="14"
        rx="3"
        fill={mau[gian.changSo % mau.length]}
      />
    </g>
  );
}

/** Hàng ngói ống chân mái, dùng chung cho mọi mái. */
function VanNgoi({
  x1,
  x2,
  y,
  buoc = 14,
}: {
  x1: number;
  x2: number;
  y: number;
  buoc?: number;
}) {
  const trai = Math.min(x1, x2);
  const so = Math.max(0, Math.floor(Math.abs(x2 - x1) / buoc));
  return (
    <g>
      {Array.from({ length: so }, (_, i) => (
        <ellipse
          key={i}
          cx={trai + buoc / 2 + i * buoc}
          cy={y - 1}
          rx={buoc / 2 - 1.5}
          ry="3"
          fill="#4a120a"
          opacity="0.45"
        />
      ))}
    </g>
  );
}

/** Mái ngói đỏ cam một cánh chợ: dốc ra trước, đầu đao cong lên ở góc ngoài, ba lớp ngói, hàng ngói ống chân mái. */
function MaiCanh({
  trai,
  phai,
  lat,
}: {
  trai: number;
  phai: number;
  lat?: boolean;
}) {
  const ngoai = lat ? phai : trai;
  const trong = lat ? trai : phai;
  const dau = lat ? -1 : 1;
  const dinhNgoai = ngoai + dau * 34;
  return (
    <g>
      <path
        d={`M${ngoai} ${TRAN - 8} C${ngoai + dau * 8} ${TRAN - 10} ${ngoai + dau * 16} ${TRAN - 26} ${dinhNgoai} ${TRAN - 38} L${trong} ${TRAN - 44} L${trong} ${TRAN} L${ngoai + dau * 10} ${TRAN} Z`}
        fill="url(#nn-mai)"
      />
      {[0, 1, 2].map((k) => (
        <path
          key={k}
          d={`M${ngoai + dau * (12 + k * 9)} ${TRAN - 10 - k * 10} L${trong} ${TRAN - 13 - k * 10}`}
          stroke="#4a120a"
          strokeWidth="1"
          opacity="0.35"
          fill="none"
        />
      ))}
      {/* Bờ nóc vàng + đầu đao */}
      <path
        d={`M${dinhNgoai} ${TRAN - 38} L${trong} ${TRAN - 44}`}
        stroke={MAU.vangSang}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d={`M${ngoai} ${TRAN - 8} C${ngoai + dau * 8} ${TRAN - 10} ${ngoai + dau * 16} ${TRAN - 26} ${dinhNgoai} ${TRAN - 38}`}
        stroke={MAU.vang}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={ngoai} cy={TRAN - 9} r="3.5" fill={MAU.vangSang} />
      <VanNgoi x1={ngoai + dau * 10} x2={trong} y={TRAN} />
    </g>
  );
}

/**
 * Đầu hồi tam giác (hai cánh và tầng dưới tháp): tường kem, tấm hoa văn đỏ có
 * huy hiệu vàng ở giữa, hai dốc mái ngói viền vàng.
 */
function DauHoi({
  x,
  trai,
  phai,
  chan,
  dinh,
}: {
  x: number;
  trai: number;
  phai: number;
  chan: number;
  dinh: number;
}) {
  return (
    <g>
      <path
        d={`M${trai} ${chan} L${x} ${dinh} L${phai} ${chan} Z`}
        fill="url(#nn-tuong)"
      />
      {/* Hai dốc mái ngói, chân mái ngang mép mái cánh */}
      <path
        d={`M${trai - 12} ${chan} L${x} ${dinh - 12} L${phai + 12} ${chan} L${phai + 12} ${chan - 8} L${x} ${dinh - 20} L${trai - 12} ${chan - 8} Z`}
        fill="url(#nn-mai)"
      />
      <path
        d={`M${trai - 12} ${chan - 8} L${x} ${dinh - 20} L${phai + 12} ${chan - 8}`}
        stroke={MAU.vangSang}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={x} cy={dinh - 22} r="3.5" fill={MAU.vangSang} />
      {/* Tấm hoa văn đỏ + huy hiệu + mây cuộn */}
      <rect
        x={x - 42}
        y={chan - 32}
        width="84"
        height="22"
        rx="4"
        fill={MAU.son}
        stroke={MAU.vang}
        strokeWidth="1.5"
      />
      <circle cx={x} cy={chan - 21} r="7" fill={MAU.vangSang} />
      <circle cx={x} cy={chan - 21} r="3" fill={MAU.son} />
      <path
        d={`M${x - 12} ${chan - 21} c-3 -5 -7 -5 -9 0 c-2 4 -6 4 -8 0 M${x + 12} ${chan - 21} c3 -5 7 -5 9 0 c2 4 6 4 8 0`}
        stroke={MAU.vangSang}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {[-36, 36].map((dx) => (
        <circle
          key={dx}
          cx={x + dx}
          cy={chan - 21}
          r="1.8"
          fill={MAU.vangSang}
        />
      ))}
    </g>
  );
}

/** Một lớp mái tháp: bốn dốc nhìn thẳng, đầu đao cong lên, bờ nóc vàng, hàng ngói ống. */
function MaiThap({
  x,
  y,
  rong,
  cao,
  dinh,
}: {
  x: number;
  y: number;
  rong: number;
  cao: number;
  dinh: number;
}) {
  return (
    <g>
      <path
        d={`M${x - rong} ${y - 6} C${x - rong + 8} ${y - 8} ${x - rong + 20} ${y - cao * 0.7} ${x - dinh} ${y - cao} L${x + dinh} ${y - cao} C${x + rong - 20} ${y - cao * 0.7} ${x + rong - 8} ${y - 8} ${x + rong} ${y - 6} L${x + rong - 8} ${y} L${x - rong + 8} ${y} Z`}
        fill="url(#nn-mai)"
      />
      {[0, 1].map((k) => (
        <path
          key={k}
          d={`M${x - rong + 14 + k * 10} ${y - 8 - k * 7} L${x + rong - 14 - k * 10} ${y - 8 - k * 7}`}
          stroke="#4a120a"
          strokeWidth="1"
          opacity="0.35"
          fill="none"
        />
      ))}
      <path
        d={`M${x - dinh} ${y - cao} L${x + dinh} ${y - cao}`}
        stroke={MAU.vangSang}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d={`M${x - rong} ${y - 6} C${x - rong + 8} ${y - 8} ${x - rong + 20} ${y - cao * 0.7} ${x - dinh} ${y - cao}`}
        stroke={MAU.vang}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M${x + rong} ${y - 6} C${x + rong - 8} ${y - 8} ${x + rong - 20} ${y - cao * 0.7} ${x + dinh} ${y - cao}`}
        stroke={MAU.vang}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={x - rong} cy={y - 7} r="2.5" fill={MAU.vangSang} />
      <circle cx={x + rong} cy={y - 7} r="2.5" fill={MAU.vangSang} />
      <VanNgoi x1={x - rong + 8} x2={x + rong - 8} y={y} buoc={12} />
    </g>
  );
}

/**
 * Tháp đồng hồ Chợ Bình Tây (luôn sáng đèn): tầng đế có bảng tên navy, đầu hồi
 * với tấm hoa văn đỏ, mái tầng giữa, khối tháp vuông cao có mặt đồng hồ trắng
 * viền vàng, mái chóp bốn dốc, chóp vàng và ngọn lửa khi đi hết hành trình.
 */
function ThapDongHo({ x, lua }: { x: number; lua: boolean }) {
  const y0 = 70; // chân chóp
  return (
    <g>
      {/* Tầng đế trên gian giữa + bảng tên */}
      <rect
        x={x - 92}
        y={TRAN - 38}
        width="184"
        height="42"
        fill="url(#nn-tuong)"
      />
      <rect
        x={x - 66}
        y={TRAN - 26}
        width="132"
        height="24"
        rx="3"
        fill={MAU.navy}
        stroke={MAU.vangSang}
        strokeWidth="2"
      />
      <text
        x={x}
        y={TRAN - 9}
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fill="#fff"
        letterSpacing="2"
        style={{ fontFamily: "var(--font-noi-dung)" }}
      >
        YBA CHỢ LỚN
      </text>
      {/* Đầu hồi tầng dưới tháp */}
      <DauHoi x={x} trai={x - 92} phai={x + 92} chan={TRAN - 36} dinh={176} />

      {/* Khối tháp vuông có mặt đồng hồ (vẽ trước mái tầng giữa để mái đè lên chân khối) */}
      <rect x={x - 36} y={100} width="72" height="80" fill="url(#nn-tuong)" />
      <rect
        x={x - 36}
        y={100}
        width="4"
        height="80"
        fill="#000"
        opacity="0.1"
      />
      <rect x={x - 36} y={100} width="72" height="5" fill={MAU.kem} />
      <rect x={x - 22} y={108} width="44" height="44" rx="4" fill={MAU.vang} />
      <rect
        x={x - 18}
        y={112}
        width="36"
        height="36"
        rx="3"
        fill="#fffaf0"
        stroke={MAU.go}
        strokeWidth="1.5"
      />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const dai = i % 3 === 0 ? 4 : 2.5;
        return (
          <line
            key={i}
            x1={x + Math.sin(a) * (14 - dai)}
            y1={130 - Math.cos(a) * (14 - dai)}
            x2={x + Math.sin(a) * 14}
            y2={130 - Math.cos(a) * 14}
            stroke="#1a1a1a"
            strokeWidth={i % 3 === 0 ? 1.8 : 1.2}
          />
        );
      })}
      <path
        d={`M${x} 130 L${x} 121 M${x} 130 L${x + 7} 134`}
        stroke="#1a1a1a"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx={x} cy={130} r="1.8" fill={MAU.son} />
      {[-28, 28].map((dx) => (
        <rect
          key={dx}
          x={x + dx - 3}
          y={156}
          width="6"
          height="16"
          rx="1"
          fill="#6b3d1c"
          opacity="0.8"
        />
      ))}
      {/* Mái tầng giữa đè lên chân khối tháp */}
      <MaiThap x={x} y={178} rong={66} cao={22} dinh={30} />

      {/* Mái chóp bốn dốc + chóp và ngọn lửa Chợ Lớn */}
      <MaiThap x={x} y={102} rong={52} cao={30} dinh={8} />
      {lua && (
        <circle
          cx={x}
          cy={y0 - 30}
          r="44"
          fill="url(#nn-quang)"
          className="nn-sang-phong"
        />
      )}
      <path d={`M${x - 9} ${y0 + 2} h18 l-4 -7 h-10 z`} fill={MAU.vang} />
      <rect x={x - 3} y={y0 - 9} width="6" height="4" fill={MAU.go} />
      {lua ? (
        <g className="nn-lua">
          <path
            d={`M${x} ${y0 - 52} C${x - 11} ${y0 - 38} ${x - 16} ${y0 - 28} ${x - 14} ${y0 - 19} C${x - 12} ${y0 - 12} ${x - 6} ${y0 - 9} ${x} ${y0 - 9} C${x + 6} ${y0 - 9} ${x + 12} ${y0 - 12} ${x + 14} ${y0 - 19} C${x + 16} ${y0 - 28} ${x + 11} ${y0 - 38} ${x} ${y0 - 52} Z`}
            fill="url(#nn-lua)"
          />
          <path
            d={`M${x} ${y0 - 32} C${x - 5} ${y0 - 25} ${x - 6} ${y0 - 20} ${x - 5} ${y0 - 15} C${x - 4} ${y0 - 11} ${x - 2} ${y0 - 10} ${x} ${y0 - 10} C${x + 2} ${y0 - 10} ${x + 4} ${y0 - 11} ${x + 5} ${y0 - 15} C${x + 6} ${y0 - 20} ${x + 5} ${y0 - 25} ${x} ${y0 - 32} Z`}
            fill="#ffe7a3"
          />
        </g>
      ) : (
        <circle cx={x} cy={y0 - 13} r="4" fill="#e35f6c" opacity="0.6" />
      )}
    </g>
  );
}

/** Cây cau trong chậu ngoài sân: thân cong, tàu lá rủ, chậu đất nung. Cả cây nằm trên sân, không che huy chương. */
function CayCau({ x, lat }: { x: number; lat?: boolean }) {
  const d = lat ? -1 : 1;
  const ngon = NEN + 12;
  return (
    <g>
      <path d={`M${x - 14} ${NEN + 42} h28 l-3 14 h-22 z`} fill="#8a3b2a" />
      <rect
        x={x - 16}
        y={NEN + 38}
        width="32"
        height="5"
        rx="2"
        fill="#a34a34"
      />
      <path
        d={`M${x} ${NEN + 38} C${x + d * 2} ${NEN + 28} ${x - d * 2} ${NEN + 20} ${x + d * 2} ${ngon}`}
        stroke="#7a5a30"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {[-1, -0.6, -0.25, 0.25, 0.6, 1].map((k, i) => (
        <path
          key={i}
          d={`M${x + d * 2} ${ngon} C${x + d * 2 + k * 8} ${ngon - 12} ${x + d * 2 + k * 20} ${ngon - 10} ${x + d * 2 + k * 28} ${ngon + 4 + Math.abs(k) * 8}`}
          stroke={i % 2 ? MAU.la : MAU.laDam}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

function DenLong({
  x,
  y,
  sang,
  tre,
  coc,
}: {
  x: number;
  y: number;
  sang: boolean;
  tre: number;
  coc?: boolean;
}) {
  return (
    <g>
      {coc && (
        <rect
          x={x - 2}
          y={y + 36}
          width="4"
          height={H - y - 36}
          fill={MAU.go}
        />
      )}
      <g className="nn-lac" style={{ animationDelay: `${tre}s` }}>
        <line
          x1={x}
          y1={y}
          x2={x}
          y2={y + 8}
          stroke="#3d030b"
          strokeWidth="1.5"
        />
        {sang && (
          <circle
            cx={x}
            cy={y + 20}
            r="16"
            fill="url(#nn-quang)"
            opacity="0.7"
          />
        )}
        <rect
          x={x - 5}
          y={y + 7}
          width="10"
          height="3"
          rx="1"
          fill={MAU.vang}
        />
        <ellipse
          cx={x}
          cy={y + 20}
          rx="10"
          ry="11"
          fill={sang ? MAU.sonSang : "#5c0714"}
        />
        <path
          d={`M${x} ${y + 9} v22`}
          stroke={sang ? "#f79aa1" : "#3d030b"}
          strokeWidth="1"
          opacity="0.7"
        />
        <rect
          x={x - 5}
          y={y + 30}
          width="10"
          height="3"
          rx="1"
          fill={MAU.vang}
        />
        <line
          x1={x}
          y1={y + 33}
          x2={x}
          y2={y + 40}
          stroke={MAU.vang}
          strokeWidth="1.5"
        />
      </g>
    </g>
  );
}

/** Bảng thông tin trạm trượt từ dưới lên khi bấm huy chương (hộp thoại thật: Esc đóng, focus vào nút đóng). */
function BangTram({
  t,
  tinhDiem,
  luotToiDa,
  heSoThuThach,
  canDeQuaThuThach,
  dong,
}: {
  t: TramTrenNha;
  tinhDiem: boolean;
  luotToiDa: number;
  heSoThuThach: number;
  canDeQuaThuThach: number;
  dong: () => void;
}) {
  const chuHeSo =
    heSoThuThach === 2
      ? "điểm nhân đôi"
      : heSoThuThach > 1
        ? `điểm nhân ${heSoThuThach}`
        : "";
  const nutDong = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    nutDong.current?.focus();
    const phim = (e: KeyboardEvent) => {
      if (e.key === "Escape") dong();
    };
    window.addEventListener("keydown", phim);
    return () => window.removeEventListener("keydown", phim);
  }, [dong]);
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-navy-950/60 sm:items-center"
      onClick={dong}
    >
      <div
        className="nn-truot-len w-full max-w-md rounded-t-3xl bg-white p-5 text-navy-900 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        role="dialog"
        aria-modal="true"
        aria-label={`Trạm ${t.ma}`}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-son-700">
              Chặng {t.changSo} · {t.changTen} · Trạm {t.ma}
            </div>
            <h3 className="mt-1 text-xl font-bold leading-snug">{t.ten}</h3>
          </div>
          <button
            ref={nutDong}
            type="button"
            onClick={dong}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 outline-none focus-visible:outline-2 focus-visible:outline-navy-500"
            aria-label="Đóng"
          >
            <BieuTuong ten="sai" className="h-4 w-4" />
          </button>
        </div>
        {t.thuThach && (
          <p className="mt-2 rounded-lg bg-son-50 px-3 py-2 text-sm text-son-800">
            <b>Trạm Thử thách:</b> {chuHeSo ? `${chuHeSo}, cần` : "cần"} đúng
            tối thiểu {canDeQuaThuThach}/10 câu để vượt chặng.
          </p>
        )}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-navy-50 p-2">
            <div className="flex justify-center gap-0.5">
              {[0, 1, 2].map((i) => (
                <BieuTuong
                  key={i}
                  ten="sao"
                  dac
                  className={`h-4 w-4 ${i < t.sao ? "text-vang-500" : "text-slate-300"}`}
                />
              ))}
            </div>
            <div className="mt-1 text-[11px] text-slate-600">Sao</div>
          </div>
          <div className="rounded-xl bg-navy-50 p-2">
            <div className="nn-so text-base font-bold">
              {t.diemTot.toLocaleString("vi-VN")}
            </div>
            <div className="text-[11px] text-slate-600">Điểm cao nhất</div>
          </div>
          <div className="rounded-xl bg-navy-50 p-2">
            <div className="nn-so text-base font-bold">
              {tinhDiem
                ? `${Math.max(0, luotToiDa - t.luotTinhDiemDaDung)}/${luotToiDa}`
                : "Chơi thử"}
            </div>
            <div className="text-[11px] text-slate-600">
              {tinhDiem ? "Lượt tính điểm" : "Chưa tính điểm"}
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-dashed border-navy-200 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy-700">
            <BieuTuong ten="the" className="h-4 w-4" /> {t.the.ten}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {t.daQua ? t.the.noiDung : "Vượt trạm để mở thẻ sưu tầm này."}
          </p>
        </div>
        {t.moKhoa ? (
          <Link
            href={duongDanTram(t.ma)}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-son-600 text-base font-bold text-white hover:bg-son-700"
          >
            <BieuTuong ten="choi" dac className="h-4 w-4" />
            {t.dangChoi
              ? "Chơi tiếp lượt đang dở"
              : t.daQua
                ? "Chơi lại để nâng điểm"
                : "Vào trạm"}
          </Link>
        ) : (
          <p className="mt-4 flex items-center justify-center gap-2 rounded-full bg-slate-100 py-3 text-sm font-medium text-slate-500">
            <BieuTuong ten="khoa" className="h-4 w-4" /> Vượt trạm liền trước để
            mở
          </p>
        )}
      </div>
    </div>
  );
}
