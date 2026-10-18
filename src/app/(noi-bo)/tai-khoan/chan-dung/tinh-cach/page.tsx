import { PageHeader } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import { tinhCachCua } from "@/lib/chan-dung";
import { TINH_CACH, TINH_CACH_CAU_HOI } from "@/lib/chan-dung-noi-dung";
import { prisma } from "@/lib/prisma";
import { DieuHuongChanDung, Muc, DanhSach } from "../Dieu";
import { BaiTinhCach, NutLamLai } from "../Forms";

export const dynamic = "force-dynamic";

export default async function TinhCach() {
  const user = await requireUserPage();
  const cd = user.memberId
    ? await prisma.chanDung.findUnique({ where: { memberId: user.memberId } })
    : null;

  const tc = cd?.tinhCach ? tinhCachCua(cd.tinhCach) : null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Tính cách điều hành"
        subtitle="12 câu về cách anh/chị ra quyết định và làm việc với người khác — chia theo 4 nhóm Lửa, Gió, Đất, Nước."
      />
      <DieuHuongChanDung dang="/tai-khoan/chan-dung/tinh-cach" />

      {!tc ? (
        <div className="card p-5">
          <BaiTinhCach cauHoi={TINH_CACH_CAU_HOI} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center gap-5 bg-navy-800 px-6 py-6 text-white">
              <span className="text-6xl">{tc.emoji}</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-do-300">
                  Nhóm tính cách của anh/chị
                </p>
                <h2 className="mt-1 text-2xl font-extrabold">{tc.ten}</h2>
                <p className="mt-1 text-sm text-navy-200">{tc.motCau}</p>
              </div>
            </div>
            <p className="px-6 py-5 leading-relaxed text-slate-700">
              {tc.tongQuan}
            </p>
          </div>

          <Muc tieuDe="Thế mạnh">
            <DanhSach y={tc.theManh} />
          </Muc>

          <Muc tieuDe="Điểm cần lưu ý">
            <DanhSach y={tc.luuY} dau="!" mau="text-amber-600" />
          </Muc>

          <Muc tieuDe="Phong cách kinh doanh">
            <p className="leading-relaxed text-slate-700">
              {tc.phongCachKinhDoanh}
            </p>
          </Muc>

          <Muc tieuDe="Anh/chị phù hợp với hoạt động nào của Chi hội">
            <DanhSach y={tc.hopVoiHoatDong} dau="▸" mau="text-navy-500" />
          </Muc>

          {/* Biết cách làm việc với 3 nhóm còn lại quan trọng không kém việc
              hiểu nhóm của chính mình — đây là phần dùng được ngay khi gặp đối tác */}
          <section className="card p-5">
            <h2 className="font-bold text-navy-800">
              Làm việc với từng nhóm đối tác
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Nhận ra nhóm của người đối diện giúp anh/chị chọn đúng cách tiếp
              cận ngay từ buổi gặp đầu.
            </p>
            <div className="mt-4 space-y-3">
              {TINH_CACH.map((t) => (
                <div
                  key={t.key}
                  className={`rounded-xl p-4 ${
                    t.key === tc.key
                      ? "bg-do-50 ring-1 ring-do-200"
                      : "bg-navy-50"
                  }`}
                >
                  <p className="font-semibold text-navy-800">
                    {t.emoji} {t.ten}
                    {t.key === tc.key && (
                      <span className="ml-2 text-xs font-normal text-do-600">
                        (nhóm của anh/chị)
                      </span>
                    )}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                    {t.lamViecVoi}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="pt-2">
            <NutLamLai bai="tinh-cach" />
          </div>
        </div>
      )}
    </div>
  );
}
