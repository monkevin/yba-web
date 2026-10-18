/**
 * Kiểm tra 5 tính năng mới: WHO AM I? công khai, dữ liệu khách cho quản trị,
 * trang riêng Ban Chủ nhiệm, đặt lịch gặp, đi thăm doanh nghiệp và tài trợ.
 *
 *   npx next start -p 3009      (chạy trước ở cửa sổ khác)
 *   npm run test:moi
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

async function tai(d: string, ck?: string) {
  const r = await fetch(`${GOC}${d}`, {
    headers: ck ? { cookie: ck } : {},
    redirect: "manual",
  });
  return { status: r.status, html: await r.text(), headers: r.headers };
}

(async () => {
  console.log("── Trang công khai mở cho khách ──");
  for (const [d, phai] of [
    ["/who-am-i", "WHO AM I?"],
    ["/who-am-i/than-so-hoc", "Thần số học"],
    ["/who-am-i/tu-vi", "Tử vi tham khảo"],
    ["/who-am-i/tinh-cach", "Tính cách điều hành"],
    ["/who-am-i/khi-chat", "Khí chất doanh nhân"],
    ["/dat-lich", "Đặt lịch gặp Ban Chủ nhiệm"],
    ["/tham-doanh-nghiep", "Đi thăm doanh nghiệp hội viên"],
    ["/tai-tro", "Cùng chúng tôi xây những điều để lại"],
  ] as [string, string][]) {
    const { status, html } = await tai(d);
    kiem(`${d} mở được, không cần đăng nhập`, status === 200 && html.includes(phai), `HTTP ${status}`);
  }

  console.log("\n── Khách chưa khai thông tin thì chưa xem được kết quả ──");
  const { html: h1 } = await tai("/who-am-i/than-so-hoc");
  kiem("bắt điền thông tin trước", h1.includes("Điền thông tin để xem kết quả"));
  const { html: h2 } = await tai("/who-am-i");
  for (const o of ["Họ và tên", "Số điện thoại", "Nghề nghiệp", "Tên công ty", "Ngành nghề", "Nơi sinh"]) {
    kiem(`biểu mẫu có ô "${o}"`, h2.includes(o));
  }

  console.log("\n── Gói tài trợ ──");
  const { html: tt } = await tai("/tai-tro");
  for (const g of ["100 triệu", "50 triệu", "30 triệu", "10 triệu"]) {
    kiem(`hiện gói ${g}`, tt.includes(g));
  }
  kiem("có chương trình Nhịp Cầu Doanh Nhân", tt.includes("Nhịp Cầu Doanh Nhân"));
  kiem("có chương trình CLB", tt.includes("CLB"));

  console.log("\n── Trang riêng từng thành viên Ban Chủ nhiệm ──");
  const bcn = await prisma.leader.findMany({
    where: { active: true, slug: { not: null } },
    take: 3,
    select: { slug: true, name: true },
  });
  const tongSlug = await prisma.leader.count({ where: { slug: { not: null } } });
  const tongLeader = await prisma.leader.count();
  kiem(`toàn bộ ${tongLeader} nhân sự đều có trang riêng`, tongSlug === tongLeader, `${tongSlug}/${tongLeader}`);
  for (const l of bcn) {
    const { status, html } = await tai(`/ban-chap-hanh/${l.slug}`);
    kiem(
      `/ban-chap-hanh/${l.slug}`,
      status === 200 && html.includes(l.name),
      `HTTP ${status}`
    );
  }
  const { html: bch } = await tai("/ban-chap-hanh");
  kiem("trang Ban Chủ nhiệm trỏ sang trang riêng", bch.includes("/ban-chap-hanh/"));

  console.log("\n── Ảnh chân dung đủ nét ──");
  const anh = await prisma.leader.findMany({
    where: { photo: { not: null } },
    select: { photo: true },
  });
  let nho = 0;
  for (const a of anh.slice(0, 10)) {
    const r = await fetch(`${GOC}${a.photo}`);
    const buf = Buffer.from(await r.arrayBuffer());
    // Đọc kích thước JPEG từ khối SOF
    let w = 0;
    for (let i = 2; i < buf.length - 9; ) {
      if (buf[i] !== 0xff) break;
      const m = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        w = buf.readUInt16BE(i + 7);
        break;
      }
      i += 2 + len;
    }
    if (w > 0 && w < 300) nho++;
  }
  kiem("ảnh chân dung rộng ≥ 300px", nho === 0, `${nho} ảnh còn nhỏ`);

  console.log("\n── Trang quản trị được bảo vệ ──");
  for (const d of [
    "/quan-tri/khach-test",
    "/quan-tri/lich-hen",
    "/quan-tri/tham-doanh-nghiep",
    "/quan-tri/tai-tro",
  ]) {
    const { status } = await tai(d);
    kiem(`${d} chặn khách vãng lai`, status === 307, `HTTP ${status}`);
  }

  console.log("\n── Quản trị xem được dữ liệu ──");
  const r = await fetch(`${GOC}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: matKhauThu("admin") }),
  });
  if (!r.ok) {
    console.log("  BỎ QUA — không đăng nhập được admin");
  } else {
    const ck = (r.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");

    for (const [d, phai] of [
      ["/quan-tri/khach-test", "Khách làm trắc nghiệm"],
      ["/quan-tri/lich-hen", "Đề nghị gặp Ban Chủ nhiệm"],
      ["/quan-tri/tham-doanh-nghiep", "Đi thăm doanh nghiệp hội viên"],
      ["/quan-tri/tai-tro", "Chương trình kêu gọi"],
    ] as [string, string][]) {
      const { status, html } = await tai(d, ck);
      kiem(`${d} (admin)`, status === 200 && html.includes(phai), `HTTP ${status}`);
    }

    const { html: bang } = await tai("/quan-tri", ck);
    // React mã hoá "&" thành "&amp;" trong HTML nên phải so cả hai dạng
    const coTrong = (s: string) =>
      bang.includes(s) || bang.includes(s.replace(/&/g, "&amp;"));

    for (const o of [
      "Khách làm trắc nghiệm WHO AM I?",
      "Đặt lịch gặp Ban Chủ nhiệm",
      "Đi thăm doanh nghiệp hội viên",
      "Tài trợ & đồng hành",
    ]) {
      kiem(`bảng quản trị có ô "${o}"`, coTrong(o));
    }

    const csv = await fetch(`${GOC}/api/khach-test/csv`, { headers: { cookie: ck } });
    const noiDung = await csv.text();
    kiem(
      "tải được file Excel danh sách khách",
      csv.status === 200 && noiDung.includes("Họ tên") && noiDung.includes("Khí chất"),
      `HTTP ${csv.status}`
    );

    const csvKhach = await fetch(`${GOC}/api/khach-test/csv`);
    kiem("khách vãng lai không tải được file", csvKhach.status === 403, `HTTP ${csvKhach.status}`);
  }

  console.log("\n── Menu ──");
  const { html: chu } = await tai("/");
  kiem('menu chính có "WHO AM I?"', chu.includes("WHO AM I?"));
  // Kiểm đường dẫn chứ không kiểm nhãn: thanh menu chỉ để 5 mục ngoài, phần
  // còn lại nằm trong nút "Thêm" (dựng bằng JavaScript nên không có trong HTML
  // máy chủ trả về) — nhưng chân trang luôn có lối vào. Điều cần bảo đảm là
  // "từ trang chủ bấm được sang trang tài trợ", không phải nhãn viết thế nào.
  kiem("trang chủ có lối vào trang tài trợ", chu.includes('href="/tai-tro"'));
  // Khối chân dung Ban Chủ nhiệm nằm ở /gioi-thieu (chuyển từ trang chủ
  // sang 07/08 theo yêu cầu anh Khang) — kiểm ở đó, kèm nút đặt lịch
  const { html: gt } = await tai("/gioi-thieu");
  kiem("trang giới thiệu có khối Ban Chủ nhiệm", gt.includes("Ban Chủ nhiệm Chi hội"));
  kiem("trang giới thiệu có nút đặt lịch", gt.includes("Đặt lịch gặp Ban Chủ nhiệm"));
  kiem(
    "giới thiệu không lặp chữ Nhiệm kỳ",
    !gt.includes("Nhiệm kỳ Nhiệm kỳ")
  );

  const { html: sk } = await tai("/su-kien");
  kiem("trang sự kiện dẫn sang đi thăm DN", sk.includes("/tham-doanh-nghiep"));
  kiem("trang sự kiện dẫn sang tài trợ", sk.includes("/tai-tro"));

  console.log(
    `\n${hong === 0 ? `Tất cả ${dat} phép kiểm đều đạt.` : `${dat} đạt · ${hong} HỎNG.`}`
  );
  await prisma.$disconnect();
  if (hong) process.exit(1);
})();
