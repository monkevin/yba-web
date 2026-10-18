import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import { thanSoCua, conGiapCua, tinhCachCua, khiChatCua } from "@/lib/chan-dung";
import { BAI, DauTrang, layKhach } from "./Chung";
import { FormThongTin } from "./Forms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "WHO AM I? — Chân dung doanh nhân",
  description:
    "Bộ trắc nghiệm miễn phí dành cho doanh nhân: thần số học, tử vi tham khảo, tính cách điều hành và khí chất doanh nhân Ưng · Hổ · Xà · Hồ · Long.",
};

export default async function WhoAmI() {
  const khach = await layKhach();

  const nganhNghe = (
    await prisma.category.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { name: true },
    })
  ).map((c) => c.name);

  const nam = khach?.birthDate?.getFullYear() ?? 0;
  const ts = khach?.birthDate ? thanSoCua(khach.birthDate) : null;
  const tc = khach?.tinhCach ? tinhCachCua(khach.tinhCach) : null;
  const kc = khach?.khiChat ? khiChatCua(khach.khiChat) : null;

  const ketQua: Record<string, string | null> = {
    "/who-am-i/than-so-hoc": ts ? `Số ${ts.so} — ${ts.tieuDe}` : null,
    "/who-am-i/tu-vi": khach?.birthDate
      ? `${conGiapCua(nam).emoji} ${khach.conGiap} · Mệnh ${khach.menh}`
      : null,
    "/who-am-i/tinh-cach": tc ? `${tc.emoji} ${tc.ten}` : null,
    "/who-am-i/khi-chat": kc ? `${kc.emoji} ${kc.ten} — ${kc.danhHieu}` : null,
  };

  return (
    <>
      <DauTrang
        tieuDe="WHO AM I?"
        moTa="Bốn góc nhìn giúp anh/chị hiểu rõ mình hơn với tư cách người làm chủ: năng lượng tự nhiên, mệnh ngũ hành, cách ra quyết định và phong cách lãnh đạo. Miễn phí, làm trong 10 phút."
      />

      <div className="wrap py-10">
        {!khach ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start">
            <div>
              <h2 className="text-xl font-bold text-navy-800">
                Bộ trắc nghiệm gồm 4 bài
              </h2>
              <div className="mt-5 space-y-3">
                {BAI.map((b) => (
                  <div key={b.href} className="card flex items-start gap-4 p-5">
                    <span className="text-3xl">{b.icon}</span>
                    <div>
                      <h3 className="font-bold text-navy-800">{b.ten}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        {b.mo}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-navy-50 p-5">
                <p className="font-semibold text-navy-800">
                  Vì sao {SITE.name} làm bộ công cụ này?
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Hiểu mình là bước đầu để chọn đúng người đồng hành. Chi hội
                  tặng bộ trắc nghiệm này cho mọi doanh nhân quan tâm — không thu
                  phí, không ràng buộc.
                </p>
              </div>
            </div>

            <div className="card p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold text-navy-800">
                Thông tin của anh/chị
              </h2>
              <p className="mb-5 mt-1 text-sm text-slate-600">
                Điền một lần, dùng cho cả bốn bài.
              </p>
              <FormThongTin banDau={null} nganhNghe={nganhNghe} />
            </div>
          </div>
        ) : (
          <>
            <div className="card mb-6 flex flex-wrap items-center justify-between gap-4 bg-navy-50 p-5">
              <div>
                <p className="font-bold text-navy-800">
                  Chào {khach.name} 👋
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  Đã hoàn thành{" "}
                  {Object.values(ketQua).filter(Boolean).length}/4 bài. Kết quả
                  được lưu lại, anh/chị quay lại bất cứ lúc nào.
                </p>
              </div>
              <Link href="#sua-thong-tin" className="btn-ghost shrink-0">
                Sửa thông tin
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {BAI.map((b) => (
                <Link
                  key={b.href}
                  href={b.href}
                  className={`card flex flex-col p-5 transition hover:border-do-300 hover:shadow-md ${
                    ketQua[b.href] ? "border-do-200" : ""
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="text-3xl">{b.icon}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                        ketQua[b.href]
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-slate-100 text-slate-600 ring-slate-200"
                      }`}
                    >
                      {ketQua[b.href] ? "✓ Đã xem" : "Chưa làm"}
                    </span>
                  </div>
                  <h3 className="font-bold text-navy-800">{b.ten}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {b.mo}
                  </p>
                  {ketQua[b.href] && (
                    <p className="mt-3 rounded-lg bg-navy-50 px-3 py-2 text-sm font-medium text-navy-800">
                      {ketQua[b.href]}
                    </p>
                  )}
                  <p className="mt-auto pt-3 text-sm font-semibold text-do-600">
                    {ketQua[b.href] ? "Xem lại" : "Bắt đầu"} →
                  </p>
                </Link>
              ))}
            </div>

            <div id="sua-thong-tin" className="card mt-10 p-6">
              <h2 className="text-lg font-bold text-navy-800">
                Sửa thông tin của anh/chị
              </h2>
              <div className="mt-4 max-w-2xl">
                <FormThongTin
                  banDau={{
                    name: khach.name,
                    phone: khach.phone,
                    email: khach.email,
                    ngheNghiep: khach.ngheNghiep,
                    congTy: khach.congTy,
                    nganhNghe: khach.nganhNghe,
                    noiSinh: khach.noiSinh,
                    birthDate: khach.birthDate,
                    gioSinh: khach.birthHour,
                  }}
                  nganhNghe={nganhNghe}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
