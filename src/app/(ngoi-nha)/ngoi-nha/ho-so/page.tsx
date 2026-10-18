import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  HUY_HIEU,
  MA_VON,
  VON,
  chuCaiTen,
  soDep,
  type HuyHieu,
} from "@/lib/ngoi-nha/luat";
import { docMuc, docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import {
  danhHieuTheoLuat,
  type LuatChoi,
} from "@/lib/ngoi-nha/cai-dat/luat-choi";
import { laNguoiVanHanh } from "@/lib/ngoi-nha/chay-action";
import { muaHienTai } from "@/lib/ngoi-nha/mua";
import { CHANG } from "@/lib/ngoi-nha/noi-dung";
import { bangXepHang, hoSoNguoiChoi } from "@/lib/ngoi-nha/tong-hop";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import BieuTuong from "@/components/ngoi-nha/BieuTuong";
import KimCuong4V from "@/components/ngoi-nha/KimCuong4V";

export const metadata = { title: "Hồ sơ 4V · Ngôi nhà Chợ Lớn" };

/** Điều kiện huy hiệu có số Ban Điều hành chỉnh được thì đọc số theo luật. */
function dieuKienHuyHieu(h: HuyHieu, luat: LuatChoi): string {
  switch (h.ma) {
    case "CHUYEN_CAN":
      return `Thử thách hằng ngày ${luat.thuThachNgay.ngayChuyenCan} ngày liên tiếp`;
    case "NGUOI_BAC_CAU":
      return `Hoàn thành nhiệm vụ “Người bắc cầu” ${luat.nguoiBacCauSoLan} lần`;
    case "CAN_BANG":
      return `Cả 4 loại vốn đạt từ ${luat.von.nguongCanBang}`;
    default:
      return h.dieuKien;
  }
}

export default async function TrangHoSo() {
  const user = await requireUserPage();
  const [tinhNang, luat] = await Promise.all([docTinhNang(), docMuc("luat")]);
  // Layout đang hiện màn bảo trì — không cần tải hồ sơ
  if (tinhNang.tamDung && !laNguoiVanHanh(user)) return null;

  const nguoi = { userId: user.id, memberId: user.memberId };
  const mua = await muaHienTai();
  const [hs, bxh, hoiVien] = await Promise.all([
    hoSoNguoiChoi(nguoi, mua),
    bangXepHang(mua.id, "mua", user.id, 1),
    user.memberId
      ? prisma.member.findUnique({
          where: { id: user.memberId },
          select: { name: true, company: true, avatar: true },
        })
      : null,
  ]);
  const coHuyHieu = new Set(hs.huyHieu);
  const tramTheoMa = new Map(hs.tram.map((t) => [t.ma, t]));
  const ten = hoiVien?.name ?? user.name;
  const nguong = luat.von.nguongCanBang;
  const dh = danhHieuTheoLuat(luat, hs.diem, hs.ngonLua);
  const cacDanhHieu = [
    ...luat.danhHieu.map((d, i) => ({ bac: i + 1, ...d, ngonLua: false })),
    {
      bac: 6,
      ten: luat.ngonLua.ten,
      y: luat.ngonLua.y,
      tuDiem: Infinity,
      ngonLua: true,
    },
  ];
  const canBang = luat.huyHieu.CAN_BANG;
  // Huy hiệu Ban đang tắt: người đã có vẫn thấy (ghi "tạm tắt"), người chưa có thì ẩn
  const dsHuyHieu = HUY_HIEU.filter(
    (h) => luat.huyHieu[h.ma]?.bat !== false || coHuyHieu.has(h.ma),
  );
  const soCo = dsHuyHieu.filter((h) => coHuyHieu.has(h.ma)).length;

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 pt-4">
      <section className="nn-kinh flex items-center gap-4 rounded-3xl p-5">
        <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-son-600 text-2xl font-bold ring-2 ring-white/70">
          {hoiVien?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hoiVien.avatar}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            chuCaiTen(ten)
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="line-clamp-2 text-xl leading-tight">{ten}</h1>
          {hoiVien?.company && (
            <div className="truncate text-sm text-white/65">
              {tenDoanhNghiep(hoiVien.company)}
            </div>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-son-600 px-2 py-0.5 font-bold">
              {dh.hienTai.ten}
            </span>
            {bxh.cuaToi && (
              <span className="text-white/70">
                Hạng {bxh.cuaToi.hang}/{bxh.tong} mùa này
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="nn-so text-3xl font-black">{soDep(hs.diem)}</div>
          <div className="text-[11px] uppercase tracking-wide text-white/60">
            Điểm Vươn tầm
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl bg-white p-5 text-navy-900 sm:grid-cols-[260px_1fr] sm:items-center">
        <div className="mx-auto">
          <KimCuong4V von={hs.von} nguong={nguong} />
        </div>
        <div>
          <h2 className="text-2xl">Chân dung 4V</h2>
          <p className="mt-1 text-sm text-slate-600">
            Mọi chương trình của Chi hội đều nhằm làm dày thêm một trong bốn
            nguồn vốn. Vòng nét đứt là mốc {nguong}
            {canBang?.bat ? (
              <>
                {" "}
                — đủ cả bốn vốn là nhận huy hiệu <b>Doanh nhân cân bằng</b> (+
                {soDep(canBang.diem)} điểm).
              </>
            ) : (
              <> — đủ cả bốn vốn là một doanh nhân cân bằng.</>
            )}
          </p>
          <div className="mt-3 space-y-2">
            {MA_VON.map((k) => (
              <div key={k}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{VON[k].ten}</span>
                  <span className="nn-so">
                    {hs.von[k]}/{nguong}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (Math.max(0, hs.von[k]) / Math.max(1, nguong)) * 100)}%`,
                      background: VON[k].mau,
                    }}
                  />
                </div>
                <div className="mt-0.5 text-xs text-slate-500">{VON[k].y}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 text-navy-900">
        <h2 className="text-2xl">Danh hiệu</h2>
        <ol className="mt-3 space-y-2">
          {cacDanhHieu.map((d) => {
            const dat = d.bac <= dh.hienTai.bac;
            const laHienTai = d.bac === dh.hienTai.bac;
            return (
              <li
                key={d.bac}
                className={`flex items-center gap-3 rounded-2xl p-3 ${laHienTai ? "bg-son-50 ring-2 ring-son-500" : dat ? "bg-navy-50" : "bg-slate-50"}`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${dat ? "bg-son-600 text-white" : "bg-slate-200 text-slate-500"}`}
                >
                  {d.bac}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={`font-bold ${dat ? "" : "text-slate-500"}`}>
                    {d.ten}
                  </div>
                  <div className="text-xs text-slate-500">{d.y}</div>
                </div>
                <div className="max-w-[40%] text-right text-xs text-slate-500">
                  {d.ngonLua
                    ? `${luat.ngonLua.soTram} trạm · ${luat.ngonLua.soSao} sao · cân bằng 4V`
                    : `${soDep(d.tuDiem)} điểm`}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="rounded-3xl bg-white p-5 text-navy-900">
        <h2 className="text-2xl">Huy hiệu</h2>
        <p className="text-sm text-slate-500">
          Đã có {soCo}/{dsHuyHieu.length}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {dsHuyHieu.map((h) => {
            const co = coHuyHieu.has(h.ma);
            const luatHh = luat.huyHieu[h.ma];
            const dangTat = luatHh?.bat === false;
            return (
              <div
                key={h.ma}
                className={`rounded-2xl p-3 ${co ? "bg-vang-400/15 ring-1 ring-vang-400" : "bg-slate-50"}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-black ${co ? "bg-vang-500 text-navy-900" : "bg-slate-200 text-slate-400"}`}
                  >
                    {co ? (
                      h.kyHieu
                    ) : (
                      <BieuTuong ten="khoa" className="h-4 w-4" />
                    )}
                  </span>
                  <div
                    className={`min-w-0 text-sm font-bold leading-tight ${co ? "" : "text-slate-500"}`}
                  >
                    {h.ten}
                  </div>
                </div>
                <div className="mt-1.5 text-xs text-slate-500">
                  {dieuKienHuyHieu(h, luat)}
                </div>
                <div className="mt-1 text-xs font-semibold text-navy-600">
                  {dangTat
                    ? "Ban Điều hành đang tạm tắt"
                    : `+${soDep(luatHh?.diem ?? h.diem)} điểm`}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Ban tắt Lá bài thì vẫn giữ lối vào: danh ngôn đã lật là của người chơi */}
      <Link
        href="/ngoi-nha/la-bai"
        className="nn-kinh flex min-h-11 items-center gap-3 rounded-3xl p-4 hover:bg-white/10"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-vang-500 text-navy-900">
          <BieuTuong ten="sach" className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">Bộ sưu tập lá bài</span>
          <span className="block text-sm text-white/70">
            Danh ngôn, lời nhắn và quà đã lật mỗi ngày
          </span>
        </span>
        <BieuTuong ten="mui-ten" className="h-5 w-5 shrink-0" />
      </Link>

      <section className="rounded-3xl bg-white p-5 text-navy-900">
        <h2 className="text-2xl">Bộ sưu tập thẻ</h2>
        <p className="text-sm text-slate-500">
          Đã mở {hs.soTramQua}/{hs.tongTram} thẻ — mỗi trạm vượt qua mở một thẻ
          kiến thức
        </p>
        <div className="mt-3 space-y-4">
          {CHANG.map((c) => (
            <div key={c.so}>
              <div className="text-xs font-bold uppercase tracking-wide text-son-700">
                Chặng {c.so} · {c.ten} — {c.tieuDe}
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {c.tram.map((t) => {
                  const mo = tramTheoMa.get(t.ma)?.daQua;
                  return (
                    <div
                      key={t.ma}
                      className={`rounded-2xl p-3 ${mo ? "bg-gradient-to-br from-navy-700 to-navy-900 text-white" : "border-2 border-dashed border-slate-200 text-slate-400"}`}
                    >
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <BieuTuong
                          ten={mo ? "the" : "khoa"}
                          className={`h-4 w-4 ${mo ? "text-vang-400" : ""}`}
                        />
                        {mo ? t.the.ten : `Trạm ${t.ma}`}
                      </div>
                      <p
                        className={`mt-1 text-xs ${mo ? "text-white/85" : ""}`}
                      >
                        {mo
                          ? t.the.noiDung
                          : `Vượt trạm “${t.ten}” để mở thẻ này`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
