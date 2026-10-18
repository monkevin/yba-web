import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserPage } from "@/lib/auth";
import { co, QUYEN } from "@/lib/quyen";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { LOAI_CAU, soDep } from "@/lib/ngoi-nha/luat";
import {
  CHOI_THU,
  CO_CAU_MAC_DINH,
  coCauMau,
  docCoCau,
  muaHienTai,
} from "@/lib/ngoi-nha/mua";
import { docMucDayDu } from "@/lib/ngoi-nha/cai-dat";
import DuyetNhiemVu from "./_cai-dat/DuyetNhiemVu";
import NhatKyCaiDat from "./_cai-dat/NhatKyCaiDat";
import NoiDungBoCau from "./_cai-dat/NoiDungBoCau";
import NoiDungChiaSe from "./_cai-dat/NoiDungChiaSe";
import NoiDungHuongDan from "./_cai-dat/NoiDungHuongDan";
import NoiDungNhiemVu from "./_cai-dat/NoiDungNhiemVu";
import NoiDungTheCoHoi from "./_cai-dat/NoiDungTheCoHoi";
import QuaLaBai from "./_cai-dat/QuaLaBai";
import QuanLyNguoiChoi from "./_cai-dat/QuanLyNguoiChoi";
import QuanTriDauTri from "./_cai-dat/QuanTriDauTri";
import QuanTriLaBai from "./_cai-dat/QuanTriLaBai";
import SuaLuatChoi from "./_cai-dat/SuaLuatChoi";
import SuaLuatDauTruong from "./_cai-dat/SuaLuatDauTruong";
import SuaTinhNang from "./_cai-dat/SuaTinhNang";
import VanHanhDauTruong from "./_cai-dat/VanHanhDauTruong";
import { MA_GIAI, type MocQua } from "@/lib/ngoi-nha/moc-qua";
import { CAU_THEO_ID, TRAM, TRAM_THEO_MA } from "@/lib/ngoi-nha/noi-dung";
import { tongHopChiaSe } from "@/lib/ngoi-nha/cau-thuong";
import { tranThangCoGhiSo } from "@/lib/ngoi-nha/dau-truong";
import { bangXepHang } from "@/lib/ngoi-nha/tong-hop";
import {
  DAU_CO_QUA,
  laMaThang,
  maThangVN,
  maVinhDanhThang,
  QUA_THANG_TOI_DA_MOI_MUA,
  SO_NGUOI_CO_QUA,
  tenThang,
  thangCuaMua,
  topThang,
} from "@/lib/ngoi-nha/vinh-danh-thang";
import { ngayDep } from "@/lib/ngoi-nha/thoi-gian";
import {
  FormMua,
  NutAnXepHang,
  NutDongMua,
  NutMoMua,
  NutTraoQua,
  SuaCoCauQua,
} from "./NgoiNhaActions";

type NhomTab = "van-hanh" | "cai-dat";

const TAB: { key: string; label: string; nhom: NhomTab }[] = [
  { key: "tong-quan", label: "Tổng quan", nhom: "van-hanh" },
  { key: "nhiem-vu", label: "Duyệt nhiệm vụ", nhom: "van-hanh" },
  { key: "qua", label: "Trao quà & xếp hạng", nhom: "van-hanh" },
  { key: "nguoi-choi", label: "Người chơi", nhom: "van-hanh" },
  { key: "dau-tri", label: "Đấu trí & Đấu trường", nhom: "van-hanh" },
  { key: "thong-ke", label: "Thống kê", nhom: "van-hanh" },
  { key: "mua", label: "Mùa giải & quà", nhom: "cai-dat" },
  { key: "tinh-nang", label: "Bật / tắt tính năng", nhom: "cai-dat" },
  { key: "luat", label: "Luật chơi & điểm", nhom: "cai-dat" },
  { key: "la-bai", label: "Lá bài mỗi ngày", nhom: "cai-dat" },
  { key: "noi-dung", label: "Nội dung", nhom: "cai-dat" },
];

/** Khoá tab cũ (đường dẫn trong tài liệu / thói quen) → tab mới. */
const TAB_CU: Record<string, string> = {
  "cai-dat": "luat",
  "cau-hoi": "thong-ke",
  "chia-se": "thong-ke",
};

const MUC_NOI_DUNG = [
  { key: "the-co-hoi", label: "Thẻ Cơ hội" },
  { key: "nhiem-vu", label: "Nhiệm vụ Huynh đệ" },
  { key: "chia-se", label: "Câu chia sẻ" },
  { key: "bo-cau", label: "Kho bộ câu thách đấu" },
  { key: "huong-dan", label: "Hướng dẫn người mới" },
] as const;

const TRANG_THAI_MUA: Record<string, string> = {
  SAP_MO: "Chưa mở",
  DANG_MO: "Đang mở",
  DA_DONG: "Đã đóng",
};

/** Ngày "yyyy-mm-dd" theo giờ Việt Nam cho ô input date. */
const ngayInput = (d: Date) =>
  new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 10);

export default async function QuanTriNgoiNha({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [sp, user] = await Promise.all([searchParams, requireUserPage()]);
  const quyenVanHanh = co(user, QUYEN.NGOI_NHA_QUAN_LY);
  const quyenCaiDat = co(user, QUYEN.NGOI_NHA_CAI_DAT);
  if (!quyenVanHanh && !quyenCaiDat) redirect("/quan-tri?thieu-quyen=1");
  const chuoiSp = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v : "";
  };

  const tabDuoc = TAB.filter((t) =>
    t.nhom === "van-hanh" ? quyenVanHanh : quyenCaiDat,
  );
  const tabYeuCau = TAB_CU[chuoiSp("tab")] ?? chuoiSp("tab");
  const tab =
    tabDuoc.find((t) => t.key === tabYeuCau)?.key ?? tabDuoc[0]?.key ?? "";
  const mucNoiDung =
    MUC_NOI_DUNG.find((m) => m.key === chuoiSp("muc"))?.key ?? "the-co-hoi";

  const cacMua = await prisma.nnMua.findMany({ orderBy: { batDau: "desc" } });
  const muaDangMo = cacMua.find((m) => m.trangThai === "DANG_MO") ?? null;
  // ?mua=mau: soạn cơ cấu quà mẫu (chơi thử + khuôn cho mùa tạo sau) dù đã có mùa
  const soanMau = sp.mua === "mau";
  const muaXem =
    cacMua.find((m) => m.id === sp.mua) ?? muaDangMo ?? cacMua[0] ?? null;
  const muaId = muaXem?.id ?? CHOI_THU;
  const mua = await muaHienTai();
  const giuaMua = mua.trangThai === "DANG_DIEN_RA";

  const soChoDuyet = quyenVanHanh
    ? await prisma.nnNhiemVu.count({
        where: { trangThai: "CHO_XAC_NHAN", cach: "BAN_DUYET" },
      })
    : 0;

  // Dữ liệu nặng chỉ tải cho tab cần
  const canTienDo = tab === "tong-quan" || tab === "qua";
  const [coCauMauHt, nguoiChoi, tienDo, luotXong, choHoiVien] =
    await Promise.all([
      tab === "mua" || canTienDo ? coCauMau() : Promise.resolve(null),
      canTienDo
        ? prisma.nnTienDo.groupBy({ by: ["userId"], where: { muaId } })
        : Promise.resolve([]),
      canTienDo
        ? prisma.nnTienDo.findMany({
            where: { muaId, daQua: true },
            select: { userId: true, tramMa: true, sao: true },
          })
        : Promise.resolve([]),
      tab === "tong-quan"
        ? prisma.nnLuot.count({ where: { muaId, trangThai: "XONG" } })
        : Promise.resolve(0),
      tab === "tong-quan"
        ? prisma.nnNhiemVu.count({
            where: { trangThai: "CHO_XAC_NHAN", cach: "HOI_VIEN" },
          })
        : Promise.resolve(0),
    ]);
  const coCauXem =
    (muaXem ? docCoCau(muaXem.phanThuong) : null) ??
    coCauMauHt ??
    CO_CAU_MAC_DINH;

  // Tên người chơi cho bảng trao quà
  const users =
    tab === "qua"
      ? await prisma.user.findMany({
          where: { id: { in: nguoiChoi.map((n) => n.userId) } },
          select: {
            id: true,
            name: true,
            member: {
              select: { name: true, company: true, code: true, phone: true },
            },
          },
        })
      : [];
  const tenNguoi = new Map(users.map((u) => [u.id, u]));
  const ten = (id: string) => {
    const u = tenNguoi.get(id);
    if (!u) return "Hội viên";
    return `${u.member?.name ?? u.name}${u.member?.company ? ` – ${tenDoanhNghiep(u.member.company)}` : ""}`;
  };

  const [luatMuc, thongSoMuc, tinhNangMuc] =
    tab === "luat" || tab === "tinh-nang"
      ? await Promise.all([
          docMucDayDu("luat"),
          docMucDayDu("thongSo"),
          docMucDayDu("tinhNang"),
        ])
      : [null, null, null];

  const linkTab = (key: string, them = "") =>
    `/quan-tri/ngoi-nha?tab=${key}${muaXem ? `&mua=${muaXem.id}` : ""}${them}`;

  return (
    <div>
      <PageHeader
        title="Game Ngôi nhà Chợ Lớn"
        subtitle={
          muaXem
            ? `${muaXem.ten} · ${TRANG_THAI_MUA[muaXem.trangThai]} · ${ngayDep(muaXem.batDau)} – ${ngayDep(muaXem.ketThuc)}`
            : "Chưa có mùa giải nào — người chơi đang ở chế độ chơi thử"
        }
        action={
          <Link href="/ngoi-nha" className="btn-ghost">
            Mở game
          </Link>
        }
      />

      <nav className="mb-4 space-y-2" aria-label="Các mục quản trị game">
        {(["van-hanh", "cai-dat"] as const).map((nhom) => {
          const ds = tabDuoc.filter((t) => t.nhom === nhom);
          if (!ds.length) return null;
          return (
            <div key={nhom} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {nhom === "van-hanh" ? "Vận hành" : "Cài đặt"}
              </span>
              <div className="-my-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-1">
                {ds.map((t) => (
                  <Link
                    key={t.key}
                    href={linkTab(t.key)}
                    aria-current={t.key === tab ? "page" : undefined}
                    className={`flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-lg px-3 text-sm font-medium transition ${
                      t.key === tab
                        ? "bg-navy-600 text-white"
                        : "bg-white text-slate-600 ring-1 ring-navy-100 hover:bg-navy-50"
                    }`}
                  >
                    {t.label}
                    {t.key === "nhiem-vu" && soChoDuyet > 0 && (
                      <span className="ml-1.5 rounded-full bg-do-500 px-1.5 text-[11px] font-bold text-white">
                        {soChoDuyet}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {tab === "tong-quan" && (
        <div className="space-y-4">
          <TongQuan
            muaId={muaId}
            soNguoi={nguoiChoi.length}
            soTramQua={tienDo.length}
            soSao={tienDo.reduce((s, t) => s + t.sao, 0)}
            luotXong={luotXong}
            mocDat={await soNguoiDatMoc(muaId, coCauXem.moc, tienDo)}
            choDuyet={soChoDuyet}
            choHoiVien={choHoiVien}
            tienDo={tienDo}
          />
          <NhatKyCaiDat />
        </div>
      )}

      {tab === "nhiem-vu" && <DuyetNhiemVu />}

      {tab === "qua" && (
        <div className="space-y-4">
          <TraoQua
            muaId={muaId}
            muaXem={muaXem}
            tienDo={tienDo}
            ten={ten}
            cacMoc={coCauXem.moc}
          />
          <VinhDanhThang
            muaId={muaId}
            muaXem={muaXem}
            maThang={
              laMaThang(chuoiSp("thang")) ? chuoiSp("thang") : maThangVN()
            }
          />
          <QuaLaBai muaId={muaId} />
        </div>
      )}

      {tab === "nguoi-choi" && (
        <QuanLyNguoiChoi muaId={mua.id} q={chuoiSp("q")} />
      )}

      {tab === "dau-tri" && (
        <div className="space-y-6">
          <QuanTriDauTri />
          <VanHanhDauTruong />
        </div>
      )}

      {tab === "thong-ke" && (
        <div className="space-y-6">
          <ThongKeCauHoi />
          <TongHopChiaSe />
        </div>
      )}

      {tab === "mua" && (
        <div className="space-y-4">
          <TrangThaiMua cacMua={cacMua} />
          {cacMua.length > 0 && (
            <div className="card divide-y divide-slate-100">
              {cacMua.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <div className="font-semibold text-navy-800">
                      {m.ten}{" "}
                      <span
                        className={`ml-1 rounded-full px-2 py-0.5 text-xs ${m.trangThai === "DANG_MO" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {TRANG_THAI_MUA[m.trangThai]}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">
                      {ngayDep(m.batDau)} – {ngayDep(m.ketThuc)}
                      {m.ghiChu ? ` · ${m.ghiChu}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/quan-tri/ngoi-nha?tab=mua&mua=${m.id}`}
                      className="btn-ghost py-1.5"
                    >
                      {m.id === muaXem?.id ? "Đang sửa" : "Sửa"}
                    </Link>
                    {m.trangThai === "SAP_MO" && <NutMoMua id={m.id} />}
                    {m.trangThai === "DANG_MO" && <NutDongMua id={m.id} />}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="card p-4">
            <h2 className="mb-3 font-semibold text-navy-800">
              {muaXem ? `Sửa “${muaXem.ten}”` : "Tạo mùa giải đầu tiên"}
            </h2>
            <FormMua
              key={muaXem?.id ?? "moi"}
              mua={
                muaXem
                  ? {
                      id: muaXem.id,
                      ten: muaXem.ten,
                      batDau: ngayInput(muaXem.batDau),
                      ketThuc: ngayInput(muaXem.ketThuc),
                      ghiChu: muaXem.ghiChu,
                    }
                  : undefined
              }
            />
            <p className="mt-3 text-xs text-slate-500">
              Kịch bản đề xuất Mùa 1 kéo dài 8 tuần. Trước ngày bắt đầu, hội
              viên vẫn vào chơi thử được nhưng không tính điểm; bấm “Mở mùa” là
              tới ngày bắt đầu hệ thống tự tính.
            </p>
          </div>
          {muaXem &&
            !cacMua.some(
              (m) => m.trangThai === "SAP_MO" || m.trangThai === "DANG_MO",
            ) && (
              <div className="card p-4">
                <h2 className="mb-2 font-semibold text-navy-800">
                  Tạo mùa mới
                </h2>
                <FormMua key="moi-them" />
              </div>
            )}
          <div className="card p-4">
            <h2 className="mb-1 font-semibold text-navy-800">
              Phần thưởng: mốc quà &amp; giải xếp hạng
            </h2>
            <p className="mb-3 text-xs text-slate-500">
              {soanMau || !muaXem
                ? `Cơ cấu mẫu — hiện cho người chơi thử và được chép sang mùa tạo sau.`
                : `Chọn mùa ở danh sách trên để soạn cho mùa đó. Hội viên thấy ngay ở trang Phần thưởng trong game.`}{" "}
              {muaXem && (
                <Link
                  href={
                    soanMau
                      ? `/quan-tri/ngoi-nha?tab=mua&mua=${muaXem.id}`
                      : "/quan-tri/ngoi-nha?tab=mua&mua=mau"
                  }
                  className="text-navy-600 underline"
                >
                  {soanMau
                    ? `Quay lại soạn cho “${muaXem.ten}”`
                    : "Soạn cơ cấu mẫu (cho mùa tạo sau)"}
                </Link>
              )}
            </p>
            <SuaCoCauQua
              key={soanMau ? "mau" : (muaXem?.id ?? "mau")}
              muaId={soanMau ? null : (muaXem?.id ?? null)}
              apDung={
                !soanMau && muaXem
                  ? muaXem.ten
                  : "Cơ cấu mẫu (chơi thử + mùa tạo sau)"
              }
              giai={
                soanMau ? (coCauMauHt ?? CO_CAU_MAC_DINH).giai : coCauXem.giai
              }
              moc={soanMau ? (coCauMauHt ?? CO_CAU_MAC_DINH).moc : coCauXem.moc}
              giaiMacDinh={CO_CAU_MAC_DINH.giai}
              mocMacDinh={CO_CAU_MAC_DINH.moc}
            />
          </div>
        </div>
      )}

      {tab === "tinh-nang" && tinhNangMuc && thongSoMuc && (
        <SuaTinhNang tinhNang={tinhNangMuc} thongSo={thongSoMuc} />
      )}

      {tab === "luat" && luatMuc && thongSoMuc && (
        <div className="space-y-6">
          {giuaMua && (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
              <b>{mua.ten} đang diễn ra.</b> Đổi điểm giữa mùa làm người chơi
              trước và sau khác luật — chỉ đổi khi thật cần, và báo cho hội viên
              biết.
            </div>
          )}
          <SuaLuatChoi luat={luatMuc} thongSo={thongSoMuc} giuaMua={giuaMua} />
          <SuaLuatDauTruong
            luat={luatMuc}
            thongSo={thongSoMuc}
            giuaMua={giuaMua}
          />
        </div>
      )}

      {tab === "la-bai" && <QuanTriLaBai muaId={mua.id} />}

      {tab === "noi-dung" && (
        <div className="space-y-4">
          <div className="-my-1 flex gap-1.5 overflow-x-auto py-1">
            {MUC_NOI_DUNG.map((m) => (
              <Link
                key={m.key}
                href={linkTab("noi-dung", `&muc=${m.key}`)}
                aria-current={m.key === mucNoiDung ? "page" : undefined}
                className={`flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-sm ${
                  m.key === mucNoiDung
                    ? "bg-navy-100 font-semibold text-navy-800"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {m.label}
              </Link>
            ))}
          </div>
          {mucNoiDung === "the-co-hoi" && <NoiDungTheCoHoi />}
          {mucNoiDung === "nhiem-vu" && <NoiDungNhiemVu />}
          {mucNoiDung === "chia-se" && <NoiDungChiaSe />}
          {mucNoiDung === "bo-cau" && <NoiDungBoCau q={chuoiSp("q")} />}
          {mucNoiDung === "huong-dan" && <NoiDungHuongDan />}
        </div>
      )}
    </div>
  );
}

/** Câu "chia sẻ về mình" cuối lượt — tổng hợp để Ban Điều hành biết hội viên quan tâm gì. */
async function TongHopChiaSe() {
  const ds = await tongHopChiaSe();
  const tongNguoi = Math.max(...ds.map((c) => c.soNguoi), 0);
  return (
    <div className="space-y-4">
      <div className="card px-4 py-3 text-sm text-slate-600">
        Cuối mỗi lượt chơi, hội viên trả lời một câu về chính mình (không có
        đúng sai). Đây là dữ liệu thật để chọn chủ đề toạ đàm, ghép nhóm, mời
        đúng người — {soDep(tongNguoi)} hội viên đã trả lời ít nhất một câu.
      </div>
      {ds.map((c) => (
        <div key={c.ma} className="card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold text-navy-800">{c.hoi}</h2>
            <span className="text-xs text-slate-500">
              {c.soNguoi} người trả lời
            </span>
          </div>
          {c.soNguoi === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Chưa có ai trả lời.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {c.ketQua.map((k) => {
                const pt = Math.round((100 * k.so) / c.soNguoi);
                return (
                  <li key={k.luaChon} className="text-sm">
                    <div className="flex justify-between gap-2">
                      <span>{k.luaChon}</span>
                      <span className="font-semibold text-navy-700">
                        {pt}%{" "}
                        <span className="font-normal text-slate-400">
                          ({k.so})
                        </span>
                      </span>
                    </div>
                    <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-navy-500"
                        style={{ width: `${pt}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Người đạt từng mốc quà trong một mùa. Trạm / sao tính từ tiến độ đã qua,
 * điểm từ sổ cái mùa đó, trận thắng từ thành tích Đấu trường.
 */
async function nguoiDatMoc(
  muaId: string,
  cacMoc: MocQua[],
  tienDo: { userId: string; tramMa: string; sao: number }[],
): Promise<Map<string, string[]>> {
  const theoNguoi = new Map<string, { tram: Set<string>; sao: number }>();
  for (const t of tienDo) {
    const x = theoNguoi.get(t.userId) ?? { tram: new Set<string>(), sao: 0 };
    x.tram.add(t.tramMa);
    x.sao += t.sao;
    theoNguoi.set(t.userId, x);
  }
  const canDiem = cacMoc.some((m) => m.loai === "DIEM");
  const canTran = cacMoc.some((m) => m.loai === "TRAN_THANG");
  const [diem, tran] = await Promise.all([
    canDiem
      ? prisma.nnSoCai.groupBy({
          by: ["userId"],
          where: { muaId },
          _sum: { diem: true },
        })
      : Promise.resolve([]),
    canTran ? tranThangTheoMua(muaId) : Promise.resolve([]),
  ]);
  const kq = new Map<string, string[]>();
  for (const m of cacMoc) {
    let ds: string[] = [];
    if (m.loai === "CHANG") {
      const can = TRAM.filter((t) => t.changSo === m.nguong).map((t) => t.ma);
      ds = can.length
        ? [...theoNguoi]
            .filter(([, x]) => can.every((ma) => x.tram.has(ma)))
            .map(([u]) => u)
        : [];
    } else if (m.loai === "SO_TRAM")
      ds = [...theoNguoi]
        .filter(([, x]) => x.tram.size >= m.nguong)
        .map(([u]) => u);
    else if (m.loai === "SAO")
      ds = [...theoNguoi].filter(([, x]) => x.sao >= m.nguong).map(([u]) => u);
    else if (m.loai === "DIEM")
      ds = diem
        .filter((d) => (d._sum.diem ?? 0) >= m.nguong)
        .map((d) => d.userId);
    else if (m.loai === "TRAN_THANG")
      ds = tran.filter((t) => t.tranThang >= m.nguong).map((t) => t.userId);
    kq.set(m.ma, ds);
  }
  return kq;
}

/**
 * Trận thắng Đấu trường dùng cho MỐC QUÀ: chỉ tính trận CÓ cộng điểm (nằm
 * trong trần chống cày mỗi ngày) — đúng con số hội viên thấy ở tiến độ mốc.
 * Hai người bắt tay đánh vài chục trận một ngày không đẩy mốc lên được.
 */
async function tranThangTheoMua(
  muaId: string,
): Promise<{ userId: string; tranThang: number }[]> {
  const bang = await tranThangCoGhiSo(muaId);
  return [...bang].map(([userId, tranThang]) => ({ userId, tranThang }));
}

async function soNguoiDatMoc(
  muaId: string,
  cacMoc: MocQua[],
  tienDo: { userId: string; tramMa: string; sao: number }[],
) {
  const dat = await nguoiDatMoc(muaId, cacMoc, tienDo);
  return cacMoc.map((m) => ({ ten: m.ten, so: dat.get(m.ma)?.length ?? 0 }));
}

/** Số ngày từ bây giờ tới một mốc (âm = đã qua). */
function soNgayToi(d: Date): number {
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

function TongQuan(p: {
  muaId: string;
  soNguoi: number;
  soTramQua: number;
  soSao: number;
  luotXong: number;
  mocDat: { ten: string; so: number }[];
  choDuyet: number;
  choHoiVien: number;
  tienDo: { tramMa: string }[];
}) {
  const demTram = new Map<string, number>();
  for (const t of p.tienDo)
    demTram.set(t.tramMa, (demTram.get(t.tramMa) ?? 0) + 1);
  return (
    <div className="space-y-4">
      {p.muaId === CHOI_THU && (
        <div className="card px-4 py-3 text-sm text-amber-800 ring-amber-200">
          Chưa có mùa giải. Vào tab <b>Mùa giải &amp; quà</b> để tạo và mở Mùa 1
          — hội viên đang chơi thử (có điểm để làm quen, nhưng không chuyển sang
          mùa giải).
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <O nhan="Người đã chơi" gia={soDep(p.soNguoi)} />
        <O nhan="Lượt chơi hoàn tất" gia={soDep(p.luotXong)} />
        <O
          nhan="Trạm đã vượt"
          gia={`${soDep(p.soTramQua)} · ${soDep(p.soSao)} sao`}
        />
        <O
          nhan="Đạt mốc quà"
          gia={soDep(p.mocDat[0]?.so ?? 0)}
          goiY={
            p.mocDat.length
              ? p.mocDat.map((m) => `${m.ten}: ${m.so}`).join(" · ")
              : "Chưa đặt mốc quà"
          }
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/quan-tri/ngoi-nha?tab=nhiem-vu"
          className={`card p-4 ${p.choDuyet ? "ring-2 ring-do-200" : ""}`}
        >
          <div className="font-semibold text-navy-800">
            Nhiệm vụ chờ Ban duyệt
          </div>
          <div className="mt-1 text-3xl font-bold text-navy-700">
            {p.choDuyet}
          </div>
          <div className="text-xs text-slate-500">
            {p.choHoiVien} yêu cầu khác đang chờ hội viên liên quan xác nhận
          </div>
        </Link>
        <div className="card p-4">
          <div className="font-semibold text-navy-800">
            Số người đã vượt từng trạm
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
            {TRAM.map((t) => (
              <div key={t.ma} className="flex justify-between gap-2">
                <span className="truncate text-slate-600">
                  {t.ma} {t.ten}
                </span>
                <b className="text-navy-700">{demTram.get(t.ma) ?? 0}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function O({ nhan, gia, goiY }: { nhan: string; gia: string; goiY?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {nhan}
      </div>
      <div className="mt-1 text-2xl font-bold text-navy-700">{gia}</div>
      {goiY && <div className="text-xs text-slate-500">{goiY}</div>}
    </div>
  );
}

async function TraoQua({
  muaId,
  muaXem,
  tienDo,
  ten,
  cacMoc,
}: {
  muaId: string;
  muaXem: { id: string; ten: string; batDau: Date; ketThuc: Date } | null;
  tienDo: { userId: string; tramMa: string; sao: number }[];
  ten: (id: string) => string;
  cacMoc: MocQua[];
}) {
  if (!muaXem)
    return (
      <div className="card px-4 py-10 text-center text-sm text-slate-500">
        Chưa có mùa giải nên chưa có ai đủ điều kiện nhận quà.
      </div>
    );
  const [dat, daTrao, bxh, an] = await Promise.all([
    nguoiDatMoc(muaId, cacMoc, tienDo),
    prisma.nnTraoQua.findMany({ where: { muaId } }),
    bangXepHang(muaId, "mua", undefined, 10),
    prisma.nnNguoiChoi.findMany({
      where: { anXepHang: true },
      select: { userId: true },
    }),
  ]);
  const traoRoi = new Set(daTrao.map((t) => `${t.userId}:${t.loai}`));
  const biAn = new Set(an.map((x) => x.userId));
  const themTen = await prisma.user.findMany({
    where: {
      id: {
        in: [
          ...[...dat.values()].flat(),
          ...bxh.dong.map((d) => d.userId),
          ...biAn,
        ],
      },
    },
    select: {
      id: true,
      name: true,
      member: { select: { name: true, company: true, phone: true } },
    },
  });
  const chiTiet = new Map(themTen.map((u) => [u.id, u]));
  const tenDay = (id: string) => {
    const u = chiTiet.get(id);
    if (!u) return ten(id);
    return `${u.member?.name ?? u.name}${u.member?.company ? ` – ${tenDoanhNghiep(u.member.company)}` : ""}${u.member?.phone ? ` · ${u.member.phone}` : ""}`;
  };
  return (
    <div className="space-y-4">
      {cacMoc.length === 0 && (
        <div className="card px-4 py-3 text-sm text-slate-600">
          Mùa này chưa có mốc quà. Thêm ở tab{" "}
          <Link
            href="/quan-tri/ngoi-nha?tab=mua"
            className="text-navy-600 underline"
          >
            Mùa giải &amp; quà
          </Link>
          .
        </div>
      )}
      {cacMoc.map((m) => {
        const ds = dat.get(m.ma) ?? [];
        return (
          <div key={m.ma} className="card p-4">
            <h2 className="font-semibold text-navy-800">
              {m.ten} ({ds.length})
            </h2>
            <p className="text-xs text-slate-500">
              {m.qua}
              {m.nhaDongHanh ? ` · đồng hành: ${m.nhaDongHanh}` : ""} · Ghi “đã
              trao” sau khi đưa quà để người chơi thấy trạng thái và khỏi trao
              trùng.
            </p>
            <ul className="mt-2 divide-y divide-slate-100">
              {ds.length === 0 && (
                <li className="py-3 text-sm text-slate-500">
                  Chưa có ai đạt mốc này.
                </li>
              )}
              {ds.map((id) => (
                <li
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                >
                  <span>{tenDay(id)}</span>
                  <NutTraoQua
                    userId={id}
                    muaId={muaId}
                    loai={m.ma}
                    daTrao={traoRoi.has(`${id}:${m.ma}`)}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <div className="card p-4">
        <h2 className="font-semibold text-navy-800">Top 10 mùa giải</h2>
        <p className="text-xs text-slate-500">
          Thành viên Ban soạn đề / Ban vận hành: bấm “Ẩn khỏi BXH” — vẫn chơi,
          vẫn nhận quà mốc, không nhận giải.
        </p>
        <ol className="mt-2 divide-y divide-slate-100">
          {bxh.dong.map((d) => (
            <li
              key={d.userId}
              className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
            >
              <span>
                <b className="mr-2 text-navy-700">{d.hang}.</b>
                {tenDay(d.userId)} · <b>{soDep(d.giaTri)}</b> điểm
              </span>
              <span className="flex items-center gap-2">
                <NutTraoQua
                  userId={d.userId}
                  muaId={muaId}
                  loai={MA_GIAI}
                  daTrao={traoRoi.has(`${d.userId}:${MA_GIAI}`)}
                />
                <NutAnXepHang userId={d.userId} dangAn={false} />
              </span>
            </li>
          ))}
          {bxh.dong.length === 0 && (
            <li className="py-3 text-sm text-slate-500">
              Chưa ai có điểm mùa này.
            </li>
          )}
        </ol>
        {biAn.size > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Đang ẩn khỏi bảng xếp hạng
            </div>
            <ul className="mt-1 space-y-1">
              {[...biAn].map((id) => (
                <li
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <span>{tenDay(id)}</span>
                  <NutAnXepHang userId={id} dangAn />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Vinh danh top 10 THEO THÁNG (anh Khang chốt 20/09/2026). Điểm tính riêng từng
 * tháng, không cộng dồn — hội viên biết game muộn vẫn còn cửa. Hạng 1–3 kèm quà
 * nhỏ, hạng 4–10 gọi tên tại buổi sinh hoạt; ghi nhận bằng mã VD_<yyyymm> nên
 * không lẫn với giải cuối mùa.
 */
async function VinhDanhThang({
  muaId,
  muaXem,
  maThang,
}: {
  muaId: string;
  muaXem: { id: string; ten: string; batDau: Date; ketThuc: Date } | null;
  maThang: string;
}) {
  const cacThang = muaXem ? thangCuaMua(muaXem) : [maThangVN()];
  const thangXem = cacThang.includes(maThang)
    ? maThang
    : (cacThang.find((t) => t >= maThangVN()) ?? cacThang[cacThang.length - 1]);
  const ds = await topThang(muaId, thangXem, 10);
  const loai = maVinhDanhThang(thangXem);
  return (
    <div className="card p-4">
      <h2 className="font-semibold text-navy-800">
        Vinh danh {tenThang(thangXem)} — top 10
      </h2>
      <p className="text-xs text-slate-500">
        Điểm tính RIÊNG trong tháng này (không cộng dồn cả mùa) để hội viên vào
        sau vẫn có cửa. {SO_NGUOI_CO_QUA} người đầu bảng kèm quà nhỏ, những
        người còn lại gọi tên tại buổi sinh hoạt. Mỗi hội viên nhận quà tháng
        tối đa {QUA_THANG_TOI_DA_MOI_MUA} lần một mùa — đủ số thì vẫn vinh danh
        nhưng suất quà nhường người kế tiếp. Giải cuối mùa vẫn tính điểm cả mùa
        ở bảng dưới.
      </p>
      {!muaXem && (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
          Chưa có mùa giải — bảng dưới là điểm chơi thử, xem trước cho quen. Ghi
          vinh danh được sau khi mở mùa.
        </p>
      )}
      {cacThang.length > 1 && muaXem && (
        <div className="-my-1 mt-2 flex gap-1.5 overflow-x-auto py-1">
          {cacThang.map((t) => (
            <Link
              key={t}
              href={`/quan-tri/ngoi-nha?tab=qua&mua=${muaXem.id}&thang=${t}`}
              aria-current={t === thangXem ? "page" : undefined}
              className={`flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-sm ${
                t === thangXem
                  ? "bg-navy-100 font-semibold text-navy-800"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {tenThang(t)}
            </Link>
          ))}
        </div>
      )}
      <ol className="mt-2 divide-y divide-slate-100">
        {ds.map((d) => (
          <li
            key={d.userId}
            className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
          >
            <span>
              <b className="mr-2 text-navy-700">{d.hang}.</b>
              {d.ten}
              {d.congTy ? ` – ${d.congTy}` : ""}
              {d.dienThoai ? ` · ${d.dienThoai}` : ""} · <b>{soDep(d.diem)}</b>{" "}
              điểm
              {d.nhanQua && (
                <span className="ml-2 rounded-full bg-vang-400/20 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  có quà
                </span>
              )}
              {d.nhuongQua && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  đã nhận quà {d.soLanNhanQua} lần — nhường suất
                </span>
              )}
            </span>
            {muaXem && (
              <NutTraoQua
                userId={d.userId}
                muaId={muaId}
                loai={loai}
                daTrao={d.daVinhDanh}
                ghiChu={`Hạng ${d.hang}${d.nhanQua ? ` · ${DAU_CO_QUA}` : ""}`}
                chu={d.nhanQua ? "Ghi vinh danh + quà" : "Ghi vinh danh"}
                chuXong="Đã vinh danh"
              />
            )}
          </li>
        ))}
        {ds.length === 0 && (
          <li className="py-3 text-sm text-slate-500">
            Chưa ai có điểm trong {tenThang(thangXem)}.
          </li>
        )}
      </ol>
    </div>
  );
}

async function ThongKeCauHoi() {
  // Prisma không SUM được cột boolean → đếm tổng và đếm riêng số lần đúng
  const [tong, dung] = await Promise.all([
    prisma.nnTraLoi.groupBy({ by: ["cauId"], _count: { _all: true } }),
    prisma.nnTraLoi.groupBy({
      by: ["cauId"],
      where: { dung: true },
      _count: { _all: true },
    }),
  ]);
  const soDung = new Map(dung.map((d) => [d.cauId, d._count._all]));
  const ds = tong
    .map((x) => ({
      id: x.cauId,
      tong: x._count._all,
      dung: soDung.get(x.cauId) ?? 0,
    }))
    .filter((x) => CAU_THEO_ID[x.id])
    .map((x) => ({
      ...x,
      tiLe: x.tong ? Math.round((100 * x.dung) / x.tong) : 0,
    }));
  const tongTraLoi = ds.reduce((s, x) => s + x.tong, 0);
  const kho = [...ds]
    .filter((x) => x.tong >= 5)
    .sort((a, b) => a.tiLe - b.tiLe)
    .slice(0, 15);
  const de = [...ds]
    .filter((x) => x.tong >= 5)
    .sort((a, b) => b.tiLe - a.tiLe)
    .slice(0, 10);
  return (
    <div className="space-y-4">
      <div className="card px-4 py-3 text-sm text-slate-600">
        {soDep(tongTraLoi)} lượt trả lời trên {ds.length}/220 câu. Ngân hàng câu
        hỏi nằm trong mã nguồn (<code>src/lib/ngoi-nha/noi-dung/</code>) — sửa
        câu là sửa ở file Excel duyệt rồi nhờ cập nhật, không sửa trực tiếp ở
        đây.
      </div>
      <BangCau
        tieuDe="Câu khó nhất"
        rows={kho}
        goiY="Tỉ lệ đúng thấp — cân nhắc viết lại cho rõ hoặc bổ sung giải thích."
      />
      <BangCau
        tieuDe="Câu dễ nhất"
        rows={de}
        goiY="Gần như ai cũng đúng — có thể nâng độ khó ở mùa sau."
      />
    </div>
  );
}

function BangCau({
  tieuDe,
  rows,
  goiY,
}: {
  tieuDe: string;
  rows: { id: string; tong: number; dung: number; tiLe: number }[];
  goiY: string;
}) {
  return (
    <div className="card p-4">
      <h2 className="font-semibold text-navy-800">{tieuDe}</h2>
      <p className="text-xs text-slate-500">{goiY}</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          Chưa đủ dữ liệu (cần từ 5 lượt trả lời mỗi câu).
        </p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="py-1 pr-2">Mã</th>
                <th className="py-1 pr-2">Câu hỏi</th>
                <th className="py-1 pr-2">Dạng</th>
                <th className="py-1 pr-2 text-right">Đúng</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const c = CAU_THEO_ID[r.id];
                return (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="py-1.5 pr-2 font-mono text-xs text-slate-500">
                      {r.id}
                    </td>
                    <td className="py-1.5 pr-2">
                      {c.q}
                      <div className="text-xs text-slate-400">
                        Trạm {TRAM_THEO_MA[r.id.slice(0, 3)]?.ten}
                      </div>
                    </td>
                    <td className="py-1.5 pr-2 text-xs text-slate-500">
                      {LOAI_CAU[c.t].ten}
                    </td>
                    <td className="py-1.5 text-right font-semibold text-navy-700">
                      {r.tiLe}%{" "}
                      <span className="text-xs font-normal text-slate-400">
                        /{r.tong}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Hộp hướng dẫn đầu tab Mùa giải: đang ở bước nào, làm gì tiếp. */
function TrangThaiMua({
  cacMua,
}: {
  cacMua: {
    id: string;
    ten: string;
    batDau: Date;
    ketThuc: Date;
    trangThai: string;
  }[];
}) {
  const dangMo = cacMua.find((m) => m.trangThai === "DANG_MO");
  const sapMo = cacMua
    .filter((m) => m.trangThai === "SAP_MO")
    .sort((a, b) => a.batDau.getTime() - b.batDau.getTime())[0];
  let mau = "bg-amber-50 text-amber-900 ring-amber-200";
  let noiDung: React.ReactNode;
  if (dangMo) {
    const toiBatDau = soNgayToi(dangMo.batDau);
    const toiKetThuc = soNgayToi(dangMo.ketThuc);
    mau = "bg-emerald-50 text-emerald-900 ring-emerald-200";
    noiDung =
      toiBatDau > 0 ? (
        <>
          <b>“{dangMo.ten}” đã mở</b> — hệ thống bắt đầu tính điểm từ{" "}
          <b>{ngayDep(dangMo.batDau)}</b> (còn {toiBatDau} ngày). Trước ngày đó
          hội viên vẫn chơi thử.
        </>
      ) : toiKetThuc >= 0 ? (
        <>
          <b>“{dangMo.ten}” đang diễn ra</b> tới {ngayDep(dangMo.ketThuc)} (còn{" "}
          {toiKetThuc} ngày).
        </>
      ) : (
        <>
          <b>“{dangMo.ten}” đã quá ngày kết thúc</b> ({ngayDep(dangMo.ketThuc)})
          — không cộng điểm nữa. Trao quà xong thì bấm “Đóng mùa”.
        </>
      );
  } else if (sapMo) {
    noiDung = (
      <>
        <b>“{sapMo.ten}” đã tạo nhưng CHƯA mở</b> — dự kiến{" "}
        {ngayDep(sapMo.batDau)} – {ngayDep(sapMo.ketThuc)}. Hội viên đã thấy
        lịch này trong game. Soát phần thưởng bên dưới rồi bấm <b>“Mở mùa”</b>.
      </>
    );
  } else {
    noiDung = (
      <>
        <b>Chưa có mùa giải — hội viên đang chơi thử.</b> Làm 3 bước: ① Tạo mùa
        (tên + ngày bắt đầu, kết thúc) ở form bên dưới · ② Soạn mốc quà &amp;
        giải xếp hạng · ③ Bấm <b>“Mở mùa”</b>.
      </>
    );
  }
  return (
    <div className={`rounded-xl px-4 py-3 text-sm ring-1 ${mau}`}>
      {noiDung}
      <div className="mt-1 text-xs opacity-80">
        Mở mùa là mọi người bắt đầu lại từ 0 điểm — điểm chơi thử không chuyển
        sang. Nên mở TRƯỚC buổi phát động, đừng mở giữa buổi.
      </div>
    </div>
  );
}
