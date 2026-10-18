/**
 * Kiểm tra quy tắc hiển thị tin nhu cầu mua / bán trên chợ công khai.
 *   npm run test:tin
 */
import { PrismaClient } from "@prisma/client";
import { TRANG_THAI_TIN, ngayHetHan } from "../src/lib/listing";
import { publicListing } from "../src/lib/public";

const prisma = new PrismaClient();

let dat = 0;
let hong = 0;

function kiemTra(ten: string, dung: boolean) {
  if (dung) {
    dat++;
    console.log(`PASS  ${ten}`);
  } else {
    hong++;
    console.log(`FAIL  ${ten}`);
  }
}

async function hienCongKhai(id: string) {
  return !!(await prisma.listing.findFirst({
    where: { id, ...publicListing() },
    select: { id: true },
  }));
}

async function main() {
  const tin = await prisma.listing.findFirst({
    orderBy: { createdAt: "asc" },
    include: { member: { select: { id: true, publicVisible: true, active: true } } },
  });
  if (!tin) throw new Error("Chưa có tin nào để kiểm tra.");

  const cuTin = { status: tin.status, expiresAt: tin.expiresAt };
  const cuHoiVien = {
    publicVisible: tin.member.publicVisible,
    active: tin.member.active,
  };

  const daQua = new Date();
  daQua.setDate(daQua.getDate() - 1);

  try {
    await prisma.member.update({
      where: { id: tin.member.id },
      data: { publicVisible: true, active: true },
    });

    await prisma.listing.update({
      where: { id: tin.id },
      data: { status: TRANG_THAI_TIN.DANG_HIEN, expiresAt: ngayHetHan() },
    });
    kiemTra("tin đang hiển thị, còn hạn thì hiện trên chợ", await hienCongKhai(tin.id));

    await prisma.listing.update({
      where: { id: tin.id },
      data: { status: TRANG_THAI_TIN.CHO_DUYET },
    });
    kiemTra("tin chờ duyệt KHÔNG lộ ra chợ công khai", !(await hienCongKhai(tin.id)));

    await prisma.listing.update({
      where: { id: tin.id },
      data: { status: TRANG_THAI_TIN.TU_CHOI },
    });
    kiemTra("tin bị Ban Chủ nhiệm gỡ thì biến mất khỏi chợ", !(await hienCongKhai(tin.id)));

    await prisma.listing.update({
      where: { id: tin.id },
      data: { status: TRANG_THAI_TIN.AN },
    });
    kiemTra("tin hội viên tự ẩn thì không hiện", !(await hienCongKhai(tin.id)));

    await prisma.listing.update({
      where: { id: tin.id },
      data: { status: TRANG_THAI_TIN.DANG_HIEN, expiresAt: daQua },
    });
    kiemTra("tin quá hạn thì tự rơi khỏi chợ", !(await hienCongKhai(tin.id)));

    await prisma.listing.update({
      where: { id: tin.id },
      data: { expiresAt: ngayHetHan() },
    });
    await prisma.member.update({
      where: { id: tin.member.id },
      data: { publicVisible: false },
    });
    kiemTra(
      "doanh nghiệp ẩn hồ sơ thì tin của họ cũng ẩn theo",
      !(await hienCongKhai(tin.id))
    );
  } finally {
    await prisma.listing.update({ where: { id: tin.id }, data: cuTin });
    await prisma.member.update({ where: { id: tin.member.id }, data: cuHoiVien });
  }

  console.log("");
  if (hong) {
    console.log(`${hong} quy tắc SAI, ${dat} đúng.`);
    process.exit(1);
  }
  console.log(`Tất cả ${dat} quy tắc hiển thị tin đăng đều đúng.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
