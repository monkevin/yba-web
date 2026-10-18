/**
 * Kiểu dữ liệu trao đổi giữa máy chủ và màn chơi của game "Ngôi nhà Chợ Lớn".
 * Chỉ có `type` — client component import thoải mái, không kéo theo đáp án.
 */
import type { CheDo, LoaiCau, MaVon, TroGiup, Von } from "./luat";

/** Câu hỏi đã bỏ đáp án, phương án đã xáo. */
export type CauHienThi = {
  id: string;
  loai: LoaiCau | "chia-se";
  hoi: string;
  von: MaVon;
  /** Câu thưởng cuối lượt: về hội viên thật hoặc chia sẻ về mình */
  thuong?: "HOI_VIEN" | "CHIA_SE";
  /** Trắc nghiệm, tình huống */
  phuongAn?: string[];
  /** Sắp xếp — các mục đã xáo */
  muc?: string[];
  /** Ghép cặp — cột trái giữ nguyên, cột phải đã xáo */
  trai?: string[];
  phai?: string[];
};

export type TrangThaiCau = {
  luotId: string;
  cheDo: CheDo;
  tramMa: string;
  viTri: number;
  /** Số câu chính (không tính câu thưởng) */
  tong: number;
  cau: CauHienThi;
  conLaiMs: number;
  gioiHanMs: number;
  troGiupDaDung: TroGiup[];
  diem: number;
  soDung: number;
  chuoi: number;
  heSo: number;
};

/** Đáp án người chơi gửi lên. `null` = hết giờ. */
export type DapAnGui =
  | { chon: number }
  | { dung: boolean }
  | { thuTu: number[] }
  | { cap: number[] }
  | null;

export type HuyHieuMoi = { ma: string; ten: string; diem: number };

export type KetQuaLuot = {
  luotId: string;
  cheDo: CheDo;
  tramMa: string;
  soDung: number;
  tong: number;
  sao: number;
  daQua: boolean;
  laLanDauQua: boolean;
  diem: number;
  /** Điểm thật sự cộng vào bảng xếp hạng (phần vượt kỷ lục cũ) */
  diemGhiNhan: number;
  kyLucMoi: boolean;
  /** Vốn thật sự cộng thêm */
  von: Von;
  theSuuTam: { ten: string; noiDung: string } | null;
  coTheCoHoi: boolean;
  huyHieuMoi: HuyHieuMoi[];
  thuongChuoiNgay?: number;
  chuoiNgay?: number;
  tramTiep: { ma: string; ten: string } | null;
  luotTinhDiemConLai: number;
  /** Mùa giải đang tính điểm lúc kết thúc lượt */
  tinhDiem: boolean;
  /** Lượt chơi thử (chưa có mùa giải) */
  choiThu: boolean;
  /** Kết quả câu thưởng cuối lượt */
  thuong: { loai: "HOI_VIEN" | "CHIA_SE"; dung: boolean; diem: number } | null;
  /** Lên danh hiệu mới nhờ lượt này */
  lenHang: { ten: string; y: string } | null;
  /** Lượt của một phiên Đấu trí sự kiện */
  dauTriId?: string;
};

export type PhanHoi = {
  dung: boolean;
  hetGio: boolean;
  diem: number;
  chiTiet: {
    goc: number;
    tocDo: number;
    chuoi: number;
    motPhan: number;
    heSo: number;
  };
  /** Số vị trí / cặp đúng của câu sắp xếp, ghép cặp */
  motPhan: number;
  /** Đáp án đúng theo thứ tự hiển thị trên màn hình */
  dapAnDung: {
    chon?: number;
    dung?: boolean;
    thuTu?: number[];
    cap?: number[];
  };
  giaiThich: string;
  nguon: string;
  /** Câu chia sẻ: tỉ lệ huynh đệ chọn từng phương án */
  phanTram?: number[];
  soNguoi?: number;
  /** Đường dẫn xem thêm (hồ sơ hội viên) */
  lienKet?: string;
  tongDiem: number;
  soDung: number;
  chuoi: number;
  cuoi: boolean;
  ketQua?: KetQuaLuot;
};

export type KetQuaTroGiup = {
  loai: TroGiup;
  /** Phương án bị loại (thứ tự hiển thị) */
  an?: number[];
  /** Tỉ lệ huynh đệ đã chọn theo thứ tự hiển thị; câu Đúng/Sai: [Đúng, Sai] */
  phanTram?: number[];
  soNguoi?: number;
  goiY?: string;
  conLaiMs?: number;
  gioiHanMs?: number;
  /** Không dùng được ở câu này — quyền trợ giúp được giữ lại */
  hoanLai?: boolean;
};

export type TheCoHoiHienThi = {
  luotId: string;
  ma: string;
  ten: string;
  tinhHuong: string;
  lua: string[];
};

export type KetQuaTheCoHoi = {
  von: Partial<Von>;
  /** Vốn có được ghi vào mùa giải không (chơi thử / mùa đã kết thúc thì không) */
  ghiNhan: boolean;
  giai: string;
  chon: string;
  khonNgoan: boolean;
  huyHieuMoi: HuyHieuMoi[];
};

/**
 * Luật rút gọn cho màn chơi (chữ, số hiển thị, nút trợ giúp đang bật) — trang
 * máy chủ dựng bằng `luatManChoi()` từ cài đặt game rồi truyền xuống client.
 * Chỉ để HIỂN THỊ: mọi luật thật vẫn chấm ở máy chủ.
 */
export type LuatManChoi = {
  heSoThuThach: number;
  /** Số câu đúng (trên 10) để vượt trạm thường / Trạm Thử thách */
  canDeQua: number;
  canDeQuaThuThach: number;
  chuoiTu3: number;
  chuoiTu5: number;
  giayThem: number;
  thuThachSoCau: number;
  thuongMoiNgay: number;
  thuongToiDa: number;
  /** Quyền trợ giúp đang bật */
  troGiup: TroGiup[];
  /** Loại câu thưởng có thể xuất hiện cuối lượt; rỗng = không có câu thưởng */
  cauThuong: ("HOI_VIEN" | "CHIA_SE")[];
  diemThuong: Record<"HOI_VIEN" | "CHIA_SE", number>;
  giayThuong: Record<"HOI_VIEN" | "CHIA_SE", number>;
  /** Huy hiệu Hoàn hảo còn bật không (chữ ăn mừng chuỗi 10) */
  hoanHao: boolean;
};

/** Người đang chơi — lấy từ tài khoản đăng nhập ở server action. */
export type NguoiChoi = { userId: string; memberId: string | null };

export type KetQuaAction<T> =
  { ok: true; data: T } | { ok: false; loi: string; ma?: string };
