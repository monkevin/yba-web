import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserPage } from "@/lib/auth";
import { laNguoiVanHanh } from "@/lib/ngoi-nha/chay-action";
import { prisma } from "@/lib/prisma";
import { luotCuaToi } from "@/lib/ngoi-nha/dau-tri";
import { docMuc, docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import { luatManChoi } from "@/lib/ngoi-nha/luat";
import { docJson } from "@/lib/ngoi-nha/so-cai";
import { CHOI_THU, muaHienTai } from "@/lib/ngoi-nha/mua";
import BieuTuong from "@/components/ngoi-nha/BieuTuong";
import ManChoi from "@/components/ngoi-nha/ManChoi";

export const metadata = { title: "Đấu trí sự kiện · Ngôi nhà Chợ Lớn" };
export const dynamic = "force-dynamic";

export default async function TrangChoiDauTri({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUserPage();
  const [phien, luot, mua, tinhNang, luat, thongSo] = await Promise.all([
    prisma.nnDauTri.findUnique({ where: { id } }),
    luotCuaToi(user.id, id),
    muaHienTai(),
    docTinhNang(),
    docMuc("luat"),
    docMuc("thongSo"),
  ]);
  // Layout đang hiện màn bảo trì — đừng chạy tiếp việc nặng trên CSDL
  if (tinhNang.tamDung && !laNguoiVanHanh(user)) return null;
  if (!phien) notFound();

  // Tắt Đấu trí: ai chưa vào thì không vào được nữa; lượt đang dở vẫn chơi nốt
  if (!tinhNang.dauTri && !luot) {
    return (
      <main className="mx-auto max-w-lg px-4 pt-6">
        <div className="rounded-3xl bg-white p-6 text-center text-navy-900">
          <BieuTuong ten="khoa" className="mx-auto h-10 w-10 text-navy-400" />
          <h1 className="mt-2 text-2xl">{phien.ten}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Đấu trí sự kiện đang tạm đóng — Ban Điều hành sẽ mở lại sớm.
          </p>
          <Link
            href="/ngoi-nha/dau-tri"
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-navy-600 px-5 text-sm font-bold text-white"
          >
            Về Đấu trí
          </Link>
        </div>
      </main>
    );
  }

  if (phien.trangThai !== "DANG_MO" && !luot) {
    return (
      <main className="mx-auto max-w-lg px-4 pt-6">
        <div className="rounded-3xl bg-white p-6 text-center text-navy-900">
          <BieuTuong ten="lich" className="mx-auto h-10 w-10 text-navy-400" />
          <h1 className="mt-2 text-2xl">{phien.ten}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {phien.trangThai === "SAP_MO"
              ? "Phiên chưa mở — chờ Ban Điều hành bấm mở tại sự kiện."
              : "Phiên đã kết thúc."}
          </p>
          <Link
            href={`/ngoi-nha/dau-tri/${phien.id}/bang`}
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-navy-600 px-5 text-sm font-bold text-white"
          >
            Xem bảng xếp hạng
          </Link>
        </div>
      </main>
    );
  }

  return (
    <ManChoi
      cheDo="dau-tri"
      mua={{
        ten: mua.ten,
        tinhDiem: mua.tinhDiem,
        choiThu: mua.id === CHOI_THU,
      }}
      dauTri={{
        id: phien.id,
        ten: phien.ten,
        moTa: phien.moTa,
        giay: phien.giayMoiCau,
        maThamGia: phien.maThamGia,
        trangThai: luot
          ? luot.trangThai === "DANG_CHOI"
            ? "DANG_CHOI"
            : "XONG"
          : "CHUA",
        luotId: luot?.id ?? null,
        // Số câu thật của phiên — chữ "đúng x/N" phải theo đề bài, không cứng 10
        soCau: docJson<unknown[]>(phien.deBai, []).length || undefined,
      }}
      luat={luatManChoi(luat, tinhNang, thongSo.cauThuong)}
    />
  );
}
