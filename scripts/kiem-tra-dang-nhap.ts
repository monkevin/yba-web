/**
 * Kiểm tra đăng nhập bằng tên đăng nhập / số điện thoại, bộ giới hạn thử sai,
 * đường dẫn `?tiep=`, hiệu lực phiên sau khi đổi mật khẩu và mã hội viên kế tiếp.
 *
 *   npm run test:dangnhap            — phần THUẦN (không đụng CSDL)
 *   npm run test:dangnhap -- --csdl  — thêm phần CSDL: tạo hội viên + tài khoản
 *                                      tạm, thử tìm theo SĐT / SĐT trùng / khoá,
 *                                      mốc đổi mật khẩu, mã hội viên kế tiếp;
 *                                      xoá sạch khi xong
 *
 * Phần CSDL phải chạy qua khoá của nhóm (khoa-csdl.cjs) để không chồng với
 * script khác. Script không ghi SiteSetting nào.
 *
 * Script này import thẳng `src/lib/auth.ts` (ngoài Next) — đó cũng là cách canh
 * cho `cache` của React trong auth.ts không làm vỡ các script chạy bằng tsx.
 */
import bcrypt from "bcryptjs";
import { createHmac, randomBytes } from "crypto";
import { prisma } from "../src/lib/prisma";
import {
  BIEN_LECH_DONG_HO_MS,
  THOI_HAN_PHIEN_GIAY,
  createSessionValue,
  docPhien,
  laHttpsTuHeaders,
  phienConHieuLuc,
  readSessionValue,
  tuyChonCookiePhien,
} from "../src/lib/auth";
import {
  cheSoDienThoai,
  chuanSoDienThoai,
  laDauVaoSoDienThoai,
  laSoDienThoaiVN,
  soDienThoaiDeLuu,
} from "../src/lib/so-dien-thoai";
import {
  GIOI_HAN,
  bamIp,
  chuanDinhDanh,
  datLaiGioiHan,
  ghiThanhCong,
  ghiThatBai,
  kiemTraGioiHan,
  layIp,
  moTaThoiGianCho,
} from "../src/lib/gioi-han-dang-nhap";
import {
  hoiVienKhacCungSdt,
  laLoiTrungKhoa,
  loiMatKhauMoi,
  maHoiVienTiepTheo,
  soLonNhatMaHoiVien,
  taoMaHoiVien,
  timTaiKhoanDangNhap,
  xacThucDangNhap,
} from "../src/lib/dang-nhap";
import { TRANG_MAC_DINH, duongDanTiep } from "../src/app/login/duong-dan-tiep";

let dat = 0;
let hong = 0;

function kiem(ten: string, dieuKien: boolean, chiTiet = "") {
  if (dieuKien) {
    dat++;
    console.log(`PASS  ${ten}`);
  } else {
    hong++;
    console.log(`FAIL  ${ten}${chiTiet ? ` — ${chiTiet}` : ""}`);
  }
}

function bang<T>(ten: string, thuc: T, mong: T) {
  kiem(
    ten,
    thuc === mong,
    `nhận ${JSON.stringify(thuc)}, mong ${JSON.stringify(mong)}`,
  );
}

// ─── Phần thuần ────────────────────────────────────────────────────────────

function soatSoDienThoai() {
  console.log("\n── Số điện thoại ──");
  const ca: [string, string][] = [
    ["0903123456", "0903123456"],
    ["0903.123.456", "0903123456"],
    [" 0903 123 456 ", "0903123456"],
    ["0903-123-456", "0903123456"],
    ["+84 903 123 456", "0903123456"],
    ["+84903123456", "0903123456"],
    ["84903123456", "0903123456"],
    ["(+84) 903.123.456", "0903123456"],
    ["+84 (0) 903 123 456", "0903123456"],
    ["0084903123456", "0903123456"],
    ["903123456", "0903123456"],
    // Số 084… mất số 0 đầu: không được cắt nhầm tiền tố 84
    ["843123456", "0843123456"],
  ];
  for (const [vao, ra] of ca)
    bang(`chuanSoDienThoai(${JSON.stringify(vao)})`, chuanSoDienThoai(vao), ra);
  bang("chuanSoDienThoai(null) rỗng", chuanSoDienThoai(null), "");

  kiem("laSoDienThoaiVN 0903123456", laSoDienThoaiVN("0903123456"));
  kiem("laSoDienThoaiVN từ chối 9 số", !laSoDienThoaiVN("090312345"));
  kiem("laSoDienThoaiVN từ chối số bàn 11 số", !laSoDienThoaiVN("02838551234"));

  kiem("hv0018 không phải SĐT", !laDauVaoSoDienThoai("hv0018"));
  kiem("HV0001 không phải SĐT", !laDauVaoSoDienThoai("HV0001"));
  kiem("admin không phải SĐT", !laDauVaoSoDienThoai("admin"));
  kiem("+84 903 123 456 là SĐT", laDauVaoSoDienThoai("+84 903 123 456"));
  kiem("12345 không phải SĐT", !laDauVaoSoDienThoai("12345"));

  bang("soDienThoaiDeLuu rỗng → null", soDienThoaiDeLuu("  "), null);
  bang(
    "soDienThoaiDeLuu chuẩn hoá di động",
    soDienThoaiDeLuu("+84 903.123.456"),
    "0903123456",
  );
  bang(
    "soDienThoaiDeLuu giữ nguyên số bàn",
    soDienThoaiDeLuu("028 3855 1234"),
    "028 3855 1234",
  );
  bang("cheSoDienThoai", cheSoDienThoai("0903123456"), "0903 *** 456");
}

function soatDuongDanTiep() {
  console.log("\n── ?tiep= sau khi đăng nhập ──");
  const hopLe: [string, string][] = [
    ["/ngoi-nha", "/ngoi-nha"],
    ["/doanh-nghiep/cong-ty-abc", "/doanh-nghiep/cong-ty-abc"],
    [
      "/ngoi-nha/dau-tri/abc/bang?san-khau=1",
      "/ngoi-nha/dau-tri/abc/bang?san-khau=1",
    ],
    ["/tai-khoan#muc", "/tai-khoan#muc"],
  ];
  for (const [vao, ra] of hopLe) bang(`nhận ${vao}`, duongDanTiep(vao), ra);

  const khongHopLe = [
    "//x",
    "//evil.example/a",
    "/\\x",
    "/\\evil.example",
    "\\\\evil.example",
    "https://x",
    "http://evil.example",
    "javascript:alert(1)",
    "/\t/evil.example",
    "/\n/evil.example",
    " /tai-khoan",
    "x",
    "",
    "/login",
    "/login?tiep=/x",
    "/api/auth/logout",
    // `..` bị bộ phân giải URL rút gọn thành "//evil.example" = tên miền khác
    "/..//evil.example",
    "/./..//evil.example",
    "/%2e%2e//evil.example",
    "/%2E%2E//evil.example",
    "/a/../..//evil.example",
    "/..///evil.example",
    "/..//evil.example?x=1#y",
    "/..//login",
  ];
  for (const vao of khongHopLe) {
    bang(`từ chối ${JSON.stringify(vao)}`, duongDanTiep(vao), TRANG_MAC_DINH);
  }
  bang("null → mặc định", duongDanTiep(null), TRANG_MAC_DINH);
}

function soatGioiHan() {
  console.log("\n── Giới hạn thử sai ──");
  datLaiGioiHan();
  const t0 = 1_800_000_000_000;
  const tk = chuanDinhDanh("hv0999");
  const tkKhac = chuanDinhDanh("hv0998");
  const may = bamIp("10.0.0.1");
  const mayKhac = bamIp("10.0.0.2");

  bang(
    "chuanDinhDanh gộp hoa/thường + khoảng trắng",
    chuanDinhDanh("  HV0999 "),
    tk,
  );
  bang(
    "chuanDinhDanh gộp các dạng SĐT",
    chuanDinhDanh("+84 903 123 456"),
    chuanDinhDanh("0903.123.456"),
  );
  kiem(
    "tên đăng nhập và SĐT là hai khoá khác nhau",
    chuanDinhDanh("0903123456") !== chuanDinhDanh("hv0903"),
  );

  for (let i = 1; i < GIOI_HAN.soSaiMoiCap; i++) {
    bang(`sai lần ${i} chưa bị chờ`, ghiThatBai(tk, may, t0 + i), 0);
  }
  kiem("sau 4 lần sai vẫn được thử", kiemTraGioiHan(tk, may, t0 + 10).choPhep);
  bang("sai lần 5 → chờ 30 giây", ghiThatBai(tk, may, t0 + 10), 30);

  const chan = kiemTraGioiHan(tk, may, t0 + 1010);
  kiem("đang chờ thì bị chặn", !chan.choPhep);
  bang("còn 29 giây", chan.choPhep ? -1 : chan.conLaiGiay, 29);
  kiem(
    "cùng máy, định danh KHÁC không bị ảnh hưởng",
    kiemTraGioiHan(tkKhac, may, t0 + 1000).choPhep,
  );
  kiem(
    "cùng định danh, máy KHÁC không bị ảnh hưởng (không khoá tài khoản)",
    kiemTraGioiHan(tk, mayKhac, t0 + 1000).choPhep,
  );

  kiem(
    "hết 30 giây được thử lại",
    kiemTraGioiHan(tk, may, t0 + 31_000).choPhep,
  );
  bang("sai tiếp → chờ lùi dần 60 giây", ghiThatBai(tk, may, t0 + 31_000), 60);
  bang("sai tiếp nữa → 120 giây", ghiThatBai(tk, may, t0 + 92_000), 120);

  ghiThanhCong(tk, may);
  kiem("đăng nhập đúng xoá đếm", kiemTraGioiHan(tk, may, t0 + 93_000).choPhep);
  bang(
    "sau khi xoá, sai 1 lần chưa bị chờ",
    ghiThatBai(tk, may, t0 + 94_000),
    0,
  );

  // Mức chờ trần 15 phút
  datLaiGioiHan();
  let cho = 0;
  let t = t0;
  for (let i = 0; i < 20; i++) {
    const c = kiemTraGioiHan(tk, may, t);
    if (!c.choPhep) t += c.conLaiGiay * 1000;
    cho = ghiThatBai(tk, may, t);
  }
  bang("mức chờ không quá 15 phút", cho, GIOI_HAN.choToiDaMs / 1000);

  // Lặng đủ lâu thì quên
  datLaiGioiHan();
  for (let i = 0; i < 3; i++) ghiThatBai(tk, may, t0 + i);
  bang(
    "sau 16 phút lặng, đếm lại từ đầu",
    ghiThatBai(tk, may, t0 + 16 * 60_000),
    0,
  );
  for (let i = 0; i < 3; i++) ghiThatBai(tk, may, t0 + 16 * 60_000 + i);
  bang("…đủ 5 lần mới bị chờ", ghiThatBai(tk, may, t0 + 16 * 60_000 + 10), 30);

  // Trần theo máy: dò lần lượt nhiều tên đăng nhập
  datLaiGioiHan();
  for (let i = 0; i < GIOI_HAN.soSaiMoiMay; i++) {
    ghiThatBai(chuanDinhDanh(`hv${String(i).padStart(4, "0")}`), may, t0 + i);
  }
  const tran = kiemTraGioiHan(chuanDinhDanh("hv7777"), may, t0 + 100);
  kiem("50 lần sai từ một máy → chặn cả định danh mới", !tran.choPhep);
  kiem(
    "máy khác vẫn thử được",
    kiemTraGioiHan(chuanDinhDanh("hv7777"), mayKhac, t0 + 100).choPhep,
  );
  kiem(
    "hết cửa sổ 15 phút thì máy được thử lại",
    kiemTraGioiHan(chuanDinhDanh("hv7777"), may, t0 + 15 * 60_000 + 1000)
      .choPhep,
  );
  datLaiGioiHan();

  bang("bamIp ổn định", bamIp("1.2.3.4"), bamIp("1.2.3.4"));
  kiem(
    "bamIp không lộ IP",
    !bamIp("1.2.3.4").includes("1.2.3.4") && bamIp("1.2.3.4").length === 32,
  );
  bang(
    "layIp lấy phần tử cuối X-Forwarded-For (Nginx nối IP thật)",
    layIp(new Headers({ "x-forwarded-for": "6.6.6.6, 1.1.1.1" })),
    "1.1.1.1",
  );
  bang(
    "layIp dùng X-Real-IP khi không có XFF",
    layIp(new Headers({ "x-real-ip": "2.2.2.2" })),
    "2.2.2.2",
  );
  bang("layIp không có header", layIp(new Headers()), "khong-ro");
  bang("moTaThoiGianCho 45", moTaThoiGianCho(45), "45 giây");
  bang("moTaThoiGianCho 120", moTaThoiGianCho(120), "2 phút");
}

/**
 * Trần theo ĐỊNH DANH — lớp chặn kẻ xấu tự khai `X-Forwarded-For` khác nhau mỗi
 * lần gửi (vào thẳng cổng 3002 thì Next chỉ điền IP socket khi header vắng).
 */
function soatTranDinhDanh() {
  console.log("\n── Trần theo định danh (chống giả IP) ──");
  datLaiGioiHan();
  const t0 = 1_800_000_000_000;
  const tk = chuanDinhDanh("hv0018");

  // Mỗi lần thử là "một máy mới": chỉ trần theo định danh còn tác dụng
  let doanDuoc = 0;
  for (let i = 0; i < 200; i++) {
    const may = bamIp(`203.0.113.${i % 256}`);
    if (kiemTraGioiHan(tk, may, t0 + i).choPhep) {
      doanDuoc++;
      ghiThatBai(tk, may, t0 + i);
    }
  }
  bang(
    "giả IP mỗi lần vẫn chỉ thử được tối đa trần định danh",
    doanDuoc,
    GIOI_HAN.soSaiMoiDinhDanh,
  );

  // Chờ cố định, không nhân đôi → không ai "khoá" được tài khoản người khác lâu
  const dangCho = kiemTraGioiHan(tk, bamIp("198.51.100.7"), t0 + 300);
  kiem("chạm trần định danh thì phải chờ", !dangCho.choPhep);
  bang(
    "chờ đúng mức cố định",
    dangCho.choPhep ? -1 : dangCho.conLaiGiay,
    GIOI_HAN.choDinhDanhMs / 1000,
  );
  kiem(
    "hết thời gian chờ là thử lại được ngay (không khoá tài khoản)",
    kiemTraGioiHan(
      tk,
      bamIp("198.51.100.7"),
      t0 + GIOI_HAN.choDinhDanhMs + 1000,
    ).choPhep,
  );

  // Định danh KHÁC không bị ảnh hưởng
  kiem(
    "định danh khác vẫn vào bình thường",
    kiemTraGioiHan(chuanDinhDanh("hv0019"), bamIp("203.0.113.9"), t0 + 300)
      .choPhep,
  );

  // Đăng nhập đúng xoá cả đếm theo định danh (chính chủ không phải chịu lịch sử
  // của kẻ đang dò tên mình)
  datLaiGioiHan();
  const mayChu = bamIp("192.168.1.55");
  for (let i = 0; i < GIOI_HAN.soSaiMoiDinhDanh - 1; i++) {
    ghiThatBai(tk, bamIp(`203.0.113.${i}`), t0 + i);
  }
  ghiThanhCong(tk, mayChu);
  bang(
    "đăng nhập đúng xoá đếm định danh",
    ghiThatBai(tk, bamIp("203.0.113.200"), t0 + 500),
    0,
  );

  // Máy KHÔNG RÕ địa chỉ: không được gộp chung một xô rồi chặn cả Chi hội
  datLaiGioiHan();
  const mayMo = bamIp(layIp(new Headers()));
  for (let i = 0; i < GIOI_HAN.soSaiMoiMay + 10; i++) {
    ghiThatBai(chuanDinhDanh(`hv${String(i).padStart(4, "0")}`), mayMo, t0 + i);
  }
  kiem(
    "không rõ IP: sai nhiều của người khác không chặn người thứ hai",
    kiemTraGioiHan(chuanDinhDanh("hv7777"), mayMo, t0 + 200).choPhep,
  );
  bang(
    "không rõ IP: vẫn đếm theo cặp như thường",
    ghiThatBai(chuanDinhDanh("hv0000"), mayMo, t0 + 200),
    0,
  );

  // Người dùng thật gõ sai vài lần KHÔNG được chạm trần định danh
  datLaiGioiHan();
  let chamTran = false;
  for (let i = 0; i < 4; i++) {
    if (ghiThatBai(chuanDinhDanh("hv0020"), mayChu, t0 + i * 1000) >= 60)
      chamTran = true;
  }
  kiem("gõ sai 4 lần chưa chạm trần định danh", !chamTran);
  datLaiGioiHan();
}

/**
 * Cookie phiên đời cũ (trước 20/09/2026) — payload chỉ có `uid`, không có `iat`.
 * Ký tay ở đây vì `createSessionValue` luôn gắn `iat`; cần bản không `iat` để
 * chắc chắn máy chủ không coi phiên thiếu mốc là phiên mới.
 */
function cookiePhienDoiCu(uid: string): string {
  const secret = process.env.SESSION_SECRET || "dev-secret-change-me";
  const payload = Buffer.from(JSON.stringify({ uid }), "utf8").toString(
    "base64url",
  );
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

/**
 * VIỆC 1 — đổi mật khẩu phải đá các phiên đăng nhập cũ.
 *
 * Cookie phiên ký HMAC sống 30 ngày và máy chủ không giữ danh sách phiên, nên
 * chỉ có mốc `User.passwordChangedAt` mới vô hiệu hoá được phiên đã bị lấy cắp.
 */
function soatPhienSauDoiMatKhau() {
  console.log("\n── Phiên sau khi đổi mật khẩu ──");

  const t = 1_800_000_000_000;
  const gt = createSessionValue("u-abc", t);

  bang("docPhien giữ nguyên uid", docPhien(gt)?.uid, "u-abc");
  bang("docPhien giữ nguyên iat", docPhien(gt)?.iat, t);
  bang("readSessionValue vẫn trả uid", readSessionValue(gt), "u-abc");
  bang("chữ ký sai → null", docPhien(gt.slice(0, -1) + "0"), null);
  bang("payload bị sửa → null", docPhien("x" + gt), null);
  bang("cookie rỗng → null", docPhien(undefined), null);

  // Chưa từng đổi mật khẩu: giữ nguyên như cũ, không ai bị đá
  kiem(
    "chưa từng đổi mật khẩu → phiên nào cũng vào được",
    phienConHieuLuc(t, null),
  );
  kiem(
    "chưa từng đổi mật khẩu + cookie đời cũ (không iat) → vẫn vào được",
    phienConHieuLuc(null, null),
  );

  const doiLuc = new Date(t);
  kiem(
    "phiên cấp TRƯỚC lúc đổi mật khẩu → bị vô hiệu",
    !phienConHieuLuc(t - 60_000, doiLuc),
  );
  kiem(
    "phiên cấp SAU lúc đổi mật khẩu → vào được",
    phienConHieuLuc(t + 1, doiLuc),
  );
  kiem("phiên cấp ĐÚNG lúc đổi → vào được", phienConHieuLuc(t, doiLuc));
  kiem(
    "phiên cũ 30 ngày (đúng hạn cookie) vẫn bị vô hiệu",
    !phienConHieuLuc(t - THOI_HAN_PHIEN_GIAY * 1000, doiLuc),
  );
  kiem(
    "cookie đời cũ không có iat + đã đổi mật khẩu → bị vô hiệu",
    !phienConHieuLuc(docPhien(cookiePhienDoiCu("u-abc"))!.iat, doiLuc),
  );
  bang(
    "cookie đời cũ đọc ra iat = null",
    docPhien(cookiePhienDoiCu("u-abc"))?.iat,
    null,
  );

  // Biên lệch đồng hồ 5 giây: mốc trong CSDL và `iat` lúc ký cookie là hai
  // đường ghi khác nhau, chênh vài mili giây là chuyện thường
  bang("biên lệch đồng hồ đúng 5 giây", BIEN_LECH_DONG_HO_MS, 5000);
  kiem(
    "lệch 4,999 giây vẫn vào được",
    phienConHieuLuc(t - (BIEN_LECH_DONG_HO_MS - 1), doiLuc),
  );
  kiem(
    "lệch đúng 5 giây vẫn vào được",
    phienConHieuLuc(t - BIEN_LECH_DONG_HO_MS, doiLuc),
  );
  kiem(
    "lệch 5,001 giây thì bị đá",
    !phienConHieuLuc(t - (BIEN_LECH_DONG_HO_MS + 1), doiLuc),
  );
  kiem(
    "biên không nuốt mất phiên cũ vài phút",
    !phienConHieuLuc(t - 5 * 60_000, doiLuc),
  );

  // Cấp lại cookie ngay sau khi ghi mốc: người vừa đổi mật khẩu không tự đá mình
  const mocDoi = new Date(t);
  const cookieMoi = docPhien(createSessionValue("u-abc", mocDoi.getTime()));
  kiem(
    "cookie cấp lại sau khi đổi mật khẩu còn hiệu lực",
    phienConHieuLuc(cookieMoi!.iat, mocDoi),
  );

  // Tuỳ chọn cookie dùng chung cho lúc đăng nhập và lúc cấp lại
  const ch = tuyChonCookiePhien(false);
  bang("cookie phiên 30 ngày", ch.maxAge, 60 * 60 * 24 * 30);
  kiem("cookie httpOnly + SameSite lax", ch.httpOnly && ch.sameSite === "lax");
  bang("http trong LAN → không gắn Secure", ch.secure, false);
  bang("https → gắn Secure", tuyChonCookiePhien(true).secure, true);

  bang(
    "X-Forwarded-Proto https → Secure",
    laHttpsTuHeaders(new Headers({ "x-forwarded-proto": "https" })),
    true,
  );
  bang(
    "X-Forwarded-Proto nhiều chặng lấy chặng đầu",
    laHttpsTuHeaders(new Headers({ "x-forwarded-proto": "https, http" })),
    true,
  );
  bang(
    "X-Forwarded-Proto http → không Secure (điện thoại vào LAN)",
    laHttpsTuHeaders(new Headers({ "x-forwarded-proto": "http" })),
    false,
  );
  bang(
    "không có XFF thì xét Origin của server action",
    laHttpsTuHeaders(new Headers({ origin: "https://ybacholon.vn" })),
    true,
  );
  bang(
    "Origin http://<IP LAN>:3002 → không Secure",
    laHttpsTuHeaders(new Headers({ origin: "http://192.168.1.9:3002" })),
    false,
  );
  bang(
    "không có header nào → không Secure",
    laHttpsTuHeaders(new Headers()),
    false,
  );
}

function soatMatKhauVaMa() {
  console.log("\n── Mật khẩu mới & mã hội viên ──");
  kiem("từ chối 123456", !!loiMatKhauMoi("123456"));
  kiem("từ chối 12345678", !!loiMatKhauMoi("12345678"));
  kiem("từ chối ngắn hơn 8", !!loiMatKhauMoi("Ab1!x"));
  kiem(
    "từ chối trùng tên đăng nhập",
    !!loiMatKhauMoi("hv0018hv", { tenDangNhap: "hv0018" }),
  );
  kiem(
    "từ chối bằng đúng tên đăng nhập",
    !!loiMatKhauMoi("admin123", { tenDangNhap: "admin123" }),
  );
  kiem(
    "từ chối chứa SĐT",
    !!loiMatKhauMoi("x0903123456", { soDienThoai: "0903.123.456" }),
  );
  kiem("từ chối khoảng trắng đầu/cuối", !!loiMatKhauMoi(" MatKhau2026 "));
  kiem("từ chối một ký tự lặp", !!loiMatKhauMoi("aaaaaaaaa"));
  bang(
    "nhận mật khẩu tốt",
    loiMatKhauMoi("Cho Lon 2026!", {
      tenDangNhap: "hv0018",
      soDienThoai: "0903123456",
    }),
    null,
  );
  bang(
    "admin đặt lại tối thiểu 6",
    loiMatKhauMoi("k7p2qx", { toiThieu: 6 }),
    null,
  );

  bang(
    "mã lớn nhất bỏ qua KDZ003 và so bằng số",
    soLonNhatMaHoiVien([
      "HV0001",
      "HV9999",
      "HV10000",
      "KDZ003",
      "hv20000",
      "HV12a",
      "ZZZ999",
    ]),
    10000,
  );
  bang("không có mã HV → 0", soLonNhatMaHoiVien(["KDZ001", "KDZ003"]), 0);
  bang("taoMaHoiVien(258)", taoMaHoiVien(258), "HV0258");
  bang("taoMaHoiVien(10001)", taoMaHoiVien(10001), "HV10001");
}

// ─── Phần CSDL ─────────────────────────────────────────────────────────────

async function chayCsdl() {
  console.log("\n── CSDL: tìm tài khoản theo tên / SĐT ──");
  const hau = randomBytes(4).toString("hex");
  const matKhau = `Thu-${hau}-2026`;
  const hash = await bcrypt.hash(matKhau, 10);

  // SĐT chưa ai dùng (kể cả hồ sơ đã ngừng sinh hoạt)
  let so = "";
  for (let i = 0; i < 20 && !so; i++) {
    const thu =
      "09" +
      String(randomBytes(4).readUInt32BE(0) % 100_000_000).padStart(8, "0");
    if ((await prisma.member.count({ where: { phone: thu } })) === 0) so = thu;
  }
  if (!so) throw new Error("Không tìm được SĐT trống để thử");

  const memberIds: string[] = [];
  const userIds: string[] = [];
  const taoHoiVien = async (
    hauTo: string,
    code: string,
    phone: string | null,
  ) => {
    const m = await prisma.member.create({
      data: {
        code,
        slug: `thu-dang-nhap-${hau}-${hauTo}`,
        name: `Người thử đăng nhập ${hauTo}`,
        company: `DN THỬ ĐĂNG NHẬP ${hau} ${hauTo}`,
        phone,
        active: true,
        publicVisible: false,
      },
    });
    memberIds.push(m.id);
    return m;
  };

  try {
    const a = await taoHoiVien("a", `TDN${hau}A`.toUpperCase(), so);
    // Tên đăng nhập KHÁC mã hội viên (như dữ liệu thật sau lần đánh lại mã)
    const ten = `tk${hau}a`;
    const ua = await prisma.user.create({
      data: {
        username: ten,
        name: "Tài khoản thử",
        passwordHash: hash,
        role: "MEMBER",
        memberId: a.id,
      },
    });
    userIds.push(ua.id);

    bang("tìm theo tên đăng nhập", (await timTaiKhoanDangNhap(ten))?.id, ua.id);
    bang(
      "tên đăng nhập gõ HOA + khoảng trắng",
      (await timTaiKhoanDangNhap(`  ${ten.toUpperCase()} `))?.id,
      ua.id,
    );
    bang("tìm theo SĐT", (await timTaiKhoanDangNhap(so))?.id, ua.id);
    bang(
      "tìm theo SĐT dạng +84",
      (
        await timTaiKhoanDangNhap(
          `+84 ${so.slice(1, 4)} ${so.slice(4, 7)} ${so.slice(7)}`,
        )
      )?.id,
      ua.id,
    );
    bang(
      "tìm theo SĐT có dấu chấm",
      (
        await timTaiKhoanDangNhap(
          `${so.slice(0, 4)}.${so.slice(4, 7)}.${so.slice(7)}`,
        )
      )?.id,
      ua.id,
    );
    bang(
      "mã hội viên KHÔNG đăng nhập được",
      await timTaiKhoanDangNhap(a.code),
      null,
    );

    bang(
      "xác thực SĐT + mật khẩu đúng",
      (await xacThucDangNhap(so, matKhau))?.id,
      ua.id,
    );
    bang("sai mật khẩu → null", await xacThucDangNhap(so, matKhau + "x"), null);
    bang(
      "mật khẩu có khoảng trắng thừa → null (không trim)",
      await xacThucDangNhap(ten, ` ${matKhau}`),
      null,
    );

    // Không có tài khoản vẫn phải chạy bcrypt (thời gian tương đương).
    // Đo NHIỀU LẦN và lấy lần NHANH NHẤT: máy đang chạy bộ test khác thì một
    // lần đo lẻ vọt lên vài giây, báo hỏng oan (đã gặp 20/09/2026).
    const doNhanhNhat = async (dinhDanh: string) => {
      let min = Infinity;
      for (let i = 0; i < 4; i++) {
        const t = Date.now();
        await xacThucDangNhap(dinhDanh, "sai-mat-khau-de-do");
        min = Math.min(min, Date.now() - t);
      }
      return min;
    };
    await xacThucDangNhap(ten, "ham-nong-bcrypt"); // lần đầu có chi phí khởi động
    const msKhongCo = await doNhanhNhat(`khong-co-ai-${hau}`);
    const msSai = await doNhanhNhat(ten);
    bang(
      "tài khoản không tồn tại → null",
      await xacThucDangNhap(`khong-co-ai-${hau}`, "gi-cung-duoc"),
      null,
    );
    kiem(
      "không tồn tại vẫn so bcrypt (thời gian cùng cỡ với sai mật khẩu)",
      msKhongCo >= 15 && msKhongCo * 3 >= msSai,
      `không có ${msKhongCo} ms, sai mật khẩu ${msSai} ms`,
    );

    console.log("\n── CSDL: SĐT trùng / khoá ──");
    const b = await taoHoiVien("b", `TDN${hau}B`.toUpperCase(), so);
    bang(
      "SĐT trùng 2 hội viên đang sinh hoạt → không tìm",
      await timTaiKhoanDangNhap(so),
      null,
    );
    bang(
      "SĐT trùng → đăng nhập bằng SĐT thất bại dù đúng mật khẩu",
      await xacThucDangNhap(so, matKhau),
      null,
    );
    bang(
      "SĐT trùng → tên đăng nhập vẫn vào được",
      (await xacThucDangNhap(ten, matKhau))?.id,
      ua.id,
    );
    bang(
      "hoiVienKhacCungSdt thấy hồ sơ trùng",
      (await hoiVienKhacCungSdt(so, a.id))?.id,
      b.id,
    );

    await prisma.member.update({
      where: { id: b.id },
      data: { active: false },
    });
    bang(
      "hồ sơ trùng đã ngừng sinh hoạt → SĐT dùng lại được",
      (await timTaiKhoanDangNhap(so))?.id,
      ua.id,
    );
    bang(
      "hoiVienKhacCungSdt bỏ qua hồ sơ ngừng sinh hoạt",
      await hoiVienKhacCungSdt(so, a.id),
      null,
    );

    await prisma.user.update({ where: { id: ua.id }, data: { active: false } });
    bang(
      "tài khoản bị khoá → tên đăng nhập không vào",
      await xacThucDangNhap(ten, matKhau),
      null,
    );
    bang(
      "tài khoản bị khoá → SĐT không vào",
      await xacThucDangNhap(so, matKhau),
      null,
    );
    await prisma.user.update({ where: { id: ua.id }, data: { active: true } });

    await prisma.member.update({
      where: { id: a.id },
      data: { active: false },
    });
    bang(
      "hội viên ngừng sinh hoạt → SĐT không vào",
      await timTaiKhoanDangNhap(so),
      null,
    );
    await prisma.member.update({ where: { id: a.id }, data: { active: true } });

    // Ban Chủ nhiệm đánh dấu rời hội: giữ hồ sơ nhưng không đăng nhập bằng SĐT
    await prisma.member.update({
      where: { id: a.id },
      data: { trangThai: "ROI_HOI" },
    });
    bang(
      "hội viên đã rời hội → SĐT không vào",
      await timTaiKhoanDangNhap(so),
      null,
    );
    bang(
      "hội viên đã rời hội → tên đăng nhập vẫn do User.active quyết",
      (await xacThucDangNhap(ten, matKhau))?.id,
      ua.id,
    );
    await prisma.member.update({
      where: { id: a.id },
      data: { trangThai: "HOAT_DONG" },
    });

    // Hồ sơ rời hội giữ số cũ KHÔNG được chặn hội viên đang sinh hoạt
    await prisma.member.update({
      where: { id: b.id },
      data: { active: true, trangThai: "ROI_HOI" },
    });
    bang(
      "hồ sơ trùng SĐT nhưng đã rời hội → người đang sinh hoạt vẫn vào được",
      (await timTaiKhoanDangNhap(so))?.id,
      ua.id,
    );
    bang(
      "hoiVienKhacCungSdt bỏ qua hồ sơ đã rời hội",
      await hoiVienKhacCungSdt(so, a.id),
      null,
    );
    await prisma.member.update({
      where: { id: b.id },
      data: { active: false, trangThai: "HOAT_DONG" },
    });

    // Hội viên có SĐT nhưng chưa có tài khoản web
    const c = await taoHoiVien("c", `TDN${hau}C`.toUpperCase(), null);
    const soC = so.slice(0, -1) + ((Number(so.slice(-1)) + 1) % 10);
    if ((await prisma.member.count({ where: { phone: soC } })) === 0) {
      await prisma.member.update({ where: { id: c.id }, data: { phone: soC } });
      bang(
        "SĐT của hội viên chưa có tài khoản → null",
        await timTaiKhoanDangNhap(soC),
        null,
      );
    }

    console.log("\n── CSDL: mốc đổi mật khẩu đá phiên cũ ──");
    const iatPhienCu = Date.now() - 60_000;
    bang(
      "tài khoản mới chưa có mốc đổi mật khẩu",
      (
        await prisma.user.findUnique({
          where: { id: ua.id },
          select: { passwordChangedAt: true },
        })
      )?.passwordChangedAt,
      null,
    );
    kiem(
      "…nên phiên cũ của tài khoản đó không bị ảnh hưởng",
      phienConHieuLuc(iatPhienCu, null),
    );

    const mocDoi = new Date();
    await prisma.user.update({
      where: { id: ua.id },
      data: { passwordChangedAt: mocDoi },
    });
    const luu = (
      await prisma.user.findUnique({
        where: { id: ua.id },
        select: { passwordChangedAt: true },
      })
    )?.passwordChangedAt;
    kiem(
      "CSDL giữ đúng mốc vừa ghi",
      !!luu && Math.abs(luu.getTime() - mocDoi.getTime()) < 1000,
      `nhận ${luu?.toISOString()}, ghi ${mocDoi.toISOString()}`,
    );
    kiem(
      "phiên lấy trộm trước khi đổi mật khẩu → bị vô hiệu",
      !phienConHieuLuc(iatPhienCu, luu ?? null),
    );
    kiem(
      "cookie cấp lại ngay lúc đổi → chính trình duyệt đang dùng vẫn vào được",
      phienConHieuLuc(
        docPhien(createSessionValue(ua.id, (luu ?? mocDoi).getTime()))!.iat,
        luu ?? null,
      ),
    );
    bang(
      "mốc đổi mật khẩu KHÔNG đụng tới việc xác thực mật khẩu",
      (await xacThucDangNhap(ten, matKhau))?.id,
      ua.id,
    );
    await prisma.user.update({
      where: { id: ua.id },
      data: { passwordChangedAt: null },
    });

    console.log("\n── CSDL: mã hội viên kế tiếp ──");
    const tatCa = await prisma.member.findMany({ select: { code: true } });
    const lonNhat = tatCa
      .map((m) => /^HV(\d+)$/.exec(m.code))
      .reduce((max, m) => (m ? Math.max(max, Number(m[1])) : max), 0);
    const maCuDesc = (
      await prisma.member.findFirst({
        orderBy: { code: "desc" },
        select: { code: true },
      })
    )?.code;
    console.log(
      `      (mã lớn nhất theo thứ tự chuỗi: ${maCuDesc}; mã HV lớn nhất: ${taoMaHoiVien(lonNhat)})`,
    );

    // Hồ sơ mã lạ xếp sau "HV" theo chuỗi — cách cũ sẽ vớ phải nó
    await taoHoiVien("z", `ZZZ${hau}`.toUpperCase(), null);
    const ke = await maHoiVienTiepTheo();
    bang(
      "mã kế tiếp = HV lớn nhất + 1, bỏ qua KDZ/ZZZ",
      ke,
      taoMaHoiVien(lonNhat + 1),
    );
    kiem(
      "mã kế tiếp chưa ai dùng",
      (await prisma.member.count({ where: { code: ke } })) === 0,
    );

    await taoHoiVien("h", taoMaHoiVien(lonNhat + 5), null);
    bang(
      "có HV lớn hơn → lấy số đó + 1",
      await maHoiVienTiepTheo(),
      taoMaHoiVien(lonNhat + 6),
    );
    const tenChiemCho = taoMaHoiVien(lonNhat + 6).toLowerCase();
    if (!(await prisma.user.findUnique({ where: { username: tenChiemCho } }))) {
      const u2 = await prisma.user.create({
        data: {
          username: tenChiemCho,
          name: "Thử chiếm tên",
          passwordHash: hash,
          role: "MEMBER",
        },
      });
      userIds.push(u2.id);
      bang(
        "kết nạp: tên đăng nhập cùng số đã có → nhảy số tiếp",
        await maHoiVienTiepTheo(true),
        taoMaHoiVien(lonNhat + 7),
      );
      bang(
        "không cần tên đăng nhập → giữ số",
        await maHoiVienTiepTheo(false),
        taoMaHoiVien(lonNhat + 6),
      );
    }

    let bat = false;
    try {
      await prisma.member.create({
        data: {
          code: a.code,
          slug: `thu-dang-nhap-${hau}-trung`,
          name: "x",
          company: "x",
        },
      });
    } catch (e) {
      bat = laLoiTrungKhoa(e);
    }
    kiem("trùng mã hội viên nhận ra là P2002", bat);
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.member.deleteMany({ where: { id: { in: memberIds } } });
    // Phòng khi tạo dở: xoá theo slug tạm
    await prisma.member.deleteMany({
      where: { slug: { startsWith: `thu-dang-nhap-${hau}-` } },
    });
    console.log("Đã xoá hội viên + tài khoản thử");
  }
}

async function main() {
  soatSoDienThoai();
  soatDuongDanTiep();
  soatGioiHan();
  soatTranDinhDanh();
  soatPhienSauDoiMatKhau();
  soatMatKhauVaMa();
  if (process.argv.includes("--csdl")) await chayCsdl();
  console.log(`\n${dat} đạt, ${hong} hỏng`);
  if (hong) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
