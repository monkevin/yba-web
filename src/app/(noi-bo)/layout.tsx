import { redirect } from "next/navigation";
import Nav, { type NavItem } from "@/components/Nav";
import {
  getCurrentUser,
  isAdmin,
  isBackOffice,
  type CurrentUser,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEAL_STATUS, pendingConfirmMemberId } from "@/lib/deal";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Ban điều hành",
  STAFF: "Thư ký",
  MEMBER: "Hội viên",
};

/** Số việc đang chờ chính người này xử lý — hiện thành badge đỏ trên menu. */
async function countTodo(user: CurrentUser) {
  if (isAdmin(user)) {
    return prisma.deal.count({ where: { status: DEAL_STATUS.CHO_DUYET } });
  }
  if (!user.memberId) return 0;

  const waiting = await prisma.deal.findMany({
    where: {
      status: DEAL_STATUS.CHO_DOI_TAC,
      OR: [{ sellerId: user.memberId }, { buyerId: user.memberId }],
    },
    select: { status: true, sellerId: true, buyerId: true, createdSide: true },
  });
  return waiting.filter((d) => pendingConfirmMemberId(d) === user.memberId).length;
}

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?het=1");

  const todo = await countTodo(user);

  // Lượt "Tôi quan tâm" chưa xem tới tin của chính hội viên này
  const quanTamMoi = user.memberId
    ? await prisma.listingContact.count({
        where: { listing: { memberId: user.memberId }, seen: false },
      })
    : 0;

  // Thứ tự Chủ tịch chốt 25/09: nhóm ĐẶC QUYỀN hội viên (game, ưu đãi,
  // bảng hoạt động) đứng ngay sau Tổng quan cho ai vào cũng thấy.
  const items: NavItem[] = [
    { href: "/tai-khoan", label: "Tổng quan" },
    { href: "/ngoi-nha", label: "Ngôi nhà Chợ Lớn" },
    { href: "/uu-dai", label: "Ưu đãi & Hot Deal" },
    { href: "/bang-hoat-dong", label: "Bảng hoạt động" },
    { href: "/giao-dich", label: "Giao dịch", badge: todo },
    { href: "/hoi-vien", label: "Hội viên" },
    { href: "/tai-khoan/ho-so", label: "Hồ sơ doanh nghiệp" },
    { href: "/tai-khoan/tin-dang", label: "Tin đăng", badge: quanTamMoi },
    { href: "/tai-khoan/chan-dung", label: "WHO AM I?" },
    { href: "/bao-cao", label: "Báo cáo" },
    { href: "/mang-luoi", label: "Mạng lưới" },
  ];
  if (isBackOffice(user)) {
    items.push({ href: "/quan-tri", label: "Quản trị" });
  }

  return (
    <>
      <Nav
        items={items}
        userName={user.memberName ? `${user.name}` : user.name}
        roleLabel={
          user.memberCode
            ? `${ROLE_LABEL[user.role]} · ${user.memberCode}`
            : ROLE_LABEL[user.role]
        }
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
      <footer className="mx-auto w-full max-w-7xl px-4 pb-6 text-xs text-slate-400">
        Khu hội viên YBA Chợ Lớn · dữ liệu chỉ dùng trong nội bộ Chi hội
      </footer>
    </>
  );
}
