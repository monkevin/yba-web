import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { soDep } from "@/lib/ngoi-nha/luat";
import {
  CHOI_THU,
  coCauHienTai,
  muaHienTai,
  tongGiaTri,
  tongQua,
} from "@/lib/ngoi-nha/mua";
import { tienDoMoc, type MocQua, type SoLieuMoc } from "@/lib/ngoi-nha/moc-qua";
import { hoSoNguoiChoi } from "@/lib/ngoi-nha/tong-hop";
import { tranThangTrongMua } from "@/lib/ngoi-nha/dau-truong";
import { ngayDep } from "@/lib/ngoi-nha/thoi-gian";
import { docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import { laNguoiVanHanh } from "@/lib/ngoi-nha/chay-action";
import { quaLaBaiCuaToi } from "@/lib/ngoi-nha/la-bai";
import { vinhDanhCuaToi } from "@/lib/ngoi-nha/vinh-danh-thang";
import BieuTuong from "@/components/ngoi-nha/BieuTuong";

export const metadata = { title: "Phần thưởng · Ngôi nhà Chợ Lớn" };

export default async function TrangPhanThuong() {
  const user = await requireUserPage();
  const tinhNang = await docTinhNang();
  // Layout đang hiện màn bảo trì — không cần tải số liệu
  if (tinhNang.tamDung && !laNguoiVanHanh(user)) return null;
  const nguoi = { userId: user.id, memberId: user.memberId };
  const mua = await muaHienTai();
  const [hs, { coCau, mua: muaDuKien }, nguoiChoi, daTrao, quaLaBai, vinhDanh] =
    await Promise.all([
      hoSoNguoiChoi(nguoi, mua),
      coCauHienTai(),
      tranThangTrongMua(mua, [user.id]),
      mua.id === CHOI_THU
        ? []
        : prisma.nnTraoQua.findMany({
            where: { userId: user.id, muaId: mua.id },
          }),
      // Quà Lá bài chỉ rơi trong mùa chính thức; đã trúng thì vẫn hiện dù Ban
      // tắt Lá bài sau đó (quà vẫn phải trao)
      mua.id === CHOI_THU
        ? []
        : quaLaBaiCuaToi(user.id, mua.id).catch((e) => {
            console.error("[ngoi-nha] qua la bai", e);
            return [];
          }),
      mua.id === CHOI_THU
        ? []
        : vinhDanhCuaToi(user.id, mua.id).catch((e) => {
            console.error("[ngoi-nha] vinh danh thang", e);
            return [];
          }),
    ]);
  const { giai, moc } = coCau;
  const nhaDongHanh = [
    ...new Set(
      [...giai, ...moc]
        .map((b) => b.nhaDongHanh?.trim())
        .filter((x): x is string => !!x),
    ),
  ];
  const traoRoi = new Set(daTrao.map((t) => t.loai));
  const soLieu: SoLieuMoc = {
    tram: hs.tram,
    soTramQua: hs.soTramQua,
    soSao: hs.soSao,
    diem: hs.diem,
    tranThang: nguoiChoi.get(user.id) ?? 0,
  };
  const soQua = tongQua(giai);
  const giaTri = tongGiaTri(giai);

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 pt-4">
      <div>
        <h1 className="text-3xl">Phần thưởng</h1>
        <p className="mt-1 text-sm text-white/65">
          Quà do doanh nghiệp hội viên đồng hành — đúng tinh thần “hội viên dùng
          hàng hội viên”.
        </p>
        <p className="mt-2 flex items-start gap-2 rounded-2xl bg-white/5 px-3 py-2 text-sm text-white/80">
          <BieuTuong
            ten="lich"
            className="mt-0.5 h-4 w-4 shrink-0 text-son-300"
          />
          <span>
            {mua.trangThai === "DANG_DIEN_RA" && (
              <>
                <b className="text-white">{mua.ten}</b> đang diễn ra, kết thúc
                ngày {ngayDep(mua.ketThuc!)}.
              </>
            )}
            {mua.trangThai === "DA_KET_THUC" && (
              <>
                <b className="text-white">{mua.ten}</b> đã kết thúc — chờ Ban
                Điều hành công bố kết quả.
              </>
            )}
            {(mua.trangThai === "CHOI_THU" || mua.trangThai === "SAP_MO") &&
              (muaDuKien ? (
                <>
                  <b className="text-white">{muaDuKien.ten}</b> bắt đầu ngày{" "}
                  {ngayDep(muaDuKien.batDau)}. Hiện đang chơi thử — điểm tính
                  lại từ đầu khi mùa giải bắt đầu.
                </>
              ) : (
                <>
                  Ban Điều hành chưa đặt lịch mùa giải. Hiện đang chơi thử —
                  điểm tính lại từ đầu khi mùa giải bắt đầu.
                </>
              ))}
          </span>
        </p>
      </div>

      {moc.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl">Mốc quà — ai đạt cũng có</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {moc.map((m) => (
              <TheMoc
                key={m.ma}
                m={m}
                soLieu={soLieu}
                daTrao={traoRoi.has(m.ma)}
                choiThu={mua.id === CHOI_THU}
              />
            ))}
          </div>
        </section>
      )}

      {quaLaBai.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl">Quà may mắn từ Lá bài</h2>
          <ul className="nn-kinh divide-y divide-white/10 overflow-hidden rounded-3xl">
            {quaLaBai.map((q) => (
              <li
                key={`${q.ngay}-${q.ten}`}
                className="flex items-start gap-3 px-4 py-3"
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-vang-500 text-navy-900">
                  <BieuTuong ten="the" className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{q.ten}</div>
                  <div className="text-sm text-white/70">
                    Lật ngày {ngayChuoiDep(q.ngay)}
                    {q.nhaDongHanh && <> · đồng hành: {q.nhaDongHanh}</>}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${q.daTrao ? "bg-white/15 text-white/80" : "bg-vang-500 text-navy-900"}`}
                >
                  {q.daTrao ? "Đã nhận" : "Chờ nhận"}
                </span>
              </li>
            ))}
          </ul>
          {quaLaBai.some((q) => !q.daTrao) && (
            <p className="text-xs text-white/60">
              Quà chưa nhận: liên hệ Văn phòng Chi hội hoặc nhận tại buổi sinh
              hoạt gần nhất.
            </p>
          )}
        </section>
      )}

      <section className="overflow-hidden rounded-3xl bg-white text-navy-900">
        <div className="san-do px-5 py-4 text-white">
          <h2 className="text-2xl">
            Cơ cấu giải {muaDuKien ? muaDuKien.ten : "(dự kiến)"}
          </h2>
          <p className="mt-1 text-sm text-white/75">
            <b className="nn-so">{soQua}</b> phần quà xếp hạng
            {giaTri > 0 && (
              <>
                {" "}
                · quà đã có trị giá <b className="nn-so">{soDep(giaTri)}đ</b>
              </>
            )}
            {moc.length > 0 && (
              <>, thêm {moc.length} mốc quà cho mọi người đạt</>
            )}
            .
          </p>
        </div>
        <ul className="divide-y divide-slate-100">
          {giai.map((b, i) => (
            <li key={i} className="flex gap-3 px-5 py-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy-50 text-navy-600">
                <BieuTuong
                  ten={
                    /bốc thăm/i.test(b.hangMuc)
                      ? "qua"
                      : /giải|hạng|top/i.test(b.hangMuc)
                        ? "cup"
                        : "khien"
                  }
                  className="h-5 w-5"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <div className="font-bold">{b.hangMuc}</div>
                  <span className="text-xs font-semibold text-slate-500">
                    {b.soLuong}
                  </span>
                </div>
                <div className="text-sm text-slate-600">{b.dieuKien}</div>
                <div className="mt-0.5 text-sm">
                  <b className="text-son-700">{b.qua}</b>
                  {b.giaTri ? (
                    <span className="nn-so text-slate-700">
                      {" "}
                      · {soDep(b.giaTri)}đ
                    </span>
                  ) : null}
                  {b.nhaDongHanh && (
                    <span className="text-slate-500">
                      {" "}
                      · đồng hành: {b.nhaDongHanh}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
          {giai.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-slate-500">
              Ban Điều hành đang chuẩn bị cơ cấu giải.
            </li>
          )}
        </ul>
      </section>

      {nhaDongHanh.length > 0 && (
        <section className="nn-kinh rounded-3xl p-5">
          <h2 className="text-xl">Cảm ơn nhà đồng hành</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {nhaDongHanh.map((n) => (
              <span
                key={n}
                className="rounded-full bg-white/10 px-3 py-1 text-sm"
              >
                {n}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-white p-5 text-sm text-navy-900">
        <h2 className="text-xl">Lịch trao thưởng</h2>
        <p className="mt-1 text-slate-600">
          Không phải đợi tới cuối mùa mới có phần: mỗi ngày, mỗi tuần, mỗi tháng
          đều có phần của mình.
        </p>
        <ul className="mt-3 space-y-2 text-slate-700">
          <li>
            <b>Mỗi ngày</b> — lật một Lá bài: danh ngôn, lời nhắn của Ban Chủ
            nhiệm, điểm thưởng, thỉnh thoảng có quà may mắn.
          </li>
          <li>
            <b>Mỗi tuần</b> — top 3 tuần được nêu tên trong nhóm của Chi hội.
          </li>
          <li>
            <b>Mỗi tháng</b> — <b>top 10 của tháng</b> được vinh danh tại buổi
            sinh hoạt, 3 người đầu bảng có quà. Điểm tháng tính riêng từng tháng
            nên vào chơi muộn vẫn còn cửa; mỗi người nhận quà tháng tối đa 2 lần
            một mùa, đủ số thì vẫn được vinh danh và nhường quà cho người kế
            tiếp.
          </li>
          <li>
            <b>Mốc cá nhân</b> — ai đạt cũng có, xem ở phần “Mốc quà” phía trên.
          </li>
          <li>
            <b>Cuối mùa</b> — cơ cấu giải lớn theo bảng xếp hạng cả mùa.
          </li>
        </ul>
        {vinhDanh.length > 0 && (
          <p className="mt-3 rounded-xl bg-vang-400/15 px-3 py-2 text-navy-900">
            Bạn đã được vinh danh{" "}
            <b>
              {vinhDanh
                .map((v) => `${v.ten}${v.coQua ? " (có quà)" : ""}`)
                .join(" · ")}
            </b>
            . Cảm ơn bạn đã giữ nhịp cùng Chi hội!
          </p>
        )}
      </section>

      <section className="rounded-3xl bg-white p-5 text-sm text-navy-900">
        <h2 className="text-xl">Điều kiện nhận thưởng</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
          <li>Là hội viên đang sinh hoạt, mỗi người một tài khoản.</li>
          <li>
            Ban soạn đề và Ban vận hành game vẫn chơi, vẫn nhận quà mốc nhưng
            không nhận giải xếp hạng.
          </li>
          <li>
            Phát hiện gian lận (chơi hộ, khai khống nhiệm vụ) sẽ bị hủy kết quả
            mùa.
          </li>
          <li>
            Kết quả công bố trên website và fanpage; quà trao tại buổi sinh hoạt
            gần nhất hoặc nhận tại Văn phòng Chi hội; quà không quy đổi thành
            tiền.
          </li>
          <li>
            Được vinh danh tháng không làm mất quyền nhận giải cuối mùa — hai
            bảng tính độc lập.
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Điểm Vươn tầm của bạn hiện là <b>{soDep(hs.diem)}</b>. Xem thứ hạng ở
          mục Xếp hạng.
        </p>
      </section>
    </main>
  );
}

/** "yyyy-mm-dd" → "dd/mm/yyyy" (ngày lật bài đã tính theo giờ Việt Nam). */
function ngayChuoiDep(ngay: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ngay);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ngay;
}

function TheMoc({
  m,
  soLieu,
  daTrao,
  choiThu,
}: {
  m: MocQua;
  soLieu: SoLieuMoc;
  daTrao: boolean;
  choiThu: boolean;
}) {
  const { da, tong, moTa, donVi } = tienDoMoc(m, soLieu);
  const du = da >= tong;
  return (
    <div
      className={`rounded-3xl p-4 ${du ? "bg-gradient-to-br from-vang-400 to-vang-600 text-navy-900" : "nn-kinh"}`}
    >
      <div className="flex items-center gap-2 font-bold">
        <BieuTuong ten="qua" className="h-5 w-5 shrink-0" /> {m.ten}
      </div>
      <div className={`text-sm ${du ? "text-navy-800" : "text-white/70"}`}>
        {moTa} · {m.qua}
        {m.giaTri ? ` · ${soDep(m.giaTri)}đ` : ""}
      </div>
      <div
        className={`mt-3 h-2.5 overflow-hidden rounded-full ${du ? "bg-navy-900/15" : "bg-white/10"}`}
      >
        <div
          className={`h-full rounded-full ${du ? "bg-navy-800" : "bg-vang-400"}`}
          style={{ width: `${Math.min(100, (da / Math.max(1, tong)) * 100)}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between gap-2 text-sm font-semibold">
        <span className="nn-so">
          {soDep(Math.min(da, tong))}/{soDep(tong)} {donVi}
        </span>
        <span className="text-right">
          {daTrao
            ? "Đã nhận quà"
            : du
              ? choiThu
                ? "Đạt khi chơi thử — quà trao trong mùa giải"
                : "Đủ điều kiện — nhận tại Văn phòng Chi hội"
              : `Còn ${soDep(tong - da)} ${donVi}`}
        </span>
      </div>
    </div>
  );
}
