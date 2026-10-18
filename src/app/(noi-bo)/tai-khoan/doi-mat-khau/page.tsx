import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import FormDoiMatKhau from "./FormDoiMatKhau";

export const metadata: Metadata = {
  title: "Đổi mật khẩu",
  robots: { index: false, follow: false },
};

export default async function TrangDoiMatKhau() {
  const user = await requireUserPage();

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Đổi mật khẩu"
        subtitle={`Tài khoản ${user.username}`}
        action={
          <Link href="/tai-khoan" className="btn-ghost min-h-11">
            ← Tổng quan
          </Link>
        }
      />
      <FormDoiMatKhau tenDangNhap={user.username} />
    </div>
  );
}
