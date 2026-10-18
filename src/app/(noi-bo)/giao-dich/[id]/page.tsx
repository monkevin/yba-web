import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  SCOPE_CLASS,
  SCOPE_LABEL,
  SCOPE_SHORT,
  SIDE_LABEL,
  canConfirm,
  canEdit,
  canReview,
  canView,
  pendingConfirmMemberId,
} from "@/lib/deal";
import { formatDateTime, formatVnd, formatDate } from "@/lib/format";
import { StatusBadge, MemberLink } from "@/components/ui";
import DealActions from "./DealActions";

const LOG_LABEL: Record<string, string> = {
  TAO: "Khai báo",
  XAC_NHAN: "Đối tác xác nhận",
  DUYET: "Duyệt",
  TU_CHOI: "Từ chối",
  HUY: "Huỷ",
};

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUserPage();

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, code: true, name: true, company: true } },
      buyer: { select: { id: true, code: true, name: true, company: true } },
      referrer: { select: { id: true, code: true, name: true, company: true } },
      createdBy: { select: { name: true } },
      confirmedBy: { select: { name: true } },
      reviewedBy: { select: { name: true } },
      logs: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!deal) notFound();
  if (!canView(user, deal)) {
    return (
      <div className="card p-6 text-sm text-slate-600">
        Bạn không có quyền xem giao dịch này.
      </div>
    );
  }

  const waitingOn = pendingConfirmMemberId(deal);
  const waitingName =
    waitingOn === deal.sellerId
      ? deal.seller.company
      : waitingOn === deal.buyerId
        ? deal.buyer.company
        : null;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/giao-dich" className="text-sm text-slate-500 hover:underline">
          ← Danh sách giao dịch
        </Link>
        <span className="font-mono text-sm font-semibold text-slate-800">
          {deal.code}
        </span>
        <StatusBadge status={deal.status} />
        <span
          className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
            SCOPE_CLASS[deal.partnerScope] ?? SCOPE_CLASS.NGOAI_HOI
          }`}
          title={SCOPE_LABEL[deal.partnerScope]}
        >
          {SCOPE_SHORT[deal.partnerScope] ?? deal.partnerScope}
          {deal.externalOrg ? ` · ${deal.externalOrg}` : ""}
        </span>
      </div>

      <div className="card p-5">
        <div className="grid gap-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Bên bán
            </div>
            <div className="mt-1">
              <MemberLink member={deal.seller} />
            </div>
          </div>
          <div className="hidden text-2xl text-slate-300 sm:block">→</div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Bên mua
            </div>
            <div className="mt-1">
              <MemberLink member={deal.buyer} />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
          <Field label="Giá trị đơn">
            <span className="text-lg font-bold text-navy-700">
              {formatVnd(deal.amount)}
            </span>
          </Field>
          <Field label="Ngày giao dịch">{formatDate(deal.dealDate)}</Field>
          <Field label="Hội viên giới thiệu">
            {deal.referrer ? (
              <Link
                href={`/hoi-vien/${deal.referrer.id}`}
                className="text-navy-600 hover:underline"
              >
                {deal.referrer.company}
              </Link>
            ) : (
              "—"
            )}
          </Field>
        </div>

        {deal.description && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Nội dung
            </div>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
              {deal.description}
            </p>
          </div>
        )}

        {waitingName && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Đang chờ <strong>{waitingName}</strong> xác nhận đơn này.
          </p>
        )}
        {deal.rejectReason && (
          <p className="mt-4 rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
            Lý do từ chối: {deal.rejectReason}
          </p>
        )}
      </div>

      <DealActions
        dealId={deal.id}
        canConfirm={canConfirm(user, deal)}
        canReview={canReview(user, deal)}
        canCancel={canEdit(user, deal) && deal.status !== "HUY"}
      />

      <div className="card p-5">
        <h2 className="mb-3 font-semibold text-slate-800">Nhật ký</h2>
        <p className="mb-3 text-xs text-slate-500">
          {SIDE_LABEL[deal.createdSide] ?? deal.createdSide} ·{" "}
          {deal.createdBy.name}
        </p>
        <ol className="space-y-3">
          {deal.logs.map((l) => (
            <li key={l.id} className="flex gap-3 text-sm">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-navy-400" />
              <div>
                <div className="text-slate-800">
                  {LOG_LABEL[l.action] ?? l.action}
                  {l.user && (
                    <span className="text-slate-500"> · {l.user.name}</span>
                  )}
                </div>
                {l.detail && (
                  <div className="text-xs text-slate-500">{l.detail}</div>
                )}
                <div className="text-xs text-slate-400">
                  {formatDateTime(l.createdAt)}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm text-slate-800">{children}</div>
    </div>
  );
}
