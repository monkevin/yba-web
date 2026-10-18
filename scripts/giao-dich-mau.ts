/**
 * Tạo giao dịch MẪU giữa các hội viên thật để xem thử báo cáo / vinh danh / mạng lưới.
 *
 *   npm run giao-dich-mau            → tạo 400 giao dịch mẫu
 *   npm run giao-dich-mau -- 800     → tạo 800 giao dịch mẫu
 *   npm run giao-dich-mau -- --xoa   → XOÁ toàn bộ giao dịch mẫu (giữ nguyên hội viên)
 *
 * Giao dịch mẫu được đánh dấu bằng tiền tố "[MẪU]" trong nội dung nên xoá lại
 * được chính xác, không đụng vào giao dịch thật do hội viên khai.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const MARK = "[MẪU]";

function rnd(max: number) {
  return Math.floor(Math.random() * max);
}

async function main() {
  if (process.argv.includes("--xoa")) {
    const { count } = await prisma.deal.deleteMany({
      where: { description: { startsWith: MARK } },
    });
    console.log(`Đã xoá ${count} giao dịch mẫu.`);
    return;
  }

  const target = Number(process.argv[2]) || 400;

  const members = await prisma.member.findMany({
    where: { active: true },
    select: { id: true },
  });
  if (members.length < 2) {
    console.error("Cần ít nhất 2 hội viên. Hãy chạy npm run nhap-hoi-vien trước.");
    process.exit(1);
  }

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    console.error("Chưa có tài khoản ban điều hành. Hãy chạy npm run db:seed trước.");
    process.exit(1);
  }

  // Tiếp tục đánh mã sau giao dịch cuối cùng của năm
  const year = new Date().getFullYear();
  const last = await prisma.deal.findFirst({
    where: { code: { startsWith: `GT${year}-` } },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  let seq = last ? Number(last.code.split("-")[1]) : 0;

  const statuses = [
    "DA_DUYET", "DA_DUYET", "DA_DUYET", "DA_DUYET", "DA_DUYET",
    "DA_DUYET", "DA_DUYET", "DA_DUYET", "CHO_DUYET", "CHO_DOI_TAC",
  ];

  const deals = [];
  for (let i = 0; i < target; i++) {
    const a = rnd(members.length);
    let b = rnd(members.length);
    if (b === a) b = (b + 1) % members.length;

    const status = statuses[rnd(statuses.length)];
    const dealDate = new Date(year, rnd(new Date().getMonth() + 1), 1 + rnd(28));
    seq++;

    deals.push({
      code: `GT${year}-${String(seq).padStart(4, "0")}`,
      sellerId: members[a].id,
      buyerId: members[b].id,
      referrerId: Math.random() < 0.25 ? members[rnd(members.length)].id : null,
      amount: (5 + rnd(500)) * 1_000_000,
      dealDate,
      description: `${MARK} Hợp đồng cung cấp hàng hoá / dịch vụ giữa hai hội viên`,
      status,
      createdByUserId: admin.id,
      createdSide: Math.random() < 0.5 ? "SELLER" : "BUYER",
      confirmedAt: status === "CHO_DOI_TAC" ? null : dealDate,
      reviewedAt: status === "DA_DUYET" ? dealDate : null,
      reviewedByUserId: status === "DA_DUYET" ? admin.id : null,
    });
  }

  for (let i = 0; i < deals.length; i += 200) {
    await prisma.deal.createMany({ data: deals.slice(i, i + 200) });
  }

  console.log(`Đã tạo ${deals.length} giao dịch mẫu giữa ${members.length} hội viên.`);
  console.log('Khi dùng thật, xoá sạch bằng: npm run giao-dich-mau -- --xoa');
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
