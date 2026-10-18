/**
 * Kiểm tra cài đặt game "Ngôi nhà Chợ Lớn" — phần LUẬT & TÍNH NĂNG HÀNH TRÌNH.
 *
 *   npm run test:caidatgame                 → phần thuần (làm sạch cài đặt, hàm luật)
 *   npm run test:caidatgame -- --csdl       → thêm ván thử thật trên CSDL
 *
 * Phần CSDL lưu bản gốc các khoá nn.luat / nn.tinhNang / nn.thongSo /
 * nn.theCoHoi / nn.chiaSe, ghi mặc định rồi đổi từng luật để thấy máy chủ chấm
 * theo luật mới, cuối cùng trả lại bản gốc và xoá người chơi tạm. Tự bỏ qua khi
 * đang có mùa giải thật mở (khỏi lẫn số liệu). Chạy qua khoá CSDL khi làm song
 * song: node ".../khoa-csdl.cjs" npx tsx scripts/kiem-tra-cai-dat-game.ts --csdl
 */
import { isDeepStrictEqual } from "node:util";
import { prisma } from "../src/lib/prisma";
import {
  CHIA_SE_GOC,
  NHIEM_VU_GOC,
  THE_CO_HOI_GOC,
} from "../src/lib/ngoi-nha/cai-dat";
import {
  GIOI_HAN_LUAT,
  LUAT_MAC_DINH,
  canDeQuaTheoLuat,
  chuanLuat,
  danhHieuTheoLuat,
  diemChuoiTheoLuat,
  diemTocDoTheoLuat,
  thuongChuoiNgayTheoLuat,
  tinhSaoTheoLuat,
  type LuatChoi,
} from "../src/lib/ngoi-nha/cai-dat/luat-choi";
import {
  TINH_NANG_MAC_DINH,
  chuanTinhNang,
} from "../src/lib/ngoi-nha/cai-dat/tinh-nang";
import {
  chuanChiaSe,
  chuanNhiemVu,
  chuanTheCoHoi,
} from "../src/lib/ngoi-nha/cai-dat/noi-dung-sua";
import {
  THU_THACH_NGAY,
  canDeQua,
  danhHieu,
  diemChuoi,
  diemTocDo,
  luatManChoi,
  thuongChuoiNgay,
  tinhSao,
} from "../src/lib/ngoi-nha/luat";
import { tuyChonCauThuong } from "../src/lib/ngoi-nha/cau-thuong";
import { THONG_SO_MAC_DINH } from "../src/lib/ngoi-nha/moc-qua";
import { CAU_THEO_ID } from "../src/lib/ngoi-nha/noi-dung";
import { congNgay, ngayThuThach } from "../src/lib/ngoi-nha/thoi-gian";

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
    kiem(ten, !ma || m === ma, `mã lỗi ${m}: ${(e as Error).message}`);
  }
}

// ─── Phần thuần ───────────────────────────────────────────────────────

function soatLuat() {
  console.log("— Làm sạch luật chơi —");
  kiem(
    "chuanLuat(null) = luật mặc định",
    isDeepStrictEqual(chuanLuat(null), LUAT_MAC_DINH),
  );
  kiem(
    "Luật mặc định khớp hằng số gốc (100 điểm đúng, 15 giây thêm, ngưỡng cân bằng 30)",
    LUAT_MAC_DINH.tram.dung === 100 &&
      LUAT_MAC_DINH.tram.giayThem === 15 &&
      LUAT_MAC_DINH.von.nguongCanBang === 30 &&
      LUAT_MAC_DINH.thuThachNgay.soCau === THU_THACH_NGAY.SO_CAU,
  );

  const chan = chuanLuat({
    tram: {
      dung: 99999,
      giayThem: 1,
      tocDoToiDa: "abc",
      chuoiTu3: "",
      giay: { chon: 1, xep: 999 },
    },
    von: { nguongCanBang: 0 },
    thuThachNgay: { soCau: 100, thuongMoiNgay: 500, thuongToiDa: 10 },
    huyHieu: { HOAN_HAO: { bat: false, diem: -5 }, KHONG_CO: { diem: 1 } },
  });
  kiem(
    "Chặn giới hạn: điểm đúng, giây thêm, giây theo loại, ngưỡng cân bằng, số câu thử thách",
    chan.tram.dung === GIOI_HAN_LUAT.tram.dung[1] &&
      chan.tram.giayThem === GIOI_HAN_LUAT.tram.giayThem[0] &&
      chan.tram.giay.chon === GIOI_HAN_LUAT.tram.giay[0] &&
      chan.tram.giay.xep === GIOI_HAN_LUAT.tram.giay[1] &&
      chan.von.nguongCanBang === GIOI_HAN_LUAT.nguongCanBang[0] &&
      chan.thuThachNgay.soCau === GIOI_HAN_LUAT.thuThachNgay.soCau[1],
    JSON.stringify({ tram: chan.tram, von: chan.von }),
  );
  kiem(
    "Giá trị không phải số / rỗng → mặc định (không ép về số nhỏ nhất)",
    chan.tram.tocDoToiDa === LUAT_MAC_DINH.tram.tocDoToiDa &&
      chan.tram.chuoiTu3 === LUAT_MAC_DINH.tram.chuoiTu3,
  );
  kiem(
    "Thưởng chuỗi ngày tối đa không nhỏ hơn thưởng mỗi ngày",
    chan.thuThachNgay.thuongToiDa >= chan.thuThachNgay.thuongMoiNgay,
  );
  kiem(
    "Huy hiệu: tắt được, điểm chặn ≥ 0, không nhận mã lạ",
    chan.huyHieu.HOAN_HAO.bat === false &&
      chan.huyHieu.HOAN_HAO.diem === 0 &&
      !("KHONG_CO" in chan.huyHieu),
  );

  const sao = chuanLuat({
    tram: { saoMot: 9, saoMotThuThach: 10, saoHai: 5, saoBa: 7 },
  });
  kiem(
    "Ngưỡng sao luôn tăng dần (1 sao ≤ 2 sao ≤ 3 sao)",
    sao.tram.saoMot <= sao.tram.saoHai &&
      sao.tram.saoMotThuThach <= sao.tram.saoHai &&
      sao.tram.saoHai <= sao.tram.saoBa,
    JSON.stringify(sao.tram),
  );

  const dh = chuanLuat({
    danhHieu: [
      { tuDiem: 500, ten: "Bậc một" },
      { tuDiem: 5000 },
      { tuDiem: 100 },
      {},
      { tuDiem: 1 },
      { tuDiem: 99, ten: "thừa" },
    ],
  }).danhHieu;
  kiem(
    "Danh hiệu: đúng 5 bậc, bậc 1 từ 0 điểm, điểm tăng dần",
    dh.length === 5 &&
      dh[0].tuDiem === 0 &&
      dh[0].ten === "Bậc một" &&
      dh.every((d, i) => i === 0 || d.tuDiem > dh[i - 1].tuDiem),
    JSON.stringify(dh.map((d) => d.tuDiem)),
  );

  let khopSao = true;
  for (let n = 0; n <= 10; n++)
    for (const tt of [false, true])
      if (tinhSaoTheoLuat(LUAT_MAC_DINH, n, tt) !== tinhSao(n, tt))
        khopSao = false;
  kiem("tinhSaoTheoLuat mặc định khớp tinhSao cũ trên 0..10", khopSao);
  kiem(
    "Điều kiện vượt trạm mặc định khớp luật cũ (6 / 7)",
    canDeQuaTheoLuat(LUAT_MAC_DINH, false) === canDeQua(false) &&
      canDeQuaTheoLuat(LUAT_MAC_DINH, true) === canDeQua(true),
  );
  const saoRieng = chuanLuat({ tram: { saoMot: 5 } });
  kiem(
    "Ngưỡng sao theo luật riêng: 5 câu đúng được 1 sao",
    tinhSaoTheoLuat(saoRieng, 5, false) === 1 &&
      tinhSaoTheoLuat(saoRieng, 4, false) === 0,
  );

  let khopDiem = true;
  for (let c = 0; c <= 10; c++)
    if (diemChuoiTheoLuat(LUAT_MAC_DINH, c) !== diemChuoi(c)) khopDiem = false;
  for (const [a, b] of [
    [0, 20000],
    [5000, 20000],
    [19999, 20000],
    [30000, 20000],
  ])
    if (diemTocDoTheoLuat(LUAT_MAC_DINH, a, b) !== diemTocDo(a, b))
      khopDiem = false;
  for (let ng = 0; ng <= 10; ng++)
    if (thuongChuoiNgayTheoLuat(LUAT_MAC_DINH, ng) !== thuongChuoiNgay(ng))
      khopDiem = false;
  kiem(
    "Điểm tốc độ / chuỗi / thưởng chuỗi ngày theo luật mặc định khớp hàm cũ",
    khopDiem,
  );
  kiem(
    "Danh hiệu theo luật mặc định khớp hàm cũ",
    [0, 2999, 3000, 10000, 40000].every(
      (d) =>
        danhHieuTheoLuat(LUAT_MAC_DINH, d, false).hienTai.ten ===
        danhHieu(d, false).hienTai.ten,
    ) && danhHieuTheoLuat(LUAT_MAC_DINH, 0, true).hienTai.bac === 6,
  );
}

function soatTinhNangNoiDung() {
  console.log("\n— Làm sạch tính năng & nội dung sửa —");
  kiem(
    "chuanTinhNang(null) = mặc định (mọi tính năng bật, không tạm dừng)",
    isDeepStrictEqual(chuanTinhNang(null), TINH_NANG_MAC_DINH) &&
      !TINH_NANG_MAC_DINH.tamDung,
  );
  const tn = chuanTinhNang({
    theCoHoi: false,
    troGiupHoi: "false",
    thongBaoTamDung: "   ",
  });
  kiem(
    "Công tắc chỉ nhận true/false; thông báo rỗng → mặc định",
    tn.theCoHoi === false &&
      tn.troGiupHoi === true &&
      tn.thongBaoTamDung === TINH_NANG_MAC_DINH.thongBaoTamDung,
  );

  const g0 = THE_CO_HOI_GOC[0];
  const the = chuanTheCoHoi(
    {
      ds: [
        { ...g0, ten: "Tên đã sửa" },
        {
          ma: "CH99",
          ten: "Một lựa chọn",
          tinhHuong: "t",
          lua: [{ chon: "x" }],
        },
        {
          ma: "",
          ten: "Thẻ mới",
          tinhHuong: "Tình huống",
          lua: [
            { chon: "Khôn", von: { XH: 99 }, giai: "" },
            { chon: "Vội", von: { TT: -99 }, giai: "" },
            { chon: "Thừa", von: {}, giai: "" },
          ],
        },
      ],
    },
    THE_CO_HOI_GOC,
  ).ds;
  kiem(
    "Thẻ Cơ hội: giữ mã gốc, bỏ thẻ ít hơn 2 lựa chọn, đúng 2 lựa chọn, chặn vốn",
    the.length === 2 &&
      the[0].ma === g0.ma &&
      the[0].ten === "Tên đã sửa" &&
      the.every((t) => t.lua.length === 2) &&
      the[1].lua[0].von.XH === 10 &&
      the[1].lua[1].von.TT === -10 &&
      !!the[1].ma,
    JSON.stringify(the.map((t) => [t.ma, t.lua.length])),
  );
  kiem(
    "Thẻ Cơ hội chưa sửa = 16 thẻ gốc, đều bật, 2 lựa chọn",
    chuanTheCoHoi(null, THE_CO_HOI_GOC).ds.length === 16 &&
      THE_CO_HOI_GOC.every((t) => t.bat && t.lua.length === 2),
  );

  const cs = chuanChiaSe(
    {
      ds: [
        { ma: "cs01", hoi: "Câu sửa?", luaChon: ["A", "A", "B"] },
        { ma: "cs02", hoi: "Một phương án", luaChon: ["A"] },
      ],
    },
    CHIA_SE_GOC,
  ).ds;
  kiem(
    "Câu chia sẻ: giữ mã chữ thường, bỏ phương án trùng, bỏ câu dưới 2 phương án",
    cs.length === 1 &&
      cs[0].ma === "cs01" &&
      isDeepStrictEqual(cs[0].luaChon, ["A", "B"]),
    JSON.stringify(cs),
  );

  const nv = chuanNhiemVu(
    {
      ds: [
        { ma: "NV99", ten: "Nhiệm vụ mới", bat: true },
        { ma: "NV01", diem: 999999, bat: false },
      ],
    },
    NHIEM_VU_GOC,
  ).ds;
  const nv01 = nv.find((n) => n.ma === "NV01");
  kiem(
    "Nhiệm vụ: không thêm mã mới, sửa được mã có sẵn (chặn điểm)",
    nv.length === NHIEM_VU_GOC.length &&
      !nv.some((n) => n.ma === "NV99") &&
      nv01?.bat === false &&
      nv01.diem === 5000,
  );

  const lmc = luatManChoi(
    LUAT_MAC_DINH,
    { ...TINH_NANG_MAC_DINH, troGiup5050: false, cauThuongHoiVien: false },
    true,
  );
  kiem(
    "Luật màn chơi: ẩn trợ giúp đang tắt, chỉ còn loại câu thưởng đang bật",
    isDeepStrictEqual(lmc.troGiup, ["HOI", "GIO"]) &&
      isDeepStrictEqual(lmc.cauThuong, ["CHIA_SE"]) &&
      lmc.canDeQuaThuThach === 7 &&
      lmc.giayThem === 15,
  );
  kiem(
    "Luật màn chơi: công tắc chính câu thưởng tắt → không có câu thưởng",
    luatManChoi(LUAT_MAC_DINH, TINH_NANG_MAC_DINH, false).cauThuong.length ===
      0,
  );
  const tc = tuyChonCauThuong(
    { cauThuongHoiVien: true, cauThuongChiaSe: false },
    chuanLuat({ cauThuong: { giayHoiVien: 33 } }),
  );
  kiem(
    "Tuỳ chọn câu thưởng lấy công tắc con + giây theo luật",
    tc.hoiVien && !tc.chiaSe && tc.giayHoiVien === 33,
  );
}

// ─── Phần CSDL ────────────────────────────────────────────────────────

type MucDe = {
  id: string;
  tt: number[];
  giay?: number;
  thuong?: {
    loai: string;
    ma: string;
    hoi: string;
    giay: number;
    dung?: number;
  };
  cau?: { t: string; d?: boolean };
};

async function chayCsdl() {
  console.log("\n— Luật & tính năng hành trình trên CSDL —");
  const muaThat = await prisma.nnMua.findFirst({
    where: { trangThai: "DANG_MO" },
  });
  if (muaThat) {
    console.log(
      "BỎ QUA  đang có mùa giải thật mở — không chạy ván thử để khỏi lẫn số liệu",
    );
    return;
  }
  const cd = await import("../src/lib/ngoi-nha/cai-dat");
  const dc = await import("../src/lib/ngoi-nha/dong-co");
  const th = await import("../src/lib/ngoi-nha/tong-hop");
  const sc = await import("../src/lib/ngoi-nha/so-cai");
  const { muaHienTai } = await import("../src/lib/ngoi-nha/mua");

  const KHOA = [
    "nn.luat",
    "nn.tinhNang",
    "nn.thongSo",
    "nn.theCoHoi",
    "nn.chiaSe",
  ];
  const goc = await prisma.siteSetting.findMany({
    where: { key: { in: KHOA } },
  });
  const userId = `kiem-tra-cdg-${Date.now()}`;
  const nguoi = { userId, memberId: null };
  let dauTriId: string | null = null;

  const deBai = async (luotId: string) =>
    JSON.parse(
      (await prisma.nnLuot.findUniqueOrThrow({ where: { id: luotId } })).deBai,
    ) as MucDe[];

  /** Trả lời đúng câu đang mở bằng cách đọc đề bài đã xáo trong CSDL. */
  async function dapAnDung(luotId: string) {
    const l = await prisma.nnLuot.findUniqueOrThrow({ where: { id: luotId } });
    const muc = (JSON.parse(l.deBai) as MucDe[])[l.viTri];
    if (muc.thuong) return { chon: muc.thuong.dung ?? 0 };
    const c = muc.cau ?? CAU_THEO_ID[muc.id];
    const n = muc.tt.length;
    if (c.t === "chon" || c.t === "th") return { chon: muc.tt.indexOf(0) };
    if (c.t === "ds") return { dung: !!c.d };
    if (c.t === "xep")
      return { thuTu: [...Array(n).keys()].map((k) => muc.tt.indexOf(k)) };
    return { cap: [...Array(n).keys()].map((k) => muc.tt.indexOf(k)) };
  }

  /** Chơi hết lượt, đúng mọi câu; trả các phản hồi và kết quả. */
  async function choiHet(luotId: string) {
    const phs = [];
    for (let i = 0; i < 20; i++) {
      await dc.moCau(nguoi, luotId);
      const ph = await dc.traLoi(nguoi, luotId, i, await dapAnDung(luotId));
      phs.push(ph);
      if (ph.cuoi) return { phs, kq: ph.ketQua! };
    }
    throw new Error("Lượt không kết thúc");
  }

  try {
    // Ca kiểm thử tính từ mặc định — cài đặt đang lưu trên máy không làm test sai
    await cd.xoaMuc("luat");
    await cd.xoaMuc("tinhNang");
    await cd.xoaMuc("theCoHoi");
    await cd.xoaMuc("chiaSe");
    await cd.ghiMuc("thongSo", THONG_SO_MAC_DINH);
    const mua = await muaHienTai();
    kiem(
      "Chưa có mùa → chơi thử có tính điểm",
      mua.id === "CHOI_THU" && mua.tinhDiem,
    );

    const L = LUAT_MAC_DINH;
    const luat1: LuatChoi = {
      ...L,
      tram: {
        ...L.tram,
        dung: 200,
        vonChinh: 9,
        giay: { ...L.tram.giay, chon: 25, ds: 12 },
      },
      cauThuong: { ...L.cauThuong, diemHoiVien: 111, diemChiaSe: 77 },
      huyHieu: {
        ...L.huyHieu,
        HOAN_HAO: { bat: false, diem: 200 },
        TIA_CHOP: { bat: true, diem: 123 },
      },
      danhHieu: L.danhHieu.map((d, i) =>
        i === 1 ? { ...d, ten: "Bậc thử", tuDiem: 100 } : d,
      ),
      dauTri: { ...L.dauTri, vonTTMoiCau: 3, vonXH: 5 },
    };
    await cd.ghiMuc("luat", luat1);

    // ── Chấm điểm & giây theo luật ──
    const l1 = await dc.batDauTram(nguoi, "1.1");
    const de1 = await deBai(l1.luotId);
    kiem(
      "Giây theo loại câu được chụp vào đề bài lúc tạo lượt",
      de1
        .filter((m) => !m.thuong)
        .every((m) => m.giay === luat1.tram.giay[CAU_THEO_ID[m.id].t]),
    );
    // Ban đổi giây giữa chừng: lượt đang dở vẫn giữ giây đã chụp
    await cd.ghiMuc("luat", {
      ...luat1,
      tram: {
        ...luat1.tram,
        giay: { chon: 40, ds: 40, th: 40, xep: 40, ghep: 40 },
      },
    });
    const mo1 = await dc.moCau(nguoi, l1.luotId);
    const loai0 = CAU_THEO_ID[de1[0].id].t;
    kiem(
      "Đổi luật giây giữa lượt không đổi giờ câu đang chơi",
      mo1.cau?.gioiHanMs === luat1.tram.giay[loai0] * 1000,
      `${mo1.cau?.gioiHanMs}`,
    );
    await cd.ghiMuc("luat", luat1);

    const { phs: phs1, kq: kq1 } = await choiHet(l1.luotId);
    const chinh = phs1.filter((_, i) => !de1[i]?.thuong);
    kiem(
      "Đặt điểm câu đúng = 200 → mỗi câu đúng được gốc 200",
      chinh.length === 10 &&
        chinh.every(
          (p) =>
            p.dung &&
            p.chiTiet.goc === 200 &&
            p.diem === p.chiTiet.goc + p.chiTiet.tocDo + p.chiTiet.chuoi,
        ),
      JSON.stringify(chinh.map((p) => p.chiTiet.goc)),
    );
    const mucThuong = de1.find((m) => m.thuong);
    if (mucThuong?.thuong) {
      const phThuong = phs1[de1.indexOf(mucThuong)];
      kiem(
        `Câu thưởng ${mucThuong.thuong.loai} chấm theo luật (111 / 77)`,
        phThuong.diem === (mucThuong.thuong.loai === "HOI_VIEN" ? 111 : 77),
        String(phThuong.diem),
      );
    } else {
      console.log(
        "BỎ QUA  lượt không có câu thưởng (máy thiếu dữ liệu hội viên)",
      );
    }
    kiem(
      "Lượt 10/10 theo luật: 3 sao, điểm ≥ 2.000, vốn chính +9",
      kq1.sao === 3 && kq1.diem >= 2000 && kq1.von.TT >= 9,
      JSON.stringify({ sao: kq1.sao, diem: kq1.diem, von: kq1.von }),
    );
    kiem(
      "Huy hiệu đang tắt (Hoàn hảo) không được trao",
      !kq1.huyHieuMoi.some((h) => h.ma === "HOAN_HAO"),
      JSON.stringify(kq1.huyHieuMoi),
    );
    const tiaChop = kq1.huyHieuMoi.find((h) => h.ma === "TIA_CHOP");
    kiem(
      "Điểm huy hiệu theo luật (Tia chớp 123 nếu đạt)",
      !tiaChop || tiaChop.diem === 123,
      JSON.stringify(tiaChop),
    );
    kiem(
      "Lên hạng theo danh hiệu Ban đặt",
      kq1.lenHang?.ten === "Bậc thử",
      JSON.stringify(kq1.lenHang),
    );
    kiem("Qua trạm được mời rút Thẻ Cơ hội", kq1.coTheCoHoi);

    // ── Trợ giúp ──
    await cd.ghiMuc("tinhNang", { ...TINH_NANG_MAC_DINH, troGiup5050: false });
    await cd.ghiMuc("luat", {
      ...luat1,
      tram: { ...luat1.tram, giayThem: 20 },
    });
    const l2 = await dc.batDauTram(nguoi, "1.1");
    await dc.moCau(nguoi, l2.luotId);
    await kiemLoi(
      "Tắt 50:50 → máy chủ từ chối dù trình duyệt vẫn gửi",
      () => dc.dungTroGiup(nguoi, l2.luotId, 0, "5050"),
      "TAT",
    );
    const gio = await dc.dungTroGiup(nguoi, l2.luotId, 0, "GIO");
    const muc2 = (await deBai(l2.luotId))[0];
    kiem(
      "Thêm giờ theo luật (+20 giây, cộng trên giây đã chụp)",
      !!muc2.giay && gio.gioiHanMs === (muc2.giay + 20) * 1000,
      `${gio.gioiHanMs} / ${muc2.giay}`,
    );
    const tt2 = await th.thongTinTram(nguoi, mua, "1.1");
    kiem(
      "Trang trạm nhận luật màn chơi: ẩn 50:50, +20 giây, điểm câu thưởng",
      !!tt2 &&
        !tt2.luatManChoi.troGiup.includes("5050") &&
        tt2.luatManChoi.giayThem === 20 &&
        tt2.luatManChoi.diemThuong.HOI_VIEN === 111,
    );
    await dc.ketThucLuot(nguoi, l2.luotId);

    // ── Thẻ Cơ hội ──
    await cd.ghiMuc("tinhNang", { ...TINH_NANG_MAC_DINH, theCoHoi: false });
    await kiemLoi(
      "Tắt Thẻ Cơ hội → không rút được thẻ mới",
      () => dc.rutTheCoHoi(nguoi, l1.luotId),
      "TAT",
    );
    const tt3 = await th.thongTinTram(nguoi, mua, "1.1");
    kiem(
      "Tắt Thẻ Cơ hội → trang trạm không mời mở thẻ",
      tt3?.luotRutThe === null,
    );
    const l3 = await dc.batDauTram(nguoi, "1.1");
    const { kq: kq3 } = await choiHet(l3.luotId);
    kiem(
      "Tắt Thẻ Cơ hội → qua trạm không mời rút thẻ",
      kq3.daQua && !kq3.coTheCoHoi,
    );
    await cd.xoaMuc("tinhNang");
    const dsThe = THE_CO_HOI_GOC.map((t) =>
      t.ma === "CH05"
        ? {
            ...t,
            ten: "Thẻ thử đổi tên",
            lua: [{ ...t.lua[0], von: { XH: 7 } }, t.lua[1]],
          }
        : { ...t, bat: false },
    );
    await cd.ghiMuc("theCoHoi", { ds: dsThe });
    const the = await dc.rutTheCoHoi(nguoi, l1.luotId);
    kiem(
      "Sửa tên thẻ → rút đúng thẻ đang bật và thấy tên mới",
      the.ma === "CH05" && the.ten === "Thẻ thử đổi tên",
      `${the.ma} ${the.ten}`,
    );
    const theLai = await dc.rutTheCoHoi(nguoi, l1.luotId);
    kiem(
      "Mở lại thẻ vẫn đúng thứ tự lựa chọn",
      theLai.lua.join("|") === the.lua.join("|"),
    );
    const iKhon = the.lua.indexOf(
      dsThe.find((t) => t.ma === "CH05")!.lua[0].chon,
    );
    const chonThe = await dc.chonTheCoHoi(nguoi, l1.luotId, iKhon);
    kiem(
      "Chọn thẻ đã sửa: vốn theo bản sửa, lựa chọn đầu vẫn là khôn ngoan",
      chonThe.khonNgoan && chonThe.von.XH === 7 && chonThe.ghiNhan,
      JSON.stringify(chonThe),
    );
    await cd.xoaMuc("theCoHoi");

    // ── Thử thách hằng ngày ──
    await cd.ghiMuc("tinhNang", { ...TINH_NANG_MAC_DINH, thuThachNgay: false });
    await kiemLoi(
      "Tắt thử thách hằng ngày → không mở được lượt mới",
      () => dc.batDauThuThachNgay(nguoi),
      "TAT",
    );
    await cd.xoaMuc("tinhNang");
    const homNay = ngayThuThach(new Date(), THU_THACH_NGAY.GIO_SANG_NGAY);
    // Giả lập đã chơi hôm qua để có chuỗi 2 ngày
    await prisma.nnLuot.create({
      data: {
        userId,
        muaId: mua.id,
        tramMa: dc.NGAY,
        ngay: congNgay(homNay, -1),
        cheDo: "THU_THACH_NGAY",
        deBai: "[]",
        trangThai: "XONG",
      },
    });
    await cd.ghiMuc("luat", {
      ...luat1,
      thuThachNgay: {
        ...L.thuThachNgay,
        soCau: 3,
        thuongMoiNgay: 40,
        ngayChuyenCan: 2,
      },
    });
    const ngay = await dc.batDauThuThachNgay(nguoi);
    kiem("Mở thử thách lần đầu là lượt mới (tiepTuc = false)", !ngay.tiepTuc);
    const ngayLai = await dc.batDauThuThachNgay(nguoi);
    kiem(
      "Mở lại thử thách đang dở báo tiepTuc → màn chơi mở thẳng, không đếm ngược",
      ngayLai.luotId === ngay.luotId && ngayLai.tiepTuc && !ngayLai.daXong,
      JSON.stringify(ngayLai),
    );
    const { kq: kqNgay } = await choiHet(ngay.luotId);
    kiem(
      "Thử thách theo luật: 3 câu, thưởng 40 × 2 ngày, Chuyên cần từ 2 ngày",
      kqNgay.tong === 3 &&
        kqNgay.chuoiNgay === 2 &&
        kqNgay.thuongChuoiNgay === 80 &&
        kqNgay.huyHieuMoi.some((h) => h.ma === "CHUYEN_CAN"),
      JSON.stringify({
        tong: kqNgay.tong,
        chuoi: kqNgay.chuoiNgay,
        thuong: kqNgay.thuongChuoiNgay,
        hh: kqNgay.huyHieuMoi,
      }),
    );
    const hs = await th.hoSoNguoiChoi(nguoi, mua);
    kiem(
      "Hồ sơ theo luật: danh hiệu Ban đặt, số câu thử thách 3, có luật đi kèm",
      hs.danhHieu.hienTai.ten === "Bậc thử" &&
        hs.thuThach.soCau === 3 &&
        hs.luat.thuThachNgay.soCau === 3,
      `${hs.danhHieu.hienTai.ten} · ${hs.thuThach.soCau}`,
    );
    await cd.ghiMuc("luat", luat1);

    // ── Câu thưởng ──
    await cd.ghiMuc("tinhNang", {
      ...TINH_NANG_MAC_DINH,
      cauThuongHoiVien: false,
      cauThuongChiaSe: false,
    });
    const l4 = await dc.batDauTram(nguoi, "1.1");
    const de4 = await deBai(l4.luotId);
    kiem(
      "Tắt cả hai loại câu thưởng → lượt không có câu thưởng",
      de4.length === 10 && de4.every((m) => !m.thuong),
      `${de4.length} mục`,
    );
    await dc.ketThucLuot(nguoi, l4.luotId);
    await cd.xoaMuc("tinhNang");
    await cd.ghiMuc("thongSo", { ...THONG_SO_MAC_DINH, cauThuong: false });
    const l4b = await dc.batDauTram(nguoi, "1.1");
    kiem(
      "Công tắc chính câu thưởng tắt → lượt không có câu thưởng",
      (await deBai(l4b.luotId)).every((m) => !m.thuong),
    );
    await dc.ketThucLuot(nguoi, l4b.luotId);
    await cd.ghiMuc("thongSo", THONG_SO_MAC_DINH);

    await cd.ghiMuc("tinhNang", {
      ...TINH_NANG_MAC_DINH,
      cauThuongHoiVien: false,
    });
    await cd.ghiMuc("chiaSe", {
      ds: CHIA_SE_GOC.map((c) =>
        c.ma === "cs03"
          ? { ...c, hoi: "Câu chia sẻ đã sửa?" }
          : { ...c, bat: false },
      ),
    });
    await cd.ghiMuc("luat", {
      ...luat1,
      cauThuong: { ...luat1.cauThuong, giayChiaSe: 44 },
    });
    await prisma.nnChiaSe.deleteMany({ where: { userId } });
    const l5 = await dc.batDauTram(nguoi, "1.1");
    const t5 = (await deBai(l5.luotId)).find((m) => m.thuong)?.thuong;
    kiem(
      "Chỉ bật câu chia sẻ → câu chia sẻ đang bật (hoặc câu Ban Chủ nhiệm), giây theo luật",
      !!t5 &&
        t5.loai === "CHIA_SE" &&
        (t5.ma === "cs03"
          ? t5.hoi === "Câu chia sẻ đã sửa?"
          : t5.ma === "bcn") &&
        t5.giay === 44,
      JSON.stringify(t5),
    );
    await dc.ketThucLuot(nguoi, l5.luotId);
    await cd.xoaMuc("chiaSe");
    await cd.xoaMuc("tinhNang");
    await cd.ghiMuc("luat", luat1);

    // ── Đấu trí sự kiện ──
    const phien = await prisma.nnDauTri.create({
      data: {
        ten: "__KIEM_TRA_CAI_DAT_GAME__",
        boCau: "kiem-tra",
        deBai: JSON.stringify(
          dc.deBaiTuBoCau("kiem-tra", [
            {
              hoi: "Chợ Bình Tây nằm ở đâu?",
              phuongAn: ["Quận 6", "Quận 1", "Quận 3", "Quận 7"],
              dung: 0,
              giai: "",
            },
          ]),
        ),
        giayMoiCau: 20,
        maThamGia: `KT${String(Date.now()).slice(-6)}`,
        trangThai: "DANG_MO",
      },
    });
    dauTriId = phien.id;
    await cd.ghiMuc("tinhNang", { ...TINH_NANG_MAC_DINH, dauTri: false });
    await kiemLoi(
      "Tắt Đấu trí → không vào được phiên",
      () => dc.batDauDauTri(nguoi, phien.id),
      "TAT",
    );
    await cd.xoaMuc("tinhNang");
    const lDt = await dc.batDauDauTri(nguoi, phien.id);
    const lDtLai = await dc.batDauDauTri(nguoi, phien.id);
    kiem(
      "Vào lại phiên Đấu trí đang dở báo tiepTuc (mở thẳng câu đang chạy đồng hồ)",
      !lDt.tiepTuc && lDtLai.luotId === lDt.luotId && lDtLai.tiepTuc,
      JSON.stringify({ lDt, lDtLai }),
    );
    const { kq: kqDt } = await choiHet(lDt.luotId);
    kiem(
      "Đấu trí: vốn theo luật (3 tri thức mỗi câu đúng, 5 xã hội)",
      kqDt.von.TT === 3 && kqDt.von.XH === 5,
      JSON.stringify(kqDt.von),
    );

    // ── Sổ cái: huy hiệu & ngưỡng cân bằng nhận luật ──
    const muaTam = `KIEMTRACDG${Date.now()}`;
    await sc.ghiSoCai(prisma, {
      userId,
      muaId: muaTam,
      loai: "KIEM_TRA",
      nguon: "kiem-tra",
      von: { CN: 6, TT: 6, XH: 6, TS: 6 },
    });
    const canBangGoc = await sc.xetCanBang(prisma, userId, muaTam);
    const luatCanBang = chuanLuat({
      von: { nguongCanBang: 6 },
      huyHieu: { CAN_BANG: { bat: true, diem: 777 } },
    });
    const canBangMoi = await sc.xetCanBang(prisma, userId, muaTam, luatCanBang);
    kiem(
      "Ngưỡng cân bằng theo luật: 4 vốn = 6 chưa đủ 30, đủ ngưỡng 6 → +777",
      canBangGoc.length === 0 &&
        canBangMoi.length === 1 &&
        canBangMoi[0].diem === 777,
      JSON.stringify(canBangMoi),
    );
    const tat = await sc.traoHuyHieu(
      prisma,
      userId,
      muaTam,
      ["HOAN_HAO"],
      chuanLuat({ huyHieu: { HOAN_HAO: { bat: false } } }),
    );
    kiem("traoHuyHieu bỏ qua huy hiệu đang tắt", tat.length === 0);
  } finally {
    const luot = await prisma.nnLuot.findMany({
      where: { userId },
      select: { id: true },
    });
    await prisma.nnTraLoi.deleteMany({
      where: { luotId: { in: luot.map((l) => l.id) } },
    });
    await prisma.nnLuot.deleteMany({ where: { userId } });
    await prisma.nnTienDo.deleteMany({ where: { userId } });
    await prisma.nnSoCai.deleteMany({ where: { userId } });
    await prisma.nnHuyHieu.deleteMany({ where: { userId } });
    await prisma.nnNguoiChoi.deleteMany({ where: { userId } });
    await prisma.nnChiaSe.deleteMany({ where: { userId } });
    if (dauTriId) await prisma.nnDauTri.deleteMany({ where: { id: dauTriId } });
    // Trả lại đúng bản gốc (kể cả "chưa lưu gì")
    for (const k of KHOA) {
      const g = goc.find((x) => x.key === k);
      if (g)
        await prisma.siteSetting.upsert({
          where: { key: k },
          create: { key: k, value: g.value },
          update: { value: g.value },
        });
      else await prisma.siteSetting.deleteMany({ where: { key: k } });
    }
    console.log("Đã trả cài đặt gốc và xoá dữ liệu ván thử");
  }
}

async function main() {
  soatLuat();
  soatTinhNangNoiDung();
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
