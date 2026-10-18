import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import HienDan from "@/components/web/HienDan";
import { SITE } from "@/lib/site";
import { docTrang, tachDoan } from "@/lib/trang-tinh";

/**
 * Điều lệ & quy định của Chi hội.
 *
 * Toàn bộ nội dung do Ban Chủ nhiệm soạn ở /quan-tri/trang (ô "Điều lệ &
 * quy định"). CHƯA soạn thì trang trả 404 đúng như mô tả trong TRANG_TINH —
 * điều lệ là văn bản chính thức, không có bản mặc định nào thay thế được.
 */

export async function generateMetadata(): Promise<Metadata> {
  const trang = await docTrang("dieu-le");
  return {
    title: trang?.title ?? "Điều lệ & quy định",
    description:
      trang?.metaDesc ??
      `Điều lệ và các quy định sinh hoạt của ${SITE.fullName}.`,
  };
}

export default async function DieuLe() {
  const trang = await docTrang("dieu-le");
  if (!trang) notFound();

  return (
    <>
      <section className="san-do luoi-ky-thuat relative overflow-hidden py-12 text-white">
        <div className="wrap">
          <p className="eyebrow text-do-300">Văn bản Chi hội</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {trang.title}
          </h1>
          <p className="mt-3 max-w-3xl text-white/85">
            Áp dụng cho toàn thể hội viên {SITE.fullName} — {SITE.term}.
          </p>
        </div>
      </section>

      <HienDan the="section" className="wrap mt-10">
        <div className="mx-auto max-w-3xl space-y-4 leading-relaxed text-slate-700">
          {tachDoan(trang.content).map((d, i) => (
            <p key={i} className="whitespace-pre-line">
              {d}
            </p>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl border-t border-navy-100 pt-6 text-sm text-slate-500">
          Có câu hỏi về điều lệ?{" "}
          <Link href="/lien-he" className="font-semibold text-navy-600 hover:text-do-600">
            Liên hệ Ban Chủ nhiệm →
          </Link>
        </div>
      </HienDan>
    </>
  );
}
