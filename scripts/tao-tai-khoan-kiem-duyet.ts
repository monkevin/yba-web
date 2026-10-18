import { prisma } from "../src/lib/prisma";
import { buildMemberSearchText } from "../src/lib/search";

/**
 * Tạo / phục hồi ba tài khoản hội viên cho bộ phận kiểm duyệt Zalo.
 *
 * VÌ SAO CẦN SCRIPT NÀY: Zalo chỉ duyệt Mini App khi người kiểm duyệt của họ
 * đăng nhập được bằng ba số dưới đây và xem được tính năng dành cho hội viên.
 * Đã bị từ chối HAI lần (V16 ngày 12/08/2026 và V21 ngày 25/08/2026) đúng vì
 * lý do này — lần thứ hai người kiểm duyệt chụp lại màn hình báo "Số điện
 * thoại của anh/chị chưa có trong danh sách hội viên Chi hội".
 *
 * Trước đây ba hồ sơ được thêm bằng tay ở /quan-tri/ho-so nên không ai dựng
 * lại được sau khi chúng biến mất. Viết thành script để chạy lại bao nhiêu lần
 * cũng ra cùng kết quả.
 *
 * CÁCH ĐĂNG NHẬP HOẠT ĐỘNG (src/lib/mobile-auth.ts → taoPhien): chỉ tra theo
 * `phone` + `active: true`. Hồ sơ bị ẩn khỏi danh bạ công khai VẪN đăng nhập
 * được — `publicVisible` và `profileStatus` không ảnh hưởng. Nhưng hồ sơ bị
 * XOÁ hoặc `active = false` thì người kiểm duyệt vào sẽ thành khách vãng lai.
 *
 * Số Zalo trả về dạng 84xxxxxxxxx, `chuanSoDienThoai()` đổi sang 0xxxxxxxxx —
 * nên trong này lưu đúng dạng có số 0 đầu.
 *
 * Xem trước:        npx tsx scripts/tao-tai-khoan-kiem-duyet.ts
 * Tạo / phục hồi:   npx tsx scripts/tao-tai-khoan-kiem-duyet.ts -- --ghi
 * Ẩn sau khi duyệt: npx tsx scripts/tao-tai-khoan-kiem-duyet.ts -- --ghi --an
 * Hiện lại:         npx tsx scripts/tao-tai-khoan-kiem-duyet.ts -- --ghi --hien
 */

/** Ba số do Zalo cung cấp trong thư từ chối. Đổi thì phải đổi cả ở đây. */
const TAI_KHOAN = [
  { stt: 1, phone: "0831111111" },
  { stt: 2, phone: "0768068594" },
  { stt: 3, phone: "0768068930" },
];

const ghi = process.argv.includes("--ghi");
const an = process.argv.includes("--an");
const hien = process.argv.includes("--hien");

if (an && hien) {
  console.error("Không thể vừa --an vừa --hien. Chọn một.");
  process.exit(1);
}

async function main() {
  // Ẩn khỏi danh bạ mặc định là KHÔNG: trong lúc chờ Zalo duyệt cứ để hiện
  // bình thường cho chắc, duyệt xong hẵng chạy lại với --an.
  const publicVisible = an ? false : true;

  console.log(
    ghi
      ? `Đang ${an ? "ẨN" : hien ? "HIỆN LẠI" : "tạo / phục hồi"} ba tài khoản kiểm duyệt…\n`
      : "XEM TRƯỚC — chưa ghi gì cả. Thêm `-- --ghi` để ghi thật.\n"
  );

  for (const tk of TAI_KHOAN) {
    const name = `Kiểm Duyệt Zalo ${tk.stt}`;
    const company = `TÀI KHOẢN KIỂM DUYỆT ZALO ${tk.stt}`;
    const code = `KDZ${String(tk.stt).padStart(3, "0")}`;
    const slug = `tai-khoan-kiem-duyet-zalo-${tk.stt}`;

    // Tìm theo SĐT trước — đó là thứ đăng nhập tra, và có thể hồ sơ đang mang
    // tên khác do ai đó sửa tay. Không thấy thì mới tìm theo mã.
    const dangCo =
      (await prisma.member.findFirst({ where: { phone: tk.phone } })) ??
      (await prisma.member.findUnique({ where: { code } }));

    const truong = {
      name,
      company,
      phone: tk.phone,
      position: "Tài khoản kiểm duyệt",
      memberType: "Hội viên",
      district: "Quận 5",
      offering: "Tài khoản kỹ thuật do Chi hội tạo để Zalo kiểm duyệt Mini App.",
      // Ba cờ quyết định việc đăng nhập và hiển thị
      active: true,
      publicVisible,
      profileStatus: "DA_DUYET",
      trangThai: "HOAT_DONG",
    };

    const searchText = buildMemberSearchText({ ...truong, code });

    if (!ghi) {
      const trangThai = dangCo
        ? dangCo.active
          ? "đã có, đang hoạt động"
          : "đã có nhưng active = false → sẽ bật lại"
        : "CHƯA CÓ → sẽ tạo mới";
      console.log(`  ${tk.phone}  ${name.padEnd(20)} ${trangThai}`);
      continue;
    }

    const m = dangCo
      ? await prisma.member.update({
          where: { id: dangCo.id },
          data: { ...truong, searchText },
        })
      : await prisma.member.create({
          data: { ...truong, code, slug, searchText, joinedAt: new Date() },
        });

    console.log(
      `  ${m.phone}  ${m.name.padEnd(20)} ${dangCo ? "đã phục hồi" : "đã tạo mới"}` +
        `  (mã ${m.code}, ${m.publicVisible ? "hiện" : "ẩn"} ở danh bạ)`
    );
  }

  // Soát lại bằng đúng điều kiện mà đăng nhập dùng, không tin vào bước ghi ở trên
  console.log("\n— Soát lại bằng đúng điều kiện đăng nhập (phone + active) —");
  let du = 0;
  for (const tk of TAI_KHOAN) {
    const m = await prisma.member.findFirst({
      where: { phone: tk.phone, active: true },
      select: { name: true, publicVisible: true },
    });
    if (m) du++;
    console.log(
      m
        ? `  ✓ ${tk.phone}  đăng nhập được → ${m.name}` +
            (m.publicVisible ? "" : "  (ẩn khỏi danh bạ, không sao)")
        : `  ✗ ${tk.phone}  KHÔNG đăng nhập được`
    );
  }

  console.log(
    du === TAI_KHOAN.length
      ? `\n→ Đủ ${du}/3. Người kiểm duyệt Zalo vào được.`
      : `\n→ MỚI ${du}/3. Chưa gửi duyệt được.` + (ghi ? "" : " (đang xem trước)")
  );
}

main().finally(() => prisma.$disconnect());
