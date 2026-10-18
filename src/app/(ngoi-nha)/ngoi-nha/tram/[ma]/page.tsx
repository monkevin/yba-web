import { notFound } from "next/navigation";
import { requireUserPage } from "@/lib/auth";
import { docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import { laNguoiVanHanh } from "@/lib/ngoi-nha/chay-action";
import { donLuotCu } from "@/lib/ngoi-nha/dong-co";
import { maTuDuongDan } from "@/lib/ngoi-nha/luat";
import { CHOI_THU, muaHienTai } from "@/lib/ngoi-nha/mua";
import { thongTinTram } from "@/lib/ngoi-nha/tong-hop";
import ManChoi from "@/components/ngoi-nha/ManChoi";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ma: string }>;
}) {
  const { ma } = await params;
  return { title: `Trạm ${maTuDuongDan(ma)} · Ngôi nhà Chợ Lớn` };
}

export default async function TrangTram({
  params,
}: {
  params: Promise<{ ma: string }>;
}) {
  const { ma } = await params;
  const user = await requireUserPage();
  const tinhNang = await docTinhNang();
  // Layout đang hiện màn bảo trì — đừng chạy tiếp việc nặng trên CSDL
  if (tinhNang.tamDung && !laNguoiVanHanh(user)) return null;
  const nguoi = { userId: user.id, memberId: user.memberId };
  await donLuotCu(nguoi);
  const mua = await muaHienTai();
  const tt = await thongTinTram(nguoi, mua, maTuDuongDan(ma));
  if (!tt) notFound();
  return (
    <ManChoi
      key={tt.tram.ma}
      cheDo="tram"
      tram={tt.tram}
      thongTin={{
        moKhoa: tt.moKhoa,
        sao: tt.sao,
        daQua: tt.daQua,
        diemTot: tt.diemTot,
        luotTinhDiemConLai: tt.luotTinhDiemConLai,
        luotTinhDiemToiDa: tt.luotTinhDiemToiDa,
        dangChoi: tt.dangChoi,
        luotRutThe: tt.luotRutThe,
      }}
      mua={{
        ten: mua.ten,
        tinhDiem: mua.tinhDiem,
        choiThu: mua.id === CHOI_THU,
      }}
      luat={tt.luatManChoi}
    />
  );
}
