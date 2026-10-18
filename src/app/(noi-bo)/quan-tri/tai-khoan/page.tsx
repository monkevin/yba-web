import { PageHeader } from "@/components/ui";
import { isAdmin, requireQuyen } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUYEN } from "@/lib/quyen";
import TaiKhoanPanel, { type TaiKhoan } from "./TaiKhoanPanel";

export default async function TrangTaiKhoan() {
  const user = await requireQuyen(QUYEN.TAI_KHOAN_QUAN_LY);

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { username: "asc" }],
    include: {
      // phone: để thư ký tìm tài khoản theo SĐT khi hội viên quên tên đăng nhập
      member: {
        select: {
          id: true,
          code: true,
          name: true,
          company: true,
          phone: true,
        },
      },
    },
  });

  const danhSach: TaiKhoan[] = users.map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    chucVu: u.chucVu,
    permissions: u.permissions,
    active: u.active,
    memberCompany: u.member?.company ?? null,
    memberId: u.member?.id ?? null,
    memberName: u.member?.name ?? null,
    memberCode: u.member?.code ?? null,
    memberPhone: u.member?.phone ?? null,
  }));

  const soQuanTri = danhSach.filter((a) => a.role !== "MEMBER").length;

  return (
    <div>
      <PageHeader
        title="Tài khoản & phân quyền"
        subtitle={`${danhSach.length} tài khoản · ${soQuanTri} tài khoản quản trị`}
      />
      <TaiKhoanPanel danhSach={danhSach} laChuNhiem={isAdmin(user)} />
    </div>
  );
}
