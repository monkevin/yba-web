/**
 * Sổ đăng ký mọi mục cài đặt game — CHỈ MÁY CHỦ.
 *
 * Mỗi mục là một khoá SiteSetting `nn.*` chứa JSON, luôn đọc qua hàm `chuan`
 * của mục (thiếu trường → mặc định, quá giới hạn → chặn). Chưa lưu gì thì game
 * chạy đúng luật gốc trong code.
 *
 * Quy tắc dùng:
 *  - Đọc cài đặt TRƯỚC khi mở `$transaction` rồi truyền giá trị vào (SQLite
 *    một kết nối — gọi `prisma` trong giao dịch là tự khoá chính mình).
 *  - Trong một request, các lần đọc dùng chung một truy vấn (React `cache`;
 *    chạy script ngoài Next thì `cache` chỉ là gọi thẳng).
 *  - Ghi chỉ qua `ghiMuc` / `xoaMuc` để luôn được làm sạch.
 */
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { chuanThongSo, THONG_SO_MAC_DINH } from "../moc-qua";
import { chuanLaBai, LA_BAI_MAC_DINH } from "../la-bai-luat";
import { NHIEM_VU, THE_CO_HOI } from "../noi-dung";
import { CAU_HINH_NV } from "../nhiem-vu-cau-hinh";
import chiaSeJson from "../noi-dung/chia-se.json";
import { chuanLuat, LUAT_MAC_DINH } from "./luat-choi";
import { chuanTinhNang, TINH_NANG_MAC_DINH } from "./tinh-nang";
import {
  BO_CAU_AN_MAC_DINH,
  chuanBoCauAn,
  chuanChiaSe,
  chuanHuongDan,
  chuanNhiemVu,
  chuanTheCoHoi,
  HUONG_DAN_MAC_DINH,
  type CauChiaSeSua,
  type NhiemVuSua,
  type TheCoHoiSua,
} from "./noi-dung-sua";

/** Bản gốc (JSON trong code) của các nội dung sửa được. */
export const THE_CO_HOI_GOC: TheCoHoiSua[] = THE_CO_HOI.map((t) => ({
  ma: t.ma,
  bat: true,
  ten: t.ten,
  tinhHuong: t.tinhHuong,
  lua: t.lua.map((l) => ({ chon: l.chon, von: l.von, giai: l.giai })),
}));

export const NHIEM_VU_GOC: NhiemVuSua[] = NHIEM_VU.map((n) => {
  const ch = CAU_HINH_NV[n.ma];
  return {
    ma: n.ma,
    bat: true,
    ten: n.ten,
    viec: n.viec,
    xacNhan: n.xacNhan,
    diem: n.diem,
    von: n.von,
    gioiHan: n.gioiHan,
    toiDa: ch?.toiDa ?? 0,
    ky: ch?.ky ?? null,
    canAnh: !!ch?.canAnh,
    goiY: ch?.goiY ?? "",
  };
});

export const CHIA_SE_GOC: CauChiaSeSua[] = (
  chiaSeJson as { ma: string; hoi: string; luaChon: string[] }[]
).map((c) => ({ ma: c.ma, bat: true, hoi: c.hoi, luaChon: c.luaChon }));

type DinhNghia<T> = {
  khoa: `nn.${string}`;
  ten: string;
  chuan: (x: unknown) => T;
  macDinh: () => T;
};

const muc = <T>(d: DinhNghia<T>) => d;

export const MUC_CAI_DAT = {
  thongSo: muc({
    khoa: "nn.thongSo",
    ten: "thông số Đấu trường & lượt tính điểm",
    chuan: chuanThongSo,
    macDinh: () => THONG_SO_MAC_DINH,
  }),
  luat: muc({
    khoa: "nn.luat",
    ten: "luật chơi & điểm",
    chuan: chuanLuat,
    macDinh: () => LUAT_MAC_DINH,
  }),
  tinhNang: muc({
    khoa: "nn.tinhNang",
    ten: "bật / tắt tính năng",
    chuan: chuanTinhNang,
    macDinh: () => TINH_NANG_MAC_DINH,
  }),
  laBai: muc({
    khoa: "nn.laBai",
    ten: "Lá bài mỗi ngày",
    chuan: chuanLaBai,
    macDinh: () => LA_BAI_MAC_DINH,
  }),
  theCoHoi: muc({
    khoa: "nn.theCoHoi",
    ten: "Thẻ Cơ hội",
    chuan: (x: unknown) => chuanTheCoHoi(x, THE_CO_HOI_GOC),
    macDinh: () => ({ ds: THE_CO_HOI_GOC }),
  }),
  nhiemVu: muc({
    khoa: "nn.nhiemVu",
    ten: "Nhiệm vụ Huynh đệ",
    chuan: (x: unknown) => chuanNhiemVu(x, NHIEM_VU_GOC),
    macDinh: () => ({ ds: NHIEM_VU_GOC }),
  }),
  chiaSe: muc({
    khoa: "nn.chiaSe",
    ten: "câu chia sẻ về mình",
    chuan: (x: unknown) => chuanChiaSe(x, CHIA_SE_GOC),
    macDinh: () => ({ ds: CHIA_SE_GOC }),
  }),
  boCauAn: muc({
    khoa: "nn.boCauAn",
    ten: "câu / bộ câu bị ẩn",
    chuan: chuanBoCauAn,
    macDinh: () => BO_CAU_AN_MAC_DINH,
  }),
  huongDan: muc({
    khoa: "nn.huongDan",
    ten: "hướng dẫn người mới",
    chuan: chuanHuongDan,
    macDinh: () => HUONG_DAN_MAC_DINH,
  }),
};

export type TenMuc = keyof typeof MUC_CAI_DAT;
export type GiaTriMuc<K extends TenMuc> = ReturnType<
  (typeof MUC_CAI_DAT)[K]["chuan"]
>;
export type DuLieuMuc<T> = {
  giaTri: T;
  macDinh: T;
  /**
   * Thời điểm lưu gần nhất (ISO) — để hiện "đã lưu lúc…". KHÔNG dùng làm khoá
   * chống ghi đè: `luuCaiDat` gộp theo trường cấp 1, và hai khung cài đặt của
   * cùng một mục không được trùng trường (xem AGENTS.md).
   */
  phienBan: string | null;
  daLuu: boolean;
};

export const laTenMuc = (x: string): x is TenMuc =>
  Object.prototype.hasOwnProperty.call(MUC_CAI_DAT, x);

const docTatCa = cache(async () => {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { startsWith: "nn." } },
  });
  return new Map(rows.map((r) => [r.key, r]));
});

function giaiMa<K extends TenMuc>(
  ten: K,
  r: { value: string; updatedAt: Date } | undefined,
): DuLieuMuc<GiaTriMuc<K>> {
  const d = MUC_CAI_DAT[ten] as unknown as DinhNghia<GiaTriMuc<K>>;
  let tho: unknown = null;
  try {
    tho = r ? JSON.parse(r.value) : null;
  } catch {
    tho = null;
  }
  return {
    giaTri: d.chuan(tho),
    macDinh: d.macDinh(),
    phienBan: r?.updatedAt.toISOString() ?? null,
    daLuu: !!r,
  };
}

/** Đọc một mục kèm mặc định và phiên bản (cho trang quản trị). */
export async function docMucDayDu<K extends TenMuc>(
  ten: K,
): Promise<DuLieuMuc<GiaTriMuc<K>>> {
  const r = (await docTatCa()).get(MUC_CAI_DAT[ten].khoa);
  return giaiMa(ten, r);
}

/** Đọc giá trị đã làm sạch của một mục. */
export async function docMuc<K extends TenMuc>(ten: K): Promise<GiaTriMuc<K>> {
  return (await docMucDayDu(ten)).giaTri;
}

/** Đọc thẳng CSDL, bỏ qua bộ nhớ đệm của request (dùng khi vừa ghi xong). */
export async function docMucTuoi<K extends TenMuc>(
  ten: K,
): Promise<DuLieuMuc<GiaTriMuc<K>>> {
  const r = await prisma.siteSetting.findUnique({
    where: { key: MUC_CAI_DAT[ten].khoa },
  });
  return giaiMa(ten, r ?? undefined);
}

/** Làm sạch rồi lưu; trả về giá trị đã lưu và phiên bản mới. */
export async function ghiMuc<K extends TenMuc>(
  ten: K,
  giaTri: unknown,
): Promise<{ giaTri: GiaTriMuc<K>; phienBan: string }> {
  const d = MUC_CAI_DAT[ten] as unknown as DinhNghia<GiaTriMuc<K>>;
  const sach = d.chuan(giaTri);
  const r = await prisma.siteSetting.upsert({
    where: { key: d.khoa },
    create: { key: d.khoa, value: JSON.stringify(sach) },
    update: { value: JSON.stringify(sach) },
  });
  return { giaTri: sach, phienBan: r.updatedAt.toISOString() };
}

/** Về mặc định: xoá khoá, game dùng lại luật / nội dung gốc trong code. */
export async function xoaMuc(ten: TenMuc): Promise<void> {
  await prisma.siteSetting.deleteMany({
    where: { key: MUC_CAI_DAT[ten].khoa },
  });
}

export const docLuat = () => docMuc("luat");
export const docTinhNang = () => docMuc("tinhNang");
export const docCauHinhLaBai = () => docMuc("laBai");
export const docTheCoHoiSua = () => docMuc("theCoHoi");
export const docNhiemVuSua = () => docMuc("nhiemVu");
export const docChiaSeSua = () => docMuc("chiaSe");
export const docBoCauAn = () => docMuc("boCauAn");
export const docHuongDan = () => docMuc("huongDan");
