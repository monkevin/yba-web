import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { VON, chuCaiTen, soDep, type MaVon } from "@/lib/ngoi-nha/luat";
import { docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import { laNguoiVanHanh } from "@/lib/ngoi-nha/chay-action";
import { coCauHienTai, muaHienTai } from "@/lib/ngoi-nha/mua";
import {
  bangXepHang,
  type DongXepHang,
  type TieuChiXepHang,
} from "@/lib/ngoi-nha/tong-hop";
import BieuTuong from "@/components/ngoi-nha/BieuTuong";

export const metadata = { title: "Bảng xếp hạng · Ngôi nhà Chợ Lớn" };

/**
 * Mô tả tab không ghi cứng tên giải: giải do Ban Điều hành soạn ở quản trị, tên
 * giải của tab vốn (nếu có) tra từ cơ cấu quà đang áp dụng.
 */
const BANG: { ma: TieuChiXepHang; ten: string; mo: string }[] = [
  { ma: "mua", ten: "Mùa giải", mo: "Điểm Vươn tầm cả mùa" },
  { ma: "tuan", ten: "Tuần này", mo: "Điểm kiếm được từ thứ Hai đến Chủ nhật" },
  {
    ma: "thang",
    ten: "Tháng này",
    mo: "Điểm kiếm được trong tháng — top 10 được vinh danh ở buổi sinh hoạt",
  },
  { ma: "XH", ten: "Vốn xã hội", mo: "Tổng vốn xã hội tích lũy cả mùa" },
  { ma: "TT", ten: "Vốn tri thức", mo: "Tổng vốn tri thức tích lũy cả mùa" },
  { ma: "CN", ten: "Vốn cá nhân", mo: "Tổng vốn cá nhân tích lũy cả mùa" },
  { ma: "TS", ten: "Vốn tài sản", mo: "Tổng vốn tài sản tích lũy cả mùa" },
];

const laVon = (ma: TieuChiXepHang): ma is MaVon => ma.length === 2;

const thuong = (s: string) => s.normalize("NFC").toLowerCase();

export default async function TrangXepHang({
  searchParams,
}: {
  searchParams: Promise<{ bang?: string }>;
}) {
  const [sp, user, tinhNang] = await Promise.all([
    searchParams,
    requireUserPage(),
    docTinhNang(),
  ]);
  // Layout đang hiện màn bảo trì — không cần tính bảng
  if (tinhNang.tamDung && !laNguoiVanHanh(user)) return null;

  // Tab Ban Điều hành đang tắt thì bỏ khỏi dải tab; ai mở link cũ về tab mùa
  const dsBang = BANG.filter((b) =>
    b.ma === "tuan" || b.ma === "thang"
      ? tinhNang.bxhTuan
      : laVon(b.ma)
        ? tinhNang.bxhVon
        : true,
  );
  const bang = dsBang.find((b) => b.ma === sp.bang) ?? dsBang[0];
  const coThach = tinhNang.nutThach && tinhNang.dauTruong;
  const mua = await muaHienTai();
  const [kq, coCau] = await Promise.all([
    bangXepHang(mua.id, bang.ma, user.id, 50),
    laVon(bang.ma) ? coCauHienTai() : Promise.resolve(null),
  ]);
  const giaiVon = laVon(bang.ma)
    ? coCau?.coCau.giai.find((g) =>
        thuong(`${g.hangMuc} ${g.dieuKien}`).includes(
          thuong(VON[bang.ma as MaVon].ten),
        ),
      )
    : undefined;
  const moTa = giaiVon ? `${bang.mo} · giải “${giaiVon.hangMuc}”` : bang.mo;
  const donVi = laVon(bang.ma) ? "vốn" : "điểm";
  const top3 = kq.dong.slice(0, 3);
  const conLai = kq.dong.slice(3);
  const khoangCach =
    kq.cuaToi && kq.nguoiTren
      ? kq.nguoiTren.giaTri - kq.cuaToi.giaTri + 1
      : null;

  return (
    <main className="mx-auto max-w-2xl px-4 pt-4">
      <h1 className="text-3xl">Bảng xếp hạng</h1>
      <p className="mt-1 text-sm text-white/65">
        {mua.id === "CHOI_THU"
          ? `Bảng chơi thử · ${moTa} — sẽ làm lại từ đầu khi Ban Điều hành mở mùa giải chính thức`
          : `${mua.ten} · ${moTa}`}
      </p>

      {dsBang.length > 1 && (
        <div className="-mx-4 mt-4 overflow-x-auto px-4">
          <div className="flex w-max gap-2">
            {dsBang.map((b) => (
              <Link
                key={b.ma}
                href={`/ngoi-nha/xep-hang?bang=${b.ma}`}
                aria-current={b.ma === bang.ma ? "page" : undefined}
                className={`flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-semibold ${
                  b.ma === bang.ma
                    ? "bg-white text-navy-900"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                }`}
              >
                {b.ma.length === 2 && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: VON[b.ma as MaVon].mau }}
                  />
                )}
                {b.ten}
              </Link>
            ))}
          </div>
        </div>
      )}

      {kq.cuaToi && (
        <div className="mt-4 rounded-2xl bg-son-600 p-3 text-sm">
          Bạn đang hạng <b className="text-lg">{kq.cuaToi.hang}</b>/{kq.tong}{" "}
          với {soDep(kq.cuaToi.giaTri)} {donVi}
          {khoangCach && kq.nguoiTren && (
            <>
              {" "}
              · còn <b>{soDep(khoangCach)}</b> {donVi} để vượt{" "}
              {kq.nguoiTren.ten}
            </>
          )}
        </div>
      )}

      {top3.length > 0 ? (
        <div className="mt-6 grid grid-cols-3 items-end gap-2">
          {[top3[1], top3[0], top3[2]].map((d, i) =>
            d ? (
              <BucVinhDanh
                key={d.userId}
                d={d}
                cao={i === 1 ? "h-28" : i === 0 ? "h-20" : "h-14"}
                donVi={donVi}
                thach={coThach}
              />
            ) : (
              <div key={i} />
            ),
          )}
        </div>
      ) : (
        <div className="nn-kinh mt-6 rounded-3xl p-8 text-center text-white/70">
          <BieuTuong ten="cup" className="mx-auto h-10 w-10 text-vang-400" />
          <p className="mt-2">Chưa có ai trên bảng này.</p>
          <Link
            href="/ngoi-nha"
            className="mt-3 inline-flex min-h-11 items-center rounded-full bg-son-600 px-5 font-bold text-white"
          >
            Vào chơi ngay
          </Link>
        </div>
      )}

      {conLai.length > 0 && (
        <ol className="mt-4 overflow-hidden rounded-3xl bg-white text-navy-900">
          {conLai.map((d) => (
            <DongBang key={d.userId} d={d} donVi={donVi} thach={coThach} />
          ))}
        </ol>
      )}
      {kq.cuaToi && kq.cuaToi.hang > kq.dong.length && (
        <ol className="mt-3 overflow-hidden rounded-3xl bg-white text-navy-900">
          <DongBang d={kq.cuaToi} donVi={donVi} thach={coThach} />
        </ol>
      )}
      <p className="mt-4 text-center text-xs text-white/50">
        Bằng điểm: người chạm mốc sớm hơn xếp trên.
      </p>
    </main>
  );
}

/** Nút thách đấu người trên bảng — mở Đấu trường với đối thủ chọn sẵn. */
function NutThach({
  userId,
  ten,
  sang,
}: {
  userId: string;
  ten: string;
  sang?: boolean;
}) {
  return (
    <Link
      href={`/ngoi-nha/dau-truong?doiThu=${userId}#thach`}
      aria-label={`Thách đấu ${ten}`}
      className={`inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center gap-1 rounded-full text-xs font-bold ${
        sang
          ? "mt-1.5 bg-white/15 px-3 text-white hover:bg-white/25"
          : "bg-son-600 px-2.5 text-white hover:bg-son-700 sm:px-3"
      }`}
    >
      <BieuTuong ten="tia" dac className="h-3.5 w-3.5" />
      <span className={sang ? "" : "hidden sm:inline"}>Thách</span>
    </Link>
  );
}

function AnhDaiDien({ d, co }: { d: DongXepHang; co: string }) {
  const chu = chuCaiTen(d.ten);
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-navy-600 font-bold text-white ${co}`}
    >
      {d.anh ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={d.anh} alt="" className="h-full w-full object-cover" />
      ) : (
        chu
      )}
    </span>
  );
}

function BucVinhDanh({
  d,
  cao,
  donVi,
  thach,
}: {
  d: DongXepHang;
  cao: string;
  donVi: string;
  thach: boolean;
}) {
  const nhat = d.hang === 1;
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        <AnhDaiDien
          d={d}
          co={`${nhat ? "h-20 w-20 text-2xl ring-4 ring-vang-400" : "h-14 w-14 text-lg ring-2 ring-white/60"}`}
        />
        {nhat && (
          <BieuTuong
            ten="cup"
            dac
            className="absolute -top-5 left-1/2 h-7 w-7 -translate-x-1/2 text-vang-400"
          />
        )}
      </div>
      <div
        className={`mt-2 line-clamp-2 text-sm font-bold ${d.laToi ? "text-vang-400" : ""}`}
      >
        {d.ten}
      </div>
      {d.congTy && (
        <div className="line-clamp-1 text-[11px] text-white/55">{d.congTy}</div>
      )}
      <div className="nn-so mt-1 text-sm font-black">
        {soDep(d.giaTri)}{" "}
        <span className="text-[11px] font-normal text-white/60">{donVi}</span>
      </div>
      {thach && !d.laToi && <NutThach userId={d.userId} ten={d.ten} sang />}
      <div
        className={`mt-2 grid w-full place-items-center rounded-t-2xl text-3xl font-black ${cao} ${
          nhat
            ? "bg-gradient-to-b from-vang-400 to-vang-600 text-navy-900"
            : "bg-white/15 text-white"
        }`}
      >
        {d.hang}
      </div>
    </div>
  );
}

function DongBang({
  d,
  donVi,
  thach,
}: {
  d: DongXepHang;
  donVi: string;
  thach: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 ${d.laToi ? "bg-son-50" : ""}`}
    >
      <span className="nn-so w-7 text-center font-bold text-slate-500">
        {d.hang}
      </span>
      <AnhDaiDien d={d} co="h-10 w-10 text-sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">
          {d.ten}
          {d.laToi && (
            <span className="ml-1 text-xs font-bold text-son-600">(bạn)</span>
          )}
        </span>
        {d.congTy && (
          <span className="block truncate text-xs text-slate-500">
            {d.congTy}
          </span>
        )}
      </span>
      <span className="nn-so text-right font-bold">
        {soDep(d.giaTri)}{" "}
        <span className="text-xs font-normal text-slate-500">{donVi}</span>
      </span>
      {thach && !d.laToi && <NutThach userId={d.userId} ten={d.ten} />}
    </li>
  );
}
