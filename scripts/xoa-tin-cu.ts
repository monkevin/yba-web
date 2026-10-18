/** Xoá toàn bộ tin mua/bán hiện có (dọn trước khi khởi tạo lại). npm run xoa-tin-cu */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

prisma.listingContact
  .deleteMany()
  .then(() => prisma.listing.deleteMany())
  .then((r) => console.log(`Đã xoá ${r.count} tin mua/bán.`))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
