import {
  expressionNumber,
  soulUrgeNumber,
  personalityNumber,
  birthdayNumber,
  attitudeNumber,
  maturityNumber,
  personalYearNumber,
  missingNameNumbers,
  birthChart,
  birthChartArrows,
  CHART_LAYOUT,
} from "@/lib/numerology";
import {
  EXPRESSION_READINGS,
  SOUL_READINGS,
  PERSONALITY_NUM_READINGS,
  BIRTHDAY_READINGS,
  ATTITUDE_READINGS,
  MATURITY_READINGS,
  PERSONAL_YEAR_READINGS,
  ARROW_READINGS,
  CHART_DIGIT_MEANINGS,
  readingOf,
  type NumberReading,
} from "@/lib/numerology-content";
import { soChuDao, thanSoCua } from "@/lib/chan-dung";

/**
 * Báo cáo thần số học đầy đủ — dùng chung cho khu công khai (WHO AM I?) và
 * khu hội viên. Gồm 5 phần: số chủ đạo, biểu đồ ngày sinh + mũi tên, bộ chỉ số
 * theo họ tên, các chỉ số phụ theo ngày sinh, và năm cá nhân.
 */

/** Tiêu đề một phần lớn trong báo cáo. */
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

/** Thẻ diễn giải một chỉ số — dùng lại cho mọi mục trong báo cáo. */
function TheChiSo({
  nhan,
  icon,
  so,
  bai,
  noiBat = false,
}: {
  nhan: string;
  icon: string;
  so: number;
  bai: NumberReading | null;
  noiBat?: boolean;
}) {
  if (!bai) return null;

  return (
    <div className="card overflow-hidden">
      <div
        className={`flex items-center gap-4 px-5 py-4 ${
          noiBat ? "bg-navy-800 text-white" : "bg-navy-50"
        }`}
      >
        <span
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl font-extrabold ${
            noiBat
              ? "bg-do-600 text-white"
              : "bg-white text-navy-800 ring-1 ring-navy-200"
          }`}
        >
          {so}
        </span>
        <div className="min-w-0">
          <p
            className={`text-[11px] font-semibold uppercase tracking-widest ${
              noiBat ? "text-do-300" : "text-slate-500"
            }`}
          >
            {icon} {nhan}
          </p>
          <p
            className={`mt-0.5 text-lg font-bold leading-snug ${
              noiBat ? "text-white" : "text-navy-800"
            }`}
          >
            {bai.title}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <p className="leading-relaxed text-slate-700">{bai.overview}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-sm font-semibold text-emerald-700">
              Điểm mạnh
            </p>
            <ul className="space-y-1.5">
              {bai.strengths.map((s, i) => (
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
              {bai.watchouts.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="mt-0.5 shrink-0 text-amber-600">!</span>
                  <span className="leading-relaxed text-slate-700">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="rounded-xl bg-do-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
          <strong className="text-do-800">💡 Lời khuyên:</strong> {bai.advice}
        </p>
      </div>
    </div>
  );
}

export default function BaoCaoThanSo({
  ngaySinh,
  hoTen,
  ten,
}: {
  ngaySinh: Date;
  hoTen: string;
  /** Tên gọi để xưng hô trong tiêu đề */
  ten: string;
}) {
  const ts = thanSoCua(ngaySinh);
  if (!ts) return null;

  const chart = birthChart(ngaySinh);
  const muiTen = birthChartArrows(chart);

  const coTen = hoTen.trim().length >= 4;
  const suMenh = coTen ? expressionNumber(hoTen) : null;
  const linhHon = coTen ? soulUrgeNumber(hoTen) : null;
  const nhanCach = coTen ? personalityNumber(hoTen) : null;
  const thieu = coTen ? missingNameNumbers(hoTen) : [];

  // Năm hiện tại theo giờ Việt Nam
  const namNay = Number(
    new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
    }).format(new Date())
  );
  const namCaNhan = personalYearNumber(ngaySinh, namNay);
  const baiNam = PERSONAL_YEAR_READINGS.find((x) => x.number === namCaNhan);

  return (
    <div>
      {/* ── 1. Số chủ đạo ─────────────────────────────────────── */}
      <Phan
        so="1"
        icon="⭐"
        tieuDe="Số chủ đạo"
        moTa="Con số quan trọng nhất — con đường và bài học lớn của đời anh/chị."
      />
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-5 bg-navy-800 px-6 py-6 text-white">
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-do-600 text-4xl font-extrabold">
            {soChuDao(ngaySinh)}
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-do-300">
              Số chủ đạo của {ten}
            </p>
            <h3 className="mt-1 text-2xl font-extrabold">{ts.tieuDe}</h3>
            <p className="mt-1 text-sm text-navy-200">
              Sinh ngày {ngaySinh.getDate()}/{ngaySinh.getMonth() + 1}/
              {ngaySinh.getFullYear()}
            </p>
          </div>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <p className="leading-relaxed text-slate-700">{ts.tongQuan}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-sm font-semibold text-emerald-700">
                Thế mạnh
              </p>
              <ul className="space-y-1.5">
                {ts.theManh.map((s, i) => (
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
                {ts.luuY.map((s, i) => (
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
              {ts.phongCachKinhDoanh}
            </p>
            <p className="text-slate-700">
              <strong className="text-navy-800">💡 Lời khuyên:</strong>{" "}
              {ts.loiKhuyen}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Biểu đồ ngày sinh ──────────────────────────────── */}
      <Phan
        so="2"
        icon="🔷"
        tieuDe="Biểu đồ ngày sinh"
        moTa="Các chữ số trong ngày–tháng–năm sinh xếp vào lưới 3×3. Số lặp nhiều lần là vùng năng lượng đậm của anh/chị."
      />
      <div className="card p-5 sm:p-6">
        <div className="mx-auto grid max-w-xs grid-cols-3 gap-2.5">
          {CHART_LAYOUT.flat().map((so) => (
            <div
              key={so}
              className={`grid aspect-square place-items-center rounded-xl border-2 ${
                chart[so] > 0
                  ? "border-do-400 bg-do-50"
                  : "border-navy-100 bg-slate-50"
              }`}
            >
              {chart[so] > 0 ? (
                <span className="text-lg font-extrabold tracking-wider text-navy-800">
                  {String(so).repeat(Math.min(chart[so], 4))}
                </span>
              ) : (
                <span className="text-sm text-slate-300">{so}</span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">
          Ô đỏ = số có trong ngày sinh (lặp mấy lần hiện bấy nhiêu chữ số) · ô
          xám = số trống
        </p>

        <details className="mt-5 rounded-xl bg-navy-50 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-navy-700">
            Ý nghĩa từng con số trong biểu đồ
          </summary>
          <ul className="mt-3 space-y-1.5 text-sm">
            {CHART_DIGIT_MEANINGS.map((m) => (
              <li key={m.digit} className="leading-relaxed text-slate-700">
                <strong className="text-navy-800">{m.digit}</strong> — {m.meaning}
              </li>
            ))}
          </ul>
        </details>
      </div>

      {(muiTen.present.length > 0 || muiTen.missing.length > 0) && (
        <div className="mt-4 space-y-3">
          {muiTen.present.map((k) => {
            const a = ARROW_READINGS.find((x) => x.key === k);
            if (!a) return null;
            return (
              <div key={k} className="card border-emerald-200 p-5">
                <p className="font-bold text-navy-800">
                  🏹 {a.name}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    (có đủ {k.split("").join("–")})
                  </span>
                </p>
                <p className="mt-1.5 leading-relaxed text-slate-700">
                  {a.presentDesc}
                </p>
                <ul className="mt-2.5 space-y-1.5">
                  {a.presentTips.map((t, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                      <span className="leading-relaxed text-slate-700">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {muiTen.missing.map((k) => {
            const a = ARROW_READINGS.find((x) => x.key === k);
            if (!a) return null;
            return (
              <div key={k} className="card border-amber-200 p-5">
                <p className="font-bold text-navy-800">
                  🕳️ {a.missingName}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    (trống {k.split("").join("–")})
                  </span>
                </p>
                <p className="mt-1.5 leading-relaxed text-slate-700">
                  {a.missingDesc}
                </p>
                <ul className="mt-2.5 space-y-1.5">
                  {a.missingTips.map((t, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="mt-0.5 shrink-0 text-amber-600">→</span>
                      <span className="leading-relaxed text-slate-700">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 3. Bộ chỉ số theo họ tên ──────────────────────────── */}
      <Phan
        so="3"
        icon="✍️"
        tieuDe="Bộ chỉ số theo họ tên"
        moTa={
          coTen
            ? `Tính từ họ tên khai sinh: ${hoTen}`
            : "Nhập họ tên khai sinh ở phần thông tin để mở khoá ba chỉ số này."
        }
      />
      {coTen && suMenh != null && linhHon != null && nhanCach != null ? (
        <div className="space-y-4">
          <TheChiSo
            nhan="Số sứ mệnh"
            icon="🎯"
            so={suMenh}
            bai={readingOf(EXPRESSION_READINGS, suMenh)}
            noiBat
          />
          <TheChiSo
            nhan="Số linh hồn"
            icon="💗"
            so={linhHon}
            bai={readingOf(SOUL_READINGS, linhHon)}
          />
          <TheChiSo
            nhan="Số nhân cách"
            icon="🎭"
            so={nhanCach}
            bai={readingOf(PERSONALITY_NUM_READINGS, nhanCach)}
          />

          {thieu.length > 0 && (
            <div className="card p-5">
              <p className="font-bold text-navy-800">
                🧩 Những con số thiếu trong tên
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {thieu.map((m) => (
                  <span key={m} className="chip">
                    {m}
                  </span>
                ))}
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {thieu.map((m) => {
                  const mm = CHART_DIGIT_MEANINGS.find((x) => x.digit === m);
                  return mm ? (
                    <li key={m} className="leading-relaxed text-slate-700">
                      <strong className="text-navy-800">{m}</strong> — {mm.meaning}
                    </li>
                  ) : null;
                })}
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                Số thiếu không phải điểm xấu — chỉ là vùng năng lượng cần chủ động
                rèn thêm qua trải nghiệm.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="card px-4 py-10 text-center text-sm text-slate-500">
          🔒 Chưa có họ tên khai sinh — Số sứ mệnh, Số linh hồn và Số nhân cách
          đang chờ anh/chị mở khoá.
        </div>
      )}

      {/* ── 4. Chỉ số theo ngày sinh ──────────────────────────── */}
      <Phan
        so="4"
        icon="📅"
        tieuDe="Các chỉ số theo ngày sinh"
        moTa="Những lớp năng lượng bổ trợ quanh số chủ đạo."
      />
      <div className="space-y-4">
        <TheChiSo
          nhan="Số ngày sinh"
          icon="🎁"
          so={birthdayNumber(ngaySinh)}
          bai={readingOf(BIRTHDAY_READINGS, birthdayNumber(ngaySinh))}
        />
        <TheChiSo
          nhan="Số thái độ"
          icon="🤝"
          so={attitudeNumber(ngaySinh)}
          bai={readingOf(ATTITUDE_READINGS, attitudeNumber(ngaySinh))}
        />
        {coTen && suMenh != null && (
          <TheChiSo
            nhan="Số trưởng thành"
            icon="🌳"
            so={maturityNumber(soChuDao(ngaySinh), suMenh)}
            bai={readingOf(
              MATURITY_READINGS,
              maturityNumber(soChuDao(ngaySinh), suMenh)
            )}
          />
        )}
      </div>

      {/* ── 5. Năm cá nhân ────────────────────────────────────── */}
      {baiNam && (
        <>
          <Phan
            so="5"
            icon="🗓️"
            tieuDe={`Năm cá nhân ${namNay}`}
            moTa="Chủ đề năng lượng của anh/chị trong năm nay."
          />
          <div className="card overflow-hidden">
            <div className="flex items-center gap-4 bg-navy-800 px-5 py-4 text-white">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-do-600 text-xl font-extrabold">
                {namCaNhan}
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-do-300">
                  Năm cá nhân {namNay}
                </p>
                <p className="mt-0.5 text-lg font-bold">{baiNam.title}</p>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <p className="leading-relaxed text-slate-700">{baiNam.overview}</p>
              <div>
                <p className="mb-1.5 text-sm font-semibold text-navy-800">
                  🎯 Nên tập trung
                </p>
                <ul className="space-y-1.5">
                  {baiNam.focus.map((f, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="mt-0.5 shrink-0 text-do-500">▸</span>
                      <span className="leading-relaxed text-slate-700">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="rounded-xl bg-do-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
                <strong className="text-do-800">💡</strong> {baiNam.advice}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
