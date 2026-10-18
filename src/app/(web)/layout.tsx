import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import DuLieuCoCauTruc from "@/components/web/DuLieuCoCauTruc";
import MauTheoCauHinh from "@/components/web/MauTheoCauHinh";
import ThanhCuon from "@/components/web/ThanhCuon";
import { getCurrentUser } from "@/lib/auth";
import { docGiaoDien } from "@/lib/giao-dien";

/**
 * Khung của khu CÔNG KHAI. Không bắt đăng nhập — chỉ đọc phiên để biết có hiện
 * lối vào khu hội viên hay không. Việc chặn truy cập do `src/proxy.ts` lo.
 */
export default async function WebLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, gd] = await Promise.all([getCurrentUser(), docGiaoDien()]);

  return (
    <>
      <MauTheoCauHinh ma={gd.mau} />
      <ThanhCuon />
      <DuLieuCoCauTruc />
      <SiteHeader userName={user?.name ?? null} logo={gd.logo} />
      <main className="flex-1">{children}</main>
      <SiteFooter gd={gd} />
    </>
  );
}
