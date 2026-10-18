import Link from "next/link";
import { docGiaoDien } from "@/lib/giao-dien";
import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import HoiAiForm from "./HoiAiForm";

export const metadata: Metadata = {
  title: "Hỏi trợ lý AI",
  description: `Hỏi nhanh về ${SITE.fullName}: hội viên, ngành nghề, sự kiện, chương trình và cách gia nhập Chi hội.`,
};

export default async function HoiAI({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 300) : "";
  const gd = await docGiaoDien();

  return (
    <>
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-10 text-white">
        <div className="wrap">
          <p className="eyebrow text-do-300">Trợ lý của Chi hội</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span aria-hidden="true">✨</span> Hỏi AI về Chi hội
          </h1>
          <p className="mt-3 max-w-3xl leading-relaxed text-white/85">
            Hỏi bằng câu nói thường ngày về {SITE.fullName}, về hội viên và
            ngành nghề trong Chi hội, về sự kiện, chương trình, lịch hoạt động
            hay cách gia nhập. Trợ lý tra thẳng dữ liệu đang có trên website nên
            câu trả lời luôn khớp với những gì anh chị thấy ở các trang khác.
          </p>
        </div>
      </section>

      <div className="wrap grid gap-8 py-10 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          <HoiAiForm hoiSan={q} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 className="font-bold text-navy-800">Trợ lý biết những gì?</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
              {[
                "Hồ sơ doanh nghiệp hội viên và ngành nghề",
                "Tin cần mua – cần bán trên chợ nhu cầu",
                "Sự kiện đã tổ chức và lịch hoạt động sắp tới",
                "Ban Chủ nhiệm và các ban chuyên môn",
                "Gói tài trợ, chương trình cần đồng hành",
                "Thông tin chung của Chi hội và cách gia nhập",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-0.5 shrink-0 text-do-500">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-navy-800">Trợ lý không làm gì</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-slate-400">✕</span>
                <span>
                  Không đưa số điện thoại, email hội viên — thông tin đó chỉ hiện
                  với người đã đăng nhập.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-slate-400">✕</span>
                <span>Không xếp hạng, so sánh hơn kém giữa các doanh nghiệp.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-slate-400">✕</span>
                <span>
                  Không trả lời chuyện ngoài phạm vi hoạt động của Hội.
                </span>
              </li>
            </ul>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-navy-800">Cần người thật?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Văn phòng Chi hội luôn sẵn sàng hỗ trợ anh chị.
            </p>
            <p className="mt-3 text-sm">
              <a
                href={`tel:${gd.hotline.replace(/\D/g, "")}`}
                className="font-semibold text-do-600 hover:underline"
              >
                📞 {gd.hotline}
              </a>
            </p>
            <Link href="/lien-he" className="btn-ghost mt-3 w-full">
              Gửi tin nhắn cho Chi hội
            </Link>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-navy-800">Tìm chính xác hơn</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Biết rõ tên doanh nghiệp hay sự kiện cần tìm thì dùng ô tìm kiếm sẽ
              nhanh hơn hỏi trợ lý.
            </p>
            <Link href="/tim-kiem" className="btn-ghost mt-3 w-full">
              🔍 Tìm trên toàn trang
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
