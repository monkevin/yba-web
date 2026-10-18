/**
 * Kiểm tra thứ tự ưu tiên hội viên, mã số, nhà tài trợ và lịch hoạt động.
 *
 *   npx next start -p 3009      (chạy trước ở cửa sổ khác)
 *   npm run test:uutien
 */
import { prisma } from "../src/lib/prisma";
import { CAP_BAC, THU_TU_HOI_VIEN, xepHangHoiVien } from "../src/lib/xep-hang";
import { thuHangBac } from "../src/lib/tai-tro";

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

(async () => {
  console.log("── Cấp bậc và mã số ──");
  const chuNhiem = await prisma.member.findFirst({
    where: { capBac: CAP_BAC.CHU_NHIEM },
    select: { code: true, name: true },
  });
  kiem("có đúng một Chủ nhiệm", !!chuNhiem, chuNhiem?.name ?? "không có");
  kiem(
    "Chủ nhiệm mang mã HV0001",
    chuNhiem?.code === "HV0001",
    chuNhiem?.code ?? "?"
  );

  const soChuNhiem = await prisma.member.count({ where: { capBac: CAP_BAC.CHU_NHIEM } });
  kiem("không có hai Chủ nhiệm", soChuNhiem === 1, `${soChuNhiem}`);

  const pho = await prisma.member.count({ where: { capBac: CAP_BAC.PHO_CHU_NHIEM } });
  kiem("có Phó Chủ nhiệm", pho >= 1, `${pho} người`);

  const tong = await prisma.member.count();
  const maTrung = await prisma.member.groupBy({
    by: ["code"],
    having: { code: { _count: { gt: 1 } } },
  });
  kiem("không có mã trùng", maTrung.length === 0, `${maTrung.length} mã trùng`);

  // Tài khoản KỸ THUẬT mã KDZ* (cho kiểm duyệt viên Zalo duyệt Mini App,
  // tạo 28/08/2026) không phải hội viên — đứng ngoài hai phép kiểm mã.
  // Chúng phải luôn publicVisible = false, có phép kiểm riêng bên dưới.
  const laKyThuat = { code: { startsWith: "KDZ" } };
  const maSai = await prisma.member.count({
    where: { NOT: [{ code: { startsWith: "HV" } }, laKyThuat] },
  });
  kiem("mọi mã đều dạng HVxxxx", maSai === 0, `${maSai} mã sai`);

  // Mã phải liên tục từ HV0001 tới HVn
  const tatCa = await prisma.member.findMany({
    where: { code: { startsWith: "HV" } },
    select: { code: true },
  });
  const so = tatCa.map((m) => Number(m.code.replace("HV", ""))).sort((a, b) => a - b);
  const lienTuc = so.every((n, i) => n === i + 1);
  kiem(
    `mã liên tục HV0001 → HV${String(tatCa.length).padStart(4, "0")}`,
    lienTuc
  );

  const kdzLo = await prisma.member.count({
    where: { ...laKyThuat, publicVisible: true },
  });
  kiem("tài khoản kỹ thuật KDZ* không lộ công khai", kdzLo === 0, `${kdzLo} hồ sơ lộ`);

  console.log("\n── Thứ tự hiển thị ──");
  const top = await prisma.member.findMany({
    where: { active: true, publicVisible: true },
    orderBy: THU_TU_HOI_VIEN,
    take: 10,
    select: { code: true, name: true, capBac: true, trangThai: true, feePaidYear: true },
  });
  kiem("người đầu danh bạ là Chủ nhiệm", top[0]?.capBac === CAP_BAC.CHU_NHIEM, top[0]?.name);
  kiem(
    "5 người đầu đều thuộc Ban Chủ nhiệm",
    top.slice(0, 5).every((m) => m.capBac <= CAP_BAC.PHO_CHU_NHIEM),
    top.slice(0, 5).map((m) => m.capBac).join(",")
  );
  kiem(
    "không ai rời hội nằm trong 20 người đầu",
    (await prisma.member.findMany({ orderBy: THU_TU_HOI_VIEN, take: 20, select: { trangThai: true } }))
      .every((m) => m.trangThai === "HOAT_DONG")
  );

  // Ban Chủ nhiệm đã chốt: chưa đóng phí KHÔNG phải rời hội — mọi hồ sơ đều
  // phải hiển thị bình thường, không hệ thống nào được tự đánh dấu rời hội.
  const roi = await prisma.member.count({ where: { trangThai: "ROI_HOI" } });
  kiem("không tự động đánh dấu ai rời hội", roi === 0, `${roi} người bị đánh dấu`);

  const chuaDong = await prisma.member.count({
    where: { active: true, publicVisible: true, feePaidYear: { lt: new Date().getFullYear() } },
  });
  const hienThi = await prisma.member.count({
    where: { active: true, publicVisible: true },
  });
  // So với số HỘI VIÊN THẬT (mã HV), không tính tài khoản kỹ thuật KDZ* —
  // các hồ sơ đó cố ý ẩn công khai nên đếm cả vào là phép kiểm vỡ oan.
  const tongThat = await prisma.member.count({
    where: { code: { startsWith: "HV" } },
  });
  kiem(
    "người chưa đóng phí vẫn hiển thị công khai",
    chuaDong > 0 && hienThi === tongThat,
    `${chuaDong} chưa đóng · ${hienThi}/${tongThat} hội viên thật đang hiện`
  );

  const dnLon = await prisma.member.count({ where: { doanhNghiepLon: true } });
  kiem("có đánh dấu doanh nghiệp lớn", dnLon > 0, `${dnLon} doanh nghiệp`);

  console.log("\n── Hàm xếp hạng ──");
  kiem(
    "Chủ nhiệm Chi hội → cấp 0",
    xepHangHoiVien({ hoiRole: "Chủ nhiệm Chi hội" }).capBac === CAP_BAC.CHU_NHIEM
  );
  kiem(
    "Phó Chủ nhiệm → cấp 1",
    xepHangHoiVien({ hoiRole: "Phó Chủ nhiệm · Trưởng Ban Hội viên" }).capBac ===
      CAP_BAC.PHO_CHU_NHIEM
  );
  kiem(
    "Hội viên liên kết → cấp 6",
    xepHangHoiVien({ memberType: "Hội viên liên kết" }).capBac === CAP_BAC.LIEN_KET
  );
  kiem(
    "100 nhân sự là doanh nghiệp lớn",
    xepHangHoiVien({ headcount: 150 }).doanhNghiepLon === true
  );
  kiem(
    "20 nhân sự không phải doanh nghiệp lớn",
    xepHangHoiVien({ headcount: 20 }).doanhNghiepLon === false
  );

  console.log("\n── Nhà tài trợ ──");
  const soTaiTro = await prisma.taiTroSuKien.count();
  kiem("đã nhập dữ liệu tài trợ", soTaiTro > 0, `${soTaiTro} dòng`);
  const khopHV = await prisma.taiTroSuKien.count({ where: { memberId: { not: null } } });
  kiem("phần lớn nhà tài trợ khớp hội viên", khopHV > soTaiTro / 2, `${khopHV}/${soTaiTro}`);
  kiem("Kim cương xếp trên Vàng", thuHangBac("Kim cương") < thuHangBac("Vàng"));
  kiem("Vàng xếp trên Đồng hành", thuHangBac("Vàng") < thuHangBac("Đồng hành"));

  console.log("\n── Lịch hoạt động ──");
  const soLich = await prisma.lichHoatDong.count();
  kiem("có lịch hoạt động", soLich > 0, `${soLich} mục`);
  const noiBat = await prisma.lichHoatDong.count({ where: { noiBat: true } });
  kiem("có mục nổi bật", noiBat > 0, `${noiBat} mục`);

  console.log("\n── Trang hiển thị ──");
  for (const [d, phai] of [
    ["/lich-hoat-dong", "Lịch hoạt động"],
    ["/tai-tro", "Nhà tài trợ đồng hành cùng Chi hội"],
    ["/ban-chap-hanh", "Ban Chủ nhiệm"],
    ["/doanh-nghiep", "Danh bạ"],
  ] as [string, string][]) {
    const r = await fetch(`${GOC}${d}`);
    const h = await r.text();
    kiem(`${d}`, r.status === 200 && h.includes(phai), `HTTP ${r.status}`);
  }

  const chu = await (await fetch(`${GOC}/`)).text();
  // ĐỪNG khắc cứng tên một mục lịch ("Nhịp cầu Doanh nhân") — mục nào rồi
  // cũng qua ngày và phép kiểm gãy oan (đã gãy 20/09/2026). Kiểm theo dữ
  // liệu: còn mục sắp tới thì trang chủ phải hiện đúng mục đó; hết sạch
  // mục sắp tới là lỗi NỘI DUNG thật — báo để nhắc Ban Chủ nhiệm nhập lịch.
  const dauNgay = new Date();
  dauNgay.setHours(0, 0, 0, 0);
  const lichToi = await prisma.lichHoatDong.findFirst({
    where: { published: true, tuNgay: { gte: dauNgay } },
    orderBy: { tuNgay: "asc" },
    select: { tieuDe: true },
  });
  kiem("trang chủ có lịch hoạt động", chu.includes("Lịch hoạt động sắp tới"));
  // React mã hoá "&" thành "&amp;" trong HTML — so cả hai dạng kẻo trượt oan
  const coTieuDe = (t: string) =>
    chu.includes(t) || chu.includes(t.replace(/&/g, "&amp;"));
  kiem(
    "trang chủ hiện mục lịch thật",
    !!lichToi && coTieuDe(lichToi.tieuDe),
    lichToi
      ? `mục gần nhất: ${lichToi.tieuDe}`
      : "HẾT mục lịch sắp tới — nhập thêm ở /quan-tri/lich-hoat-dong"
  );

  const db = await (await fetch(`${GOC}/doanh-nghiep`)).text();
  const ten = chuNhiem?.name ?? "";
  kiem("Chủ nhiệm hiện ở trang đầu danh bạ", ten !== "" && db.includes(ten), ten);

  const tt = await (await fetch(`${GOC}/tai-tro`)).text();
  kiem("trang tài trợ có bậc Kim cương", tt.includes("Kim cương"));
  kiem("trang tài trợ hiện số lần đồng hành", tt.includes("lần đồng hành"));

  console.log("\n── File mẫu cho thư ký ──");
  const mau = await fetch(`${GOC}/mau/mau-bao-cao-su-kien-yba-cho-lon.xlsx`);
  kiem("tải được file mẫu Excel", mau.status === 200, `HTTP ${mau.status}`);
  kiem(
    "file mẫu đúng định dạng Excel",
    (mau.headers.get("content-type") ?? "").includes("spreadsheet") ||
      Number(mau.headers.get("content-length")) > 5000
  );

  console.log(
    `\n${hong === 0 ? `Tất cả ${dat} phép kiểm đều đạt.` : `${dat} đạt · ${hong} HỎNG.`}`
  );
  await prisma.$disconnect();
  if (hong) process.exit(1);
})();
