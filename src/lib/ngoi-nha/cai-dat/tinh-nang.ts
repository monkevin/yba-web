/**
 * Bật / tắt từng tính năng game (SiteSetting `nn.tinhNang`). File THUẦN.
 *
 * Tắt một tính năng phải chặn ở MÁY CHỦ (hàm trong `src/lib/ngoi-nha/` hoặc
 * server action) chứ không chỉ ẩn nút. Trận / lượt đang dở vẫn cho chơi nốt.
 */
import { bat, chu } from "./chuan";

export type TinhNang = {
  /** Tạm dừng cả game: người chơi chỉ thấy thông báo, mọi thao tác bị chặn */
  tamDung: boolean;
  thongBaoTamDung: string;
  laBai: boolean;
  thuThachNgay: boolean;
  dauTruong: boolean;
  dauTri: boolean;
  nhiemVu: boolean;
  theCoHoi: boolean;
  troGiup5050: boolean;
  troGiupHoi: boolean;
  troGiupGio: boolean;
  /** Công tắc con của câu thưởng (công tắc chính vẫn là `nn.thongSo.cauThuong`) */
  cauThuongHoiVien: boolean;
  cauThuongChiaSe: boolean;
  bxhTuan: boolean;
  bxhVon: boolean;
  /** Nút "Thách" trên bảng xếp hạng */
  nutThach: boolean;
  /** Hướng dẫn 3 bước cho người mới vào game */
  huongDan: boolean;
};

export const TINH_NANG_MAC_DINH: TinhNang = {
  tamDung: false,
  thongBaoTamDung:
    "Ngôi nhà Chợ Lớn đang bảo trì ít phút. Anh/chị quay lại sau nhé!",
  laBai: true,
  thuThachNgay: true,
  dauTruong: true,
  dauTri: true,
  nhiemVu: true,
  theCoHoi: true,
  troGiup5050: true,
  troGiupHoi: true,
  troGiupGio: true,
  cauThuongHoiVien: true,
  cauThuongChiaSe: true,
  bxhTuan: true,
  bxhVon: true,
  nutThach: true,
  huongDan: true,
};

/** Mô tả cho form quản trị: bật thì người chơi thấy gì, tắt thì mất gì. */
export const MO_TA_TINH_NANG: Record<
  Exclude<keyof TinhNang, "thongBaoTamDung">,
  { ten: string; nhom: string; tat: string }
> = {
  tamDung: {
    ten: "Tạm dừng toàn bộ game",
    nhom: "Chung",
    tat: "Bật công tắc này thì người chơi chỉ thấy thông báo bảo trì, không chơi được gì.",
  },
  laBai: {
    ten: "Lá bài mỗi ngày",
    nhom: "Hằng ngày",
    tat: "Tắt thì ẩn ô Lá bài hôm nay, không lật được lá mới.",
  },
  thuThachNgay: {
    ten: "Thử thách hằng ngày",
    nhom: "Hằng ngày",
    tat: "Tắt thì ẩn thẻ Thử thách hôm nay, không bắt đầu được lượt mới.",
  },
  dauTruong: {
    ten: "Đấu trường 1-1",
    nhom: "So tài",
    tat: "Tắt thì không tạo được trận mới; trận đang dở vẫn chơi nốt.",
  },
  dauTri: {
    ten: "Đấu trí sự kiện",
    nhom: "So tài",
    tat: "Tắt thì người chơi không vào được phiên Đấu trí.",
  },
  nhiemVu: {
    ten: "Nhiệm vụ Huynh đệ",
    nhom: "Ngoài đời",
    tat: "Tắt thì không gửi được nhiệm vụ mới, không tự ghi nhận nhiệm vụ.",
  },
  theCoHoi: {
    ten: "Thẻ Cơ hội sau khi qua trạm",
    nhom: "Hành trình",
    tat: "Tắt thì qua trạm không rút Thẻ Cơ hội nữa.",
  },
  troGiup5050: {
    ten: "Trợ giúp 50:50",
    nhom: "Hành trình",
    tat: "Tắt thì ẩn nút 50:50 trong màn chơi.",
  },
  troGiupHoi: {
    ten: "Trợ giúp Hỏi Huynh đệ",
    nhom: "Hành trình",
    tat: "Tắt thì ẩn nút Hỏi Huynh đệ.",
  },
  troGiupGio: {
    ten: "Trợ giúp thêm giờ",
    nhom: "Hành trình",
    tat: "Tắt thì ẩn nút thêm giây.",
  },
  cauThuongHoiVien: {
    ten: "Câu thưởng về hội viên thật",
    nhom: "Hành trình",
    tat: "Tắt thì câu thưởng cuối lượt không hỏi về hội viên (chỉ còn câu chia sẻ nếu bật).",
  },
  cauThuongChiaSe: {
    ten: "Câu thưởng chia sẻ về mình",
    nhom: "Hành trình",
    tat: "Tắt thì câu thưởng cuối lượt không hỏi câu chia sẻ.",
  },
  bxhTuan: {
    ten: "Bảng xếp hạng tuần",
    nhom: "Bảng xếp hạng",
    tat: "Tắt thì ẩn tab Tuần này.",
  },
  bxhVon: {
    ten: "Bảng xếp hạng theo 4 vốn",
    nhom: "Bảng xếp hạng",
    tat: "Tắt thì ẩn 4 tab vốn.",
  },
  nutThach: {
    ten: "Nút Thách trên bảng xếp hạng",
    nhom: "Bảng xếp hạng",
    tat: "Tắt thì ẩn nút Thách cạnh tên người chơi.",
  },
  huongDan: {
    ten: "Hướng dẫn cho người mới",
    nhom: "Chung",
    tat: "Tắt thì người mới vào game không thấy 3 bước hướng dẫn.",
  },
};

export function chuanTinhNang(x: unknown): TinhNang {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const m = TINH_NANG_MAC_DINH;
  const kq = { ...m };
  for (const k of Object.keys(m) as (keyof TinhNang)[]) {
    if (k === "thongBaoTamDung") continue;
    (kq as Record<string, unknown>)[k] = bat(o[k], m[k] as boolean);
  }
  kq.thongBaoTamDung = chu(o.thongBaoTamDung, 300, m.thongBaoTamDung);
  return kq;
}
