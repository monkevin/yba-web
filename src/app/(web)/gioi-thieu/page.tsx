import Link from "next/link";
import type { Metadata } from "next";
import {
  DINH_HUONG,
  HOI_CAP_TREN,
  MUC_TIEU_NHIEM_KY,
  SITE,
} from "@/lib/site";
import { BDH_NK1 } from "@/lib/bdh-nk1";
import { prisma } from "@/lib/prisma";
import { docTrang, tachDoan } from "@/lib/trang-tinh";
import HienDan from "@/components/web/HienDan";
import HaiNhiemKy from "./HaiNhiemKy";

export const metadata: Metadata = {
  title: "Giới thiệu Chi hội",
  description: `${SITE.fullName} — thành lập năm ${SITE.founded}, quy tụ doanh nhân trẻ khu vực Chợ Lớn, TP.HCM.`,
};

const NANG_LUC = [
  {
    no: "01",
    title: "Năng lực của YBA Chợ Lớn",
    items: [
      "Quản lý tài chính hiệu quả và minh bạch",
      "Thông tin và truyền thông đầy đủ",
      "Cam kết của Ban Chủ nhiệm",
    ],
  },
  {
    no: "02",
    title: "Kết nối tình huynh đệ",
    items: [
      "Gắn kết các thành viên trong hội",
      "Thu hút các thành viên ngoài hội",
      "Đồng hành, hỗ trợ lẫn nhau",
    ],
  },
  {
    no: "03",
    title: "Hoạt động của Chi hội",
    items: ["Kết nối giao thương", "Gắn kết hội viên", "Nâng tầm doanh nhân"],
  },
  {
    no: "04",
    title: "Giá trị cho YBA",
    items: [
      "Lan toả hình ảnh của YBA",
      "Nâng cao trách nhiệm cộng đồng",
    ],
  },
];

const CHUONG_TRINH = [
  {
    icon: "☕",
    name: "Coffee Share",
    desc: "Sự kiện gặp gỡ định kỳ, tạo môi trường giao lưu thân thiện để chia sẻ kinh nghiệm, ý tưởng kinh doanh và thông tin thị trường.",
  },
  {
    icon: "📚",
    name: "Business & Library",
    desc: "Hoạt động gắn kết các thành viên, trao đổi và học hỏi kinh nghiệm kinh doanh để nâng tầm cho các thành viên trong hội.",
  },
  {
    icon: "🤝",
    name: "Họp mặt hội viên",
    desc: "Cơ hội kết nối và chia sẻ giữa các thành viên trong Chi hội, kết hợp tham quan và học hỏi tại doanh nghiệp hội viên.",
  },
  {
    icon: "🚐",
    name: "Caravan xúc tiến thương mại",
    desc: "Hành trình kết nối giao thương với hội doanh nhân trẻ các tỉnh thành: Đồng Tháp, Gia Lai – Kon Tum, Khánh Hoà, Phan Rang...",
  },
  {
    icon: "🏓",
    name: "CLB Pickleball YBA",
    desc: "Sân chơi giao lưu rèn luyện sức khoẻ, tăng cường kết nối và gắn bó giữa các hội viên qua tinh thần thể thao.",
  },
  {
    icon: "📖",
    name: "Thư viện Container",
    desc: "Dự án cộng đồng của YBA HCM: mỗi trang sách, vạn ước mơ — mang thư viện tới học sinh vùng sâu vùng xa.",
  },
];

export default async function GioiThieu() {
  // Ban Chủ nhiệm soạn lại phần mở đầu ở /quan-tri/trang thì dùng bản đó
  const [tuySoan, bcn] = await Promise.all([
    docTrang("gioi-thieu"),
    prisma.leader.findMany({
      where: { active: true, group: "BAN_CHU_NHIEM" },
      orderBy: { order: "asc" },
      select: { id: true, slug: true, name: true, title: true, photo: true },
    }),
  ]);

  return (
    <>
      <section className="bg-navy-800 py-16 text-white">
        <div className="wrap">
          <p className="eyebrow text-do-300">Về chúng tôi</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {tuySoan?.title ?? SITE.fullName}
          </h1>
          {tuySoan ? (
            <div className="mt-4 max-w-3xl space-y-3 text-lg leading-relaxed text-white/85">
              {tachDoan(tuySoan.content).map((d, i) => (
                <p key={i} className="whitespace-pre-line">
                  {d}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/85">
              Chi hội Chợ Lớn được thành lập từ năm {SITE.founded}, quy tụ{" "}
              {SITE.quyMoCongBo} là các doanh nhân trẻ từ 18 đến 45 tuổi trong
              nhiều lĩnh vực ngành nghề khác nhau, có trụ sở đóng trên địa bàn các
              quận {SITE.areas.join(", ")}.
            </p>
          )}

          <div className="mt-7 flex flex-wrap gap-2.5">
            <span className="rounded-full bg-do-600 px-4 py-1.5 text-sm font-semibold">
              {SITE.slogan}
            </span>
            <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-navy-50 ring-1 ring-white/20">
              {SITE.sloganPhu}
            </span>
          </div>
        </div>
      </section>

      {/* ── Hội cấp trên: nguyên văn theo tài liệu của Hội ────── */}
      <HienDan the="section" className="wrap mt-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <span className="eyebrow">Hội cấp trên</span>
            <h2 className="section-title">{HOI_CAP_TREN.ten}</h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              {HOI_CAP_TREN.moDau}
            </p>
            <p className="mt-4 leading-relaxed text-slate-600">
              YBA TP.HCM hiện có 5 chi hội theo địa bàn: Gia Định, Chợ Lớn, Sài
              Gòn, Tân Sơn Nhất và Thủ Đức.
            </p>

            <dl className="mt-6 space-y-4">
              <div className="rounded-xl border-l-4 border-l-do-500 bg-navy-50 p-4">
                <dt className="text-sm font-bold uppercase tracking-wide text-do-600">
                  Tầm nhìn
                </dt>
                <dd className="mt-1.5 leading-relaxed text-slate-700">
                  {HOI_CAP_TREN.tamNhin}
                </dd>
              </div>
              <div className="rounded-xl border-l-4 border-l-navy-500 bg-navy-50 p-4">
                <dt className="text-sm font-bold uppercase tracking-wide text-navy-700">
                  Sứ mệnh
                </dt>
                <dd className="mt-1.5 leading-relaxed text-slate-700">
                  {HOI_CAP_TREN.suMenh}
                </dd>
              </div>
            </dl>
          </div>
          <div>
            <span className="eyebrow">Cộng đồng</span>
            <h2 className="section-title">
              Doanh nhân trẻ Việt Nam và quốc tế
            </h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              Chi hội Chợ Lớn là ngôi nhà chung của doanh nhân trẻ, với tinh thần
              luôn gắn kết, cùng nhau chia sẻ và hỗ trợ nâng cao năng lực quản
              trị doanh nghiệp, tiếp cận thị trường; cùng nhau phát triển, kết
              nối giao thương giữa các thành viên chi hội với lãnh đạo địa phương
              và các doanh nhân thuộc các hội, hiệp hội bạn.
            </p>
            <Link href="/doanh-nghiep" className="btn-primary mt-6">
              Xem danh bạ doanh nghiệp hội viên
            </Link>

            <h3 className="mt-8 text-lg font-bold text-navy-800">
              Mục tiêu hoạt động của Hội
            </h3>
            <ul className="mt-3 space-y-2.5">
              {HOI_CAP_TREN.mucTieu.map((m, i) => (
                <li key={i} className="flex gap-2.5 leading-relaxed text-slate-600">
                  <span className="mt-0.5 shrink-0 text-do-500">▸</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Ba mốc pháp lý — có số quyết định nên trình bày dạng dòng thời gian */}
        <div className="mt-12">
          <h3 className="text-lg font-bold text-navy-800">
            Hình thành &amp; phát triển
          </h3>
          <ol className="mt-4 grid gap-4 sm:grid-cols-3">
            {HOI_CAP_TREN.mocLichSu.map((m) => (
              <li key={m.moc} className="card border-t-4 border-t-do-500 p-5">
                <p className="font-mono text-sm font-bold text-do-600">{m.moc}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {m.noiDung}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </HienDan>

      {/* ── Mục tiêu chiến lược nhiệm kỳ của Chi hội ──────────── */}
      <HienDan the="section" className="san-do luoi-ky-thuat relative mt-16 overflow-hidden py-16 text-white">
        <div className="wrap">
          {/* SITE.term đã sẵn chữ "Nhiệm kỳ" ở đầu — đừng viết "Nhiệm kỳ
              {SITE.term}" kẻo ra "Nhiệm kỳ Nhiệm kỳ XII" (lỗi từng lên web) */}
          <p className="eyebrow text-do-300">{SITE.term}</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Mục tiêu chiến lược của Chi hội
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-white/80">
            Ba trụ Ban Chủ nhiệm cam kết theo đuổi trong suốt nhiệm kỳ.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {MUC_TIEU_NHIEM_KY.map((t) => (
              <div
                key={t.tru}
                className="rounded-2xl bg-white/10 p-6 ring-1 ring-white/15 backdrop-blur-sm"
              >
                <h3 className="text-lg font-bold">{t.tru}</h3>
                <ul className="mt-4 space-y-2.5">
                  {t.y.map((y) => (
                    <li key={y} className="flex gap-2.5 text-white/85">
                      <span className="mt-0.5 shrink-0 text-do-300">✓</span>
                      <span>{y}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </HienDan>

      <HienDan the="section" className="mt-16 bg-navy-50 py-16">
        <div className="wrap">
          <span className="eyebrow">{SITE.term}</span>
          <h2 className="section-title">Mục tiêu &amp; định hướng</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
            Các hoạt động của Chi hội Chợ Lớn gắn liền với{" "}
            <strong className="text-navy-800">
              các chương trình từ thiện và các hoạt động xúc tiến thương mại
            </strong>{" "}
            nhằm hỗ trợ tối đa cho các doanh nghiệp hội viên: quảng bá sản phẩm,
            dịch vụ của mình tới các doanh nghiệp cung ứng liên quan và người
            tiêu dùng.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DINH_HUONG.map((d) => (
              <div key={d.no} className="card p-6">
                <span className="text-3xl font-extrabold text-do-200">
                  {d.no}
                </span>
                <h3 className="mt-2 font-bold text-navy-800">{d.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {d.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </HienDan>

      <HienDan the="section" className="wrap mt-16">
        <span className="eyebrow">Mục tiêu Chi hội</span>
        <h2 className="section-title">Bốn trụ cột hoạt động</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {NANG_LUC.map((n) => (
            <div key={n.no} className="card flex gap-4 p-6">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy-600 font-bold text-white">
                {n.no}
              </span>
              <div>
                <h3 className="font-bold text-navy-800">{n.title}</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {n.items.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-do-500">▪</span>
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </HienDan>

      <HienDan the="section" className="wrap mt-16">
        <span className="eyebrow">Hoạt động thường niên</span>
        <h2 className="section-title">Các chương trình tiêu biểu</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CHUONG_TRINH.map((c) => (
            <div key={c.name} className="card p-6">
              <span className="text-3xl">{c.icon}</span>
              <h3 className="mt-3 font-bold text-navy-800">{c.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {c.desc}
              </p>
            </div>
          ))}
        </div>
        <Link href="/su-kien" className="btn-ghost mt-8">
          Xem toàn bộ sự kiện đã tổ chức
        </Link>
      </HienDan>

      {/* ── Ban Chủ nhiệm ─────────────────────────────────────────
          Khối chân dung chuyển từ trang chủ sang đây (07/08) — người tìm hiểu
          về Chi hội muốn biết ai đang dẫn dắt, đặt ở đây đúng mạch đọc hơn. */}
      <HienDan the="section" className="san-do luoi-ky-thuat relative mt-16 overflow-hidden py-16 text-white">
        <div className="wrap">
          {/* Hai bộ máy cạnh nhau (Chủ nhiệm chốt 24/09): NK XII đương nhiệm
              (ảnh vest NÂU — giữ nguyên) và BĐH NK I ra mắt 10.10 (vest NAVY,
              dữ liệu nguyên văn tờ trình — xem src/lib/bdh-nk1.ts) */}
          <HaiNhiemKy
            nk12={
              <div className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="eyebrow text-do-300">{SITE.term}</span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Ban Chủ nhiệm Chi hội
              </h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-white/75">
                Những doanh nhân trực tiếp dẫn dắt Chi hội — tất cả đều là chủ
                doanh nghiệp, dành thời gian riêng cho hoạt động chung. Bộ máy
                điều hành còn có Ban Cố vấn và các ban chuyên môn: Hội viên,
                Xúc tiến thương mại, Sự kiện, Truyền thông, Đào tạo.
              </p>
            </div>
            <Link
              href="/ban-chap-hanh"
              className="text-sm font-semibold text-do-300 hover:text-white"
            >
              Xem toàn bộ nhân sự các ban →
            </Link>
          </div>

          {bcn.length > 0 && (
            <div className="mt-8 grid gap-5 sm:grid-cols-3 lg:grid-cols-6">
              {/* Leader.slug có thể null: nhân sự thêm từ /quan-tri chỉ có slug
                  sau khi chạy `npm run slug-ban-chu-nhiem`. Người chưa có slug
                  hiện thẻ thường (The = div), ĐỪNG dựng Link kẻo ra đường dẫn
                  /ban-chap-hanh/null — trang /ban-chap-hanh cũng guard vậy. */}
              {bcn.slice(0, 6).map((p, i) => {
                const lop = `group ${i === 0 ? "sm:col-span-3 lg:col-span-2" : ""}`;
                const noiDung = (
                <>
                  <div className="overflow-hidden rounded-2xl bg-navy-900 ring-1 ring-white/10 transition group-hover:ring-do-400">
                    {p.photo ? (
                      // Ảnh chân dung do Ban Truyền thông cung cấp
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photo}
                        alt={p.name}
                        loading="lazy"
                        className={`w-full object-cover object-top transition duration-500 group-hover:scale-105 ${
                          i === 0 ? "aspect-[3/4]" : "aspect-[4/5]"
                        }`}
                      />
                    ) : (
                      <div
                        className={`grid w-full place-items-center text-4xl font-bold text-white/30 ${
                          i === 0 ? "aspect-[3/4]" : "aspect-[4/5]"
                        }`}
                      >
                        {p.name.trim().split(/\s+/).slice(-1)[0].charAt(0)}
                      </div>
                    )}
                  </div>
                  <p
                    className={`mt-3 font-bold leading-snug text-white ${
                      i === 0 ? "text-xl" : "text-base"
                    }`}
                  >
                    {p.name}
                  </p>
                  <p className="mt-0.5 text-sm leading-snug text-do-300">
                    {p.title}
                  </p>
                </>
                );
                return p.slug ? (
                  <Link key={p.id} href={`/ban-chap-hanh/${p.slug}`} className={lop}>
                    {noiDung}
                  </Link>
                ) : (
                  <div key={p.id} className={lop}>
                    {noiDung}
                  </div>
                );
              })}
            </div>
          )}
              </div>
            }
            nk1={
              <div className="mt-8">
                <span className="eyebrow text-do-300">
                  Nhiệm kỳ I (2026 – 2029) · ra mắt 10.10.2026
                </span>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Ban Điều hành Chi hội
                </h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-white/75">
                  Bộ máy nhiệm kỳ mới gồm 21 doanh nhân — 1 Chủ tịch, 8 Phó
                  Chủ tịch và 12 Thành viên Ban Điều hành — sẽ ra mắt chính
                  thức tại Lễ chuyển giao ngày 10.10.2026.
                </p>
                <div className="mt-8 grid gap-5 sm:grid-cols-3 lg:grid-cols-6">
                  {BDH_NK1.map((p, i) => (
                    <div
                      key={p.ten}
                      className={`group ${i === 0 ? "sm:col-span-3 lg:col-span-2" : ""}`}
                    >
                      <div className="overflow-hidden rounded-2xl bg-navy-900 ring-1 ring-white/10 transition group-hover:ring-do-400">
                        {p.anh ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.anh}
                            alt={p.ten}
                            loading="lazy"
                            className={`w-full object-cover object-top transition duration-500 group-hover:scale-105 ${
                              i === 0 ? "aspect-[3/4]" : "aspect-[4/5]"
                            }`}
                          />
                        ) : (
                          <div
                            className={`grid w-full place-items-center text-4xl font-bold text-white/30 ${
                              i === 0 ? "aspect-[3/4]" : "aspect-[4/5]"
                            }`}
                          >
                            {p.ten.trim().split(/\s+/).slice(-1)[0].charAt(0)}
                          </div>
                        )}
                      </div>
                      <p
                        className={`mt-3 font-bold leading-snug text-white ${
                          i === 0 ? "text-xl" : "text-base"
                        }`}
                      >
                        {p.ten}
                      </p>
                      <p className="mt-0.5 text-sm leading-snug text-do-300">
                        {p.chucVuHoi}
                      </p>
                      <p className="mt-0.5 text-xs leading-snug text-white/55">
                        {p.mota}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-xs text-white/55">
                  Danh sách theo Tờ trình kiện toàn nhân sự trình Hội Doanh
                  nhân trẻ TP.HCM — ra mắt chính thức tại Lễ chuyển giao
                  10.10.2026.
                </p>
              </div>
            }
          />

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/dat-lich" className="btn-cta">
              Đặt lịch gặp Ban Chủ nhiệm
            </Link>
            <Link href="/lien-he" className="btn-cta-ghost">
              Liên hệ Chi hội
            </Link>
          </div>
        </div>
      </HienDan>
    </>
  );
}
