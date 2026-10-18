/**
 * Điền mốc "Lịch sử hình thành" cho hồ sơ doanh nghiệp — CHỈ dùng dữ liệu có
 * thật trong hệ thống (năm thành lập, năm gia nhập Hội, chức vụ trong Hội).
 * Không bịa thêm bất kỳ mốc nào: hội viên tự bổ sung phần còn lại ở trang
 * "Hồ sơ doanh nghiệp" trong tài khoản của mình.
 *
 *   npm run lam-lich-su            (xem trước)
 *   npm run lam-lich-su -- --ghi   (ghi vào cơ sở dữ liệu)
 */
import { prisma } from "../src/lib/prisma";

const GHI = process.argv.includes("--ghi");

(async () => {
  const members = await prisma.member.findMany({
    select: {
      id: true,
      company: true,
      foundedYear: true,
      joinedAt: true,
      hoiRole: true,
      history: true,
    },
  });

  let viet = 0;
  let boQua = 0;

  for (const m of members) {
    // Hội viên đã tự viết lịch sử thì tuyệt đối không ghi đè
    if (m.history?.trim()) {
      boQua++;
      continue;
    }

    const moc: string[] = [];
    if (m.foundedYear) moc.push(`${m.foundedYear} | Doanh nghiệp được thành lập`);

    const namVao = m.joinedAt.getFullYear();
    if (!m.foundedYear || namVao !== m.foundedYear) {
      moc.push(`${namVao} | Gia nhập Chi hội Doanh nhân trẻ Chợ Lớn`);
    }
    if (m.hoiRole) {
      moc.push(`Hiện nay | Người đại diện giữ vai trò ${m.hoiRole}`);
    }

    // Chỉ có đúng một mốc "gia nhập" thì chưa thành một dòng thời gian
    if (moc.length < 2) {
      boQua++;
      continue;
    }

    viet++;
    if (GHI) {
      await prisma.member.update({
        where: { id: m.id },
        data: { history: moc.join("\n") },
      });
    } else if (viet <= 5) {
      console.log(`${m.company}\n  ${moc.join("\n  ")}\n`);
    }
  }

  console.log(`Viết lịch sử cho ${viet} hồ sơ · bỏ qua ${boQua}.`);
  if (!GHI) console.log('Chạy lại với "-- --ghi" để lưu.');
  await prisma.$disconnect();
})();
