import { requireUserPage, isBackOffice } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import DealForm from "./DealForm";

export default async function NewDealPage() {
  const user = await requireUserPage();

  const me = user.memberId
    ? await prisma.member.findUnique({
        where: { id: user.memberId },
        select: { id: true, code: true, name: true, company: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Khai báo giao dịch"
        subtitle="Ghi nhận một đơn mua bán giữa hai hội viên trong hội"
      />
      {!me && !isBackOffice(user) ? (
        <div className="card p-6 text-sm text-slate-600">
          Tài khoản của bạn chưa gắn với hồ sơ hội viên nào. Liên hệ ban điều
          hành để được gắn hồ sơ trước khi khai báo giao dịch.
        </div>
      ) : (
        <DealForm me={me} backOffice={isBackOffice(user)} />
      )}
    </div>
  );
}
