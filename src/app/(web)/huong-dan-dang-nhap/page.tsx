import type { Metadata } from "next";
import Link from "next/link";
import { docGiaoDien } from "@/lib/giao-dien";
import { SITE } from "@/lib/site";

/*
 * Trang CÔNG KHAI trả lời "đăng nhập bằng gì". CẬP NHẬT 21/09/2026 theo
 * quyết định của Chủ nhiệm: tên đăng nhập ĐÃ đồng bộ bằng đúng mã hội viên
 * hiện tại (hv + 4 số, viết thường) — scripts/dong-bo-tai-khoan.ts lo việc
 * này, chạy lại sau mỗi lần đánh lại mã.
 *
 * Cố ý KHÔNG có ô "tra tên đăng nhập theo SĐT": trang như vậy xác nhận cho người
 * lạ biết số nào là của hội viên và đưa luôn tên đăng nhập cho kẻ dò mật khẩu.
 * Hotline / email đọc từ docGiaoDien() (quy tắc AGENTS.md), không đọc SITE cứng.
 * Không nêu tên đăng nhập hay mật khẩu khởi tạo cụ thể nào làm ví dụ.
 */

export const metadata: Metadata = {
  title: "Hướng dẫn đăng nhập",
  description: `Cách đăng nhập khu hội viên ${SITE.fullName}: dùng tên đăng nhập hoặc số điện thoại đã đăng ký, cách lấy lại mật khẩu và tìm mã hội viên.`,
};

const MUC_LUC = [
  { id: "dang-nhap-bang-gi", ten: "Đăng nhập bằng gì" },
  { id: "quen-ten-dang-nhap", ten: "Quên tên đăng nhập" },
  { id: "quen-mat-khau", ten: "Quên mật khẩu" },
  { id: "ma-hoi-vien", ten: "Mã hội viên ở đâu" },
  { id: "zalo-mini-app", ten: "Zalo Mini App" },
  { id: "chua-la-hoi-vien", ten: "Chưa là hội viên" },
];

/** "hotline 0903… hoặc email …" — số và email lấy từ cấu hình giao diện. */
function LienHe({ hotline, email }: { hotline: string; email: string }) {
  return (
    <>
      hotline{" "}
      <a
        href={`tel:${hotline.replace(/[^\d+]/g, "")}`}
        className="font-semibold whitespace-nowrap text-navy-700 hover:underline"
      >
        {hotline}
      </a>{" "}
      hoặc email{" "}
      <a
        href={`mailto:${email}`}
        className="font-semibold break-all text-navy-700 hover:underline"
      >
        {email}
      </a>
    </>
  );
}

export default async function HuongDanDangNhap() {
  const gd = await docGiaoDien();
  const lienHe = <LienHe hotline={gd.hotline} email={gd.email} />;

  return (
    <>
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-12 text-white">
        <div className="wrap">
          <p className="eyebrow text-do-300">Khu hội viên</p>
          <h1 className="mt-2 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
            Hướng dẫn đăng nhập
          </h1>
          <p className="mt-3 max-w-2xl text-white/85">
            Đăng nhập ybacholon.vn để cập nhật hồ sơ doanh nghiệp, đăng tin mua
            – bán, khai giao dịch và chơi Ngôi nhà Chợ Lớn.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login" className="btn-cta min-h-11">
              Đăng nhập ngay
            </Link>
            <Link href="/dang-ky-hoi-vien" className="btn-cta-ghost min-h-11">
              Đăng ký hội viên
            </Link>
          </div>
        </div>
      </section>

      <div className="wrap mt-8">
        <nav aria-label="Mục lục" className="flex flex-wrap gap-2">
          {MUC_LUC.map((m) => (
            <a
              key={m.id}
              href={`#${m.id}`}
              className="chip min-h-11 px-4 hover:bg-navy-100"
            >
              {m.ten}
            </a>
          ))}
        </nav>
      </div>

      <div className="wrap mt-10 space-y-12 pb-4">
        {/* ── 1 ── */}
        <section id="dang-nhap-bang-gi" className="scroll-mt-24">
          <p className="eyebrow">Bước đầu tiên</p>
          <h2 className="section-title">Đăng nhập bằng gì?</h2>
          <p className="mt-3 max-w-3xl text-slate-700">
            Ở ô đầu tiên của trang đăng nhập, anh/chị gõ <b>một trong hai</b>{" "}
            thứ dưới đây, rồi gõ mật khẩu. Hai cách dùng chung một mật khẩu.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="card p-5">
              <p className="text-xs font-bold tracking-wide text-do-600 uppercase">
                Cách 1
              </p>
              <h3 className="mt-1 text-lg font-bold text-navy-800">
                Tên đăng nhập
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                Chính là <b>mã hội viên</b> của anh/chị, dạng <b>hv</b> + 4 chữ
                số. Gõ chữ hoa hay chữ thường đều được.
              </p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-bold tracking-wide text-do-600 uppercase">
                Cách 2
              </p>
              <h3 className="mt-1 text-lg font-bold text-navy-800">
                Số điện thoại đã đăng ký
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                Số di động anh/chị đã đăng ký với Chi hội. Gõ liền, có dấu chấm,
                khoảng trắng hay bắt đầu bằng +84 đều được, ví dụ{" "}
                <b>09xx xxx xxx</b>.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 ring-1 ring-amber-200">
            <b>Tên đăng nhập chính là mã hội viên.</b> Mã của anh/chị in trên
            hồ sơ doanh nghiệp và các thông báo của Chi hội (dạng HVxxxx) —
            đăng nhập thì gõ dạng viết thường, ví dụ mã HV0123 gõ hv0123. Nếu
            Chi hội đánh lại mã, tên đăng nhập đổi theo mã mới; số điện thoại
            luôn dùng được như cũ.
          </div>

          <ol className="mt-5 max-w-3xl list-decimal space-y-2 pl-5 text-slate-700">
            <li>
              Vào{" "}
              <Link
                href="/login"
                className="font-semibold text-navy-700 hover:underline"
              >
                ybacholon.vn/login
              </Link>{" "}
              (hoặc bấm <b>Đăng nhập</b> ở đầu trang web).
            </li>
            <li>Gõ tên đăng nhập hoặc số điện thoại đã đăng ký.</li>
            <li>
              Gõ mật khẩu rồi bấm <b>Đăng nhập</b>.
            </li>
          </ol>
          <p className="mt-3 max-w-3xl text-sm text-slate-500">
            Gõ sai nhiều lần liền thì máy đang dùng phải chờ một lúc mới thử
            tiếp được. Tài khoản không bị khoá — chờ hết thời gian là đăng nhập
            bình thường.
          </p>
        </section>

        {/* ── 2 ── */}
        <section id="quen-ten-dang-nhap" className="scroll-mt-24">
          <h2 className="section-title">Quên tên đăng nhập</h2>
          <div className="card mt-5 space-y-3 p-5 text-slate-700">
            <p>
              <b>Cách nhanh nhất:</b> gõ số điện thoại đã đăng ký với Chi hội
              vào ô tên đăng nhập, dùng mật khẩu như cũ.
            </p>
            <p>
              <b>Không vào được bằng số điện thoại</b> (đã đổi số, hoặc số chưa
              cập nhật): liên hệ Văn phòng Chi hội / Thư ký qua {lienHe}, báo họ
              tên và tên doanh nghiệp. Thư ký tra tên đăng nhập ở{" "}
              <b>Quản trị → Tài khoản</b> và báo lại cho anh/chị.
            </p>
            <p className="text-sm text-slate-500">
              Vì an toàn, trang web không hiện tên đăng nhập cho người chưa đăng
              nhập.
            </p>
          </div>
        </section>

        {/* ── 3 ── */}
        <section id="quen-mat-khau" className="scroll-mt-24">
          <h2 className="section-title">Quên mật khẩu</h2>
          <div className="card mt-5 space-y-3 p-5 text-slate-700">
            <p>
              Web chưa có chức năng tự lấy lại mật khẩu qua email hay tin nhắn.
              Anh/chị liên hệ Văn phòng Chi hội qua {lienHe} để được cấp mật
              khẩu mới.
            </p>
            <p>
              Nhận mật khẩu mới xong: đăng nhập → trang <b>Tổng quan</b> → bấm{" "}
              <b>Đổi mật khẩu</b> để đặt mật khẩu riêng của mình (ít nhất 8 ký
              tự).
            </p>
            <p className="text-sm text-slate-500">
              Mật khẩu Chi hội cấp chỉ nên dùng cho lần đầu. Đừng dùng mật khẩu
              dễ đoán, tên đăng nhập hay số điện thoại làm mật khẩu.
            </p>
          </div>
        </section>

        {/* ── 4 ── */}
        <section id="ma-hoi-vien" className="scroll-mt-24">
          <h2 className="section-title">Mã hội viên của tôi ở đâu?</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="card p-5">
              <h3 className="font-bold text-navy-800">
                Trên web, sau khi đăng nhập
              </h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
                <li>
                  Thanh menu khu hội viên, cạnh tên anh/chị: dòng{" "}
                  <b>Hội viên · HVxxxx</b>.
                </li>
                <li>
                  Trang <b>Tổng quan</b>: hộp “Thông tin đăng nhập” ghi cả tên
                  đăng nhập lẫn mã hội viên.
                </li>
              </ul>
            </div>
            <div className="card p-5">
              <h3 className="font-bold text-navy-800">
                Hồ sơ doanh nghiệp công khai
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                Tìm doanh nghiệp của mình ở{" "}
                <Link
                  href="/doanh-nghiep"
                  className="font-semibold text-navy-700 hover:underline"
                >
                  Danh bạ doanh nghiệp
                </Link>
                , trong hồ sơ có dòng <b>Mã hội viên</b>.
              </p>
            </div>
            <div className="card p-5">
              <h3 className="font-bold text-navy-800">Trên Zalo Mini App</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                Mục <b>Thẻ hội viên</b> → Xác thực bằng Zalo: thẻ điện tử ghi mã
                hội viên kèm mã QR check-in sự kiện.
              </p>
            </div>
          </div>
        </section>

        {/* ── 5 ── */}
        <section id="zalo-mini-app" className="scroll-mt-24">
          <h2 className="section-title">
            Câu hỏi thường gặp khi dùng Zalo Mini App
          </h2>
          <div className="mt-5 space-y-3">
            {[
              {
                hoi: "Mini App YBA Chợ Lớn có cần tên đăng nhập và mật khẩu không?",
                dap: "Không. Mini App nhận ra anh/chị qua số điện thoại Zalo (Zalo xác nhận chính chủ khi anh/chị đồng ý chia sẻ số). Số Zalo cần trùng với số đã đăng ký với Chi hội.",
              },
              {
                hoi: "Mini App báo số điện thoại chưa có trong danh sách hội viên?",
                dap: "Số Zalo đang dùng khác với số Chi hội lưu trong hồ sơ. Liên hệ Văn phòng Chi hội để cập nhật số, sau đó bấm xác thực lại.",
              },
              {
                hoi: "Đã vào được Mini App, lên web ybacholon.vn có phải đăng nhập nữa không?",
                dap: "Có. Web đăng nhập riêng bằng tên đăng nhập hoặc số điện thoại đã đăng ký, cùng mật khẩu Chi hội cấp. Game Ngôi nhà Chợ Lớn chơi trên web nên cần đăng nhập web.",
              },
              {
                hoi: "Đổi số điện thoại thì sao?",
                dap: "Báo Văn phòng Chi hội cập nhật số mới vào hồ sơ. Số mới dùng được cho cả Mini App lẫn đăng nhập web; tên đăng nhập và mật khẩu web giữ nguyên.",
              },
            ].map((c) => (
              <details key={c.hoi} className="card group p-0">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-semibold text-navy-800">
                  <span>{c.hoi}</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180"
                  >
                    <path
                      d="M5 7l5 6 5-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </summary>
                <p className="px-5 pb-4 text-sm leading-relaxed text-slate-700">
                  {c.dap}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── 6 ── */}
        <section id="chua-la-hoi-vien" className="scroll-mt-24">
          <h2 className="section-title">Chưa là hội viên?</h2>
          <div className="card mt-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-slate-700">
              Tài khoản khu hội viên chỉ cấp cho hội viên Chi hội. Anh/chị gửi
              đơn đăng ký, Ban Hội viên sẽ liên hệ và cấp tài khoản sau khi kết
              nạp.
            </p>
            <Link
              href="/dang-ky-hoi-vien"
              className="btn-primary min-h-11 shrink-0"
            >
              Đăng ký hội viên
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Cần hỗ trợ thêm? Liên hệ Văn phòng Chi hội qua {lienHe}.
          </p>
        </section>
      </div>
    </>
  );
}
