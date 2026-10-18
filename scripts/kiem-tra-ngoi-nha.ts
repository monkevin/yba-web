/**
 * Kiểm tra game "Ngôi nhà Chợ Lớn".
 *
 *   npm run test:ngoinha            — soát nội dung + hàm luật chơi (không đụng CSDL)
 *   npm run test:ngoinha -- --csdl  — chạy thêm một ván thật trên CSDL bằng người
 *                                     chơi giả + mùa giải tạm, xoá sạch khi xong
 *
 * Phần CSDL tự bỏ qua nếu đang có mùa giải thật mở, để không lẫn số liệu.
 */
import { prisma } from "../src/lib/prisma";
import {
  CAU_HOI,
  CAU_THEO_ID,
  CHANG,
  NHIEM_VU,
  THE_CO_HOI,
  TRAM,
  cauCuaTram,
} from "../src/lib/ngoi-nha/noi-dung";
import {
  danhHieu,
  DIEM,
  DIEM_THUONG,
  diemChuoi,
  diemTocDo,
  HUY_HIEU,
  LOAI_CAU,
  thuongChuoiNgay,
  tinhSao,
  TONG_QUA_MUA,
} from "../src/lib/ngoi-nha/luat";
import {
  congNgay,
  dauTuan,
  khoangKy,
  ngayThuThach,
  ngayVN,
} from "../src/lib/ngoi-nha/thoi-gian";
import { CAU_HINH_NV } from "../src/lib/ngoi-nha/nhiem-vu";
import * as vd from "../src/lib/ngoi-nha/vinh-danh-thang";
import {
  docCoCau,
  PHAN_THUONG_MAC_DINH,
  tongQua,
} from "../src/lib/ngoi-nha/mua";
import {
  chuanMoc,
  chuanThongSo,
  MOC_QUA_MAC_DINH,
  THONG_SO_MAC_DINH,
  tienDoMoc,
} from "../src/lib/ngoi-nha/moc-qua";
import {
  CHU_DE_BO_CAU,
  deBaiThachDau,
  HANH_TRINH,
  maBoCuaDeBai,
  TAT_CA_BO,
} from "../src/lib/ngoi-nha/bo-cau";
import { CHU_DE_JSON } from "../src/lib/ngoi-nha/noi-dung/bo-cau";
import { BO_CAU_DAU_TRI } from "../src/lib/ngoi-nha/dau-tri";

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

async function kiemLoi(ten: string, fn: () => Promise<unknown>, ma?: string) {
  try {
    await fn();
    kiem(ten, false, "đáng lẽ phải báo lỗi");
  } catch (e) {
    const m = (e as { ma?: string }).ma;
    kiem(ten, !ma || m === ma, `mã lỗi ${m}`);
  }
}

function soatNoiDung() {
  console.log("\n— Nội dung —");
  kiem("22 trạm", TRAM.length === 22, String(TRAM.length));
  kiem("5 chặng", CHANG.length === 5);
  kiem(
    `Cơ cấu giải đúng ${TONG_QUA_MUA} phần quà`,
    tongQua(PHAN_THUONG_MAC_DINH) === TONG_QUA_MUA,
    String(tongQua(PHAN_THUONG_MAC_DINH)),
  );
  kiem(
    "Mốc áo thun mặc định: qua đủ Chặng 1 BIẾT (5 trạm)",
    MOC_QUA_MAC_DINH.some(
      (m) => m.ma === "AO_THUN" && m.loai === "CHANG" && m.nguong === 1,
    ) && TRAM.filter((t) => t.changSo === 1).length === 5,
  );
  kiem("220 câu hỏi", CAU_HOI.length === 220, String(CAU_HOI.length));
  kiem(
    "Mã câu không trùng",
    new Set(CAU_HOI.map((c) => c.id)).size === CAU_HOI.length,
  );
  for (const t of TRAM) {
    const n = cauCuaTram(t.ma).length;
    if (n !== 10) kiem(`Trạm ${t.ma} đủ 10 câu`, false, String(n));
  }
  kiem(
    "Mỗi trạm đủ 10 câu",
    TRAM.every((t) => cauCuaTram(t.ma).length === 10),
  );
  kiem(
    "Mỗi chặng có đúng một Trạm Thử thách ở cuối",
    CHANG.every(
      (c) =>
        c.tram.filter((t) => t.thuThach).length === 1 &&
        c.tram[c.tram.length - 1].thuThach,
    ),
  );
  const loi: string[] = [];
  for (const c of CAU_HOI) {
    if (!LOAI_CAU[c.t]) loi.push(`${c.id}: dạng ${c.t}`);
    if (!["CN", "TT", "XH", "TS"].includes(c.v))
      loi.push(`${c.id}: vốn ${c.v}`);
    if (
      (c.t === "chon" || c.t === "th") &&
      (c.a?.length !== 4 || new Set(c.a).size !== 4)
    )
      loi.push(`${c.id}: cần 4 phương án khác nhau`);
    if (c.t === "ds" && typeof c.d !== "boolean") loi.push(`${c.id}: thiếu d`);
    if (
      c.t === "xep" &&
      ((c.a?.length ?? 0) < 3 || new Set(c.a).size !== c.a!.length)
    )
      loi.push(`${c.id}: sắp xếp cần ≥3 mục khác nhau`);
    if (
      c.t === "ghep" &&
      ((c.p?.length ?? 0) < 3 ||
        new Set(c.p!.map((x) => x[1])).size !== c.p!.length)
    )
      loi.push(`${c.id}: ghép cặp cần ≥3 cặp, vế phải khác nhau`);
    if (!c.g?.trim()) loi.push(`${c.id}: thiếu giải thích`);
  }
  kiem("Câu hỏi đúng cấu trúc", loi.length === 0, loi.slice(0, 5).join("; "));
  kiem(
    "16 Thẻ Cơ hội, lựa chọn đầu là khôn ngoan",
    THE_CO_HOI.length === 16 &&
      THE_CO_HOI.every((t) => {
        const tong = t.lua.map((l) =>
          Object.values(l.von).reduce((s, x) => s + (x ?? 0), 0),
        );
        return t.lua.length >= 2 && tong[0] > Math.max(...tong.slice(1));
      }),
  );
  kiem(
    "16 nhiệm vụ đều có cấu hình xác nhận",
    NHIEM_VU.length === 16 &&
      NHIEM_VU.every(
        (n) =>
          CAU_HINH_NV[n.ma] &&
          (CAU_HINH_NV[n.ma].tuDong || CAU_HINH_NV[n.ma].thuCong),
      ),
  );
  kiem("12 huy hiệu", HUY_HIEU.length === 12);
}

function soatBoCau() {
  console.log("\n— Bộ câu thách đấu —");
  const tho = CHU_DE_JSON.flatMap((cd) => cd.bo.flatMap((b) => b.cau));
  const hopLe = TAT_CA_BO.flatMap((b) => b.cau);
  kiem(
    "Có khoảng 100 bộ câu (≥ 90)",
    TAT_CA_BO.length >= 90,
    String(TAT_CA_BO.length),
  );
  kiem(
    "Đủ 10 chủ đề",
    CHU_DE_BO_CAU.length >= 10,
    String(CHU_DE_BO_CAU.length),
  );
  const thieu = TAT_CA_BO.filter((b) => b.cau.length !== 10).map(
    (b) => `${b.ma}: ${b.cau.length}`,
  );
  kiem("Mỗi bộ đủ 10 câu", thieu.length === 0, thieu.slice(0, 5).join("; "));
  kiem(
    "Không câu nào hỏng cấu trúc (4 phương án khác nhau, đáp án 0–3)",
    hopLe.length === tho.length,
    `${tho.length - hopLe.length} câu hỏng`,
  );
  kiem(
    "Mã bộ không trùng",
    new Set(TAT_CA_BO.map((b) => b.ma)).size === TAT_CA_BO.length,
  );
  const chuan = (x: string) => x.toLowerCase().replace(/\s+/g, " ").trim();
  const trung = hopLe
    .map((c) => chuan(c.hoi))
    .filter((h, i, a) => a.indexOf(h) !== i);
  kiem(
    "Không trùng câu hỏi giữa các bộ",
    trung.length === 0,
    trung.slice(0, 3).join(" | "),
  );
  const dai = hopLe.filter(
    (c) => c.hoi.length > 170 || c.phuongAn.some((p) => p.length > 70),
  );
  kiem(
    "Câu và phương án đủ ngắn cho điện thoại",
    dai.length === 0,
    dai
      .slice(0, 3)
      .map((c) => c.hoi.slice(0, 40))
      .join(" | "),
  );
  kiem(
    "Có giải thích cho mọi câu",
    hopLe.every((c) => c.giai?.trim()),
  );
  kiem(
    "Không quảng cáo doanh nghiệp hội viên trong bộ câu",
    !/mon amie|hoàng vy/i.test(JSON.stringify(CHU_DE_JSON)),
  );
  const viTri = [0, 1, 2, 3].map(
    (k) => hopLe.filter((c) => c.dung === k).length,
  );
  kiem(
    "Đáp án đúng trải đều 4 vị trí",
    Math.max(...viTri) <= hopLe.length * 0.4,
    viTri.join("/"),
  );
  const cd = CHU_DE_BO_CAU[0];
  if (cd) {
    const de = deBaiThachDau(`CD:${cd.ma}`, 10, 15, {
      thach: new Set(cd.bo.slice(1).map((b) => b.ma)),
      doiThu: new Set(),
    });
    kiem(
      "Thách theo chủ đề ưu tiên bộ hai người chưa gặp, lưu giây mỗi câu",
      maBoCuaDeBai(de.deBai) === cd.bo[0].ma &&
        de.deBai.length === 10 &&
        de.deBai.every((m) => m.giay === 15),
    );
    const maCd = new Set(cd.bo.map((b) => b.ma));
    const hetCd = deBaiThachDau(`CD:${cd.ma}`, 10, 15, {
      thach: maCd,
      doiThu: new Set(),
    });
    kiem(
      "Người thách đã xem hết bộ của chủ đề → mở sang bộ chưa gặp, không lặp bộ cũ",
      !maCd.has(maBoCuaDeBai(hetCd.deBai) ?? ""),
      hetCd.tenBo,
    );
    const doiThuGap = deBaiThachDau(`CD:${cd.ma}`, 10, 15, {
      thach: new Set(),
      doiThu: maCd,
    });
    kiem(
      "Đối thủ đã gặp hết chủ đề nhưng người thách chưa → vẫn giữ đúng chủ đề",
      maCd.has(maBoCuaDeBai(doiThuGap.deBai) ?? ""),
    );
  }
  const ht = deBaiThachDau(HANH_TRINH, 10, 15, {
    thach: new Set(),
    doiThu: new Set(),
  });
  kiem(
    "Lựa chọn Hành trình 22 trạm vẫn rút từ ngân hàng câu",
    maBoCuaDeBai(ht.deBai) === null && ht.deBai.length === 10,
  );
  kiem(
    "Đấu trí sự kiện chọn được mọi bộ thách đấu",
    TAT_CA_BO.every((b) => BO_CAU_DAU_TRI.some((x) => x.ma === b.ma)),
  );
}

function soatLuat() {
  console.log("\n— Luật chơi —");
  {
    const sl = {
      tram: TRAM.map((t) => ({
        changSo: t.changSo,
        changTen: "BIẾT",
        daQua: t.changSo === 1,
      })),
      soTramQua: 5,
      soSao: 12,
      diem: 3000,
      tranThang: 2,
    };
    const ao = tienDoMoc(MOC_QUA_MAC_DINH[0], sl);
    const ve = tienDoMoc(MOC_QUA_MAC_DINH[1], sl);
    kiem(
      "Mốc chặng: qua 5/5 trạm Chặng 1 là đạt; mốc 22 trạm mới 5/22",
      ao.da === 5 && ao.tong === 5 && ve.da === 5 && ve.tong === 22,
    );
    const moc = chuanMoc([
      { ma: "giai", ten: "A", loai: "SAO", nguong: 999 },
      { ma: "x y", ten: "B", loai: "LAO", nguong: "5" },
      { ma: "X_Y", ten: "C" },
      { ten: "" },
    ]);
    kiem(
      "Làm sạch mốc: không dùng mã GIAI, mã trùng thêm hậu tố, ngưỡng bị chặn, bỏ dòng trống",
      moc.length === 3 &&
        moc[0].ma === "MOC_GIAI" &&
        moc[0].nguong === 66 &&
        moc[1].loai === "SO_TRAM" &&
        moc[1].nguong === 5 &&
        moc[1].ma === "X_Y" &&
        moc[2].ma === "X_Y_2",
      JSON.stringify(moc.map((m) => [m.ma, m.loai, m.nguong])),
    );
    const ts = chuanThongSo({
      dauTruong: { soCau: 99, giay: 1, thang: "abc" },
      luotTinhDiemToiDa: 0,
      cauThuong: false,
    });
    kiem(
      "Thông số nhập quá tay bị chặn trong giới hạn",
      ts.dauTruong.soCau === 10 &&
        ts.dauTruong.giay === 8 &&
        ts.dauTruong.thang === 300 &&
        ts.luotTinhDiemToiDa === 1 &&
        ts.cauThuong === false,
    );
    kiem(
      "Thông số mặc định giữ nguyên luật cũ (10 câu × 15 giây, thắng 300, 3 lượt)",
      JSON.stringify(chuanThongSo(null)) ===
        JSON.stringify(THONG_SO_MAC_DINH) &&
        THONG_SO_MAC_DINH.dauTruong.soCau === 10 &&
        THONG_SO_MAC_DINH.dauTruong.giay === 15 &&
        THONG_SO_MAC_DINH.dauTruong.thang === 300 &&
        THONG_SO_MAC_DINH.luotTinhDiemToiDa === 3,
    );
    const cu = docCoCau(JSON.stringify(PHAN_THUONG_MAC_DINH));
    kiem(
      "Cơ cấu quà lưu kiểu cũ (chỉ mảng giải) vẫn đọc được, mốc lấy mặc định",
      cu?.giai.length === PHAN_THUONG_MAC_DINH.length &&
        cu?.moc.length === MOC_QUA_MAC_DINH.length,
    );
  }
  kiem(
    "Sao trạm thường: 5 câu = 0, 6 = 1, 8 = 2, 10 = 3",
    tinhSao(5, false) === 0 &&
      tinhSao(6, false) === 1 &&
      tinhSao(8, false) === 2 &&
      tinhSao(10, false) === 3,
  );
  kiem(
    "Trạm Thử thách: 6 câu chưa qua, 7 câu qua",
    tinhSao(6, true) === 0 && tinhSao(7, true) === 1,
  );
  kiem(
    "Tốc độ: trả lời ngay +50, hết giờ +0",
    diemTocDo(0, 20000) === 50 &&
      diemTocDo(20000, 20000) === 0 &&
      diemTocDo(10000, 20000) === 25,
  );
  kiem(
    "Chuỗi: câu 2 +0, câu 3 +20, câu 5 +50",
    diemChuoi(2) === 0 &&
      diemChuoi(3) === 20 &&
      diemChuoi(4) === 20 &&
      diemChuoi(5) === 50,
  );
  // Điểm tối đa một trạm theo kịch bản: 10 × 150 + 2 × 20 + 6 × 50 = 1.840
  let toiDa = 0;
  for (let i = 1; i <= 10; i++)
    toiDa += DIEM.DUNG + DIEM.TOC_DO_TOI_DA + diemChuoi(i);
  kiem("Điểm tối đa trạm thường 1.840", toiDa === 1840, String(toiDa));
  kiem(
    "Thưởng chuỗi ngày 50 × ngày, tối đa 300",
    thuongChuoiNgay(2) === 100 && thuongChuoiNgay(9) === 300,
  );
  kiem(
    "Danh hiệu theo điểm",
    danhHieu(0, false).hienTai.ten === "Tân binh" &&
      danhHieu(3000, false).hienTai.ten === "Huynh đệ" &&
      danhHieu(40000, false).hienTai.ten === "Vươn tầm" &&
      danhHieu(100, true).hienTai.ten === "Ngọn lửa Chợ Lớn",
  );
  // 5:59 sáng 15/09 giờ VN (= 22:59 UTC 14/09) vẫn là thử thách ngày 14/09
  kiem(
    "Thử thách sang ngày lúc 6:00 giờ VN",
    ngayThuThach(new Date("2026-09-14T22:59:00Z")) === "2026-09-14" &&
      ngayThuThach(new Date("2026-09-14T23:00:00Z")) === "2026-09-15",
  );
  kiem(
    "Ngày VN lúc 23:30 UTC là hôm sau",
    ngayVN(new Date("2026-09-14T17:30:00Z")) === "2026-09-15",
  );
  kiem(
    "Cộng ngày qua tháng",
    congNgay("2026-09-30", 1) === "2026-10-01" &&
      congNgay("2026-03-01", -1) === "2026-02-28",
  );
  const t = dauTuan(new Date("2026-09-16T05:00:00Z")); // thứ Tư
  kiem(
    "Đầu tuần là 0:00 thứ Hai giờ VN",
    t.toISOString() === "2026-09-13T17:00:00.000Z",
    t.toISOString(),
  );
  const th = khoangKy("THANG", new Date("2026-12-31T20:00:00Z")); // 3:00 sáng 01/01/2027 giờ VN
  kiem(
    "Kỳ tháng theo giờ VN",
    th.tu.toISOString() === "2026-12-31T17:00:00.000Z",
    th.tu.toISOString(),
  );
}

async function chayCsdl() {
  console.log("\n— Ván thử trên CSDL —");
  const muaThat = await prisma.nnMua.findFirst({
    where: { trangThai: "DANG_MO" },
  });
  if (muaThat) {
    console.log(
      "BỎ QUA  đang có mùa giải thật mở — không chạy ván thử để khỏi lẫn số liệu",
    );
    return;
  }
  const dc = await import("../src/lib/ngoi-nha/dong-co");
  const th = await import("../src/lib/ngoi-nha/tong-hop");
  const nv = await import("../src/lib/ngoi-nha/nhiem-vu");
  const { muaHienTai } = await import("../src/lib/ngoi-nha/mua");

  const userId = `kiem-tra-nn-${Date.now()}`;
  const userB = `${userId}-b`;
  const nguoi = { userId, memberId: null };
  // Ca kiểm thử tính theo luật mặc định — Ban có chỉnh thông số trên máy này
  // cũng không làm test báo sai; trả lại bản gốc ở cuối
  const ch = await import("../src/lib/ngoi-nha/cau-hinh");
  const mq = await import("../src/lib/ngoi-nha/moc-qua");
  const thongSoGoc = await prisma.siteSetting.findUnique({
    where: { key: ch.KHOA_THONG_SO },
  });
  await ch.ghiThongSo(mq.THONG_SO_MAC_DINH);
  // Chưa có mùa giải: chơi thử vẫn ghi sổ cái riêng CHOI_THU để người chơi thấy điểm ngay
  {
    const m0 = await muaHienTai();
    kiem(
      "Chưa có mùa → chơi thử nhưng vẫn tính điểm",
      m0.id === "CHOI_THU" && m0.tinhDiem,
    );
    const l0 = await dc.batDauTram(nguoi, "1.1");
    let ph0;
    for (let i = 0; i < 12; i++) {
      await dc.moCau(nguoi, l0.luotId);
      ph0 = await dc.traLoi(nguoi, l0.luotId, i, await dapAnDung(l0.luotId));
      if (ph0.cuoi) break;
    }
    const so0 = await prisma.nnSoCai.count({
      where: { userId, muaId: "CHOI_THU" },
    });
    const bxh0 = await th.bangXepHang("CHOI_THU", "mua", userId);
    kiem(
      "Chơi thử ghi sổ cái và lên bảng chơi thử",
      so0 > 0 && !!ph0?.ketQua?.choiThu && !!bxh0.cuaToi,
      `${so0} dòng, hạng ${bxh0.cuaToi?.hang}`,
    );
  }

  const mua = await prisma.nnMua.create({
    data: {
      ten: "__KIEM_TRA__",
      batDau: new Date(Date.now() - 3600e3),
      ketThuc: new Date(Date.now() + 7 * 86400e3),
      trangThai: "DANG_MO",
    },
  });

  /** Trả lời đúng câu đang mở bằng cách đọc đề bài đã xáo trong CSDL. */
  async function dapAnDung(luotId: string) {
    const l = await prisma.nnLuot.findUniqueOrThrow({ where: { id: luotId } });
    const muc = (
      JSON.parse(l.deBai) as {
        id: string;
        tt: number[];
        thuong?: { dung?: number };
        cau?: (typeof CAU_HOI)[number];
      }[]
    )[l.viTri];
    if (muc.thuong) return { chon: muc.thuong.dung ?? 0 };
    // Câu soạn riêng (đấu trí sự kiện) nằm ngay trong đề bài
    const c = muc.cau ?? CAU_THEO_ID[muc.id];
    const n = muc.tt.length;
    if (c.t === "chon" || c.t === "th") return { chon: muc.tt.indexOf(0) };
    if (c.t === "ds") return { dung: !!c.d };
    if (c.t === "xep")
      return { thuTu: [...Array(n).keys()].map((k) => muc.tt.indexOf(k)) };
    return { cap: [...Array(n).keys()].map((k) => muc.tt.indexOf(k)) };
  }

  try {
    const m = await muaHienTai();
    kiem("Nhận mùa giải đang diễn ra", m.id === mua.id && m.tinhDiem);

    await kiemLoi(
      "Trạm 1.2 chưa mở khi chưa qua 1.1",
      () => dc.batDauTram(nguoi, "1.2"),
      "CHUA_MO",
    );

    // Lượt 1: đúng cả 10 câu, không trợ giúp
    const l1 = await dc.batDauTram(nguoi, "1.1");
    kiem("Lượt đầu là lượt tính điểm", l1.cheDo === "TINH_DIEM");
    let ph;
    for (let i = 0; i < 12; i++) {
      const mo = await dc.moCau(nguoi, l1.luotId);
      if (i === 0) {
        kiem(
          "Câu gửi xuống không kèm đáp án",
          !JSON.stringify(mo.cau).includes('"a"') &&
            !JSON.stringify(mo.cau).includes('"g"'),
        );
        const moLai = await dc.moCau(nguoi, l1.luotId);
        kiem(
          "Mở lại câu không đặt lại đồng hồ",
          (moLai.cau?.conLaiMs ?? 0) <= (mo.cau?.conLaiMs ?? 0),
        );
      }
      ph = await dc.traLoi(nguoi, l1.luotId, i, await dapAnDung(l1.luotId));
      if (i === 0) {
        await kiemLoi(
          "Trả lời lại câu đã ghi nhận bị chặn",
          () => dc.traLoi(nguoi, l1.luotId, 0, { chon: 0 }),
          "LECH",
        );
      }
      if (ph.cuoi) break;
    }
    const kq1 = ph!.ketQua!;
    const deBai1 = JSON.parse(
      (await prisma.nnLuot.findUniqueOrThrow({ where: { id: l1.luotId } }))
        .deBai,
    ) as { thuong?: unknown }[];
    kiem(
      "Câu thưởng cuối lượt được chấm (10 câu chính + 1 câu thưởng)",
      deBai1.length === 11 &&
        deBai1[10].thuong !== undefined &&
        kq1.thuong !== null &&
        kq1.tong === 10,
      `${deBai1.length} mục`,
    );
    kiem(
      "10/10 câu → 3 sao, qua trạm",
      kq1.soDung === 10 && kq1.sao === 3 && kq1.daQua,
    );
    kiem(
      "Điểm lượt nằm trong khoảng hợp lý (tối đa 1.840 + câu thưởng)",
      kq1.diem > 1500 && kq1.diem <= 1840 + DIEM_THUONG.HOI_VIEN,
      String(kq1.diem),
    );
    kiem("Điểm ghi nhận = điểm lượt đầu", kq1.diemGhiNhan === kq1.diem);
    kiem("Mở thẻ sưu tầm lần đầu qua trạm", !!kq1.theSuuTam);
    kiem("Được rút Thẻ Cơ hội", kq1.coTheCoHoi);
    kiem(
      "Nhận huy hiệu Hoàn hảo",
      kq1.huyHieuMoi.some((h) => h.ma === "HOAN_HAO"),
    );
    const vonTT = kq1.von.TT;
    kiem(
      "Qua trạm chặng BIẾT cộng Vốn tri thức (+5 và câu đúng)",
      vonTT >= 5,
      JSON.stringify(kq1.von),
    );
    const kqLai = await dc.ketThucLuot(nguoi, l1.luotId);
    kiem(
      "Chốt lượt lần hai không cộng thêm",
      kqLai.diemGhiNhan === kq1.diemGhiNhan,
    );

    // Thẻ Cơ hội
    const the = await dc.rutTheCoHoi(nguoi, l1.luotId);
    const theLai = await dc.rutTheCoHoi(nguoi, l1.luotId);
    kiem(
      "Rút lại (tải lại trang) vẫn ra đúng thẻ và thứ tự",
      the.ma === theLai.ma && the.lua.join("|") === theLai.lua.join("|"),
    );
    const chon = await dc.chonTheCoHoi(nguoi, l1.luotId, 0);
    kiem("Chọn Thẻ Cơ hội ghi nhận vốn", chon.ghiNhan);
    await kiemLoi(
      "Không chọn Thẻ Cơ hội lần hai",
      () => dc.chonTheCoHoi(nguoi, l1.luotId, 1),
      "DA_RUT",
    );

    // Lượt 2: trợ giúp + hết giờ + sai
    const l2 = await dc.batDauTram(nguoi, "1.1");
    const mo2 = await dc.moCau(nguoi, l2.luotId);
    const c2 = mo2.cau!.cau;
    if (c2.loai === "chon" || c2.loai === "th") {
      const tg = await dc.dungTroGiup(nguoi, l2.luotId, 0, "5050");
      const muc = (
        JSON.parse(
          (await prisma.nnLuot.findUniqueOrThrow({ where: { id: l2.luotId } }))
            .deBai,
        ) as { tt: number[] }[]
      )[0];
      kiem(
        "50:50 loại đúng 2 phương án sai",
        tg.an?.length === 2 && tg.an.every((d) => muc.tt[d] !== 0),
      );
      await kiemLoi("Không dùng 50:50 hai lần", () =>
        dc.dungTroGiup(nguoi, l2.luotId, 0, "5050"),
      );
    }
    const gio = await dc.dungTroGiup(nguoi, l2.luotId, 0, "GIO");
    kiem(
      "Thêm giờ cộng 15 giây",
      gio.gioiHanMs ===
        (LOAI_CAU[c2.loai as keyof typeof LOAI_CAU].giay + 15) * 1000,
    );
    // Đẩy giờ mở câu lùi về quá khứ → hết giờ dù gửi đáp án đúng
    await prisma.nnLuot.update({
      where: { id: l2.luotId },
      data: { cauMoLuc: new Date(Date.now() - 120_000) },
    });
    const ph2 = await dc.traLoi(
      nguoi,
      l2.luotId,
      0,
      await dapAnDung(l2.luotId),
    );
    kiem("Quá giờ ở máy chủ → hết giờ, 0 điểm", ph2.hetGio && ph2.diem === 0);
    // Bỏ ngang sau 1 câu → chốt với 0/10, không vượt kỷ lục
    const kq2 = await dc.ketThucLuot(nguoi, l2.luotId);
    kiem(
      "Bỏ ngang: chốt với số câu đã trả lời, không cộng điểm",
      kq2.soDung === 0 && kq2.diemGhiNhan === 0 && kq2.sao === 0,
    );
    kiem(
      "Còn 1 lượt tính điểm",
      kq2.luotTinhDiemConLai === 1,
      String(kq2.luotTinhDiemConLai),
    );

    const l3 = await dc.batDauTram(nguoi, "1.1");
    await dc.ketThucLuot(nguoi, l3.luotId);
    const l4 = await dc.batDauTram(nguoi, "1.1");
    kiem("Hết 3 lượt tính điểm → luyện tập", l4.cheDo === "LUYEN_TAP");
    await dc.ketThucLuot(nguoi, l4.luotId);

    // Trạm 1.2 đã mở
    const l5 = await dc.batDauTram(nguoi, "1.2");
    kiem("Qua 1.1 thì mở 1.2", !!l5.luotId);
    // Hỏi Huynh đệ khi chưa có ai trả lời: câu 4 phương án → gợi ý loại 1 phương án
    const mo5 = await dc.moCau(nguoi, l5.luotId);
    const hoi = await dc.dungTroGiup(nguoi, l5.luotId, 0, "HOI");
    const loai5 = mo5.cau!.cau.loai;
    kiem(
      "Hỏi Huynh đệ chưa đủ số liệu → gợi ý thật",
      loai5 === "chon" || loai5 === "th"
        ? hoi.an?.length === 1
        : loai5 === "ds"
          ? !!hoi.hoanLai
          : !!hoi.goiY,
      JSON.stringify(hoi),
    );
    await dc.ketThucLuot(nguoi, l5.luotId);

    // Thử thách hằng ngày
    const ngay = await dc.batDauThuThachNgay(nguoi);
    const ngayLai = await dc.batDauThuThachNgay(nguoi);
    kiem("Mỗi ngày một thử thách", ngay.luotId === ngayLai.luotId);
    let phNgay;
    for (let i = 0; i < 7; i++) {
      await dc.moCau(nguoi, ngay.luotId);
      phNgay = await dc.traLoi(
        nguoi,
        ngay.luotId,
        i,
        await dapAnDung(ngay.luotId),
      );
      if (phNgay.cuoi) break;
    }
    const kqNgay = phNgay!.ketQua!;
    kiem(
      "Thử thách 5 câu chấm xong, có thưởng chuỗi ngày",
      kqNgay.tong === 5 && kqNgay.soDung === 5 && kqNgay.thuongChuoiNgay === 50,
      JSON.stringify({ tong: kqNgay.tong, thuong: kqNgay.thuongChuoiNgay }),
    );

    // Sổ cái & bảng xếp hạng
    const tong = await prisma.nnSoCai.aggregate({
      where: { userId, muaId: mua.id },
      _sum: { diem: true },
    });
    const bxh = await th.bangXepHang(mua.id, "mua", userId);
    kiem(
      "Bảng xếp hạng khớp sổ cái",
      bxh.cuaToi?.giaTri === tong._sum.diem,
      `${bxh.cuaToi?.giaTri} / ${tong._sum.diem}`,
    );
    // Vinh danh tháng: điểm tính RIÊNG trong tháng, ghi nhận bằng mã VD_<yyyymm>
    {
      const thang = vd.maThangVN();
      const top = await vd.topThang(mua.id, thang, 10);
      const toi = top.find((d) => d.userId === userId);
      kiem(
        "Top tháng lấy đúng điểm trong tháng, chưa vinh danh",
        !!toi && toi.diem === (tong._sum.diem ?? 0) && toi.daVinhDanh === false,
        `${toi?.diem} / ${tong._sum.diem}`,
      );
      const thangTruoc = await vd.topThang(mua.id, "2020-01", 10);
      kiem(
        "Tháng không có dòng sổ cái nào thì bảng trống",
        thangTruoc.length === 0,
      );
      kiem(
        "Đầu bảng tháng được kèm quà khi chưa chạm trần",
        toi?.nhanQua === true && toi?.soLanNhanQua === 0 && !toi?.nhuongQua,
      );
      await prisma.nnTraoQua.create({
        data: {
          userId,
          muaId: mua.id,
          loai: vd.maVinhDanhThang(thang),
          ghiChu: `Hạng 1 · ${vd.DAU_CO_QUA}`,
        },
      });
      const sau = await vd.topThang(mua.id, thang, 10);
      const daGhi = await vd.vinhDanhCuaToi(userId, mua.id);
      kiem(
        "Ghi vinh danh xong thì hiện “đã vinh danh” và người chơi xem lại được",
        sau.find((d) => d.userId === userId)?.daVinhDanh === true &&
          daGhi.length === 1 &&
          daGhi[0].maThang === thang &&
          daGhi[0].coQua === true,
        `${daGhi.map((x) => x.ten).join(",")}`,
      );

      // Trần quà tháng: nhận 2 lần rồi thì tháng sau chỉ vinh danh, nhường quà
      await prisma.nnTraoQua.create({
        data: {
          userId,
          muaId: mua.id,
          loai: vd.maVinhDanhThang(
            vd.maThangVN(new Date(Date.now() - 40 * 86400e3)),
          ),
          ghiChu: `Hạng 2 · ${vd.DAU_CO_QUA}`,
        },
      });
      const chanQua = await vd.topThang(mua.id, thang, 10);
      const toiChan = chanQua.find((d) => d.userId === userId);
      kiem(
        "Nhận quà tháng đủ 2 lần → vẫn vinh danh nhưng nhường suất quà",
        toiChan?.soLanNhanQua === 2 &&
          toiChan?.nhanQua === false &&
          toiChan?.nhuongQua === true,
        JSON.stringify({
          soLan: toiChan?.soLanNhanQua,
          nhanQua: toiChan?.nhanQua,
        }),
      );
      // Lần vinh danh KHÔNG kèm quà không tính vào trần
      await prisma.nnTraoQua.deleteMany({ where: { userId, muaId: mua.id } });
      await prisma.nnTraoQua.create({
        data: {
          userId,
          muaId: mua.id,
          loai: vd.maVinhDanhThang(
            vd.maThangVN(new Date(Date.now() - 40 * 86400e3)),
          ),
          ghiChu: "Hạng 5",
        },
      });
      const khongQua = await vd.topThang(mua.id, thang, 10);
      kiem(
        "Vinh danh không kèm quà không tính vào trần 2 lần",
        khongQua.find((d) => d.userId === userId)?.soLanNhanQua === 0,
      );
      await prisma.nnTraoQua.deleteMany({ where: { userId, muaId: mua.id } });
    }

    const hs = await th.hoSoNguoiChoi(nguoi, m);
    kiem(
      "Hồ sơ: 1 trạm qua, trạm tiếp theo là 1.2",
      hs.soTramQua === 1 && hs.tramTiep?.ma === "1.2",
      `${hs.soTramQua} ${hs.tramTiep?.ma}`,
    );
    kiem(
      "Hồ sơ: thử thách hôm nay đã xong, chuỗi 1 ngày",
      hs.thuThach.trangThai === "XONG" && hs.thuThach.chuoiNgay === 1,
    );

    // Nhiệm vụ: tài khoản không gắn hội viên
    await kiemLoi("Nhiệm vụ cần tài khoản gắn hội viên", () =>
      nv.guiNhiemVu(nguoi, {
        maNv: "NV05",
        moTa: "Chia sẻ tại Coffee Share số 7",
      }),
    );
    const hvLienQuan = await prisma.member.findFirst({
      where: { active: true },
      select: { id: true },
    });
    const hvGia = await prisma.member.findFirst({
      where: { active: true, id: { not: hvLienQuan!.id } },
      select: { id: true },
    });
    const nguoiCoHv = { userId: userB, memberId: hvGia!.id };
    const yc = await nv.guiNhiemVu(nguoiCoHv, {
      maNv: "NV03",
      moTa: "Giới thiệu nhà cung cấp bao bì",
      lienQuanMemberId: hvLienQuan!.id,
    });
    await kiemLoi("Người không liên quan không xác nhận được", () =>
      nv.xuLyNhiemVu(
        { userId: "ai-do", memberId: "khong-phai", laBan: false },
        yc.id,
        true,
      ),
    );
    const xl = await nv.xuLyNhiemVu(
      { userId: "nguoi-lien-quan", memberId: hvLienQuan!.id, laBan: false },
      yc.id,
      true,
    );
    const soCaiNv = await prisma.nnSoCai.findFirst({
      where: { userId: userB, loai: "NHIEM_VU" },
    });
    kiem(
      "Người được giới thiệu xác nhận → cộng Vốn xã hội +8 và 500 điểm",
      xl.trangThai === "DA_XAC_NHAN" &&
        soCaiNv?.vonXH === 8 &&
        soCaiNv?.diem === 500,
    );

    // ── Đấu trường 1-1 ──
    const dt = await import("../src/lib/ngoi-nha/dau-truong");
    const uA = await prisma.user.findFirst({
      where: { active: true, memberId: { not: null } },
      select: { id: true },
    });
    const ncAGoc = await prisma.nnNguoiChoi.findUnique({
      where: { userId: uA!.id },
    });
    // userB (giả) thách một tài khoản hội viên thật — chỉ tạo bản ghi NnTranDau, xoá ở cuối
    await kiemLoi("Không tự thách đấu chính mình", () =>
      dt.taoTranDau(nguoiCoHv, userB),
    );
    const tranId = await dt.taoTranDau(nguoiCoHv, uA!.id);
    await kiemLoi("Mỗi cặp chỉ một trận dang dở", () =>
      dt.taoTranDau(nguoiCoHv, uA!.id),
    );
    const cauA = await dt.cauTranDau(nguoiCoHv, tranId);
    kiem(
      "Trận có 10 câu trắc nghiệm, không lộ đáp án",
      cauA.cau.length === 10 &&
        cauA.cau.every((c) => c.phuongAn?.length === 4) &&
        !JSON.stringify(cauA).includes('"a"'),
    );
    await kiemLoi("Đối thủ chưa tới lượt", () =>
      dt.cauTranDau({ userId: uA!.id, memberId: null }, tranId),
    );
    const deBaiTran = JSON.parse(
      (await prisma.nnTranDau.findUniqueOrThrow({ where: { id: tranId } }))
        .deBai,
    ) as { tt: number[] }[];
    const dungHet = deBaiTran.map((m) => m.tt.indexOf(0));
    const kqA = await dt.nopTranDau(nguoiCoHv, tranId, dungHet, 30_000);
    kiem("Người thách nộp 10/10, chờ đối thủ", kqA.soDung === 10 && !kqA.xong);
    await dt.cauTranDau({ userId: uA!.id, memberId: null }, tranId);
    const kqB = await dt.nopTranDau(
      { userId: uA!.id, memberId: null },
      tranId,
      dungHet.map((d, i) => (i < dungHet.length - 2 ? d : (d + 1) % 4)),
      25_000,
    );
    kiem(
      "Đối thủ 8/10 → người thách thắng",
      kqB.soDung === 8 && kqB.xong && kqB.thang === false,
    );
    const soCaiTran = await prisma.nnSoCai.findMany({
      where: { nguon: `tran:${tranId}` },
    });
    kiem(
      "Cả hai bên được ghi sổ cái: thắng 300+100, thua 50+80",
      soCaiTran.length === 2 &&
        soCaiTran.some((s) => s.diem === 400) &&
        soCaiTran.some((s) => s.diem === 130),
    );
    const ncB = await prisma.nnNguoiChoi.findUnique({
      where: { userId: userB },
    });
    kiem("Thành tích cập nhật: người thách +1 thắng", ncB?.tranThang === 1);

    // ── Tìm đối thủ gồm cả tài khoản không gắn hội viên + thách theo chủ đề ──
    {
      const tk = await prisma.user.create({
        data: {
          username: `${userId}-thuky`,
          name: "Thư ký kiểm tra tìm đối thủ",
          passwordHash: "x",
          role: "STAFF",
        },
      });
      const tranTam: string[] = [];
      let tranCd = "";
      try {
        await prisma.nnNguoiChoi.create({ data: { userId: tk.id } });
        const tim = await dt.timDoiThu(nguoiCoHv, "thu ky kiem tra tim");
        kiem(
          "Gõ “thư ký” tìm ra tài khoản không gắn hội viên đã vào game",
          tim.some((d) => d.userId === tk.id),
        );
        const goiY = await dt.timDoiThu(nguoiCoHv, "");
        kiem("Ô tìm trống vẫn gợi ý người chơi", goiY.length > 0);
        const cd0 = CHU_DE_BO_CAU[0];
        if (cd0) {
          tranCd = await dt.taoTranDau(nguoiCoHv, tk.id, `CD:${cd0.ma}`);
          const ct = await dt.chiTietTran(nguoiCoHv, tranCd);
          kiem(
            "Thách theo chủ đề: đề đúng chủ đề, 10 câu, có tên bộ",
            !!ct && ct.tenBo.startsWith(cd0.ten) && ct.soCau === 10,
            ct?.tenBo,
          );
          const cauCd = await dt.cauTranDau(nguoiCoHv, tranCd);
          kiem(
            "Câu thách đấu từ bộ câu không lộ đáp án",
            cauCd.cau.length === 10 &&
              !JSON.stringify(cauCd).includes('"a":') &&
              !JSON.stringify(cauCd).includes('"g":'),
          );
        }

        // Chống cày điểm: cùng một cặp chỉ 2 trận có điểm mỗi ngày
        const nguoiTk = { userId: tk.id, memberId: null };
        const choiHet = async (id: string) => {
          const de = JSON.parse(
            (await prisma.nnTranDau.findUniqueOrThrow({ where: { id } })).deBai,
          ) as { tt: number[] }[];
          const dung = de.map((m) => m.tt.indexOf(0));
          // Mở đề trước khi nộp: máy chủ chấm giờ theo mốc mở đề, nộp chay bị từ chối
          await dt.cauTranDau(nguoiCoHv, id);
          await dt.nopTranDau(nguoiCoHv, id, dung, 0);
          await dt.cauTranDau(nguoiTk, id);
          return dt.nopTranDau(nguoiTk, id, dung, 0);
        };
        if (!tranCd) {
          tranCd = await dt.taoTranDau(nguoiCoHv, tk.id);
        }
        const kq1 = await choiHet(tranCd);
        const t2 = await dt.taoTranDau(nguoiCoHv, tk.id);
        tranTam.push(t2);
        const kq2 = await choiHet(t2);
        const t3 = await dt.taoTranDau(nguoiCoHv, tk.id);
        tranTam.push(t3);
        const kq3 = await choiHet(t3);
        const soCai3 = await prisma.nnSoCai.count({
          where: { nguon: `tran:${t3}` },
        });
        kiem(
          "Hai trận đầu trong ngày của một cặp có điểm, trận thứ ba chỉ tính thắng thua",
          kq1.tinhDiem !== false &&
            kq2.tinhDiem !== false &&
            kq3.xong &&
            kq3.tinhDiem === false &&
            kq3.diem === 0 &&
            soCai3 === 0,
          `${kq1.tinhDiem}/${kq2.tinhDiem}/${kq3.tinhDiem} · ${kq3.ghiChuDiem ?? ""}`,
        );
        const tMs = await prisma.nnTranDau.findUniqueOrThrow({
          where: { id: t3 },
        });
        kiem(
          "Nộp “0 giây” bị nâng lên sàn 1 giây mỗi câu",
          tMs.thachMs === 10_000 &&
            tMs.doiThuMs === 10_000 &&
            kq3.thang === null,
          `${tMs.thachMs}/${tMs.doiThuMs}`,
        );
      } finally {
        const ds = [tranCd, ...tranTam].filter(Boolean);
        await prisma.nnTranDau.deleteMany({ where: { id: { in: ds } } });
        await prisma.nnSoCai.deleteMany({ where: { userId: tk.id } });
        await prisma.nnNguoiChoi.deleteMany({ where: { userId: tk.id } });
        await prisma.user.delete({ where: { id: tk.id } });
      }
    }

    // ── Cơ cấu quà mẫu lưu trong SiteSetting ──
    {
      const m = await import("../src/lib/ngoi-nha/mua");
      const goc = await prisma.siteSetting.findUnique({
        where: { key: m.KHOA_CO_CAU_MAU },
      });
      try {
        await m.ghiCoCauMau({
          giai: [
            {
              hangMuc: "Giải thử",
              dieuKien: "",
              qua: "Quà thử",
              soLuong: "01",
            },
          ],
          moc: [
            {
              ma: "THU",
              ten: "Mốc thử",
              loai: "SAO",
              nguong: 3,
              qua: "q",
              soLuong: "Mỗi người đạt",
            },
          ],
        });
        const doc = await m.coCauMau();
        kiem(
          "Lưu cơ cấu quà mẫu rồi đọc lại đúng",
          doc.giai[0]?.hangMuc === "Giải thử" && doc.moc[0]?.ma === "THU",
        );
      } finally {
        if (goc)
          await prisma.siteSetting.update({
            where: { key: goc.key },
            data: { value: goc.value },
          });
        else
          await prisma.siteSetting.deleteMany({
            where: { key: m.KHOA_CO_CAU_MAU },
          });
      }
    }

    // ── Đấu trí sự kiện ──
    const dtri = await import("../src/lib/ngoi-nha/dau-tri");
    const phien = await dtri.taoDauTri({
      ten: "__KIEM_TRA_DAU_TRI__",
      boCau: "kinh-te-2026-09",
      giayMoiCau: 20,
    });
    await kiemLoi(
      "Phiên chưa mở thì chưa vào được",
      () => dc.batDauDauTri(nguoi, phien.id),
      "CHUA_MO",
    );
    await dtri.doiTrangThaiDauTri(phien.id, "DANG_MO");
    const lDt = await dc.batDauDauTri(nguoi, phien.id);
    const lDt2 = await dc.batDauDauTri(nguoi, phien.id);
    kiem("Mỗi người một lượt trong phiên", lDt.luotId === lDt2.luotId);
    await kiemLoi("Đấu trí không có trợ giúp", async () => {
      await dc.moCau(nguoi, lDt.luotId);
      await dc.dungTroGiup(nguoi, lDt.luotId, 0, "5050");
    });
    let phDt;
    for (let i = 0; i < 12; i++) {
      await dc.moCau(nguoi, lDt.luotId);
      phDt = await dc.traLoi(nguoi, lDt.luotId, i, await dapAnDung(lDt.luotId));
      if (phDt.cuoi) break;
    }
    const kqDt = phDt!.ketQua!;
    kiem(
      "Đấu trí: 10 câu kinh tế, chấm xong, có mã phiên",
      kqDt.tong === 10 &&
        kqDt.soDung === 10 &&
        kqDt.dauTriId === phien.id &&
        kqDt.von.TT === 10,
    );
    const bangDt = await dtri.bangDauTri(phien.id, userId);
    kiem(
      "Bảng phiên có người chơi hạng 1",
      bangDt.cuaToi?.hang === 1 && bangDt.soNguoi === 1,
    );
    await prisma.nnLuot.deleteMany({ where: { tramMa: `DAU:${phien.id}` } });
    await prisma.nnDauTri.delete({ where: { id: phien.id } });
    await prisma.nnTranDau.deleteMany({ where: { id: tranId } });
    await prisma.nnSoCai.deleteMany({ where: { nguon: `tran:${tranId}` } });
    if (ncAGoc)
      await prisma.nnNguoiChoi.update({
        where: { userId: uA!.id },
        data: {
          tranThang: ncAGoc.tranThang,
          tranThua: ncAGoc.tranThua,
          tranHoa: ncAGoc.tranHoa,
        },
      });
    else await prisma.nnNguoiChoi.deleteMany({ where: { userId: uA!.id } });
  } finally {
    const ids = [userId, userB];
    const luot = await prisma.nnLuot.findMany({
      where: { userId: { in: ids } },
      select: { id: true },
    });
    await prisma.nnTraLoi.deleteMany({
      where: { luotId: { in: luot.map((l) => l.id) } },
    });
    await prisma.nnLuot.deleteMany({ where: { userId: { in: ids } } });
    await prisma.nnTienDo.deleteMany({ where: { userId: { in: ids } } });
    await prisma.nnSoCai.deleteMany({ where: { userId: { in: ids } } });
    await prisma.nnHuyHieu.deleteMany({ where: { userId: { in: ids } } });
    await prisma.nnNhiemVu.deleteMany({ where: { userId: { in: ids } } });
    await prisma.nnNguoiChoi.deleteMany({ where: { userId: { in: ids } } });
    await prisma.nnChiaSe.deleteMany({ where: { userId: { in: ids } } });
    await prisma.nnTraoQua.deleteMany({ where: { userId: { in: ids } } });
    await prisma.nnMua.delete({ where: { id: mua.id } });
    if (thongSoGoc)
      await prisma.siteSetting.update({
        where: { key: ch.KHOA_THONG_SO },
        data: { value: thongSoGoc.value },
      });
    else
      await prisma.siteSetting.deleteMany({ where: { key: ch.KHOA_THONG_SO } });
    console.log("Đã xoá dữ liệu ván thử");
  }
}

/** Vinh danh theo tháng (anh Khang chốt 20/09/2026): mã tháng, danh sách tháng của mùa. */
function soatVinhDanhThang() {
  console.log("\n— Vinh danh theo tháng —");
  kiem(
    "Mã tháng theo giờ VN: 18:00 UTC ngày 30/09 đã là tháng 10",
    vd.maThangVN(new Date("2026-09-30T18:00:00.000Z")) === "2026-10" &&
      vd.maThangVN(new Date("2026-09-30T16:00:00.000Z")) === "2026-09",
  );
  const ba = vd.thangCuaMua({
    batDau: new Date("2026-10-01T00:00:00+07:00"),
    ketThuc: new Date("2026-12-31T23:59:59+07:00"),
  });
  kiem(
    "Mùa 3 tháng cho đúng 3 mốc vinh danh",
    ba.join(",") === "2026-10,2026-11,2026-12",
    ba.join(","),
  );
  const batNam = vd.thangCuaMua({
    batDau: new Date("2026-12-15T00:00:00+07:00"),
    ketThuc: new Date("2027-01-15T23:59:59+07:00"),
  });
  kiem(
    "Mùa vắt qua năm vẫn đủ tháng",
    batNam.join(",") === "2026-12,2027-01",
    batNam.join(","),
  );
  kiem(
    "Mã ghi trao quà hợp lệ và không lẫn với mốc quà",
    vd.maVinhDanhThang("2026-10") === "VD_202610" &&
      /^[A-Z0-9_]{2,40}$/.test(vd.maVinhDanhThang("2026-10")),
  );
  kiem("Tên tháng đọc được", vd.tenThang("2026-10") === "tháng 10/2026");
  kiem(
    "Chuỗi tháng sai định dạng bị từ chối",
    !vd.laMaThang("2026-13") &&
      !vd.laMaThang("2026-1") &&
      vd.laMaThang("2026-01"),
  );
}

async function main() {
  soatNoiDung();
  soatBoCau();
  soatLuat();
  soatVinhDanhThang();
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
