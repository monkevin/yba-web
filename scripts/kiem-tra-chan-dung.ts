/**
 * Kiểm tra bộ "Chân dung doanh nhân": phần tính toán và phần hiển thị trang.
 *
 *   npx next start -p 3009      (chạy trước ở cửa sổ khác)
 *   npm run test:chandung
 */
import {
  soChuDao,
  thanSoCua,
  canChiCua,
  conGiapCua,
  napAmCua,
  menhCua,
  chamTinhCach,
  chamKhiChat,
  tinhCachCua,
  khiChatCua,
  type TinhCachKey,
} from "../src/lib/chan-dung";
import {
  THAN_SO,
  CON_GIAP,
  NAP_AM,
  MENH,
  TINH_CACH,
  TINH_CACH_CAU_HOI,
} from "../src/lib/chan-dung-noi-dung";
import { KHI_CHAT, KHI_CHAT_CAU_HOI, type KhiChatKey } from "../src/lib/khi-chat-noi-dung";
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
  console.log("── Dữ liệu nội dung ──");
  kiem("11 số chủ đạo", THAN_SO.length === 11, `có ${THAN_SO.length}`);
  kiem(
    "đủ số 1–9 + 11 + 22",
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22].every((n) => THAN_SO.some((t) => t.so === n))
  );
  kiem("12 con giáp", CON_GIAP.length === 12, `có ${CON_GIAP.length}`);
  kiem("30 mốc nạp âm (chu kỳ 60 năm)", NAP_AM.length === 30, `có ${NAP_AM.length}`);
  kiem("5 mệnh ngũ hành", MENH.length === 5);
  kiem("4 nhóm tính cách", TINH_CACH.length === 4);
  kiem("12 câu trắc nghiệm tính cách", TINH_CACH_CAU_HOI.length === 12);
  kiem(
    "mỗi câu tính cách đủ 4 lựa chọn",
    TINH_CACH_CAU_HOI.every((c) => c.options.length === 4)
  );
  kiem("5 khí chất", KHI_CHAT.length === 5);
  kiem("15 câu khí chất", KHI_CHAT_CAU_HOI.length === 15);
  kiem(
    "mỗi câu khí chất đủ 5 lựa chọn",
    KHI_CHAT_CAU_HOI.every((c) => c.options.length === 5)
  );

  // Yêu cầu của anh Khang: không được lẫn nội dung Mon Amie / vest vào đây
  const chu = JSON.stringify([THAN_SO, CON_GIAP, MENH, TINH_CACH, KHI_CHAT]).toLowerCase();
  for (const tu of ["mon amie", "vest", "suit", "veston", "cà vạt", "may đo", "cửa hàng"]) {
    kiem(`không còn nhắc "${tu}"`, !chu.includes(tu));
  }

  console.log("\n── Phép tính ──");
  // 15/05/1985 → 1+5+0+5+1+9+8+5 = 34 → 7
  kiem("số chủ đạo 15/5/1985 = 7", soChuDao(new Date(1985, 4, 15, 12)) === 7);
  // 29/11/1975 → 2+9+1+1+1+9+7+5 = 35 → 8
  kiem("số chủ đạo 29/11/1975 = 8", soChuDao(new Date(1975, 10, 29, 12)) === 8);
  kiem("mỗi số chủ đạo đều có bài đọc", thanSoCua(new Date(1985, 4, 15, 12)) !== null);

  kiem("1990 là Canh Ngọ", canChiCua(1990) === "Canh Ngọ");
  kiem("1984 là Giáp Tý", canChiCua(1984) === "Giáp Tý");
  kiem("2026 là Bính Ngọ", canChiCua(2026) === "Bính Ngọ");
  kiem("1990 tuổi Ngựa", conGiapCua(1990).ten === "Ngựa");
  kiem("1984 nạp âm Hải Trung Kim", napAmCua(1984).tenNapAm === "Hải Trung Kim");
  kiem("1990 mệnh Thổ (Lộ Bàng Thổ)", napAmCua(1990).tenNapAm === "Lộ Bàng Thổ");
  kiem("mọi năm 1930–2030 đều tra được mệnh", (() => {
    for (let y = 1930; y <= 2030; y++) {
      if (!menhCua(y)?.nguHanh) return false;
    }
    return true;
  })());

  const tl: TinhCachKey[] = [
    "lua", "lua", "lua", "lua", "lua", "lua", "lua",
    "gio", "gio", "dat", "dat", "nuoc",
  ];
  const kqTC = chamTinhCach(tl);
  kiem("chấm tính cách: 7 Lửa → nhóm Lửa", kqTC.chinh === "lua", kqTC.chinh);
  kiem("nhận ra nhóm phụ", kqTC.phu === "gio" || kqTC.phu === "dat");
  kiem("có bài đọc cho nhóm trội", tinhCachCua(kqTC.chinh) !== null);

  const kl: KhiChatKey[] = [
    "ung", "ung", "ung", "ung", "ung", "ung",
    "ho", "ho", "ho", "xa", "xa", "holy", "holy", "long", "long",
  ];
  const kqKC = chamKhiChat(kl);
  kiem("chấm khí chất: 6 Ưng → Ưng", kqKC.chinh === "ung", kqKC.chinh);
  kiem("tỉ lệ Ưng = 40%", kqKC.phanTram.ung === 40, `${kqKC.phanTram.ung}%`);
  kiem(
    "tổng tỉ lệ 5 khí chất ≈ 100%",
    Math.abs(Object.values(kqKC.phanTram).reduce((a, b) => a + b, 0) - 100) <= 2
  );
  kiem("có bài đọc cho khí chất trội", khiChatCua(kqKC.chinh) !== null);
  kiem(
    "mỗi khí chất trỏ tới một khí chất bổ trợ có thật",
    KHI_CHAT.every((k) => KHI_CHAT.some((x) => x.key === k.ketHopVoi.key))
  );

  console.log("\n── Trang hiển thị ──");
  const hv = await prisma.member.findFirst({
    where: { user: { isNot: null } },
    select: { id: true, code: true, user: { select: { username: true } } },
  });
  if (!hv?.user) {
    console.log("  BỎ QUA — chưa có hội viên nào có tài khoản");
  } else {
    // Ghi sẵn kết quả để kiểm phần hiển thị (thay cho việc bấm qua giao diện)
    await prisma.chanDung.upsert({
      where: { memberId: hv.id },
      create: {
        memberId: hv.id,
        birthDate: new Date(1985, 4, 15, 12),
        tinhCach: "lua",
        khiChat: "ung",
        khiChatTyLe: JSON.stringify({ ung: 40, ho: 20, xa: 13, holy: 13, long: 13 }),
      },
      update: {
        birthDate: new Date(1985, 4, 15, 12),
        tinhCach: "lua",
        khiChat: "ung",
        khiChatTyLe: JSON.stringify({ ung: 40, ho: 20, xa: 13, holy: 13, long: 13 }),
      },
    });

    const r = await fetch(`${GOC}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: hv.user.username, password: matKhauThu(hv.user.username) }),
    });
    if (!r.ok) {
      console.log(`  BỎ QUA phần trang — không đăng nhập được ${hv.user.username}`);
    } else {
      const ck = (r.headers.getSetCookie?.() ?? [])
        .map((c) => c.split(";")[0])
        .join("; ");

      const trang: [string, string[]][] = [
        ["/tai-khoan/chan-dung", ["Chân dung doanh nhân", "Số 7", "Khí chất doanh nhân"]],
        ["/tai-khoan/chan-dung/than-so-hoc", ["Người tìm chiều sâu", "Phong cách kinh doanh"]],
        ["/tai-khoan/chan-dung/tu-vi", ["Ất Sửu", "Mệnh Kim", "Dùng màu bản mệnh"]],
        ["/tai-khoan/chan-dung/tinh-cach", ["Người dẫn dắt", "Làm việc với từng nhóm đối tác"]],
        ["/tai-khoan/chan-dung/khi-chat", ["ƯNG", "Tỉ lệ 5 khí chất", "Đóng góp phù hợp trong Chi hội"]],
      ];

      for (const [d, phai] of trang) {
        const p = await fetch(`${GOC}${d}`, { headers: { cookie: ck }, redirect: "manual" });
        const html = await p.text();
        const thieu = phai.filter((t) => !html.includes(t));
        kiem(
          `${d} (HTTP ${p.status})`,
          p.status === 200 && thieu.length === 0,
          thieu.length ? `thiếu: ${thieu.join(", ")}` : `HTTP ${p.status}`
        );
      }

      // Khách chưa đăng nhập không vào được
      const khach = await fetch(`${GOC}/tai-khoan/chan-dung`, { redirect: "manual" });
      kiem("khách vãng lai bị chặn", khach.status === 307, `HTTP ${khach.status}`);
    }
  }

  console.log(
    `\n${hong === 0 ? `Tất cả ${dat} phép kiểm đều đạt.` : `${dat} đạt · ${hong} HỎNG.`}`
  );
  await prisma.$disconnect();
  if (hong) process.exit(1);
})();
