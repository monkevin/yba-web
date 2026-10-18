import { prisma } from "../src/lib/prisma";

/**
 * Kiểm tra thứ tự hiển thị ưu đãi trong Mini App:
 *   nhà tài trợ chiến lược → ưu đãi được ghim → còn lại mới nhất trước.
 *
 * Phép thử phải có ưu đãi của HAI doanh nghiệp khác nhau mới có ý nghĩa: đánh
 * dấu nhà tài trợ cho doanh nghiệp có ưu đãi KHÔNG ghim, rồi xem nó có vượt
 * lên trên ưu đãi đang ghim của doanh nghiệp kia không.
 *
 * CHỈ dùng trên máy làm việc. Chạy: npx tsx scripts/thu-thu-tu-uu-dai.ts
 */

const THU_TU = [
  { member: { nhaTaiTroChienLuoc: "desc" as const } },
  { pinned: "desc" as const },
  { createdAt: "desc" as const },
];

const doc = () =>
  prisma.uuDai.findMany({
    where: { status: "DANG_HIEN" },
    orderBy: THU_TU,
    select: {
      title: true,
      pinned: true,
      member: { select: { id: true, company: true, nhaTaiTroChienLuoc: true } },
    },
  });

const in_ = (nhan: string, ds: Awaited<ReturnType<typeof doc>>) => {
  console.log(`— ${nhan} —`);
  ds.forEach((u, i) =>
    console.log(
      `  ${i + 1}. ghim=${u.pinned ? "CÓ " : "không"} · tàiTrợ=${u.member.nhaTaiTroChienLuoc ? "CÓ " : "không"} · ${u.title.slice(0, 38)}`
    )
  );
};

async function main() {
  // Duyệt hết ưu đãi đang chờ để có đủ chủ khác nhau mà so
  const daDuyet = await prisma.uuDai.updateMany({
    where: { status: "CHO_DUYET" },
    data: { status: "DANG_HIEN" },
  });
  if (daDuyet.count) console.log(`(đã duyệt ${daDuyet.count} ưu đãi đang chờ để lấy mẫu thử)\n`);

  const truoc = await doc();
  in_("Trước", truoc);

  const dauTien = truoc[0];
  const khac = truoc.find((u) => u.member.id !== dauTien?.member.id);
  if (!dauTien || !khac) {
    return console.log("\nChưa đủ ưu đãi của hai doanh nghiệp khác nhau để thử.");
  }

  console.log(`\n→ Đánh dấu "${khac.member.company.slice(0, 45)}" là nhà tài trợ chiến lược`);
  console.log("   (doanh nghiệp này đang xếp SAU, không được ghim)\n");

  await prisma.member.update({
    where: { id: khac.member.id },
    data: { nhaTaiTroChienLuoc: true },
  });

  const sau = await doc();
  in_("Sau", sau);

  const dung = sau[0]?.member.id === khac.member.id;
  console.log(
    `\n${dung ? "ĐÚNG" : "SAI"}: nhà tài trợ chiến lược ${dung ? "đã vượt lên trên cả ưu đãi được ghim" : "KHÔNG lên đầu"}`
  );

  await prisma.member.update({
    where: { id: khac.member.id },
    data: { nhaTaiTroChienLuoc: false },
  });
  console.log("(đã trả lại nguyên trạng cờ nhà tài trợ)");
}

main().finally(() => prisma.$disconnect());
