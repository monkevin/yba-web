/**
 * Lá bài mỗi ngày — CHỈ MÁY CHỦ. Kiểu, cấu hình và hàm thuần ở `la-bai-luat.ts`.
 *
 * Lưu trữ (không đổi schema): mỗi lần lật ghi ĐÚNG MỘT dòng `NnSoCai`
 * `loai: "LA_BAI"`, `nguon: "labai:<yyyy-mm-dd>"` — kể cả lá 0 điểm, nên ghi
 * thẳng bằng `tx.nnSoCai.create` (không qua `ghiSoCai`, hàm đó bỏ dòng 0 điểm).
 * `ghiChu` là JSON ảnh chụp kết quả (mã nội dung, quà, điểm, chuỗi) — sửa nội
 * dung sau này không làm mất lịch sử quà. Nội dung chữ tra lại theo mã.
 *
 * Quà: "đã trúng" = dòng sổ cái có `maQua`; "đã trao" = `NnTraoQua` với
 * `loai = maTraoQuaLaBai(ngay)`, chỉ tạo khi Ban bấm "Ghi đã trao". Quà chỉ rơi
 * khi mùa giải chính thức đang diễn ra.
 */
import { prisma } from "@/lib/prisma";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { docCauHinhLaBai, docTinhNang } from "./cai-dat";
import { chuanMaMuc } from "./cai-dat/chuan";
import type { NguoiChoi } from "./kieu";
import {
  CAC_LOAI_LA,
  chonKetQua,
  chuanDanhNgon,
  chuanLoiNhan,
  maTraoQuaLaBai,
  TEN_LOAI_LA,
  thuongChuoiLaBai,
  trongKhoangNgay,
  type CauHinhLaBai,
  type DanhNgon,
  type KetQuaLaBai,
  type LaBaiHomNay,
  type LoaiLa,
  type LoiNhan,
  type QuaLaBai,
} from "./la-bai-luat";
import { THU_THACH_NGAY } from "./luat";
import { CHOI_THU, muaHienTai, type MuaHienTai } from "./mua";
import danhNgonJson from "./noi-dung/la-bai/danh-ngon.json";
import loiNhanJson from "./noi-dung/la-bai/loi-nhan.json";
import { docJson, GIAO_DICH, LoiGame, type Tx } from "./so-cai";
import { congNgay, ngayThuThach } from "./thoi-gian";

export const LOAI_SO_CAI_LA_BAI = "LA_BAI";
const TIEN_TO_NGUON = "labai:";
/** Đoạn JSON có trong ghiChu của mọi lá quà (mã quà chỉ A-Z0-9 nên không dính ký tự đại diện LIKE). */
const DAU_MA_QUA = '"maQua":"';

const nguonNgay = (ngay: string) => `${TIEN_TO_NGUON}${ngay}`;
const ngayCuaNguon = (nguon: string) => nguon.slice(TIEN_TO_NGUON.length);

/** Ngày của lá bài: sang ngày mới lúc 6:00 sáng giờ Việt Nam (giống Thử thách). */
export const ngayLaBai = (d: Date = new Date()) =>
  ngayThuThach(d, THU_THACH_NGAY.GIO_SANG_NGAY);

/** Bộ danh ngôn / lời nhắn gốc (đã làm sạch; `bat` mặc định true). */
export const DANH_NGON_GOC: DanhNgon[] = chuanDanhNgon(danhNgonJson.danhNgon);
export const LOI_NHAN_GOC: LoiNhan[] = chuanLoiNhan(loiNhanJson.loiNhan);
/** Nhóm chủ đề danh ngôn — mã làm sạch cùng cách với `chuanDanhNgon` (TAM_NHIN → TAMNHIN). */
export const NHOM_DANH_NGON: { ma: string; ten: string }[] =
  danhNgonJson.nhom.map((n) => ({ ma: chuanMaMuc(n.ma, 20), ten: n.ten }));

/** Danh ngôn / lời nhắn đang hiệu lực: bản Ban đã sửa, chưa sửa thì bộ gốc. */
export function noiDungHieuLuc(c: CauHinhLaBai): {
  danhNgon: DanhNgon[];
  loiNhan: LoiNhan[];
} {
  return {
    danhNgon: c.danhNgon ?? DANH_NGON_GOC,
    loiNhan: c.loiNhan ?? LOI_NHAN_GOC,
  };
}

// ─── Ảnh chụp kết quả trong ghiChu ────────────────────────────────────

type AnhChup = {
  v: 1;
  viTri: number;
  soLa: number;
  loai: LoaiLa;
  ma: string | null;
  maQua?: string;
  qua?: { ma: string; ten: string; nhaDongHanh: string };
  diem: number;
  diemChuoi: number;
  chuoiNgay: number;
};

const soNguyen = (x: unknown) =>
  typeof x === "number" && Number.isFinite(x) ? Math.round(x) : 0;

function docAnhChup(ghiChu: string | null | undefined): AnhChup | null {
  const o = docJson<Record<string, unknown> | null>(ghiChu, null);
  if (!o || typeof o !== "object") return null;
  const loai = o.loai as LoaiLa;
  if (!Object.prototype.hasOwnProperty.call(TEN_LOAI_LA, loai)) return null;
  const q = o.qua as Record<string, unknown> | undefined;
  return {
    v: 1,
    viTri: soNguyen(o.viTri),
    soLa: soNguyen(o.soLa),
    loai,
    ma: typeof o.ma === "string" ? o.ma : null,
    ...(typeof o.maQua === "string" ? { maQua: o.maQua } : {}),
    ...(q && typeof q === "object"
      ? {
          qua: {
            ma: String(q.ma ?? ""),
            ten: String(q.ten ?? ""),
            nhaDongHanh: String(q.nhaDongHanh ?? ""),
          },
        }
      : {}),
    diem: soNguyen(o.diem),
    diemChuoi: soNguyen(o.diemChuoi),
    chuoiNgay: soNguyen(o.chuoiNgay),
  };
}

type DongLaBai = {
  muaId: string;
  nguon: string;
  diem: number;
  ghiChu: string | null;
};

type BoTra = {
  danhNgon: (ma: string) => DanhNgon | undefined;
  loiNhan: (ma: string) => LoiNhan | undefined;
  qua: (ma: string) => QuaLaBai | undefined;
};

/** Tra nội dung theo mã: bản đang hiệu lực trước, không có thì bộ gốc. */
function taoBoTra(c: CauHinhLaBai): BoTra {
  const { danhNgon, loiNhan } = noiDungHieuLuc(c);
  const dn = new Map([...DANH_NGON_GOC, ...danhNgon].map((d) => [d.ma, d]));
  const ln = new Map([...LOI_NHAN_GOC, ...loiNhan].map((l) => [l.ma, l]));
  const qua = new Map(c.dsQua.map((q) => [q.ma, q]));
  return {
    danhNgon: (ma) => dn.get(ma),
    loiNhan: (ma) => ln.get(ma),
    qua: (ma) => qua.get(ma),
  };
}

function dungKetQua(
  row: DongLaBai,
  tra: BoTra,
  daTrao: boolean,
): KetQuaLaBai | null {
  const s = docAnhChup(row.ghiChu);
  if (!s) return null;
  const kq: KetQuaLaBai = {
    ngay: ngayCuaNguon(row.nguon),
    viTri: s.viTri,
    soLa: s.soLa,
    loai: s.loai,
    diem: s.diem,
    diemChuoi: s.diemChuoi,
    chuoiNgay: s.chuoiNgay,
    // Mùa đã kết thúc: sổ cái ghi 0 dù lá có điểm
    ghiNhan: row.diem > 0 || s.diem + s.diemChuoi === 0,
    choiThu: row.muaId === CHOI_THU,
  };
  if (s.loai === "DANH_NGON" && s.ma) {
    const d = tra.danhNgon(s.ma);
    if (d)
      kq.danhNgon = {
        ma: d.ma,
        noiDung: d.noiDung,
        tacGia: d.tacGia,
        moTaTacGia: d.moTaTacGia,
        nguyenVan: d.nguyenVan,
        nguon: d.nguon,
        yNghia: d.yNghia,
      };
  }
  if (s.loai === "LOI_NHAN" && s.ma) {
    const l = tra.loiNhan(s.ma);
    if (l)
      kq.loiNhan = {
        ma: l.ma,
        noiDung: l.noiDung,
        goiY: l.goiY,
        nguoiKy: l.nguoiKy,
      };
  }
  if (s.loai === "QUA" && s.qua)
    kq.qua = {
      ma: s.qua.ma,
      ten: s.qua.ten,
      nhaDongHanh: s.qua.nhaDongHanh,
      moTa: tra.qua(s.qua.ma)?.moTa ?? "",
      daTrao,
    };
  return kq;
}

// ─── Truy vấn dùng chung ──────────────────────────────────────────────

/**
 * Mọi mã mùa có thể chứa dòng Lá bài (CHOI_THU + mọi NnMua). Lọc `muaId IN`
 * để dùng được chỉ mục [muaId, userId] thay vì quét cả sổ cái, và để lá lật lúc
 * 0:00–6:00 ngày đổi mùa vẫn được nhận ra.
 */
async function cacMaMua(themMa?: string): Promise<string[]> {
  const ds = await prisma.nnMua.findMany({ select: { id: true } });
  return [
    ...new Set([CHOI_THU, ...(themMa ? [themMa] : []), ...ds.map((m) => m.id)]),
  ];
}

function laCuaNguoi(userId: string, muaIds: string[], take: number) {
  return prisma.nnSoCai.findMany({
    where: { userId, loai: LOAI_SO_CAI_LA_BAI, muaId: { in: muaIds } },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      muaId: true,
      nguon: true,
      diem: true,
      ghiChu: true,
      createdAt: true,
    },
  });
}

/** Số ngày liên tiếp có trong tập, đếm lùi từ `tuNgay`. */
function demChuoi(cacNgay: Set<string>, tuNgay: string): number {
  let n = 0;
  let d = tuNgay;
  while (cacNgay.has(d)) {
    n++;
    d = congNgay(d, -1);
  }
  return n;
}

type DemQua = {
  tongTheoMa: Map<string, number>;
  homNayTheoMa: Map<string, number>;
  tongHomNay: number;
  cuaNguoiTrongMua: number;
};

/**
 * Đếm suất quà đã trúng (mọi mùa theo mã, hôm nay theo mã, tổng hôm nay, của
 * một người trong mùa). Lọc thô bằng `contains '"maQua":"'` rồi so mã CHÍNH XÁC
 * sau khi đọc JSON — SQLite LIKE không phân biệt hoa thường.
 */
async function demQua(
  tx: Tx,
  ngay: string,
  nguoi?: { userId: string; muaId: string },
): Promise<DemQua> {
  const rows = await tx.nnSoCai.findMany({
    where: { loai: LOAI_SO_CAI_LA_BAI, ghiChu: { contains: DAU_MA_QUA } },
    select: { userId: true, muaId: true, nguon: true, ghiChu: true },
  });
  const kq: DemQua = {
    tongTheoMa: new Map(),
    homNayTheoMa: new Map(),
    tongHomNay: 0,
    cuaNguoiTrongMua: 0,
  };
  const cong = (m: Map<string, number>, k: string) =>
    m.set(k, (m.get(k) ?? 0) + 1);
  for (const r of rows) {
    const ma = docAnhChup(r.ghiChu)?.maQua;
    if (!ma) continue;
    cong(kq.tongTheoMa, ma);
    if (r.nguon === nguonNgay(ngay)) {
      cong(kq.homNayTheoMa, ma);
      kq.tongHomNay++;
    }
    if (nguoi && r.userId === nguoi.userId && r.muaId === nguoi.muaId)
      kq.cuaNguoiTrongMua++;
  }
  return kq;
}

/** Quà đang bật, trong khoảng ngày, còn tỉ trọng (chưa xét suất). */
function quaDangBat(c: CauHinhLaBai, ngay: string): QuaLaBai[] {
  return c.dsQua.filter(
    (q) =>
      q.bat &&
      q.trongSo > 0 &&
      q.tongSo > 0 &&
      trongKhoangNgay(ngay, q.tuNgay, q.denNgay),
  );
}

/** Lọc quà còn suất theo số đã đếm (mọi mùa + trần theo ngày của từng quà). */
function quaConSuat(ds: QuaLaBai[], dem: DemQua): QuaLaBai[] {
  return ds.filter(
    (q) =>
      (dem.tongTheoMa.get(q.ma) ?? 0) < q.tongSo &&
      (q.toiDaMoiNgay === 0 ||
        (dem.homNayTheoMa.get(q.ma) ?? 0) < q.toiDaMoiNgay),
  );
}

/**
 * Người này có đủ điều kiện nhận quà không (chưa xét suất — suất phải đếm
 * trong giao dịch). Dùng CHUNG cho ô trang chủ và lúc lật, để hai nơi không
 * nói khác nhau: hứa quà rồi không bao giờ trúng là mất lòng tin.
 */
async function duDieuKienQua(
  nguoi: NguoiChoi,
  mua: MuaHienTai,
  dk: CauHinhLaBai["dieuKienQua"],
): Promise<boolean> {
  if (dk.canGanHoiVien && !nguoi.memberId) return false;
  const [hv, nc, soTram] = await Promise.all([
    nguoi.memberId
      ? prisma.member.findUnique({
          where: { id: nguoi.memberId },
          select: { active: true, trangThai: true },
        })
      : Promise.resolve(null),
    prisma.nnNguoiChoi.findUnique({
      where: { userId: nguoi.userId },
      select: { anXepHang: true },
    }),
    prisma.nnTienDo.count({
      where: { userId: nguoi.userId, muaId: mua.id, daQua: true },
    }),
  ]);
  const laHoiVien = !!hv && hv.active && hv.trangThai !== "ROI_HOI";
  if (dk.canGanHoiVien && !laHoiVien) return false;
  if (dk.boQuaAnXepHang && nc?.anXepHang) return false;
  return soTram >= dk.toiThieuTramQua;
}

async function daTraoQua(
  userId: string,
  muaId: string,
  ngay: string,
): Promise<boolean> {
  const t = await prisma.nnTraoQua.findUnique({
    where: {
      userId_muaId_loai: { userId, muaId, loai: maTraoQuaLaBai(ngay) },
    },
    select: { id: true },
  });
  return !!t;
}

// ─── Hợp đồng với các nhóm khác ───────────────────────────────────────

/** Dữ liệu ô "Lá bài hôm nay" trên trang chủ game. Tắt tính năng → `bat: false`. */
export async function laBaiHomNay(
  nguoi: NguoiChoi,
  mua: MuaHienTai,
): Promise<LaBaiHomNay> {
  const ngay = ngayLaBai();
  const tn = await docTinhNang();
  const c = await docCauHinhLaBai();
  if (!tn.laBai)
    return {
      bat: false,
      ngay,
      soLa: c.soLa,
      tuMo: false,
      coQua: false,
      chuoiNgay: 0,
      ketQua: null,
    };
  const muaIds = await cacMaMua(mua.id);
  const rows = await laCuaNguoi(nguoi.userId, muaIds, 400);
  const cacNgay = new Set(rows.map((r) => ngayCuaNguon(r.nguon)));
  const homNay = rows.find((r) => r.nguon === nguonNgay(ngay)) ?? null;
  const chuoiNgay = demChuoi(cacNgay, homNay ? ngay : congNgay(ngay, -1));

  let ketQua: KetQuaLaBai | null = null;
  if (homNay) {
    const coMaQua = !!docAnhChup(homNay.ghiChu)?.maQua;
    const daTrao = coMaQua
      ? await daTraoQua(nguoi.userId, homNay.muaId, ngay)
      : false;
    ketQua = dungKetQua(homNay, taoBoTra(c), daTrao);
  }

  // "Có thể trúng quà": mùa chính thức đang chạy, còn suất VÀ người này đủ điều
  // kiện — xét đúng bộ điều kiện của lúc lật, đừng hứa quà với tài khoản chưa
  // gắn hồ sơ hội viên, chưa qua đủ trạm hay đã hết suất quà của mùa.
  let coQua = false;
  const quaBat = quaDangBat(c, ngay);
  const dk = c.dieuKienQua;
  if (
    mua.trangThai === "DANG_DIEN_RA" &&
    c.trongSo.QUA > 0 &&
    quaBat.length &&
    (await duDieuKienQua(nguoi, mua, dk))
  ) {
    const dem = await demQua(prisma, ngay, {
      userId: nguoi.userId,
      muaId: mua.id,
    });
    coQua =
      dem.cuaNguoiTrongMua < dk.toiDaMoiNguoiMua &&
      (dk.toiDaQuaMoiNgay === 0 || dem.tongHomNay < dk.toiDaQuaMoiNgay) &&
      quaConSuat(quaBat, dem).length > 0;
  }

  return {
    bat: true,
    ngay,
    soLa: c.soLa,
    tuMo: c.tuMo,
    coQua,
    chuoiNgay,
    ketQua,
  };
}

/**
 * Lật lá hôm nay. Bấm hai lần / nhiều máy cùng lúc đều trả lại ĐÚNG kết quả đã
 * lưu (kiểm tra và ghi trong cùng một giao dịch; SQLite một kết nối nên các
 * giao dịch xếp hàng).
 */
export async function latLaBai(
  nguoi: NguoiChoi,
  viTri: number,
): Promise<KetQuaLaBai> {
  const { userId } = nguoi;
  // ── Đọc mọi thứ TRƯỚC giao dịch (SQLite một kết nối) ──
  const tn = await docTinhNang();
  if (!tn.laBai) throw new LoiGame("Lá bài mỗi ngày đang tạm nghỉ", "TAT");
  const c = await docCauHinhLaBai();
  if (
    typeof viTri !== "number" ||
    !Number.isInteger(viTri) ||
    viTri < 0 ||
    viTri >= c.soLa
  )
    throw new LoiGame(
      "Lá bài không hợp lệ — tải lại trang rồi chọn lại",
      "VI_TRI",
    );
  const mua = await muaHienTai();
  const ngay = ngayLaBai();
  const muaIds = await cacMaMua(mua.id);
  const ganDay = await laCuaNguoi(userId, muaIds, 400);
  const tra = taoBoTra(c);

  const daLat = ganDay.find((r) => r.nguon === nguonNgay(ngay));
  if (daLat) {
    const daTrao = docAnhChup(daLat.ghiChu)?.maQua
      ? await daTraoQua(userId, daLat.muaId, ngay)
      : false;
    const kq = dungKetQua(daLat, tra, daTrao);
    if (kq) return kq;
  }

  // Điều kiện nhận quà (trừ suất — đếm trong giao dịch)
  const quaBat = quaDangBat(c, ngay);
  const duocQua =
    mua.trangThai === "DANG_DIEN_RA" &&
    c.trongSo.QUA > 0 &&
    quaBat.length > 0 &&
    (await duDieuKienQua(nguoi, mua, c.dieuKienQua));

  // Nội dung chữ: ưu tiên câu chưa gặp trong N ngày, hết thì lấy lại toàn bộ
  const { danhNgon, loiNhan } = noiDungHieuLuc(c);
  const tuNgayLap = congNgay(ngay, -c.khongLapDanhNgonNgay);
  const daGap = new Set<string>();
  if (c.khongLapDanhNgonNgay > 0)
    for (const r of ganDay) {
      if (ngayCuaNguon(r.nguon) < tuNgayLap) continue;
      const s = docAnhChup(r.ghiChu);
      if (s?.ma && (s.loai === "DANH_NGON" || s.loai === "LOI_NHAN"))
        daGap.add(`${s.loai}:${s.ma}`);
    }
  const dnBat = danhNgon.filter((d) => d.bat);
  const lnBat = loiNhan.filter(
    (l) => l.bat && trongKhoangNgay(ngay, l.tuNgay, l.denNgay),
  );
  const dnMoi = dnBat.filter((d) => !daGap.has(`DANH_NGON:${d.ma}`));
  const lnMoi = lnBat.filter((l) => !daGap.has(`LOI_NHAN:${l.ma}`));

  const cacNgay = new Set(ganDay.map((r) => ngayCuaNguon(r.nguon)));
  const chuoiNgay = 1 + demChuoi(cacNgay, congNgay(ngay, -1));
  const diemChuoi = thuongChuoiLaBai(c, chuoiNgay);

  const { row, moi } = await prisma.$transaction(async (tx) => {
    const cu = await tx.nnSoCai.findFirst({
      where: {
        userId,
        loai: LOAI_SO_CAI_LA_BAI,
        nguon: nguonNgay(ngay),
        muaId: { in: muaIds },
      },
      orderBy: { createdAt: "asc" },
    });
    if (cu) return { row: cu, moi: false };

    let qua: QuaLaBai[] = [];
    if (duocQua) {
      const dem = await demQua(tx, ngay, { userId, muaId: mua.id });
      const dk = c.dieuKienQua;
      if (
        dem.cuaNguoiTrongMua < dk.toiDaMoiNguoiMua &&
        (dk.toiDaQuaMoiNgay === 0 || dem.tongHomNay < dk.toiDaQuaMoiNgay)
      )
        qua = quaConSuat(quaBat, dem);
    }
    const chon = chonKetQua(
      c,
      {
        danhNgon: dnMoi.length ? dnMoi : dnBat,
        loiNhan: lnMoi.length ? lnMoi : lnBat,
        qua,
      },
      Math.random,
    );
    const anh: AnhChup = {
      v: 1,
      viTri,
      soLa: c.soLa,
      loai: chon.loai,
      ma: chon.danhNgon?.ma ?? chon.loiNhan?.ma ?? chon.qua?.ma ?? null,
      ...(chon.qua
        ? {
            maQua: chon.qua.ma,
            qua: {
              ma: chon.qua.ma,
              ten: chon.qua.ten,
              nhaDongHanh: chon.qua.nhaDongHanh,
            },
          }
        : {}),
      diem: chon.diem,
      diemChuoi,
      chuoiNgay,
    };
    const moiTao = await tx.nnSoCai.create({
      data: {
        userId,
        muaId: mua.id,
        loai: LOAI_SO_CAI_LA_BAI,
        nguon: nguonNgay(ngay),
        // Mùa đã kết thúc: vẫn ghi dòng (giữ "mỗi ngày một lá") nhưng 0 điểm
        diem: mua.tinhDiem ? chon.diem + diemChuoi : 0,
        ghiChu: JSON.stringify(anh),
      },
    });
    return { row: moiTao, moi: true };
  }, GIAO_DICH);

  const daTrao =
    !moi && docAnhChup(row.ghiChu)?.maQua
      ? await daTraoQua(userId, row.muaId, ngay)
      : false;
  const kq = dungKetQua(row, tra, daTrao);
  if (!kq) throw new LoiGame("Không đọc được lá bài hôm nay — thử tải lại");
  return kq;
}

/**
 * Hôm nay người này đã lật lá chưa; null khi tính năng đang tắt. Nhẹ: cài đặt
 * (dùng chung bộ nhớ đệm request) + hai truy vấn (danh sách mã mùa + một truy
 * vấn có chỉ mục). Xét MỌI mã mùa chứ không chỉ mùa hiện tại: Ban mở mùa mới
 * giữa ngày thì lá lật sáng nay nằm ở mùa cũ, lọc theo mùa hiện tại là báo
 * nhầm "chưa lật".
 */
export async function daLatLaBaiHomNay(
  userId: string,
  mua?: MuaHienTai,
): Promise<boolean | null> {
  const tn = await docTinhNang();
  if (!tn.laBai) return null;
  const r = await prisma.nnSoCai.findFirst({
    where: {
      userId,
      loai: LOAI_SO_CAI_LA_BAI,
      nguon: nguonNgay(ngayLaBai()),
      muaId: { in: await cacMaMua(mua?.id) },
    },
    select: { id: true },
  });
  return !!r;
}

/** Quà Lá bài người này đã trúng trong mùa (trang Phần thưởng), mới nhất trước. */
export async function quaLaBaiCuaToi(
  userId: string,
  muaId: string,
): Promise<
  { ngay: string; ten: string; nhaDongHanh: string; daTrao: boolean }[]
> {
  // Chơi thử không bao giờ có quà
  if (muaId === CHOI_THU) return [];
  const rows = await prisma.nnSoCai.findMany({
    where: {
      userId,
      muaId,
      loai: LOAI_SO_CAI_LA_BAI,
      ghiChu: { contains: DAU_MA_QUA },
    },
    orderBy: { createdAt: "desc" },
    select: { nguon: true, ghiChu: true },
  });
  const trung = rows
    .map((r) => ({ ngay: ngayCuaNguon(r.nguon), s: docAnhChup(r.ghiChu) }))
    .filter((x) => x.s?.maQua && x.s.qua);
  if (!trung.length) return [];
  const trao = await prisma.nnTraoQua.findMany({
    where: { userId, muaId, loai: { startsWith: "LB_" } },
    select: { loai: true },
  });
  const traoRoi = new Set(trao.map((t) => t.loai));
  return trung.map((x) => ({
    ngay: x.ngay,
    ten: x.s!.qua!.ten,
    nhaDongHanh: x.s!.qua!.nhaDongHanh,
    daTrao: traoRoi.has(maTraoQuaLaBai(x.ngay)),
  }));
}

// ─── Trang bộ sưu tập ─────────────────────────────────────────────────

export type LaDaLat = KetQuaLaBai & { luc: Date };

export type BoSuuTapLaBai = {
  ds: LaDaLat[];
  tongLat: number;
  theoLoai: Record<LoaiLa, number>;
  soDanhNgonDaGap: number;
  tongDanhNgon: number;
  theoNhom: { ma: string; ten: string; daGap: number; tong: number }[];
  chuoiNgay: number;
  /** Tổng điểm đã ghi sổ cái nhờ lá bài (mọi mùa) */
  tongDiem: number;
};

/** Lịch sử lá đã lật (mới nhất trước) + số liệu sưu tầm. */
export async function lichSuLaBai(
  userId: string,
  gioiHan = 120,
): Promise<BoSuuTapLaBai> {
  const c = await docCauHinhLaBai();
  const muaIds = await cacMaMua();
  const rows = await laCuaNguoi(userId, muaIds, 1500);
  const trao = rows.some((r) => r.ghiChu?.includes(DAU_MA_QUA))
    ? await prisma.nnTraoQua.findMany({
        where: { userId, loai: { startsWith: "LB_" } },
        select: { muaId: true, loai: true },
      })
    : [];
  const traoRoi = new Set(trao.map((t) => `${t.muaId}:${t.loai}`));
  const tra = taoBoTra(c);

  const theoLoai: Record<LoaiLa, number> = {
    DANH_NGON: 0,
    LOI_NHAN: 0,
    DIEM: 0,
    QUA: 0,
  };
  const daGap = new Set<string>();
  const ds: LaDaLat[] = [];
  let tongDiem = 0;
  for (const r of rows) {
    const ngay = ngayCuaNguon(r.nguon);
    const kq = dungKetQua(
      r,
      tra,
      traoRoi.has(`${r.muaId}:${maTraoQuaLaBai(ngay)}`),
    );
    if (!kq) continue;
    theoLoai[kq.loai]++;
    tongDiem += r.diem;
    if (kq.loai === "DANH_NGON" && kq.danhNgon) daGap.add(kq.danhNgon.ma);
    if (ds.length < gioiHan) ds.push({ ...kq, luc: r.createdAt });
  }

  const { danhNgon } = noiDungHieuLuc(c);
  // Tổng = câu đang bật + câu đã sưu tầm mà nay Ban tắt (sưu tầm rồi thì vẫn tính)
  const tinh = danhNgon.filter((d) => d.bat || daGap.has(d.ma));
  const theoNhom = [...NHOM_DANH_NGON, { ma: "KHAC", ten: "Chủ đề khác" }]
    .map((n) => {
      const trong = tinh.filter((d) => d.nhom === n.ma);
      return {
        ma: n.ma,
        ten: n.ten,
        daGap: trong.filter((d) => daGap.has(d.ma)).length,
        tong: trong.length,
      };
    })
    .filter((n) => n.tong > 0);

  const homNay = ngayLaBai();
  const cacNgay = new Set(rows.map((r) => ngayCuaNguon(r.nguon)));
  return {
    ds,
    tongLat: rows.length,
    theoLoai,
    soDanhNgonDaGap: daGap.size,
    tongDanhNgon: new Set([...tinh.map((d) => d.ma), ...daGap]).size,
    theoNhom,
    chuoiNgay: demChuoi(
      cacNgay,
      cacNgay.has(homNay) ? homNay : congNgay(homNay, -1),
    ),
    tongDiem,
  };
}

// ─── Quản trị ─────────────────────────────────────────────────────────

export type NguoiTrungQuaLaBai = {
  userId: string;
  muaId: string;
  ngay: string;
  maQua: string;
  ten: string;
  nhaDongHanh: string;
  daTrao: boolean;
  /** Mã ghi "đã trao" vào NnTraoQua.loai */
  maTrao: string;
  luc: Date;
  hoTen: string;
  doanhNghiep: string | null;
  soDienThoai: string | null;
};

/** Người trúng quà Lá bài trong một mùa (mới nhất trước) — tab Trao quà. */
export async function nguoiTrungQuaLaBai(
  muaId: string,
): Promise<NguoiTrungQuaLaBai[]> {
  if (muaId === CHOI_THU) return [];
  const rows = await prisma.nnSoCai.findMany({
    where: {
      muaId,
      loai: LOAI_SO_CAI_LA_BAI,
      ghiChu: { contains: DAU_MA_QUA },
    },
    orderBy: { createdAt: "desc" },
    select: { userId: true, nguon: true, ghiChu: true, createdAt: true },
  });
  const trung = rows.flatMap((r) => {
    const s = docAnhChup(r.ghiChu);
    return s?.maQua && s.qua ? [{ r, s }] : [];
  });
  if (!trung.length) return [];
  const [trao, users] = await Promise.all([
    prisma.nnTraoQua.findMany({
      where: { muaId, loai: { startsWith: "LB_" } },
      select: { userId: true, loai: true },
    }),
    prisma.user.findMany({
      where: { id: { in: [...new Set(trung.map((x) => x.r.userId))] } },
      select: {
        id: true,
        name: true,
        member: { select: { name: true, company: true, phone: true } },
      },
    }),
  ]);
  const traoRoi = new Set(trao.map((t) => `${t.userId}:${t.loai}`));
  const theoId = new Map(users.map((u) => [u.id, u]));
  return trung.map(({ r, s }) => {
    const ngay = ngayCuaNguon(r.nguon);
    const maTrao = maTraoQuaLaBai(ngay);
    const u = theoId.get(r.userId);
    return {
      userId: r.userId,
      muaId,
      ngay,
      maQua: s.maQua!,
      ten: s.qua!.ten,
      nhaDongHanh: s.qua!.nhaDongHanh,
      daTrao: traoRoi.has(`${r.userId}:${maTrao}`),
      maTrao,
      luc: r.createdAt,
      hoTen: u?.member?.name ?? u?.name ?? "Tài khoản đã xoá",
      doanhNghiep: u?.member?.company ? tenDoanhNghiep(u.member.company) : null,
      soDienThoai: u?.member?.phone ?? null,
    };
  });
}

export type ThongKeLaBai = {
  ngay: string;
  homNay: { tong: number; theoLoai: Record<LoaiLa, number> };
  bayNgay: {
    tong: number;
    soNguoi: number;
    theoLoai: Record<LoaiLa, number>;
    theoNgay: { ngay: string; tong: number }[];
    /** Điểm đã ghi sổ cái nhờ lá bài trong 7 ngày */
    diem: number;
  };
  /** Theo mã quà: đã trúng (mọi mùa), hôm nay, còn lại theo tổng suất đang cài */
  qua: Record<string, { daTrung: number; homNay: number; conLai: number }>;
};

const demRong = (): Record<LoaiLa, number> => ({
  DANH_NGON: 0,
  LOI_NHAN: 0,
  DIEM: 0,
  QUA: 0,
});

/** Thống kê cho tab quản trị: hôm nay, 7 ngày gần nhất, suất quà. */
export async function thongKeLaBai(muaId: string): Promise<ThongKeLaBai> {
  const c = await docCauHinhLaBai();
  const ngay = ngayLaBai();
  const cacNgay = Array.from({ length: 7 }, (_, i) => congNgay(ngay, -i));
  // Đếm theo NGÀY chứ không theo mùa: mở mùa mới giữa ngày thì lượt lật sáng
  // nay nằm ở mùa cũ, lọc theo mùa đang xem là báo thiếu.
  const rows = await prisma.nnSoCai.findMany({
    where: {
      loai: LOAI_SO_CAI_LA_BAI,
      muaId: { in: await cacMaMua(muaId) },
      nguon: { in: cacNgay.map(nguonNgay) },
    },
    select: { userId: true, nguon: true, diem: true, ghiChu: true },
  });
  const homNay = { tong: 0, theoLoai: demRong() };
  const theoLoai7 = demRong();
  const theoNgay = new Map(cacNgay.map((d) => [d, 0]));
  const nguoi = new Set<string>();
  let diem = 0;
  for (const r of rows) {
    const s = docAnhChup(r.ghiChu);
    if (!s) continue;
    const d = ngayCuaNguon(r.nguon);
    theoLoai7[s.loai]++;
    theoNgay.set(d, (theoNgay.get(d) ?? 0) + 1);
    nguoi.add(r.userId);
    diem += r.diem;
    if (d === ngay) {
      homNay.tong++;
      homNay.theoLoai[s.loai]++;
    }
  }
  const dem = await demQua(prisma, ngay);
  const qua: ThongKeLaBai["qua"] = {};
  for (const q of c.dsQua) {
    const daTrung = dem.tongTheoMa.get(q.ma) ?? 0;
    qua[q.ma] = {
      daTrung,
      homNay: dem.homNayTheoMa.get(q.ma) ?? 0,
      conLai: Math.max(0, q.tongSo - daTrung),
    };
  }
  return {
    ngay,
    homNay,
    bayNgay: {
      tong: CAC_LOAI_LA.reduce((s, l) => s + theoLoai7[l], 0),
      soNguoi: nguoi.size,
      theoLoai: theoLoai7,
      theoNgay: cacNgay.map((d) => ({ ngay: d, tong: theoNgay.get(d) ?? 0 })),
      diem,
    },
    qua,
  };
}
