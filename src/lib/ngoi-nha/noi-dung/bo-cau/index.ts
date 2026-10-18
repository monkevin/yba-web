/**
 * Danh mục bộ câu hỏi thách đấu — mỗi tệp JSON là một chủ đề 10 bộ × 10 câu.
 * Thêm chủ đề mới: đặt tệp cùng cấu trúc vào thư mục này rồi khai ở đây,
 * chạy `npm run test:ngoinha` để soát (4 phương án, đáp án hợp lệ, không trùng).
 */
import type { ChuDeBoCauJson } from "../../bo-cau";
import kinhTeVietNam from "./kinh-te-viet-nam.json";
import kinhTeTheGioi from "./kinh-te-the-gioi.json";
import phapLyDoanhNghiep from "./phap-ly-doanh-nghiep.json";
import taiChinhKeToan from "./tai-chinh-ke-toan.json";
import quanTriChienLuoc from "./quan-tri-chien-luoc.json";
import marketingBanHang from "./marketing-ban-hang.json";
import nhanSuLanhDao from "./nhan-su-lanh-dao.json";
import congNgheAi from "./cong-nghe-ai.json";
import doanhNhanThuongHieu from "./doanh-nhan-thuong-hieu.json";
import vanHoaKyNang from "./van-hoa-ky-nang.json";

export const CHU_DE_JSON: ChuDeBoCauJson[] = [
  kinhTeVietNam,
  kinhTeTheGioi,
  phapLyDoanhNghiep,
  taiChinhKeToan,
  quanTriChienLuoc,
  marketingBanHang,
  nhanSuLanhDao,
  congNgheAi,
  doanhNhanThuongHieu,
  vanHoaKyNang,
] as ChuDeBoCauJson[];
