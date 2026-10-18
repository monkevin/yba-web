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
import { BANG, docSo, epKieu, ngayNhap, tuNgayNhap } from "../src/lib/trung-tam-sk/bang";
import { LOAI_SU_KIEN, taoDuLieuMau, type QuyMo } from "../src/lib/trung-tam-sk/mau";

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
