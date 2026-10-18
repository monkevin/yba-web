import { requireUserPage } from "@/lib/auth";
import { docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import { laNguoiVanHanh } from "@/lib/ngoi-nha/chay-action";
import { CHOI_THU, muaHienTai } from "@/lib/ngoi-nha/mua";
import { dongBoTuDong, gocHuynhDe } from "@/lib/ngoi-nha/nhiem-vu";
import GocHuynhDe from "./GocHuynhDe";

export const metadata = { title: "Góc Huynh đệ · Ngôi nhà Chợ Lớn" };

export default async function TrangNhiemVu() {
  const user = await requireUserPage();
  const tinhNang = await docTinhNang();
  // Layout đang hiện màn bảo trì — đừng chạy tiếp việc nặng trên CSDL
  if (tinhNang.tamDung && !laNguoiVanHanh(user)) return null;
  const nguoi = { userId: user.id, memberId: user.memberId };
  const mua = await muaHienTai();
  const thuongMoi = await dongBoTuDong(nguoi, mua).catch(() => []);
  const du = await gocHuynhDe(nguoi, mua);
  return (
    <GocHuynhDe
      {...du}
      thuongMoi={thuongMoi}
      coHoiVien={!!user.memberId}
      muaTinhDiem={mua.tinhDiem && mua.id !== CHOI_THU}
      tenMua={mua.ten}
      myMemberId={user.memberId}
    />
  );
}
