/**
 * Chấm độ phù hợp giữa một tin chợ nhu cầu và doanh nghiệp đang xem
 * (mục 3 trong đặc tả — "AI Matching").
 *
 * KHÔNG bịa số. Điểm tính từ dữ liệu có thật trong hồ sơ hai bên, và chỉ
 * hiện ra khi đủ cơ sở — thà không hiện còn hơn hiện "phù hợp 92%" mà
 * người xem mở ra thấy chẳng liên quan gì, lần sau họ hết tin.
 *
 * File thuần, không đụng CSDL, để kiểm thử được và client dùng lại được.
 */

const boDau = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

/** Từ quá phổ biến, khớp được cũng chẳng nói lên điều gì. */
const TU_BO = new Set([
  "cong", "ty", "tnhh", "co", "phan", "va", "cac", "loai", "dich", "vu",
  "san", "pham", "cung", "cap", "kinh", "doanh", "thuong", "mai", "san xuat",
  "cho", "tim", "can", "nha", "doi", "tac", "chat", "luong", "gia", "re",
]);

const tachTu = (s: string) =>
  new Set(
    boDau(s)
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 4 && !TU_BO.has(t))
  );

export type BenXem = {
  categoryId?: string | null;
  district?: string | null;
  offering?: string | null;
  services?: string | null;
  needing?: string | null;
  toiGiupGi?: string | null;
  toiCanGi?: string | null;
};

export type TinDang = {
  type: string;
  categoryId?: string | null;
  title: string;
  summary?: string | null;
  description?: string | null;
  memberDistrict?: string | null;
};

/**
 * Trả về 0–100, kèm lý do để hiện cho người xem biết vì sao được gợi ý.
 * Dưới `NGUONG` thì coi như không đủ cơ sở, màn hình không hiện huy hiệu.
 */
export const NGUONG_PHU_HOP = 50;

export function doPhuHop(tin: TinDang, toi: BenXem): { diem: number; lyDo: string[] } {
  const lyDo: string[] = [];
  let diem = 0;

  // 1. Cùng ngành nghề — tín hiệu mạnh nhất
  if (tin.categoryId && toi.categoryId && tin.categoryId === toi.categoryId) {
    diem += 55;
    lyDo.push("Cùng ngành nghề với doanh nghiệp của anh/chị");
  }

  const chuTin = tachTu(
    [tin.title, tin.summary ?? "", tin.description ?? ""].join(" ")
  );

  // 2. Tin CẦN MUA khớp thứ mình BÁN → mình là người bán tiềm năng
  if (tin.type === "CAN_MUA") {
    const chuToiBan = tachTu([toi.offering ?? "", toi.services ?? "", toi.toiGiupGi ?? ""].join(" "));
    const trung = [...chuToiBan].filter((t) => chuTin.has(t));
    if (trung.length) {
      diem += Math.min(35, 14 + trung.length * 7);
      lyDo.push(`Khớp với sản phẩm / dịch vụ anh/chị cung cấp (${trung.slice(0, 3).join(", ")})`);
    }
  }

  // 3. Tin CẦN BÁN khớp thứ mình đang TÌM MUA → mình là người mua tiềm năng
  if (tin.type === "CAN_BAN") {
    const chuToiCan = tachTu([toi.needing ?? "", toi.toiCanGi ?? ""].join(" "));
    const trung = [...chuToiCan].filter((t) => chuTin.has(t));
    if (trung.length) {
      diem += Math.min(35, 14 + trung.length * 7);
      lyDo.push(`Khớp với nhu cầu anh/chị đang tìm (${trung.slice(0, 3).join(", ")})`);
    }
  }

  // 4. Cùng khu vực — thuận tiện gặp nhau, nhưng chỉ là điểm cộng nhỏ
  if (tin.memberDistrict && toi.district && tin.memberDistrict === toi.district) {
    diem += 10;
    lyDo.push("Cùng khu vực");
  }

  return { diem: Math.min(100, diem), lyDo };
}
