import {
  canChiCua,
  conGiapCua,
  napAmCua,
  menhCua,
  gapRanhAmLich,
} from "@/lib/chan-dung";
import { ZODIAC_DEPTH } from "@/lib/numerology-content";
import { hourChiRange, hourChiIndex } from "@/lib/lunar";
import { lapLaSo, LASO_LAYOUT } from "@/lib/tuvi";
import {
  CUNG_READINGS,
  CUC_READINGS,
  THAN_CU_READINGS,
  CHINH_TINH_READINGS,
  CANH_GIO_READINGS,
  tuviReadingOf,
} from "@/lib/tuvi-content";
import { zodiacRelations, menhRelations } from "@/lib/zodiac-relations";
import { SITE } from "@/lib/site";

/**
 * Báo cáo tử vi đầy đủ — dùng chung cho khu công khai và khu hội viên.
 * Có giờ sinh thì lập được LÁ SỐ 12 CUNG; chưa có giờ thì vẫn xem được phần
 * con giáp, mệnh ngũ hành và tuổi hợp — tuổi xung.
 */

const MAU_CSS: Record<string, string> = {
  Trắng: "#ffffff",
  Xám: "#9aa0a6",
  Ghi: "#c7cbd1",
  "Ánh kim": "#c9b037",
  Vàng: "#e8b923",
  "Nâu đất": "#8b5e3c",
  Đỏ: "#c0392b",
  Hồng: "#e78ba0",
  Tím: "#7d5ba6",
  Cam: "#e07b39",
  "Xanh lá": "#3a8a4f",
  "Xanh rêu": "#4a5d34",
  Đen: "#1f2430",
  "Xanh nước biển": "#1e3a6e",
  "Xanh nước biển sẫm": "#16294d",
};

function ODauMau({ ten }: { ten: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-sm text-slate-700 ring-1 ring-navy-100">
      <span
        aria-hidden
        className="h-3.5 w-3.5 rounded-full ring-1 ring-slate-300"
        style={{ background: MAU_CSS[ten] ?? "#ddd" }}
      />
      {ten}
    </span>
  );
}

function Phan({
  so,
  icon,
  tieuDe,
  moTa,
}: {
  so: string;
  icon: string;
  tieuDe: string;
  moTa?: string;
}) {
  return (
    <div className="mt-12 mb-5 flex items-start gap-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-navy-800 text-xl">
        {icon}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-do-500">
          Phần {so}
        </p>
        <h2 className="mt-0.5 text-xl font-extrabold tracking-tight text-navy-800">
          {tieuDe}
        </h2>
        {moTa && (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{moTa}</p>
        )}
      </div>
    </div>
  );
}

export default function BaoCaoTuVi({
  ngaySinh,
  gioSinh,
  noiSinh,
  hoTen,
}: {
  ngaySinh: Date;
  /** 0–23, null nếu chưa biết giờ sinh */
  gioSinh: number | null;
  noiSinh: string;
  hoTen: string;
}) {
  const nam = ngaySinh.getFullYear();
  const giap = conGiapCua(nam);
  const na = napAmCua(nam);
  const menh = menhCua(nam);
  const quanHe = zodiacRelations(giap.chi);
  const menhQH = menhRelations(menh.nguHanh);
  const sau = ZODIAC_DEPTH.find((d) => d.chi === giap.chi);

  const laSo = gioSinh !== null ? lapLaSo(ngaySinh, gioSinh) : null;

  return (
    <div>
      {/* ── 1. Tuổi & mệnh ────────────────────────────────────── */}
      <Phan
        so="1"
        icon="🏮"
        tieuDe="Tuổi và mệnh ngũ hành"
        moTa="Can chi, con giáp và nạp âm tính theo năm sinh."
      />
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-5 bg-navy-800 px-6 py-6 text-white">
          <span className="text-6xl">{giap.emoji}</span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-do-300">
              Sinh năm {nam}
            </p>
            <h3 className="mt-1 text-2xl font-extrabold">
              {canChiCua(nam)} · Tuổi {giap.ten}
            </h3>
            <p className="mt-1 text-sm text-navy-200">
              Nạp âm {na.tenNapAm} — mệnh {na.nguHanh}
            </p>
          </div>
        </div>
        <div className="space-y-3 p-5 sm:p-6">
          <p className="leading-relaxed text-slate-700">{giap.tinhCach}</p>
          <p className="leading-relaxed text-slate-600">
            {giap.phongCachLamViec}
          </p>
        </div>
      </div>

      {gapRanhAmLich(ngaySinh) && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
          ⚠️ Anh/chị sinh tháng {ngaySinh.getMonth() + 1} dương lịch — nếu sinh
          trước Tết Nguyên đán thì theo âm lịch thuộc năm {canChiCua(nam - 1)} (
          {conGiapCua(nam - 1).ten}), mệnh {napAmCua(nam - 1).nguHanh}.
        </p>
      )}

      {/* ── 2. Lá số tử vi 12 cung ────────────────────────────── */}
      <Phan
        so="2"
        icon="📜"
        tieuDe="Lá số tử vi 12 cung"
        moTa={
          laSo
            ? "Đồ hình an sao theo cách trình bày cổ truyền — đối chiếu với phần luận giải bên dưới."
            : "Cần thêm giờ sinh mới an sao được. Anh/chị bổ sung giờ sinh ở phần thông tin."
        }
      />

      {!laSo ? (
        <div className="card px-4 py-12 text-center">
          <span className="text-4xl">🔒</span>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
            Chọn <strong>giờ sinh</strong> ở phần thông tin để lập lá số tử vi 12
            cung — phần chi tiết nhất của báo cáo. Không nhớ giờ sinh thì hỏi ba
            mẹ giúp, vì sai giờ là sai cả lá số.
          </p>
        </div>
      ) : (
        <>
          <div className="card p-2 sm:p-3">
            <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
              {LASO_LAYOUT.map((chi, i) => {
                if (chi === "") {
                  // Bốn ô giữa gộp thành khối thông tin, chỉ dựng một lần
                  if (i !== 5) return null;
                  return (
                    <div
                      key="giua"
                      className="col-span-2 row-span-2 flex flex-col items-center justify-center rounded-xl bg-navy-800 p-3 text-center text-white sm:p-4"
                    >
                      <p className="text-[9px] font-semibold uppercase tracking-widest text-do-300 sm:text-[10px]">
                        {SITE.name} · Lá số tử vi
                      </p>
                      <p className="mt-1.5 text-base font-extrabold uppercase leading-tight sm:text-xl">
                        {hoTen}
                      </p>
                      <div className="mt-2 space-y-0.5 text-[10px] text-white/75 sm:text-xs">
                        <p>
                          Dương lịch: {ngaySinh.getDate()}/
                          {ngaySinh.getMonth() + 1}/{ngaySinh.getFullYear()}
                        </p>
                        <p>
                          Âm lịch: {laSo.lunar.day}/{laSo.lunar.month}
                          {laSo.lunar.isLeapMonth ? " (nhuận)" : ""} năm{" "}
                          {laSo.canChiYear}
                        </p>
                        <p className="text-do-300">
                          Giờ {laSo.gioChi} ({hourChiRange(hourChiIndex(gioSinh!))})
                        </p>
                        {noiSinh && <p>Nơi sinh: {noiSinh}</p>}
                      </div>
                      <div className="mt-2 space-y-0.5 text-[10px] sm:text-xs">
                        <p>
                          Mệnh:{" "}
                          <span className="text-do-300">
                            {napAmCua(laSo.lunar.year).tenNapAm}
                          </span>
                        </p>
                        <p>
                          Cục: <span className="text-do-300">{laSo.cuc.ten}</span>
                        </p>
                        <p className="text-white/60">Thân cư {laSo.thanCu}</p>
                      </div>
                    </div>
                  );
                }

                const p = laSo.palaces.find((x) => x.chi === chi)!;
                return (
                  <div
                    key={chi}
                    className={`flex min-h-[92px] flex-col rounded-xl border p-1.5 sm:min-h-[112px] sm:p-2 ${
                      p.isMenh
                        ? "border-do-400 bg-do-50"
                        : p.isThan
                          ? "border-do-200 bg-navy-50"
                          : "border-navy-100 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className={`text-[9px] font-semibold uppercase sm:text-[10px] ${
                          p.isMenh ? "text-do-700" : "text-slate-500"
                        }`}
                      >
                        {p.cung}
                        {p.isThan && " · Thân"}
                      </span>
                      <span className="text-[9px] text-slate-400 sm:text-[10px]">
                        {p.chi}
                      </span>
                    </div>
                    <div className="mt-1 flex-1 space-y-0.5">
                      {p.stars.map((s) => (
                        <p
                          key={s.name}
                          className={`leading-tight ${
                            s.type === "chinh"
                              ? "text-[10px] font-semibold text-navy-800 sm:text-xs"
                              : "text-[9px] text-slate-500 sm:text-[10px]"
                          }`}
                        >
                          {s.name}
                          {s.hoa && (
                            <span className="font-medium text-do-600">
                              {" "}
                              ({s.hoa})
                            </span>
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-center text-[10px] leading-relaxed text-slate-500">
              Ô viền đỏ = cung Mệnh · nền xanh nhạt = cung an Thân ·
              (Lộc/Quyền/Khoa/Kỵ) = Tứ Hoá năm sinh
            </p>
          </div>

          {/* Luận giải lá số */}
          <Phan
            so="3"
            icon="🔍"
            tieuDe="Luận giải lá số"
            moTa="Đọc từ cung Mệnh trở đi — đây là phần nói về con người thật của anh/chị."
          />

          <div className="space-y-4">
            {laSo.voChinhDieu ? (
              <div className="card p-5">
                <p className="font-bold text-navy-800">⭐ Mệnh vô chính diệu</p>
                <p className="mt-1.5 leading-relaxed text-slate-700">
                  Cung Mệnh không có chính tinh toạ thủ — theo phép cổ, mượn
                  chính tinh cung Thiên Di (đối diện) để luận. Người mệnh vô
                  chính diệu thường linh hoạt, đời nhiều bước ngoặt và giỏi thích
                  nghi hơn người thường.
                </p>
                {laSo.borrowedStars.map((ten) => {
                  const r = tuviReadingOf(CHINH_TINH_READINGS, ten);
                  return r ? (
                    <div
                      key={ten}
                      className="mt-3 border-t border-navy-100 pt-3"
                    >
                      <p className="font-semibold text-navy-800">
                        {ten}{" "}
                        <span className="text-xs font-normal text-slate-500">
                          (mượn từ Thiên Di)
                        </span>
                      </p>
                      <p className="mt-1 leading-relaxed text-slate-700">
                        {r.reading}
                      </p>
                    </div>
                  ) : null;
                })}
              </div>
            ) : (
              <div className="card p-5">
                <p className="font-bold text-navy-800">
                  ⭐ Chính tinh thủ Mệnh tại {laSo.menhChi}
                </p>
                <div className="mt-3 space-y-4">
                  {laSo.menhChinhTinh.map((ten) => {
                    const r = tuviReadingOf(CHINH_TINH_READINGS, ten);
                    return r ? (
                      <div key={ten}>
                        <p className="font-semibold text-navy-800">
                          {ten} — {r.title}
                        </p>
                        <p className="mt-1 leading-relaxed text-slate-700">
                          {r.reading}
                        </p>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {(() => {
                const r = tuviReadingOf(CUC_READINGS, laSo.cuc.ten);
                return r ? (
                  <div className="card p-5">
                    <p className="font-bold text-navy-800">
                      ⚙️ {laSo.cuc.ten} — {r.title}
                    </p>
                    <p className="mt-1.5 leading-relaxed text-slate-700">
                      {r.reading}
                    </p>
                  </div>
                ) : null;
              })()}
              {(() => {
                const r = tuviReadingOf(CANH_GIO_READINGS, laSo.gioChi);
                return r ? (
                  <div className="card p-5">
                    <p className="font-bold text-navy-800">
                      🕐 Sinh giờ {laSo.gioChi} — {r.title}
                    </p>
                    <p className="mt-1.5 leading-relaxed text-slate-700">
                      {r.reading}
                    </p>
                  </div>
                ) : null;
              })()}
            </div>

            {(() => {
              const r = tuviReadingOf(THAN_CU_READINGS, laSo.thanCu);
              return r ? (
                <div className="card border-do-200 p-5">
                  <p className="font-bold text-navy-800">
                    🎯 Thân cư {laSo.thanCu} — {r.title}
                  </p>
                  <p className="mt-1.5 leading-relaxed text-slate-700">
                    {r.reading}
                  </p>
                </div>
              ) : null;
            })()}

            <div className="card p-5">
              <p className="font-bold text-navy-800">
                🏛️ Ý nghĩa 12 cung trên lá số
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Bấm từng cung để đọc — đối chiếu với đồ hình phía trên xem cung
                đó của anh/chị đóng tại đâu và có sao nào.
              </p>
              <div className="mt-4 space-y-1.5">
                {CUNG_READINGS.map((c) => {
                  const pal = laSo.palaces.find((x) => x.cung === c.key);
                  const chinh =
                    pal?.stars.filter((s) => s.type === "chinh") ?? [];
                  return (
                    <details
                      key={c.key}
                      className="rounded-xl border border-navy-100 px-4 py-3"
                    >
                      <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm font-medium text-navy-800">
                        <span>
                          {c.key}{" "}
                          <span className="font-normal text-slate-500">
                            — {c.title}
                          </span>
                        </span>
                        {pal && (
                          <span className="ml-auto text-xs text-do-600">
                            tại {pal.chi}
                            {chinh.length > 0 &&
                              ` · ${chinh.map((s) => s.name).join(", ")}`}
                          </span>
                        )}
                      </summary>
                      <p className="mt-2 leading-relaxed text-slate-700">
                        {c.reading}
                      </p>
                    </details>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Con giáp trong công việc ──────────────────────────── */}
      {sau && (
        <>
          <Phan
            so={laSo ? "4" : "3"}
            icon={giap.emoji}
            tieuDe={`Tuổi ${giap.chi} trong kinh doanh`}
            moTa="Thế mạnh, điểm cần lưu ý và hướng nghề hợp với người tuổi này."
          />
          <div className="card space-y-5 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-sm font-semibold text-emerald-700">
                  Điểm mạnh
                </p>
                <ul className="space-y-1.5">
                  {sau.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                      <span className="leading-relaxed text-slate-700">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 text-sm font-semibold text-amber-700">
                  Cần lưu ý
                </p>
                <ul className="space-y-1.5">
                  {sau.watchouts.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="mt-0.5 shrink-0 text-amber-600">!</span>
                      <span className="leading-relaxed text-slate-700">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-2 rounded-xl bg-navy-50 p-4 text-sm leading-relaxed">
              <p className="text-slate-700">
                <strong className="text-navy-800">💼 Phong cách kinh doanh:</strong>{" "}
                {sau.businessStyle}
              </p>
              <p className="text-slate-700">
                <strong className="text-navy-800">🧭 Hướng nghề hợp:</strong>{" "}
                {sau.careerFit}
              </p>
              <p className="text-slate-700">
                <strong className="text-navy-800">💡 Lời khuyên:</strong> {sau.tip}
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── Tuổi hợp — tuổi xung ──────────────────────────────── */}
      <Phan
        so={laSo ? "5" : "4"}
        icon="🤝"
        tieuDe="Tuổi hợp — tuổi cần dung hoà"
        moTa={`Các tuổi khác trong nhóm với tuổi ${giap.chi} của anh/chị — tham khảo khi chọn cộng sự, góp vốn hoặc tuyển người cho vị trí quan trọng.`}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card border-emerald-200 p-5">
          <p className="text-sm font-semibold text-emerald-700">Tam hợp</p>
          <p className="mt-1 text-lg font-extrabold text-navy-800">
            {quanHe.tamHop.join(" · ")}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            Bộ ba tương trợ bền vững — dễ hiểu ý nhau khi làm chung.
          </p>
        </div>
        <div className="card border-emerald-200 p-5">
          <p className="text-sm font-semibold text-emerald-700">
            Lục hợp (nhị hợp)
          </p>
          <p className="mt-1 text-lg font-extrabold text-navy-800">
            {quanHe.lucHop}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            Cặp tuổi âm thầm nâng đỡ nhau — cộng sự ăn ý.
          </p>
        </div>
        <div className="card border-amber-200 p-5">
          <p className="text-sm font-semibold text-amber-700">Tứ hành xung</p>
          <p className="mt-1 text-lg font-extrabold text-navy-800">
            {quanHe.tuXung.join(" · ")}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            Dễ khác quan điểm — không phải xấu, chỉ cần lắng nghe nhiều hơn.
          </p>
        </div>
      </div>

      {/* ── Mệnh ngũ hành & màu sắc ───────────────────────────── */}
      <Phan
        so={laSo ? "6" : "5"}
        icon="☯️"
        tieuDe={`Mệnh ${menh.nguHanh} — ngũ hành & màu sắc`}
        moTa="Bản mệnh, quan hệ tương sinh tương khắc và cách dùng màu trong kinh doanh."
      />
      <div className="card space-y-5 p-5 sm:p-6">
        <p className="leading-relaxed text-slate-700">{menh.moTa}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">Tương sinh</p>
            <p className="mt-1 text-sm leading-relaxed text-emerald-900">
              Mệnh <strong>{menhQH.duocSinh}</strong> sinh cho anh/chị (quý nhân)
              · anh/chị sinh cho mệnh <strong>{menhQH.sinhCho}</strong>
            </p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">Tương khắc</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-900">
              Mệnh <strong>{menhQH.biKhac}</strong> khắc anh/chị · anh/chị khắc
              mệnh <strong>{menhQH.khac}</strong> — hợp tác vẫn tốt, chỉ cần rõ
              ràng từ đầu
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              Màu tương hợp
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {menh.mauHop.map((m) => (
                <ODauMau key={m} ten={m} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-do-700">
              Màu nên hạn chế
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {menh.mauTranh.map((m) => (
                <ODauMau key={m} ten={m} />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-navy-800 p-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-do-300">
            Dùng màu bản mệnh trong kinh doanh
          </p>
          <p className="mt-2 leading-relaxed text-navy-100">{menh.ungDung}</p>
        </div>
      </div>

      <p className="mt-6 rounded-xl bg-navy-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
        Tử vi và ngũ hành là góc nhìn văn hoá Á Đông mang tính tham khảo, không
        phải cơ sở để ra quyết định kinh doanh. Lá số được an sao theo phép cổ
        truyền phổ thông; các trường phái khác nhau có thể cho kết quả hơi khác.
      </p>
    </div>
  );
}
