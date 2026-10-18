/**
 * Kiểm tra check-in bằng mã QR + điểm hoạt động tự động của Lễ chuyển giao
 * 10/10 (src/lib/checkin-1010.ts, src/lib/diem-tu-dong.ts, src/lib/ma-qr.ts).
 *
 *   npm run test:checkin              chỉ phần hàm thuần — chạy được mọi lúc
 *   npm run test:checkin -- --csdl    thêm phần ghi CSDL: tạo MỘT hội viên thử
 *                                     + vài khách thử, chạy trọn luồng rồi tự
 *                                     xoá. Không đụng khách mời thật, không
 *                                     đổi quy tắc điểm đang lưu.
 *
 * Phần --csdl tự bỏ qua trên máy chủ thật (NODE_ENV=production) và từ ngày
 * 09.10.2026 trở đi — sát ngày lễ không chạy thử trên dữ liệu thật.
 */
import jsQR from "jsqr";
import {
  KHONG_HOI_VIEN,
  MOC_1010,
  docMaQuet,
  dongBoDiemHoiVien,
  ghiCheckin,
  gioPhut,
  gioVietNam,
  huyCheckin,
  khachCuaHoiVien,
  khoaDiem1010,
  laNhomChoLon,
  lapChiMucHoiVien,
  loiTenDonVi,
  phienTheoGio,
  phuTrachCua,
  soVoiNgaySuKien,
  timHoiVienKhop,
  trongSuatMoi,
  SLUG_1010,
} from "../src/lib/checkin-1010";
import {
  QUY_TAC_MAC_DINH,
  chuanQuyTac,
  datDiemTuDong,
  goDiemTuDong,
  type QuyTacDiem,
} from "../src/lib/diem-tu-dong";
import { duongQr } from "../src/lib/ma-qr";
import { prisma } from "../src/lib/prisma";

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

/** Vẽ mã QR ra bộ đệm RGBA (mỗi ô `o` điểm ảnh, viền trắng 4 ô) rồi giải mã lại. */
function docLaiQr(noiDung: string, o = 6): string | null {
  const { path, canh } = duongQr(noiDung);
  const VIEN = 4;
  const rong = (canh + VIEN * 2) * o;
  const px = new Uint8ClampedArray(rong * rong * 4).fill(255);
  // path gồm các đoạn "M<c> <r>h<dài>v1h-<dài>z" — mỗi đoạn một dải ô đen
  for (const m of path.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
    const c0 = Number(m[1]);
    const r = Number(m[2]);
    const dai = Number(m[3]);
    for (let y = (r + VIEN) * o; y < (r + VIEN + 1) * o; y++) {
      for (let x = (c0 + VIEN) * o; x < (c0 + VIEN + dai) * o; x++) {
        const i = (y * rong + x) * 4;
        px[i] = px[i + 1] = px[i + 2] = 0;
      }
    }
  }
  return jsQR(px, rong, rong)?.data ?? null;
}

function phanThuan() {
  console.log("── Đọc mã quét ──");
  const k = (s: string) => {
    const r = docMaQuet(s);
    return r ? (r.loai === "KHACH" ? r.ma : "HV:" + r.code) : null;
  };
  kiem("mã thư mời trần", k("CL-AB2CD") === "CL-AB2CD");
  kiem("mã viết thường + khoảng trắng", k("  cl-ab2cd \n") === "CL-AB2CD");
  kiem(
    "link thư mời chứa mã",
    k("https://ybacholon.vn/1010/moi/CL-TT9SX?thu=1") === "CL-TT9SX"
  );
  kiem("thẻ hội viên Mini App", k("YBACL:HV0001") === "HV:HV0001");
  kiem("mã hội viên gõ tay", k("hv0123") === "HV:HV0123");
  kiem("mã dài hơn 5 ký tự không nhận bừa", k("CL-AB2CDE") === null);
  kiem("chữ lạ", k("https://example.com/abc") === null);
  kiem("chuỗi rỗng", k("") === null);
  kiem("mã kiểm duyệt KDZ không phải thẻ hội viên thường", k("YBACL:KDZ003") === null);

  console.log("\n── Phiên theo giờ Việt Nam ──");
  kiem("14:00 → Tọa đàm", phienTheoGio(14 * 60) === "TOA_DAM");
  kiem("16:29 → Tọa đàm", phienTheoGio(16 * 60 + 29) === "TOA_DAM");
  kiem("16:30 → Lễ", phienTheoGio(16 * 60 + 30) === "LE");
  kiem("17:29 → Lễ", phienTheoGio(17 * 60 + 29) === "LE");
  kiem("17:30 → Gala", phienTheoGio(17 * 60 + 30) === "GALA");
  kiem("21:00 → Gala", phienTheoGio(21 * 60) === "GALA");
  const dem = gioVietNam(new Date("2026-10-10T07:35:00.000Z"));
  kiem("07:35 UTC = 14:35 ngày 10.10 giờ VN", dem.ngay === "2026-10-10" && dem.phut === 14 * 60 + 35);
  kiem("gioPhut định dạng HH:mm", gioPhut(new Date("2026-10-10T02:05:00.000Z")) === "09:05");
  kiem("17:00 UTC ngày 9 đã là 10.10 giờ VN", soVoiNgaySuKien(MOC_1010) === "DUNG_NGAY");
  kiem("trước mốc 1 phút là TRƯỚC", soVoiNgaySuKien(new Date(MOC_1010.getTime() - 60_000)) === "TRUOC");
  kiem("17:00 UTC ngày 10 là SAU", soVoiNgaySuKien(new Date("2026-10-10T17:00:00.000Z")) === "SAU");

  console.log("\n── Suất mời ──");
  kiem("khách gốc (null) được cả ba phiên", trongSuatMoi(null, "GALA"));
  kiem("suất Tọa đàm + Lễ thì Lễ được", trongSuatMoi("TOA_DAM,CHUYEN_GIAO", "LE"));
  kiem("suất Tọa đàm + Lễ thì Gala KHÔNG", !trongSuatMoi("TOA_DAM,CHUYEN_GIAO", "GALA"));

  console.log("\n── Ghép khách với hồ sơ hội viên ──");
  const hv = [
    { id: "m1", code: "HV0001", name: "Đặng Viên Khang", phone: "0968111118", company: "CÔNG TY TNHH DỊCH VỤ THIẾT KẾ THỜI TRANG HOÀNG VY (MON AMIE)" },
    { id: "m2", code: "HV0002", name: "Nguyễn Minh Tâm", phone: "0903000001", company: "CÔNG TY CỔ PHẦN DẦU NHỚT VÀ HÓA CHẤT MIỀN NAM" },
    { id: "m3", code: "HV0003", name: "Trần Đức An", phone: null, company: "CÔNG TY CỔ PHẦN SÂM NGỌC LINH TU MƠ RÔNG KON TUM" },
    { id: "m4", code: "HV0004", name: "Lê Minh Tiến", phone: "0903000004", company: "CÔNG TY TNHH JW" },
    { id: "m5", code: "HV0005", name: "Lê Minh Tiến", phone: "0903000005", company: "CÔNG TY VINFAST MINH THANH" },
  ];
  const cm = lapChiMucHoiVien(hv);
  const ghep = (k: { ten: string; phone?: string | null; donVi?: string | null; nhom: string }) =>
    timHoiVienKhop({ ten: k.ten, phone: k.phone ?? null, donVi: k.donVi ?? null, nhom: k.nhom }, cm)?.hoiVien.id ?? null;
  kiem("trùng SĐT (dạng 84…) + trùng tên", ghep({ ten: "Đặng Viên Khang", phone: "+84 968 111 118", nhom: "BTT - BCH" }) === "m1");
  kiem(
    "trùng SĐT nhưng tên khác hẳn (SĐT trợ lý) → không ghép",
    ghep({ ten: "Phạm Thị Thư Ký", phone: "0968111118", nhom: "KHÁCH MỜI KHÁC" }) === null
  );
  kiem("trùng tên, nhóm Chợ Lớn, không SĐT", ghep({ ten: "Trần Đức An", nhom: "YBA CHỢ LỚN" }) === "m3");
  kiem(
    "trùng tên, nhóm ngoài, đơn vị KHÁC → không ghép",
    ghep({ ten: "Nguyễn Minh Tâm", nhom: "KHÁCH MỜI KHÁC (DS 2023)", donVi: "CTY TNHH XÂY DỰNG ABC" }) === null
  );
  kiem(
    "trùng tên, nhóm ngoài, đơn vị gần giống → ghép",
    ghep({ ten: "Trần Đức An", nhom: "BTT - BCH", donVi: "CTY CP SÂM NGỌC LINH TU MƠ RÔNG KON TUM" }) === "m3"
  );
  kiem("hai hội viên trùng tên, không đơn vị → không ghép", ghep({ ten: "Lê Minh Tiến", nhom: "YBA CHỢ LỚN" }) === null);
  kiem(
    "hai hội viên trùng tên, đơn vị chỉ ra một người",
    ghep({ ten: "Lê Minh Tiến", nhom: "YBA CHỢ LỚN", donVi: "VINFAST MINH THANH TP.HCM" }) === "m5"
  );
  kiem("gõ thiếu dấu vẫn ghép", ghep({ ten: "Tran Duc An", nhom: "HOI_VIEN" }) === "m3");
  kiem("nhóm 'YBA CHỢ LỚN' là nhóm Chợ Lớn", laNhomChoLon("YBA CHỢ LỚN") && laNhomChoLon("HOI_VIEN"));
  kiem("nhóm 'YBA NAM SÀI GÒN' KHÔNG phải", !laNhomChoLon("YBA NAM SÀI GÒN") && !laNhomChoLon("BTC"));
  kiem("lõi tên đơn vị bỏ loại hình", loiTenDonVi("CTY CP SX TM DV Mỹ Thuật Tân Việt") === "my thuat tan viet");
  kiem("đọc người phụ trách", phuTrachCua("Thư #001 · Phụ trách: Anh Khang") === "Anh Khang");
  kiem("không có người phụ trách", phuTrachCua("Tự thêm khi lễ tân quét") === null);

  console.log("\n── Quy tắc điểm ──");
  kiem("chưa lưu gì → mặc định 5 điểm, bật, không diễn tập", JSON.stringify(chuanQuyTac(null)) === JSON.stringify(QUY_TAC_MAC_DINH));
  kiem("số âm kẹp về 0", chuanQuyTac({ phien1010: -3 }).phien1010 === 0);
  kiem("số quá lớn kẹp về trần 100", chuanQuyTac({ phien1010: 5000 }).phien1010 === 100);
  kiem("chữ không phải số → mặc định", chuanQuyTac({ suKien: "abc" }).suKien === QUY_TAC_MAC_DINH.suKien);
  kiem("giữ đúng công tắc", chuanQuyTac({ bat: false, dienTap: true }).bat === false && chuanQuyTac({ dienTap: true }).dienTap === true);

  console.log("\n── Mã QR sinh ra phải quét lại được ──");
  const { canh } = duongQr("CL-AB2CD");
  kiem("mã thư mời ra QR nhỏ nhất (21 ô mỗi cạnh)", canh === 21, `${canh} ô`);
  kiem("giải mã lại đúng mã thư mời", docLaiQr("CL-AB2CD") === "CL-AB2CD");
  kiem("giải mã lại đúng mã khác", docLaiQr("CL-TT9SX") === "CL-TT9SX");
  kiem("ô chỉ 3 điểm ảnh (màn hình nhỏ) vẫn đọc được", docLaiQr("CL-Z9Y8X", 3) === "CL-Z9Y8X");
  kiem("nội dung chữ thường (kiểu Byte) vẫn đúng", docLaiQr("https://ybacholon.vn/1010/checkin") === "https://ybacholon.vn/1010/checkin");
}

async function phanCsdl() {
  console.log("\n── Ghi CSDL (hội viên + khách THỬ, tự xoá) ──");
  const DAU = "ZZ-THU-CHECKIN";
  const suKienCoTruoc = !!(await prisma.event.findUnique({ where: { slug: SLUG_1010 }, select: { id: true } }));
  const don = async () => {
    const hv = await prisma.member.findMany({ where: { company: DAU }, select: { id: true } });
    const ids = hv.map((m) => m.id);
    await prisma.diemHoatDong.deleteMany({ where: { OR: [{ memberId: { in: ids } }, { nguon: { startsWith: "thu:" } }] } });
    await prisma.thamDuSuKien.deleteMany({ where: { memberId: { in: ids } } });
    await prisma.khachMoi1010.deleteMany({ where: { ghiChuBTC: { startsWith: DAU } } });
    await prisma.khachMoi1010.deleteMany({ where: { memberId: { in: ids } } });
    await prisma.member.deleteMany({ where: { id: { in: ids } } });
  };
  await don();

  const QT: QuyTacDiem = { bat: true, phien1010: 5, suKien: 5, dienTap: false };
  const NGUOI = { id: "u-thu", ten: "Lễ tân Thử" };
  // Mốc giờ đúng ngày sự kiện để giả lập lượt check-in thật
  const g1435 = new Date("2026-10-10T07:35:00.000Z");
  const g1640 = new Date("2026-10-10T09:40:00.000Z");
  const g1810 = new Date("2026-10-10T11:10:00.000Z");

  try {
    const taoHV = (so: string, ten: string, phone: string) =>
      prisma.member.create({
        data: { code: `ZZT${so}`, slug: `zz-thu-checkin-${so}`, name: ten, company: DAU, phone, active: true },
        select: { id: true, code: true },
      });
    const taoKhach = (ma: string, ten: string, them: Record<string, unknown> = {}) =>
      prisma.khachMoi1010.create({
        data: { ma, ten, nhom: "YBA CHỢ LỚN", ghiChuBTC: `${DAU} · Phụ trách: Thử`, ...them },
        select: { id: true },
      });

    const m = await taoHV("901", "Trần Thử Nghiệm Một", "0999000901");
    const k1 = await taoKhach("CL-ZZT01", "Trần Thử Nghiệm Một", { phone: "0999 000 901" });
    const kNgoai = await taoKhach("CL-ZZT02", "Khách Ngoài Hội Thử", { nhom: "KHÁCH MỜI KHÁC" });
    const diemCua = () =>
      prisma.diemHoatDong.findMany({ where: { memberId: m.id }, orderBy: { nguon: "asc" } });
    const tongDiem = async () => (await diemCua()).reduce((a, d) => a + d.diem, 0);
    const thamDu = async () => {
      const ev = await prisma.event.findUnique({ where: { slug: SLUG_1010 }, select: { id: true } });
      return ev
        ? prisma.thamDuSuKien.findUnique({ where: { eventId_memberId: { eventId: ev.id, memberId: m.id } } })
        : null;
    };

    // 1) Check-in HÔM NAY (trước ngày lễ): ghi nhận, tự ghép hồ sơ, CHƯA có điểm
    const truocLe = new Date() < MOC_1010;
    const r1 = await ghiCheckin(k1.id, "TOA_DAM", { cach: "QUET", nguoi: NGUOI });
    kiem("lần đầu check-in báo là lượt mới", r1?.moi === true);
    kiem("máy tự ghép khách với hồ sơ hội viên theo SĐT", r1?.memberId === m.id);
    const k1b = await prisma.khachMoi1010.findUnique({ where: { id: k1.id } });
    kiem("đã ghi giờ Tọa đàm + lưu memberId", !!k1b?.checkinLuc && k1b.memberId === m.id);
    if (truocLe) {
      kiem("lượt bấm thử trước ngày lễ KHÔNG sinh điểm", (await tongDiem()) === 0);
      kiem("lượt bấm thử không đổi trạng thái xác nhận", k1b?.trangThai === "CHO_PHAN_HOI", k1b?.trangThai);
      kiem("lượt bấm thử không ghi tham dự sự kiện", (await thamDu())?.trangThai !== "DA_CHECKIN");
    }
    const r1lai = await ghiCheckin(k1.id, "TOA_DAM", { cach: "LE_TAN", nguoi: NGUOI });
    kiem("bấm lần hai: không phải lượt mới, giữ giờ cũ", r1lai?.moi === false && r1lai.luc.getTime() === k1b!.checkinLuc!.getTime());

    // 2) Giả lập đúng ngày lễ: Tọa đàm 14:35
    await prisma.khachMoi1010.update({ where: { id: k1.id }, data: { checkinLuc: g1435 } });
    const d1 = await dongBoDiemHoiVien(m.id, { phien: "TOA_DAM", cach: "QUET", nguoi: NGUOI }, QT);
    kiem("có mặt Tọa đàm đúng ngày lễ → +5 điểm", d1.cong === 5 && d1.tong === 5, JSON.stringify(d1));
    const dong1 = (await diemCua())[0];
    kiem("dòng sổ là loại Tham gia, mang khoá nguồn", dong1?.loai === "THAM_GIA" && dong1.nguon === khoaDiem1010(m.id, "TOA_DAM"));
    kiem("lý do ghi phiên + giờ + cách check-in", /Tọa đàm · có mặt 14:35 \(lễ tân quét mã QR thư mời\)/.test(dong1?.lyDo ?? ""), dong1?.lyDo);
    kiem("người xác nhận là lễ tân đã quét", dong1?.nguoiCongTen === "Lễ tân Thử");
    const td1 = await thamDu();
    kiem("ghi tham dự sự kiện (DA_CHECKIN, giờ 14:35)", td1?.trangThai === "DA_CHECKIN" && td1.checkinAt?.getTime() === g1435.getTime());
    const d1lai = await dongBoDiemHoiVien(m.id, undefined, QT);
    kiem("đồng bộ lại không cộng thêm", d1lai.cong === 0 && d1lai.tong === 5 && (await diemCua()).length === 1);

    // 3) Thêm Lễ + Gala
    await prisma.khachMoi1010.update({ where: { id: k1.id }, data: { checkinLeLuc: g1640, checkinGalaLuc: g1810 } });
    const d3 = await dongBoDiemHoiVien(m.id, undefined, QT);
    kiem("dự đủ ba phiên = 15 điểm, ba dòng sổ", d3.tong === 15 && (await diemCua()).length === 3, JSON.stringify(d3));

    // 4) Một hội viên có HAI dòng khách mời → vẫn chỉ một lần điểm mỗi phiên
    const k1trung = await taoKhach("CL-ZZT03", "Trần Thử Nghiệm Một", { memberId: m.id, checkinLuc: g1640 });
    const d4 = await dongBoDiemHoiVien(m.id, undefined, QT);
    kiem("hai dòng khách cùng một hội viên không nhân đôi điểm", d4.tong === 15 && (await diemCua()).length === 3);
    kiem("giờ có mặt lấy lượt SỚM nhất", /14:35/.test((await diemCua()).find((x) => x.nguon?.endsWith("TOA_DAM"))?.lyDo ?? ""));

    // 5) Huỷ check-in → điểm rút theo
    const h1 = await huyCheckin(k1.id, "GALA");
    kiem("huỷ Gala báo đã huỷ", h1?.daHuy === true);
    // huyCheckin dùng quy tắc ĐANG LƯU; soát lại bằng quy tắc thử cho chắc
    const d5 = await dongBoDiemHoiVien(m.id, undefined, QT);
    kiem("huỷ Gala → còn 10 điểm, 2 dòng", d5.tong === 10 && (await diemCua()).length === 2, JSON.stringify(d5));
    const h1lai = await huyCheckin(k1.id, "GALA");
    kiem("huỷ lần hai báo đã huỷ từ trước", h1lai?.daHuy === false);
    await prisma.khachMoi1010.update({ where: { id: k1.id }, data: { checkinLuc: null } });
    const d5b = await dongBoDiemHoiVien(m.id, undefined, QT);
    kiem("dòng chính bỏ Tọa đàm nhưng dòng trùng còn → vẫn giữ điểm Tọa đàm", d5b.tong === 10);
    await prisma.khachMoi1010.updateMany({ where: { memberId: m.id }, data: { checkinLuc: null, checkinLeLuc: null, checkinGalaLuc: null } });
    const d5c = await dongBoDiemHoiVien(m.id, undefined, QT);
    kiem("không còn phiên nào → 0 điểm, sổ sạch", d5c.tong === 0 && d5c.tru === 10 && (await diemCua()).length === 0, JSON.stringify(d5c));
    kiem("bản ghi tham dự lùi về chưa check-in", (await thamDu())?.trangThai === "DANG_KY");
    await prisma.khachMoi1010.delete({ where: { id: k1trung.id } });

    // 6) Đổi mức điểm / tắt cộng điểm / diễn tập
    await prisma.khachMoi1010.update({ where: { id: k1.id }, data: { checkinLuc: g1435, checkinLeLuc: g1640 } });
    await dongBoDiemHoiVien(m.id, undefined, QT);
    const d6 = await dongBoDiemHoiVien(m.id, undefined, { ...QT, phien1010: 8 });
    kiem("đổi mức điểm 5 → 8: dòng cũ được sửa, không thêm dòng", d6.tong === 16 && d6.cong === 0 && (await tongDiem()) === 16 && (await diemCua()).length === 2);
    const d6b = await dongBoDiemHoiVien(m.id, undefined, { ...QT, bat: false });
    kiem("tắt cộng điểm tự động → rút sạch", d6b.tong === 0 && (await diemCua()).length === 0);
    kiem("tắt cộng điểm vẫn giữ bản ghi tham dự", (await thamDu())?.trangThai === "DA_CHECKIN");
    const truocMoc = new Date(MOC_1010.getTime() - 3 * 86_400_000);
    await prisma.khachMoi1010.update({ where: { id: k1.id }, data: { checkinLuc: truocMoc, checkinLeLuc: null } });
    const d6c = await dongBoDiemHoiVien(m.id, undefined, QT);
    kiem("lượt ghi trước ngày lễ: không điểm", d6c.tong === 0);
    const d6d = await dongBoDiemHoiVien(m.id, undefined, { ...QT, dienTap: true });
    kiem("bật Diễn tập: lượt trước ngày lễ được tính", d6d.tong === 5);
    const d6e = await dongBoDiemHoiVien(m.id, undefined, QT);
    kiem("tắt Diễn tập: điểm thử tự biến mất", d6e.tong === 0 && (await diemCua()).length === 0);
    const homSau = new Date("2026-10-11T03:00:00.000Z");
    await prisma.khachMoi1010.update({ where: { id: k1.id }, data: { checkinLuc: homSau } });
    kiem("thư ký bổ sung hôm sau vẫn được tính", (await dongBoDiemHoiVien(m.id, undefined, QT)).tong === 5);

    // 7) Khách ngoài Chi hội + khách BTC đánh dấu "không phải hội viên"
    const rn = await ghiCheckin(kNgoai.id, "TOA_DAM", { cach: "TU", nguoi: NGUOI });
    kiem("khách ngoài Chi hội: check-in được, không ghép, không điểm", rn?.moi === true && rn.memberId === null && rn.diem === null);
    const kKhong = await taoKhach("CL-ZZT04", "Trần Thử Nghiệm Một", { phone: "0999000901", memberId: KHONG_HOI_VIEN });
    const rk = await ghiCheckin(kKhong.id, "LE", { cach: "LE_TAN", nguoi: NGUOI });
    const kKhongSau = await prisma.khachMoi1010.findUnique({ where: { id: kKhong.id } });
    kiem("dòng BTC đánh dấu 'không phải hội viên' không bị máy ghép lại", rk?.memberId === null && kKhongSau?.memberId === KHONG_HOI_VIEN);

    // 8) Nhiều nơi bấm cùng lúc → vẫn một dòng điểm mỗi phiên
    await prisma.khachMoi1010.update({ where: { id: k1.id }, data: { checkinLuc: null, checkinLeLuc: null, checkinGalaLuc: null } });
    await dongBoDiemHoiVien(m.id, undefined, QT);
    const dongThoi = await Promise.all(
      [1, 2, 3, 4, 5].map(() => ghiCheckin(k1.id, "GALA", { cach: "QUET", nguoi: NGUOI }))
    );
    kiem("5 lượt quét cùng lúc: đúng 1 lượt được tính là mới", dongThoi.filter((x) => x?.moi).length === 1);
    await prisma.khachMoi1010.update({ where: { id: k1.id }, data: { checkinGalaLuc: g1810 } });
    await Promise.all([1, 2, 3, 4, 5].map(() => dongBoDiemHoiVien(m.id, undefined, QT)));
    kiem("5 lần đồng bộ cùng lúc: sổ vẫn đúng 1 dòng 5 điểm", (await diemCua()).length === 1 && (await tongDiem()) === 5, `${(await diemCua()).length} dòng`);
    await Promise.all(
      [1, 2, 3, 4].map(() =>
        datDiemTuDong({ nguon: "thu:dong-thoi", memberId: m.id, diem: 3, lyDo: "thử đồng thời", nguoi: NGUOI })
      )
    );
    kiem("datDiemTuDong gọi 4 lần cùng lúc → một dòng", (await prisma.diemHoatDong.count({ where: { nguon: "thu:dong-thoi" } })) === 1);
    kiem("goDiemTuDong trả đúng số điểm đã gỡ", (await goDiemTuDong("thu:dong-thoi")) === 3 && (await goDiemTuDong("thu:dong-thoi")) === 0);

    // 9) Lễ tân quét THẺ HỘI VIÊN
    const q1 = await khachCuaHoiVien(m.code, false);
    kiem("quét thẻ hội viên ra đúng dòng khách đã ghép", !q1.loi && q1.khachId === k1.id);
    const m2 = await taoHV("902", "Lý Thử Nghiệm Hai", "0999000902");
    const q2 = await khachCuaHoiVien(m2.code, false);
    kiem("hội viên chưa có trong danh sách, chạy thử → không tạo gì", !q2.loi && q2.khachId === null && q2.vuaThem === false);
    const kChuaGhep = await taoKhach("CL-ZZT05", "Lý Thử Nghiệm Hai", {});
    const q2b = await khachCuaHoiVien(m2.code, true);
    kiem("dò ngược được dòng khách chưa ghép trùng tên (nhóm Chợ Lớn)", !q2b.loi && q2b.khachId === kChuaGhep.id && q2b.vuaThem === false);
    const m3 = await taoHV("903", "Vương Thử Nghiệm Ba", "0999000903");
    const q3 = await khachCuaHoiVien(m3.code, true);
    const k3 = !q3.loi && q3.khachId ? await prisma.khachMoi1010.findUnique({ where: { id: q3.khachId } }) : null;
    kiem(
      "hội viên đến thẳng: tự thêm vào danh sách nhóm Hội viên, có mã thư mời",
      !q3.loi && q3.vuaThem === true && k3?.nhom === "HOI_VIEN" && k3.memberId === m3.id && /^CL-[A-Z0-9]{5}$/.test(k3.ma)
    );
    kiem("mã hội viên không tồn tại", (await khachCuaHoiVien("HV999999", true)).loi === "KHONG_CO_HOI_VIEN");
  } finally {
    await don();
    if (!suKienCoTruoc) {
      // Bản ghi sự kiện do lần thử này sinh ra — trả CSDL về như cũ
      await prisma.event.deleteMany({ where: { slug: SLUG_1010, thamDu: { none: {} } } });
    }
    const sot =
      (await prisma.member.count({ where: { company: "ZZ-THU-CHECKIN" } })) +
      (await prisma.khachMoi1010.count({ where: { ma: { startsWith: "CL-ZZT" } } }));
    kiem("dọn sạch dữ liệu thử", sot === 0, `còn ${sot} bản ghi`);
  }
}

(async () => {
  phanThuan();
  if (process.argv.includes("--csdl")) {
    if (process.env.NODE_ENV === "production") {
      console.log("\n  BỎ QUA phần --csdl: đang ở máy chủ thật (NODE_ENV=production).");
    } else if (Date.now() >= MOC_1010.getTime() - 86_400_000) {
      console.log("\n  BỎ QUA phần --csdl: đã sát / qua ngày lễ, không chạy thử trên dữ liệu thật.");
    } else {
      await phanCsdl();
    }
  }
  console.log(`\n${hong === 0 ? "ĐẠT" : "CÓ LỖI"} — ${dat} đạt, ${hong} hỏng`);
  await prisma.$disconnect();
  process.exit(hong === 0 ? 0 : 1);
})();
