/**
 * Kiểm tra khối fanpage doanh nghiệp ở cuối hồ sơ hội viên.
 *
 *   npx next start -p 3009      (chạy trước ở cửa sổ khác)
 *   npm run test:fanpage
 *
 * Bài kiểm tự gắn fanpage thử cho một hội viên rồi GỠ RA sau khi xong — không
 * để lại dữ liệu bịa trong hồ sơ doanh nghiệp thật.
 */
import { chuanFanpage } from "../src/components/web/FanpageHoiVien";
import { prisma } from "../src/lib/prisma";

const GOC = process.env.URL_THU ?? "http://localhost:3009";

let dat = 0;
let hong = 0;

function kiem(ten: string, dung: boolean, chiTiet = "") {
  if (dung) {
    dat++;
    console.log(`  PASS  ${ten}`);
  } else {
    hong++;
    console.log(`  FAIL  ${ten}${chiTiet ? ` — ${chiTiet}` : ""}`);
  }
}

async function html(d: string): Promise<string> {
  const r = await fetch(`${GOC}${d}`, { cache: "no-store" });
  return r.text();
}

(async () => {
  console.log("── Lọc đường dẫn fanpage ──");
  const hopLe: [string, string][] = [
    ["facebook.com/ybacholon", "https://www.facebook.com/ybacholon"],
    ["https://www.facebook.com/YBAHCMC", "https://www.facebook.com/YBAHCMC"],
    ["https://m.facebook.com/abc/", "https://www.facebook.com/abc"],
    ["fb.com/tencongty", "https://www.facebook.com/tencongty"],
  ];
  for (const [vao, ra] of hopLe) {
    kiem(`nhận "${vao}"`, chuanFanpage(vao) === ra, `ra ${chuanFanpage(vao)}`);
  }

  const khongHopLe = [
    "",
    "   ",
    "monamie.vn",
    "https://zalo.me/123",
    "https://www.facebook.com/groups/doanhnhan",
    "https://www.facebook.com/events/12345",
    "https://www.facebook.com/watch/?v=1",
    "https://www.facebook.com/profile.php?id=100001",
    "https://www.facebook.com",
    "https://facebook.com.kegia.vn/lua-dao",
    "không phải link",
  ];
  for (const v of khongHopLe) {
    kiem(`loại "${v.slice(0, 34) || "(trống)"}"`, chuanFanpage(v) === null);
  }

  console.log("\n── Hiển thị trên hồ sơ công khai ──");
  const m = await prisma.member.findFirst({
    where: { active: true, publicVisible: true, profileStatus: "DA_DUYET" },
    select: { id: true, slug: true, company: true, facebook: true },
    orderBy: { code: "asc" },
  });
  if (!m) {
    console.log("  Không có hồ sơ công khai nào để thử.");
    process.exit(1);
  }

  const cu = m.facebook;
  try {
    // Chưa khai fanpage thì KHÔNG được hiện khối rỗng
    await prisma.member.update({ where: { id: m.id }, data: { facebook: null } });
    const khong = await html(`/doanh-nghiep/${m.slug}`);
    kiem("chưa khai fanpage thì không hiện khối", !khong.includes("Fanpage doanh nghiệp"));

    // Link không phải trang Facebook cũng không được nhúng
    await prisma.member.update({
      where: { id: m.id },
      data: { facebook: "https://www.facebook.com/groups/thu-nghiem" },
    });
    const nhom = await html(`/doanh-nghiep/${m.slug}`);
    kiem("link nhóm Facebook thì không nhúng", !nhom.includes("Fanpage doanh nghiệp"));

    // Khai đúng fanpage thì hiện khung nhúng + liên kết mở thẳng
    await prisma.member.update({
      where: { id: m.id },
      data: { facebook: "facebook.com/ybacholon" },
    });
    const co = await html(`/doanh-nghiep/${m.slug}`);
    kiem("khai fanpage thì hiện khối", co.includes("Fanpage doanh nghiệp"));
    kiem(
      "có khung nhúng Facebook Page Plugin",
      co.includes("facebook.com/plugins/page.php")
    );
    kiem("khung nhúng trỏ đúng fanpage đã khai", co.includes("ybacholon"));
    kiem("có liên kết mở thẳng fanpage", co.includes("Mở fanpage"));
    kiem("có lối thoát khi trình duyệt chặn iframe", co.includes("đang chặn khung Facebook"));
    kiem("khung nhúng tải chậm (loading=lazy)", co.includes('loading="lazy"'));
    kiem(
      "khối fanpage nằm dưới bài giới thiệu",
      co.indexOf("Giới thiệu doanh nghiệp") < co.indexOf("Fanpage doanh nghiệp")
    );
  } finally {
    await prisma.member.update({ where: { id: m.id }, data: { facebook: cu } });
  }

  const conSot = await prisma.member.count({
    where: { facebook: { contains: "ybacholon" } },
  });
  kiem("đã gỡ hết fanpage thử khỏi hồ sơ doanh nghiệp", conSot === 0);

  console.log(
    `\n${hong === 0 ? `Tất cả ${dat} phép kiểm đều đạt.` : `${dat} đạt · ${hong} HỎNG.`}`
  );
  await prisma.$disconnect();
  if (hong) process.exit(1);
})();
