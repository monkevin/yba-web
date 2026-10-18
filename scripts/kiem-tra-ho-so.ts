/**
 * Kiểm tra quy tắc hiển thị hồ sơ doanh nghiệp công khai.
 *   npm run test:hoso
 *
 * Chạy trực tiếp trên CSDL (không cần server), kiểm tra đúng bộ điều kiện
 * PUBLIC_MEMBER mà mọi trang công khai đều dùng.
 */
import { PrismaClient } from "@prisma/client";
import { PUBLIC_MEMBER } from "../src/lib/public";

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
  const m = await prisma.member.findFirst({
    where: { id, ...PUBLIC_MEMBER },
    select: { id: true },
  });
  return !!m;
}

async function main() {
  const goc = await prisma.member.findFirst({ orderBy: { code: "asc" } });
  if (!goc) throw new Error("Chưa có hội viên nào để kiểm tra.");

  const cu = {
    profileStatus: goc.profileStatus,
    publicVisible: goc.publicVisible,
    active: goc.active,
  };

  try {
    await prisma.member.update({
      where: { id: goc.id },
      data: { profileStatus: "DA_DUYET", publicVisible: true, active: true },
    });
    kiemTra("hồ sơ đã duyệt thì hiện công khai", await hienCongKhai(goc.id));

    await prisma.member.update({
      where: { id: goc.id },
      data: { profileStatus: "CHO_DUYET" },
    });
    kiemTra(
      "hồ sơ vừa sửa (chờ duyệt) vẫn hiện, không biến mất khỏi web",
      await hienCongKhai(goc.id)
    );

    await prisma.member.update({
      where: { id: goc.id },
      data: { profileStatus: "NHAP" },
    });
    kiemTra(
      "hồ sơ bị Ban Chủ nhiệm trả lại thì ẩn khỏi công khai",
      !(await hienCongKhai(goc.id))
    );

    await prisma.member.update({
      where: { id: goc.id },
      data: { profileStatus: "DA_DUYET", publicVisible: false },
    });
    kiemTra(
      "hội viên tự tắt hiển thị thì ẩn khỏi công khai",
      !(await hienCongKhai(goc.id))
    );

    await prisma.member.update({
      where: { id: goc.id },
      data: { publicVisible: true, active: false },
    });
    kiemTra(
      "hội viên đã ngưng sinh hoạt thì ẩn khỏi công khai",
      !(await hienCongKhai(goc.id))
    );
  } finally {
    await prisma.member.update({ where: { id: goc.id }, data: cu });
  }

  console.log("");
  if (hong) {
    console.log(`${hong} quy tắc SAI, ${dat} đúng.`);
    process.exit(1);
  }
  console.log(`Tất cả ${dat} quy tắc hiển thị hồ sơ đều đúng.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
