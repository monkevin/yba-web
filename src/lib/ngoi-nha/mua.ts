import { prisma } from "@/lib/prisma";
import { docCaiDat, ghiCaiDat } from "@/lib/cai-dat";
import { chuanMoc, MOC_QUA_MAC_DINH, type MocQua } from "./moc-qua";

/**
 * muaId dùng khi chưa có mùa giải đang chạy. Vẫn ghi điểm, vốn, huy hiệu vào sổ
 * cái riêng của "mùa" này để người chơi thấy tiến bộ ngay; khi Ban Điều hành mở
 * mùa giải chính thức, mọi người bắt đầu lại từ 0 trong mùa đó.
 */
export const CHOI_THU = "CHOI_THU";

export type MuaHienTai = {
  /** Mã mùa để lưu tiến độ; `CHOI_THU` khi chưa có mùa hoặc mùa chưa tới ngày */
  id: string;
  ten: string;
  batDau: Date | null;
  ketThuc: Date | null;
  /** Có ghi sổ cái không (chơi thử cũng ghi; mùa đã hết hạn thì không) */
  tinhDiem: boolean;
  trangThai: "CHOI_THU" | "SAP_MO" | "DANG_DIEN_RA" | "DA_KET_THUC";
};

/**
 * Mùa giải hiện tại. Chỉ mùa `DANG_MO` mới được xét:
 *  - chưa tới ngày bắt đầu → chơi thử, tiến độ lưu vào `CHOI_THU`
 *  - đang trong khoảng ngày → tính điểm
 *  - đã quá ngày kết thúc → vẫn hiện kết quả mùa đó nhưng không cộng điểm nữa
 */
export async function muaHienTai(now = new Date()): Promise<MuaHienTai> {
  const mua = await prisma.nnMua.findFirst({
    where: { trangThai: "DANG_MO" },
    orderBy: { batDau: "desc" },
  });
  if (!mua) {
    return {
      id: CHOI_THU,
      ten: "Chơi thử",
      batDau: null,
      ketThuc: null,
      tinhDiem: true,
      trangThai: "CHOI_THU",
    };
  }
  if (now < mua.batDau) {
    return {
      id: CHOI_THU,
      ten: mua.ten,
      batDau: mua.batDau,
      ketThuc: mua.ketThuc,
      tinhDiem: true,
      trangThai: "SAP_MO",
    };
  }
  if (now > mua.ketThuc) {
    return {
      id: mua.id,
      ten: mua.ten,
      batDau: mua.batDau,
      ketThuc: mua.ketThuc,
      tinhDiem: false,
      trangThai: "DA_KET_THUC",
    };
  }
  return {
    id: mua.id,
    ten: mua.ten,
    batDau: mua.batDau,
    ketThuc: mua.ketThuc,
    tinhDiem: true,
    trangThai: "DANG_DIEN_RA",
  };
}

export type DongPhanThuong = {
  hangMuc: string;
  dieuKien: string;
  qua: string;
  soLuong: string;
  nhaDongHanh?: string;
  /** Trị giá một phần quà (VND) — chỉ để hiện; trống khi chưa có quà */
  giaTri?: number;
};

/**
 * Cơ cấu giải mặc định — Ban Điều hành chốt 15/09/2026: áo thun là quà mốc
 * tiến độ (ở `MOC_QUA_MAC_DINH`, ai đạt cũng có), còn giải mùa gói trong ĐÚNG
 * 20 phần quà (`TONG_QUA_MUA`, `npm run test:ngoinha` canh tổng này). 12 quà
 * đầu là quà THẬT anh Khang đã vận động được (15/09/2026), xếp theo trị giá
 * giảm dần từ Giải Nhất xuống; 8 suất còn lại đang vận động. Tên nhà đồng hành
 * chỉ ghi khi doanh nghiệp đã nhận lời — voucher may sơ mi chưa rõ đơn vị nên
 * để trống.
 */
export const PHAN_THUONG_MAC_DINH: DongPhanThuong[] = [
  {
    hangMuc: "Giải Nhất mùa",
    dieuKien: "Điểm Vươn tầm cao nhất",
    qua: "Voucher may Veston tại Mon Amie + cúp",
    soLuong: "01",
    nhaDongHanh: "Mon Amie",
    giaTri: 6_000_000,
  },
  {
    hangMuc: "Giải Nhì mùa",
    dieuKien: "Hạng 2",
    qua: "Gói thiết kế Decor JW",
    soLuong: "01",
    nhaDongHanh: "JW",
    giaTri: 6_000_000,
  },
  {
    hangMuc: "Giải Ba mùa",
    dieuKien: "Hạng 3",
    qua: "Gói Voice Cloud của Song Thành",
    soLuong: "01",
    nhaDongHanh: "Song Thành",
    giaTri: 5_000_000,
  },
  {
    hangMuc: "Người bắc cầu",
    dieuKien: "Vốn xã hội cao nhất mùa",
    qua: "Đêm nghỉ tại Royal Suites",
    soLuong: "01",
    nhaDongHanh: "Royal Suites",
    giaTri: 5_000_000,
  },
  {
    hangMuc: "Người học không ngừng",
    dieuKien: "Vốn tri thức cao nhất mùa",
    qua: "Gói chụp ảnh Hayes",
    soLuong: "01",
    nhaDongHanh: "Hayes",
    giaTri: 3_000_000,
  },
  {
    hangMuc: "Chiến binh bền bỉ",
    dieuKien: "Vốn cá nhân cao nhất mùa",
    qua: "Chai rượu Tumoroong",
    soLuong: "01",
    nhaDongHanh: "Tumoroong",
    giaTri: 1_500_000,
  },
  {
    hangMuc: "Nhà giao thương",
    dieuKien: "Vốn tài sản cao nhất mùa",
    qua: "Voucher may sơ mi",
    soLuong: "01",
    giaTri: 950_000,
  },
  {
    hangMuc: "Hạng 4",
    dieuKien: "Bảng xếp hạng mùa",
    qua: "Voucher USA Pain Center",
    soLuong: "01",
    nhaDongHanh: "USA Pain Center",
    giaTri: 500_000,
  },
  {
    hangMuc: "Hạng 5",
    dieuKien: "Bảng xếp hạng mùa",
    qua: "5 thùng nước suối Sapuwa",
    soLuong: "01",
    nhaDongHanh: "Sapuwa",
    giaTri: 500_000,
  },
  {
    hangMuc: "Hạng 6",
    dieuKien: "Bảng xếp hạng mùa",
    qua: "Gối Chumy",
    soLuong: "01",
    nhaDongHanh: "Chumy",
    giaTri: 300_000,
  },
  {
    hangMuc: "Hạng 7",
    dieuKien: "Bảng xếp hạng mùa",
    qua: "Voucher San Hà",
    soLuong: "01",
    nhaDongHanh: "San Hà",
    giaTri: 200_000,
  },
  {
    hangMuc: "Hạng 8",
    dieuKien: "Bảng xếp hạng mùa",
    qua: "Áo thun Bulbal",
    soLuong: "01",
    nhaDongHanh: "Bulbal",
    giaTri: 180_000,
  },
  {
    hangMuc: "Hạng 9 – 10",
    dieuKien: "Bảng xếp hạng mùa",
    qua: "Quà khuyến khích (đang vận động)",
    soLuong: "02",
  },
  {
    hangMuc: "Bốc thăm may mắn",
    dieuKien: "Bốc thăm cuối mùa trong số người đi hết 22 trạm",
    qua: "Quà từ nhà đồng hành (đang vận động)",
    soLuong: "06",
  },
];

/** Tổng trị giá quà đã có (VND), nhân với số lượng của dòng nếu dòng ghi số. */
export function tongGiaTri(bang: DongPhanThuong[]): number {
  return bang.reduce((s, b) => {
    if (!b.giaTri) return s;
    const so = /^\d+$/.test(b.soLuong.trim()) ? parseInt(b.soLuong, 10) : 1;
    return s + b.giaTri * so;
  }, 0);
}

/** Tổng số phần quà đếm được (chỉ cộng dòng ghi số; "Mỗi người đạt" không tính). */
export function tongQua(bang: DongPhanThuong[]): number {
  return bang.reduce(
    (s, b) =>
      s + (/^\d+$/.test(b.soLuong.trim()) ? parseInt(b.soLuong, 10) : 0),
    0,
  );
}

/** Giải xếp hạng + mốc quà của một mùa. */
export type CoCauQua = { giai: DongPhanThuong[]; moc: MocQua[] };

/** Khoá SiteSetting của cơ cấu mẫu — dùng khi chơi thử và làm khuôn cho mùa tạo sau. */
export const KHOA_CO_CAU_MAU = "nn.coCauQua";

export const CO_CAU_MAC_DINH: CoCauQua = {
  giai: PHAN_THUONG_MAC_DINH,
  moc: MOC_QUA_MAC_DINH,
};

/** Làm sạch bảng giải từ form / CSDL. */
export function chuanGiai(ds: unknown): DongPhanThuong[] {
  if (!Array.isArray(ds)) return [];
  const chu = (x: unknown, dai: number) =>
    String(x ?? "")
      .trim()
      .slice(0, dai);
  return (ds as Record<string, unknown>[])
    .map((x) => {
      const giaTri = Math.round(
        Number(String(x?.giaTri ?? "").replace(/[^\d]/g, "")),
      );
      const nhaDongHanh = chu(x?.nhaDongHanh, 80);
      return {
        hangMuc: chu(x?.hangMuc, 80),
        dieuKien: chu(x?.dieuKien, 160),
        qua: chu(x?.qua, 160),
        soLuong: chu(x?.soLuong, 40),
        ...(nhaDongHanh ? { nhaDongHanh } : {}),
        ...(Number.isFinite(giaTri) && giaTri > 0 ? { giaTri } : {}),
      };
    })
    .filter((x) => x.hangMuc)
    .slice(0, 40);
}

/**
 * Đọc cơ cấu quà đã lưu. Bản cũ (trước 15/09/2026) chỉ là mảng giải → mốc lấy
 * mặc định. Trả null khi chưa lưu gì để nơi gọi tự dùng cơ cấu mẫu.
 */
export function docCoCau(json: string | null | undefined): CoCauQua | null {
  if (!json) return null;
  try {
    const x = JSON.parse(json);
    if (Array.isArray(x)) {
      // Bản 15/09 để áo thun trong bảng giải; nay áo thun là mốc quà nên bỏ dòng đó
      const tenMoc = new Set(MOC_QUA_MAC_DINH.map((m) => m.ten.toLowerCase()));
      const giai = chuanGiai(x).filter(
        (g) =>
          !(
            tenMoc.has(g.hangMuc.toLowerCase()) &&
            !/^\d+$/.test(g.soLuong.trim())
          ),
      );
      return x.length ? { giai, moc: MOC_QUA_MAC_DINH } : null;
    }
    if (x && typeof x === "object")
      return {
        giai: chuanGiai(x.giai),
        moc: Array.isArray(x.moc) ? chuanMoc(x.moc) : MOC_QUA_MAC_DINH,
      };
  } catch {
    /* hỏng thì dùng mẫu */
  }
  return null;
}

/** Cơ cấu mẫu Ban Điều hành đã lưu, chưa lưu thì dùng mặc định trong mã. */
export async function coCauMau(): Promise<CoCauQua> {
  return docCoCau(await docCaiDat(KHOA_CO_CAU_MAU)) ?? CO_CAU_MAC_DINH;
}

export async function ghiCoCauMau(c: CoCauQua): Promise<void> {
  await ghiCaiDat(
    KHOA_CO_CAU_MAU,
    JSON.stringify({ giai: chuanGiai(c.giai), moc: chuanMoc(c.moc) }),
  );
}

/**
 * Mùa người chơi đang hướng tới: mùa đang mở, nếu không có thì mùa đã tạo mà
 * chưa mở gần nhất. Dùng để báo "Mùa 1 bắt đầu ngày…" và hiện cơ cấu quà dự kiến.
 */
export async function muaDuKien() {
  const dangMo = await prisma.nnMua.findFirst({
    where: { trangThai: "DANG_MO" },
    orderBy: { batDau: "desc" },
  });
  if (dangMo) return dangMo;
  return prisma.nnMua.findFirst({
    where: { trangThai: "SAP_MO" },
    orderBy: { batDau: "asc" },
  });
}

/** Cơ cấu quà đang áp dụng cho người chơi (mùa đang mở / sắp mở, không có thì cơ cấu mẫu). */
export async function coCauHienTai(): Promise<{
  coCau: CoCauQua;
  mua: Awaited<ReturnType<typeof muaDuKien>>;
}> {
  const mua = await muaDuKien();
  const cua = mua ? docCoCau(mua.phanThuong) : null;
  return { coCau: cua ?? (await coCauMau()), mua };
}
