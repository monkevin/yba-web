import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { laNguoiVanHanh } from "@/lib/ngoi-nha/chay-action";
import { prisma } from "@/lib/prisma";
import { docMuc, docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import { THU_THACH_NGAY, luatManChoi } from "@/lib/ngoi-nha/luat";
import { CHOI_THU, muaHienTai } from "@/lib/ngoi-nha/mua";
import { hoSoNguoiChoi } from "@/lib/ngoi-nha/tong-hop";
import { ngayThuThach } from "@/lib/ngoi-nha/thoi-gian";
import BieuTuong from "@/components/ngoi-nha/BieuTuong";
import ManChoi from "@/components/ngoi-nha/ManChoi";

export const metadata = { title: "Thử thách hôm nay · Ngôi nhà Chợ Lớn" };

export default async function TrangThuThach() {
  const user = await requireUserPage();
  const nguoi = { userId: user.id, memberId: user.memberId };
  const mua = await muaHienTai();
  const [hs, luot, tinhNang, luat, thongSo] = await Promise.all([
    hoSoNguoiChoi(nguoi, mua),
    prisma.nnLuot.findUnique({
      where: {
        userId_ngay: {
          userId: user.id,
          ngay: ngayThuThach(new Date(), THU_THACH_NGAY.GIO_SANG_NGAY),
        },
      },
      select: { id: true },
    }),
    docTinhNang(),
    docMuc("luat"),
    docMuc("thongSo"),
  ]);

  // Layout đang hiện màn bảo trì — đừng chạy tiếp việc nặng trên CSDL
  if (tinhNang.tamDung && !laNguoiVanHanh(user)) return null;

  // Ban tắt thử thách: chưa chơi hôm nay thì báo nhẹ; lượt đã mở vẫn chơi nốt / xem lại
  if (!tinhNang.thuThachNgay && hs.thuThach.trangThai === "CHUA") {
    return (
      <div className="mx-auto max-w-lg px-4 pt-5">
        <Link
          href="/ngoi-nha"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-white/70 hover:text-white"
        >
          <BieuTuong ten="quay-lai" className="h-4 w-4" /> Ngôi nhà
        </Link>
        <div className="nn-hien mt-2 overflow-hidden rounded-3xl bg-white text-navy-900 shadow-2xl">
          <div className="bg-navy-800 px-5 py-6 text-white">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Thử thách hằng ngày
            </div>
            <h1 className="mt-2 text-3xl leading-tight">Đang tạm nghỉ</h1>
          </div>
          <div className="space-y-4 p-5">
            <p className="flex gap-2 text-sm text-slate-600">
              <BieuTuong
                ten="lich"
                className="mt-0.5 h-4 w-4 shrink-0 text-navy-500"
              />
              Ban Điều hành đang tạm nghỉ thử thách hằng ngày. Anh/chị vẫn chơi
              hành trình 22 trạm như thường.
            </p>
            <Link
              href="/ngoi-nha"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-son-600 font-bold text-white hover:bg-son-700"
            >
              <BieuTuong ten="nha" className="h-4 w-4" /> Về Ngôi nhà
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ManChoi
      cheDo="ngay"
      mua={{
        ten: mua.ten,
        tinhDiem: mua.tinhDiem,
        choiThu: mua.id === CHOI_THU,
      }}
      thuThach={{
        trangThai: hs.thuThach.trangThai,
        chuoiNgay: hs.thuThach.chuoiNgay,
        luotId: luot?.id ?? null,
      }}
      luat={luatManChoi(luat, tinhNang, thongSo.cauThuong)}
    />
  );
}
