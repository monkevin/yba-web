/**
 * Bộ máy chơi của game "Ngôi nhà Chợ Lớn" — CHỈ CHẠY Ở MÁY CHỦ.
 *
 * Nguyên tắc chống gian lận:
 *  - Đáp án không bao giờ gửi xuống trình duyệt trước khi người chơi trả lời.
 *  - Giờ tính ở máy chủ: `cauMoLuc` ghi lúc mở câu, trả lời trễ quá giới hạn
 *    (cộng 2 giây bù mạng) là hết giờ, dù trình duyệt gửi gì lên.
 *  - Mỗi câu chỉ ghi nhận một lần (điều kiện `viTri` + khoá `luotId, cauId`).
 *  - Kết thúc lượt chốt `trangThai` trước rồi mới cộng điểm, bấm hai lần không
 *    cộng hai lần.
 * Điểm bảng xếp hạng chỉ cộng phần VƯỢT kỷ lục cũ của trạm (lượt cao nhất).
 *
 * Luật chơi và bật / tắt tính năng do Ban Điều hành chỉnh (`cai-dat/`): đọc
 * TRƯỚC khi mở `$transaction` rồi truyền vào (SQLite một kết nối). Giây mỗi câu
 * chụp vào đề bài lúc tạo lượt (`MucDeBai.giay`) nên lượt đang dở không bị đổi
 * giữa chừng; điểm chấm theo luật lúc trả lời.
 */
import type { NnLuot } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CauHienThi,
  DapAnGui,
  HuyHieuMoi,
  KetQuaLuot,
  KetQuaTheCoHoi,
  KetQuaTroGiup,
  NguoiChoi,
  PhanHoi,
  TheCoHoiHienThi,
  TrangThaiCau,
} from "./kieu";
import {
  DIEM,
  HUY_HIEU_CHANG,
  MA_VON,
  SO_CAU_MOI_TRAM,
  THU_THACH_NGAY,
  vonRong,
  type CheDo,
  type TroGiup,
  type Von,
} from "./luat";
import {
  rutCauThuong,
  tiLeChiaSe,
  tuyChonCauThuong,
  type CauThuong,
} from "./cau-thuong";
import { docMuc, docTheCoHoiSua, docTinhNang } from "./cai-dat";
import {
  LUAT_MAC_DINH,
  danhHieuTheoLuat,
  diemChuoiTheoLuat,
  diemTocDoTheoLuat,
  thuongChuoiNgayTheoLuat,
  tinhSaoTheoLuat,
  type LuatChoi,
} from "./cai-dat/luat-choi";
import type { TinhNang } from "./cai-dat/tinh-nang";
import type { TheCoHoiSua } from "./cai-dat/noi-dung-sua";
import type { ThongSoGame } from "./moc-qua";
import { CHOI_THU, muaHienTai } from "./mua";
import {
  CAU_HOI,
  CAU_THEO_ID,
  CHANG_THEO_SO,
  NGUON,
  THE_THEO_MA,
  TRAM,
  TRAM_THEO_MA,
  cauCuaTram,
  type CauHoi,
  type TheCoHoi,
  type Tram,
} from "./noi-dung";
import {
  GIAO_DICH,
  LoiGame,
  docJson,
  ghiSoCai,
  tongSoCai,
  traoHuyHieu,
  xetCanBang,
  type Tx,
} from "./so-cai";
import { congNgay, ngayThuThach } from "./thoi-gian";

export { LoiGame };

/**
 * Một mục trong đề bài: câu ngân hàng (id + thứ tự xáo), câu thưởng (kèm nội
 * dung sinh sẵn) hoặc câu soạn riêng cho Đấu trí sự kiện (`cau` nằm ngay trong
 * đề bài, cùng cấu trúc câu ngân hàng). `giay` ghi đè thời gian mỗi câu.
 */
export type MucDeBai = {
  id: string;
  tt: number[];
  thuong?: CauThuong;
  cau?: CauHoi;
  giay?: number;
};
const TIEN_TO_THUONG = "thuong:";
/** `tramMa` của lượt Đấu trí sự kiện: "DAU:<id phiên>" */
export const TIEN_TO_DAU = "DAU:";
export const laLuotDauTri = (tramMa: string) => tramMa.startsWith(TIEN_TO_DAU);
/** Câu hỏi của một mục — ngân hàng hoặc soạn riêng. */
export const cauCua = (muc: MucDeBai): CauHoi | undefined =>
  muc.cau ?? CAU_THEO_ID[muc.id];
/** Số câu chính của lượt — không tính câu thưởng cuối lượt. */
const soCauChinh = (deBai: MucDeBai[]) => deBai.filter((m) => !m.thuong).length;

/** `tramMa` của thử thách hằng ngày */
export const NGAY = "NGAY";
/** Lượt bỏ dở quá lâu thì tự chốt với số câu đã trả lời */
const LUOT_CU_MS = 6 * 3600 * 1000;
/** Tối thiểu bao nhiêu câu trả lời của người khác mới hiện tỉ lệ "Hỏi Huynh đệ" */
const TOI_THIEU_HOI = 3;

const CAU_XEP = CAU_HOI.filter((c) => c.t === "xep").map((c) => c.id);

const TEN_TRO_GIUP: Record<TroGiup, string> = {
  "5050": "50 : 50",
  HOI: "Hỏi Huynh đệ",
  GIO: "Thêm giờ",
};
const CONG_TAC_TRO_GIUP: Record<
  TroGiup,
  "troGiup5050" | "troGiupHoi" | "troGiupGio"
> = {
  "5050": "troGiup5050",
  HOI: "troGiupHoi",
  GIO: "troGiupGio",
};

// ─── tiện ích ─────────────────────────────────────────────────────────

const ngauNhien = (n: number) => Math.floor(Math.random() * n);
const day = (n: number) => Array.from({ length: n }, (_, i) => i);

function xaoTron<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = ngauNhien(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Xáo cố định theo "hạt giống" — tải lại trang vẫn ra đúng thứ tự cũ. */
function xaoCoHat(n: number, hat: string): number[] {
  let h = 2166136261;
  for (const ch of hat) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const a = day(n);
  for (let i = n - 1; i > 0; i--) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    const j = h % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function soPhuongAn(c: CauHoi): number {
  if (c.t === "chon" || c.t === "th" || c.t === "xep") return c.a?.length ?? 0;
  if (c.t === "ghep") return c.p?.length ?? 0;
  return 0;
}

/** Đề bài câu ngân hàng; giây theo loại câu CHỤP từ luật lúc tạo lượt. */
function taoDeBai(cauIds: string[], luat: LuatChoi): MucDeBai[] {
  return xaoTron(cauIds).map((id) => {
    const c = CAU_THEO_ID[id];
    const n = soPhuongAn(c);
    let tt = xaoTron(day(n));
    // Câu sắp xếp / ghép cặp không được hiện sẵn đúng thứ tự
    if ((c.t === "xep" || c.t === "ghep") && n > 1) {
      while (tt.every((v, i) => v === i)) tt = xaoTron(day(n));
    }
    return { id, tt, giay: luat.tram.giay[c.t] };
  });
}

export function cauHienThi(muc: MucDeBai): CauHienThi {
  if (muc.thuong) {
    const t = muc.thuong;
    return {
      id: muc.id,
      loai: t.loai === "CHIA_SE" ? "chia-se" : "chon",
      hoi: t.hoi,
      von: "XH",
      phuongAn: t.phuongAn,
      thuong: t.loai,
    };
  }
  const c = cauCua(muc)!;
  const goc: CauHienThi = { id: c.id, loai: c.t, hoi: c.q, von: c.v };
  if (c.t === "chon" || c.t === "th")
    return { ...goc, phuongAn: muc.tt.map((i) => c.a![i]) };
  if (c.t === "xep") return { ...goc, muc: muc.tt.map((i) => c.a![i]) };
  if (c.t === "ghep")
    return {
      ...goc,
      trai: c.p!.map((x) => x[0]),
      phai: muc.tt.map((i) => c.p![i][1]),
    };
  return goc;
}

function dapAnHienThi(c: CauHoi, muc: MucDeBai): PhanHoi["dapAnDung"] {
  if (c.t === "chon" || c.t === "th") return { chon: muc.tt.indexOf(0) };
  if (c.t === "ds") return { dung: !!c.d };
  if (c.t === "xep")
    return { thuTu: day(muc.tt.length).map((k) => muc.tt.indexOf(k)) };
  return { cap: day(muc.tt.length).map((trai) => muc.tt.indexOf(trai)) };
}

function laHoanVi(x: unknown, n: number): x is number[] {
  return (
    Array.isArray(x) &&
    x.length === n &&
    x.every((v) => Number.isInteger(v) && v >= 0 && v < n) &&
    new Set(x).size === n
  );
}

const heSoLuot = (luot: Pick<NnLuot, "tramMa">, luat: LuatChoi) =>
  luot.tramMa !== NGAY && TRAM_THEO_MA[luot.tramMa]?.thuThach
    ? luat.tram.heSoThuThach
    : 1;

const khoaTienDo = (userId: string, muaId: string, tramMa: string) => ({
  userId_muaId_tramMa: { userId, muaId, tramMa },
});

/** Trạm mở khi là trạm đầu tiên hoặc đã vượt trạm liền trước. */
export function daMoKhoa(tram: Tram, daQua: Set<string>): boolean {
  return tram.thuTu === 0 || daQua.has(TRAM[tram.thuTu - 1].ma);
}

export async function tapTramDaQua(
  userId: string,
  muaId: string,
): Promise<Set<string>> {
  const rows = await prisma.nnTienDo.findMany({
    where: { userId, muaId, daQua: true },
    select: { tramMa: true },
  });
  return new Set(rows.map((r) => r.tramMa));
}

async function layLuot(nguoi: NguoiChoi, luotId: string) {
  const luot = await prisma.nnLuot.findUnique({ where: { id: luotId } });
  if (!luot || luot.userId !== nguoi.userId)
    throw new LoiGame("Không tìm thấy lượt chơi", "KHONG_THAY");
  return luot;
}

/**
 * Giới hạn giờ của câu (ms). Lượt tạo trước khi chụp giây vào đề bài thì lấy
 * theo luật hiện hành.
 */
function gioiHanCau(
  muc: MucDeBai,
  giayThem: number,
  luat: LuatChoi = LUAT_MAC_DINH,
): number {
  const giay = muc.thuong
    ? muc.thuong.giay
    : (muc.giay ?? luat.tram.giay[cauCua(muc)!.t]);
  return (giay + giayThem) * 1000;
}

/**
 * Rút `n` câu trắc nghiệm / tình huống từ ngân hàng, trải đều các trạm (mỗi trạm
 * tối đa một câu khi đủ) — dùng cho Đấu trường và Đấu trí, nơi chỉ có bấm chọn.
 */
export function rutCauTracNghiem(n: number, changSo?: number): string[] {
  const kho = CAU_HOI.filter(
    (c) =>
      (c.t === "chon" || c.t === "th") &&
      (!changSo || c.id.startsWith(`${changSo}.`)),
  );
  const theoTram = new Map<string, CauHoi[]>();
  for (const c of xaoTron(kho)) {
    const tram = c.id.slice(0, c.id.lastIndexOf("."));
    if (!theoTram.has(tram)) theoTram.set(tram, []);
    theoTram.get(tram)!.push(c);
  }
  const kq: string[] = [];
  const tramList = xaoTron([...theoTram.keys()]);
  // vòng 1 mỗi trạm một câu, các vòng sau lấy tiếp cho đủ
  for (let vong = 0; kq.length < n && vong < 20; vong++) {
    for (const t of tramList) {
      const c = theoTram.get(t)![vong];
      if (c) kq.push(c.id);
      if (kq.length >= n) break;
    }
  }
  return xaoTron(kq);
}

/** Đề bài từ bộ câu soạn riêng (Đấu trí sự kiện): câu nằm ngay trong đề bài. */
export function deBaiTuBoCau(
  ma: string,
  cau: { hoi: string; phuongAn: string[]; dung: number; giai: string }[],
  nguon = "DAU_TRI",
): MucDeBai[] {
  return cau.map((c, i) => {
    const dungText = c.phuongAn[c.dung];
    const a = [dungText, ...c.phuongAn.filter((_, k) => k !== c.dung)];
    const id = `dt:${ma}:${i + 1}`;
    return {
      id,
      tt: xaoTron(day(a.length)),
      cau: { id, t: "chon", v: "TT", q: c.hoi, a, g: c.giai, n: nguon },
    };
  });
}

/** Xáo lại thứ tự phương án cho từng người chơi (cùng bộ câu, cùng thứ tự câu). */
export function xaoLaiPhuongAn(deBai: MucDeBai[], giay?: number): MucDeBai[] {
  return deBai.map((m) => {
    const c = cauCua(m);
    if (!c || m.thuong) return m;
    const n = soPhuongAn(c);
    let tt = xaoTron(day(n));
    if ((c.t === "xep" || c.t === "ghep") && n > 1)
      while (tt.every((v, i) => v === i)) tt = xaoTron(day(n));
    return { ...m, tt, ...(giay ? { giay } : {}) };
  });
}

function trangThaiCau(
  luot: NnLuot,
  deBai: MucDeBai[],
  luat: LuatChoi,
): TrangThaiCau {
  const muc = deBai[luot.viTri];
  const gioiHanMs = gioiHanCau(muc, luot.giayThem, luat);
  const daDung = luot.cauMoLuc ? Date.now() - luot.cauMoLuc.getTime() : 0;
  return {
    luotId: luot.id,
    cheDo: luot.cheDo as CheDo,
    tramMa: luot.tramMa,
    viTri: luot.viTri,
    tong: soCauChinh(deBai),
    cau: cauHienThi(muc),
    conLaiMs: Math.max(0, gioiHanMs - daDung),
    gioiHanMs,
    troGiupDaDung: docJson<TroGiup[]>(luot.troGiup, []),
    diem: luot.diem,
    soDung: luot.soDung,
    chuoi: luot.chuoi,
    heSo: heSoLuot(luot, luat),
  };
}

/** Còn Thẻ Cơ hội để rút không: tính năng bật và còn ít nhất một thẻ đang bật. */
const coTheDeRut = (tinhNang: TinhNang, sua: { ds: TheCoHoiSua[] }) =>
  tinhNang.theCoHoi && sua.ds.some((t) => t.bat);

// ─── bắt đầu lượt ─────────────────────────────────────────────────────

/** Chốt các lượt bỏ dở quá lâu của người chơi (tính theo số câu đã trả lời). */
export async function donLuotCu(nguoi: NguoiChoi) {
  const cu = await prisma.nnLuot.findMany({
    where: {
      userId: nguoi.userId,
      trangThai: "DANG_CHOI",
      createdAt: { lt: new Date(Date.now() - LUOT_CU_MS) },
    },
    select: { id: true },
  });
  for (const l of cu) {
    try {
      await ketThucLuot(nguoi, l.id);
    } catch {
      /* lượt đã được chốt ở yêu cầu khác */
    }
  }
}

/**
 * Bắt đầu một lượt 10 câu ở trạm. Còn lượt tính điểm (tối đa 3 mỗi mùa) thì
 * tính điểm, hết thì chuyển sang luyện tập — vẫn được sao và mở trạm tiếp.
 * `tiepTuc` = mở lại lượt đang dở thay vì bắt đầu lượt mới.
 */
export async function batDauTram(
  nguoi: NguoiChoi,
  tramMa: string,
  tiepTuc = false,
): Promise<{ luotId: string; cheDo: CheDo; tiepTuc: boolean }> {
  const tram = TRAM_THEO_MA[tramMa];
  if (!tram) throw new LoiGame("Không có trạm này");
  const mua = await muaHienTai();
  const daQua = await tapTramDaQua(nguoi.userId, mua.id);
  if (!daMoKhoa(tram, daQua))
    throw new LoiGame("Trạm này chưa mở. Hãy vượt trạm liền trước.", "CHUA_MO");

  const dangChoi = await prisma.nnLuot.findFirst({
    where: {
      userId: nguoi.userId,
      muaId: mua.id,
      tramMa,
      trangThai: "DANG_CHOI",
    },
    orderBy: { createdAt: "desc" },
  });
  if (dangChoi && tiepTuc)
    return {
      luotId: dangChoi.id,
      cheDo: dangChoi.cheDo as CheDo,
      tiepTuc: true,
    };
  if (dangChoi) await ketThucLuot(nguoi, dangChoi.id);

  const [td, thongSo, luat, tinhNang] = await Promise.all([
    prisma.nnTienDo.findUnique({
      where: khoaTienDo(nguoi.userId, mua.id, tramMa),
    }),
    docMuc("thongSo"),
    docMuc("luat"),
    docTinhNang(),
  ]);
  const tinhDiem =
    mua.tinhDiem && (td?.soLuotTinhDiem ?? 0) < thongSo.luotTinhDiemToiDa;
  const cheDo: CheDo = tinhDiem ? "TINH_DIEM" : "LUYEN_TAP";
  const cauIds = xaoTron(cauCuaTram(tramMa).map((c) => c.id)).slice(
    0,
    SO_CAU_MOI_TRAM,
  );
  if (cauIds.length < SO_CAU_MOI_TRAM)
    throw new LoiGame("Trạm này chưa đủ câu hỏi");
  const deBai = [
    ...taoDeBai(cauIds, luat),
    ...(await mucThuong(nguoi, thongSo, luat, tinhNang)),
  ];

  const luot = await prisma.$transaction(async (tx) => {
    await tx.nnTienDo.upsert({
      where: khoaTienDo(nguoi.userId, mua.id, tramMa),
      create: {
        userId: nguoi.userId,
        muaId: mua.id,
        tramMa,
        soLuotTinhDiem: tinhDiem ? 1 : 0,
      },
      update: tinhDiem ? { soLuotTinhDiem: { increment: 1 } } : {},
    });
    return tx.nnLuot.create({
      data: {
        userId: nguoi.userId,
        muaId: mua.id,
        tramMa,
        cheDo,
        deBai: JSON.stringify(deBai),
      },
    });
  }, GIAO_DICH);
  return { luotId: luot.id, cheDo, tiepTuc: false };
}

/**
 * Thử thách hằng ngày: vài câu ngẫu nhiên từ các trạm đã mở, mỗi ngày một lần.
 * Ban tắt tính năng thì không mở được lượt MỚI; lượt hôm nay đã có vẫn chơi
 * nốt / xem lại được.
 *
 * `tiepTuc` = trả về lượt đã có (không phải lượt mới) — màn chơi dựa vào đây để
 * mở thẳng câu đang dở, không đếm ngược 3-2-1: đồng hồ của câu đang mở vẫn chạy
 * ở máy chủ nên đếm ngược là ăn mất mấy giây của người chơi.
 */
export async function batDauThuThachNgay(
  nguoi: NguoiChoi,
): Promise<{ luotId: string; daXong: boolean; tiepTuc: boolean }> {
  const ngay = ngayThuThach(new Date(), THU_THACH_NGAY.GIO_SANG_NGAY);
  const co = await prisma.nnLuot.findUnique({
    where: { userId_ngay: { userId: nguoi.userId, ngay } },
  });
  if (co)
    return {
      luotId: co.id,
      daXong: co.trangThai !== "DANG_CHOI",
      tiepTuc: true,
    };

  const [mua, thongSo, luat, tinhNang] = await Promise.all([
    muaHienTai(),
    docMuc("thongSo"),
    docMuc("luat"),
    docTinhNang(),
  ]);
  if (!tinhNang.thuThachNgay)
    throw new LoiGame(
      "Thử thách hằng ngày đang tạm nghỉ — hẹn anh/chị dịp khác nhé.",
      "TAT",
    );
  const daQua = await tapTramDaQua(nguoi.userId, mua.id);
  const kho = TRAM.filter((t) => daMoKhoa(t, daQua)).flatMap((t) =>
    cauCuaTram(t.ma).map((c) => c.id),
  );
  const cauIds = xaoTron(kho).slice(0, luat.thuThachNgay.soCau);
  const deBai = [
    ...taoDeBai(cauIds, luat),
    ...(await mucThuong(nguoi, thongSo, luat, tinhNang)),
  ];
  try {
    const luot = await prisma.nnLuot.create({
      data: {
        userId: nguoi.userId,
        muaId: mua.id,
        tramMa: NGAY,
        ngay,
        cheDo: "THU_THACH_NGAY",
        deBai: JSON.stringify(deBai),
      },
    });
    return { luotId: luot.id, daXong: false, tiepTuc: false };
  } catch {
    // Hai yêu cầu cùng lúc: khoá (userId, ngay) chặn bản thứ hai
    const lai = await prisma.nnLuot.findUnique({
      where: { userId_ngay: { userId: nguoi.userId, ngay } },
    });
    if (!lai)
      throw new LoiGame("Chưa mở được thử thách hôm nay, thử lại sau ít phút");
    return {
      luotId: lai.id,
      daXong: lai.trangThai !== "DANG_CHOI",
      tiepTuc: true,
    };
  }
}

/**
 * Mục câu thưởng cuối lượt (0 hoặc 1 mục). Công tắc chính tắt, cả hai loại tắt
 * hoặc không có dữ liệu thì lượt không có câu thưởng.
 */
async function mucThuong(
  nguoi: NguoiChoi,
  thongSo: ThongSoGame,
  luat: LuatChoi,
  tinhNang: TinhNang,
): Promise<MucDeBai[]> {
  if (!thongSo.cauThuong) return [];
  const t = await rutCauThuong(nguoi, tuyChonCauThuong(tinhNang, luat)).catch(
    () => null,
  );
  return t
    ? [{ id: `${TIEN_TO_THUONG}${t.loai}:${t.ma}`, tt: [], thuong: t }]
    : [];
}

// ─── trong lượt ───────────────────────────────────────────────────────

/**
 * Mở câu hiện tại: bắt đầu tính giờ ở máy chủ nếu câu chưa mở. Mở lại câu đang
 * dở (tải lại trang) KHÔNG đặt lại đồng hồ. Lượt đã hết câu thì trả kết quả.
 */
export async function moCau(
  nguoi: NguoiChoi,
  luotId: string,
): Promise<{ cau?: TrangThaiCau; ketQua?: KetQuaLuot }> {
  let luot = await layLuot(nguoi, luotId);
  if (luot.trangThai !== "DANG_CHOI") {
    const kq = docJson<KetQuaLuot | null>(luot.ketQua, null);
    if (!kq) throw new LoiGame("Lượt chơi đã đóng");
    return { ketQua: kq };
  }
  const deBai = docJson<MucDeBai[]>(luot.deBai, []);
  if (luot.viTri >= deBai.length)
    return { ketQua: await ketThucLuot(nguoi, luotId) };
  if (!luot.cauMoLuc) {
    await prisma.nnLuot.updateMany({
      where: {
        id: luotId,
        viTri: luot.viTri,
        cauMoLuc: null,
        trangThai: "DANG_CHOI",
      },
      data: { cauMoLuc: new Date(), giayThem: 0 },
    });
    luot = await layLuot(nguoi, luotId);
    if (luot.trangThai !== "DANG_CHOI" || !luot.cauMoLuc)
      throw new LoiGame("Lượt chơi vừa thay đổi, tải lại trang", "LECH");
  }
  const luat = await docMuc("luat");
  return { cau: trangThaiCau(luot, deBai, luat) };
}

/** Chấm một câu. `dapAn = null` là hết giờ. */
export async function traLoi(
  nguoi: NguoiChoi,
  luotId: string,
  viTri: number,
  dapAn: DapAnGui,
): Promise<PhanHoi> {
  const luot = await layLuot(nguoi, luotId);
  if (luot.trangThai !== "DANG_CHOI")
    throw new LoiGame("Lượt chơi đã kết thúc", "LECH");
  if (luot.viTri !== viTri || !luot.cauMoLuc)
    throw new LoiGame("Câu này đã được ghi nhận", "LECH");
  const deBai = docJson<MucDeBai[]>(luot.deBai, []);
  const muc = deBai[viTri];
  if (!muc) throw new LoiGame("Câu hỏi không còn trong ngân hàng", "LECH");
  // Đọc luật TRƯỚC giao dịch
  const luat = await docMuc("luat");
  if (muc.thuong)
    return traLoiThuong(nguoi, luot, viTri, muc, deBai, dapAn, luat);
  const c = cauCua(muc);
  if (!c) throw new LoiGame("Câu hỏi không còn trong ngân hàng", "LECH");

  const heSo = heSoLuot(luot, luat);
  const gioiHanMs = gioiHanCau(muc, luot.giayThem, luat);
  const daDungMs = Date.now() - luot.cauMoLuc.getTime();
  const hetGio = dapAn === null || daDungMs > gioiHanMs + DIEM.AN_HAN_MS;
  const n = muc.tt.length;

  let dung = false;
  let motPhan = 0;
  let luaChon: number | null = null;
  if (hetGio) {
    luaChon = c.t === "xep" || c.t === "ghep" ? null : -1;
  } else if (c.t === "chon" || c.t === "th") {
    const i = (dapAn as { chon?: unknown }).chon;
    if (typeof i !== "number" || !Number.isInteger(i) || i < 0 || i >= n)
      throw new LoiGame("Đáp án không hợp lệ");
    luaChon = muc.tt[i];
    dung = luaChon === 0;
  } else if (c.t === "ds") {
    const v = (dapAn as { dung?: unknown }).dung;
    if (typeof v !== "boolean") throw new LoiGame("Đáp án không hợp lệ");
    luaChon = v ? 1 : 0;
    dung = v === !!c.d;
  } else if (c.t === "xep") {
    const thuTu = (dapAn as { thuTu?: unknown }).thuTu;
    if (!laHoanVi(thuTu, n)) throw new LoiGame("Đáp án không hợp lệ");
    motPhan = thuTu.filter((d, k) => muc.tt[d] === k).length;
    dung = motPhan === n;
  } else {
    const cap = (dapAn as { cap?: unknown }).cap;
    if (!laHoanVi(cap, n)) throw new LoiGame("Đáp án không hợp lệ");
    motPhan = cap.filter((d, trai) => muc.tt[d] === trai).length;
    dung = motPhan === n;
  }

  const chuoi = dung ? luot.chuoi + 1 : 0;
  const chiTiet = {
    goc: dung ? luat.tram.dung : 0,
    tocDo: dung
      ? diemTocDoTheoLuat(luat, Math.min(daDungMs, gioiHanMs), gioiHanMs)
      : 0,
    chuoi: dung ? diemChuoiTheoLuat(luat, chuoi) : 0,
    motPhan:
      !dung && !hetGio && (c.t === "xep" || c.t === "ghep")
        ? motPhan * luat.tram.motPhan
        : 0,
    heSo,
  };
  const diem =
    (chiTiet.goc + chiTiet.tocDo + chiTiet.chuoi + chiTiet.motPhan) * heSo;
  const chuoiNhanh =
    dung && daDungMs < DIEM.TIA_CHOP_MS ? luot.chuoiNhanh + 1 : 0;

  await prisma.$transaction(async (tx) => {
    const kq = await tx.nnLuot.updateMany({
      where: { id: luotId, viTri, trangThai: "DANG_CHOI" },
      data: {
        viTri: viTri + 1,
        cauMoLuc: null,
        giayThem: 0,
        diem: { increment: diem },
        soDung: { increment: dung ? 1 : 0 },
        chuoi,
        chuoiNhanh,
        tiaChop: luot.tiaChop || chuoiNhanh >= 10,
      },
    });
    if (kq.count !== 1) throw new LoiGame("Câu này đã được ghi nhận", "LECH");
    await tx.nnTraLoi.create({
      data: {
        luotId,
        userId: nguoi.userId,
        cauId: c.id,
        luaChon,
        dung,
        motPhan,
        diem,
        thoiGianMs: Math.min(daDungMs, 3_600_000),
      },
    });
  }, GIAO_DICH);

  const cuoi = viTri + 1 >= deBai.length;
  const ketQua = cuoi ? await ketThucLuot(nguoi, luotId) : undefined;
  return {
    dung,
    hetGio,
    diem,
    chiTiet,
    motPhan,
    dapAnDung: dapAnHienThi(c, muc),
    giaiThich: c.g,
    nguon: NGUON[c.n] ?? c.n,
    tongDiem: luot.diem + diem,
    soDung: luot.soDung + (dung ? 1 : 0),
    chuoi,
    cuoi,
    ketQua,
  };
}

/**
 * Chấm câu thưởng cuối lượt: không thưởng tốc độ, không tính vào sao và chuỗi.
 * HOI_VIEN đúng được điểm câu hội viên; CHIA_SE luôn được điểm câu chia sẻ (theo
 * `luat.cauThuong`) và lưu câu trả lời để tổng hợp.
 */
async function traLoiThuong(
  nguoi: NguoiChoi,
  luot: NnLuot,
  viTri: number,
  muc: MucDeBai,
  deBai: MucDeBai[],
  dapAn: DapAnGui,
  luat: LuatChoi,
): Promise<PhanHoi> {
  const t = muc.thuong!;
  const gioiHanMs = gioiHanCau(muc, 0, luat);
  const daDungMs = Date.now() - luot.cauMoLuc!.getTime();
  const hetGio = dapAn === null || daDungMs > gioiHanMs + DIEM.AN_HAN_MS;
  let luaChon: number | null = -1;
  if (!hetGio) {
    const i = (dapAn as { chon?: unknown }).chon;
    if (
      typeof i !== "number" ||
      !Number.isInteger(i) ||
      i < 0 ||
      i >= t.phuongAn.length
    )
      throw new LoiGame("Đáp án không hợp lệ");
    luaChon = i;
  }
  const dung = !hetGio && (t.loai === "CHIA_SE" || luaChon === t.dung);
  const diem = dung
    ? t.loai === "HOI_VIEN"
      ? luat.cauThuong.diemHoiVien
      : luat.cauThuong.diemChiaSe
    : 0;

  await prisma.$transaction(async (tx) => {
    const kq = await tx.nnLuot.updateMany({
      where: { id: luot.id, viTri, trangThai: "DANG_CHOI" },
      data: {
        viTri: viTri + 1,
        cauMoLuc: null,
        giayThem: 0,
        diem: { increment: diem },
      },
    });
    if (kq.count !== 1) throw new LoiGame("Câu này đã được ghi nhận", "LECH");
    await tx.nnTraLoi.create({
      data: {
        luotId: luot.id,
        userId: nguoi.userId,
        cauId: muc.id,
        luaChon,
        dung,
        diem,
        thoiGianMs: Math.min(daDungMs, 3_600_000),
      },
    });
    if (t.loai === "CHIA_SE" && luaChon !== null && luaChon >= 0) {
      await tx.nnChiaSe.upsert({
        where: { userId_maCau: { userId: nguoi.userId, maCau: t.ma } },
        create: {
          userId: nguoi.userId,
          memberId: nguoi.memberId,
          maCau: t.ma,
          luaChon: t.phuongAn[luaChon],
        },
        update: { luaChon: t.phuongAn[luaChon], memberId: nguoi.memberId },
      });
    }
  }, GIAO_DICH);

  const chiaSe =
    t.loai === "CHIA_SE" ? await tiLeChiaSe(t.ma, t.phuongAn) : null;
  const cuoi = viTri + 1 >= deBai.length;
  return {
    dung,
    hetGio,
    diem,
    chiTiet: { goc: diem, tocDo: 0, chuoi: 0, motPhan: 0, heSo: 1 },
    motPhan: 0,
    dapAnDung: t.loai === "HOI_VIEN" ? { chon: t.dung } : {},
    giaiThich:
      t.loai === "HOI_VIEN"
        ? (t.giai ?? "")
        : hetGio
          ? "Hết giờ — lần sau chia sẻ với huynh đệ nhé."
          : chiaSe && chiaSe.soNguoi > 1
            ? `Cảm ơn bạn đã chia sẻ! ${chiaSe.phanTram[luaChon as number]}% huynh đệ đã trả lời cũng chọn giống bạn.`
            : "Cảm ơn bạn đã chia sẻ! Bạn là một trong những người đầu tiên trả lời câu này.",
    nguon:
      t.loai === "HOI_VIEN"
        ? "Hồ sơ hội viên trên ybacholon.vn"
        : "Câu chia sẻ — không có đúng sai",
    phanTram: chiaSe?.phanTram,
    soNguoi: chiaSe?.soNguoi,
    lienKet: t.lienKet,
    tongDiem: luot.diem + diem,
    soDung: luot.soDung,
    chuoi: luot.chuoi,
    cuoi,
    ketQua: cuoi ? await ketThucLuot(nguoi, luot.id) : undefined,
  };
}

/**
 * Quyền trợ giúp — mỗi loại một lần mỗi lượt. Loại nào Ban đang tắt thì máy chủ
 * từ chối (mã "TAT"), kể cả khi trình duyệt còn hiện nút.
 */
export async function dungTroGiup(
  nguoi: NguoiChoi,
  luotId: string,
  viTri: number,
  loai: TroGiup,
): Promise<KetQuaTroGiup> {
  const luot = await layLuot(nguoi, luotId);
  if (
    luot.trangThai !== "DANG_CHOI" ||
    luot.viTri !== viTri ||
    !luot.cauMoLuc
  ) {
    throw new LoiGame("Câu hỏi này đã đóng", "LECH");
  }
  if (loai !== "5050" && loai !== "HOI" && loai !== "GIO")
    throw new LoiGame("Quyền trợ giúp không hợp lệ");
  const daDung = docJson<TroGiup[]>(luot.troGiup, []);
  if (daDung.includes(loai))
    throw new LoiGame("Lượt này đã dùng quyền trợ giúp đó rồi");

  const deBai = docJson<MucDeBai[]>(luot.deBai, []);
  const muc = deBai[viTri];
  if (!muc) throw new LoiGame("Câu hỏi này đã đóng", "LECH");
  if (muc.thuong)
    throw new LoiGame("Câu thưởng không dùng được trợ giúp — tự tin lên!");
  if (laLuotDauTri(luot.tramMa))
    throw new LoiGame("Đấu trí sự kiện thi đấu công bằng — không có trợ giúp.");
  // Công tắc xét sau các luật cố định để người chơi nhận đúng lý do bị từ chối
  const [tinhNang, luat] = await Promise.all([docTinhNang(), docMuc("luat")]);
  if (!tinhNang[CONG_TAC_TRO_GIUP[loai]])
    throw new LoiGame(
      `Quyền trợ giúp ${TEN_TRO_GIUP[loai]} đang tạm tắt.`,
      "TAT",
    );
  const c = cauCua(muc)!;
  let kq: KetQuaTroGiup = { loai };
  let giayThem = luot.giayThem;

  if (loai === "5050") {
    if (c.t !== "chon" && c.t !== "th")
      throw new LoiGame("50 : 50 chỉ dùng cho câu có 4 phương án");
    const sai = day(muc.tt.length).filter((d) => muc.tt[d] !== 0);
    kq.an = xaoTron(sai)
      .slice(0, 2)
      .sort((a, b) => a - b);
  } else if (loai === "GIO") {
    giayThem += luat.tram.giayThem;
  } else {
    kq = { ...kq, ...(await hoiHuynhDe(nguoi.userId, c, muc)) };
  }

  if (!kq.hoanLai) {
    const cn = await prisma.nnLuot.updateMany({
      where: { id: luotId, viTri, trangThai: "DANG_CHOI" },
      data: { troGiup: JSON.stringify([...daDung, loai]), giayThem },
    });
    if (cn.count !== 1) throw new LoiGame("Câu hỏi này đã đóng", "LECH");
  }
  // Giới hạn giờ theo giây đã chụp trong đề bài (không tính lại từ loại câu)
  kq.gioiHanMs = gioiHanCau(muc, giayThem, luat);
  kq.conLaiMs = Math.max(
    0,
    kq.gioiHanMs - (Date.now() - luot.cauMoLuc.getTime()),
  );
  return kq;
}

/**
 * "Hỏi Huynh đệ": hiện tỉ lệ các hội viên khác đã chọn — số liệu THẬT, không
 * bịa. Chưa đủ người trả lời thì đổi sang gợi ý thật (loại một phương án sai,
 * lộ một vị trí / một cặp); câu Đúng/Sai không có gợi ý nào không lộ đáp án nên
 * trả lại quyền trợ giúp.
 */
async function hoiHuynhDe(
  userId: string,
  c: CauHoi,
  muc: MucDeBai,
): Promise<Partial<KetQuaTroGiup>> {
  if (c.t === "xep") {
    const k = ngauNhien(c.a!.length);
    return { goiY: `“${c.a![k]}” đứng ở vị trí thứ ${k + 1}.` };
  }
  if (c.t === "ghep") {
    const k = ngauNhien(c.p!.length);
    return { goiY: `Một cặp đúng: ${c.p![k][0]} — ${c.p![k][1]}` };
  }
  const nhom = await prisma.nnTraLoi.groupBy({
    by: ["luaChon"],
    where: { cauId: c.id, userId: { not: userId }, luaChon: { gte: 0 } },
    _count: { _all: true },
  });
  const tong = nhom.reduce((s, x) => s + x._count._all, 0);
  const dem = (goc: number) =>
    nhom.find((x) => x.luaChon === goc)?._count._all ?? 0;
  const pt = (x: number) => Math.round((100 * x) / tong);
  if (tong >= TOI_THIEU_HOI) {
    if (c.t === "ds")
      return { phanTram: [pt(dem(1)), pt(dem(0))], soNguoi: tong };
    return { phanTram: muc.tt.map((goc) => pt(dem(goc))), soNguoi: tong };
  }
  if (c.t === "ds") {
    return {
      hoanLai: true,
      goiY: "Chưa đủ huynh đệ trả lời câu này nên chưa có số liệu. Quyền trợ giúp được giữ lại cho câu sau.",
    };
  }
  const sai = day(muc.tt.length).filter((d) => muc.tt[d] !== 0);
  return {
    an: [sai[ngauNhien(sai.length)]],
    goiY: "Chưa đủ huynh đệ trả lời câu này – tặng bạn một gợi ý: loại bớt một phương án sai.",
  };
}

// ─── kết thúc lượt ────────────────────────────────────────────────────

/**
 * Chốt lượt (hết câu hoặc bỏ ngang). Câu chưa trả lời tính là sai. Gọi lại
 * nhiều lần vẫn an toàn: lượt đã chốt thì trả kết quả đã lưu.
 */
export async function ketThucLuot(
  nguoi: NguoiChoi,
  luotId: string,
): Promise<KetQuaLuot> {
  // Đọc cấu hình TRƯỚC giao dịch — SQLite một kết nối, hỏi trong giao dịch là kẹt
  const [mua, thongSo, luat, tinhNang, theSua] = await Promise.all([
    muaHienTai(),
    docMuc("thongSo"),
    docMuc("luat"),
    docTinhNang(),
    docTheCoHoiSua(),
  ]);
  const moiRutThe = coTheDeRut(tinhNang, theSua);
  return prisma.$transaction(async (tx) => {
    const luot = await tx.nnLuot.findUnique({ where: { id: luotId } });
    if (!luot || luot.userId !== nguoi.userId)
      throw new LoiGame("Không tìm thấy lượt chơi", "KHONG_THAY");
    if (luot.trangThai !== "DANG_CHOI") {
      const cu = docJson<KetQuaLuot | null>(luot.ketQua, null);
      if (cu) return cu;
      throw new LoiGame("Lượt chơi đã đóng", "LECH");
    }
    const chot = await tx.nnLuot.updateMany({
      where: { id: luotId, trangThai: "DANG_CHOI" },
      data: { trangThai: "XONG", xongLuc: new Date(), cauMoLuc: null },
    });
    if (chot.count !== 1) throw new LoiGame("Lượt chơi đã đóng", "LECH");

    const muaDangTinh = luot.muaId === mua.id && mua.tinhDiem;
    const ketQua =
      luot.tramMa === NGAY
        ? await chotThuThachNgay(tx, luot, muaDangTinh, luat)
        : laLuotDauTri(luot.tramMa)
          ? await chotDauTri(tx, luot, muaDangTinh, luat)
          : await chotTram(
              tx,
              luot,
              muaDangTinh,
              thongSo.luotTinhDiemToiDa,
              luat,
              moiRutThe,
            );
    await tx.nnLuot.update({
      where: { id: luotId },
      data: { sao: ketQua.sao, ketQua: JSON.stringify(ketQua) },
    });
    return ketQua;
  }, GIAO_DICH);
}

/** Danh hiệu lên bậc nhờ điểm mới (không xét Ngọn lửa Chợ Lớn ở đây). */
function xetLenHang(
  truoc: number,
  sau: number,
  luat: LuatChoi,
): KetQuaLuot["lenHang"] {
  const a = danhHieuTheoLuat(luat, truoc, false).hienTai;
  const b = danhHieuTheoLuat(luat, sau, false).hienTai;
  if (b.bac <= a.bac) return null;
  return { ten: b.ten, y: b.y };
}

/** Kết quả câu thưởng của lượt (nếu có). */
async function ketQuaThuong(
  tx: Tx,
  luot: NnLuot,
  deBai: MucDeBai[],
): Promise<KetQuaLuot["thuong"]> {
  const muc = deBai.find((m) => m.thuong);
  if (!muc?.thuong) return null;
  const tl = await tx.nnTraLoi.findUnique({
    where: { luotId_cauId: { luotId: luot.id, cauId: muc.id } },
  });
  if (!tl) return null;
  return { loai: muc.thuong.loai, dung: tl.dung, diem: tl.diem };
}

async function chotTram(
  tx: Tx,
  luot: NnLuot,
  muaDangTinh: boolean,
  luotToiDa: number,
  luat: LuatChoi,
  moiRutThe: boolean,
): Promise<KetQuaLuot> {
  const tram = TRAM_THEO_MA[luot.tramMa];
  const deBai = docJson<MucDeBai[]>(luot.deBai, []);
  const tong = soCauChinh(deBai);
  const diemTruoc = muaDangTinh
    ? (await tongSoCai(tx, luot.userId, luot.muaId)).diem
    : 0;
  const sao = tinhSaoTheoLuat(luat, luot.soDung, tram.thuThach, tong);
  const qua = sao >= 1;
  const khoa = khoaTienDo(luot.userId, luot.muaId, luot.tramMa);
  const td = await tx.nnTienDo.upsert({
    where: khoa,
    create: { userId: luot.userId, muaId: luot.muaId, tramMa: luot.tramMa },
    update: {},
  });
  const laLanDauQua = qua && !td.daQua;
  const tinhDiemLuot = muaDangTinh && luot.cheDo === "TINH_DIEM";

  let diemGhiNhan = 0;
  let kyLucMoi = false;
  const vonCong = vonRong();
  const vonTot: Von = {
    ...vonRong(),
    ...docJson<Partial<Von>>(td.vonTot, {}),
  };
  if (tinhDiemLuot) {
    if (luot.diem > td.diemTot) {
      diemGhiNhan = luot.diem - td.diemTot;
      kyLucMoi = true;
    }
    // Vốn của lượt: +1 mỗi câu đúng theo vốn gắn với câu, qua trạm cộng vốn chính của chặng
    const vonLuot = vonRong();
    const dung = await tx.nnTraLoi.findMany({
      where: { luotId: luot.id, dung: true },
      select: { cauId: true },
    });
    for (const t of dung) {
      const c = CAU_THEO_ID[t.cauId];
      if (c) vonLuot[c.v] += 1;
      else if (t.cauId.startsWith(TIEN_TO_THUONG)) vonLuot.XH += 1;
    }
    if (qua) {
      const chinh = CHANG_THEO_SO[tram.changSo].vonChinh;
      if (chinh === "CAN_BANG")
        for (const k of MA_VON) vonLuot[k] += luat.tram.vonCanBang;
      else vonLuot[chinh] += luat.tram.vonChinh;
    }
    // Chỉ cộng phần vốn vượt mức cao nhất từng ghi ở trạm — chơi lại không "cày" vốn
    for (const k of MA_VON) {
      vonCong[k] = Math.max(0, vonLuot[k] - vonTot[k]);
      vonTot[k] = Math.max(vonTot[k], vonLuot[k]);
    }
    await ghiSoCai(tx, {
      userId: luot.userId,
      muaId: luot.muaId,
      loai: "TRAM",
      nguon: `tram:${tram.ma}`,
      diem: diemGhiNhan,
      von: vonCong,
      ghiChu: `Trạm ${tram.ma} · ${luot.soDung}/${tong} câu đúng · ${luot.diem} điểm`,
    });
  }

  const tdMoi = await tx.nnTienDo.update({
    where: khoa,
    data: {
      sao: Math.max(td.sao, sao),
      daQua: td.daQua || qua,
      quaLuc: laLanDauQua ? new Date() : td.quaLuc,
      ...(tinhDiemLuot
        ? {
            diemTot: Math.max(td.diemTot, luot.diem),
            soDungTot: Math.max(td.soDungTot, luot.soDung),
            vonTot: JSON.stringify(vonTot),
          }
        : {}),
    },
  });

  const huyHieuMoi: HuyHieuMoi[] = [];
  if (muaDangTinh) {
    const xet: string[] = [];
    if (qua && tram.thuThach) xet.push(HUY_HIEU_CHANG[tram.changMa]);
    if (
      luot.soDung === tong &&
      tong === SO_CAU_MOI_TRAM &&
      docJson<string[]>(luot.troGiup, []).length === 0
    ) {
      xet.push("HOAN_HAO");
    }
    if (luot.tiaChop) xet.push("TIA_CHOP");
    if (laLanDauQua) {
      const soQua = await tx.nnTienDo.count({
        where: { userId: luot.userId, muaId: luot.muaId, daQua: true },
      });
      if (soQua >= TRAM.length) xet.push("BO_SUU_TAP");
    }
    if (await daDungHetCauXep(tx, luot)) xet.push("NHA_SU_HOC");
    huyHieuMoi.push(
      ...(await traoHuyHieu(tx, luot.userId, luot.muaId, xet, luat)),
    );
    if (MA_VON.some((k) => vonCong[k] > 0))
      huyHieuMoi.push(...(await xetCanBang(tx, luot.userId, luot.muaId, luat)));
  }

  const tiep = qua ? TRAM[tram.thuTu + 1] : undefined;
  const diemSau = muaDangTinh
    ? (await tongSoCai(tx, luot.userId, luot.muaId)).diem
    : 0;
  return {
    luotId: luot.id,
    cheDo: luot.cheDo as CheDo,
    tramMa: tram.ma,
    soDung: luot.soDung,
    tong,
    sao,
    daQua: qua,
    laLanDauQua,
    diem: luot.diem,
    diemGhiNhan,
    kyLucMoi,
    von: vonCong,
    theSuuTam: laLanDauQua ? tram.the : null,
    // Ban tắt Thẻ Cơ hội (hoặc tắt hết thẻ) thì qua trạm không mời rút thẻ
    coTheCoHoi: moiRutThe && tdMoi.daQua && !tdMoi.theCoHoi,
    huyHieuMoi,
    tramTiep: tiep ? { ma: tiep.ma, ten: tiep.ten } : null,
    luotTinhDiemConLai: muaDangTinh
      ? Math.max(0, luotToiDa - tdMoi.soLuotTinhDiem)
      : 0,
    tinhDiem: tinhDiemLuot,
    choiThu: luot.muaId === CHOI_THU,
    thuong: await ketQuaThuong(tx, luot, deBai),
    lenHang: muaDangTinh ? xetLenHang(diemTruoc, diemSau, luat) : null,
  };
}

/** Đã từng trả lời đúng toàn bộ câu sắp xếp trong mùa chưa (huy hiệu Nhà sử học). */
async function daDungHetCauXep(tx: Tx, luot: NnLuot): Promise<boolean> {
  const coXepDung = await tx.nnTraLoi.count({
    where: { luotId: luot.id, dung: true, cauId: { in: CAU_XEP } },
  });
  if (!coXepDung) return false;
  const luotIds = (
    await tx.nnLuot.findMany({
      where: { userId: luot.userId, muaId: luot.muaId },
      select: { id: true },
    })
  ).map((l) => l.id);
  const daDung = await tx.nnTraLoi.findMany({
    where: { luotId: { in: luotIds }, dung: true, cauId: { in: CAU_XEP } },
    select: { cauId: true },
    distinct: ["cauId"],
  });
  return daDung.length >= CAU_XEP.length;
}

async function chotThuThachNgay(
  tx: Tx,
  luot: NnLuot,
  muaDangTinh: boolean,
  luat: LuatChoi,
): Promise<KetQuaLuot> {
  const deBai = docJson<MucDeBai[]>(luot.deBai, []);
  const tong = soCauChinh(deBai);
  const diemTruoc = muaDangTinh
    ? (await tongSoCai(tx, luot.userId, luot.muaId)).diem
    : 0;
  const cacNgay = new Set(
    (
      await tx.nnLuot.findMany({
        where: { userId: luot.userId, ngay: { not: null } },
        select: { ngay: true },
        orderBy: { ngay: "desc" },
        take: 400,
      })
    ).map((l) => l.ngay as string),
  );
  let chuoiNgay = 0;
  let n = luot.ngay as string;
  while (cacNgay.has(n)) {
    chuoiNgay++;
    n = congNgay(n, -1);
  }
  const thuong = thuongChuoiNgayTheoLuat(luat, chuoiNgay);
  const huyHieuMoi: HuyHieuMoi[] = [];
  if (muaDangTinh) {
    await ghiSoCai(tx, {
      userId: luot.userId,
      muaId: luot.muaId,
      loai: "THU_THACH_NGAY",
      nguon: `ngay:${luot.ngay}`,
      diem: luot.diem + thuong,
      ghiChu: `Thử thách ${luot.ngay} · ${luot.soDung}/${tong} câu · chuỗi ${chuoiNgay} ngày`,
    });
    if (chuoiNgay >= luat.thuThachNgay.ngayChuyenCan)
      huyHieuMoi.push(
        ...(await traoHuyHieu(
          tx,
          luot.userId,
          luot.muaId,
          ["CHUYEN_CAN"],
          luat,
        )),
      );
  }
  const diemSau = muaDangTinh
    ? (await tongSoCai(tx, luot.userId, luot.muaId)).diem
    : 0;
  return {
    luotId: luot.id,
    cheDo: "THU_THACH_NGAY",
    tramMa: NGAY,
    soDung: luot.soDung,
    tong,
    sao: 0,
    daQua: true,
    laLanDauQua: false,
    diem: luot.diem,
    diemGhiNhan: muaDangTinh ? luot.diem + thuong : 0,
    kyLucMoi: false,
    von: vonRong(),
    theSuuTam: null,
    coTheCoHoi: false,
    huyHieuMoi,
    thuongChuoiNgay: thuong,
    chuoiNgay,
    tramTiep: null,
    luotTinhDiemConLai: 0,
    tinhDiem: muaDangTinh,
    choiThu: luot.muaId === CHOI_THU,
    thuong: await ketQuaThuong(tx, luot, deBai),
    lenHang: muaDangTinh ? xetLenHang(diemTruoc, diemSau, luat) : null,
  };
}

/**
 * Chốt lượt Đấu trí sự kiện: điểm lượt cộng thẳng vào Điểm Vươn tầm, mỗi câu
 * đúng cộng Vốn tri thức, có mặt tại sự kiện cộng Vốn xã hội (theo
 * `luat.dauTri`). Thứ hạng trong phiên tính ở trang bảng xếp hạng của phiên.
 */
async function chotDauTri(
  tx: Tx,
  luot: NnLuot,
  muaDangTinh: boolean,
  luat: LuatChoi,
): Promise<KetQuaLuot> {
  const deBai = docJson<MucDeBai[]>(luot.deBai, []);
  const tong = soCauChinh(deBai);
  const dauTriId = luot.tramMa.slice(TIEN_TO_DAU.length);
  const diemTruoc = muaDangTinh
    ? (await tongSoCai(tx, luot.userId, luot.muaId)).diem
    : 0;
  const von = vonRong();
  if (muaDangTinh) {
    von.TT = luot.soDung * luat.dauTri.vonTTMoiCau;
    von.XH = luat.dauTri.vonXH;
    await ghiSoCai(tx, {
      userId: luot.userId,
      muaId: luot.muaId,
      loai: "DAU_TRI",
      nguon: `dau-tri:${dauTriId}`,
      diem: luot.diem,
      von,
      ghiChu: `Đấu trí sự kiện · ${luot.soDung}/${tong} câu · ${luot.diem} điểm`,
    });
  }
  const huyHieuMoi = muaDangTinh
    ? await xetCanBang(tx, luot.userId, luot.muaId, luat)
    : [];
  const diemSau = muaDangTinh
    ? (await tongSoCai(tx, luot.userId, luot.muaId)).diem
    : 0;
  return {
    luotId: luot.id,
    cheDo: "THU_THACH_NGAY",
    tramMa: luot.tramMa,
    soDung: luot.soDung,
    tong,
    sao: 0,
    daQua: true,
    laLanDauQua: false,
    diem: luot.diem,
    diemGhiNhan: muaDangTinh ? luot.diem : 0,
    kyLucMoi: false,
    von,
    theSuuTam: null,
    coTheCoHoi: false,
    huyHieuMoi,
    tramTiep: null,
    luotTinhDiemConLai: 0,
    tinhDiem: muaDangTinh,
    choiThu: luot.muaId === CHOI_THU,
    thuong: null,
    lenHang: muaDangTinh ? xetLenHang(diemTruoc, diemSau, luat) : null,
    dauTriId,
  };
}

/**
 * Vào một phiên Đấu trí sự kiện: mỗi người một lượt duy nhất trên cùng bộ câu
 * (thứ tự câu chung, phương án xáo riêng từng người). Lượt đang dở thì mở tiếp
 * (kể cả khi Ban vừa tắt Đấu trí); tắt thì không vào lượt mới.
 */
export async function batDauDauTri(
  nguoi: NguoiChoi,
  dauTriId: string,
): Promise<{ luotId: string; daXong: boolean; tiepTuc: boolean }> {
  const phien = await prisma.nnDauTri.findUnique({ where: { id: dauTriId } });
  if (!phien) throw new LoiGame("Không tìm thấy phiên đấu trí");
  const tramMa = `${TIEN_TO_DAU}${phien.id}`;
  const co = await prisma.nnLuot.findFirst({
    where: { userId: nguoi.userId, tramMa },
    orderBy: { createdAt: "desc" },
  });
  // `tiepTuc` như thử thách ngày: lượt đã có thì mở thẳng, không đếm ngược
  if (co)
    return {
      luotId: co.id,
      daXong: co.trangThai !== "DANG_CHOI",
      tiepTuc: true,
    };
  if (!(await docTinhNang()).dauTri)
    throw new LoiGame("Đấu trí sự kiện đang tạm nghỉ.", "TAT");
  if (phien.trangThai !== "DANG_MO")
    throw new LoiGame("Phiên đấu trí chưa mở hoặc đã kết thúc.", "CHUA_MO");
  const mua = await muaHienTai();
  const deBai = xaoLaiPhuongAn(
    docJson<MucDeBai[]>(phien.deBai, []),
    phien.giayMoiCau,
  );
  if (!deBai.length) throw new LoiGame("Phiên này chưa có câu hỏi");
  const luot = await prisma.nnLuot.create({
    data: {
      userId: nguoi.userId,
      muaId: mua.id,
      tramMa,
      cheDo: "THU_THACH_NGAY",
      deBai: JSON.stringify(deBai),
    },
  });
  return { luotId: luot.id, daXong: false, tiepTuc: false };
}

// ─── Thẻ Cơ hội ───────────────────────────────────────────────────────

/**
 * Nội dung thẻ theo mã: bản Ban Điều hành sửa (kể cả thẻ đã tắt — thẻ đã rút
 * vẫn phải chơi nốt); mã không còn trong bản sửa thì lấy JSON gốc để lịch sử
 * cũ vẫn chạy. Lựa chọn khôn ngoan luôn đứng đầu.
 */
function theTheoMa(ma: string, sua: TheCoHoiSua[]): TheCoHoi | null {
  const s = sua.find((t) => t.ma === ma);
  if (s) return { ma: s.ma, ten: s.ten, tinhHuong: s.tinhHuong, lua: s.lua };
  return Object.prototype.hasOwnProperty.call(THE_THEO_MA, ma)
    ? THE_THEO_MA[ma]
    : null;
}

async function tienDoCuaLuot(nguoi: NguoiChoi, luotId: string) {
  const luot = await layLuot(nguoi, luotId);
  if (luot.tramMa === NGAY || luot.trangThai !== "XONG")
    throw new LoiGame("Chưa thể rút Thẻ Cơ hội ở lượt này");
  const td = await prisma.nnTienDo.findUnique({
    where: khoaTienDo(luot.userId, luot.muaId, luot.tramMa),
  });
  if (!td?.daQua) throw new LoiGame("Vượt trạm mới được rút Thẻ Cơ hội");
  return { luot, td };
}

/**
 * Rút Thẻ Cơ hội — mỗi trạm một lần mỗi mùa, chỉ trong các thẻ đang bật, ưu
 * tiên thẻ chưa gặp. Ban tắt tính năng thì không rút thẻ MỚI (mã "TAT"); thẻ đã
 * rút mà chưa chọn vẫn mở lại được để chọn nốt.
 */
export async function rutTheCoHoi(
  nguoi: NguoiChoi,
  luotId: string,
): Promise<TheCoHoiHienThi> {
  const { luot, td } = await tienDoCuaLuot(nguoi, luotId);
  if (td.theCoHoi && td.theCoHoiChon !== null)
    throw new LoiGame("Bạn đã dùng Thẻ Cơ hội của trạm này", "DA_RUT");
  const [tinhNang, theSua] = await Promise.all([
    docTinhNang(),
    docTheCoHoiSua(),
  ]);
  let ma = td.theCoHoi;
  // Thẻ đã rút mà nay không còn nội dung (Ban bỏ thẻ tự thêm, chưa ai chọn):
  // trả lượt rút lại, không để nút "Mở Thẻ Cơ hội đang chờ" báo lỗi mãi
  if (ma && !theTheoMa(ma, theSua.ds)) {
    await prisma.nnTienDo.updateMany({
      where: { id: td.id, theCoHoi: ma, theCoHoiChon: null },
      data: { theCoHoi: null },
    });
    ma = null;
  }
  if (!ma) {
    if (!tinhNang.theCoHoi)
      throw new LoiGame(
        "Thẻ Cơ hội đang tạm nghỉ — vượt trạm vẫn được sao và mở trạm tiếp.",
        "TAT",
      );
    const dangBat = theSua.ds.filter((t) => t.bat);
    if (!dangBat.length)
      throw new LoiGame("Chưa có Thẻ Cơ hội nào đang mở.", "TAT");
    const daGap = new Set(
      (
        await prisma.nnTienDo.findMany({
          where: {
            userId: luot.userId,
            muaId: luot.muaId,
            theCoHoi: { not: null },
          },
          select: { theCoHoi: true },
        })
      ).map((x) => x.theCoHoi as string),
    );
    const chuaGap = dangBat.filter((t) => !daGap.has(t.ma));
    const kho = chuaGap.length ? chuaGap : dangBat;
    await prisma.nnTienDo.updateMany({
      where: { id: td.id, theCoHoi: null },
      data: { theCoHoi: kho[ngauNhien(kho.length)].ma },
    });
    ma =
      (await prisma.nnTienDo.findUnique({ where: { id: td.id } }))?.theCoHoi ??
      null;
    if (!ma) throw new LoiGame("Chưa rút được thẻ, thử lại");
  }
  const the = theTheoMa(ma, theSua.ds);
  if (!the) throw new LoiGame("Thẻ Cơ hội này không còn", "KHONG_THAY");
  const tt = xaoCoHat(the.lua.length, td.id + the.ma);
  return {
    luotId,
    ma: the.ma,
    ten: the.ten,
    tinhHuong: the.tinhHuong,
    lua: tt.map((i) => the.lua[i].chon),
  };
}

export async function chonTheCoHoi(
  nguoi: NguoiChoi,
  luotId: string,
  luaHienThi: number,
): Promise<KetQuaTheCoHoi> {
  const { luot, td } = await tienDoCuaLuot(nguoi, luotId);
  if (!td.theCoHoi) throw new LoiGame("Chưa rút Thẻ Cơ hội");
  if (td.theCoHoiChon !== null) throw new LoiGame("Bạn đã chọn rồi", "DA_RUT");
  const [theSua, mua, luat] = await Promise.all([
    docTheCoHoiSua(),
    muaHienTai(),
    docMuc("luat"),
  ]);
  const the = theTheoMa(td.theCoHoi, theSua.ds);
  if (!the) throw new LoiGame("Thẻ Cơ hội này không còn", "KHONG_THAY");
  const tt = xaoCoHat(the.lua.length, td.id + the.ma);
  if (
    !Number.isInteger(luaHienThi) ||
    luaHienThi < 0 ||
    luaHienThi >= tt.length
  )
    throw new LoiGame("Lựa chọn không hợp lệ");
  const goc = tt[luaHienThi];
  const lua = the.lua[goc];
  const ghiNhan = luot.muaId === mua.id && mua.tinhDiem;

  const huyHieuMoi = await prisma.$transaction(async (tx) => {
    const cn = await tx.nnTienDo.updateMany({
      where: { id: td.id, theCoHoiChon: null },
      data: { theCoHoiChon: goc },
    });
    if (cn.count !== 1) throw new LoiGame("Bạn đã chọn rồi", "DA_RUT");
    if (!ghiNhan) return [];
    await ghiSoCai(tx, {
      userId: luot.userId,
      muaId: luot.muaId,
      loai: "THE_CO_HOI",
      nguon: `the:${the.ma}:${luot.tramMa}`,
      von: lua.von,
      ghiChu: the.ten,
    });
    return xetCanBang(tx, luot.userId, luot.muaId, luat);
  }, GIAO_DICH);
  return {
    von: lua.von,
    ghiNhan,
    giai: lua.giai,
    chon: lua.chon,
    khonNgoan: goc === 0,
    huyHieuMoi,
  };
}
