/** Nhãn các loại điểm hoạt động — file thuần để cả server action lẫn
 *  client component import (file "use server" chỉ được export hàm async). */
export const LOAI_DIEM: Record<string, string> = {
  TAI_TRO: "Tài trợ (1 triệu = 1 điểm)",
  GIOI_THIEU: "Giới thiệu hội viên mới",
  DONG_GOP: "Đóng góp / vai trò Ban Tổ chức",
  THAM_GIA: "Tham gia hoạt động",
  KHAC: "Khác",
};
