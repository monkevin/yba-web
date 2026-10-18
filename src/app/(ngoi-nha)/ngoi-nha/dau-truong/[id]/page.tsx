import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserPage } from "@/lib/auth";
import { chiTietTran } from "@/lib/ngoi-nha/dau-truong";
import BieuTuong from "@/components/ngoi-nha/BieuTuong";
import ChoiTranDau from "./ChoiTranDau";

export const metadata = { title: "Trận đấu · Ngôi nhà Chợ Lớn" };
// KHÔNG revalidate trang này trong action nộp bài — người vừa chơi sẽ mất màn xem lại đáp án
export const dynamic = "force-dynamic";

const giayDep = (ms: number | null) =>
  ms === null ? "—" : `${(ms / 1000).toFixed(1)}s`;

export default async function TrangTranDau({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUserPage();
  const t = await chiTietTran({ userId: user.id, memberId: user.memberId }, id);
  if (!t) notFound();

  return (
    <main className="mx-auto max-w-lg px-4 pt-4">
      <Link
        href="/ngoi-nha/dau-truong"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-white/70 hover:text-white"
      >
        <BieuTuong ten="quay-lai" className="h-4 w-4" /> Đấu trường
      </Link>
      <div className="mt-1 mb-4">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-son-300">
          Trận đấu
        </div>
        <h1 className="text-2xl">
          {t.thach.ten} <span className="text-white/50">vs</span> {t.doiThu.ten}
        </h1>
        <p className="text-sm text-white/65">
          {t.soCau} câu · {t.giay} giây mỗi câu · {t.tenBo}
        </p>
      </div>

      {t.toiLuot ? (
        <ChoiTranDau
          tranId={t.id}
          laThach={t.laThach}
          doiThu={t.laThach ? t.doiThu.ten : t.thach.ten}
          soCau={t.soCau}
          giayMoiCau={t.giay}
        />
      ) : t.trangThai === "HUY" ? (
        <div className="rounded-3xl bg-white p-6 text-center text-navy-900">
          <BieuTuong ten="khoa" className="mx-auto h-10 w-10 text-navy-400" />
          <p className="mt-2 font-semibold">{t.nhanTrangThai}</p>
          <p className="mt-1 text-sm text-slate-500">
            Trận này treo quá lâu nên Ban Điều hành đã huỷ. Không ai bị trừ điểm
            — hai bạn thách nhau trận mới được ngay.
          </p>
          <Link
            href="/ngoi-nha/dau-truong"
            className="mt-4 flex min-h-12 items-center justify-center rounded-full bg-son-600 font-bold text-white hover:bg-son-700"
          >
            Về Đấu trường
          </Link>
        </div>
      ) : t.trangThai === "XONG" ? (
        <div className="rounded-3xl bg-white p-5 text-navy-900">
          <div className="text-center">
            <div className="chu-tieu-de text-2xl">
              {t.thangId === null
                ? "Hoà!"
                : `${t.thangId === t.thach.userId ? t.thach.ten : t.doiThu.ten} thắng!`}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {t.thangId === null
                ? "Cùng điểm, cùng thời gian"
                : t.thangId === user.id
                  ? "Chúc mừng bạn"
                  : "Lần sau gỡ lại nhé"}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            {[t.thach, t.doiThu].map((b) => {
              const thang = t.thangId === b.userId;
              return (
                <div
                  key={b.userId}
                  className={`rounded-2xl p-3 ${thang ? "bg-vang-400/20 ring-2 ring-vang-500" : "bg-slate-50"}`}
                >
                  <div className="truncate text-sm font-semibold">
                    {thang && (
                      <BieuTuong
                        ten="cup"
                        dac
                        className="mr-1 inline h-4 w-4 text-vang-600"
                      />
                    )}
                    {b.ten}
                  </div>
                  <div className="nn-so mt-1 text-3xl font-black">
                    {b.dung ?? "—"}
                    <span className="text-sm font-normal text-slate-500">
                      /{t.soCau}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{giayDep(b.ms)}</div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">
            Hoà điểm thì bên trả lời nhanh hơn thắng.
          </p>
          <Link
            href="/ngoi-nha/dau-truong"
            className="mt-4 flex min-h-12 items-center justify-center rounded-full bg-son-600 font-bold text-white hover:bg-son-700"
          >
            Thách trận mới
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-6 text-center text-navy-900">
          <BieuTuong
            ten="dong-ho"
            className="mx-auto h-10 w-10 text-navy-400"
          />
          <p className="mt-2 font-semibold">
            {t.trangThai === "CHO_THACH"
              ? `Chờ ${t.thach.ten} chơi lượt mở màn`
              : `Chờ ${t.doiThu.ten} nhận lời thách đấu`}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Họ sẽ thấy lời thách ngay khi mở game. Kết quả chung cuộc hiện ở đây
            khi cả hai chơi xong.
          </p>
          {t.laThach && t.thach.dung !== null && (
            <p className="mt-3 text-sm">
              Lượt của bạn:{" "}
              <b>
                {t.thach.dung}/{t.soCau}
              </b>{" "}
              · {giayDep(t.thach.ms)}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
