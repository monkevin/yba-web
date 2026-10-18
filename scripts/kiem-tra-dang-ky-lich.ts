/**
 * Kiểm tra luồng đăng ký tham gia / tài trợ một hoạt động trong lịch.
 *
 *   npx next start -p 3009      (chạy trước ở cửa sổ khác)
 *   npm run test:dangky
 */
import { prisma } from "../src/lib/prisma";

const GOC = process.env.URL_THU ?? "http://localhost:3009";

/**
 * Mật khẩu tài khoản thử đọc từ biến môi trường, để sau khi đổi mật khẩu 123456
 * script vẫn chạy: MAT_KHAU_<TÊN ĐĂNG NHẬP VIẾT HOA> (vd MAT_KHAU_ADMIN) hoặc
 * MAT_KHAU_TEST cho mọi tài khoản; không đặt thì dùng mặc định cũ.
 */
const matKhauThu = (ten: string) =>
  process.env[`MAT_KHAU_${ten.toUpperCase()}`] ?? process.env.MAT_KHAU_TEST ?? "123456";

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

(async () => {
  console.log("── Dữ liệu ──");
  const tong = await prisma.lichHoatDong.count();
  const coSlug = await prisma.lichHoatDong.count({ where: { slug: { not: null } } });
  kiem("mọi hoạt động đều có trang riêng", coSlug === tong, `${coSlug}/${tong}`);

  const moDangKy = await prisma.lichHoatDong.count({
    where: { published: true, choDangKy: true },
  });
  kiem("có hoạt động đang mở đăng ký", moDangKy > 0, `${moDangKy} mục`);

  const muc = await prisma.lichHoatDong.findFirst({
    where: { published: true, choDangKy: true, tuNgay: { gte: new Date() } },
    select: { id: true, slug: true, tieuDe: true },
  });
  if (!muc) {
    console.log("  BỎ QUA — không có hoạt động sắp tới nào đang mở đăng ký");
    await prisma.$disconnect();
    return;
  }

  console.log(`\n── Trang chi tiết: ${muc.tieuDe.slice(0, 40)} ──`);
  const r = await fetch(`${GOC}/lich-hoat-dong/${muc.slug}`);
  const html = await r.text();
  kiem("mở được trang chi tiết", r.status === 200, `HTTP ${r.status}`);
  for (const t of ["Đăng ký tham gia", "Tham gia", "Tài trợ", "Họ và tên", "Số điện thoại"]) {
    kiem(`trang có "${t}"`, html.includes(t));
  }
  kiem("khách chưa đăng nhập được mời đăng nhập", html.includes("Đăng nhập"));

  console.log("\n── Ghi nhận đăng ký ──");
  // Mô phỏng đúng những gì server action ghi khi khách gửi form
  const khach = await prisma.dangKyHoatDong.create({
    data: {
      lichId: muc.id,
      name: "Nguyễn Văn Thử",
      phone: "0903000222",
      company: "Công ty Thử Nghiệm",
      loai: "THAM_GIA",
      soNguoi: 2,
    },
  });
  kiem("đăng ký mới ở trạng thái chờ duyệt", khach.status === "CHO_DUYET");

  const html2 = await (await fetch(`${GOC}/lich-hoat-dong/${muc.slug}`)).text();
  kiem(
    "chưa duyệt thì KHÔNG hiện tên trên web",
    !html2.includes("Nguyễn Văn Thử")
  );

  await prisma.dangKyHoatDong.update({
    where: { id: khach.id },
    data: { status: "DA_DUYET" },
  });
  const html3 = await (await fetch(`${GOC}/lich-hoat-dong/${muc.slug}`)).text();
  kiem("duyệt xong thì hiện tên trên web", html3.includes("Nguyễn Văn Thử"));
  kiem("hiện số người đi kèm", html3.includes("(+1 người)"));

  // Nhà tài trợ
  const nhaTT = await prisma.dangKyHoatDong.create({
    data: {
      lichId: muc.id,
      name: "Trần Thử Tài Trợ",
      phone: "0903000333",
      company: "Công ty Tài Trợ Thử",
      loai: "TAI_TRO",
      mucTaiTro: "Vàng",
      soTien: 30_000_000,
      status: "DA_DUYET",
      doBTCThem: true,
    },
  });
  const html4 = await (await fetch(`${GOC}/lich-hoat-dong/${muc.slug}`)).text();
  kiem("hiện nhà tài trợ đã duyệt", html4.includes("Công ty Tài Trợ Thử"));
  kiem("hiện mức tài trợ", html4.includes("Vàng"));
  kiem("hiện số tiền quy đổi", html4.includes("30 triệu"));

  console.log("\n── Quản trị ──");
  const login = await fetch(`${GOC}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: matKhauThu("admin") }),
  });
  if (!login.ok) {
    console.log("  BỎ QUA — không đăng nhập được admin");
  } else {
    const ck = (login.headers.getSetCookie?.() ?? [])
      .map((c) => c.split(";")[0])
      .join("; ");
    const qt = await fetch(`${GOC}/quan-tri/lich-hoat-dong`, {
      headers: { cookie: ck },
    });
    const h = await qt.text();
    kiem("trang quản trị lịch mở được", qt.status === 200, `HTTP ${qt.status}`);
    kiem("quản trị thấy đăng ký của khách", h.includes("Nguyễn Văn Thử"));
    kiem("quản trị thấy nhà tài trợ", h.includes("Công ty Tài Trợ Thử"));
    kiem("có nút Ban Tổ chức thêm người", h.includes("Ban Tổ chức thêm người"));
  }

  const khachChan = await fetch(`${GOC}/quan-tri/lich-hoat-dong`, {
    redirect: "manual",
  });
  kiem("khách vãng lai không vào được quản trị", khachChan.status === 307);

  // Dọn dữ liệu thử
  await prisma.dangKyHoatDong.deleteMany({
    where: { id: { in: [khach.id, nhaTT.id] } },
  });
  console.log("\nĐã xoá dữ liệu thử.");

  console.log(
    `\n${hong === 0 ? `Tất cả ${dat} phép kiểm đều đạt.` : `${dat} đạt · ${hong} HỎNG.`}`
  );
  await prisma.$disconnect();
  if (hong) process.exit(1);
})();
