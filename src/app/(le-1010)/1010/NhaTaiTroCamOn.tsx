import type { GoiTaiTro } from "@/lib/tai-tro-1010";

const VANG = "#e3b94a";

/**
 * Kiểu dáng từng hạng gói — dò theo tên gói nên BTC thêm gói mới vẫn có
 * kiểu hợp lý. Thứ bậc thể hiện bằng CỠ thẻ: Chính to nhất, nhỏ dần.
 */
function kieuGoi(ten: string): {
  cham: string; // màu hạt kim cương cạnh tiêu đề hạng
  the: string;
  bac: "chinh" | "kimcuong" | "lon" | "vua" | "nho";
} {
  const t = ten.toLowerCase();
  if (t.includes("chính"))
    return {
      cham: "#e3b94a",
      the: "quet-sang border-2 border-amber-300/90 bg-gradient-to-b from-amber-400/35 via-amber-500/15 to-transparent shadow-[0_0_45px_rgba(227,185,74,0.35)]",
      bac: "chinh",
    };
  if (t.includes("kim cương"))
    return {
      cham: "#a5f3fc",
      the: "border border-cyan-200/70 bg-gradient-to-b from-cyan-300/20 to-transparent shadow-[0_0_28px_rgba(165,243,252,0.18)]",
      bac: "kimcuong",
    };
  if (t.includes("vàng"))
    return {
      cham: "#e3b94a",
      the: "border border-amber-400/50 bg-amber-400/10",
      bac: "lon",
    };
  if (t.includes("bạc"))
    return {
      cham: "#cbd5e1",
      the: "border border-slate-300/50 bg-slate-300/10",
      bac: "lon",
    };
  if (t.includes("đồng hành"))
    return {
      cham: "#e2e8f0",
      the: "border border-white/25 bg-white/5",
      bac: "nho",
    };
  if (t.includes("đồng"))
    return {
      cham: "#fdba74",
      the: "border border-orange-400/50 bg-orange-400/10",
      bac: "vua",
    };
  return {
    cham: "#e2e8f0",
    the: "border border-white/25 bg-white/5",
    bac: "nho",
  };
}

const CO_THE: Record<string, string> = {
  chinh: "px-12 py-6 text-xl sm:text-2xl font-extrabold tracking-wide",
  kimcuong: "px-9 py-4.5 text-base sm:text-lg font-extrabold",
  lon: "px-5 py-3 text-sm font-bold",
  vua: "px-4 py-2.5 text-sm font-semibold",
  nho: "rounded-full px-4 py-2 text-xs font-semibold text-white/85",
};

/** Tiêu đề hạng có đường kẻ vàng mờ hai bên + hạt kim cương nhỏ. */
function TieuDeHang({ ten, cham }: { ten: string; cham: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400/40" />
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rotate-45"
        style={{ backgroundColor: cham }}
      />
      <span className="text-center text-[11px] font-bold tracking-[0.22em] whitespace-nowrap text-white/75 uppercase sm:text-xs">
        {ten}
      </span>
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rotate-45"
        style={{ backgroundColor: cham }}
      />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400/40" />
    </div>
  );
}

/**
 * Bức tường tri ân NHÀ TÀI TRỢ trên landing 10/10 — danh sách do BTC quản
 * ở /quan-tri/su-kien-1010 (xem src/lib/tai-tro-1010.ts). Thứ bậc gói thể
 * hiện bằng cỡ thẻ và ánh sáng, kiểu thiệp mời sang trọng navy – vàng đồng.
 */
export default function NhaTaiTroCamOn({ goi }: { goi: GoiTaiTro[] }) {
  if (goi.length === 0) return null;
  return (
    <div className="mx-auto mt-12 max-w-4xl rounded-[2rem] border border-amber-400/50 p-1.5">
      <div
        className="rounded-[1.7rem] border border-white/10 px-5 py-9 sm:px-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 50% 0%, rgba(227,185,74,0.10), rgba(227,185,74,0.02) 55%, transparent 75%)",
        }}
      >
        <p
          className="text-center text-xs font-bold tracking-[0.3em] uppercase"
          style={{ color: VANG }}
        >
          Trân trọng tri ân
        </p>
        <h3 className="mt-2 text-center text-2xl font-extrabold text-white sm:text-3xl">
          Nhà tài trợ &amp; Đối tác đồng hành
        </h3>
        <p className="mx-auto mt-2 max-w-md text-center text-xs leading-relaxed text-white/55">
          YBA Chợ Lớn xin cảm ơn các doanh nghiệp đã chung tay làm nên
          Lễ chuyển giao 10.10.2026
        </p>

        <div className="mt-9 space-y-9">
          {goi.map((g) => {
            const k = kieuGoi(g.ten);
            return (
              <div key={g.ten}>
                <TieuDeHang ten={g.ten} cham={k.cham} />
                <div className="mt-4 flex flex-wrap items-stretch justify-center gap-3">
                  {g.donVi.map((dv) => (
                    <span
                      key={dv}
                      className={`flex items-center justify-center rounded-2xl text-center leading-snug text-white transition hover:scale-[1.03] ${k.the} ${CO_THE[k.bac]}`}
                    >
                      {dv}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-9 text-center text-xs text-white/45">
          ✦ Danh sách tiếp tục được cập nhật đến ngày diễn ra chương trình ✦
        </p>
      </div>
    </div>
  );
}
