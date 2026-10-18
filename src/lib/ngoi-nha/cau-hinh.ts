/**
 * Thông số game Ban Điều hành chỉnh ở /quan-tri/ngoi-nha?tab=cai-dat — CHỈ MÁY
 * CHỦ. Lưu trong `SiteSetting` (khoá `nn.thongSo`), chưa lưu thì dùng mặc định
 * trong `moc-qua.ts`.
 *
 * SQLite chạy một kết nối (`connection_limit=1`): gọi `docThongSo()` TRƯỚC khi
 * mở `$transaction`, đừng gọi bên trong — trong giao dịch mà hỏi bằng `prisma`
 * là tự chờ chính mình tới hết giờ.
 */
import { docCaiDat, ghiCaiDat } from "@/lib/cai-dat";
import { chuanThongSo, type ThongSoGame } from "./moc-qua";

export const KHOA_THONG_SO = "nn.thongSo";

export async function docThongSo(): Promise<ThongSoGame> {
  const v = await docCaiDat(KHOA_THONG_SO);
  try {
    return chuanThongSo(v ? JSON.parse(v) : null);
  } catch {
    return chuanThongSo(null);
  }
}

export async function ghiThongSo(t: ThongSoGame): Promise<ThongSoGame> {
  const sach = chuanThongSo(t);
  await ghiCaiDat(KHOA_THONG_SO, JSON.stringify(sach));
  return sach;
}
