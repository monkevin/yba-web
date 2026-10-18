/**
 * Kiểm tra phân quyền bằng HTTP THẬT — bổ sung cho `test:phanquyen` (chỉ kiểm
 * tra hàm thuần). Bài này bắt được lỗi kiểu "quên gắn requireQuyen vào trang".
 *
 *   1. Chạy web ở một cổng bất kỳ:  npx next start -p 3009
 *   2. Chạy bài kiểm tra:           npm run test:quyenhttp
 *
 * Trang thiếu quyền phải trả HTTP 307 (chuyển hướng), KHÔNG được trả 200.
 */
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

/** Đăng nhập, trả về cookie phiên. */
async function dangNhap(username: string): Promise<string> {
  const res = await fetch(`${GOC}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: matKhauThu(username) }),
  });
  if (!res.ok) throw new Error(`Không đăng nhập được bằng ${username}`);
  const raw = res.headers.getSetCookie?.() ?? [];
  const ck = raw.map((c) => c.split(";")[0]).join("; ");
  if (!ck) throw new Error("Máy chủ không trả cookie phiên");
  return ck;
}

async function thu(
  cookie: string,
  user: string,
  duongDan: string,
  duocVao: boolean
) {
  const res = await fetch(`${GOC}${duongDan}`, {
    headers: { cookie },
    redirect: "manual",
  });
  const vao = res.status === 200;

  if (vao === duocVao) {
    dat++;
    console.log(`PASS  ${user.padEnd(9)} ${duongDan.padEnd(32)} HTTP ${res.status}`);
  } else {
    hong++;
    console.log(
      `FAIL  ${user.padEnd(9)} ${duongDan.padEnd(32)} HTTP ${res.status} — đáng lẽ ${
        duocVao ? "vào được" : "bị chặn"
      }`
    );
  }
}

/** [đường dẫn, có được vào không] */
const KICH_BAN: Record<string, [string, boolean][]> = {
  // Ban Truyền thông: tin tức + sự kiện + trang tĩnh
  bantt: [
    ["/quan-tri/noi-dung/tin-tuc", true],
    ["/quan-tri/noi-dung/su-kien", true],
    ["/quan-tri/trang", true],
    ["/quan-tri/tai-khoan", false],
    ["/quan-tri/tin-dang", false],
    ["/quan-tri/giao-dien", false],
    ["/quan-tri/vinh-danh", false],
    ["/quan-tri/hoi-phi", false],
    ["/quan-tri/hoi-vien", false],
  ],
  // Ban XTTM: giao dịch + tin đăng + vinh danh
  banxttm: [
    ["/quan-tri/tin-dang", true],
    ["/quan-tri/vinh-danh", true],
    ["/quan-tri/noi-dung/tin-tuc", false],
    ["/quan-tri/noi-dung/su-kien", false],
    ["/quan-tri/trang", false],
    ["/quan-tri/tai-khoan", false],
    ["/quan-tri/giao-dien", false],
  ],
  // Chủ nhiệm: toàn quyền
  admin: [
    ["/quan-tri/tai-khoan", true],
    ["/quan-tri/giao-dien", true],
    ["/quan-tri/trang", true],
    ["/quan-tri/tin-dang", true],
    ["/quan-tri/vinh-danh", true],
    ["/quan-tri/noi-dung/tin-tuc", true],
    ["/quan-tri/hoi-phi", true],
  ],
};

const NHAN: Record<string, string> = {
  bantt: "Ban Truyền thông",
  banxttm: "Ban Xúc tiến thương mại",
  admin: "Chủ nhiệm (toàn quyền)",
};

async function main() {
  // Máy chủ đã chạy chưa
  try {
    await fetch(GOC, { redirect: "manual" });
  } catch {
    console.error(
      `Không kết nối được ${GOC}.\nChạy web trước bằng: npx next start -p 3009`
    );
    process.exit(1);
  }

  for (const [user, ds] of Object.entries(KICH_BAN)) {
    console.log(`\n── ${NHAN[user]} (${user}) ──`);
    const cookie = await dangNhap(user);
    for (const [duongDan, duocVao] of ds) {
      await thu(cookie, user, duongDan, duocVao);
    }
  }

  console.log("");
  if (hong) {
    console.log(`${hong} quy tắc SAI, ${dat} đúng.`);
    process.exit(1);
  }
  console.log(`Tất cả ${dat} quy tắc phân quyền qua HTTP đều đúng.`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});

// Đánh dấu là mô-đun để biến ở đây không lẫn sang script khác
export {};
