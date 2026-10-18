/**
 * Cấu hình ghi nhận Nhiệm vụ Huynh đệ (file THUẦN): cách xác nhận, kỳ giới hạn,
 * số lần tối đa. Ban Điều hành sửa được số lần / kỳ / điểm ở quản trị (bản sửa
 * lưu `nn.nhiemVu`, xem `cai-dat/noi-dung-sua.ts`); nguồn tự động giữ trong code.
 */
import type { KyGioiHan } from "./thoi-gian";

export type NguonTuDong =
  | "CHECKIN"
  | "DEAL_BAN"
  | "DEAL_MUA"
  | "DEAL_GIOI_THIEU"
  | "HO_SO"
  | "BAN_TO_CHUC"
  | "LOI_CHUC";

export type CauHinhNhiemVu = {
  tuDong?: NguonTuDong;
  thuCong?: "HOI_VIEN" | "BAN_DUYET";
  ky: KyGioiHan | null;
  /** 0 = không giới hạn */
  toiDa: number;
  canAnh?: boolean;
  goiY?: string;
};

export const CAU_HINH_NV: Record<string, CauHinhNhiemVu> = {
  NV01: {
    tuDong: "CHECKIN",
    thuCong: "BAN_DUYET",
    ky: null,
    toiDa: 0,
    goiY: "Tên sự kiện, ngày tham dự",
  },
  NV02: {
    tuDong: "CHECKIN",
    thuCong: "BAN_DUYET",
    ky: "THANG",
    toiDa: 4,
    goiY: "Ngày dự Coffee Connect, người chủ trì buổi",
  },
  NV03: {
    tuDong: "DEAL_GIOI_THIEU",
    thuCong: "HOI_VIEN",
    ky: "THANG",
    toiDa: 3,
    goiY: "Bạn giới thiệu ai cho hội viên này, để làm việc gì",
  },
  NV04: { tuDong: "DEAL_BAN", ky: "THANG", toiDa: 5 },
  NV05: {
    thuCong: "BAN_DUYET",
    ky: null,
    toiDa: 0,
    goiY: "Chia sẻ ở buổi nào, chủ đề gì",
  },
  NV06: {
    tuDong: "CHECKIN",
    thuCong: "BAN_DUYET",
    ky: "THANG",
    toiDa: 4,
    goiY: "Hoạt động thể thao nào, ngày nào",
  },
  NV07: {
    tuDong: "CHECKIN",
    thuCong: "BAN_DUYET",
    ky: null,
    toiDa: 0,
    goiY: "Thăm doanh nghiệp nào, ngày nào",
  },
  NV08: {
    thuCong: "BAN_DUYET",
    ky: null,
    toiDa: 0,
    goiY: "Tên doanh nhân mới, doanh nghiệp và ngày kết nạp",
  },
  NV09: { tuDong: "HO_SO", ky: "MUA", toiDa: 1 },
  NV10: {
    thuCong: "BAN_DUYET",
    ky: "THANG",
    toiDa: 2,
    goiY: "Món quà nào: một kinh nghiệm, một nguồn lực, một cơ hội hay nhận một việc chung",
  },
  NV11: {
    tuDong: "CHECKIN",
    thuCong: "BAN_DUYET",
    ky: null,
    toiDa: 0,
    goiY: "Hoạt động cộng đồng nào, ngày nào",
  },
  NV12: {
    tuDong: "BAN_TO_CHUC",
    thuCong: "BAN_DUYET",
    ky: null,
    toiDa: 0,
    goiY: "Chương trình nào, đầu việc bạn đã nhận",
  },
  NV13: { tuDong: "DEAL_MUA", ky: "THANG", toiDa: 5 },
  NV14: {
    thuCong: "HOI_VIEN",
    ky: "THANG",
    toiDa: 5,
    goiY: "Bạn đã giới thiệu khách hàng / đối tác nào đến hội viên này",
  },
  NV15: {
    thuCong: "BAN_DUYET",
    ky: "TUAN",
    toiDa: 3,
    canAnh: true,
    goiY: "Dán đường dẫn bài fanpage và gửi ảnh chụp bình luận của bạn",
  },
  NV16: { tuDong: "LOI_CHUC", ky: "NGAY", toiDa: 1 },
};

export const TEN_KY: Record<KyGioiHan, string> = {
  NGAY: "hôm nay",
  TUAN: "tuần này",
  THANG: "tháng này",
  MUA: "mùa này",
};
