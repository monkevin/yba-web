import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import { laNguoiVanHanh } from "@/lib/ngoi-nha/chay-action";
import { lichSuLaBai, type LaDaLat } from "@/lib/ngoi-nha/la-bai";
import {
  BIEU_TUONG_LA,
  CAC_LOAI_LA,
  ngayLaDep,
  TEN_LOAI_LA,
  type LoaiLa,
} from "@/lib/ngoi-nha/la-bai-luat";
import BieuTuong from "@/components/ngoi-nha/BieuTuong";

export const metadata = { title: "Bộ sưu tập lá bài · Ngôi nhà Chợ Lớn" };

const laLoai = (x: string | undefined): x is LoaiLa =>
  !!x && (CAC_LOAI_LA as string[]).includes(x);

const so = (n: number) => Math.round(n).toLocaleString("vi-VN");

/**
 * Bộ sưu tập lá bài: danh ngôn đã sưu tầm, chuỗi ngày, lịch sử các lá đã lật
 * (tra nội dung theo mã trong ảnh chụp sổ cái). Tính năng đang tắt vẫn cho xem
 * lịch sử — chỉ không lật được lá mới.
 */
export default async function TrangBoSuuTapLaBai({
  searchParams,
}: {
  searchParams: Promise<{ loai?: string }>;
}) {
  const [sp, user, tinhNang] = await Promise.all([
    searchParams,
    requireUserPage(),
    docTinhNang(),
  ]);
  // Layout đang hiện màn bảo trì — không cần tải lịch sử
  if (tinhNang.tamDung && !laNguoiVanHanh(user)) return null;

  const bst = await lichSuLaBai(user.id, 120);
  const loc = laLoai(sp.loai) ? sp.loai : null;
  const ds = loc ? bst.ds.filter((x) => x.loai === loc) : bst.ds;
  const phanTram = bst.tongDanhNgon
    ? Math.round((bst.soDanhNgonDaGap / bst.tongDanhNgon) * 100)
    : 0;

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 pt-4">
      <div>
        <Link
          href="/ngoi-nha"
          className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm text-white/70 hover:text-white"
        >
          <BieuTuong ten="quay-lai" className="h-4 w-4" /> Về Ngôi nhà
        </Link>
        <h1 className="text-3xl leading-[1.2]">Bộ sưu tập lá bài</h1>
        <p className="mt-1 text-sm text-white/65">
          Mỗi ngày một lá — gom đủ những câu danh ngôn hay nhất cho người làm
          kinh doanh.
        </p>
        {!tinhNang.laBai && (
          <p className="mt-2 flex items-start gap-2 rounded-2xl bg-white/5 px-3 py-2 text-sm text-white/80">
            <BieuTuong
              ten="dong-ho"
              className="mt-0.5 h-4 w-4 shrink-0 text-son-300"
            />
            Lá bài mỗi ngày đang tạm nghỉ. Lịch sử của anh/chị vẫn còn nguyên ở
            đây.
          </p>
        )}
      </div>

      {/* Số liệu sưu tầm */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="nn-kinh col-span-2 rounded-3xl p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
            <BieuTuong ten="sach" className="h-5 w-5 text-vang-400" /> Danh ngôn
            đã sưu tầm
          </div>
          <div className="nn-so mt-1 text-3xl font-black">
            {bst.soDanhNgonDaGap}
            <span className="text-lg font-bold text-white/50">
              /{bst.tongDanhNgon}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-vang-400"
              style={{ width: `${phanTram}%` }}
            />
          </div>
        </div>
        <div className="nn-kinh rounded-3xl p-4">
          <div className="text-xs text-white/60">Chuỗi ngày</div>
          <div className="nn-so mt-1 flex items-center gap-1.5 text-3xl font-black text-vang-400">
            <BieuTuong ten="lua" dac className="h-6 w-6" />
            {bst.chuoiNgay}
          </div>
        </div>
        <div className="nn-kinh rounded-3xl p-4">
          <div className="text-xs text-white/60">Đã lật</div>
          <div className="nn-so mt-1 text-3xl font-black">{bst.tongLat}</div>
          <div className="text-[11px] text-white/55">
            {bst.tongDiem > 0 ? `+${so(bst.tongDiem)} điểm` : "lá"}
          </div>
        </div>
      </section>

      {bst.theoNhom.length > 0 && (
        <section className="nn-kinh rounded-3xl p-4">
          <h2 className="text-lg leading-[1.25]">Theo chủ đề</h2>
          <ul className="mt-3 space-y-2.5">
            {bst.theoNhom.map((n) => (
              <li key={n.ma}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-white/85">{n.ten}</span>
                  <span className="nn-so shrink-0 text-white/60">
                    {n.daGap}/{n.tong}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-son-400"
                    style={{
                      width: `${n.tong ? Math.round((n.daGap / n.tong) * 100) : 0}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Lọc theo loại lá */}
      <nav
        aria-label="Lọc theo loại lá"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1"
      >
        {[null, ...CAC_LOAI_LA].map((l) => {
          const dang = l === loc;
          const soLa = l ? bst.theoLoai[l] : bst.tongLat;
          return (
            <Link
              key={l ?? "tat-ca"}
              href={l ? `/ngoi-nha/la-bai?loai=${l}` : "/ngoi-nha/la-bai"}
              scroll={false}
              className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${
                dang
                  ? "bg-vang-400 text-navy-900"
                  : "bg-white/5 text-white/80 ring-1 ring-white/10 hover:bg-white/10"
              }`}
            >
              {l && <BieuTuong ten={BIEU_TUONG_LA[l]} className="h-4 w-4" />}
              {l ? TEN_LOAI_LA[l] : "Tất cả"}
              <span className="nn-so text-xs opacity-70">{soLa}</span>
            </Link>
          );
        })}
      </nav>

      {ds.length === 0 ? (
        <div className="nn-kinh rounded-3xl px-4 py-10 text-center text-sm text-white/70">
          {bst.tongLat === 0
            ? "Anh/chị chưa lật lá bài nào. Về trang chủ game để chọn lá hôm nay nhé."
            : "Chưa có lá nào thuộc loại này."}
        </div>
      ) : (
        <ul className="space-y-3">
          {ds.map((la) => (
            <li key={la.ngay}>
              <TheLichSu la={la} />
            </li>
          ))}
        </ul>
      )}
      {bst.tongLat > bst.ds.length && (
        <p className="text-center text-xs text-white/50">
          Đang hiện {bst.ds.length} lá gần nhất.
        </p>
      )}
    </main>
  );
}

function TheLichSu({ la }: { la: LaDaLat }) {
  const diem = la.diem + la.diemChuoi;
  return (
    <article className="nn-kinh rounded-3xl p-4">
      <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/60">
        <span className="flex items-center gap-1.5 text-vang-400">
          <BieuTuong ten={BIEU_TUONG_LA[la.loai]} className="h-4 w-4" />
          {TEN_LOAI_LA[la.loai]}
        </span>
        <span className="font-semibold tracking-normal">
          {ngayLaDep(la.ngay)}
        </span>
      </div>

      {la.loai === "DANH_NGON" &&
        (la.danhNgon ? (
          <>
            <blockquote className="chu-tieu-de mt-2 text-lg leading-[1.3] text-white">
              “{la.danhNgon.noiDung}”
            </blockquote>
            <div className="mt-1.5 text-sm font-semibold text-son-300">
              {la.danhNgon.tacGia}
              {la.danhNgon.moTaTacGia && (
                <span className="font-normal text-white/50">
                  {" "}
                  · {la.danhNgon.moTaTacGia}
                </span>
              )}
            </div>
            {la.danhNgon.yNghia && (
              <p className="mt-2 rounded-2xl bg-white/5 px-3 py-2 text-sm leading-relaxed text-white/80">
                <b className="text-vang-400">Ý nghĩa cho doanh nhân: </b>
                {la.danhNgon.yNghia}
              </p>
            )}
            {la.danhNgon.nguon && (
              <p className="mt-1.5 text-[11px] text-white/45">
                Nguồn: {la.danhNgon.nguon}
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-white/60">
            Câu danh ngôn này đã được Ban Điều hành gỡ khỏi bộ bài.
          </p>
        ))}

      {la.loai === "LOI_NHAN" &&
        (la.loiNhan ? (
          <>
            <p className="mt-2 text-[15px] leading-relaxed text-white/90">
              {la.loiNhan.noiDung}
            </p>
            {la.loiNhan.goiY && (
              <p className="mt-2 flex gap-2 text-sm text-white/75">
                <BieuTuong
                  ten="dung"
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                />
                {la.loiNhan.goiY}
              </p>
            )}
            <p className="mt-1.5 text-right text-xs italic text-white/55">
              — {la.loiNhan.nguoiKy}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-white/60">
            Lời nhắn này đã được Ban Điều hành gỡ khỏi bộ bài.
          </p>
        ))}

      {la.loai === "DIEM" && (
        <p className="nn-so mt-2 text-2xl font-black text-vang-400">
          +{so(la.diem)}{" "}
          <span className="text-sm font-semibold text-white/70">
            điểm Vươn tầm
          </span>
        </p>
      )}

      {la.loai === "QUA" && la.qua && (
        <div className="mt-2 rounded-2xl bg-son-700/40 p-3 ring-1 ring-vang-400/40">
          <div className="font-bold text-white">{la.qua.ten}</div>
          {la.qua.nhaDongHanh && (
            <div className="text-sm text-white/75">
              Nhà đồng hành: {la.qua.nhaDongHanh}
            </div>
          )}
          <div
            className={`mt-1.5 text-sm font-semibold ${la.qua.daTrao ? "text-emerald-300" : "text-vang-400"}`}
          >
            {la.qua.daTrao
              ? "Đã nhận quà"
              : "Chờ trao — nhận tại Văn phòng Chi hội"}
          </div>
        </div>
      )}

      {(diem > 0 || la.choiThu) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {la.diem > 0 && la.loai !== "DIEM" && (
            <span className="nn-so rounded-full bg-white/10 px-2 py-0.5 font-semibold text-vang-400">
              +{so(la.diem)} điểm
            </span>
          )}
          {la.diemChuoi > 0 && (
            <span className="nn-so rounded-full bg-white/10 px-2 py-0.5 font-semibold text-vang-400">
              Chuỗi {la.chuoiNgay} ngày +{so(la.diemChuoi)}
            </span>
          )}
          {!la.ghiNhan && diem > 0 && (
            <span className="text-white/50">mùa đã kết thúc, không cộng</span>
          )}
          {la.choiThu && <span className="text-white/50">chơi thử</span>}
        </div>
      )}
    </article>
  );
}
