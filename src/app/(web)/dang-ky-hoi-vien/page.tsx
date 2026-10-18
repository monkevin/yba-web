import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { DIEU_KIEN_GIA_NHAP, SITE } from "@/lib/site";
import { docGiaoDien } from "@/lib/giao-dien";
import { docTrang, tachDoan } from "@/lib/trang-tinh";
import FormDangKy from "./Form";

export const metadata: Metadata = {
  title: "Đăng ký hội viên",
  description: `Gia nhập ${SITE.fullName} — mở rộng mạng lưới, tìm khách hàng và nhà cung cấp ngay trong cộng đồng doanh nhân trẻ.`,
};

const QUYEN_LOI = [
  {
    icon: "🤝",
    title: "Mạng lưới doanh nhân trẻ",
    desc: `Kết nối với ${SITE.quyMoCongBo} tại khu vực Chợ Lớn và cộng đồng doanh nhân trẻ toàn TP.HCM.`,
  },
  {
    icon: "📈",
    title: "Cơ hội giao thương thật",
    desc: "Đăng nhu cầu mua – bán trên chợ giao thương, được ghi nhận và vinh danh theo kỳ.",
  },
  {
    icon: "🏢",
    title: "Hồ sơ doanh nghiệp riêng",
    desc: "Một trang giới thiệu đầy đủ trên ybacholon.vn: năng lực, sản phẩm, hình ảnh, liên hệ.",
  },
  {
    icon: "🎓",
    title: "Đào tạo & chia sẻ",
    desc: "Business & Library, Coffee Share, các buổi chia sẻ kinh nghiệm quản trị doanh nghiệp.",
  },
  {
    icon: "🚐",
    title: "Caravan xúc tiến thương mại",
    desc: "Hành trình kết nối với hội doanh nhân trẻ các tỉnh thành trên cả nước.",
  },
  {
    icon: "❤️",
    title: "Hoạt động cộng đồng",
    desc: "Thư viện Container, Nhịp cầu Doanh nhân, học bổng — cùng nhau tạo giá trị cho xã hội.",
  },
];

export default async function DangKyHoiVien() {
  const [nganhNghe, tuySoan, gd] = await Promise.all([
    prisma.category.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { name: true },
    }),
    // Ô "Quyền lợi hội viên" ở /quan-tri/trang — Ban Chủ nhiệm soạn thì
    // hiện bản đó THAY cho sáu thẻ mặc định bên dưới. Thiếu dây nối này
    // là ô quản trị lưu vào hư không (lỗi từng có, đừng cắt lại).
    docTrang("quyen-loi-hoi-vien"),
    docGiaoDien(),
  ]);

  return (
    <>
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-12 text-white">
        <div className="wrap">
          <p className="eyebrow text-do-300">Gia nhập Chi hội</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Đăng ký hội viên YBA Chợ Lớn
          </h1>
          <p className="mt-3 max-w-3xl text-white/85">
            Dành cho doanh nhân trẻ từ 18 đến 45 tuổi, có doanh nghiệp hoạt động
            trên địa bàn {SITE.areas.join(", ")}.
          </p>
        </div>
      </section>

      <section className="wrap mt-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
          <div>
            <span className="eyebrow">Quyền lợi</span>
            <h2 className="section-title">
              {tuySoan?.title ?? "Hội viên được gì?"}
            </h2>
            {tuySoan ? (
              <div className="mt-5 space-y-3 leading-relaxed text-slate-700">
                {tachDoan(tuySoan.content).map((d, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {d}
                  </p>
                ))}
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {QUYEN_LOI.map((q) => (
                  <div key={q.title} className="card p-5">
                    <span className="text-2xl">{q.icon}</span>
                    <h3 className="mt-2 font-bold text-navy-800">{q.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {q.desc}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Điều kiện phải nêu TRƯỚC quy trình: người đọc cần biết mình có
                đủ điều kiện không rồi mới quan tâm nộp hồ sơ thế nào */}
            <div className="mt-6 rounded-2xl border-l-4 border-l-do-500 bg-white p-5 ring-1 ring-navy-100">
              <h3 className="font-bold text-navy-800">Điều kiện gia nhập</h3>
              <ul className="mt-3 space-y-2.5">
                {DIEU_KIEN_GIA_NHAP.map((d) => (
                  <li key={d} className="flex gap-2.5 text-slate-700">
                    <span className="mt-0.5 shrink-0 font-bold text-do-500">✓</span>
                    <span className="leading-relaxed">{d}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3.5 text-sm leading-relaxed text-slate-500">
                Doanh nghiệp cần có trụ sở hoặc hoạt động trên địa bàn{" "}
                {SITE.areas.join(", ")}.
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-navy-50 p-5">
              <h3 className="font-bold text-navy-800">Quy trình gia nhập</h3>
              <ol className="mt-3 space-y-2.5 text-sm text-slate-700">
                {[
                  "Anh/chị gửi hồ sơ đăng ký ở biểu mẫu bên cạnh.",
                  "Ban Hội viên liên hệ trao đổi và mời tham dự một buổi sinh hoạt.",
                  "Ban Chủ nhiệm xét duyệt và thông báo kết quả.",
                  "Hoàn tất hội phí, nhận tài khoản và bắt đầu tạo hồ sơ doanh nghiệp.",
                ].map((b, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy-600 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{b}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-sm text-slate-600">
                Cần trao đổi trước? Gọi hotline{" "}
                <a
                  href={`tel:${gd.hotline.replace(/\./g, "")}`}
                  className="font-semibold text-navy-700 hover:underline"
                >
                  {gd.hotline}
                </a>
                .
              </p>
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <FormDangKy nganhNghe={nganhNghe} />
          </div>
        </div>
      </section>
    </>
  );
}
