import Link from "next/link";

export type MucLich = {
  id: string;
  slug: string | null;
  tieuDe: string;
  moTa: string | null;
  tuNgay: Date;
  denNgay: Date | null;
  diaDiem: string | null;
  gioText: string | null;
  nguon: string;
  noiBat: boolean;
  lienKet: string | null;
  choDangKy?: boolean;
};

const NGUON: Record<string, { ten: string; lop: string }> = {
  CHI_HOI: { ten: "Chi hội Chợ Lớn", lop: "bg-do-50 text-do-700 ring-do-200" },
  HOI: { ten: "Hội DNT TP.HCM", lop: "bg-navy-50 text-navy-700 ring-navy-200" },
  DOI_TAC: { ten: "Đối tác", lop: "bg-slate-100 text-slate-600 ring-slate-200" },
};

const THU = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

/** Ngày dạng "16/07 (Thứ Năm)" hoặc khoảng "17–18/07". */
function ngayGon(tu: Date, den: Date | null): string {
  const d = (x: Date) => `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}`;
  if (den && den.toDateString() !== tu.toDateString()) return `${d(tu)} – ${d(den)}`;
  return `${d(tu)} · ${THU[tu.getDay()]}`;
}

/**
 * Bảng lịch hoạt động sắp tới — dùng ở trang chủ (rút gọn) và trang
 * /lich-hoat-dong (đầy đủ).
 */
export default function LichHoatDong({
  ds,
  gonGang = false,
}: {
  ds: MucLich[];
  /** Bản rút gọn cho trang chủ */
  gonGang?: boolean;
}) {
  if (ds.length === 0) {
    return (
      <div className="card px-4 py-12 text-center text-sm text-slate-500">
        Chưa có hoạt động nào được công bố. Anh chị theo dõi fanpage Chi hội để
        cập nhật sớm nhất.
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {ds.map((m, i) => {
        const n = NGUON[m.nguon] ?? NGUON.CHI_HOI;
        // Sự kiện có LANDING RIÊNG trong web (lienKet bắt đầu bằng "/",
        // ví dụ Lễ chuyển giao 10/10 → /1010) thì nhảy thẳng vào đó
        // (Chủ nhiệm chốt 24/09); còn lại ưu tiên trang chi tiết lịch,
        // cuối cùng mới tới liên kết ngoài.
        const duong =
          m.lienKet?.startsWith("/")
            ? m.lienKet
            : m.slug
              ? `/lich-hoat-dong/${m.slug}`
              : m.lienKet;
        const daQua = m.tuNgay < new Date(new Date().setHours(0, 0, 0, 0));
        const ruot = (
          <>
            {/* Số thứ tự + ngày, cột trái cố định để mắt chạy dọc cho nhanh */}
            <div className="flex shrink-0 flex-col items-center gap-1 sm:w-32">
              <span
                className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-extrabold ${
                  m.noiBat ? "bg-do-600 text-white" : "bg-navy-800 text-white"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={`text-center text-xs font-semibold leading-tight ${
                  m.noiBat ? "text-do-700" : "text-navy-700"
                }`}
              >
                {ngayGon(m.tuNgay, m.denNgay)}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${n.lop}`}
                >
                  {n.ten}
                </span>
                {m.noiBat && (
                  <span className="rounded-full bg-do-600 px-2 py-0.5 text-[11px] font-bold text-white">
                    Nổi bật
                  </span>
                )}
              </div>

              <h3
                className={`mt-1.5 font-bold leading-snug ${
                  m.noiBat ? "text-do-700" : "text-navy-800"
                }`}
              >
                {m.tieuDe}
              </h3>

              {!gonGang && m.moTa && (
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {m.moTa}
                </p>
              )}

              {(m.diaDiem || m.gioText) && (
                <p className="mt-1.5 text-sm text-slate-500">
                  {m.gioText && <span className="mr-2">🕐 {m.gioText}</span>}
                  {m.diaDiem && <span>📍 {m.diaDiem}</span>}
                </p>
              )}

              {/* Nút đăng ký ngay trên thẻ — đỡ phải mở trang chi tiết mới thấy */}
              {!gonGang && duong && (
                <p className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-do-600">
                    Xem chi tiết →
                  </span>
                  {m.choDangKy !== false && !daQua && (
                    <span className="rounded-full bg-do-600 px-3 py-1 text-xs font-bold text-white">
                      Đăng ký tham gia
                    </span>
                  )}
                </p>
              )}
            </div>
          </>
        );

        const lop = `card flex gap-4 p-4 ${
          m.noiBat ? "border-do-200 bg-do-50/40" : ""
        }`;

        return (
          <li key={m.id}>
            {duong ? (
              <Link href={duong} className={`${lop} transition hover:shadow-md`}>
                {ruot}
              </Link>
            ) : (
              <div className={lop}>{ruot}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
