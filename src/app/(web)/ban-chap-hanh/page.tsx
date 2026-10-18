import Link from "next/link";
import type { Metadata } from "next";
import { docGiaoDien } from "@/lib/giao-dien";
import { prisma } from "@/lib/prisma";
import { LEADER_GROUPS, SITE } from "@/lib/site";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { docTrang, tachDoan } from "@/lib/trang-tinh";
import HienDan from "@/components/web/HienDan";

export const metadata: Metadata = {
  title: "Ban Chủ nhiệm & các ban chuyên môn",
  description: `Bộ máy điều hành ${SITE.fullName} ${SITE.term}.`,
};

type Nguoi = {
  id: string;
  slug: string | null;
  name: string;
  title: string;
  position: string | null;
  company: string | null;
  photo: string | null;
  memberSlug: string | null;
};

/** Chữ cái đầu của tên gọi — dùng khi chưa có ảnh chân dung. */
function chuDau(ten: string): string {
  return ten.trim().split(/\s+/).slice(-1)[0].charAt(0).toLocaleUpperCase("vi");
}

/**
 * Thẻ nhân sự.
 *
 * Tên và chức danh đặt DƯỚI ảnh chứ không đè lên: chức danh của Chi hội thường
 * dài ("Phó Chủ nhiệm · Trưởng Ban Xúc tiến thương mại") nên khi đè lên ảnh sẽ
 * xuống hai ba dòng, che mất mặt người và làm các thẻ cao thấp lệch nhau.
 * Đặt bên dưới thì mọi thẻ cùng chiều cao và chữ luôn dễ đọc.
 */
function TheNhanSu({ p, noiBat = false }: { p: Nguoi; noiBat?: boolean }) {
  const ten = p.company ? tenDoanhNghiep(p.company) : null;

  const ruot = (
    <>
      <div className="relative w-full overflow-hidden bg-gradient-to-br from-navy-700 to-navy-900 aspect-[4/5]">
        {p.photo ? (
          // Ảnh chân dung do Ban Truyền thông cung cấp
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.photo}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-5xl font-bold text-white/30">
            {chuDau(p.name)}
          </div>
        )}
        {noiBat && (
          <span className="absolute left-3 top-3 rounded-full bg-do-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
            Chủ nhiệm
          </span>
        )}
      </div>

      {/* Khối chữ chiều cao tối thiểu cố định để hàng thẻ nào cũng thẳng nhau */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold leading-snug text-navy-800">
          {p.name}
        </h3>
        <p className="mt-1 min-h-[2.5rem] text-sm font-semibold leading-snug text-do-600">
          {p.title}
        </p>

        {(p.position || ten) && (
          <div className="mt-2 border-t border-navy-100 pt-2">
            {p.position && (
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                {p.position}
              </p>
            )}
            {ten && (
              <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-slate-700">
                {ten}
              </p>
            )}
          </div>
        )}

        <span className="mt-auto pt-3 text-xs font-semibold text-do-600">
          Xem giới thiệu →
        </span>
      </div>
    </>
  );

  const lop = `group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 transition hover:shadow-lg ${
    noiBat ? "ring-2 ring-do-300" : "ring-navy-100"
  }`;

  // Bấm vào thẻ mở trang giới thiệu riêng của người đó (trang riêng có cả nút
  // đặt lịch gặp và liên kết sang hồ sơ doanh nghiệp)
  return p.slug ? (
    <Link href={`/ban-chap-hanh/${p.slug}`} className={`${lop} hover:ring-do-300`}>
      {ruot}
    </Link>
  ) : (
    <div className={lop}>{ruot}</div>
  );
}

export default async function BanChapHanh() {
  const gd = await docGiaoDien();
  const [leaders, tuySoan] = await Promise.all([
    prisma.leader.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    }),
    docTrang("ban-chap-hanh"),
  ]);

  const byGroup = LEADER_GROUPS.map((g) => ({
    ...g,
    people: leaders.filter((l) => l.group === g.key),
  })).filter((g) => g.people.length > 0);

  const bcn = byGroup.find((g) => g.key === "BAN_CHU_NHIEM");
  const chuNhiem = bcn?.people[0] ?? null;
  const phoChuNhiem = bcn?.people.slice(1) ?? [];

  // Nhiều Phó Chủ nhiệm KIÊM Trưởng một ban, nên dữ liệu có họ ở cả hai
  // nhóm (hai bản ghi Leader riêng, không có khoá nối). Hiện ảnh hai lần thì
  // người xem tưởng nhầm là hai người / danh sách bị lỗi (anh Khang đã phản
  // ánh đúng vậy). Quy tắc: mỗi người chỉ hiện THẺ ẢNH một lần, ở nhóm cao
  // nhất — xuống các ban, người đã có mặt ở Ban Chủ nhiệm chỉ còn một dòng
  // chữ dẫn về thẻ của họ.
  //
  // So trùng bằng TÊN đã chuẩn hoá: cắt khoảng trắng thừa, ép Unicode về
  // dạng NFC (tên dán từ PDF/máy Mac hay ở dạng NFD — nhìn y hệt nhưng khác
  // byte, so thô là lọt), hạ hết về chữ thường. Hai bản ghi của cùng một
  // người do admin nhập tay hai chỗ, chỉ cần lệch một dấu cách là ảnh đôi
  // quay lại. Giới hạn đã biết: hai người THẬT trùng họ tên đầy đủ sẽ bị coi
  // là một — chưa có ca nào trong 33 nhân sự, gặp thì phải thêm khoá định
  // danh riêng chứ đừng vá tiếp ở đây.
  const khoaTen = (ten: string) =>
    ten.trim().normalize("NFC").replace(/\s+/g, " ").toLocaleLowerCase("vi");
  const daCoThe = new Set((bcn?.people ?? []).map((p) => khoaTen(p.name)));
  const banKhac = byGroup
    .filter((g) => g.key !== "BAN_CHU_NHIEM")
    .map((g) => ({
      ...g,
      nguoiMoi: g.people.filter((p) => !daCoThe.has(khoaTen(p.name))),
      truongKiem: g.people.filter((p) => daCoThe.has(khoaTen(p.name))),
    }));

  return (
    <>
      {/* ── Đầu trang ────────────────────────────────────────────── */}
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-16 text-white">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-do-600/20 blur-2xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-navy-500/30 blur-2xl"
        />
        <div className="wrap relative">
          <p className="eyebrow text-do-300">{SITE.term}</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Ban Chủ nhiệm &amp; các ban chuyên môn
          </h1>
          {tuySoan ? (
            <div className="mt-4 max-w-2xl space-y-2 leading-relaxed text-white/85">
              {tachDoan(tuySoan.content).map((d, i) => (
                <p key={i} className="whitespace-pre-line">
                  {d}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-4 max-w-2xl leading-relaxed text-white/85">
              Những doanh nhân trực tiếp dẫn dắt {SITE.fullName} — trực thuộc{" "}
              {SITE.parent}. Tất cả đều là chủ doanh nghiệp, dành thời gian riêng
              cho hoạt động chung của Chi hội.
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
            {[
              [String(leaders.length), "thành viên điều hành"],
              [String(byGroup.length), "ban chuyên môn"],
              [SITE.slogan, ""],
            ].map(([so, nhan]) => (
              <div key={so}>
                <p
                  className={
                    nhan
                      ? "text-3xl font-extrabold text-white"
                      : "text-lg font-bold text-do-300"
                  }
                >
                  {so}
                </p>
                {nhan && (
                  <p className="mt-0.5 text-sm text-white/70">{nhan}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {byGroup.length === 0 ? (
        <div className="wrap py-20 text-center text-slate-500">
          <p>Danh sách Ban Chủ nhiệm đang được cập nhật.</p>
          <Link href="/gioi-thieu" className="btn-ghost mt-6">
            Về trang giới thiệu Chi hội
          </Link>
        </div>
      ) : (
        <>
          {/* ── Ban Chủ nhiệm ─────────────────────────────────────
              Lưới đều 3 cột: mọi thẻ cùng kích thước nên hàng nào cũng thẳng,
              Chủ nhiệm được đánh dấu bằng viền đỏ và nhãn thay vì phóng to. */}
          {chuNhiem && (
            <HienDan the="section" className="wrap mt-14">
              <span className="eyebrow">Lãnh đạo Chi hội</span>
              <h2 className="section-title">Ban Chủ nhiệm</h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <TheNhanSu p={chuNhiem} noiBat />
                {phoChuNhiem.map((p) => (
                  <TheNhanSu key={p.id} p={p} />
                ))}
              </div>
            </HienDan>
          )}

          {/* ── Các ban chuyên môn ───────────────────────────────── */}
          {banKhac.map((g) => (
            <HienDan the="section" key={g.key} className="wrap mt-14">
              <h2 className="flex flex-wrap items-baseline gap-3 text-xl font-bold text-navy-800">
                {g.label}
                <span className="text-sm font-normal text-slate-500">
                  {g.people.length} thành viên
                </span>
              </h2>

              {/* Trưởng ban kiêm nhiệm đã có thẻ ảnh ở Ban Chủ nhiệm phía
                  trên — ở đây chỉ nhắc một dòng, không lặp lại ảnh */}
              {g.truongKiem.length > 0 && (
                <p className="mt-2 text-sm text-slate-600">
                  {/* Chỉ ghi "Phụ trách" khi bản ghi trong ban thật sự là
                      Trưởng/Phụ trách ban — người kiêm nhiệm vai khác mà ghi
                      "Phụ trách" là thăng chức nhầm trên web */}
                  {g.truongKiem.every((p) => /trưởng|phụ trách/i.test(p.title))
                    ? "Phụ trách:"
                    : "Kiêm nhiệm:"}{" "}
                  {g.truongKiem.map((p, i) => (
                    <span key={p.id}>
                      {i > 0 && ", "}
                      {p.slug ? (
                        <Link
                          href={`/ban-chap-hanh/${p.slug}`}
                          className="font-semibold text-navy-700 underline-offset-2 hover:text-do-600 hover:underline"
                        >
                          {p.name}
                        </Link>
                      ) : (
                        <span className="font-semibold text-navy-700">
                          {p.name}
                        </span>
                      )}{" "}
                      <span className="text-slate-500">
                        (giới thiệu ở Ban Chủ nhiệm phía trên)
                      </span>
                    </span>
                  ))}
                </p>
              )}

              {g.nguoiMoi.length > 0 && (
                <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {g.nguoiMoi.map((p) => (
                    <TheNhanSu key={p.id} p={p} />
                  ))}
                </div>
              )}
            </HienDan>
          ))}
        </>
      )}

      <HienDan the="section" className="wrap my-16">
        <div className="san-do relative overflow-hidden rounded-3xl px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-bold">Muốn kết nối với Ban Chủ nhiệm?</h2>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-white/85">
            Gửi tin nhắn cho Chi hội hoặc gọi hotline {gd.hotline}, Ban Chủ
            nhiệm sẽ phản hồi trong thời gian sớm nhất.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/lien-he" className="btn-primary">
              Liên hệ Chi hội
            </Link>
            <Link
              href="/dang-ky-hoi-vien"
              className="rounded-xl border border-white/30 px-5 py-2.5 font-semibold transition hover:bg-white/10"
            >
              Đăng ký hội viên
            </Link>
          </div>
        </div>
      </HienDan>
    </>
  );
}
