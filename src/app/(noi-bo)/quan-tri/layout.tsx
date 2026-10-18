import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { coQuyenQuanTri } from "@/lib/quyen";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUserPage();

  if (!coQuyenQuanTri(user)) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <span className="text-4xl">🔒</span>
        <h1 className="mt-3 font-bold text-navy-800">Không có quyền truy cập</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Tài khoản của anh/chị chưa được cấp quyền quản trị nào. Liên hệ Chủ
          nhiệm Chi hội để được phân quyền.
        </p>
        <Link href="/tai-khoan" className="btn-ghost mt-6">
          ← Về khu hội viên
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
