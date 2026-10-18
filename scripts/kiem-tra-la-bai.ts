/**
 * Kiểm tra "Lá bài mỗi ngày" của game Ngôi nhà Chợ Lớn.
 *
 *   npm run test:labai            — hàm thuần + nội dung JSON (không đụng CSDL)
 *   npm run test:labai -- --csdl  — lật bài thật bằng người chơi tạm + mùa tạm,
 *                                   xoá sạch và trả lại cài đặt khi xong
 *
 * Phần CSDL phải chạy qua khoá (các nhóm làm song song):
 *   node "<scratchpad>/khoa-csdl.cjs" npx tsx scripts/kiem-tra-la-bai.ts --csdl
 * Tự bỏ qua khi đang có mùa giải thật mở.
 */
import { prisma } from "../src/lib/prisma";
import {
  CAC_LOAI_LA,
  chonKetQua,
  chuanDanhNgon,
  chuanLaBai,
  chuanLoiNhan,
  chuanQuaLaBai,
  kyVong,
  LA_BAI_MAC_DINH,
  maTraoQuaLaBai,
  NGUOI_KY_MAC_DINH,
  taoMaQuaLaBai,
  thuongChuoiLaBai,
  trongKhoangNgay,
  type CauHinhLaBai,
  type DanhNgon,
  type KhaDungLaBai,
  type LoaiLa,
  type QuaLaBai,
} from "../src/lib/ngoi-nha/la-bai-luat";
import { chuanMaMuc } from "../src/lib/ngoi-nha/cai-dat/chuan";
import { congNgay } from "../src/lib/ngoi-nha/thoi-gian";
import danhNgonJson from "../src/lib/ngoi-nha/noi-dung/la-bai/danh-ngon.json";
import loiNhanJson from "../src/lib/ngoi-nha/noi-dung/la-bai/loi-nhan.json";

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

const giong = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

/** Bộ sinh số ngẫu nhiên có hạt giống (mulberry32) — kết quả lặp lại được. */
function hatGiong(hat: number) {
  let a = hat >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const quaMau = (p: Partial<QuaLaBai> = {}): QuaLaBai => ({
  ma: "QLBMAU1",
  bat: true,
  ten: "Quà mẫu",
  moTa: "",
  nhaDongHanh: "",
  giaTri: 0,
  tongSo: 5,
  toiDaMoiNgay: 0,
  trongSo: 10,
  tuNgay: null,
  denNgay: null,
  ...p,
});

/** Tần suất (%) từng loại sau n lần chọn. */
function tanSuat(c: CauHinhLaBai, kd: KhaDungLaBai, n: number, hat: number) {
  const r = hatGiong(hat);
  const dem: Record<LoaiLa, number> = {
    DANH_NGON: 0,
    LOI_NHAN: 0,
    DIEM: 0,
    QUA: 0,
  };
  for (let i = 0; i < n; i++) dem[chonKetQua(c, kd, r).loai]++;
  const pt = { ...dem };
  for (const l of CAC_LOAI_LA) pt[l] = (dem[l] / n) * 100;
  return pt;
}

function soatThuan() {
  console.log("\n— Hàm thuần —");
  kiem("chuanLaBai(null) = mặc định", giong(chuanLaBai(null), LA_BAI_MAC_DINH));
  kiem(
    "chuanLaBai(mặc định) giữ nguyên",
    giong(chuanLaBai(LA_BAI_MAC_DINH), LA_BAI_MAC_DINH),
  );
  kiem(
    "Thiếu trường → lấy mặc định, không ép về 0",
    giong(chuanLaBai({ soLa: "", trongSo: {} }), LA_BAI_MAC_DINH),
  );

  const chan = chuanLaBai({
    soLa: 99,
    trongSo: { DANH_NGON: -5, LOI_NHAN: 5000, DIEM: "abc", QUA: 3 },
    diemKem: { DANH_NGON: 9999, LOI_NHAN: -1 },
    bacDiem: Array.from({ length: 15 }, (_, i) => ({
      diem: i === 0 ? 5000 : 10 + i,
      trongSo: 10,
    })),
    chuoi: { bat: "co", moiNgay: 500, toiDa: -3 },
    dieuKienQua: {
      toiThieuTramQua: 99,
      toiDaMoiNguoiMua: 0,
      toiDaQuaMoiNgay: 999,
    },
    khongLapDanhNgonNgay: 9999,
    dsQua: Array.from({ length: 40 }, (_, i) => ({
      ma: i < 2 ? "Q_L-b 1" : undefined,
      ten: `Quà ${i}`,
      tongSo: 5000,
    })),
  });
  kiem("Chặn soLa 99 → 5", chan.soLa === 5, String(chan.soLa));
  kiem("Chặn soLa 0 → 2", chuanLaBai({ soLa: 0 }).soLa === 2);
  kiem(
    "Chặn tỉ trọng âm → 0, quá → 1000, sai kiểu → mặc định",
    chan.trongSo.DANH_NGON === 0 &&
      chan.trongSo.LOI_NHAN === 1000 &&
      chan.trongSo.DIEM === LA_BAI_MAC_DINH.trongSo.DIEM,
    JSON.stringify(chan.trongSo),
  );
  kiem(
    "Chặn điểm kèm trong [0, 200]",
    chan.diemKem.DANH_NGON === 200 && chan.diemKem.LOI_NHAN === 0,
  );
  kiem(
    "Bậc điểm tối đa 10 dòng, điểm ≤ 1000",
    chan.bacDiem.length === 10 && chan.bacDiem[0].diem === 1000,
  );
  kiem(
    "Chuỗi: bật sai kiểu → mặc định, số bị chặn",
    chan.chuoi.bat === true &&
      chan.chuoi.moiNgay === 100 &&
      chan.chuoi.toiDa === 0,
  );
  kiem(
    "Điều kiện quà bị chặn giới hạn",
    chan.dieuKienQua.toiThieuTramQua === 22 &&
      chan.dieuKienQua.toiDaMoiNguoiMua === 1 &&
      chan.dieuKienQua.toiDaQuaMoiNgay === 50,
  );
  kiem("Không lặp danh ngôn ≤ 365 ngày", chan.khongLapDanhNgonNgay === 365);
  kiem(
    "Danh sách quà tối đa 30, tổng suất ≤ 1000",
    chan.dsQua.length === 30 && chan.dsQua.every((q) => q.tongSo === 1000),
  );
  kiem(
    "Mã quà làm sạch chỉ A-Z0-9, mã trùng thêm hậu tố",
    chan.dsQua[0].ma === "QLB1" &&
      chan.dsQua[1].ma === "QLB12" &&
      chan.dsQua.every((q) => /^[A-Z0-9]+$/.test(q.ma)) &&
      new Set(chan.dsQua.map((q) => q.ma)).size === chan.dsQua.length,
    chan.dsQua
      .slice(0, 3)
      .map((q) => q.ma)
      .join(","),
  );
  const maMoi = Array.from({ length: 50 }, () => taoMaQuaLaBai());
  kiem(
    "taoMaQuaLaBai: chỉ A-Z0-9, không có dấu _",
    maMoi.every((m) => /^[A-Z0-9]+$/.test(m) && !m.includes("_")),
    maMoi[0],
  );
  kiem(
    "Quà thiếu tên bị bỏ",
    chuanQuaLaBai([{ ten: "  " }, { ten: "A" }]).length === 1,
  );
  kiem(
    "danhNgon/loiNhan không phải mảng → null (dùng bộ gốc)",
    chuanLaBai({ danhNgon: "x", loiNhan: null }).danhNgon === null &&
      chuanLaBai({ loiNhan: {} }).loiNhan === null,
  );
  kiem(
    "danhNgon mảng rỗng → [] (Ban đã sửa, không quay về gốc)",
    giong(chuanLaBai({ danhNgon: [] }).danhNgon, []),
  );

  const maTrao = maTraoQuaLaBai("2026-09-16");
  kiem(
    "maTraoQuaLaBai khớp mẫu mã trao quà",
    maTrao === "LB_20260916" && /^[A-Z0-9_]{2,40}$/.test(maTrao),
    maTrao,
  );

  kiem(
    "thuongChuoiLaBai: 5 × ngày, trần 50, tắt = 0",
    thuongChuoiLaBai(LA_BAI_MAC_DINH, 1) === 5 &&
      thuongChuoiLaBai(LA_BAI_MAC_DINH, 3) === 15 &&
      thuongChuoiLaBai(LA_BAI_MAC_DINH, 30) === 50 &&
      thuongChuoiLaBai(
        { ...LA_BAI_MAC_DINH, chuoi: { bat: false, moiNgay: 5, toiDa: 50 } },
        3,
      ) === 0,
  );
  kiem(
    "trongKhoangNgay",
    trongKhoangNgay("2026-09-16", null, null) &&
      trongKhoangNgay("2026-09-16", "2026-09-16", "2026-09-16") &&
      !trongKhoangNgay("2026-09-16", "2026-09-17", null) &&
      !trongKhoangNgay("2026-09-16", null, "2026-09-15"),
  );

  // chonKetQua bám sát tỉ trọng
  const dn = chuanDanhNgon(danhNgonJson.danhNgon).slice(0, 5);
  const ln = chuanLoiNhan(loiNhanJson.loiNhan).slice(0, 5);
  const N = 20_000;
  const c = LA_BAI_MAC_DINH;
  const tong = CAC_LOAI_LA.reduce((s, l) => s + c.trongSo[l], 0);
  const ts1 = tanSuat(c, { danhNgon: dn, loiNhan: ln, qua: [quaMau()] }, N, 42);
  kiem(
    `chonKetQua ${N} lần sát tỉ trọng ±1,5 điểm %`,
    CAC_LOAI_LA.every(
      (l) => Math.abs(ts1[l] - (c.trongSo[l] / tong) * 100) <= 1.5,
    ),
    JSON.stringify(ts1),
  );
  const ts2 = tanSuat(c, { danhNgon: dn, loiNhan: ln, qua: [] }, N, 7);
  const tongKhongQua = tong - c.trongSo.QUA;
  kiem(
    "Không có quà → QUA = 0, tỉ trọng chia lại cho loại khác",
    ts2.QUA === 0 &&
      (["DANH_NGON", "LOI_NHAN", "DIEM"] as LoaiLa[]).every(
        (l) => Math.abs(ts2[l] - (c.trongSo[l] / tongKhongQua) * 100) <= 1.5,
      ),
    JSON.stringify(ts2),
  );
  const ts3 = tanSuat(
    c,
    { danhNgon: [], loiNhan: ln, qua: [quaMau({ trongSo: 0 })] },
    5000,
    9,
  );
  kiem(
    "Hết danh ngôn + quà tỉ trọng 0 → không ra hai loại đó",
    ts3.DANH_NGON === 0 && ts3.QUA === 0 && ts3.LOI_NHAN > 0,
    JSON.stringify(ts3),
  );
  const khong = {
    ...c,
    trongSo: { DANH_NGON: 0, LOI_NHAN: 0, DIEM: 0, QUA: 0 },
  };
  const ts4 = tanSuat(
    khong,
    { danhNgon: dn, loiNhan: ln, qua: [quaMau()] },
    2000,
    3,
  );
  kiem("Tất cả tỉ trọng 0 → luôn ra lá điểm", ts4.DIEM === 100);
  const r5 = hatGiong(11);
  const diem = new Map<number, number>();
  for (let i = 0; i < N; i++) {
    const k = chonKetQua(
      { ...c, trongSo: { DANH_NGON: 0, LOI_NHAN: 0, DIEM: 1, QUA: 0 } },
      { danhNgon: dn, loiNhan: ln, qua: [] },
      r5,
    );
    diem.set(k.diem, (diem.get(k.diem) ?? 0) + 1);
  }
  kiem(
    "Lá điểm bốc bậc theo tỉ trọng (40:60%, 60:30%, 100:10%)",
    Math.abs(((diem.get(40) ?? 0) / N) * 100 - 60) <= 1.5 &&
      Math.abs(((diem.get(60) ?? 0) / N) * 100 - 30) <= 1.5 &&
      Math.abs(((diem.get(100) ?? 0) / N) * 100 - 10) <= 1.5,
    JSON.stringify([...diem]),
  );
  const r6 = hatGiong(5);
  const k6 = chonKetQua(
    { ...c, trongSo: { DANH_NGON: 1, LOI_NHAN: 0, DIEM: 0, QUA: 0 } },
    { danhNgon: dn, loiNhan: ln, qua: [] },
    r6,
  );
  kiem(
    "Lá danh ngôn có nội dung + điểm kèm",
    k6.loai === "DANH_NGON" && !!k6.danhNgon && k6.diem === c.diemKem.DANH_NGON,
  );
  const k7 = chonKetQua(
    { ...c, trongSo: { DANH_NGON: 0, LOI_NHAN: 0, DIEM: 0, QUA: 1 } },
    { danhNgon: dn, loiNhan: ln, qua: [quaMau()] },
    hatGiong(1),
  );
  kiem(
    "Lá quà mang theo quà, 0 điểm",
    k7.loai === "QUA" && k7.qua?.ma === "QLBMAU1" && k7.diem === 0,
  );
  kiem(
    "rand trả 0,999999 không vượt mảng",
    chonKetQua(
      c,
      { danhNgon: dn, loiNhan: ln, qua: [quaMau()] },
      () => 0.999999,
    ).loai === "QUA",
  );

  const kv = kyVong(LA_BAI_MAC_DINH);
  const tbBac = (40 * 60 + 60 * 30 + 100 * 10) / 100;
  const kyVongTay = (50 * 20 + 20 * 20 + 28 * tbBac) / 98;
  kiem(
    "kyVong mặc định: chưa có quà → tỉ lệ quà 0, điểm trung bình đúng",
    kv.tiLeQua === 0 &&
      Math.abs(kv.diemMoiNgayKhongQua - kyVongTay) < 1e-9 &&
      Math.abs(kv.diemTrungBinhBac - tbBac) < 1e-9 &&
      Math.abs(CAC_LOAI_LA.reduce((s, l) => s + kv.tiLe[l], 0) - 1) < 1e-9,
    `${kv.diemMoiNgayKhongQua} vs ${kyVongTay}`,
  );
  const kvQua = kyVong({ ...LA_BAI_MAC_DINH, dsQua: [quaMau()] });
  kiem(
    "kyVong có quà: tỉ lệ quà = 2%",
    Math.abs(kvQua.tiLeQua - 0.02) < 1e-9 &&
      kvQua.diemMoiNgay < kvQua.diemMoiNgayKhongQua,
  );
}

function soatNoiDung() {
  console.log("\n— Nội dung danh ngôn & lời nhắn —");
  const dsDn = danhNgonJson.danhNgon as Record<string, unknown>[];
  const dsLn = loiNhanJson.loiNhan as Record<string, unknown>[];
  const maDn = dsDn.map((d) => String(d.ma));
  kiem(
    `Danh ngôn: ${dsDn.length} câu, mã duy nhất`,
    dsDn.length > 0 && new Set(maDn).size === maDn.length,
  );
  kiem(
    "Mã danh ngôn chỉ A-Z0-9",
    maDn.every((m) => /^[A-Z0-9]+$/.test(m)),
  );
  const saiDai = dsDn.filter((d) => {
    const n = String(d.noiDung ?? "").trim().length;
    return n < 10 || n > 220;
  });
  kiem(
    "Danh ngôn dài 10–220 ký tự",
    saiDai.length === 0,
    saiDai.map((d) => d.ma).join(","),
  );
  const thieuTg = dsDn.filter((d) => !String(d.tacGia ?? "").trim());
  kiem(
    "Danh ngôn có tác giả",
    thieuTg.length === 0,
    thieuTg.map((d) => d.ma).join(","),
  );
  const thieuYn = dsDn.filter(
    (d) => !String(d.yNghia ?? "").trim() || !String(d.nguon ?? "").trim(),
  );
  kiem(
    "Danh ngôn có ý nghĩa cho doanh nhân và nguồn",
    thieuYn.length === 0,
    thieuYn.map((d) => d.ma).join(","),
  );
  const nhom = new Set(danhNgonJson.nhom.map((n) => chuanMaMuc(n.ma, 20)));
  const saiNhom = dsDn.filter((d) => !nhom.has(chuanMaMuc(d.nhom, 20)));
  kiem(
    "Danh ngôn thuộc nhóm đã khai",
    saiNhom.length === 0,
    saiNhom.map((d) => d.ma).join(","),
  );
  const sach = chuanDanhNgon(dsDn);
  kiem(
    "Làm sạch không bỏ câu nào, không cắt chữ",
    sach.length === dsDn.length &&
      sach.every(
        (d, i) => d.noiDung === String(dsDn[i].noiDung).trim() && d.bat,
      ),
  );

  const maLn = dsLn.map((l) => String(l.ma));
  kiem(
    `Lời nhắn: ${dsLn.length} câu, mã duy nhất`,
    dsLn.length > 0 && new Set(maLn).size === maLn.length,
  );
  kiem(
    "Lời nhắn dài 10–300 ký tự",
    dsLn.every((l) => {
      const n = String(l.noiDung ?? "").trim().length;
      return n >= 10 && n <= 300;
    }),
  );
  const lnSach = chuanLoiNhan(dsLn);
  kiem(
    `Người ký lời nhắn mặc định "${NGUOI_KY_MAC_DINH}"`,
    lnSach.length === dsLn.length &&
      lnSach.every((l) => l.nguoiKy === NGUOI_KY_MAC_DINH),
  );
  kiem(
    "Lời nhắn gốc không tự điền tên người ký",
    dsLn.every((l) => !("nguoiKy" in l)),
  );

  const cam = /mon amie|hoàng vy/i;
  const dinh = [...dsDn, ...dsLn].filter((x) => cam.test(JSON.stringify(x)));
  kiem(
    "Không nhắc Mon Amie / Hoàng Vy",
    dinh.length === 0,
    dinh.map((x) => x.ma).join(","),
  );
}

async function chayCsdl() {
  console.log("\n— Lật bài thật trên CSDL —");
  const muaThat = await prisma.nnMua.findFirst({
    where: { trangThai: "DANG_MO" },
  });
  if (muaThat) {
    console.log(
      "BỎ QUA  đang có mùa giải thật mở — không chạy để khỏi lẫn số liệu",
    );
    return;
  }
  const lb = await import("../src/lib/ngoi-nha/la-bai");
  const cd = await import("../src/lib/ngoi-nha/cai-dat");
  const { muaHienTai, CHOI_THU } = await import("../src/lib/ngoi-nha/mua");
  const { tongSoCai } = await import("../src/lib/ngoi-nha/so-cai");
  const { bangXepHang } = await import("../src/lib/ngoi-nha/tong-hop");

  const goc = await prisma.siteSetting.findMany({
    where: { key: { in: ["nn.laBai", "nn.tinhNang"] } },
  });
  const tienTo = `kiem-tra-lb-${Date.now()}`;
  const ids: string[] = [];
  const nguoiTam = (ten: string, memberId: string | null = null) => {
    const userId = `${tienTo}-${ten}`;
    ids.push(userId);
    return { userId, memberId };
  };
  const tinhNangGoc = await cd.docMucTuoi("tinhNang");
  const datCauHinh = (p: Partial<CauHinhLaBai>) =>
    cd.ghiMuc("laBai", { ...LA_BAI_MAC_DINH, ...p });
  const muaTamIds: string[] = [];

  const hv = await prisma.member.findFirst({
    where: { active: true, trangThai: { not: "ROI_HOI" } },
    select: { id: true },
  });
  if (!hv) {
    kiem("Có hội viên thật để thử quà", false);
    return;
  }

  try {
    await cd.ghiMuc("tinhNang", { ...tinhNangGoc.giaTri, laBai: true });
    await datCauHinh({});
    const ngay = lb.ngayLaBai();

    // ── Chơi thử ──
    const m0 = await muaHienTai();
    kiem("Chưa có mùa → chơi thử", m0.id === CHOI_THU);

    const A = nguoiTam("a");
    for (const v of [-1, 3, 99, NaN, 1.5]) {
      await kiemLoi(`viTri ${v} bị từ chối`, () => lb.latLaBai(A, v), "VI_TRI");
    }
    kiem(
      "viTri sai không ghi dòng nào",
      (await prisma.nnSoCai.count({ where: { userId: A.userId } })) === 0,
    );

    await cd.ghiMuc("tinhNang", { ...tinhNangGoc.giaTri, laBai: false });
    await kiemLoi(
      "Tắt tính năng → lật bị chặn",
      () => lb.latLaBai(A, 0),
      "TAT",
    );
    const tat = await lb.laBaiHomNay(A, m0);
    kiem(
      "Tắt tính năng → laBaiHomNay bat:false",
      tat.bat === false && !tat.ketQua,
    );
    kiem(
      "Tắt tính năng → daLatLaBaiHomNay = null",
      (await lb.daLatLaBaiHomNay(A.userId)) === null,
    );
    await cd.ghiMuc("tinhNang", { ...tinhNangGoc.giaTri, laBai: true });

    const truocA = await lb.laBaiHomNay(A, m0);
    kiem(
      "Trước khi lật: bat, chưa có kết quả, đúng số lá",
      truocA.bat &&
        !truocA.ketQua &&
        truocA.soLa === 3 &&
        truocA.ngay === ngay &&
        truocA.chuoiNgay === 0,
    );
    kiem(
      "daLatLaBaiHomNay trước khi lật = false",
      (await lb.daLatLaBaiHomNay(A.userId)) === false,
    );

    const kq1 = await lb.latLaBai(A, 0);
    const kq2 = await lb.latLaBai(A, 2);
    const dongA = await prisma.nnSoCai.findMany({
      where: { userId: A.userId },
    });
    kiem(
      "Lật 2 lần trả cùng kết quả",
      giong(kq1, kq2),
      `${JSON.stringify(kq1)} / ${JSON.stringify(kq2)}`,
    );
    kiem(
      "Lật 2 lần chỉ 1 dòng sổ cái",
      dongA.length === 1,
      String(dongA.length),
    );
    const d0 = dongA[0];
    kiem(
      "Dòng sổ cái đúng hợp đồng (loai, nguon, muaId, vốn 0)",
      d0?.loai === "LA_BAI" &&
        d0.nguon === `labai:${ngay}` &&
        d0.muaId === CHOI_THU &&
        d0.vonCN === 0 &&
        d0.vonTT === 0 &&
        d0.vonXH === 0 &&
        d0.vonTS === 0,
    );
    const anh = JSON.parse(d0?.ghiChu ?? "{}");
    kiem(
      "ghiChu là ảnh chụp {v:1, viTri, soLa, loai, ma, diem, diemChuoi, chuoiNgay}",
      anh.v === 1 &&
        anh.viTri === 0 &&
        anh.soLa === 3 &&
        anh.loai === kq1.loai &&
        "ma" in anh &&
        anh.diem === kq1.diem &&
        anh.diemChuoi === kq1.diemChuoi &&
        anh.chuoiNgay === 1,
      d0?.ghiChu ?? "",
    );
    kiem(
      "Kết quả: ngày, chơi thử, chuỗi 1 ngày +5",
      kq1.ngay === ngay &&
        kq1.choiThu &&
        kq1.ghiNhan &&
        kq1.chuoiNgay === 1 &&
        kq1.diemChuoi === 5 &&
        kq1.viTri === 0,
    );
    kiem(
      "Kết quả có nội dung đúng loại",
      (kq1.loai === "DANH_NGON" && !!kq1.danhNgon) ||
        (kq1.loai === "LOI_NHAN" && !!kq1.loiNhan) ||
        (kq1.loai === "DIEM" && kq1.diem > 0),
      kq1.loai,
    );
    kiem("Chơi thử không ra quà", kq1.loai !== "QUA");
    const tongA = await tongSoCai(prisma, A.userId, CHOI_THU);
    kiem(
      "Tổng điểm sổ cái tăng đúng diem + diemChuoi",
      tongA.diem === kq1.diem + kq1.diemChuoi &&
        d0.diem === kq1.diem + kq1.diemChuoi,
      `${tongA.diem} vs ${kq1.diem}+${kq1.diemChuoi}`,
    );
    const sauA = await lb.laBaiHomNay(A, m0);
    kiem(
      "laBaiHomNay sau khi lật trả lại đúng lá",
      giong(sauA.ketQua, kq1) && sauA.chuoiNgay === 1,
    );
    kiem(
      "daLatLaBaiHomNay sau khi lật = true",
      (await lb.daLatLaBaiHomNay(A.userId)) === true,
    );

    // Bấm dồn dập 5 lần cùng lúc
    const A2 = nguoiTam("a2");
    const dong5 = await Promise.all(
      [0, 1, 2, 0, 1].map((v) => lb.latLaBai(A2, v)),
    );
    const soDong5 = await prisma.nnSoCai.count({
      where: { userId: A2.userId },
    });
    kiem(
      "Promise.all 5 lần lật → 1 dòng, cùng kết quả",
      soDong5 === 1 &&
        dong5.every((k) =>
          giong({ ...k, viTri: 0 }, { ...dong5[0], viTri: 0 }),
        ),
      String(soDong5),
    );

    // Chuỗi ngày: đã lật hôm qua và hôm kia
    const A3 = nguoiTam("a3");
    for (const lui of [1, 2]) {
      await prisma.nnSoCai.create({
        data: {
          userId: A3.userId,
          muaId: CHOI_THU,
          loai: "LA_BAI",
          nguon: `labai:${congNgay(ngay, -lui)}`,
          diem: 40,
          ghiChu: JSON.stringify({
            v: 1,
            viTri: 0,
            soLa: 3,
            loai: "DIEM",
            ma: null,
            diem: 40,
            diemChuoi: 0,
            chuoiNgay: 1,
          }),
        },
      });
    }
    const truocA3 = await lb.laBaiHomNay(A3, m0);
    const kqA3 = await lb.latLaBai(A3, 1);
    kiem(
      "Chuỗi 3 ngày → thưởng +15, ô trang chủ báo chuỗi 2 trước khi lật",
      truocA3.chuoiNgay === 2 && kqA3.chuoiNgay === 3 && kqA3.diemChuoi === 15,
      `${truocA3.chuoiNgay} ${kqA3.chuoiNgay} ${kqA3.diemChuoi}`,
    );
    const bst = await lb.lichSuLaBai(A3.userId);
    kiem(
      "Bộ sưu tập: 3 lá, mới nhất trước, chuỗi 3",
      bst.tongLat === 3 &&
        bst.ds[0].ngay === ngay &&
        bst.chuoiNgay === 3 &&
        bst.theoLoai.DIEM >= 2,
      JSON.stringify({ t: bst.tongLat, c: bst.chuoiNgay }),
    );

    // Không lặp danh ngôn đã gặp
    const hai: DanhNgon[] = chuanDanhNgon(danhNgonJson.danhNgon).slice(0, 2);
    await datCauHinh({
      trongSo: { DANH_NGON: 1, LOI_NHAN: 0, DIEM: 0, QUA: 0 },
      danhNgon: hai,
    });
    const A4 = nguoiTam("a4");
    await prisma.nnSoCai.create({
      data: {
        userId: A4.userId,
        muaId: CHOI_THU,
        loai: "LA_BAI",
        nguon: `labai:${congNgay(ngay, -3)}`,
        diem: 20,
        ghiChu: JSON.stringify({
          v: 1,
          viTri: 0,
          soLa: 3,
          loai: "DANH_NGON",
          ma: hai[0].ma,
          diem: 20,
          diemChuoi: 0,
          chuoiNgay: 1,
        }),
      },
    });
    const kqA4 = await lb.latLaBai(A4, 0);
    kiem(
      "Ưu tiên danh ngôn chưa gặp trong N ngày",
      kqA4.loai === "DANH_NGON" && kqA4.danhNgon?.ma === hai[1].ma,
      kqA4.danhNgon?.ma,
    );

    // Chơi thử + chỉ có tỉ trọng quà → không ra quà
    const quaThu = quaMau({
      ma: `QLBTHU${Date.now().toString(36).toUpperCase()}`,
      tongSo: 3,
    });
    await datCauHinh({
      trongSo: { DANH_NGON: 0, LOI_NHAN: 0, DIEM: 0, QUA: 100 },
      dsQua: [quaThu],
      dieuKienQua: {
        ...LA_BAI_MAC_DINH.dieuKienQua,
        toiThieuTramQua: 0,
        toiDaQuaMoiNgay: 0,
      },
    });
    const B0 = nguoiTam("b0", hv.id);
    const kqB0 = await lb.latLaBai(B0, 0);
    kiem(
      "Chơi thử: tỉ trọng chỉ có quà vẫn không ra quà (ra lá điểm)",
      kqB0.loai === "DIEM" && kqB0.choiThu,
      kqB0.loai,
    );
    kiem(
      "Chơi thử: laBaiHomNay không báo có quà",
      (await lb.laBaiHomNay(nguoiTam("b00", hv.id), m0)).coQua === false,
    );

    // ── Mùa giải tạm đang diễn ra ──
    const muaTam = await prisma.nnMua.create({
      data: {
        ten: "__KIEM_TRA_LA_BAI__",
        batDau: new Date(Date.now() - 3600e3),
        ketThuc: new Date(Date.now() + 7 * 86400e3),
        trangThai: "DANG_MO",
      },
    });
    muaTamIds.push(muaTam.id);
    const m1 = await muaHienTai();
    kiem(
      "Mùa tạm đang diễn ra",
      m1.id === muaTam.id && m1.trangThai === "DANG_DIEN_RA",
    );

    const maQua1 = `QLBKT${Date.now().toString(36).toUpperCase()}`;
    const qua1 = quaMau({
      ma: maQua1,
      ten: "Quà kiểm tra",
      nhaDongHanh: "Nhà đồng hành thử",
      tongSo: 1,
    });
    await datCauHinh({
      trongSo: { DANH_NGON: 0, LOI_NHAN: 0, DIEM: 0, QUA: 100 },
      dsQua: [qua1],
      dieuKienQua: {
        ...LA_BAI_MAC_DINH.dieuKienQua,
        toiThieuTramQua: 0,
        toiDaQuaMoiNgay: 0,
      },
    });
    kiem(
      "Mùa chính thức + còn suất → ô trang chủ báo có quà",
      (await lb.laBaiHomNay(nguoiTam("xem", hv.id), m1)).coQua,
    );

    const N0 = nguoiTam("n0");
    const kqN0 = await lb.latLaBai(N0, 0);
    kiem(
      "Người không gắn hội viên không trúng quà",
      kqN0.loai !== "QUA",
      kqN0.loai,
    );

    const B = nguoiTam("b", hv.id);
    const kqB = await lb.latLaBai(B, 1);
    kiem(
      "Hội viên hợp lệ trúng quà",
      kqB.loai === "QUA" &&
        kqB.qua?.ma === maQua1 &&
        kqB.qua.ten === "Quà kiểm tra" &&
        !kqB.qua.daTrao &&
        !kqB.choiThu,
      JSON.stringify(kqB),
    );
    const dongB = await prisma.nnSoCai.findFirst({
      where: { userId: B.userId },
    });
    kiem(
      "Dòng quà: muaId mùa thật, ghiChu có maQua, điểm = thưởng chuỗi",
      dongB?.muaId === muaTam.id &&
        !!dongB.ghiChu?.includes(`"maQua":"${maQua1}"`) &&
        dongB.diem === kqB.diemChuoi,
      dongB?.ghiChu ?? "",
    );

    const C = nguoiTam("c", hv.id);
    const kqC = await lb.latLaBai(C, 2);
    kiem(
      "Hết suất (tổng 1) → người thứ hai không trúng quà",
      kqC.loai !== "QUA",
      kqC.loai,
    );
    kiem(
      "Hết suất → ô trang chủ không báo có quà",
      !(await lb.laBaiHomNay(nguoiTam("xem2", hv.id), m1)).coQua,
    );

    const trung = await lb.nguoiTrungQuaLaBai(muaTam.id);
    kiem(
      "nguoiTrungQuaLaBai: đúng 1 người, mã trao LB_",
      trung.length === 1 &&
        trung[0].userId === B.userId &&
        trung[0].maTrao === maTraoQuaLaBai(ngay) &&
        !trung[0].daTrao,
      JSON.stringify(trung),
    );
    const cuaB = await lb.quaLaBaiCuaToi(B.userId, muaTam.id);
    kiem(
      "quaLaBaiCuaToi: 1 quà chưa trao",
      cuaB.length === 1 && cuaB[0].ten === "Quà kiểm tra" && !cuaB[0].daTrao,
    );
    kiem(
      "quaLaBaiCuaToi chơi thử = []",
      (await lb.quaLaBaiCuaToi(B.userId, CHOI_THU)).length === 0,
    );
    const tk = await lb.thongKeLaBai(muaTam.id);
    kiem(
      "thongKeLaBai: quà đã trúng 1, còn 0; hôm nay có lượt QUA",
      tk.qua[maQua1]?.daTrung === 1 &&
        tk.qua[maQua1].conLai === 0 &&
        tk.homNay.theoLoai.QUA >= 1 &&
        tk.bayNgay.soNguoi >= 3,
      JSON.stringify(tk.qua),
    );

    await prisma.nnTraoQua.create({
      data: { userId: B.userId, muaId: muaTam.id, loai: maTraoQuaLaBai(ngay) },
    });
    kiem(
      "Ghi đã trao → danh sách quản trị báo đã trao",
      (await lb.nguoiTrungQuaLaBai(muaTam.id))[0]?.daTrao === true,
    );
    kiem(
      "Ghi đã trao → trang Phần thưởng báo đã trao",
      (await lb.quaLaBaiCuaToi(B.userId, muaTam.id))[0]?.daTrao === true,
    );
    kiem(
      "Ghi đã trao → lật lại thấy quà đã trao",
      (await lb.latLaBai(B, 0)).qua?.daTrao === true,
    );

    // Điều kiện quà: số trạm, trần mỗi ngày, ẩn xếp hạng
    const maQua2 = `QLBKU${Date.now().toString(36).toUpperCase()}`;
    const qua2 = quaMau({
      ma: maQua2,
      ten: "Quà thứ hai",
      tongSo: 10,
      toiDaMoiNgay: 2,
    });
    await datCauHinh({
      trongSo: { DANH_NGON: 0, LOI_NHAN: 0, DIEM: 0, QUA: 100 },
      dsQua: [qua1, qua2],
      dieuKienQua: {
        ...LA_BAI_MAC_DINH.dieuKienQua,
        toiThieuTramQua: 1,
        toiDaQuaMoiNgay: 0,
      },
    });
    const D = nguoiTam("d", hv.id);
    kiem(
      "Chưa qua đủ số trạm → không trúng quà",
      (await lb.latLaBai(D, 0)).loai !== "QUA",
    );
    kiem(
      "Chưa qua đủ số trạm → ô trang chủ cũng không hứa quà",
      (await lb.laBaiHomNay(nguoiTam("d2", hv.id), m1)).coQua === false,
    );

    await datCauHinh({
      trongSo: { DANH_NGON: 0, LOI_NHAN: 0, DIEM: 0, QUA: 100 },
      dsQua: [qua1, qua2],
      dieuKienQua: {
        ...LA_BAI_MAC_DINH.dieuKienQua,
        toiThieuTramQua: 0,
        toiDaQuaMoiNgay: 1,
      },
    });
    const E = nguoiTam("e", hv.id);
    kiem(
      "Cả Chi hội đủ 1 quà / ngày → không trúng thêm",
      (await lb.latLaBai(E, 0)).loai !== "QUA",
    );

    await datCauHinh({
      trongSo: { DANH_NGON: 0, LOI_NHAN: 0, DIEM: 0, QUA: 100 },
      dsQua: [qua1, qua2],
      dieuKienQua: {
        ...LA_BAI_MAC_DINH.dieuKienQua,
        toiThieuTramQua: 0,
        toiDaQuaMoiNgay: 0,
      },
    });
    const H = nguoiTam("h", hv.id);
    await prisma.nnNguoiChoi.create({
      data: { userId: H.userId, anXepHang: true },
    });
    kiem(
      "Người ẩn khỏi bảng xếp hạng không trúng quà",
      (await lb.latLaBai(H, 0)).loai !== "QUA",
    );
    // Đã trúng một quà hôm trước trong mùa → hết lượt quà của mùa
    const J = nguoiTam("j", hv.id);
    await prisma.nnSoCai.create({
      data: {
        userId: J.userId,
        muaId: muaTam.id,
        loai: "LA_BAI",
        nguon: `labai:${congNgay(ngay, -1)}`,
        diem: 0,
        ghiChu: JSON.stringify({
          v: 1,
          viTri: 0,
          soLa: 3,
          loai: "QUA",
          ma: maQua2,
          maQua: maQua2,
          qua: { ma: maQua2, ten: "Quà thứ hai", nhaDongHanh: "" },
          diem: 0,
          diemChuoi: 0,
          chuoiNgay: 1,
        }),
      },
    });
    kiem(
      "Mỗi người tối đa 1 quà / mùa",
      (await lb.latLaBai(J, 0)).loai !== "QUA",
    );
    const F = nguoiTam("f", hv.id);
    const kqF = await lb.latLaBai(F, 0);
    const G = nguoiTam("g", hv.id);
    const kqG = await lb.latLaBai(G, 0);
    kiem(
      "Quà thứ hai rơi cho người tiếp theo",
      kqF.loai === "QUA" && kqF.qua?.ma === maQua2,
      JSON.stringify(kqF.qua),
    );
    kiem(
      "Quà thứ hai còn 1 suất trong ngày → người sau vẫn trúng",
      kqG.loai === "QUA" && kqG.qua?.ma === maQua2,
    );
    const I = nguoiTam("i", hv.id);
    kiem(
      "Quà đủ 2 suất / ngày → người thứ ba không trúng",
      (await lb.latLaBai(I, 0)).loai !== "QUA",
    );

    // Bảng xếp hạng: lá 0 điểm không làm người bằng điểm tụt hạng
    const P = nguoiTam("p");
    const Q = nguoiTam("q");
    const luc = Date.now() - 60_000;
    await prisma.nnSoCai.create({
      data: {
        userId: P.userId,
        muaId: muaTam.id,
        loai: "TRAM",
        nguon: "tram:kt",
        diem: 777_777,
        createdAt: new Date(luc),
      },
    });
    await prisma.nnSoCai.create({
      data: {
        userId: Q.userId,
        muaId: muaTam.id,
        loai: "TRAM",
        nguon: "tram:kt",
        diem: 777_777,
        createdAt: new Date(luc + 1000),
      },
    });
    await datCauHinh({
      trongSo: { DANH_NGON: 1, LOI_NHAN: 0, DIEM: 0, QUA: 0 },
      diemKem: { DANH_NGON: 0, LOI_NHAN: 0 },
      chuoi: { bat: false, moiNgay: 5, toiDa: 50 },
    });
    const kqP = await lb.latLaBai(P, 0);
    const dongP = await prisma.nnSoCai.findFirst({
      where: { userId: P.userId, loai: "LA_BAI" },
    });
    kiem(
      "Lá 0 điểm vẫn ghi đúng 1 dòng",
      kqP.diem === 0 && kqP.diemChuoi === 0 && dongP?.diem === 0,
    );
    const bxh = await bangXepHang(muaTam.id, "mua", undefined, 500);
    const hangP = bxh.dong.find((d) => d.userId === P.userId)?.hang ?? 0;
    const hangQ = bxh.dong.find((d) => d.userId === Q.userId)?.hang ?? 0;
    kiem(
      "Bảng xếp hạng không bị lá 0 điểm làm lệch",
      hangP > 0 && hangQ > 0 && hangP < hangQ,
      `P ${hangP}, Q ${hangQ}`,
    );

    // Mùa đã hết hạn: vẫn lật (giữ mỗi ngày một lá) nhưng không cộng điểm, không quà
    await prisma.nnMua.update({
      where: { id: muaTam.id },
      data: {
        batDau: new Date(Date.now() - 7200e3),
        ketThuc: new Date(Date.now() - 60e3),
      },
    });
    await datCauHinh({
      trongSo: { DANH_NGON: 0, LOI_NHAN: 0, DIEM: 1, QUA: 1 },
      dsQua: [
        quaMau({
          ma: `QLBKV${Date.now().toString(36).toUpperCase()}`,
          tongSo: 10,
        }),
      ],
      dieuKienQua: {
        ...LA_BAI_MAC_DINH.dieuKienQua,
        toiThieuTramQua: 0,
        toiDaQuaMoiNgay: 0,
      },
    });
    const m2 = await muaHienTai();
    const R = nguoiTam("r", hv.id);
    const kqR = await lb.latLaBai(R, 0);
    const dongR = await prisma.nnSoCai.findFirst({
      where: { userId: R.userId },
    });
    kiem(
      "Mùa hết hạn: lá điểm không ghi nhận, sổ cái 0 điểm, không quà",
      m2.trangThai === "DA_KET_THUC" &&
        kqR.loai === "DIEM" &&
        !kqR.ghiNhan &&
        dongR?.diem === 0,
      `${m2.trangThai} ${kqR.loai} ${kqR.ghiNhan} ${dongR?.diem}`,
    );

    // ── Ban đóng mùa cũ và mở mùa mới NGAY TRONG NGÀY ──
    // Lá lật sáng nay nằm ở mùa cũ: mọi chỗ kiểm "đã lật hôm nay" và thống kê
    // phải xét mọi mã mùa, không chỉ mùa đang chạy.
    await prisma.nnMua.update({
      where: { id: muaTam.id },
      data: {
        batDau: new Date(Date.now() - 7200e3),
        ketThuc: new Date(Date.now() + 7 * 86400e3),
      },
    });
    const maQua3 = `QLBKW${Date.now().toString(36).toUpperCase()}`;
    await datCauHinh({
      trongSo: { DANH_NGON: 0, LOI_NHAN: 0, DIEM: 50, QUA: 50 },
      dsQua: [quaMau({ ma: maQua3, ten: "Quà mùa mới", tongSo: 20 })],
      dieuKienQua: {
        ...LA_BAI_MAC_DINH.dieuKienQua,
        toiThieuTramQua: 0,
        toiDaQuaMoiNgay: 0,
      },
    });
    const S = nguoiTam("s", hv.id);
    await lb.latLaBai(S, 0);
    await prisma.nnMua.update({
      where: { id: muaTam.id },
      data: { trangThai: "DA_DONG" },
    });
    const muaMoi = await prisma.nnMua.create({
      data: {
        ten: "__KIEM_TRA_LA_BAI_2__",
        batDau: new Date(Date.now() - 60e3),
        ketThuc: new Date(Date.now() + 30 * 86400e3),
        trangThai: "DANG_MO",
      },
    });
    muaTamIds.push(muaMoi.id);
    const m3 = await muaHienTai();
    kiem("Mùa mới thay mùa cũ giữa ngày", m3.id === muaMoi.id);
    kiem(
      "Đổi mùa giữa ngày: daLatLaBaiHomNay vẫn báo đã lật",
      (await lb.daLatLaBaiHomNay(S.userId)) === true,
    );
    await lb.latLaBai(S, 2);
    kiem(
      "Đổi mùa giữa ngày: lật lại không sinh dòng thứ hai",
      (await prisma.nnSoCai.count({
        where: { userId: S.userId, loai: "LA_BAI" },
      })) === 1,
    );
    kiem(
      "Đổi mùa giữa ngày: thống kê hôm nay vẫn đếm lá của mùa cũ",
      (await lb.thongKeLaBai(muaMoi.id)).homNay.tong >= 1,
    );

    // ── coQua chỉ hứa quà với người thật sự còn cơ hội ──
    kiem(
      "Chưa gắn hồ sơ hội viên → ô trang chủ không hứa quà",
      (await lb.laBaiHomNay(nguoiTam("k0"), m3)).coQua === false,
    );
    kiem(
      "Có hồ sơ hội viên, còn suất → ô trang chủ hứa quà",
      (await lb.laBaiHomNay(nguoiTam("k1", hv.id), m3)).coQua === true,
    );
    const K = nguoiTam("k2", hv.id);
    await prisma.nnSoCai.create({
      data: {
        userId: K.userId,
        muaId: muaMoi.id,
        loai: "LA_BAI",
        nguon: `labai:${congNgay(ngay, -2)}`,
        diem: 0,
        ghiChu: JSON.stringify({
          v: 1,
          viTri: 0,
          soLa: 3,
          loai: "QUA",
          ma: maQua3,
          maQua: maQua3,
          qua: { ma: maQua3, ten: "Quà mùa mới", nhaDongHanh: "" },
          diem: 0,
          diemChuoi: 0,
          chuoiNgay: 1,
        }),
      },
    });
    kiem(
      "Đã hết suất quà của mùa → ô trang chủ không hứa quà nữa",
      (await lb.laBaiHomNay(K, m3)).coQua === false,
    );
  } finally {
    await prisma.nnSoCai.deleteMany({ where: { userId: { in: ids } } });
    await prisma.nnTraoQua.deleteMany({ where: { userId: { in: ids } } });
    await prisma.nnNguoiChoi.deleteMany({ where: { userId: { in: ids } } });
    if (muaTamIds.length)
      await prisma.nnMua.deleteMany({ where: { id: { in: muaTamIds } } });
    for (const khoa of ["nn.laBai", "nn.tinhNang"]) {
      const g = goc.find((x) => x.key === khoa);
      if (g)
        await prisma.siteSetting.update({
          where: { key: khoa },
          data: { value: g.value },
        });
      else await prisma.siteSetting.deleteMany({ where: { key: khoa } });
    }
    const conLai = await prisma.nnSoCai.count({
      where: { userId: { startsWith: tienTo } },
    });
    kiem("Đã dọn sạch dữ liệu tạm", conLai === 0, String(conLai));
    console.log("Đã xoá dữ liệu thử và trả lại cài đặt");
  }
}

async function main() {
  soatThuan();
  soatNoiDung();
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
