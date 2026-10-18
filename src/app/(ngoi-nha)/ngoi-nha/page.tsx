import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { donLuotCu } from "@/lib/ngoi-nha/dong-co";
import {
  chuCaiTen,
  duongDanTram,
  MA_VON,
  soDep,
  VON,
} from "@/lib/ngoi-nha/luat";
import { coCauHienTai, muaHienTai } from "@/lib/ngoi-nha/mua";
import { tienDoMoc } from "@/lib/ngoi-nha/moc-qua";
import { docThongSo } from "@/lib/ngoi-nha/cau-hinh";
import {
  docHuongDan,
  docMuc,
  docNhiemVuSua,
  docTinhNang,
} from "@/lib/ngoi-nha/cai-dat";
import { danhHieuTheoLuat } from "@/lib/ngoi-nha/cai-dat/luat-choi";
import { laNguoiVanHanh } from "@/lib/ngoi-nha/chay-action";
import { laBaiHomNay } from "@/lib/ngoi-nha/la-bai";
import { dongBoTuDong, sinhNhatHomNay } from "@/lib/ngoi-nha/nhiem-vu";
import { bangXepHang, hoSoNguoiChoi } from "@/lib/ngoi-nha/tong-hop";
import { soLoiThach, tranThangTrongMua } from "@/lib/ngoi-nha/dau-truong";
import { dauTriDangMo } from "@/lib/ngoi-nha/dau-tri";
import { ngayDep } from "@/lib/ngoi-nha/thoi-gian";
import BieuTuong from "@/components/ngoi-nha/BieuTuong";
import HuongDan from "@/components/ngoi-nha/HuongDan";
import LaBaiMoiNgay from "@/components/ngoi-nha/LaBaiMoiNgay";
import NgoiNha from "@/components/ngoi-nha/NgoiNha";

export const metadata = { title: "Ngôi nhà Chợ Lớn" };

/** Số ngày còn lại tới mốc kết thúc (làm tròn lên). */
function soNgayCon(den: Date | null): number | null {
  return den
    ? Math.max(0, Math.ceil((den.getTime() - Date.now()) / 86400000))
    : null;
}

export default async function TrangNgoiNha() {
  const user = await requireUserPage();
  const tinhNang = await docTinhNang();
  // Game tạm dừng: layout đã hiện màn bảo trì, nhưng Next dựng page song song
  // với layout — dừng ở đây để không dọn lượt / đồng bộ nhiệm vụ lúc tạm dừng.
  if (tinhNang.tamDung && !laNguoiVanHanh(user)) return null;

  const nguoi = { userId: user.id, memberId: user.memberId };
  await donLuotCu(nguoi);
  const mua = await muaHienTai();
  const thuongMoi = tinhNang.nhiemVu
    ? await dongBoTuDong(nguoi, mua).catch(() => [])
    : [];

  const [hs, bxh, hoiVien, soNhoXacNhan, sinhNhat, loiThach, dauTri] =
    await Promise.all([
      hoSoNguoiChoi(nguoi, mua),
      bangXepHang(mua.id, "mua", user.id, 3),
      user.memberId
        ? prisma.member.findUnique({
            where: { id: user.memberId },
            select: { name: true, company: true, avatar: true },
          })
        : Promise.resolve(null),
      user.memberId && tinhNang.nhiemVu
        ? prisma.nnNhiemVu.count({
            where: {
              lienQuanMemberId: user.memberId,
              trangThai: "CHO_XAC_NHAN",
              cach: "HOI_VIEN",
            },
          })
        : Promise.resolve(0),
      tinhNang.nhiemVu ? sinhNhatHomNay(user.memberId) : Promise.resolve([]),
      soLoiThach(user.id),
      tinhNang.dauTri ? dauTriDangMo() : Promise.resolve([]),
    ]);
  const [
    { coCau, mua: muaDuKien },
    thongSo,
    nguoiChoi,
    luat,
    nhiemVuSua,
    huongDan,
  ] = await Promise.all([
    coCauHienTai(),
    docThongSo(),
    tranThangTrongMua(mua, [user.id]),
    docMuc("luat"),
    docNhiemVuSua(),
    docHuongDan(),
  ]);
  // Ô Lá bài lỗi thì trang chủ vẫn phải mở được
  const laBai = tinhNang.laBai
    ? await laBaiHomNay(nguoi, mua).catch((e) => {
        console.error("[ngoi-nha] la bai hom nay", e);
        return null;
      })
    : null;

  const ten = hoiVien?.name ?? user.name;
  const chuCai = chuCaiTen(ten);
  const nguongCanBang = luat.von.nguongCanBang;
  const dh = danhHieuTheoLuat(luat, hs.diem, hs.ngonLua);
  // Bậc kế là "Ngọn lửa" (không tính bằng điểm) → tiến độ theo số trạm đã qua
  const lenNgonLua =
    dh.tiepTheo !== null && !Number.isFinite(dh.tiepTheo.tuDiem);
  const tienDoDanhHieu = !dh.tiepTheo
    ? 100
    : lenNgonLua
      ? Math.min(
          100,
          Math.round((hs.soTramQua / Math.max(1, luat.ngonLua.soTram)) * 100),
        )
      : Math.min(
          100,
          Math.round(
            ((hs.diem - dh.hienTai.tuDiem) /
              (dh.tiepTheo.tuDiem - dh.hienTai.tuDiem)) *
              100,
          ),
        );
  const ngayCon = soNgayCon(mua.ketThuc);
  const sinhNhatChuaChuc = sinhNhat.filter((s) => !s.daChuc).length;
  const soNhiemVu = nhiemVuSua.ds.filter((n) => n.bat).length;
  const soCauNgay = luat.thuThachNgay.soCau;

  // Mốc quà gần nhất chưa đạt (hết mốc thì hiện mốc cuối cùng đã đạt)
  const soLieuMoc = {
    tram: hs.tram,
    soTramQua: hs.soTramQua,
    soSao: hs.soSao,
    diem: hs.diem,
    tranThang: nguoiChoi.get(user.id) ?? 0,
  };
  const cacMoc = coCau.moc.map((m) => ({ m, ...tienDoMoc(m, soLieuMoc) }));
  const mocTiep =
    cacMoc.find((x) => x.da < x.tong) ?? cacMoc[cacMoc.length - 1] ?? null;

  // Trận đang chờ mình vẫn cho vào đánh nốt dù Ban vừa tắt Đấu trường
  const hienDauTruong = tinhNang.dauTruong || loiThach > 0;
  // Đang chơi dở hoặc đã chơi xong hôm nay thì vẫn giữ lối vào để xem lại kết quả
  const hienThuThach =
    tinhNang.thuThachNgay || hs.thuThach.trangThai !== "CHUA";
  const soTheNho =
    Number(hienDauTruong) +
    Number(tinhNang.dauTri) +
    Number(tinhNang.nhiemVu) +
    1;

  return (
    <main className="mx-auto max-w-5xl px-4 pt-4">
      {tinhNang.huongDan && !hs.daXemHuongDan && (
        <HuongDan buoc={huongDan.buoc} />
      )}

      {/* Chợ Bình Tây — năm gian, mỗi gian một chặng */}
      <div>
        <NgoiNha
          tram={hs.tram}
          tramTiep={hs.tramTiep?.ma ?? null}
          chuCai={chuCai}
          anh={hoiVien?.avatar ?? null}
          ngonLua={hs.ngonLua}
          soViecHuynhDe={soNhoXacNhan + sinhNhatChuaChuc}
          tinhDiem={mua.tinhDiem}
          luotToiDa={thongSo.luotTinhDiemToiDa}
          heSoThuThach={luat.tram.heSoThuThach}
          canDeQuaThuThach={luat.tram.saoMotThuThach}
          nhiemVu={tinhNang.nhiemVu}
        />
        <p className="mt-2 text-center text-xs text-white/50">
          Đã thắp sáng {hs.soTramQua}/{hs.tongTram} trạm · {hs.soSao} sao — chạm
          vào một trạm để xem chi tiết
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
        {/* Cột trái: mùa giải, hồ sơ, thông báo */}
        <div className="space-y-4">
          {/* Mùa giải */}
          <div className="flex items-center gap-2 text-xs text-white/70">
            <BieuTuong ten="lich" className="h-4 w-4 shrink-0 text-son-300" />
            {mua.trangThai === "DANG_DIEN_RA" && (
              <span>
                <b className="text-white">{mua.ten}</b> · đến{" "}
                {ngayDep(mua.ketThuc!)} · còn {ngayCon} ngày
              </span>
            )}
            {mua.trangThai === "SAP_MO" && (
              <span>
                <b className="text-white">{mua.ten}</b> bắt đầu ngày{" "}
                {ngayDep(mua.batDau!)} — đang chơi thử, điểm sẽ tính lại từ đầu
              </span>
            )}
            {mua.trangThai === "DA_KET_THUC" && (
              <span>
                <b className="text-white">{mua.ten}</b> đã kết thúc — chờ Ban
                Điều hành công bố kết quả
              </span>
            )}
            {mua.trangThai === "CHOI_THU" && (
              <span>
                {muaDuKien ? (
                  <>
                    <b className="text-white">{muaDuKien.ten}</b> bắt đầu ngày{" "}
                    {ngayDep(muaDuKien.batDau)} — đang chơi thử, điểm sẽ tính
                    lại từ đầu
                  </>
                ) : (
                  "Ban Điều hành chưa đặt lịch mùa giải — đang chơi thử, điểm sẽ tính lại từ đầu khi mùa giải bắt đầu"
                )}
              </span>
            )}
          </div>

          {thuongMoi.length > 0 && (
            <div className="nn-hien rounded-2xl bg-vang-500 p-3 text-navy-900">
              <div className="flex items-center gap-2 font-bold">
                <BieuTuong ten="tay" className="h-5 w-5" /> Hệ thống vừa ghi
                nhận việc thật của bạn
              </div>
              <ul className="mt-1 space-y-0.5 text-sm">
                {thuongMoi.slice(0, 4).map((t, i) => (
                  <li key={i}>
                    {t.ten}: {t.moTa} <b>+{soDep(t.diem)}</b>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hồ sơ nhanh */}
          <section className="nn-kinh rounded-3xl p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-son-600 text-xl font-bold ring-2 ring-white/70">
                {hoiVien?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hoiVien.avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  chuCai
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-bold">{ten}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="rounded-full bg-son-600 px-2 py-0.5 font-bold">
                    {dh.hienTai.ten}
                  </span>
                  <span className="text-white/70">
                    {bxh.cuaToi
                      ? `Hạng ${bxh.cuaToi.hang}/${bxh.tong}${mua.id === "CHOI_THU" ? " (chơi thử)" : ""}`
                      : mua.tinhDiem
                        ? "Chưa có điểm"
                        : "Chưa xếp hạng"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="nn-so text-3xl font-black leading-none">
                  {soDep(hs.diem)}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-white/60">
                  Điểm Vươn tầm
                </div>
              </div>
            </div>
            {dh.tiepTheo && (
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-son-500 to-vang-400"
                    style={{ width: `${Math.max(0, tienDoDanhHieu)}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-white/60">
                  {lenNgonLua ? (
                    <>
                      Lên <b className="text-white/90">{dh.tiepTheo.ten}</b>:
                      qua đủ {luat.ngonLua.soTram} trạm, từ {luat.ngonLua.soSao}{" "}
                      sao và cân bằng 4V
                    </>
                  ) : (
                    <>
                      Còn {soDep(Math.max(0, dh.tiepTheo.tuDiem - hs.diem))}{" "}
                      điểm lên{" "}
                      <b className="text-white/90">{dh.tiepTheo.ten}</b>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="mt-3 grid grid-cols-4 gap-2">
              {MA_VON.map((k) => (
                <div key={k} className="rounded-xl bg-white/5 px-2 py-1.5">
                  <div className="text-[11px] text-white/60">{VON[k].ngan}</div>
                  <div className="nn-so text-base font-bold">{hs.von[k]}</div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (Math.max(0, hs.von[k]) / Math.max(1, nguongCanBang)) * 100)}%`,
                        background: VON[k].mau,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Chơi tiếp */}
          {hs.tramTiep ? (
            <Link
              href={duongDanTram(hs.tramTiep.ma)}
              className="flex items-center gap-3 rounded-3xl bg-son-600 p-4 shadow-lg shadow-son-900/40 hover:bg-son-700"
            >
              <span className="nn-tho grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-son-700">
                <BieuTuong ten="choi" dac className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wide text-white/75">
                  {hs.tramTiep.dangChoi
                    ? "Chơi tiếp lượt đang dở"
                    : "Chơi tiếp"}{" "}
                  · Trạm {hs.tramTiep.ma}
                </span>
                <span className="block truncate text-lg font-bold">
                  {hs.tramTiep.ten}
                </span>
              </span>
              <BieuTuong ten="mui-ten" className="h-5 w-5 shrink-0" />
            </Link>
          ) : (
            <div className="rounded-3xl bg-gradient-to-r from-vang-500 to-vang-400 p-4 text-navy-900">
              <div className="text-lg font-bold">
                Bạn đã thắp sáng cả Ngôi nhà Chợ Lớn!
              </div>
              <p className="text-sm">
                {tinhNang.nhiemVu
                  ? "Chơi lại các trạm để nâng sao và điểm, hoặc làm Nhiệm vụ Huynh đệ để tăng vốn."
                  : "Chơi lại các trạm để nâng sao và điểm."}
              </p>
            </div>
          )}

          {laBai?.bat && (
            <LaBaiMoiNgay
              duLieu={laBai}
              daXemHuongDan={hs.daXemHuongDan || !tinhNang.huongDan}
            />
          )}

          {/* Thử thách hằng ngày */}
          {hienThuThach && (
            <Link
              href="/ngoi-nha/thu-thach"
              className="nn-kinh flex items-center gap-3 rounded-3xl p-4 hover:bg-white/10"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-vang-500 text-navy-900">
                <BieuTuong ten="lua" dac className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">Thử thách hôm nay</span>
                <span className="block text-sm text-white/70">
                  {hs.thuThach.trangThai === "XONG"
                    ? `Đã xong ${hs.thuThach.soDung}/${hs.thuThach.soCau} câu · +${soDep(hs.thuThach.diem)} điểm`
                    : hs.thuThach.trangThai === "DANG_CHOI"
                      ? "Đang chơi dở — vào chơi tiếp"
                      : `${soCauNgay} câu · khoảng ${Math.max(1, Math.round((soCauNgay * 24) / 60))} phút${luat.thuThachNgay.thuongMoiNgay > 0 ? " · thưởng chuỗi ngày" : ""}`}
                </span>
              </span>
              <span className="text-right">
                <span className="nn-so block text-2xl font-black text-vang-400">
                  {hs.thuThach.chuoiNgay}
                </span>
                <span className="block text-[11px] text-white/60">
                  ngày liên tiếp
                </span>
              </span>
            </Link>
          )}
        </div>

        {/* Thẻ nhanh */}
        <div className="grid gap-3 sm:grid-cols-2">
          {tinhNang.dauTri && dauTri.length > 0 && (
            <Link
              href={`/ngoi-nha/dau-tri/${dauTri[0].id}`}
              className="flex items-center gap-3 rounded-3xl bg-gradient-to-r from-son-700 to-son-500 p-4 hover:from-son-800 sm:col-span-2"
            >
              <span className="nn-tho grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-son-700">
                <BieuTuong ten="tia" dac className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wide text-white/80">
                  Đấu trí sự kiện đang diễn ra · mã {dauTri[0].maThamGia}
                </span>
                <span className="block truncate text-lg font-bold">
                  {dauTri[0].ten}
                </span>
              </span>
              <BieuTuong ten="mui-ten" className="h-5 w-5 shrink-0" />
            </Link>
          )}
          {hienDauTruong && (
            <Link
              href="/ngoi-nha/dau-truong"
              className={`nn-kinh rounded-3xl p-4 hover:bg-white/10 ${loiThach ? "ring-2 ring-son-500" : ""}`}
            >
              <div className="flex items-center gap-2 font-bold">
                <BieuTuong ten="tia" dac className="h-5 w-5 text-vang-400" />{" "}
                Đấu trường
                {loiThach > 0 && (
                  <span className="rounded-full bg-son-600 px-2 py-0.5 text-xs font-bold">
                    {loiThach}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-white/70">
                {loiThach > 0
                  ? `${loiThach} huynh đệ đang thách đấu bạn`
                  : `Thách một huynh đệ ${thongSo.dauTruong.soCau} câu bấm nhanh`}
              </p>
            </Link>
          )}
          {tinhNang.dauTri && (
            <Link
              href="/ngoi-nha/dau-tri"
              className="nn-kinh rounded-3xl p-4 hover:bg-white/10"
            >
              <div className="flex items-center gap-2 font-bold">
                <BieuTuong ten="cup" className="h-5 w-5 text-vang-400" /> Đấu
                trí sự kiện
              </div>
              <p className="mt-1 text-sm text-white/70">
                {dauTri.length
                  ? "Vào chơi ngay tại sự kiện"
                  : "Chơi tại buổi sinh hoạt, bảng điểm lên sân khấu"}
              </p>
            </Link>
          )}
          {tinhNang.nhiemVu && (
            <Link
              href="/ngoi-nha/nhiem-vu"
              className="nn-kinh rounded-3xl p-4 hover:bg-white/10"
            >
              <div className="flex items-center gap-2 font-bold">
                <BieuTuong ten="tay" className="h-5 w-5 text-son-300" /> Góc
                Huynh đệ
              </div>
              <p className="mt-1 text-sm text-white/70">
                {soNhoXacNhan > 0
                  ? `${soNhoXacNhan} huynh đệ nhờ bạn xác nhận`
                  : sinhNhatChuaChuc > 0
                    ? `${sinhNhatChuaChuc} hội viên có sinh nhật hôm nay`
                    : soNhiemVu > 0
                      ? `${soNhiemVu} việc thật ngoài đời để tăng vốn nhanh`
                      : "Việc thật ngoài đời để tăng vốn nhanh"}
              </p>
            </Link>
          )}
          <Link
            href="/ngoi-nha/phan-thuong"
            className={`nn-kinh rounded-3xl p-4 hover:bg-white/10 ${soTheNho % 2 === 1 ? "sm:col-span-2" : ""}`}
          >
            <div className="flex items-center gap-2 font-bold">
              <BieuTuong ten="qua" className="h-5 w-5 text-vang-400" />{" "}
              {mocTiep ? mocTiep.m.ten : "Phần thưởng mùa giải"}
            </div>
            {mocTiep ? (
              <>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-vang-400"
                    style={{
                      width: `${Math.min(100, (mocTiep.da / Math.max(1, mocTiep.tong)) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-sm text-white/70">
                  {mocTiep.da >= mocTiep.tong
                    ? mua.id === "CHOI_THU"
                      ? `Đạt mốc ${mocTiep.m.ten.toLowerCase()} khi chơi thử — quà trao trong mùa giải`
                      : `Đã đủ điều kiện nhận ${mocTiep.m.ten.toLowerCase()}!`
                    : `${mocTiep.moTa} — còn ${soDep(mocTiep.tong - mocTiep.da)} ${mocTiep.donVi}`}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-white/70">
                Xem cơ cấu giải và quà của nhà đồng hành
              </p>
            )}
          </Link>
          <Link
            href="/ngoi-nha/xep-hang"
            className="nn-kinh rounded-3xl p-4 hover:bg-white/10 sm:col-span-2"
          >
            <div className="flex items-center gap-2 font-bold">
              <BieuTuong ten="cup" className="h-5 w-5 text-vang-400" />{" "}
              {mua.id === "CHOI_THU" ? "Bảng chơi thử" : "Bảng xếp hạng mùa"}
            </div>
            {bxh.dong.length ? (
              <ol className="mt-2 space-y-1.5">
                {bxh.dong.map((d) => (
                  <li
                    key={d.userId}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${d.hang === 1 ? "bg-vang-500 text-navy-900" : "bg-white/15"}`}
                    >
                      {d.hang}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {d.ten}
                      {d.laToi && " (bạn)"}
                    </span>
                    <b className="nn-so">{soDep(d.giaTri)}</b>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-1 text-sm text-white/70">
                {mua.tinhDiem
                  ? "Chưa ai ghi điểm — hãy là người đầu tiên!"
                  : "Mùa giải đã kết thúc — chờ tổng kết."}
              </p>
            )}
          </Link>
        </div>
      </div>
    </main>
  );
}
