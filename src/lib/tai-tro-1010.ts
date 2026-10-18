import { docCaiDat } from "@/lib/cai-dat";

/**
 * Danh sách NHÀ TÀI TRỢ chính thức của Lễ chuyển giao 10/10 — hiện trong
 * khung tri ân trên landing /1010 (Chủ nhiệm chốt 24/09).
 *
 * BTC sửa ở /quan-tri/su-kien-1010 (ô "Nhà tài trợ & đối tác đồng hành"),
 * lưu SiteSetting khoá `sk1010.nhaTaiTro` dạng CHỮ THƯỜNG dễ dán từ sheet:
 *   1/ Tên gói (mức tài trợ)
 *   + Tên đơn vị
 *   + Tên đơn vị khác
 * KHÔNG tự đồng bộ máy từ tab "THEO DÕI TÀI TRỢ" của Google Sheet: tab đó
 * chứa số tiền thoả thuận + ghi chú nội bộ ("cần trừ tiền…"), để máy đọc là
 * dễ đưa nhầm thông tin đàm phán ra công khai.
 */

export const KHOA_NHA_TAI_TRO = "sk1010.nhaTaiTro";

/** Bản chốt 24/09/2026 của Chủ nhiệm — dùng khi BTC chưa lưu bản riêng. */
export const NHA_TAI_TRO_MAC_DINH = `1/ Nhà tài trợ Chính (100 triệu đồng)
+ Công ty Cổ phần VES

2/ Nhà tài trợ Kim Cương (50 triệu đồng)
+ Mon Amie Group
+ Khoáng sản KSB

3/ Nhà tài trợ Vàng (30 triệu đồng)
+ Công ty Công nghệ Song Thành — VoiceCloud
+ Công Ty TNHH JW Wedding & Event Academy Vietnam
+ Chị Bùi Thị Kim Ngân
+ Công ty Luật TNHH Luật sư Mến & Cộng sự
+ Tập đoàn Tân Đông Hiệp
+ Công ty Cổ phần Tim Corp
+ Công ty TNHH Chu My
+ Công ty Cổ phần Sâm Ngọc Linh Tu Mơ Rông Kon Tum
+ Công ty TNHH Thanh Trung Phát
+ Công Ty Cổ Phần Tập Đoàn Untra Group

4/ Nhà tài trợ Bạc (20 triệu đồng)
+ Công Ty Cổ Phần Xây Dựng Trung Hậu

5/ Nhà tài trợ Đồng (10 triệu đồng)
+ Công ty TNHH Triển Lãm Sự Kiện & Vận Tải BEX
+ Công ty TNHH Xây Dựng & TM Diệp Gia
+ Công ty CP SX TM DV Mỹ Thuật Tân Việt
+ Công ty TNHH TM Thời Trang Khang Gia Hưng
+ Công ty TNHH Yến Sào Khang
+ Công ty Lữ Hành Famtrip Global
+ YBA Dĩ An

6/ Nhà tài trợ Đồng hành (5 triệu đồng)
+ YBA Sài Gòn
+ Charge Point
+ Công ty Kim Cát

7/ Nhà tài trợ địa điểm
+ Capella Gallery Hall

8/ Tài trợ hiện vật / tặng phẩm
+ Menas Group (10 triệu tiền quà tặng)`;

export type GoiTaiTro = { ten: string; donVi: string[] };

/** Tách văn bản gói tài trợ thành cấu trúc hiển thị. */
export function tachNhaTaiTro(van: string): GoiTaiTro[] {
  const ds: GoiTaiTro[] = [];
  for (const dongTho of van.split(/\r?\n/)) {
    const dong = dongTho.trim();
    if (!dong) continue;
    const goi = dong.match(/^\d+\s*\/\s*(.+)$/);
    if (goi) {
      ds.push({ ten: goi[1].trim(), donVi: [] });
      continue;
    }
    const dv = dong.match(/^\+\s*(.+)$/);
    if (dv && ds.length > 0) {
      ds[ds.length - 1].donVi.push(dv[1].trim().replace(/\.$/, ""));
    }
  }
  return ds.filter((g) => g.donVi.length > 0);
}

export async function docNhaTaiTro1010(): Promise<{
  van: string;
  goi: GoiTaiTro[];
}> {
  const van = (await docCaiDat(KHOA_NHA_TAI_TRO)) || NHA_TAI_TRO_MAC_DINH;
  return { van, goi: tachNhaTaiTro(van) };
}
