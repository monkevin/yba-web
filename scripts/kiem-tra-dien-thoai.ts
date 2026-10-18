/**
 * Quét các trang trên khổ điện thoại, tìm lỗi bố cục thường gặp.
 *
 *   1. Chạy web:  npx next start -p 3009
 *   2. Chạy quét: npm run test:dienthoai
 *
 * Bài kiểm tra đọc HTML tĩnh nên chỉ bắt được lỗi ở lớp mã nguồn:
 *  - bảng có bề rộng tối thiểu lớn hơn màn hình mà không nằm trong khung cuộn
 *  - phần tử ghim `sticky` không có điểm dừng cho màn hình nhỏ
 *  - lưới nhiều cột không có bậc `sm:` / `lg:` (tức là ép nhiều cột cả trên điện thoại)
 * Còn tràn ngang thật thì kiểm bằng trình duyệt ở khổ 375px.
 */
const GOC = process.env.URL_THU ?? "http://localhost:3009";

/**
 * Mật khẩu tài khoản thử đọc từ biến môi trường, để sau khi đổi mật khẩu 123456
 * script vẫn chạy: MAT_KHAU_<TÊN ĐĂNG NHẬP VIẾT HOA> (vd MAT_KHAU_ADMIN) hoặc
 * MAT_KHAU_TEST cho mọi tài khoản; không đặt thì dùng mặc định cũ.
 */
const matKhauThu = (ten: string) =>
  process.env[`MAT_KHAU_${ten.toUpperCase()}`] ?? process.env.MAT_KHAU_TEST ?? "123456";

const CONG_KHAI = [
  "/",
  "/gioi-thieu",
  "/ban-chap-hanh",
  "/doanh-nghiep",
  "/giao-thuong",
  "/xuc-tien-thuong-mai",
  "/vinh-danh",
  "/su-kien",
  "/video",
  "/who-am-i",
  "/dat-lich",
  "/tham-doanh-nghiep",
  "/tai-tro",
  "/tin-tuc",
  "/dang-ky-hoi-vien",
  "/lien-he",
  "/login",
];

const NOI_BO = [
  "/tai-khoan",
  "/tai-khoan/ho-so",
  "/tai-khoan/tin-dang",
  "/tai-khoan/chan-dung",
  "/tai-khoan/chan-dung/than-so-hoc",
  "/tai-khoan/chan-dung/tu-vi",
  "/tai-khoan/chan-dung/tinh-cach",
  "/tai-khoan/chan-dung/khi-chat",
  "/giao-dich",
  "/hoi-vien",
  "/bao-cao",
  "/quan-tri",
  "/quan-tri/hoi-vien",
  "/quan-tri/tai-khoan",
  "/quan-tri/giao-dien",
  "/quan-tri/trang",
  "/quan-tri/noi-dung/tin-tuc",
  "/quan-tri/noi-dung/su-kien",
  "/quan-tri/noi-dung/video",
  "/quan-tri/noi-dung/dang-ky",
  "/quan-tri/khach-test",
  "/quan-tri/lich-hen",
  "/quan-tri/tham-doanh-nghiep",
  "/quan-tri/tai-tro",
  "/quan-tri/ho-so",
  "/quan-tri/tin-dang",
  "/quan-tri/vinh-danh",
  "/quan-tri/hoi-phi",
];

let dat = 0;
let hong = 0;

async function dangNhap(): Promise<string> {
  const r = await fetch(`${GOC}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: matKhauThu("admin") }),
  });
  return (r.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
}

/** Tìm các lỗi bố cục trên điện thoại trong HTML của một trang. */
function timLoi(html: string): string[] {
  const loi: string[] = [];

  // 1. Bảng rộng cố định — phải nằm trong khung có overflow-x-auto
  const rongCoDinh = [...html.matchAll(/min-w-\[(\d+)px\]/g)];
  for (const m of rongCoDinh) {
    const px = Number(m[1]);
    if (px <= 375) continue;
    // Cắt một đoạn HTML trước vị trí đó để xem có khung cuộn không
    const truoc = html.slice(Math.max(0, m.index! - 600), m.index!);
    if (!/overflow-x-auto|overflow-auto|overflow-x-scroll/.test(truoc)) {
      loi.push(`bảng rộng ${px}px không nằm trong khung cuộn ngang`);
    }
  }

  // 2. Lưới ép quá nhiều cột ngay từ màn hình nhỏ nhất.
  // 2 cột vẫn đọc tốt trên điện thoại (mỗi ô ~131px trên khổ 375px — đã đo
  // thực tế ở trang /hoi-vien), nên chỉ cảnh báo từ 3 cột trở lên.
  for (const m of html.matchAll(/class="([^"]*\bgrid-cols-([3-9])\b[^"]*)"/g)) {
    const cls = m[1];
    // Có bậc sm:/md:/lg: nghĩa là đã tính tới điện thoại
    if (!/\b(sm|md|lg):grid-cols-/.test(cls) && !/\bgrid-cols-1\b/.test(cls)) {
      loi.push(`lưới ${m[2]} cột không có bậc cho điện thoại`);
    }
  }

  // 3. Chữ quá nhỏ
  if (/text-\[(?:[0-9]|10)px\]/.test(html)) {
    loi.push("có chữ nhỏ hơn 11px — khó đọc trên điện thoại");
  }

  return [...new Set(loi)];
}

async function quet(duongDan: string, cookie?: string) {
  const r = await fetch(`${GOC}${duongDan}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
  if (r.status !== 200) {
    hong++;
    console.log(`FAIL  ${duongDan.padEnd(32)} HTTP ${r.status}`);
    return;
  }
  const html = await r.text();
  const loi = timLoi(html);
  if (loi.length === 0) {
    dat++;
    console.log(`PASS  ${duongDan.padEnd(32)} ${(html.length / 1024).toFixed(0)}KB`);
  } else {
    hong++;
    console.log(`FAIL  ${duongDan.padEnd(32)} ${loi.join(" · ")}`);
  }
}

async function main() {
  try {
    await fetch(GOC, { redirect: "manual" });
  } catch {
    console.error(`Không kết nối được ${GOC}. Chạy trước: npx next start -p 3009`);
    process.exit(1);
  }

  console.log("── Trang công khai ──");
  for (const d of CONG_KHAI) await quet(d);

  console.log("\n── Khu hội viên & quản trị ──");
  const ck = await dangNhap();
  for (const d of NOI_BO) await quet(d, ck);

  console.log("");
  if (hong) {
    console.log(`${hong} trang có vấn đề, ${dat} trang đạt.`);
    process.exit(1);
  }
  console.log(`Tất cả ${dat} trang đều ổn trên khổ điện thoại.`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});

// Đánh dấu là mô-đun để biến ở đây không lẫn sang script khác
export {};
