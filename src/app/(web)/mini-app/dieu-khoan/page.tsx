import type { Metadata } from "next";
import Link from "next/link";
import HienDan from "@/components/web/HienDan";
import { SITE } from "@/lib/site";

/**
 * Điều khoản sử dụng của Zalo Mini App "YBA Chợ Lớn".
 *
 * Trang này là YÊU CẦU BẮT BUỘC khi submit Mini App lên Zalo xét duyệt
 * (bước "Thiết lập chung" đòi URL điều khoản mô tả đủ các quyền và dữ liệu
 * cá nhân app sử dụng). Nội dung phải khớp với 2 quyền đã khai khi submit:
 * số điện thoại (đăng nhập hội viên) và quét QR (điểm danh sự kiện) —
 * thêm quyền mới trong app thì phải cập nhật trang này trước khi submit.
 */

export const metadata: Metadata = {
  title: "Điều khoản sử dụng Mini App",
  description: `Điều khoản sử dụng và chính sách dữ liệu của Zalo Mini App ${SITE.name}.`,
};

const MUC = [
  {
    ten: "1. Giới thiệu",
    noiDung: [
      `Mini App "${SITE.name}" trên nền tảng Zalo là ứng dụng sinh hoạt hội viên chính thức của ${SITE.fullName}, phục vụ tra cứu danh bạ hội viên, tin tức, sự kiện, bảng tin nhu cầu kết nối giao thương, thẻ hội viên điện tử và các tiện ích dành cho hội viên.`,
      `Dữ liệu hiển thị trong Mini App do website chính thức của Chi hội tại ${SITE.url} cung cấp và quản lý. Việc sử dụng Mini App đồng nghĩa với việc bạn đồng ý với các điều khoản dưới đây.`,
    ],
  },
  {
    ten: "2. Quyền và dữ liệu Mini App sử dụng",
    noiDung: [
      `Số điện thoại Zalo: Mini App chỉ đề nghị chia sẻ số điện thoại khi bạn chủ động bấm nút "Xác thực bằng Zalo" tại các tính năng cần danh tính (thẻ hội viên điện tử, ghi danh tham dự sự kiện, khu vực dành riêng cho hội viên). Số điện thoại chỉ dùng để đối chiếu với danh sách hội viên chính thức của Chi hội nhằm xác nhận tư cách hội viên, không dùng vào mục đích quảng cáo hay chia sẻ cho bên thứ ba. Phiên đăng nhập được lưu tối đa 90 ngày.`,
      `Quét mã QR: tính năng quét dùng máy quét có sẵn của Zalo, chỉ mở khi thành viên Ban Tổ chức chủ động bấm nút điểm danh tại sự kiện. Kết quả quét chỉ dùng để ghi nhận tham dự sự kiện của Chi hội, không lưu nội dung nào khác.`,
      `Mini App KHÔNG thu thập vị trí, danh bạ điện thoại, hình ảnh, camera hay bất kỳ dữ liệu nào khác trên thiết bị của bạn.`,
    ],
  },
  {
    ten: "3. Khu vực công khai",
    noiDung: [
      `Danh bạ doanh nghiệp hội viên, tin tức, sự kiện và bảng tin nhu cầu đều xem tự do không cần đăng nhập. Thông tin doanh nghiệp hiển thị công khai do hội viên đăng ký cung cấp cho Chi hội và không bao gồm số điện thoại, email cá nhân của hội viên đối với khách vãng lai.`,
    ],
  },
  {
    ten: "4. Rút lại quyền và xoá dữ liệu",
    noiDung: [
      `Bạn có thể rút lại quyền chia sẻ số điện thoại bất cứ lúc nào trong phần cài đặt quyền của ứng dụng Zalo. Khi nhận được yêu cầu rút quyền từ Zalo, hệ thống tự động xoá phiên đăng nhập và dữ liệu liên quan của bạn.`,
      `Bạn cũng có thể yêu cầu xoá dữ liệu hoặc giải đáp thắc mắc về quyền riêng tư bằng cách liên hệ trực tiếp với Ban Chủ nhiệm Chi hội qua trang Liên hệ của website.`,
    ],
  },
  {
    ten: "5. Trách nhiệm của người dùng",
    noiDung: [
      `Người dùng chịu trách nhiệm về nội dung mình đăng trên bảng tin nhu cầu và các thông tin khai báo trong hồ sơ. Chi hội có quyền gỡ bỏ nội dung sai sự thật, gây nhầm lẫn hoặc vi phạm pháp luật Việt Nam.`,
    ],
  },
  {
    ten: "6. Thay đổi điều khoản",
    noiDung: [
      `Điều khoản này có thể được cập nhật khi Mini App bổ sung tính năng. Phiên bản mới nhất luôn được đăng tại trang này.`,
    ],
  },
];

export default function DieuKhoanMiniApp() {
  return (
    <>
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-12 text-white">
        <div className="wrap">
          <p className="eyebrow text-do-300">Zalo Mini App</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Điều khoản sử dụng Mini App
          </h1>
          <p className="mt-3 max-w-3xl text-white/85">
            Áp dụng cho Mini App {SITE.name} trên nền tảng Zalo — cập nhật ngày
            13/08/2026.
          </p>
        </div>
      </section>

      <HienDan the="section" className="wrap mt-10">
        <div className="mx-auto max-w-3xl space-y-8">
          {MUC.map((m) => (
            <div key={m.ten}>
              <h2 className="text-lg font-bold text-navy-800">{m.ten}</h2>
              <div className="mt-2 space-y-3 leading-relaxed text-slate-700">
                {m.noiDung.map((d, i) => (
                  <p key={i}>{d}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl border-t border-navy-100 pt-6 text-sm text-slate-500">
          Câu hỏi về quyền riêng tư hoặc yêu cầu xoá dữ liệu?{" "}
          <Link
            href="/lien-he"
            className="font-semibold text-navy-600 hover:text-do-600"
          >
            Liên hệ Ban Chủ nhiệm →
          </Link>
        </div>
      </HienDan>
    </>
  );
}
