/**
 * Kiểm tra Trung tâm sự kiện (src/lib/trung-tam-sk/).
 *
 *   npm run test:trungtamsk              chỉ phần hàm thuần — chạy được mọi lúc
 *   npm run test:trungtamsk -- --csdl    thêm phần ghi CSDL: tạo MỘT sự kiện thử
 *                                        + MỘT hội viên thử, chạy trọn luồng
 *                                        check-in → điểm rồi tự xoá.
 *
 * Phần --csdl tự bỏ qua trên máy chủ thật (NODE_ENV=production).
 */
import { QUYEN, co } from "../src/lib/quyen";
import { TT_TAI_TRO_CHUA_CHOT } from "../src/lib/tai-tro";
import { BANG, docSo, epKieu, linkAnToan, ngayNhap, tabCuaBan, tuNgayNhap } from "../src/lib/trung-tam-sk/bang";
import { tinhDanhGia } from "../src/lib/trung-tam-sk/danh-gia";
import { daChamTran, datLaiGioiHanCong, vuotTran } from "../src/lib/trung-tam-sk/gioi-han";
import { LOAI_SU_KIEN, QUY_MO, cacBanTheoQuyMo, hangTaiTroMau, taoDuLieuMau, type QuyMo } from "../src/lib/trung-tam-sk/mau";

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

function hamThuan() {
  console.log("\n— Hàm thuần");
  kiem("docSo 1.500.000", docSo("1.500.000") === 1_500_000);
  kiem("docSo chữ không có số = null", docSo("abc") === null && docSo("") === null);
  kiem("docSo 2tr / 2 triệu / 500k / 1,5 tỷ", docSo("2tr") === 2e6 && docSo("2 triệu") === 2e6 && docSo("500k") === 5e5 && docSo("1,5 tỷ") === 1.5e9);
  const t = BANG.thuchi.truong;
  kiem("epKieu tiền rỗng = 0", epKieu(t.duTru, "") === 0);
  kiem("epKieu tiền sai = bỏ qua", epKieu(t.duTru, "abc") === undefined);
  kiem("epKieu chọn theo nhãn", epKieu(t.trangThai, "Đã thanh toán") === "DA_TT");
  kiem("epKieu chọn giá trị lạ = bỏ qua", epKieu(t.trangThai, "linh tinh") === undefined);
  const d = tuNgayNhap("20/11/2026");
  kiem("ngày dd/mm/yyyy → giữ đúng ngày VN", !!d && ngayNhap(d) === "2026-11-20", String(d));
  kiem("ngày yyyy-mm-dd khứ hồi", ngayNhap(tuNgayNhap("2026-01-01")) === "2026-01-01");
  kiem("bool 'x' = có", epKieu(BANG.khach.truong.vip, "x") === true);

  let mauHong = 0;
  for (const l of LOAI_SU_KIEN) {
    for (const q of ["nho", "vua", "lon"] as QuyMo[]) {
      const m = taoDuLieuMau(l.value, q, tuNgayNhap("2026-12-01"));
      const ok =
        m.phien.length >= 1 &&
        m.cacBan.length >= 4 &&
        m.viec.every((v, i, a) => i === 0 || (a[i - 1].hanChot?.getTime() ?? 0) <= (v.hanChot?.getTime() ?? 0)) &&
        m.kichBan.every((k) => k.viTriPhien === null || k.viTriPhien < m.phien.length);
      if (!ok) {
        mauHong++;
        kiem(`mẫu ${l.value}/${q}`, false);
      }
    }
  }
  kiem("mọi mẫu loại × quy mô hợp lệ (phiên, ban, việc sắp theo hạn, kịch bản đúng phiên)", mauHong === 0);
  const gala = taoDuLieuMau("gala", "nho", tuNgayNhap("2026-12-01"));
  kiem("gala quy mô nhỏ: 1 phiên, bỏ phần Lễ", gala.phien.length === 1 && !gala.kichBan.some((k) => k.ghiChu?.startsWith("I. LỄ")));
  const lon = taoDuLieuMau("gala", "lon", tuNgayNhap("2026-12-01"));
  const d60 = lon.viec.find((v) => v.ghiChu === "D-60");
  kiem("việc D-60 có hạn đúng 60 ngày trước", !!d60 && ngayNhap(d60.hanChot) === "2026-10-02", ngayNhap(d60?.hanChot));

  console.log("\n— Đợt 2: hàm thuần");
  const hang = hangTaiTroMau("vua", { "Vàng": ["Logo backdrop"] });
  kiem(
    "bảng hạng mẫu: NTT chính → Đồng hành, mức tiền giảm dần",
    hang[0]?.ten === "Nhà tài trợ chính" &&
      hang.at(-1)?.ten === "Đồng hành" &&
      hang.every((h, i) => i === 0 || h.mucTien <= hang[i - 1].mucTien),
    JSON.stringify(hang.map((h) => [h.ten, h.mucTien]))
  );
  let thieuChecklist = "";
  for (const q of QUY_MO.map((x) => x.value)) {
    const m = taoDuLieuMau("workshop", q, tuNgayNhap("2026-12-01"));
    for (const ban of ["Ban Hậu cần", "Ban Truyền thông", "Ban Nội dung & MC"])
      if (cacBanTheoQuyMo(q).some((c) => c.name === ban) && !m.viec.some((v) => v.ban === ban && v.loai === "CHECKLIST"))
        thieuChecklist += `${q}/${ban} `;
  }
  kiem("Hậu cần / Truyền thông / Nội dung đều có checklist ngày D ở mọi quy mô", !thieuChecklist, thieuChecklist);
  kiem(
    "ban → tab phụ trách (kể cả tên tự đặt)",
    tabCuaBan("Ban Hậu cần")?.duong === "hau-can" &&
      tabCuaBan("Ban Nội dung & MC")?.duong === "kich-ban" &&
      tabCuaBan("Ban truyền thông – Media")?.duong === "truyen-thong" &&
      tabCuaBan("Ban Tài trợ – Tài chính")?.duong === "tai-tro" &&
      tabCuaBan("Trưởng BTC") === null
  );
  kiem(
    "link an toàn: chặn javascript:, tự thêm https://",
    linkAnToan("javascript:alert(1)") === null &&
      linkAnToan("drive.google.com/abc") === "https://drive.google.com/abc" &&
      linkAnToan("http://x.vn") === "http://x.vn" &&
      linkAnToan("") === null
  );
  const dg = tinhDanhGia([
    { haiLong: 5, nps: 10 },
    { haiLong: 4, nps: 9 },
    { haiLong: 2, nps: 3 },
    { haiLong: 5, nps: null },
  ]);
  kiem("NPS = %ủng hộ − %chê (bỏ phiếu không chấm)", dg.nps === 33 && dg.soNps === 3 && dg.tbHaiLong === 4 && dg.phanBo[4] === 2, JSON.stringify(dg));
  kiem("NPS không có phiếu = null", tinhDanhGia([]).nps === null && tinhDanhGia([]).tbHaiLong === null);
  datLaiGioiHanCong();
  const lan = [1, 2, 3, 4].map(() => vuotTran("thu", 3, 60_000));
  kiem("giới hạn tần suất: 3 lượt qua, lượt 4 bị chặn", lan.join() === "false,false,false,true");
  kiem("đếm PIN sai chạm trần", daChamTran("thu", 3, 60_000) && !daChamTran("khac", 3, 60_000));
  datLaiGioiHanCong();

  console.log("\n— Phân quyền");
  const nd = (role: string, ds: string[] = []) => ({ role, permissions: ds.length ? JSON.stringify(ds) : null });
  const leTan = nd("STAFF", [QUYEN.SU_KIEN_CHECKIN]);
  kiem("lễ tân: có check-in, không quản lý / tài chính", co(leTan, QUYEN.SU_KIEN_CHECKIN) && !co(leTan, QUYEN.SU_KIEN_QUAN_LY) && !co(leTan, QUYEN.SU_KIEN_TAI_CHINH));
  kiem("Chủ nhiệm (ADMIN không giới hạn): đủ 3 quyền sự kiện", [QUYEN.SU_KIEN_QUAN_LY, QUYEN.SU_KIEN_TAI_CHINH, QUYEN.SU_KIEN_CHECKIN].every((m) => co(nd("ADMIN"), m)));
  kiem("ADMIN giới hạn chỉ Quản lý sự kiện: không thấy tài chính", !co(nd("ADMIN", [QUYEN.SU_KIEN_QUAN_LY]), QUYEN.SU_KIEN_TAI_CHINH));
  kiem("hội viên thường: không quyền nào", !co(nd("MEMBER"), QUYEN.SU_KIEN_CHECKIN));
  kiem("NTT đang vận động không vinh danh / không tính điểm", TT_TAI_TRO_CHUA_CHOT.includes("Đang vận động") && TT_TAI_TRO_CHUA_CHOT.includes("Huỷ"));
}

async function csdl() {
  if (process.env.NODE_ENV === "production") {
    console.log("\n— Bỏ qua phần CSDL trên máy chủ thật");
    return;
  }
  const { prisma } = await import("../src/lib/prisma");
  const { taoToChuc } = await import("../src/lib/trung-tam-sk/may-chu");
  const { themDong, xoaNhieu } = await import("../src/lib/trung-tam-sk/api-bang");
  const { datCheckin, DAU_TRUNG_TAM } = await import("../src/lib/trung-tam-sk/checkin");
  const { khoaDiemSuKien } = await import("../src/lib/diem-su-kien");
  const nguoi = { id: "kiem-tra", ten: "Kiểm tra tự động" };
  const SDT = "0999888777";

  console.log("\n— CSDL (sự kiện + hội viên thử, tự xoá)");
  const hv = await prisma.member.create({
    data: {
      code: `TEST${Date.now() % 100000}`,
      slug: `kiem-tra-tt-sk-${Date.now()}`,
      name: "Trần Kiểm Thử",
      company: "CÔNG TY KIỂM THỬ TRUNG TÂM",
      phone: SDT,
      active: true,
      searchText: "tran kiem thu",
    },
  });
  let eventId = "";
  try {
    eventId = await taoToChuc({
      tieuDe: "Sự kiện kiểm thử Trung tâm",
      ngay: "2026-12-01",
      gio: "14:00",
      loai: "gala",
      quyMo: "lon",
      dungMau: true,
    });
    const sk = await prisma.skSuKien.findUniqueOrThrow({
      where: { eventId },
      include: { phien: { orderBy: { order: "asc" } }, _count: { select: { viec: true, kichBan: true, hauCan: true, thuChi: true } } },
    });
    kiem("tạo sự kiện lớn: 3 phiên + việc + kịch bản + hậu cần + dự trù", sk.phien.length === 3 && sk._count.viec > 20 && sk._count.kichBan > 10 && sk._count.hauCan > 5 && sk._count.thuChi > 5);
    const ev = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
    kiem("sự kiện mới chưa công bố lên web", ev.published === false);

    const r = await themDong("khach", eventId, [{ ten: "Trần Kiểm Thử", phone: SDT, donVi: "Công ty Kiểm Thử" }]);
    const k = "dong" in r ? r.dong[0] : null;
    kiem("thêm khách trùng SĐT hội viên → tự ghép hồ sơ", !!k && k.memberId === hv.id, JSON.stringify(r).slice(0, 120));

    const [p1, p2] = sk.phien;
    const c1 = await datCheckin({ eventId, khachId: k!.id, phienId: p1.id, coMat: true, nguoi });
    const c2 = await datCheckin({ eventId, khachId: k!.id, phienId: p2.id, coMat: true, nguoi });
    const td = await prisma.thamDuSuKien.findUnique({ where: { eventId_memberId: { eventId, memberId: hv.id } } });
    const diem = await prisma.diemHoatDong.findMany({ where: { nguon: khoaDiemSuKien(eventId, hv.id) } });
    kiem("check-in → ThamDuSuKien = DA_CHECKIN (đánh dấu Trung tâm)", td?.trangThai === "DA_CHECKIN" && td.checkinBoi === DAU_TRUNG_TAM);
    kiem("2 phiên vẫn chỉ MỘT dòng điểm", diem.length === 1 && c1.ok && c2.ok, `${diem.length} dòng`);
    kiem("lần check-in đầu báo điểm vừa cộng", c1.ok && c1.diem > 0 && c2.ok && c2.diem === 0);

    await datCheckin({ eventId, khachId: k!.id, phienId: p1.id, coMat: false, nguoi });
    const conDiem = await prisma.diemHoatDong.count({ where: { nguon: khoaDiemSuKien(eventId, hv.id) } });
    kiem("huỷ 1 phiên, còn phiên kia → giữ điểm", conDiem === 1);
    await datCheckin({ eventId, khachId: k!.id, phienId: p2.id, coMat: false, nguoi });
    const td2 = await prisma.thamDuSuKien.findUnique({ where: { eventId_memberId: { eventId, memberId: hv.id } } });
    const het = await prisma.diemHoatDong.count({ where: { nguon: khoaDiemSuKien(eventId, hv.id) } });
    kiem("huỷ hết check-in → lùi tham dự + gỡ điểm", td2?.trangThai === "DANG_KY" && het === 0);

    // Lượt quét Mini App (không do Trung tâm đánh dấu) không bị Trung tâm lùi
    await datCheckin({ eventId, khachId: k!.id, phienId: p1.id, coMat: true, nguoi });
    await prisma.thamDuSuKien.update({
      where: { eventId_memberId: { eventId, memberId: hv.id } },
      data: { checkinBoi: "HV0001" },
    });
    await datCheckin({ eventId, khachId: k!.id, phienId: p1.id, coMat: false, nguoi });
    const giu = await prisma.diemHoatDong.count({ where: { nguon: khoaDiemSuKien(eventId, hv.id) } });
    kiem("có lượt quét Mini App → huỷ ở Trung tâm vẫn giữ điểm", giu === 1);

    await datCheckin({ eventId, khachId: k!.id, phienId: p2.id, coMat: true, nguoi });
    await xoaNhieu("khach", [k!.id], nguoi);
    const tdSauXoa = await prisma.thamDuSuKien.findUnique({ where: { eventId_memberId: { eventId, memberId: hv.id } } });
    kiem("xoá khách → điểm theo lượt quét Mini App vẫn giữ", tdSauXoa?.trangThai === "DA_CHECKIN");

    const tt = await themDong("taitro", eventId, [{ nhaTaiTro: "NTT thử", mucTaiTro: "Vàng", hienKim: "50tr", trangThai: "Đang vận động" }]);
    const ttRow = "dong" in tt ? tt.dong[0] : null;
    const ql = ttRow ? await prisma.skQuyenLoi.count({ where: { taiTroId: ttRow.id } }) : 0;
    kiem("NTT hạng Vàng tự sinh quyền lợi, giá trị ≥ tiền mặt", !!ttRow && ql > 3 && Number(ttRow.giaTri) === 50e6);

    const sai = await themDong("thuchi", eventId, [{ hangMuc: "x", duTru: "abc" }]);
    kiem("API từ chối số tiền sai", "error" in sai);

    // ─── Đợt 2 ───
    const { napCong, dangKyCong, tuCheckinCong, phienHienTai } = await import("../src/lib/trung-tam-sk/cong");
    const { bocTham } = await import("../src/lib/trung-tam-sk/boc-tham");
    const { tinhDoiTenBan, lenhDoiTenBan } = await import("../src/lib/trung-tam-sk/may-chu");
    const sk2 = await prisma.skSuKien.findUniqueOrThrow({
      where: { eventId },
      include: { _count: { select: { hangTaiTro: true, nhaCungCap: true, ruiRo: true, giai: true } } },
    });
    kiem("tạo sự kiện: có mã cổng 6 ký tự + PIN 4 số", /^[a-z0-9]{6}$/.test(sk2.ma ?? "") && /^\d{4}$/.test(sk2.pinCheckin ?? ""));
    kiem(
      "tạo sự kiện: 6 hạng tài trợ + NCC + rủi ro + giải mẫu",
      sk2._count.hangTaiTro === 6 && sk2._count.nhaCungCap > 3 && sk2._count.ruiRo > 3 && sk2._count.giai > 0,
      JSON.stringify(sk2._count)
    );
    const vang = await prisma.skHangTaiTro.findFirst({ where: { skId: sk2.id, ten: "Kim cương" } });
    const tt2 = await themDong("taitro", eventId, [{ nhaTaiTro: "NTT theo hạng", mucTaiTro: "Kim cương", trangThai: "Cam kết" }]);
    const tt2Row = "dong" in tt2 ? tt2.dong[0] : null;
    kiem("chọn hạng không nhập tiền → lấy mức tiền của hạng ở chương trình này", !!vang && Number(tt2Row?.hienKim) === vang.mucTien && vang.mucTien > 0);

    // Cổng QR: đóng → không nạp được thao tác; mở → đăng ký / check-in
    await prisma.skSuKien.update({ where: { id: sk2.id }, data: { moDangKy: true, moTuCheckin: true } });
    const c = (await napCong(sk2.ma!))!;
    kiem("nạp cổng theo mã (không phân biệt hoa thường), mã lạ = null", !!c && !!(await napCong(sk2.ma!.toUpperCase())) && !(await napCong("zzzzzz")));
    kiem(
      "phiên hiện tại: chưa tới giờ → phiên đầu; quá giờ phiên 2 → phiên 2",
      phienHienTai([{ batDau: new Date("2030-01-01") }, { batDau: new Date("2030-01-02") }])?.batDau?.getFullYear() === 2030 &&
        phienHienTai([{ batDau: new Date("2020-01-01T08:00:00Z") }, { batDau: new Date("2020-01-01T13:00:00Z") }], new Date("2020-01-01T14:00:00Z"))?.batDau?.getUTCHours() === 13
    );
    const dk1 = await dangKyCong(c, { ten: "Khách Đăng Ký", phone: "0912 000 111", donVi: "Cty A" });
    const dk2 = await dangKyCong(c, { ten: "Tên Khác Hẳn", phone: "0912000111", donVi: "Cty B" });
    const kDk = await prisma.skKhach.findMany({ where: { skId: sk2.id, phone: "0912000111" }, include: { thamDu: true } });
    kiem(
      "đăng ký QR: trùng SĐT không tạo khách mới, không ghi đè tên",
      !dk1.status && !dk2.status && kDk.length === 1 && kDk[0].ten === "Khách Đăng Ký" && kDk[0].nguon === "ONLINE",
      JSON.stringify(kDk.map((k) => k.ten))
    );
    kiem("đăng ký QR: đánh dấu Tham dự mọi phiên", kDk[0]?.thamDu.length === c.phien.length && kDk[0].thamDu.every((t) => t.xacNhan === "CO"));
    kiem("đăng ký QR: trả lời không lộ tên khách đã có", !JSON.stringify(dk2.body).includes("Khách Đăng Ký"));
    kiem("đăng ký QR: SĐT sai bị từ chối", (await dangKyCong(c, { ten: "X", phone: "123" })).status === 400);

    const pinSai = await tuCheckinCong(c, { phone: "0912000111", pin: "0000" === c.pinCheckin ? "1111" : "0000" }, "may-thu");
    kiem("tự check-in: PIN sai bị từ chối", pinSai.status === 400);
    const ci = await tuCheckinCong(c, { phone: "0912000111", pin: c.pinCheckin }, "may-thu");
    const ci2 = await tuCheckinCong(c, { phone: "0912000111", pin: c.pinCheckin }, "may-thu");
    kiem("tự check-in: đúng PIN → check-in, lần 2 báo đã check-in", ci.body.ok === true && ci.body.daCo === false && ci2.body.daCo === true, JSON.stringify(ci.body));
    const vl = await tuCheckinCong(c, { phone: "0933000222", pin: c.pinCheckin }, "may-thu");
    const vl2 = await tuCheckinCong(c, { phone: "0933000222", pin: c.pinCheckin, ten: "Khách Vãng Lai" }, "may-thu");
    const kVl = await prisma.skKhach.findFirst({ where: { skId: sk2.id, phone: "0933000222" } });
    kiem("tự check-in: số lạ → hỏi họ tên → thêm khách vãng lai", vl.body.canThongTin === true && vl2.body.ok === true && kVl?.nguon === "TU_CHECKIN");
    let bi = 0;
    for (let i = 0; i < 9; i++) if ((await tuCheckinCong(c, { phone: "0912000111", pin: "x" }, "may-do")).status === 429) bi++;
    kiem("tự check-in: dò PIN sai liên tục → bị chặn tạm", bi > 0);
    datLaiGioiHanCong();

    // Bốc thăm: chỉ khách đã check-in, không trùng người, đủ suất thì dừng
    const g = await prisma.skGiai.create({ data: { skId: sk2.id, ten: "Giải thử", soLuong: 5 } });
    const daCi = await prisma.skKhach.count({ where: { skId: sk2.id, thamDu: { some: { checkinLuc: { not: null } } } } });
    const kq: string[] = [];
    let loiBt = "";
    for (let i = 0; i < 5; i++) {
      const r = await bocTham(sk2.id, g.id);
      if ("error" in r) {
        loiBt = r.error;
        break;
      }
      kq.push(r.id);
    }
    kiem(`bốc thăm: chỉ ${daCi} khách đã check-in vào vòng quay, hết người thì báo`, kq.length === daCi && new Set(kq).size === kq.length && !!loiBt, loiBt);
    await prisma.skTrungGiai.updateMany({ where: { giaiId: g.id, khachId: kq[0] }, data: { trangThai: "VANG" } });
    const lai = await bocTham(sk2.id, g.id);
    kiem("bốc thăm: khách vắng không được quay lại lần nữa", "error" in lai);

    // Đổi tên ban: người, việc đi theo
    await themDong("btc", eventId, [{ hoTen: "Người Hậu Cần", ban: "Ban Hậu cần", vaiTro: "TRUONG_BAN" }]);
    const viecHc = await prisma.skViec.count({ where: { skId: sk2.id, ban: "Ban Hậu cần" } });
    const doi = tinhDoiTenBan(sk2.cacBan, { cu: "Ban Hậu cần", moi: "Ban Hậu cần & Quà tặng" });
    if (!("error" in doi)) {
      await prisma.$transaction([prisma.skSuKien.update({ where: { id: sk2.id }, data: { cacBan: doi.cacBan } }), ...lenhDoiTenBan(eventId, sk2.id, doi.doiBan!)]);
    }
    const sauDoi = await prisma.skViec.count({ where: { skId: sk2.id, ban: "Ban Hậu cần & Quà tặng" } });
    const nguoiDoi = await prisma.banToChuc.count({ where: { eventId, ban: "Ban Hậu cần & Quà tặng" } });
    kiem("đổi tên ban: việc + người đi theo tên mới", !("error" in doi) && viecHc > 0 && sauDoi === viecHc && nguoiDoi === 1, `${viecHc}→${sauDoi}`);
    kiem("đổi tên ban: trùng tên ban khác bị chặn", "error" in tinhDoiTenBan(doi && "cacBan" in doi ? doi.cacBan : null, { cu: "Ban Truyền thông", moi: "Ban Hậu cần & Quà tặng" }));
    const xoaBan = tinhDoiTenBan("[{\"ten\":\"A\",\"moTa\":\"\"},{\"ten\":\"B\",\"moTa\":\"\"}]", { cu: "A", moi: "" });
    kiem("xoá ban: bỏ khỏi danh sách, người / việc về chưa xếp ban", !("error" in xoaBan) && xoaBan.cacBan === "[{\"ten\":\"B\",\"moTa\":\"\"}]" && xoaBan.doiBan?.moi === null);

    // Điểm BTC: một người ở 2 ban của cùng sự kiện chỉ tính một lần
    const { thongKeHoiVien } = await import("../src/lib/diem-hoat-dong");
    await themDong("btc", eventId, [
      { memberId: hv.id, ban: "Ban Truyền thông" },
      { memberId: hv.id, ban: "Ban Nội dung & MC" },
    ]);
    const soSk = (
      await prisma.banToChuc.findMany({ where: { memberId: hv.id }, select: { eventId: true }, distinct: ["eventId"] })
    ).length;
    const tkHv = await thongKeHoiVien(hv.id, 2026);
    kiem(
      "hội viên ở 2 ban cùng sự kiện → điểm BTC tính 1 lần",
      soSk === 1 && (await prisma.banToChuc.count({ where: { memberId: hv.id } })) === 2 && tkHv.chiTiet.soLanTrongBTC === 1,
      JSON.stringify(tkHv.chiTiet)
    );
  } finally {
    if (eventId) {
      await prisma.diemHoatDong.deleteMany({ where: { memberId: hv.id } });
      await prisma.event.delete({ where: { id: eventId } });
    }
    await prisma.member.delete({ where: { id: hv.id } });
    await prisma.$disconnect();
  }
}

(async () => {
  hamThuan();
  if (process.argv.includes("--csdl")) await csdl();
  console.log(`\n${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
})();
