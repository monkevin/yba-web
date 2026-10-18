/**
 * Số liệu tổng hợp cho các màn hình game: hồ sơ người chơi, ngôi nhà, bảng xếp
 * hạng. Mọi con số cộng dồn từ sổ cái `NnSoCai` — không lưu tổng sẵn ở đâu cả,
 * nên sửa / xoá một dòng sổ cái là bảng xếp hạng tự đúng lại.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import type { NguoiChoi } from "./kieu";
import {
  DIEU_KIEN_NGON_LUA,
  MA_VON,
  THU_THACH_NGAY,
  luatManChoi,
  type MaVon,
} from "./luat";
import type { MuaHienTai } from "./mua";
import {
  TRAM,
  TRAM_THEO_MA,
  tramCongKhai,
  type TramCongKhai,
} from "./noi-dung";
import { daMoKhoa, NGAY } from "./dong-co";
import { docJson, tongSoCai } from "./so-cai";
import { congNgay, dauThang, dauTuan, ngayThuThach } from "./thoi-gian";
import { docMuc, docTheCoHoiSua, docTinhNang } from "./cai-dat";
import { danhHieuTheoLuat } from "./cai-dat/luat-choi";

export type TramTrenNha = TramCongKhai & {
  moKhoa: boolean;
  daQua: boolean;
  sao: number;
  diemTot: number;
  luotTinhDiemDaDung: number;
  dangChoi: boolean;
};

export async function hoSoNguoiChoi(nguoi: NguoiChoi, mua: MuaHienTai) {
  const { userId } = nguoi;
  const [soCai, tienDo, huyHieu, nguoiChoi, luotNgay, dangChoi, luat] =
    await Promise.all([
      tongSoCai(prisma, userId, mua.id),
      prisma.nnTienDo.findMany({ where: { userId, muaId: mua.id } }),
      prisma.nnHuyHieu.findMany({
        where: { userId, muaId: mua.id },
        orderBy: { createdAt: "asc" },
      }),
      prisma.nnNguoiChoi.upsert({
        where: { userId },
        create: { userId },
        update: {},
      }),
      prisma.nnLuot.findMany({
        where: { userId, ngay: { not: null } },
        select: {
          id: true,
          ngay: true,
          trangThai: true,
          diem: true,
          soDung: true,
          ketQua: true,
        },
        orderBy: { ngay: "desc" },
        take: 400,
      }),
      prisma.nnLuot.findMany({
        where: {
          userId,
          muaId: mua.id,
          trangThai: "DANG_CHOI",
          tramMa: { not: NGAY },
        },
        select: { tramMa: true },
      }),
      docMuc("luat"),
    ]);

  const theoMa = new Map(tienDo.map((t) => [t.tramMa, t]));
  const daQua = new Set(tienDo.filter((t) => t.daQua).map((t) => t.tramMa));
  const dangDo = new Set(dangChoi.map((l) => l.tramMa));
  const tram: TramTrenNha[] = TRAM.map((t) => {
    const td = theoMa.get(t.ma);
    return {
      ...tramCongKhai(t),
      moKhoa: daMoKhoa(t, daQua),
      daQua: !!td?.daQua,
      sao: td?.sao ?? 0,
      diemTot: td?.diemTot ?? 0,
      luotTinhDiemDaDung: td?.soLuotTinhDiem ?? 0,
      dangChoi: dangDo.has(t.ma),
    };
  });
  const soSao = tram.reduce((s, t) => s + t.sao, 0);
  const coHuyHieu = new Set(huyHieu.map((h) => h.ma));
  // Ngọn lửa theo luật Ban chỉnh: đủ số trạm, số sao và "cân bằng" — có huy hiệu
  // Doanh nhân cân bằng HOẶC cả 4 vốn đạt ngưỡng (để Ban tắt huy hiệu này vẫn
  // còn đường thắp lửa)
  const canBang =
    coHuyHieu.has(DIEU_KIEN_NGON_LUA.HUY_HIEU) ||
    MA_VON.every((k) => soCai.von[k] >= luat.von.nguongCanBang);
  const ngonLua =
    daQua.size >= luat.ngonLua.soTram && soSao >= luat.ngonLua.soSao && canBang;

  // Trạm nên chơi tiếp: trạm đang dở, hoặc trạm đầu tiên đã mở mà chưa qua
  const tramTiep =
    tram.find((t) => t.dangChoi) ??
    tram.find((t) => t.moKhoa && !t.daQua) ??
    null;

  // Thử thách hằng ngày và chuỗi ngày đang giữ
  const homNay = ngayThuThach(new Date(), THU_THACH_NGAY.GIO_SANG_NGAY);
  const cacNgay = new Set(luotNgay.map((l) => l.ngay as string));
  let chuoiNgay = 0;
  let n = cacNgay.has(homNay) ? homNay : congNgay(homNay, -1);
  while (cacNgay.has(n)) {
    chuoiNgay++;
    n = congNgay(n, -1);
  }
  const luotHomNay = luotNgay.find((l) => l.ngay === homNay) ?? null;

  return {
    mua,
    diem: soCai.diem,
    von: soCai.von,
    tram,
    soTramQua: daQua.size,
    tongTram: TRAM.length,
    soSao,
    huyHieu: [...coHuyHieu],
    ngonLua,
    danhHieu: danhHieuTheoLuat(luat, soCai.diem, ngonLua),
    tramTiep,
    daXemHuongDan: nguoiChoi.daXemHuongDan,
    anXepHang: nguoiChoi.anXepHang,
    thuThach: {
      ngay: homNay,
      trangThai: luotHomNay
        ? luotHomNay.trangThai === "DANG_CHOI"
          ? "DANG_CHOI"
          : "XONG"
        : "CHUA",
      soDung: luotHomNay?.soDung ?? 0,
      diem: luotHomNay
        ? (docJson<{ diemGhiNhan?: number }>(luotHomNay.ketQua, {})
            .diemGhiNhan ?? luotHomNay.diem)
        : 0,
      chuoiNgay,
      /** Số câu của thử thách: lượt đã xong lấy số thật, chưa chơi lấy theo luật */
      soCau:
        (luotHomNay
          ? docJson<{ tong?: number }>(luotHomNay.ketQua, {}).tong
          : undefined) ?? luat.thuThachNgay.soCau,
    } as const,
    /** Luật đang dùng (ngưỡng cân bằng, danh hiệu, ngọn lửa…) cho giao diện */
    luat,
  };
}

export type HoSoNguoiChoi = Awaited<ReturnType<typeof hoSoNguoiChoi>>;

export type TieuChiXepHang = "mua" | "tuan" | "thang" | MaVon;

export type DongXepHang = {
  userId: string;
  hang: number;
  ten: string;
  congTy: string | null;
  anh: string | null;
  giaTri: number;
  laToi: boolean;
};

/**
 * Bảng xếp hạng. Bằng điểm: người chạm mốc sớm hơn (dòng sổ cái cuối cùng sớm
 * hơn) xếp trên. Ẩn người được đánh dấu `anXepHang` (Ban soạn đề).
 */
export async function bangXepHang(
  muaId: string,
  tieuChi: TieuChiXepHang,
  userId?: string,
  gioiHan = 50,
): Promise<{
  dong: DongXepHang[];
  cuaToi: DongXepHang | null;
  nguoiTren: DongXepHang | null;
  tong: number;
}> {
  // Dòng Lá bài 0 điểm 0 vốn chỉ để khoá "mỗi ngày một lá" — không được làm lệch
  // thứ tự người bằng điểm (xếp theo dòng sổ cái cuối cùng)
  const where: Prisma.NnSoCaiWhereInput = {
    muaId,
    NOT: { loai: "LA_BAI", diem: 0, vonCN: 0, vonTT: 0, vonXH: 0, vonTS: 0 },
  };
  if (tieuChi === "tuan") where.createdAt = { gte: dauTuan() };
  // Bảng tháng tính RIÊNG trong tháng dương lịch (giờ VN): top 10 tháng được
  // vinh danh ở buổi sinh hoạt, người biết game muộn vẫn còn cửa
  if (tieuChi === "thang") where.createdAt = { gte: dauThang() };

  const [nhom, an] = await Promise.all([
    prisma.nnSoCai.groupBy({
      by: ["userId"],
      where,
      _sum: { diem: true, vonCN: true, vonTT: true, vonXH: true, vonTS: true },
      _max: { createdAt: true },
    }),
    prisma.nnNguoiChoi.findMany({
      where: { anXepHang: true },
      select: { userId: true },
    }),
  ]);
  const biAn = new Set(an.map((x) => x.userId));
  const TRUONG_VON = {
    CN: "vonCN",
    TT: "vonTT",
    XH: "vonXH",
    TS: "vonTS",
  } as const;
  const giaTri = (s: (typeof nhom)[number]["_sum"]) =>
    tieuChi === "mua" || tieuChi === "tuan" || tieuChi === "thang"
      ? (s.diem ?? 0)
      : (s[TRUONG_VON[tieuChi]] ?? 0);

  const xep = nhom
    .map((x) => ({
      userId: x.userId,
      giaTri: giaTri(x._sum),
      luc: x._max.createdAt?.getTime() ?? 0,
    }))
    .filter((x) => x.giaTri > 0 && !biAn.has(x.userId))
    .sort((a, b) => b.giaTri - a.giaTri || a.luc - b.luc);

  const viTriToi = userId ? xep.findIndex((x) => x.userId === userId) : -1;
  const canTen = new Set(xep.slice(0, gioiHan).map((x) => x.userId));
  if (viTriToi >= 0) {
    canTen.add(xep[viTriToi].userId);
    if (viTriToi > 0) canTen.add(xep[viTriToi - 1].userId);
  }
  const users = await prisma.user.findMany({
    where: { id: { in: [...canTen] } },
    select: {
      id: true,
      name: true,
      member: {
        select: { name: true, company: true, avatar: true, logo: true },
      },
    },
  });
  const theoId = new Map(users.map((u) => [u.id, u]));
  const dong = (i: number): DongXepHang => {
    const x = xep[i];
    const u = theoId.get(x.userId);
    return {
      userId: x.userId,
      hang: i + 1,
      ten: u?.member?.name ?? u?.name ?? "Hội viên",
      congTy: u?.member?.company ? tenDoanhNghiep(u.member.company) : null,
      anh: u?.member?.avatar ?? u?.member?.logo ?? null,
      giaTri: x.giaTri,
      laToi: x.userId === userId,
    };
  };
  return {
    dong: xep.slice(0, gioiHan).map((_, i) => dong(i)),
    cuaToi: viTriToi >= 0 ? dong(viTriToi) : null,
    nguoiTren: viTriToi > 0 ? dong(viTriToi - 1) : null,
    tong: xep.length,
  };
}

/** Thông tin một trạm cho màn chơi. */
export async function thongTinTram(
  nguoi: NguoiChoi,
  mua: MuaHienTai,
  tramMa: string,
) {
  const t = TRAM_THEO_MA[tramMa];
  if (!t) return null;
  const [tienDo, dangChoi, luotQua] = await Promise.all([
    prisma.nnTienDo.findMany({
      where: { userId: nguoi.userId, muaId: mua.id },
    }),
    prisma.nnLuot.findFirst({
      where: {
        userId: nguoi.userId,
        muaId: mua.id,
        tramMa,
        trangThai: "DANG_CHOI",
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, viTri: true, cheDo: true },
    }),
    prisma.nnLuot.findFirst({
      where: {
        userId: nguoi.userId,
        muaId: mua.id,
        tramMa,
        trangThai: "XONG",
        sao: { gte: 1 },
      },
      orderBy: { xongLuc: "desc" },
      select: { id: true },
    }),
  ]);
  const daQua = new Set(tienDo.filter((x) => x.daQua).map((x) => x.tramMa));
  const td = tienDo.find((x) => x.tramMa === tramMa);
  const [thongSo, luat, tinhNang, theSua] = await Promise.all([
    docMuc("thongSo"),
    docMuc("luat"),
    docTinhNang(),
    docTheCoHoiSua(),
  ]);
  const luotToiDa = thongSo.luotTinhDiemToiDa;
  // Tắt Thẻ Cơ hội: chỉ còn mời mở thẻ ĐÃ rút mà chưa chọn (chơi nốt)
  const conRutMoi = tinhNang.theCoHoi && theSua.ds.some((x) => x.bat);
  const choRutThe =
    !!td &&
    (conRutMoi
      ? td.theCoHoiChon === null
      : td.theCoHoi !== null && td.theCoHoiChon === null);
  const conLuot = mua.tinhDiem
    ? Math.max(0, luotToiDa - (td?.soLuotTinhDiem ?? 0))
    : 0;
  return {
    tram: tramCongKhai(t),
    moKhoa: daMoKhoa(t, daQua),
    sao: td?.sao ?? 0,
    daQua: !!td?.daQua,
    diemTot: td?.diemTot ?? 0,
    luotTinhDiemConLai: conLuot,
    luotTinhDiemToiDa: luotToiDa,
    dangChoi: dangChoi ? { luotId: dangChoi.id, viTri: dangChoi.viTri } : null,
    /** Lượt đã qua trạm mà chưa dùng Thẻ Cơ hội — cho phép rút lại từ trang trạm */
    luotRutThe: td?.daQua && choRutThe && luotQua ? luotQua.id : null,
    /** Luật rút gọn cho màn chơi (chữ, số, nút trợ giúp đang bật) */
    luatManChoi: luatManChoi(luat, tinhNang, thongSo.cauThuong),
  };
}
