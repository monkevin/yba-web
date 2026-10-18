/**
 * Kiểm tra quy tắc phân quyền chi tiết.
 *   npm run test:quyenchitiet
 *
 * Chạy trên hàm thuần trong `src/lib/quyen.ts`, không cần máy chủ.
 */
import {
  BO_QUYEN_MAU,
  NHOM_QUYEN,
  QUYEN,
  co,
  coMot,
  coQuyenQuanTri,
  docQuyen,
} from "../src/lib/quyen";

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

const chuNhiem = { role: "ADMIN", permissions: null };
const truyenThong = {
  role: "STAFF",
  permissions: JSON.stringify([QUYEN.NOI_DUNG_VIET, QUYEN.SU_KIEN_QUAN_LY]),
};
const canBoTrong = { role: "STAFF", permissions: null };
const hoiVien = { role: "MEMBER", permissions: null };

function main() {
  console.log("── Chủ nhiệm (ADMIN) ──");
  kiemTra(
    "Chủ nhiệm có MỌI quyền dù không tích ô nào",
    NHOM_QUYEN.flatMap((n) => n.quyen).every((q) => co(chuNhiem, q.ma))
  );
  kiemTra("Chủ nhiệm vào được khu quản trị", coQuyenQuanTri(chuNhiem));

  console.log("\n── Cán bộ ban có quyền (STAFF) ──");
  kiemTra("có quyền được cấp: viết tin tức", co(truyenThong, QUYEN.NOI_DUNG_VIET));
  kiemTra("có quyền được cấp: quản lý sự kiện", co(truyenThong, QUYEN.SU_KIEN_QUAN_LY));
  kiemTra(
    "KHÔNG có quyền chưa cấp: duyệt giao dịch",
    !co(truyenThong, QUYEN.GIAO_DICH_DUYET)
  );
  kiemTra(
    "KHÔNG có quyền chưa cấp: quản lý tài khoản",
    !co(truyenThong, QUYEN.TAI_KHOAN_QUAN_LY)
  );
  kiemTra(
    "KHÔNG có quyền chưa cấp: đổi giao diện",
    !co(truyenThong, QUYEN.GIAO_DIEN_SUA)
  );
  kiemTra("vào được khu quản trị vì có ít nhất 1 quyền", coQuyenQuanTri(truyenThong));
  kiemTra(
    "coMot() đúng khi có một trong các quyền",
    coMot(truyenThong, QUYEN.GIAO_DICH_DUYET, QUYEN.NOI_DUNG_VIET)
  );
  kiemTra(
    "coMot() sai khi không có quyền nào trong danh sách",
    !coMot(truyenThong, QUYEN.GIAO_DICH_DUYET, QUYEN.HOI_PHI_QUAN_LY)
  );

  console.log("\n── Cán bộ ban CHƯA được cấp quyền ──");
  kiemTra(
    "không có bất kỳ quyền nào",
    NHOM_QUYEN.flatMap((n) => n.quyen).every((q) => !co(canBoTrong, q.ma))
  );
  kiemTra("KHÔNG vào được khu quản trị", !coQuyenQuanTri(canBoTrong));

  console.log("\n── Hội viên thường (MEMBER) ──");
  kiemTra(
    "không có quyền quản trị nào",
    NHOM_QUYEN.flatMap((n) => n.quyen).every((q) => !co(hoiVien, q.ma))
  );
  kiemTra("KHÔNG vào được khu quản trị", !coQuyenQuanTri(hoiVien));
  kiemTra(
    "MEMBER có tích quyền cũng KHÔNG được — vai trò mới quyết định",
    !co(
      { role: "MEMBER", permissions: JSON.stringify([QUYEN.TAI_KHOAN_QUAN_LY]) },
      QUYEN.TAI_KHOAN_QUAN_LY
    )
  );

  console.log("\n── Trường hợp dữ liệu hỏng ──");
  kiemTra("chưa đăng nhập thì không có quyền", !co(null, QUYEN.NOI_DUNG_VIET));
  kiemTra("permissions không phải JSON hợp lệ → mảng rỗng", docQuyen("hong{{") .length === 0);
  kiemTra("permissions là JSON nhưng không phải mảng → rỗng", docQuyen('{"a":1}').length === 0);
  kiemTra(
    "permissions chứa phần tử không phải chuỗi → bị loại",
    docQuyen('["noi_dung.viet",123,null]').length === 1
  );

  console.log("\n── Bộ quyền mẫu theo ban ──");
  const maHopLe = new Set(NHOM_QUYEN.flatMap((n) => n.quyen.map((q) => q.ma)));
  for (const b of BO_QUYEN_MAU) {
    kiemTra(
      `bộ "${b.ten}" chỉ dùng mã quyền có thật`,
      b.quyen.every((m) => maHopLe.has(m))
    );
  }
  kiemTra(
    "không bộ mẫu nào tự cấp quyền quản lý tài khoản",
    BO_QUYEN_MAU.every((b) => !b.quyen.includes(QUYEN.TAI_KHOAN_QUAN_LY))
  );

  console.log("");
  if (hong) {
    console.log(`${hong} quy tắc SAI, ${dat} đúng.`);
    process.exit(1);
  }
  console.log(`Tất cả ${dat} quy tắc phân quyền đều đúng.`);
}

main();
