/**
 * Chỉ chứa hằng số và quy tắc thuần — KHÔNG import "@/lib/auth" ở đây,
 * vì file này cũng được dùng trong client component (auth.ts đụng next/headers).
 */
type Actor = { role: string; memberId: string | null };

const isAdmin = (u: Actor) => u.role === "ADMIN";
const isBackOffice = (u: Actor) => u.role === "ADMIN" || u.role === "STAFF";

export const DEAL_STATUS = {
  CHO_DOI_TAC: "CHO_DOI_TAC",
  CHO_DUYET: "CHO_DUYET",
  DA_DUYET: "DA_DUYET",
  TU_CHOI: "TU_CHOI",
  HUY: "HUY",
} as const;

export type DealStatus = keyof typeof DEAL_STATUS;

export const STATUS_LABEL: Record<DealStatus, string> = {
  CHO_DOI_TAC: "Chờ đối tác xác nhận",
  CHO_DUYET: "Chờ ban điều hành duyệt",
  DA_DUYET: "Đã duyệt",
  TU_CHOI: "Từ chối",
  HUY: "Đã huỷ",
};

export const STATUS_CLASS: Record<DealStatus, string> = {
  CHO_DOI_TAC: "bg-amber-100 text-amber-800 ring-amber-200",
  CHO_DUYET: "bg-navy-100 text-navy-800 ring-navy-200",
  DA_DUYET: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  TU_CHOI: "bg-do-100 text-do-800 ring-do-200",
  HUY: "bg-slate-100 text-slate-600 ring-slate-200",
};

/**
 * Phạm vi giao thương — cơ sở tách chỉ số ở trang /xuc-tien-thuong-mai.
 * Đây chính là ba cấp xúc tiến thương mại Chi hội theo dõi: trong Chi hội, với
 * chi hội bạn cùng YBA HCM, và với hội / hiệp hội khác.
 */
export const PARTNER_SCOPE = {
  NOI_CHI_HOI: "NOI_CHI_HOI",
  LIEN_CHI_HOI: "LIEN_CHI_HOI",
  LIEN_HOI: "LIEN_HOI",
  NGOAI_HOI: "NGOAI_HOI",
} as const;

export type PartnerScope = keyof typeof PARTNER_SCOPE;

export const SCOPE_LABEL: Record<string, string> = {
  NOI_CHI_HOI: "Nội bộ Chi hội Chợ Lớn",
  LIEN_CHI_HOI: "Với chi hội bạn (YBA HCM)",
  LIEN_HOI: "Với hội / hiệp hội khác",
  NGOAI_HOI: "Với doanh nghiệp ngoài Hội",
};

/** Nhãn ngắn dùng trong bảng và biểu đồ. */
export const SCOPE_SHORT: Record<string, string> = {
  NOI_CHI_HOI: "Nội Chi hội",
  LIEN_CHI_HOI: "Liên chi hội",
  LIEN_HOI: "Liên hội",
  NGOAI_HOI: "Ngoài Hội",
};

export const SCOPE_HINT: Record<string, string> = {
  NOI_CHI_HOI: "Cả hai bên đều là hội viên YBA Chợ Lớn.",
  LIEN_CHI_HOI: "Đối tác thuộc chi hội khác của YBA HCM — ghi rõ tên chi hội.",
  LIEN_HOI: "Đối tác thuộc hội doanh nhân / hiệp hội khác — ghi rõ tên hội.",
  NGOAI_HOI: "Đối tác không thuộc hội nào, do hội viên tự kết nối được.",
};

export const SCOPE_CLASS: Record<string, string> = {
  NOI_CHI_HOI: "bg-navy-100 text-navy-800 ring-navy-200",
  LIEN_CHI_HOI: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  LIEN_HOI: "bg-amber-100 text-amber-800 ring-amber-200",
  NGOAI_HOI: "bg-slate-100 text-slate-600 ring-slate-200",
};

/** Thứ tự hiển thị cố định của bốn phạm vi. */
export const SCOPE_ORDER = [
  PARTNER_SCOPE.NOI_CHI_HOI,
  PARTNER_SCOPE.LIEN_CHI_HOI,
  PARTNER_SCOPE.LIEN_HOI,
  PARTNER_SCOPE.NGOAI_HOI,
] as const;

/** Phạm vi có cần ghi tên hội / chi hội của đối tác không. */
export function canTenToChuc(scope: string): boolean {
  return scope === PARTNER_SCOPE.LIEN_CHI_HOI || scope === PARTNER_SCOPE.LIEN_HOI;
}

/**
 * Kiểm tra phạm vi giao thương khi khai đơn. Trả về câu báo lỗi, hoặc null nếu
 * hợp lệ. Tách thành hàm thuần để kiểm thử được mà không cần dựng máy chủ.
 */
export function loiPhamVi(scope: string, externalOrg: string | null): string | null {
  if (!(scope in PARTNER_SCOPE)) return "Chọn phạm vi giao thương";
  if (canTenToChuc(scope) && !externalOrg?.trim()) {
    return "Ghi rõ tên chi hội / hội của đối tác — đây là căn cứ tính chỉ số liên chi hội, liên hội";
  }
  return null;
}

export const SIDE_LABEL: Record<string, string> = {
  SELLER: "Bên bán khai",
  BUYER: "Bên mua khai",
  ADMIN: "Ban điều hành nhập hộ",
};

type DealLike = {
  status: string;
  sellerId: string;
  buyerId: string;
  createdSide: string;
};

/** Hội viên nào đang phải xác nhận đơn này (id hội viên), null nếu không ở bước đó. */
export function pendingConfirmMemberId(deal: DealLike): string | null {
  if (deal.status !== DEAL_STATUS.CHO_DOI_TAC) return null;
  if (deal.createdSide === "SELLER") return deal.buyerId;
  if (deal.createdSide === "BUYER") return deal.sellerId;
  return null; // ADMIN nhập hộ: xem như đã đối chiếu, chuyển thẳng sang chờ duyệt
}

/** Người dùng hiện tại có được xem giao dịch này không. */
export function canView(user: Actor, deal: DealLike): boolean {
  if (isBackOffice(user)) return true;
  return user.memberId === deal.sellerId || user.memberId === deal.buyerId;
}

/** Có được bấm "Xác nhận đúng" cho đơn này không. */
export function canConfirm(user: Actor, deal: DealLike): boolean {
  const target = pendingConfirmMemberId(deal);
  if (!target) return false;
  if (isAdmin(user)) return true; // admin xác nhận thay khi đối tác chưa có tài khoản
  return user.memberId === target;
}

/** Có được duyệt / từ chối đơn này không. */
export function canReview(user: Actor, deal: DealLike): boolean {
  return isAdmin(user) && deal.status === DEAL_STATUS.CHO_DUYET;
}

/** Có được sửa / huỷ đơn này không. */
export function canEdit(user: Actor, deal: DealLike): boolean {
  if (isAdmin(user)) return true;
  if (deal.status !== DEAL_STATUS.CHO_DOI_TAC) return false;
  return user.memberId === deal.sellerId || user.memberId === deal.buyerId;
}

/** Sinh mã giao dịch dạng GT2026-0007 từ số thứ tự trong năm. */
export function makeDealCode(year: number, seq: number): string {
  return `GT${year}-${String(seq).padStart(4, "0")}`;
}

/** Sinh mã hội viên dạng HV0042. */
export function makeMemberCode(seq: number): string {
  return `HV${String(seq).padStart(4, "0")}`;
}
