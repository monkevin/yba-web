/**
 * Kiểm tra nhanh các quy tắc phân quyền của quy trình giao dịch.
 * Chạy: npm run test:quyen
 */
import {
  canConfirm,
  canReview,
  canView,
  canEdit,
  pendingConfirmMemberId,
  DEAL_STATUS,
} from "../src/lib/deal";

const seller = { role: "MEMBER", memberId: "S" };
const buyer = { role: "MEMBER", memberId: "B" };
const other = { role: "MEMBER", memberId: "X" };
const admin = { role: "ADMIN", memberId: null };
const staff = { role: "STAFF", memberId: null };

const base = { sellerId: "S", buyerId: "B", createdSide: "SELLER" };
const waiting = { ...base, status: DEAL_STATUS.CHO_DOI_TAC };
const pendingAdmin = { ...base, status: DEAL_STATUS.CHO_DUYET };
const approved = { ...base, status: DEAL_STATUS.DA_DUYET };

const cases: [string, boolean, boolean][] = [
  ["bên bán khai -> chờ bên mua xác nhận", pendingConfirmMemberId(waiting) === "B", true],
  ["bên mua được xác nhận", canConfirm(buyer, waiting), true],
  ["bên bán KHÔNG tự xác nhận đơn mình khai", canConfirm(seller, waiting), false],
  ["người ngoài không xác nhận được", canConfirm(other, waiting), false],
  ["admin xác nhận thay được", canConfirm(admin, waiting), true],
  ["thư ký KHÔNG duyệt được", canReview(staff, pendingAdmin), false],
  ["admin duyệt được đơn chờ duyệt", canReview(admin, pendingAdmin), true],
  ["admin không duyệt lại đơn đã duyệt", canReview(admin, approved), false],
  ["người ngoài không xem được", canView(other, approved), false],
  ["thư ký xem được mọi đơn", canView(staff, approved), true],
  ["không sửa được đơn đã duyệt", canEdit(seller, approved), false],
  ["sửa được đơn còn chờ đối tác", canEdit(seller, waiting), true],
];

let fail = 0;
for (const [name, got, want] of cases) {
  const ok = got === want;
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
}
console.log(fail ? `\n${fail} kiểm thử thất bại` : "\nTất cả quy tắc phân quyền đúng");
process.exit(fail ? 1 : 0);
