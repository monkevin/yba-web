import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { laNguoiVanHanh } from "@/lib/ngoi-nha/chay-action";
import { prisma } from "@/lib/prisma";
import { dauTriDangMo, soCauDeBai } from "@/lib/ngoi-nha/dau-tri";
import { TIEN_TO_DAU } from "@/lib/ngoi-nha/dong-co";
import { docMuc, docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import { soDep } from "@/lib/ngoi-nha/luat";
import { docJson } from "@/lib/ngoi-nha/so-cai";
import { ngayGioDep } from "@/lib/ngoi-nha/thoi-gian";
import BieuTuong from "@/components/ngoi-nha/BieuTuong";
import VaoBangMa from "./VaoBangMa";

export const metadata = { title: "Đấu trí sự kiện · Ngôi nhà Chợ Lớn" };
export const dynamic = "force-dynamic";

export default async function TrangDauTri() {
  const user = await requireUserPage();
  const [tinhNang, luat] = await Promise.all([docTinhNang(), docMuc("luat")]);
  // Layout đang hiện màn bảo trì — đừng chạy tiếp việc nặng trên CSDL
  if (tinhNang.tamDung && !laNguoiVanHanh(user)) return null;

  // Ban Điều hành tắt Đấu trí: vẫn xem kết quả cũ, không vào phiên mới
  const moVao = tinhNang.dauTri;
  const [dangMo, cuaToi] = await Promise.all([
    moVao ? dauTriDangMo() : Promise.resolve([]),
    prisma.nnLuot.findMany({
      where: {
        userId: user.id,
        tramMa: { startsWith: TIEN_TO_DAU },
        trangThai: "XONG",
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        tramMa: true,
        diem: true,
        soDung: true,
        createdAt: true,
        deBai: true,
        ketQua: true,
      },
    }),
  ]);
  const phienIds = cuaToi.map((l) => l.tramMa.slice(TIEN_TO_DAU.length));
  const phien = await prisma.nnDauTri.findMany({
    where: { id: { in: phienIds } },
    select: { id: true, ten: true },
  });
  const tenPhien = new Map(phien.map((p) => [p.id, p.ten]));
  // "đúng x/N" theo số câu thật của lượt (bộ câu mỗi phiên dài ngắn khác nhau)
  const tongCau = (l: (typeof cuaToi)[number]) =>
    docJson<{ tong?: number }>(l.ketQua, {}).tong || soCauDeBai(l.deBai);
  const dt = luat.dauTri;

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 pt-4">
      <div>
        <h1 className="text-3xl">Đấu trí sự kiện</h1>
        <p className="mt-1 text-sm text-white/65">
          Chơi ngay tại buổi sinh hoạt: một bộ câu về kinh tế, doanh nhân và
          Hội; trả lời càng nhanh điểm càng cao; bảng xếp hạng chiếu lên màn
          hình sân khấu.
          {dt.vonTTMoiCau
            ? ` Mỗi câu đúng +${dt.vonTTMoiCau} Vốn tri thức.`
            : ""}
          {dt.vonXH ? ` Có mặt +${dt.vonXH} Vốn xã hội.` : ""}
        </p>
      </div>

      {!moVao ? (
        <div className="nn-kinh flex items-start gap-3 rounded-3xl p-4 text-sm text-white/80">
          <BieuTuong
            ten="khoa"
            className="mt-0.5 h-5 w-5 shrink-0 text-white/60"
          />
          <p>
            Đấu trí sự kiện đang tạm đóng. Ban Điều hành sẽ mở lại khi có buổi
            sinh hoạt — kết quả cũ của bạn vẫn ở bên dưới.
          </p>
        </div>
      ) : dangMo.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-xl">Đang diễn ra</h2>
          {dangMo.map((p) => (
            <Link
              key={p.id}
              href={`/ngoi-nha/dau-tri/${p.id}`}
              className="flex items-center gap-3 rounded-3xl bg-son-600 p-4 hover:bg-son-700"
            >
              <span className="nn-tho grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-son-700">
                <BieuTuong ten="tia" dac className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wide text-white/75">
                  Mã {p.maThamGia} · {p.giayMoiCau} giây/câu
                </span>
                <span className="block truncate text-lg font-bold">
                  {p.ten}
                </span>
                {p.moTa && (
                  <span className="block truncate text-xs text-white/75">
                    {p.moTa}
                  </span>
                )}
              </span>
              <BieuTuong ten="mui-ten" className="h-5 w-5 shrink-0" />
            </Link>
          ))}
        </section>
      ) : (
        <div className="nn-kinh rounded-3xl p-5 text-center text-white/75">
          <BieuTuong ten="lich" className="mx-auto h-8 w-8 text-white/50" />
          <p className="mt-2 text-sm">
            Chưa có phiên đấu trí nào đang mở. Ban Điều hành sẽ mở phiên tại
            buổi sinh hoạt — nhập mã trên màn hình để vào.
          </p>
        </div>
      )}

      {moVao && <VaoBangMa />}

      {cuaToi.length > 0 && (
        <section className="rounded-3xl bg-white p-4 text-navy-900">
          <h2 className="text-xl">Kết quả của bạn</h2>
          <ul className="mt-2 divide-y divide-slate-100">
            {cuaToi.map((l) => {
              const id = l.tramMa.slice(TIEN_TO_DAU.length);
              return (
                <li
                  key={l.tramMa + l.createdAt.toISOString()}
                  className="flex items-center gap-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/ngoi-nha/dau-tri/${id}/bang`}
                      className="block truncate font-semibold hover:underline"
                    >
                      {tenPhien.get(id) ?? "Phiên đấu trí"}
                    </Link>
                    <span className="block text-xs text-slate-500">
                      {ngayGioDep(l.createdAt)}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="nn-so block font-bold">
                      {soDep(l.diem)} điểm
                    </span>
                    <span className="block text-xs text-slate-500">
                      đúng {l.soDung}/{tongCau(l)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
