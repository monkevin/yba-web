import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { laNguoiVanHanh } from "@/lib/ngoi-nha/chay-action";
import { sanhDauTruong, thongTinDoiThu } from "@/lib/ngoi-nha/dau-truong";
import { luaChonThachDau } from "@/lib/ngoi-nha/bo-cau";
import { docThongSo } from "@/lib/ngoi-nha/cau-hinh";
import { docBoCauAn, docMuc, docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import BieuTuong from "@/components/ngoi-nha/BieuTuong";
import TimDoiThu from "./TimDoiThu";

export const metadata = { title: "Đấu trường · Ngôi nhà Chợ Lớn" };
export const dynamic = "force-dynamic";

export default async function TrangDauTruong({
  searchParams,
}: {
  searchParams: Promise<{ doiThu?: string | string[] }>;
}) {
  const [sp, user] = await Promise.all([searchParams, requireUserPage()]);
  const nguoi = { userId: user.id, memberId: user.memberId };
  const [s, thongSo, luat, tinhNang, an, doiThuChon] = await Promise.all([
    sanhDauTruong(nguoi),
    docThongSo(),
    docMuc("luat"),
    docTinhNang(),
    docBoCauAn(),
    typeof sp.doiThu === "string" ? thongTinDoiThu(nguoi, sp.doiThu) : null,
  ]);
  // Layout đang hiện màn bảo trì — đừng chạy tiếp việc nặng trên CSDL
  if (tinhNang.tamDung && !laNguoiVanHanh(user)) return null;

  // Ban Điều hành tắt Đấu trường: xem sảnh, chơi nốt trận dở, không thách mới
  const moThach = tinhNang.dauTruong;
  const doiThuKhongCo =
    moThach &&
    typeof sp.doiThu === "string" &&
    sp.doiThu !== user.id &&
    !doiThuChon;
  const ts = thongSo.dauTruong;
  const lt = luat.dauTruong;
  const choToi = s.dangDo.filter((t) => t.toiLuot);
  const choHo = s.dangDo.filter((t) => !t.toiLuot);

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 pt-4">
      <div>
        <h1 className="text-3xl">Đấu trường</h1>
        <p className="mt-1 text-sm text-white/65">
          Thách một huynh đệ: {ts.soCau} câu bấm nhanh, {ts.giay} giây mỗi câu,
          cùng bộ câu — không cần chơi cùng lúc. Đúng nhiều hơn thắng, hoà điểm
          thì ai nhanh hơn thắng.
        </p>
      </div>

      <div className="nn-kinh grid grid-cols-3 gap-2 rounded-3xl p-3 text-center">
        {[
          ["Thắng", s.thanhTich.tranThang, "text-emerald-300"],
          ["Hoà", s.thanhTich.tranHoa, "text-vang-400"],
          ["Thua", s.thanhTich.tranThua, "text-son-300"],
        ].map(([nhan, so, mau]) => (
          <div key={nhan as string}>
            <div className={`nn-so text-2xl font-black ${mau}`}>
              {so as number}
            </div>
            <div className="text-[11px] uppercase tracking-wide text-white/60">
              {nhan as string}
            </div>
          </div>
        ))}
      </div>

      {choToi.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl">Tới lượt bạn</h2>
          {choToi.map((t) => (
            <Link
              key={t.id}
              href={`/ngoi-nha/dau-truong/${t.id}`}
              className="flex items-center gap-3 rounded-2xl bg-son-600 p-4 hover:bg-son-700"
            >
              <span className="nn-tho grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-son-700">
                <BieuTuong ten="tia" dac className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">
                  {t.laThach
                    ? `Bạn thách ${t.doiThu} — chơi lượt mở màn`
                    : `${t.doiThu} thách đấu bạn!`}
                </span>
                <span className="block truncate text-xs text-white/75">
                  {[t.doiThuCongTy, t.tenBo].filter(Boolean).join(" · ")}
                </span>
              </span>
              <BieuTuong ten="mui-ten" className="h-5 w-5 shrink-0" />
            </Link>
          ))}
        </section>
      )}

      {moThach ? (
        <section>
          <h2 className="mb-2 text-xl">Chọn đối thủ</h2>
          {doiThuKhongCo && (
            <p className="mb-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-white/80">
              Tài khoản bạn chọn hiện không nhận thách đấu (đã khoá hoặc không
              còn tồn tại). Chọn đối thủ khác bên dưới nhé.
            </p>
          )}
          <TimDoiThu boCau={luaChonThachDau(an)} doiThuChon={doiThuChon} />
        </section>
      ) : (
        <div
          id="thach"
          className="nn-kinh flex items-start gap-3 rounded-3xl p-4 text-sm text-white/80"
        >
          <BieuTuong
            ten="khoa"
            className="mt-0.5 h-5 w-5 shrink-0 text-white/60"
          />
          <p>
            Đấu trường đang tạm đóng, chưa thách được trận mới. Trận đang dở vẫn
            chơi nốt bình thường — Ban Điều hành sẽ mở lại sớm.
          </p>
        </div>
      )}

      {choHo.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl">Chờ đối thủ</h2>
          {choHo.map((t) => (
            <Link
              key={t.id}
              href={`/ngoi-nha/dau-truong/${t.id}`}
              className="nn-kinh flex items-center gap-3 rounded-2xl p-3 text-sm hover:bg-white/10"
            >
              <BieuTuong
                ten="dong-ho"
                className="h-5 w-5 shrink-0 text-white/60"
              />
              <span className="min-w-0 flex-1 truncate">
                Chờ {t.doiThu} chơi lượt của họ
                {t.toiDung !== null && t.toiDung !== undefined
                  ? ` · bạn đúng ${t.toiDung}/${t.soCau}`
                  : ""}
              </span>
            </Link>
          ))}
        </section>
      )}

      {s.daXong.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl">Trận đã đấu</h2>
          {s.daXong.map((t) =>
            t.trangThai === "HUY" ? (
              <Link
                key={t.id}
                href={`/ngoi-nha/dau-truong/${t.id}`}
                className="nn-kinh flex items-center gap-3 rounded-2xl p-3 text-sm text-white/60 hover:bg-white/10"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-black">
                  –
                </span>
                <span className="min-w-0 flex-1 truncate">
                  Đã huỷ · {t.doiThu}
                </span>
              </Link>
            ) : (
              <Link
                key={t.id}
                href={`/ngoi-nha/dau-truong/${t.id}`}
                className="nn-kinh flex items-center gap-3 rounded-2xl p-3 text-sm hover:bg-white/10"
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ${
                    t.thang === null
                      ? "bg-vang-500 text-navy-900"
                      : t.thang
                        ? "bg-emerald-500 text-white"
                        : "bg-white/15 text-white/70"
                  }`}
                >
                  {t.thang === null ? "H" : t.thang ? "T" : "B"}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {t.thang === null ? "Hoà" : t.thang ? "Thắng" : "Thua"}{" "}
                  {t.doiThu}
                </span>
                <span className="nn-so font-bold">
                  {t.toiDung ?? "–"} – {t.hoDung ?? "–"}
                </span>
              </Link>
            ),
          )}
        </section>
      )}

      {s.topThang.length > 0 && (
        <section className="rounded-3xl bg-white p-4 text-navy-900">
          <h2 className="text-xl">Nhiều trận thắng nhất</h2>
          <ol className="mt-2 divide-y divide-slate-100">
            {s.topThang.map((t, i) => (
              <li
                key={t.userId}
                className="flex items-center gap-3 py-2 text-sm"
              >
                <span className="nn-so w-6 text-center font-bold text-slate-500">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{t.ten}</span>
                  {t.congTy && (
                    <span className="block truncate text-xs text-slate-500">
                      {t.congTy}
                    </span>
                  )}
                </span>
                <span className="nn-so text-xs text-slate-500">
                  <b className="text-base text-navy-800">{t.tranThang}</b> thắng
                  · {t.tranHoa} hoà · {t.tranThua} thua
                </span>
                {moThach && t.userId !== user.id && (
                  <Link
                    href={`/ngoi-nha/dau-truong?doiThu=${t.userId}#thach`}
                    className="flex min-h-9 shrink-0 items-center rounded-full bg-son-600 px-3 text-xs font-bold text-white hover:bg-son-700"
                  >
                    Thách
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="text-center text-xs text-white/50">
        Thắng +{ts.thang} · hoà +{ts.hoa} · thua +{ts.thua} · mỗi câu đúng +
        {ts.moiCauDung} điểm
        {lt.vonTT || lt.vonXH
          ? `; cả hai bên ${[
              lt.vonTT ? `+${lt.vonTT} Vốn tri thức` : "",
              lt.vonXH ? `+${lt.vonXH} Vốn xã hội` : "",
            ]
              .filter(Boolean)
              .join(", ")}`
          : ""}
        . Mỗi ngày tối đa {lt.tranTinhDiemMoiNgay} trận có điểm, gặp cùng một
        người tối đa {lt.cungDoiThuMoiNgay} trận có điểm.
      </p>
    </main>
  );
}
